import test from "node:test";
import assert from "node:assert/strict";

import { processDrawOutcome } from "../shared/drawLogic.js";
import type { Profile } from "../src/types";

function makeProfile(
  id: string,
  overrides: Partial<Profile> = {},
): Profile & { last_weekday_recovery_at?: string | null } {
  return {
    id,
    name: `Profile ${id}`,
    class: "novato",
    level: 1,
    xp: 0,
    coins: 0,
    hp: 100,
    max_hp: 100,
    luck: 0,
    titles: [],
    passive_coin_multiplier: 1,
    temporary_coin_multiplier: 1,
    exhaustion_threshold: 0.3,
    exhaustion_penalty_multiplier: 0.5,
    inventory: [],
    active_buffs: [],
    last_weekday_recovery_at: "2026-03-17",
    participates_in_pao: true,
    participates_in_agua: true,
    participates_in_balde: true,
    participates_in_geral: true,
    stat_points: 0,
    stat_foco: 0,
    stat_resiliencia: 0,
    stat_networking: 0,
    stat_malandragem: 0,
    ...overrides,
  };
}

function getProfile(
  updates: Array<Profile & { last_weekday_recovery_at?: string | null }>,
  id: string,
) {
  const profile = updates.find((entry) => entry.id === id);
  assert.ok(profile, `profile ${id} not found`);
  return profile;
}

const weekdayNow = new Date("2026-03-18T12:00:00-03:00");
const shopItems = [
  {
    id: "auto-transfer-pao",
    name: "Seguro Catastrofe",
    effect_code: "AUTO_TRANSFER_PAO",
    metadata: { activation: "auto" },
  },
  {
    id: "auto-outsource-agua",
    name: "Boia de Emergencia",
    effect_code: "AUTO_OUTSOURCE_AGUA",
    metadata: { activation: "auto" },
  },
  {
    id: "auto-balde-shield",
    name: "Colete Anti-Balde",
    effect_code: "AUTO_BALDE_SHIELD",
    metadata: { activation: "auto", damageReduction: 12 },
  },
] as const;

test("pao aplica dano em quem nao foi sorteado e recompensa quem absorveu o evento", () => {
  const winner = makeProfile("winner");
  const other = makeProfile("other");

  const result = processDrawOutcome({
    category: "pao",
    winnerIds: ["winner"],
    participants: ["winner", "other"],
    profiles: [winner, other],
    now: weekdayNow,
  });

  const winnerUpdate = getProfile(result.updates, "winner");
  const otherUpdate = getProfile(result.updates, "other");

  assert.equal(winnerUpdate.hp, 100);
  assert.equal(winnerUpdate.xp, 0);
  assert.equal(winnerUpdate.coins, 0);
  assert.equal(otherUpdate.hp, 75);
  assert.equal(otherUpdate.xp, 22);
  assert.equal(otherUpdate.coins, 10);
});

test("agua aplica dano em quem nao foi sorteado e mantem recompensa no sorteado", () => {
  const winner = makeProfile("winner");
  const other = makeProfile("other");

  const result = processDrawOutcome({
    category: "agua",
    winnerIds: ["winner"],
    participants: ["winner", "other"],
    profiles: [winner, other],
    now: weekdayNow,
  });

  const winnerUpdate = getProfile(result.updates, "winner");
  const otherUpdate = getProfile(result.updates, "other");

  assert.equal(winnerUpdate.hp, 100);
  assert.equal(winnerUpdate.xp, 9);
  assert.equal(winnerUpdate.coins, 4);
  assert.equal(otherUpdate.hp, 92);
  assert.equal(otherUpdate.xp, 5);
});

