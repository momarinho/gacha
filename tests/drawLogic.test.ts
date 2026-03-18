import test from "node:test";
import assert from "node:assert/strict";

import { processDrawOutcome } from "../api/drawLogic";
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
  assert.equal(winnerUpdate.xp, 11);
  assert.equal(winnerUpdate.coins, 5);
  assert.equal(otherUpdate.hp, 92);
  assert.equal(otherUpdate.xp, 6);
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
  assert.equal(selectedUpdate.xp, 14);
  assert.equal(selectedUpdate.coins, 8);
  assert.equal(otherUpdate.hp, 100);
  assert.equal(otherUpdate.xp, 0);
  assert.equal(otherUpdate.coins, 0);
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
  assert.equal(fallbackUpdate.xp, 14);
  assert.equal(fallbackUpdate.coins, 6);
  assert.equal(dodgerUpdate.hp, 92);
  assert.equal(dodgerUpdate.xp, 6);
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
