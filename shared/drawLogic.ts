import {
  applyDailyChallengeEvent,
  type DailyChallengeState,
  getBusinessDateKey,
} from "./dailyChallenges.js";

type ProfileClass =
  | "novato"
  | "aprendiz_guerreiro"
  | "aprendiz_mago"
  | "aprendiz_ladino"
  | "aprendiz_clerigo"
  | "guerreiro"
  | "mago"
  | "ladino"
  | "clerigo";

type InventoryItem = {
  item_id: string;
  qty: number;
};

type ShopItemRecord = {
  id: string;
  name: string;
  effect_code: string;
  metadata?: Record<string, unknown>;
};

type ActiveBuff = {
  type: string;
  expiresAt: string;
  value?: number;
  metadata?: Record<string, unknown>;
};

type Profile = {
  id: string;
  name: string;
  class: ProfileClass;
  level: number;
  xp: number;
  coins: number;
  hp: number;
  max_hp: number;
  luck: number;
  titles: string[];
  passive_coin_multiplier: number;
  temporary_coin_multiplier: number;
  exhaustion_threshold: number;
  exhaustion_penalty_multiplier: number;
  inventory: InventoryItem[];
  active_buffs: ActiveBuff[];
  daily_challenge_state?: DailyChallengeState | null;
  last_weekday_recovery_at?: string | null;
  participates_in_pao: boolean;
  participates_in_agua: boolean;
  participates_in_balde: boolean;
  participates_in_geral: boolean;
  stat_points: number;
  stat_foco: number;
  stat_resiliencia: number;
  stat_networking: number;
  stat_malandragem: number;
  created_at?: string;
};

type DrawCategory = "pao" | "agua" | "balde" | "geral" | "solo";

type RewardBreakdownItem = {
  label: string;
  value: number;
};

type DrawRewardSummary = {
  profileId: string;
  profileName: string;
  category: DrawCategory;
  isWinner: boolean;
  xpGain: number;
  coinGain: number;
  xpBreakdown: RewardBreakdownItem[];
  coinBreakdown: RewardBreakdownItem[];
};

type BattleLogInsert = {
  event_type: string;
  category: string;
  message: string;
  primary_actor_id: string;
  metadata?: Record<string, unknown>;
};

type DrawProfile = Profile & {
  last_weekday_recovery_at?: string | null;
};

type ProcessDrawInput = {
  category: DrawCategory;
  winnerIds: string[];
  participants: string[];
  profiles: DrawProfile[];
  shopItems?: ShopItemRecord[];
  enableDailyChallenges?: boolean;
  now?: Date;
  randomChance?: (chance: number) => boolean;
  randomIndex?: (max: number) => number;
};

type ProcessDrawResult = {
  updates: DrawProfile[];
  logs: BattleLogInsert[];
  rewards: DrawRewardSummary[];
  winnerIds: string[];
};

type MogadoTargetStat =
  | "stat_foco"
  | "stat_networking"
  | "stat_malandragem"
  | "luck";

const BUSINESS_TIMEZONE = "America/Sao_Paulo";
const LADINO_DODGE_BASE = 0.05;
const MAX_DODGE_CHANCE = 0.35;
const DEFAULT_RELIEF_LUCK_BONUS = 0.1;
const GUERREIRO_PASSIVE_XP = 5;
const CLERIGO_GROUP_COINS = 3;
const COIN_MAGNET_MULTIPLIER = 1.5;
const NOVATO_XP_MULTIPLIER = 1.1;
const PAO_HP_LOSS = 25;
const AGUA_HP_LOSS = 8;
const BALDE_HP_LOSS = 18;
const GERAL_HP_LOSS = 5;
const SOLO_HP_LOSS = 3;
const COLLECTIVE_BASE_XP = 10;
const SOLO_XP_GAIN = 10;
const SOLO_COIN_GAIN = 8;
const SOLO_XP_BONUS = 6;
const SOLO_COIN_BONUS = 3;
const LEVEL_UP_COIN_REWARD = 20;
const WEEKDAY_PASSIVE_RECOVERY_RATIO = 0.1;

function getParticipantCountXpBonus(
  category: DrawCategory,
  participantCount: number,
) {
  if (category === "solo") return 0;

  const extraParticipants = Math.max(0, participantCount - 2);
  if (extraParticipants === 0) return 0;

  const cappedExtraParticipants = Math.min(extraParticipants, 6);
  return cappedExtraParticipants * 4;
}