test("boia corporativa reduz o impacto da proxima agua", () => {
  const winner = makeProfile("winner");
  const protectedProfile = makeProfile("protected", {
    active_buffs: [
      {
        type: "AGUA_SHIELD",
        expiresAt: "2099-12-31T23:59:59.999Z",
        value: 6,
      },
    ],
  });

  const result = processDrawOutcome({
    category: "agua",
    winnerIds: ["winner"],
    participants: ["winner", "protected"],
    profiles: [winner, protectedProfile],
    now: weekdayNow,
  });

  const protectedUpdate = getProfile(result.updates, "protected");
  assert.equal(protectedUpdate.hp, 98);
  assert.equal(
    protectedUpdate.active_buffs.some((buff) => buff.type === "AGUA_SHIELD"),
    false,
  );
});

test("geral da moedas para todos e dano apenas em quem nao foi sorteado", () => {
  const winner = makeProfile("winner");
  const other = makeProfile("other");

  const result = processDrawOutcome({
    category: "geral",
    winnerIds: ["winner"],
    participants: ["winner", "other"],
    profiles: [winner, other],
    now: weekdayNow,
  });

  const winnerUpdate = getProfile(result.updates, "winner");
  const otherUpdate = getProfile(result.updates, "other");

  assert.equal(winnerUpdate.hp, 100);
  assert.equal(otherUpdate.hp, 95);
  assert.equal(winnerUpdate.coins, 5);
  assert.equal(otherUpdate.coins, 5);
});

test("solo afeta apenas o perfil selecionado", () => {
  const selected = makeProfile("selected");
  const other = makeProfile("other");

  const result = processDrawOutcome({
    category: "solo",
    winnerIds: ["selected"],
    participants: ["selected"],
    profiles: [selected, other],
    now: weekdayNow,
  });

  const selectedUpdate = getProfile(result.updates, "selected");
  const otherUpdate = getProfile(result.updates, "other");

  assert.equal(selectedUpdate.hp, 100);
  assert.equal(selectedUpdate.xp, 18);
  assert.equal(selectedUpdate.coins, 11);
  assert.equal(otherUpdate.hp, 100);
  assert.equal(otherUpdate.xp, 0);
  assert.equal(otherUpdate.coins, 0);
});

test("xp cresce moderadamente com a quantidade de participantes no sorteio", () => {
  const winnerThree = makeProfile("winner-three");
  const otherThreeA = makeProfile("other-three-a");
  const otherThreeB = makeProfile("other-three-b");

  const resultThree = processDrawOutcome({
    category: "agua",
    winnerIds: ["winner-three"],
    participants: ["winner-three", "other-three-a", "other-three-b"],
    profiles: [winnerThree, otherThreeA, otherThreeB],
    now: weekdayNow,
  });

  const winnerFive = makeProfile("winner-five");
  const otherFiveA = makeProfile("other-five-a");
  const otherFiveB = makeProfile("other-five-b");
  const otherFiveC = makeProfile("other-five-c");
  const otherFiveD = makeProfile("other-five-d");

  const resultFive = processDrawOutcome({
    category: "agua",
    winnerIds: ["winner-five"],
    participants: [
      "winner-five",
      "other-five-a",
      "other-five-b",
      "other-five-c",
      "other-five-d",
    ],
    profiles: [winnerFive, otherFiveA, otherFiveB, otherFiveC, otherFiveD],
    now: weekdayNow,
  });

  const winnerThreeUpdate = getProfile(resultThree.updates, "winner-three");
  const winnerFiveUpdate = getProfile(resultFive.updates, "winner-five");
  const otherThreeUpdate = getProfile(resultThree.updates, "other-three-a");
  const otherFiveUpdate = getProfile(resultFive.updates, "other-five-a");

  assert.equal(winnerThreeUpdate.xp, 14);
  assert.equal(winnerFiveUpdate.xp, 22);
  assert.equal(otherThreeUpdate.xp, 9);
  assert.equal(otherFiveUpdate.xp, 18);
});

