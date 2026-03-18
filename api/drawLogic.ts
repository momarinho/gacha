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

const BUSINESS_TIMEZONE = "America/Sao_Paulo";
const LADINO_DODGE_BASE = 0.05;
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
const SOLO_XP_GAIN = 12;
const SOLO_COIN_GAIN = 8;
const LEVEL_UP_COIN_REWARD = 20;
const WEEKDAY_PASSIVE_RECOVERY_RATIO = 0.1;

function getXpRequiredForLevel(level: number) {
  return 100 + Math.max(0, level - 1) * 25;
}

function getBusinessDayState(now = new Date()) {
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
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

function normalizeTitles(titles: unknown) {
  if (!Array.isArray(titles)) return [];
  return titles.filter((title): title is string => typeof title === "string");
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
      ? Math.max(0, statMalandragem) * 0.005
      : 0;

  if (profileClass === "ladino") {
    return (
      LADINO_DODGE_BASE + normalizedLuck + reliefLuckBonus + malandragemStat
    );
  }

  return malandragemStat;
}

export function processDrawOutcome({
  category,
  winnerIds,
  participants,
  profiles,
  now = new Date(),
  randomChance = () => false,
  randomIndex = (max) => (max <= 0 ? 0 : 0),
}: ProcessDrawInput): ProcessDrawResult {
  const participantSet = new Set<string>(participants);
  const participantProfiles = profiles.filter((profile) =>
    participantSet.has(profile.id),
  );
  const profileMap = new Map<string, DrawProfile>(
    profiles.map((profile) => [profile.id, profile]),
  );
  const resolvedWinnerIds = [...winnerIds];
  const consumedBuffsByProfile = new Map<string, Set<string>>();
  const updates: DrawProfile[] = [];
  const logs: BattleLogInsert[] = [];
  const rewards: DrawRewardSummary[] = [];
  const { dateKey: weekdayRecoveryKey, isWeekday: isWeekdayForRecovery } =
    getBusinessDayState(now);

  const consumeBuff = (profileId: string, buffType: string) => {
    if (!consumedBuffsByProfile.has(profileId)) {
      consumedBuffsByProfile.set(profileId, new Set());
    }
    consumedBuffsByProfile.get(profileId)!.add(buffType);
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
      const dodgeChance = getDodgeChance(
        requestedWinner.class,
        requestedWinner.luck,
        activeBuffs,
        requestedWinner.stat_malandragem || 0,
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
      shouldReroll = true;
      consumeBuff(requestedWinner.id, "OUTSOURCE_AGUA");
      logs.push({
        event_type: "item_use",
        category,
        message: `${requestedWinner.name} terceirizou a Agua`,
        primary_actor_id: requestedWinner.id,
      });
    }

    if (category === "pao" && hasBuff(activeBuffs, "TRANSFER_PAO")) {
      shouldReroll = true;
      consumeBuff(requestedWinner.id, "TRANSFER_PAO");
      logs.push({
        event_type: "item_use",
        category,
        message: `${requestedWinner.name} transferiu o Pao de Queijo`,
        primary_actor_id: requestedWinner.id,
      });
    }

    if (!shouldReroll) continue;

    const rerollPool = participantProfiles.filter(
      (profile) =>
        profile.id !== requestedWinner.id &&
        !resolvedWinnerIds.includes(profile.id),
    );

    if (rerollPool.length === 0) continue;

    resolvedWinnerIds[index] = rerollPool[randomIndex(rerollPool.length)].id;
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
    let titles = normalizeTitles(p.titles);
    const xpBreakdown: RewardBreakdownItem[] = [];
    const coinBreakdown: RewardBreakdownItem[] = [];
    const focoBonus = (p.stat_foco || 0) * 0.5;

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

    const networkingBonus = (p.stat_networking || 0) * 0.005;
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
      if (category === "pao") {
        if (!isWinner) {
          hpChange = -PAO_HP_LOSS;
          addXp("Base do sorteio (PAO)", 20);
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
        if (isWinner) {
          addXp("Base do sorteio (AGUA) - sorteado", 10);
          addCoins("Base do sorteio (AGUA) - sorteado", 5);
        } else {
          hpChange = -AGUA_HP_LOSS;
          addXp("Base do sorteio (AGUA) - participante", 5);
        }
      } else if (category === "balde") {
        if (isWinner) {
          addXp("Base do sorteio (BALDE) - sorteado", 30);
          addCoins("Base do sorteio (BALDE) - sorteado", 15);
        } else {
          hpChange = -BALDE_HP_LOSS;
          addXp("Base do sorteio (BALDE) - participante", 10);
        }
      } else if (category === "geral") {
        if (!isWinner) {
          hpChange = -GERAL_HP_LOSS;
        }
        addCoins("Base do sorteio (GERAL)", 5);
      } else if (category === "solo") {
        if (isWinner) {
          addXp("Base do sorteio (SOLO)", SOLO_XP_GAIN);
          addCoins("Base do sorteio (SOLO)", SOLO_COIN_GAIN);
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
      const classMultiplier = p.class === "ladino" ? 1.25 : 1.1;
      coinsChange = Math.floor(coinsChange * classMultiplier);
      const ladinoBonus = coinsChange - previousCoinsChange;
      if (ladinoBonus !== 0) {
        coinBreakdown.push({
          label: `Bonus de classe (${p.class === "ladino" ? "Ladino x1.25" : "Aprendiz Ladino x1.10"})`,
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

    if (category === "pao" && isWinner) {
      activeBuffs.push({
        type: "POST_PAO_RECOVERY",
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        value:
          p.class === "clerigo" ? 10 : p.class === "aprendiz_clerigo" ? 8 : 5,
      });
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
      exhaustion_threshold: exhaustionThreshold,
      exhaustion_penalty_multiplier: exhaustionPenaltyMultiplier,
      active_buffs: activeBuffs,
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
    logs.push({
      event_type: "draw_result",
      category,
      message: `Sorteado para ${category.toUpperCase()}`,
      primary_actor_id: winnerId,
      metadata: { participantsCount: participants.length },
    });
  }

  return {
    updates,
    logs,
    rewards,
    winnerIds: resolvedWinnerIds,
  };
}