function getWinnerBaseReward(category: DrawCategory) {
  switch (category) {
    case "agua":
      return { xp: COLLECTIVE_BASE_XP, coins: 4 };
    case "balde":
      return { xp: COLLECTIVE_BASE_XP, coins: 15 };
    case "geral":
      return { xp: COLLECTIVE_BASE_XP, coins: 5 };
    case "solo":
      return { xp: SOLO_XP_GAIN, coins: SOLO_COIN_GAIN };
    default:
      return { xp: 0, coins: 0 };
  }
}

function getXpRequiredForLevel(level: number) {
  return 100 + Math.max(0, level - 1) * 25;
}

function getBusinessDayState(now = new Date()) {
  const dateKey = getBusinessDateKey(now, BUSINESS_TIMEZONE);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIMEZONE,
    weekday: "short",
  }).format(now);

  return {
    dateKey,
    isWeekday: weekday !== "Sat" && weekday !== "Sun",
  };
}

function normalizeBuffs(buffs: unknown): ActiveBuff[] {
  if (!Array.isArray(buffs)) return [];

  return buffs.filter(
    (buff): buff is ActiveBuff =>
      !!buff &&
      typeof buff === "object" &&
      typeof (buff as ActiveBuff).type === "string" &&
      typeof (buff as ActiveBuff).expiresAt === "string",
  );
}

function purgeExpiredBuffs(buffs: ActiveBuff[], now = Date.now()) {
  return buffs.filter((buff) => new Date(buff.expiresAt).getTime() > now);
}

function getBuffValue(buffs: ActiveBuff[], type: string) {
  return buffs
    .filter((buff) => buff.type === type)
    .reduce((sum, buff) => sum + (buff.value ?? 0), 0);
}

function hasBuff(buffs: ActiveBuff[], type: string) {
  return buffs.some((buff) => buff.type === type);
}

function getMogadoDebuffValue(
  buffs: ActiveBuff[],
  targetStat: MogadoTargetStat,
) {
  return buffs.reduce((sum, buff) => {
    if (
      buff.type !== "MOGADO" ||
      !buff.metadata ||
      typeof buff.metadata !== "object"
    ) {
      return sum;
    }
    const metadata = buff.metadata as Record<string, unknown>;
    if (metadata.targetStat !== targetStat) return sum;
    const amount = metadata.amount;
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
      return sum;
    }
    return sum + amount;
  }, 0);
}

function normalizeTitles(titles: unknown) {
  if (!Array.isArray(titles)) return [];
  return titles.filter((title): title is string => typeof title === "string");
}

function formatRewardMessage(
  profileName: string,
  category: DrawCategory,
  xpGain: number,
  coinGain: number,
) {
  const rewardSummary = formatRewardSummary(xpGain, coinGain);
  return `${profileName} recebeu ${rewardSummary} no ${category.toUpperCase()}`;
}

function formatRewardSummary(xpGain: number, coinGain: number) {
  const gains: string[] = [];
  if (xpGain > 0) gains.push(`+${xpGain} XP`);
  if (coinGain > 0) gains.push(`+${coinGain} $C`);
  return gains.join(" e ");
}

function resolveCoinMultipliers(
  buffs: ActiveBuff[],
  passiveMultiplier: number,
  fallbackTemporaryMultiplier: number,
) {
  const normalizedPassive =
    typeof passiveMultiplier === "number" && passiveMultiplier > 0
      ? passiveMultiplier
      : 1;
  const activeCoinMagnetMultiplier = hasBuff(buffs, "COIN_MAGNET")
    ? getBuffValue(buffs, "COIN_MAGNET") || COIN_MAGNET_MULTIPLIER
    : 1;
  const normalizedTemporary =
    typeof fallbackTemporaryMultiplier === "number" &&
    fallbackTemporaryMultiplier > 0
      ? fallbackTemporaryMultiplier
      : 1;

  return {
    passive: normalizedPassive,
    temporary:
      activeCoinMagnetMultiplier > 1
        ? activeCoinMagnetMultiplier
        : normalizedTemporary > 1
          ? normalizedTemporary
          : 1,
  };
}

function getDodgeChance(
  profileClass: ProfileClass,
  luck: number,
  buffs: ActiveBuff[],
  statMalandragem = 0,
) {
  const normalizedLuck =
    typeof luck === "number" && Number.isFinite(luck) ? Math.max(0, luck) : 0;
  const reliefLuckBonus = getBuffValue(buffs, "RELIEF_LUCK");
  const malandragemStat =
    typeof statMalandragem === "number"
      ? Math.max(0, statMalandragem) * 0.004
      : 0;

  if (profileClass === "ladino") {
    return Math.min(
      MAX_DODGE_CHANCE,
      LADINO_DODGE_BASE + normalizedLuck + reliefLuckBonus + malandragemStat,
    );
  }

  return Math.min(MAX_DODGE_CHANCE, malandragemStat);
}