test("geral usa o mesmo bonus de participantes dos outros sorteios coletivos", () => {
  const winner = makeProfile("winner");
  const otherA = makeProfile("other-a");
  const otherB = makeProfile("other-b");
  const otherC = makeProfile("other-c");
  const otherD = makeProfile("other-d");

  const result = processDrawOutcome({
    category: "geral",
    winnerIds: ["winner"],
    participants: ["winner", "other-a", "other-b", "other-c", "other-d"],
    profiles: [winner, otherA, otherB, otherC, otherD],
    now: weekdayNow,
  });

  const winnerUpdate = getProfile(result.updates, "winner");
  const otherUpdate = getProfile(result.updates, "other-a");

  assert.equal(winnerUpdate.xp, 14);
  assert.equal(otherUpdate.xp, 14);
  assert.equal(winnerUpdate.coins, 5);
  assert.equal(otherUpdate.coins, 5);
});

test("solo nao conta como participacao oficial no desafio diario", () => {
  const selected = makeProfile("selected");

  const result = processDrawOutcome({
    category: "solo",
    winnerIds: ["selected"],
    participants: ["selected"],
    profiles: [selected],
    now: new Date("2026-03-23T12:00:00-03:00"),
    enableDailyChallenges: true,
  });

  const selectedReward = result.rewards.find(
    (reward) => reward.profileId === "selected",
  );
  assert.ok(selectedReward, "selected reward not found");
  assert.equal(selectedReward.xpGain, 18);
  assert.equal(selectedReward.coinGain, 11);
  assert.equal(
    selectedReward.xpBreakdown.some((entry) =>
      entry.label.includes("Desafio Diario: Bater O Ponto"),
    ),
    false,
  );
});

test("historico registra ganhos de xp e moedas por perfil no sorteio", () => {
  const winner = makeProfile("winner");
  const other = makeProfile("other");

  const result = processDrawOutcome({
    category: "balde",
    winnerIds: ["winner"],
    participants: ["winner", "other"],
    profiles: [winner, other],
    now: weekdayNow,
  });

  const winnerRewardLog = result.logs.find(
    (log) =>
      log.event_type === "draw_result" && log.primary_actor_id === "winner",
  );
  const otherRewardLog = result.logs.find(
    (log) =>
      log.event_type === "draw_rewards" && log.primary_actor_id === "other",
  );

  assert.ok(winnerRewardLog, "winner reward log not found");
  assert.ok(otherRewardLog, "other reward log not found");
  assert.deepEqual(winnerRewardLog.metadata?.xpGain, 33);
  assert.deepEqual(winnerRewardLog.metadata?.coinGain, 15);
  assert.match(
    winnerRewardLog.message,
    /Sorteado para BALDE e recebeu \+33 XP e \+15 \$C/,
  );
  assert.deepEqual(otherRewardLog.metadata?.xpGain, 11);
  assert.deepEqual(otherRewardLog.metadata?.coinGain, 0);
  assert.match(otherRewardLog.message, /\+11 XP no BALDE/);
});

test("fura olho rouba a recompensa base do sorteado no balde", () => {
  const winner = makeProfile("winner");
  const thief = makeProfile("thief", {
    active_buffs: [
      {
        type: "FURA_OLHO",
        expiresAt: "2099-12-31T23:59:59.999Z",
      },
    ],
  });

  const result = processDrawOutcome({
    category: "balde",
    winnerIds: ["winner"],
    participants: ["winner", "thief"],
    profiles: [winner, thief],
    now: weekdayNow,
  });

  const winnerUpdate = getProfile(result.updates, "winner");
  const thiefUpdate = getProfile(result.updates, "thief");

  assert.equal(winnerUpdate.xp, 0);
  assert.equal(winnerUpdate.coins, 0);
  assert.equal(thiefUpdate.xp, 44);
  assert.equal(thiefUpdate.coins, 15);
  assert.match(
    result.logs.find(
      (log) =>
        log.primary_actor_id === "thief" && log.event_type === "item_use",
    )?.message ?? "",
    /Fura Olho e roubou a recompensa de Profile winner/,
  );
});

test("atributos aplicam foco, networking e malandragem no sorteio", () => {
  const dodger = makeProfile("dodger", {
    stat_malandragem: 100,
  });
  const fallback = makeProfile("fallback", {
    stat_foco: 4,
    stat_networking: 40,
  });

  const result = processDrawOutcome({
    category: "agua",
    winnerIds: ["dodger"],
    participants: ["dodger", "fallback"],
    profiles: [dodger, fallback],
    now: weekdayNow,
    randomChance: () => true,
    randomIndex: () => 0,
  });

  assert.deepEqual(result.winnerIds, ["fallback"]);

  const fallbackUpdate = getProfile(result.updates, "fallback");
  const dodgerUpdate = getProfile(result.updates, "dodger");

  assert.equal(fallbackUpdate.hp, 100);
  assert.equal(fallbackUpdate.xp, 11);
  assert.equal(fallbackUpdate.coins, 4);
  assert.equal(dodgerUpdate.hp, 92);
  assert.equal(dodgerUpdate.xp, 5);
});

test("status mogado reduz malandragem efetiva e pode impedir esquiva", () => {
  const mogadoDodger = makeProfile("mogado", {
    stat_malandragem: 25,
    active_buffs: [
      {
        type: "MOGADO",
        expiresAt: "2099-12-31T23:59:59.999Z",
        metadata: { targetStat: "stat_malandragem", amount: 15 },
      },
    ],
  });
  const fallback = makeProfile("fallback");

  const result = processDrawOutcome({
    category: "agua",
    winnerIds: ["mogado"],
    participants: ["mogado", "fallback"],
    profiles: [mogadoDodger, fallback],
    now: weekdayNow,
    randomChance: (chance) => chance >= 0.1,
    randomIndex: () => 0,
  });

  assert.deepEqual(result.winnerIds, ["mogado"]);
  const fallbackUpdate = getProfile(result.updates, "fallback");
  assert.equal(fallbackUpdate.hp, 92);
});

test("guerreiro reduz dano e exaustao reduz moedas", () => {
  const warrior = makeProfile("warrior", {
    class: "guerreiro",
    hp: 20,
    exhaustion_threshold: 0.3,
    exhaustion_penalty_multiplier: 0.5,
  });
  const other = makeProfile("other");

  const result = processDrawOutcome({
    category: "balde",
    winnerIds: ["warrior"],
    participants: ["warrior", "other"],
    profiles: [warrior, other],
    now: weekdayNow,
  });

  const warriorUpdate = getProfile(result.updates, "warrior");
  const otherUpdate = getProfile(result.updates, "other");

  assert.equal(warriorUpdate.hp, 22);
  assert.equal(warriorUpdate.coins, 7);
  assert.equal(warriorUpdate.xp, 35);
  assert.equal(otherUpdate.hp, 82);
  assert.equal(otherUpdate.xp, 11);
});

test("transferencia de pao envia o sorteio para outro participante aleatorio e registra o substituto", () => {
  const owner = makeProfile("owner", {
    active_buffs: [
      {
        type: "TRANSFER_PAO",
        expiresAt: "2099-12-31T23:59:59.999Z",
      },
    ],
  });
  const targetA = makeProfile("target-a");
  const targetB = makeProfile("target-b");

  const result = processDrawOutcome({
    category: "pao",
    winnerIds: ["owner"],
    participants: ["owner", "target-a", "target-b"],
    profiles: [owner, targetA, targetB],
    now: weekdayNow,
    randomIndex: () => 1,
  });

  assert.deepEqual(result.winnerIds, ["target-b"]);
  assert.match(
    result.logs.find((log) => log.primary_actor_id === "owner")?.message ?? "",
    /transferiu o Pao de Queijo para Profile target-b/,
  );
});