export function processDrawOutcome({
  category,
  winnerIds,
  participants,
  profiles,
  shopItems = [],
  enableDailyChallenges = false,
  now = new Date(),
  randomChance = () => false,
  randomIndex = (max) => (max <= 0 ? 0 : 0),
}: ProcessDrawInput): ProcessDrawResult {
  const participantSet = new Set<string>(participants);
  const participantProfiles = profiles.filter((profile) =>
    participantSet.has(profile.id),
  );
  const participantCountXpBonus = getParticipantCountXpBonus(
    category,
    participantProfiles.length,
  );
  const profileMap = new Map<string, DrawProfile>(
    profiles.map((profile) => [profile.id, profile]),
  );
  const resolvedWinnerIds = [...winnerIds];
  const consumedBuffsByProfile = new Map<string, Set<string>>();
  const profileInventoryMap = new Map<string, InventoryItem[]>(
    profiles.map((profile) => [
      profile.id,
      Array.isArray(profile.inventory)
        ? profile.inventory.map((entry) => ({ ...entry }))
        : [],
    ]),
  );
  const shopItemById = new Map(shopItems.map((item) => [item.id, item]));
  const updates: DrawProfile[] = [];
  const logs: BattleLogInsert[] = [];
  const rewards: DrawRewardSummary[] = [];
  const { dateKey: weekdayRecoveryKey, isWeekday: isWeekdayForRecovery } =
    getBusinessDayState(now);
  const dailyChallengeDateKey = getBusinessDateKey(now, BUSINESS_TIMEZONE);
  const furaOlhoAssignments = new Map<string, string>();

  const consumeBuff = (profileId: string, buffType: string) => {
    if (!consumedBuffsByProfile.has(profileId)) {
      consumedBuffsByProfile.set(profileId, new Set());
    }
    consumedBuffsByProfile.get(profileId)!.add(buffType);
  };

  const getAutoInventoryItem = (profileId: string, effectCode: string) => {
    const inventory = profileInventoryMap.get(profileId) || [];
    for (const inventoryEntry of inventory) {
      const item = shopItemById.get(inventoryEntry.item_id);
      if (!item || item.effect_code !== effectCode || inventoryEntry.qty <= 0) {
        continue;
      }
      return { inventoryEntry, item };
    }
    return null;
  };

  const consumeInventoryItem = (profileId: string, itemId: string) => {
    const inventory = profileInventoryMap.get(profileId) || [];
    const inventoryIndex = inventory.findIndex(
      (entry) => entry.item_id === itemId,
    );
    if (inventoryIndex === -1) return;
    inventory[inventoryIndex].qty = (inventory[inventoryIndex].qty ?? 1) - 1;
    if (inventory[inventoryIndex].qty <= 0) {
      inventory.splice(inventoryIndex, 1);
    }
  };

  const pickReplacementWinner = (currentWinnerId: string) => {
    const rerollPool = participantProfiles.filter(
      (profile) =>
        profile.id !== currentWinnerId &&
        !resolvedWinnerIds.includes(profile.id),
    );

    if (rerollPool.length === 0) return null;
    return rerollPool[randomIndex(rerollPool.length)];
  };

  for (let index = 0; index < resolvedWinnerIds.length; index++) {
    const requestedWinnerId = resolvedWinnerIds[index];
    const requestedWinner = profileMap.get(requestedWinnerId);
    if (!requestedWinner) continue;

    const activeBuffs = purgeExpiredBuffs(
      normalizeBuffs(requestedWinner.active_buffs),
      now.getTime(),
    );
    let shouldReroll = false;

    if (category === "balde" && hasBuff(activeBuffs, "SKIP_BALDE")) {
      shouldReroll = true;
      consumeBuff(requestedWinner.id, "SKIP_BALDE");
      logs.push({
        event_type: "item_use",
        category,
        message: `${requestedWinner.name} usou Relatorio Falso e escapou do Balde`,
        primary_actor_id: requestedWinner.id,
      });
    }

    if (["pao", "agua", "balde"].includes(category)) {
      const effectiveWinnerLuck = Math.max(
        0,
        requestedWinner.luck - getMogadoDebuffValue(activeBuffs, "luck"),
      );
      const effectiveWinnerMalandragem = Math.max(
        0,
        (requestedWinner.stat_malandragem || 0) -
          getMogadoDebuffValue(activeBuffs, "stat_malandragem"),
      );
      const dodgeChance = getDodgeChance(
        requestedWinner.class,
        effectiveWinnerLuck,
        activeBuffs,
        effectiveWinnerMalandragem,
      );

      if (dodgeChance > 0 && randomChance(dodgeChance)) {
        shouldReroll = true;
        logs.push({
          event_type: "class_passive",
          category,
          message: `${requestedWinner.name} ativou Passo Leve e escapou do sorteio`,
          primary_actor_id: requestedWinner.id,
        });
      }
    }

    if (category === "agua" && hasBuff(activeBuffs, "OUTSOURCE_AGUA")) {
      consumeBuff(requestedWinner.id, "OUTSOURCE_AGUA");
      const replacementWinner = pickReplacementWinner(requestedWinner.id);

      if (replacementWinner) {
        resolvedWinnerIds[index] = replacementWinner.id;
        logs.push({
          event_type: "item_use",
          category,
          message: `${requestedWinner.name} terceirizou a Agua para ${replacementWinner.name}`,
          primary_actor_id: requestedWinner.id,
          metadata: {
            redirectedToProfileId: replacementWinner.id,
            redirectedToProfileName: replacementWinner.name,
          },
        });
        continue;
      }
    }

    if (category === "agua") {
      const emergencyFloat = getAutoInventoryItem(
        requestedWinner.id,
        "AUTO_OUTSOURCE_AGUA",
      );
      if (emergencyFloat) {
        const replacementWinner = pickReplacementWinner(requestedWinner.id);
        if (replacementWinner) {
          consumeInventoryItem(requestedWinner.id, emergencyFloat.item.id);
          resolvedWinnerIds[index] = replacementWinner.id;
          logs.push({
            event_type: "item_use",
            category,
            message: `${requestedWinner.name} ativou ${emergencyFloat.item.name} e terceirizou a Agua para ${replacementWinner.name}`,
            primary_actor_id: requestedWinner.id,
            metadata: {
              itemId: emergencyFloat.item.id,
              redirectedToProfileId: replacementWinner.id,
              redirectedToProfileName: replacementWinner.name,
            },
          });
          continue;
        }
      }
    }

    if (category === "pao" && hasBuff(activeBuffs, "TRANSFER_PAO")) {
      consumeBuff(requestedWinner.id, "TRANSFER_PAO");
      const replacementWinner = pickReplacementWinner(requestedWinner.id);

      if (replacementWinner) {
        resolvedWinnerIds[index] = replacementWinner.id;
        logs.push({
          event_type: "item_use",
          category,
          message: `${requestedWinner.name} transferiu o Pao de Queijo para ${replacementWinner.name}`,
          primary_actor_id: requestedWinner.id,
          metadata: {
            redirectedToProfileId: replacementWinner.id,
            redirectedToProfileName: replacementWinner.name,
          },
        });
        continue;
      }
    }

    if (category === "pao") {
      const catastropheInsurance = getAutoInventoryItem(
        requestedWinner.id,
        "AUTO_TRANSFER_PAO",
      );
      if (catastropheInsurance) {
        const replacementWinner = pickReplacementWinner(requestedWinner.id);
        if (replacementWinner) {
          consumeInventoryItem(
            requestedWinner.id,
            catastropheInsurance.item.id,
          );
          resolvedWinnerIds[index] = replacementWinner.id;
          logs.push({
            event_type: "item_use",
            category,
            message: `${requestedWinner.name} ativou ${catastropheInsurance.item.name} e transferiu o Pao de Queijo para ${replacementWinner.name}`,
            primary_actor_id: requestedWinner.id,
            metadata: {
              itemId: catastropheInsurance.item.id,
              redirectedToProfileId: replacementWinner.id,
              redirectedToProfileName: replacementWinner.name,
            },
          });
          continue;
        }
      }
    }

    if (!shouldReroll) continue;
    const replacementWinner = pickReplacementWinner(requestedWinner.id);
    if (!replacementWinner) continue;
    resolvedWinnerIds[index] = replacementWinner.id;
  }

  if (category !== "pao" && category !== "solo") {
    const eligibleThieves = participantProfiles
      .filter((profile) => !resolvedWinnerIds.includes(profile.id))
      .filter((profile) =>
        hasBuff(
          purgeExpiredBuffs(
            normalizeBuffs(profile.active_buffs),
            now.getTime(),
          ),
          "FURA_OLHO",
        ),
      );

    for (const winnerId of resolvedWinnerIds) {
      const winnerReward = getWinnerBaseReward(category);
      if (winnerReward.xp <= 0 && winnerReward.coins <= 0) continue;
      const thief = eligibleThieves.shift();
      if (!thief) break;
      furaOlhoAssignments.set(winnerId, thief.id);
      consumeBuff(thief.id, "FURA_OLHO");
      const winner = profileMap.get(winnerId);
      if (winner) {
        logs.push({
          event_type: "item_use",
          category,
          message: `${thief.name} ativou Fura Olho e roubou a recompensa de ${winner.name}`,
          primary_actor_id: thief.id,
          metadata: {
            redirectedFromProfileId: winner.id,
            redirectedFromProfileName: winner.name,
          },
        });
      }
    }
  }

  const clericWinnerIds = resolvedWinnerIds.filter((id) => {
    const profile = profileMap.get(id);
    return profile?.class === "clerigo";
  });

  for (const p of profiles) {
    const isParticipant = participantSet.has(p.id);
    const isWinner = resolvedWinnerIds.includes(p.id);
    let hpChange = 0;
    let xpChange = 0;
    let coinsChange = 0;
    let activeBuffs = purgeExpiredBuffs(
      normalizeBuffs(p.active_buffs),
      now.getTime(),
    );
    let inventory = profileInventoryMap.get(p.id) || [];
    let titles = normalizeTitles(p.titles);
    const xpBreakdown: RewardBreakdownItem[] = [];
    const coinBreakdown: RewardBreakdownItem[] = [];
    const effectiveFoco = Math.max(
      0,
      (p.stat_foco || 0) - getMogadoDebuffValue(activeBuffs, "stat_foco"),
    );
    const effectiveNetworking = Math.max(
      0,
      (p.stat_networking || 0) -
        getMogadoDebuffValue(activeBuffs, "stat_networking"),
    );
    const focoBonus = effectiveFoco * 0.5;

    const addXp = (label: string, value: number) => {
      if (value === 0) return;
      const adjustedValue =
        value > 0 && !label.includes("Passiva") && !label.includes("Novato")
          ? value + focoBonus
          : value;
      xpChange += adjustedValue;
      xpBreakdown.push({ label, value: adjustedValue });
    };

    const addCoins = (label: string, value: number) => {
      if (value === 0) return;
      coinsChange += value;
      coinBreakdown.push({ label, value });
    };

    const luck = typeof p.luck === "number" ? p.luck : 0;
    const exhaustionThreshold =
      typeof p.exhaustion_threshold === "number" ? p.exhaustion_threshold : 0.3;
    const exhaustionPenaltyMultiplier =
      typeof p.exhaustion_penalty_multiplier === "number"
        ? p.exhaustion_penalty_multiplier
        : 0.5;
    const lastWeekdayRecoveryAt =
      typeof p.last_weekday_recovery_at === "string"
        ? p.last_weekday_recovery_at
        : null;

    if (category === "balde") {
      activeBuffs = activeBuffs.filter((buff) => buff.type !== "SKIP_BALDE");
    }

    const consumedBuffs = consumedBuffsByProfile.get(p.id);
    if (consumedBuffs) {
      activeBuffs = activeBuffs.filter((buff) => !consumedBuffs.has(buff.type));
    }

    const recoveryPerDraw = getBuffValue(activeBuffs, "POST_PAO_RECOVERY");
    let newHp = Math.min(p.max_hp, p.hp + recoveryPerDraw);

    if (
      isWeekdayForRecovery &&
      lastWeekdayRecoveryAt !== weekdayRecoveryKey &&
      p.max_hp > 0
    ) {
      const passiveRecovery = Math.max(
        1,
        Math.ceil(newHp * WEEKDAY_PASSIVE_RECOVERY_RATIO),
      );
      const recoveredHp = Math.max(
        0,
        Math.min(p.max_hp, newHp + passiveRecovery) - newHp,
      );
      newHp = Math.min(p.max_hp, newHp + passiveRecovery);

      logs.push({
        event_type: "passive_recovery",
        category: "system",
        message: `${p.name} recuperou ${recoveredHp} HP da passiva diaria`,
        primary_actor_id: p.id,
      });
    }

    if (newHp >= p.max_hp) {
      activeBuffs = activeBuffs.filter(
        (buff) => buff.type !== "POST_PAO_RECOVERY",
      );
    }

    const networkingBonus = effectiveNetworking * 0.003;
    const {
      passive: passiveCoinMultiplier,
      temporary: temporaryCoinMultiplier,
    } = resolveCoinMultipliers(
      activeBuffs,
      p.passive_coin_multiplier + networkingBonus,
      p.temporary_coin_multiplier,
    );

    if (p.class === "guerreiro") {
      addXp("Passiva de classe (Guerreiro)", GUERREIRO_PASSIVE_XP);
    }

    if (isParticipant) {
      const addCollectiveXp = () => {
        if (category === "solo") return;
        addXp(
          `Base do sorteio (${category.toUpperCase()})`,
          COLLECTIVE_BASE_XP,
        );
        if (participantCountXpBonus > 0) {
          addXp(
            `Bonus de participantes (${participantProfiles.length})`,
            participantCountXpBonus,
          );
        }
      };

      if (category === "pao") {
        addCollectiveXp();
        if (!isWinner) {
          hpChange = -PAO_HP_LOSS;
          addCoins("Base do sorteio (PAO)", 10);
          activeBuffs.push({
            type: "RELIEF_LUCK",
            expiresAt: new Date(
              now.getTime() + 6 * 60 * 60 * 1000,
            ).toISOString(),
            value: DEFAULT_RELIEF_LUCK_BONUS,
          });
        }
      } else if (category === "agua") {
        addCollectiveXp();
        if (isWinner) {
          if (!furaOlhoAssignments.has(p.id)) {
            addCoins("Base do sorteio (AGUA) - sorteado", 4);
          }
        } else {
          const aguaShield = getBuffValue(activeBuffs, "AGUA_SHIELD");
          hpChange = -Math.max(0, AGUA_HP_LOSS - aguaShield);
          if (aguaShield > 0) {
            consumeBuff(p.id, "AGUA_SHIELD");
            addXp("Boia Corporativa", 2);
          }
          if (
            resolvedWinnerIds.some(
              (winnerId) => furaOlhoAssignments.get(winnerId) === p.id,
            )
          ) {
            const stolenReward = getWinnerBaseReward(category);
            addXp("Fura Olho", stolenReward.xp);
            addCoins("Fura Olho", stolenReward.coins);
          }
        }
      } else if (category === "balde") {
        addCollectiveXp();
        if (isWinner) {
          if (!furaOlhoAssignments.has(p.id)) {
            addCoins("Base do sorteio (BALDE) - sorteado", 15);
          }
        } else {
          const antiBucketVest = getAutoInventoryItem(
            p.id,
            "AUTO_BALDE_SHIELD",
          );
          if (antiBucketVest) {
            const damageReduction =
              typeof antiBucketVest.item.metadata?.damageReduction === "number"
                ? Number(antiBucketVest.item.metadata.damageReduction)
                : 10;
            hpChange = -Math.max(0, BALDE_HP_LOSS - damageReduction);
            consumeInventoryItem(p.id, antiBucketVest.item.id);
            inventory = profileInventoryMap.get(p.id) || [];
            addXp("Colete Anti-Balde", 2);
            logs.push({
              event_type: "item_use",
              category,
              message: `${p.name} ativou ${antiBucketVest.item.name} e reduziu o impacto do Balde`,
              primary_actor_id: p.id,
              metadata: { itemId: antiBucketVest.item.id },
            });
          } else {
            hpChange = -BALDE_HP_LOSS;
          }
          if (
            resolvedWinnerIds.some(
              (winnerId) => furaOlhoAssignments.get(winnerId) === p.id,
            )
          ) {
            const stolenReward = getWinnerBaseReward(category);
            addXp("Fura Olho", stolenReward.xp);
            addCoins("Fura Olho", stolenReward.coins);
          }
        }
      } else if (category === "geral") {
        addCollectiveXp();
        if (!isWinner) {
          hpChange = -GERAL_HP_LOSS;
          if (
            resolvedWinnerIds.some(
              (winnerId) => furaOlhoAssignments.get(winnerId) === p.id,
            )
          ) {
            const stolenReward = getWinnerBaseReward(category);
            addCoins("Fura Olho", stolenReward.coins);
          }
        }
        if (!isWinner || !furaOlhoAssignments.has(p.id)) {
          addCoins("Base do sorteio (GERAL)", 5);
        }
      } else if (category === "solo") {
        if (isWinner) {
          addXp("Base do sorteio (SOLO)", SOLO_XP_GAIN);
          addCoins("Base do sorteio (SOLO)", SOLO_COIN_GAIN);
          addXp("Bonus do modo Solo", SOLO_XP_BONUS);
          addCoins("Bonus do modo Solo", SOLO_COIN_BONUS);
          const soloXpBonus = getBuffValue(activeBuffs, "SOLO_XP_BONUS");
          const soloCoinBonus = getBuffValue(activeBuffs, "SOLO_COIN_BONUS");
          if (soloXpBonus > 0) {
            addXp("Vale Hora Extra", soloXpBonus);
            consumeBuff(p.id, "SOLO_XP_BONUS");
          }
          if (soloCoinBonus > 0) {
            addCoins("Vale Hora Extra", soloCoinBonus);
            consumeBuff(p.id, "SOLO_COIN_BONUS");
          }
        } else {
          hpChange = -SOLO_HP_LOSS;
        }
      }
    }

    if (p.class === "novato" && xpChange > 0) {
      const previousXpChange = xpChange;
      xpChange = Math.ceil(xpChange * NOVATO_XP_MULTIPLIER);
      const novatoBonus = xpChange - previousXpChange;
      if (novatoBonus !== 0) {
        xpBreakdown.push({
          label: "Bonus de classe (Novato +10% XP)",
          value: novatoBonus,
        });
      }
    }

    if (
      (p.class === "ladino" || p.class === "aprendiz_ladino") &&
      isParticipant &&
      !isWinner &&
      coinsChange > 0
    ) {
      const previousCoinsChange = coinsChange;
      const classMultiplier = p.class === "ladino" ? 1.15 : 1.05;
      coinsChange = Math.floor(coinsChange * classMultiplier);
      const ladinoBonus = coinsChange - previousCoinsChange;
      if (ladinoBonus !== 0) {
        coinBreakdown.push({
          label: `Bonus de classe (${p.class === "ladino" ? "Ladino x1.15" : "Aprendiz Ladino x1.05"})`,
          value: ladinoBonus,
        });
      }
    }

    if (
      (p.class === "guerreiro" || p.class === "aprendiz_guerreiro") &&
      hpChange < 0
    ) {
      hpChange = Math.floor(hpChange * (p.class === "guerreiro" ? 0.6 : 0.8));
    }

    if (clericWinnerIds.length > 0 && isParticipant && !isWinner) {
      addCoins(
        `Aura de Comunhao (${clericWinnerIds.length} Clerigo(s))`,
        clericWinnerIds.length * CLERIGO_GROUP_COINS,
      );
    }

    if (coinsChange > 0) {
      const previousCoinsChange = coinsChange;
      coinsChange = Math.floor(
        coinsChange * passiveCoinMultiplier * temporaryCoinMultiplier,
      );
      const multiplierDelta = coinsChange - previousCoinsChange;
      if (multiplierDelta !== 0) {
        coinBreakdown.push({
          label: `Multiplicadores de moedas (x${(passiveCoinMultiplier * temporaryCoinMultiplier).toFixed(2)})`,
          value: multiplierDelta,
        });
      }
    }

    const exhausted = p.max_hp > 0 && p.hp / p.max_hp <= exhaustionThreshold;
    if (exhausted && coinsChange > 0) {
      const previousCoinsChange = coinsChange;
      coinsChange = Math.max(
        0,
        Math.floor(coinsChange * exhaustionPenaltyMultiplier),
      );
      const exhaustionDelta = coinsChange - previousCoinsChange;
      if (exhaustionDelta !== 0) {
        coinBreakdown.push({
          label: `Penalidade por exaustao (x${exhaustionPenaltyMultiplier.toFixed(2)})`,
          value: exhaustionDelta,
        });
      }
    }

    newHp = Math.min(p.max_hp, Math.max(0, newHp + hpChange));

    let dailyChallengeState = p.daily_challenge_state ?? null;
    if (enableDailyChallenges) {
      const dailyChallengeEvents = [];

      if (isParticipant && category !== "solo") {
        dailyChallengeEvents.push({ type: "official_participation" as const });
      }
      if (category === "solo") {
        dailyChallengeEvents.push({
          type: "solo_completion" as const,
          value: isWinner ? 1 : 0,
        });
      }
      if (coinsChange > 0) {
        dailyChallengeEvents.push({
          type: "earn_20_coins" as const,
          value: coinsChange,
        });
      }
      if (
        ["pao", "agua", "balde"].includes(category) &&
        isParticipant &&
        newHp > 0
      ) {
        dailyChallengeEvents.push({ type: "survive_risky_draw" as const });
      }
      for (const event of dailyChallengeEvents) {
        const challengeResult = applyDailyChallengeEvent(
          dailyChallengeState,
          dailyChallengeDateKey,
          event,
          now,
        );
        dailyChallengeState = challengeResult.state;
        if (challengeResult.newlyCompleted) {
          xpChange += challengeResult.state.rewardXp;
          coinsChange += challengeResult.state.rewardCoins;
          xpBreakdown.push({
            label: `Desafio Diario: ${challengeResult.state.title}`,
            value: challengeResult.state.rewardXp,
          });
          coinBreakdown.push({
            label: `Desafio Diario: ${challengeResult.state.title}`,
            value: challengeResult.state.rewardCoins,
          });
          logs.push({
            event_type: "daily_challenge",
            category: "system",
            message: `${p.name} concluiu o desafio diario ${challengeResult.state.title}`,
            primary_actor_id: p.id,
            metadata: {
              challengeId: challengeResult.state.challengeId,
              dateKey: challengeResult.state.dateKey,
            },
          });
        }
      }
    }

    if (category === "pao" && isWinner) {
      activeBuffs.push({
        type: "POST_PAO_RECOVERY",
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        value:
          p.class === "clerigo" ? 10 : p.class === "aprendiz_clerigo" ? 8 : 5,
      });
    }

    const finalConsumedBuffs = consumedBuffsByProfile.get(p.id);
    if (finalConsumedBuffs) {
      activeBuffs = activeBuffs.filter(
        (buff) => !finalConsumedBuffs.has(buff.type),
      );
    }

    let newXp = p.xp + xpChange;
    let newCoins = p.coins + coinsChange;
    let newLevel = p.level;
    let newStatPoints = p.stat_points || 0;

    while (newXp >= getXpRequiredForLevel(newLevel)) {
      newXp -= getXpRequiredForLevel(newLevel);
      newLevel++;
      newStatPoints += 3;
      newHp = p.max_hp;
      coinsChange += LEVEL_UP_COIN_REWARD;
      newCoins += LEVEL_UP_COIN_REWARD;
      coinBreakdown.push({
        label: `Bonus por subir para o LV.${newLevel}`,
        value: LEVEL_UP_COIN_REWARD,
      });
      logs.push({
        event_type: "level_up",
        category: "system",
        message: `Subiu para o nivel ${newLevel} e ganhou ${LEVEL_UP_COIN_REWARD} SetorCoins!`,
        primary_actor_id: p.id,
      });
    }

    if (category === "pao" && isWinner) {
      titles = Array.from(new Set([...titles, "Mestre do Pão"]));
    }
    if (category === "balde" && isWinner) {
      titles = Array.from(new Set([...titles, "Sobrevivente do Balde"]));
    }
    if (p.level < 5 && newLevel >= 5) {
      titles = Array.from(new Set([...titles, "Lenda do Setor"]));
    }
    if (p.coins < 100 && newCoins >= 100) {
      titles = Array.from(new Set([...titles, "Magnata das SetorCoins"]));
    }

    updates.push({
      ...p,
      hp: newHp,
      xp: newXp,
      coins: newCoins,
      level: newLevel,
      luck,
      titles,
      stat_points: newStatPoints,
      passive_coin_multiplier: passiveCoinMultiplier,
      temporary_coin_multiplier: hasBuff(activeBuffs, "COIN_MAGNET")
        ? temporaryCoinMultiplier
        : 1,
      inventory,
      exhaustion_threshold: exhaustionThreshold,
      exhaustion_penalty_multiplier: exhaustionPenaltyMultiplier,
      active_buffs: activeBuffs,
      daily_challenge_state: dailyChallengeState,
      last_weekday_recovery_at: isWeekdayForRecovery
        ? weekdayRecoveryKey
        : lastWeekdayRecoveryAt,
    });

    if (isParticipant && (xpChange !== 0 || coinsChange !== 0 || isWinner)) {
      rewards.push({
        profileId: p.id,
        profileName: p.name,
        category,
        isWinner,
        xpGain: xpChange,
        coinGain: coinsChange,
        xpBreakdown,
        coinBreakdown,
      });

      if ((xpChange > 0 || coinsChange > 0) && !isWinner) {
        logs.push({
          event_type: "draw_rewards",
          category,
          message: formatRewardMessage(p.name, category, xpChange, coinsChange),
          primary_actor_id: p.id,
          metadata: {
            category,
            isWinner,
            xpGain: xpChange,
            coinGain: coinsChange,
            xpBreakdown,
            coinBreakdown,
          },
        });
      }
    }
  }

  for (const clericId of clericWinnerIds) {
    logs.push({
      event_type: "class_passive",
      category,
      message: "Aura de Comunhao concedeu moedas extras ao grupo",
      primary_actor_id: clericId,
    });
  }

  for (const winnerId of resolvedWinnerIds) {
    const winnerReward = rewards.find(
      (reward) => reward.profileId === winnerId && reward.category === category,
    );
    const rewardSummary =
      winnerReward && (winnerReward.xpGain > 0 || winnerReward.coinGain > 0)
        ? formatRewardSummary(winnerReward.xpGain, winnerReward.coinGain)
        : null;

    logs.push({
      event_type: "draw_result",
      category,
      message: rewardSummary
        ? `Sorteado para ${category.toUpperCase()} e recebeu ${rewardSummary}`
        : `Sorteado para ${category.toUpperCase()}`,
      primary_actor_id: winnerId,
      metadata: {
        participantsCount: participants.length,
        xpGain: winnerReward?.xpGain ?? 0,
        coinGain: winnerReward?.coinGain ?? 0,
      },
    });
  }

  return {
    updates,
    logs,
    rewards,
    winnerIds: resolvedWinnerIds,
  };
}