test("terceirizacao de agua envia o sorteio para outro participante aleatorio e registra o substituto", () => {
  const owner = makeProfile("owner", {
    active_buffs: [
      {
        type: "OUTSOURCE_AGUA",
        expiresAt: "2099-12-31T23:59:59.999Z",
      },
    ],
  });
  const targetA = makeProfile("target-a");
  const targetB = makeProfile("target-b");

  const result = processDrawOutcome({
    category: "agua",
    winnerIds: ["owner"],
    participants: ["owner", "target-a", "target-b"],
    profiles: [owner, targetA, targetB],
    now: weekdayNow,
    randomIndex: () => 0,
  });

  assert.deepEqual(result.winnerIds, ["target-a"]);
  assert.match(
    result.logs.find((log) => log.primary_actor_id === "owner")?.message ?? "",
    /terceirizou a Agua para Profile target-a/,
  );
});

test("seguro de pao automatico consome inventario e transfere para outro participante", () => {
  const owner = makeProfile("owner", {
    inventory: [{ item_id: "auto-transfer-pao", qty: 1 }],
  });
  const target = makeProfile("target");

  const result = processDrawOutcome({
    category: "pao",
    winnerIds: ["owner"],
    participants: ["owner", "target"],
    profiles: [owner, target],
    shopItems: [...shopItems],
    now: weekdayNow,
    randomIndex: () => 0,
  });

  const ownerUpdate = getProfile(result.updates, "owner");
  assert.deepEqual(result.winnerIds, ["target"]);
  assert.deepEqual(ownerUpdate.inventory, []);
  assert.match(
    result.logs.find((log) => log.primary_actor_id === "owner")?.message ?? "",
    /Seguro Catastrofe/,
  );
});

test("boia de emergencia automatica consome inventario e terceiriza a agua", () => {
  const owner = makeProfile("owner", {
    inventory: [{ item_id: "auto-outsource-agua", qty: 1 }],
  });
  const target = makeProfile("target");

  const result = processDrawOutcome({
    category: "agua",
    winnerIds: ["owner"],
    participants: ["owner", "target"],
    profiles: [owner, target],
    shopItems: [...shopItems],
    now: weekdayNow,
    randomIndex: () => 0,
  });

  const ownerUpdate = getProfile(result.updates, "owner");
  assert.deepEqual(result.winnerIds, ["target"]);
  assert.deepEqual(ownerUpdate.inventory, []);
});

test("colete anti-balde automatico reduz dano e consome inventario", () => {
  const winner = makeProfile("winner");
  const protectedProfile = makeProfile("protected", {
    inventory: [{ item_id: "auto-balde-shield", qty: 1 }],
  });

  const result = processDrawOutcome({
    category: "balde",
    winnerIds: ["winner"],
    participants: ["winner", "protected"],
    profiles: [winner, protectedProfile],
    shopItems: [...shopItems],
    now: weekdayNow,
  });

  const protectedUpdate = getProfile(result.updates, "protected");
  assert.equal(protectedUpdate.hp, 94);
  assert.deepEqual(protectedUpdate.inventory, []);
});

test("recuperacao diaria usa 10% do HP atual para todos os perfis", () => {
  const recovering = makeProfile("recovering", {
    hp: 50,
    last_weekday_recovery_at: "2026-03-17",
  });
  const capped = makeProfile("capped", {
    hp: 96,
    last_weekday_recovery_at: "2026-03-17",
  });
  const fullHp = makeProfile("full", {
    hp: 100,
    last_weekday_recovery_at: "2026-03-17",
  });

  const result = processDrawOutcome({
    category: "geral",
    winnerIds: ["recovering"],
    participants: ["recovering", "capped", "full"],
    profiles: [recovering, capped, fullHp],
    now: weekdayNow,
  });

  const recoveringUpdate = getProfile(result.updates, "recovering");
  const cappedUpdate = getProfile(result.updates, "capped");
  const fullHpUpdate = getProfile(result.updates, "full");

  assert.equal(recoveringUpdate.hp, 55);
  assert.equal(cappedUpdate.hp, 95);
  assert.equal(fullHpUpdate.hp, 95);
  assert.equal(
    result.logs.filter((log) => log.event_type === "passive_recovery").length,
    3,
  );
  assert.match(
    result.logs.find((log) => log.primary_actor_id === "full")?.message ?? "",
    /recuperou 0 HP/,
  );
});
