import express from "express";
import path from "path";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
// Import using .js extension for ESM module resolution in Vercel environments
import { processDrawOutcome as sharedProcessDrawOutcome } from "../shared/drawLogic.js";
import { getBannerForShopItem } from "../shared/shopBannerLogic.js";

dotenv.config();

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const isSupabaseEnabled = !!(supabaseUrl && supabaseKey);
const accessPassword = process.env.APP_ACCESS_PASSWORD?.trim() || "";

let supabase: any = null;
let db: any = null;
let dbInitialized = false;

const LADINO_DODGE_BASE = 0.05;
const DEFAULT_RELIEF_LUCK_BONUS = 0.1;
const DEFAULT_MOGADO_DURATION_HOURS = 12;
const DEFAULT_MOGADO_OPTIONS = [
  { targetStat: "stat_foco", amount: 4, label: "Foco" },
  { targetStat: "stat_networking", amount: 4, label: "Networking" },
  { targetStat: "stat_malandragem", amount: 4, label: "Malandragem" },
  { targetStat: "luck", amount: 0.04, label: "Sorte" },
] as const;
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
const BUSINESS_TIMEZONE = "America/Sao_Paulo";
const APPRENTICE_UNLOCK_LEVEL = 3;
const FINAL_CLASS_UNLOCK_LEVEL = 5;
const CUSTOM_TITLE_PREFIX = "custom:";
const SHOP_PRICE_OVERRIDES: Record<string, number> = {
  HEAL_PERCENT_50: 35,
  HEAL_100: 55,
  HEAL_PERCENT_25: 20,
  OUTSOURCE_AGUA: 180,
};
const SHOP_PULL_PRICE_SINGLE = 10;
const SHOP_PULL_PRICE_MULTI = 100;
const SHOP_RARE_PITY_THRESHOLD = 10;
const SHOP_LEGENDARY_PITY_THRESHOLD = 90;
const SHOP_BANNER_RATES: Record<ShopItemRarity, number> = {
  common: 0.88,
  rare: 0.09,
  epic: 0.024,
  legendary: 0.006,
};
const SHOP_CATASTROPHE_BANNER_RATES: Record<ShopItemRarity, number> = {
  common: 0.82,
  rare: 0.12,
  epic: 0.05,
  legendary: 0.01,
};
const SHOP_PITY_RARE_BUFF = "SHOP_PITY_RARE";
const SHOP_PITY_LEGENDARY_BUFF = "SHOP_PITY_LEGENDARY";
const SHOP_PITY_RARE_CATASTROPHE_BUFF = "SHOP_PITY_RARE_CATASTROPHE";
const SHOP_PITY_LEGENDARY_CATASTROPHE_BUFF = "SHOP_PITY_LEGENDARY_CATASTROPHE";
const SHOP_PITY_EXPIRES_AT = "2099-12-31T23:59:59.999Z";
const ROADMAP_STATUSES = [
  "pending",
  "in_progress",
  "done",
  "discarded",
] as const;

const PROFILE_CLASSES = [
  "novato",
  "aprendiz_guerreiro",
  "aprendiz_mago",
  "aprendiz_ladino",
  "aprendiz_clerigo",
  "guerreiro",
  "mago",
  "ladino",
  "clerigo",
] as const;

function getXpRequiredForLevel(level: number) {
  return 100 + Math.max(0, level - 1) * 25;
}

type ProfileClass = (typeof PROFILE_CLASSES)[number];

type ActiveBuff = {
  type: string;
  expiresAt: string;
  value?: number;
  metadata?: Record<string, any>;
};

type ItemMetadata = {
  multiplier?: number;
  luckBonus?: number;
  duration_hours?: number;
  xpBonus?: number;
  coinBonus?: number;
  activation?: "active" | "auto";
  damageReduction?: number;
  debuffOptions?: Array<{
    targetStat?: string;
    amount?: number;
    label?: string;
  }>;
  profileModifiers?: {
    passive_coin_multiplier?: number;
    temporary_coin_multiplier?: number;
    exhaustion_threshold?: number;
    exhaustion_penalty_multiplier?: number;
    luck?: number;
  };
};

type ShopItemRarity = "common" | "rare" | "epic" | "legendary";
type ShopBanner = "standard" | "catastrophe";

type ShopItemRecord = {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
  effect_code: string;
  icon: string;
  min_level: number;
  duration_minutes?: number | null;
  metadata?: ItemMetadata;
  stackable?: boolean;
  target_category?: "pao" | "agua" | "balde" | "geral" | null;
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

type DrawProfile = {
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
  inventory: unknown[];
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

type ProcessDrawInput = {
  category: DrawCategory;
  winnerIds: string[];
  participants: string[];
  profiles: DrawProfile[];
  shopItems?: Array<{
    id: string;
    name: string;
    effect_code: string;
    metadata?: ItemMetadata;
  }>;
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

function getAccessCookieValue() {
  if (!accessPassword) return "";
  return createHash("sha256").update(accessPassword).digest("hex");
}

const accessCookieValue = getAccessCookieValue();

function parseCookies(cookieHeader?: string) {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) return acc;
    const encodedValue = rawValue.join("=");
    try {
      acc[rawKey] = decodeURIComponent(encodedValue);
    } catch {
      acc[rawKey] = encodedValue;
    }
    return acc;
  }, {});
}

function hasAccessCookie(req: express.Request) {
  if (!accessPassword) return true;
  const cookies = parseCookies(req.headers.cookie);
  return cookies.devgacha_access === accessCookieValue;
}

function randomChance(chance: number) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / 0xffffffff < chance;
}

function randomIndex(max: number) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
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

function purgeExpiredBuffs(buffs: ActiveBuff[]) {
  const now = Date.now();
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

function normalizeTitles(titles: unknown) {
  if (!Array.isArray(titles)) return [];
  return titles.filter((title): title is string => typeof title === "string");
}

function getAchievementTitles(titles: unknown) {
  return normalizeTitles(titles).filter(
    (title) => !title.startsWith(CUSTOM_TITLE_PREFIX),
  );
}

function normalizeItemMetadata(metadata: unknown): ItemMetadata {
  if (!metadata || typeof metadata !== "object") return {};
  return metadata as ItemMetadata;
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

function getEffectiveShopPrice(item: any) {
  const override = SHOP_PRICE_OVERRIDES[item?.effect_code];
  return typeof override === "number" ? override : item?.price;
}

function getShopItemRarity(item: ShopItemRecord): ShopItemRarity {
  const metadata = normalizeItemMetadata(item.metadata);
  const multiplier =
    typeof metadata.multiplier === "number" ? metadata.multiplier : 0;
  const luckBonus =
    typeof metadata.luckBonus === "number" ? metadata.luckBonus : 0;
  const xpBonus = typeof metadata.xpBonus === "number" ? metadata.xpBonus : 0;
  const coinBonus =
    typeof metadata.coinBonus === "number" ? metadata.coinBonus : 0;

  switch (item.effect_code) {
    case "MOGADO_DEBUFF":
      return "common";
    case "OUTSOURCE_AGUA":
      return "legendary";
    case "AUTO_TRANSFER_PAO":
      return "legendary";
    case "AUTO_OUTSOURCE_AGUA":
      return "epic";
    case "AUTO_BALDE_SHIELD":
      return "rare";
    case "HEAL_100":
      return "rare";
    case "RELIEF_LUCK_BOOST":
      return luckBonus >= 0.12 ? "epic" : luckBonus >= 0.08 ? "rare" : "common";
    case "TRANSFER_PAO":
      return "epic";
    case "SKIP_AGUA_NEXT":
    case "AGUA_SHIELD":
      return "rare";
    case "COIN_MAGNET":
      if (multiplier >= 1.8 || (item.duration_minutes || 0) >= 90) {
        return "legendary";
      }
      if (multiplier >= 1.5 || (item.duration_minutes || 0) >= 60) {
        return "epic";
      }
      return "rare";
    case "SKIP_BALDE_NEXT":
      return "rare";
    case "SOLO_REWARD_BOOST":
      return xpBonus >= 18 || coinBonus >= 12 ? "legendary" : "epic";
    case "FURA_OLHO":
    case "STEAL_INVENTORY_ITEM":
      return "epic";
    default:
      return "common";
  }
}

function normalizeShopItem(item: ShopItemRecord) {
  return {
    ...item,
    price: getEffectiveShopPrice(item),
    rarity: getShopItemRarity(item),
  };
}

function getShopItemBanner(
  item: ReturnType<typeof normalizeShopItem>,
): ShopBanner {
  return getBannerForShopItem(item);
}

function getShopPullPrice(profileClass: ProfileClass, count: 1 | 10) {
  const basePrice =
    count === 10 ? SHOP_PULL_PRICE_MULTI : SHOP_PULL_PRICE_SINGLE;

  if (profileClass === "mago") return Math.ceil(basePrice * 0.85);
  if (profileClass === "aprendiz_mago") return Math.ceil(basePrice * 0.92);
  return basePrice;
}

function getPersistentPityCount(buffs: ActiveBuff[], type: string) {
  const pityBuff = buffs.find((buff) => buff.type === type);
  return typeof pityBuff?.value === "number" && pityBuff.value > 0
    ? Math.floor(pityBuff.value)
    : 0;
}

function getShopPityBuffType(banner: ShopBanner, type: "rare" | "legendary") {
  if (banner === "catastrophe") {
    return type === "rare"
      ? SHOP_PITY_RARE_CATASTROPHE_BUFF
      : SHOP_PITY_LEGENDARY_CATASTROPHE_BUFF;
  }

  return type === "rare" ? SHOP_PITY_RARE_BUFF : SHOP_PITY_LEGENDARY_BUFF;
}

function upsertPersistentPityBuff(
  buffs: ActiveBuff[],
  type: string,
  value: number,
): ActiveBuff[] {
  const nextBuffs = buffs.filter((buff) => buff.type !== type);
  nextBuffs.push({
    type,
    expiresAt: SHOP_PITY_EXPIRES_AT,
    value: Math.max(0, Math.floor(value)),
  });
  return nextBuffs;
}

function pickWeightedShopItem(items: ReturnType<typeof normalizeShopItem>[]) {
  const totalWeight = items.reduce((sum, item) => {
    return sum + Math.max(1, Math.round(400 / Math.max(1, item.price)));
  }, 0);
  const target = randomIndex(totalWeight);
  let cursor = 0;

  for (const item of items) {
    cursor += Math.max(1, Math.round(400 / Math.max(1, item.price)));
    if (target < cursor) return item;
  }

  return items[items.length - 1];
}

function pickShopRarity(
  forceRareOrBetter: boolean,
  forceLegendary: boolean,
  banner: ShopBanner,
) {
  if (forceLegendary) return "legendary" as ShopItemRarity;

  const baseRates =
    banner === "catastrophe"
      ? SHOP_CATASTROPHE_BANNER_RATES
      : SHOP_BANNER_RATES;

  const rates = forceRareOrBetter
    ? {
        rare: baseRates.rare,
        epic: baseRates.epic,
        legendary: baseRates.legendary,
      }
    : baseRates;

  const total = Object.values(rates).reduce((sum, value) => sum + value, 0);
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  let roll = (array[0] / 0xffffffff) * total;

  for (const [rarity, chance] of Object.entries(rates)) {
    roll -= chance;
    if (roll <= 0) return rarity as ShopItemRarity;
  }

  return forceRareOrBetter ? "rare" : "common";
}

function isApprenticeClass(profileClass: string): profileClass is ProfileClass {
  return PROFILE_CLASSES.includes(profileClass as ProfileClass);
}

function getAllowedClassTransitions(currentClass: ProfileClass, level: number) {
  if (currentClass === "novato") {
    if (level < APPRENTICE_UNLOCK_LEVEL) return [] as ProfileClass[];
    return [
      "aprendiz_guerreiro",
      "aprendiz_mago",
      "aprendiz_ladino",
      "aprendiz_clerigo",
    ] as ProfileClass[];
  }

  if (level < FINAL_CLASS_UNLOCK_LEVEL) return [] as ProfileClass[];

  if (currentClass === "aprendiz_guerreiro")
    return ["guerreiro"] as ProfileClass[];
  if (currentClass === "aprendiz_mago") return ["mago"] as ProfileClass[];
  if (currentClass === "aprendiz_ladino") return ["ladino"] as ProfileClass[];
  if (currentClass === "aprendiz_clerigo") return ["clerigo"] as ProfileClass[];

  return [] as ProfileClass[];
}

function getDodgeChance(
  profileClass: ProfileClass,
  luck: number,
  buffs: ActiveBuff[],
  statMalandragem: number = 0,
) {
  const normalizedLuck =
    typeof luck === "number" && Number.isFinite(luck) ? Math.max(0, luck) : 0;
  const reliefLuckBonus = getBuffValue(buffs, "RELIEF_LUCK");
  const malandragemStat =
    typeof statMalandragem === "number"
      ? Math.max(0, statMalandragem) * 0.005
      : 0; // Each point = 0.5% dodge

  if (profileClass === "ladino") {
    return (
      LADINO_DODGE_BASE + normalizedLuck + reliefLuckBonus + malandragemStat
    );
  }

  return 0 + malandragemStat;
}

function processDrawOutcome({
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

    if (!shouldReroll) continue;
    const replacementWinner = pickReplacementWinner(requestedWinner.id);
    if (!replacementWinner) continue;
    resolvedWinnerIds[index] = replacementWinner.id;
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
    let activeBuffs = purgeExpiredBuffs(normalizeBuffs(p.active_buffs));
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

function applyProfileModifiersFromItem(
  currentProfile: any,
  metadata: ItemMetadata,
  updates: Record<string, any>,
) {
  const modifiers = metadata.profileModifiers;
  if (!modifiers || typeof modifiers !== "object") return updates;

  if (
    typeof modifiers.passive_coin_multiplier === "number" &&
    modifiers.passive_coin_multiplier > 0
  ) {
    updates.passive_coin_multiplier = Number(
      (
        (typeof currentProfile.passive_coin_multiplier === "number"
          ? currentProfile.passive_coin_multiplier
          : 1) * modifiers.passive_coin_multiplier
      ).toFixed(2),
    );
  }

  if (
    typeof modifiers.temporary_coin_multiplier === "number" &&
    modifiers.temporary_coin_multiplier > 0
  ) {
    updates.temporary_coin_multiplier = Number(
      (
        (typeof currentProfile.temporary_coin_multiplier === "number"
          ? currentProfile.temporary_coin_multiplier
          : 1) * modifiers.temporary_coin_multiplier
      ).toFixed(2),
    );
  }

  if (
    typeof modifiers.exhaustion_threshold === "number" &&
    modifiers.exhaustion_threshold >= 0 &&
    modifiers.exhaustion_threshold <= 1
  ) {
    updates.exhaustion_threshold = modifiers.exhaustion_threshold;
  }

  if (
    typeof modifiers.exhaustion_penalty_multiplier === "number" &&
    modifiers.exhaustion_penalty_multiplier >= 0 &&
    modifiers.exhaustion_penalty_multiplier <= 1
  ) {
    updates.exhaustion_penalty_multiplier =
      modifiers.exhaustion_penalty_multiplier;
  }

  if (typeof modifiers.luck === "number") {
    updates.luck = Number(
      (
        (typeof currentProfile.luck === "number" ? currentProfile.luck : 0) +
        modifiers.luck
      ).toFixed(3),
    );
  }

  return updates;
}

function buildResolvedTitlesByProfileId(profiles: any[], _logs: any[]) {
  return profiles.reduce<Record<string, string[]>>((acc, profile) => {
    acc[profile.id] = getAchievementTitles(profile.titles);
    return acc;
  }, {});
}

async function initDb() {
  if (dbInitialized) return;

  if (isSupabaseEnabled) {
    console.log("Supabase detected, using Supabase as database provider.");
    supabase = createClient(supabaseUrl!, supabaseKey!);
  } else if (process.env.VERCEL) {
    console.warn(
      "Running on Vercel but no Supabase config found. Cloud sync will be offline.",
    );
  } else {
    const dbPath = path.join(process.cwd(), "raffle.db");
    console.log(`No Supabase config found. Using local SQLite at ${dbPath}`);
    try {
      const sqliteModuleName = "better-sqlite3";
      const { default: Database } = await import(sqliteModuleName);
      db = new Database(dbPath);
      db.exec(`
        CREATE TABLE IF NOT EXISTS raffle_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          data TEXT NOT NULL
        )
      `);
      console.log("SQLite initialized successfully");
    } catch (err) {
      console.error("Failed to initialize SQLite:", err);
    }
  }
  dbInitialized = true;
}

let cachedApp: any = null;

async function createExpressApp() {
  if (cachedApp) return cachedApp;

  const app = express();
  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get("/api/health", async (req, res) => {
    try {
      await initDb();
      res.json({
        status: "ok",
        provider: isSupabaseEnabled ? "supabase" : db ? "sqlite" : "none",
        time: new Date().toISOString(),
        env: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
        supabaseConfigured: isSupabaseEnabled,
      });
    } catch (err) {
      res
        .status(500)
        .json({ error: "Health check failed", details: String(err) });
    }
  });

  app.get("/api/access/status", (req, res) => {
    const enabled = Boolean(accessPassword);
    res.json({
      enabled,
      authenticated: enabled ? hasAccessCookie(req) : true,
    });
  });

  app.post("/api/access/unlock", (req, res) => {
    if (!accessPassword) {
      return res.json({ success: true, authenticated: true, enabled: false });
    }

    const password =
      typeof req.body?.password === "string" ? req.body.password.trim() : "";

    if (!password || password !== accessPassword) {
      return res.status(401).json({
        success: false,
        authenticated: false,
        error: "Senha inválida",
      });
    }

    res.setHeader(
      "Set-Cookie",
      [
        `devgacha_access=${encodeURIComponent(accessCookieValue)}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        process.env.NODE_ENV === "production" ? "Secure" : "",
        `Max-Age=${60 * 60 * 12}`,
      ]
        .filter(Boolean)
        .join("; "),
    );

    return res.json({ success: true, authenticated: true, enabled: true });
  });

  app.post("/api/access/logout", (_req, res) => {
    res.setHeader(
      "Set-Cookie",
      "devgacha_access=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0",
    );
    res.json({ success: true });
  });

  app.use("/api", (req, res, next) => {
    if (
      req.path === "/health" ||
      req.path === "/access/status" ||
      req.path === "/access/unlock" ||
      req.path === "/access/logout"
    ) {
      return next();
    }

    if (!hasAccessCookie(req)) {
      return res.status(401).json({ error: "Access denied" });
    }

    return next();
  });

  app.post("/api/shop/seed", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled)
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });

      const items = [
        {
          id: crypto.randomUUID(),
          name: "Curativo Leve",
          description: "Recupera 25% do HP instantaneamente.",
          price: 35,
          type: "consumable",
          effect_code: "HEAL_PERCENT_50",
          icon: "Coffee",
          min_level: 1,
          stackable: true,
        },
        {
          id: crypto.randomUUID(),
          name: "Curativo Rápido",
          description: "Recupera 25 HP instantaneamente.",
          price: 20,
          type: "consumable",
          effect_code: "HEAL_PERCENT_25",
          icon: "Bandage",
          min_level: 1,
          stackable: true,
        },
        {
          id: crypto.randomUUID(),
          name: "Band-Aid Corporativo Premium",
          description: "Recupera 100 HP instantaneamente.",
          price: 55,
          type: "consumable",
          effect_code: "HEAL_100",
          icon: "HeartPulse",
          min_level: 1,
          stackable: true,
        },
        {
          id: crypto.randomUUID(),
          name: "Band-Aid Corporativo Premium",
          description: "Recupera 100 HP instantaneamente.",
          price: 55,
          type: "consumable",
          effect_code: "HEAL_100",
          icon: "HeartPulse",
          min_level: 1,
          stackable: true,
        },
        {
          id: crypto.randomUUID(),
          name: "Capa de Fuga",
          description:
            "Aumenta sua chance de escapar de sorteios de risco por 24 horas.",
          price: 60,
          type: "consumable",
          effect_code: "RELIEF_LUCK_BOOST",
          icon: "Shield",
          min_level: 1,
          stackable: true,
          metadata: {
            activation: "active",
            luckBonus: 0.08,
            duration_hours: 24,
          },
        },
        {
          id: crypto.randomUUID(),
          name: "Crachá de Prioridade",
          description:
            "Aumenta levemente sua chance de escapar de sorteios de risco por 12 horas.",
          price: 40,
          type: "consumable",
          effect_code: "RELIEF_LUCK_BOOST",
          icon: "Shield",
          min_level: 1,
          stackable: true,
          metadata: {
            activation: "active",
            luckBonus: 0.04,
            duration_hours: 12,
          },
        },
        {
          id: crypto.randomUUID(),
          name: "Selo Mogado",
          description:
            "Aplica o status Mogado nos outros jogadores, reduzindo aleatoriamente um status por 12 horas.",
          price: 30,
          type: "consumable",
          effect_code: "MOGADO_DEBUFF",
          icon: "Wand2",
          min_level: 1,
          stackable: true,
          metadata: {
            activation: "active",
            duration_hours: 12,
            debuffOptions: DEFAULT_MOGADO_OPTIONS,
          },
        },
        {
          id: crypto.randomUUID(),
          name: "VPN do Home Office",
          description:
            "Aumenta bastante sua chance de escapar de sorteios de risco por 48 horas.",
          price: 130,
          type: "rare",
          effect_code: "RELIEF_LUCK_BOOST",
          icon: "Shield",
          min_level: 2,
          stackable: true,
          metadata: {
            activation: "active",
            luckBonus: 0.12,
            duration_hours: 48,
          },
        },
        {
          id: crypto.randomUUID(),
          name: "Atestado de Agua",
          description:
            "Prepara imunidade para a próxima Água e joga o turno para outro participante aleatório.",
          price: 85,
          type: "consumable",
          effect_code: "SKIP_AGUA_NEXT",
          icon: "Shield",
          min_level: 1,
          stackable: true,
          target_category: "agua",
          metadata: { activation: "active" },
        },
        {
          id: crypto.randomUUID(),
          name: "Boia Corporativa",
          description: "Reduz o impacto da próxima Água para você.",
          price: 70,
          type: "consumable",
          effect_code: "AGUA_SHIELD",
          icon: "Shield",
          min_level: 1,
          stackable: true,
          target_category: "agua",
          metadata: { activation: "active", damageReduction: 6 },
        },
        {
          id: crypto.randomUUID(),
          name: "Relatório Falso",
          description: "Te tira do próximo sorteio de Balde.",
          price: 120,
          type: "consumable",
          effect_code: "SKIP_BALDE_NEXT",
          icon: "Shield",
          min_level: 1,
          stackable: true,
          target_category: "balde",
        },
        {
          id: crypto.randomUUID(),
          name: "Imã de Moedas Lite",
          description:
            "Aumenta modestamente seus ganhos de SetorCoins por 30 minutos.",
          price: 95,
          type: "passive",
          effect_code: "COIN_MAGNET",
          icon: "Coins",
          min_level: 1,
          duration_minutes: 30,
          metadata: { multiplier: 1.2 },
          stackable: false,
        },
        {
          id: crypto.randomUUID(),
          name: "Imã de Moedas",
          description: "Aumenta seus ganhos de SetorCoins por 1 hora.",
          price: 180,
          type: "passive",
          effect_code: "COIN_MAGNET",
          icon: "Coins",
          min_level: 2,
          duration_minutes: 60,
          metadata: { multiplier: 1.5 },
          stackable: false,
        },
        {
          id: crypto.randomUUID(),
          name: "Imã de Moedas Turbo",
          description: "Dispara seus ganhos de SetorCoins por 90 minutos.",
          price: 220,
          type: "rare",
          effect_code: "COIN_MAGNET",
          icon: "Coins",
          min_level: 3,
          duration_minutes: 90,
          metadata: { multiplier: 1.8 },
          stackable: false,
        },
        {
          id: crypto.randomUUID(),
          name: "Procuração do Pão",
          description:
            "Se você for sorteado no Pão, transfere o problema para outro participante.",
          price: 140,
          type: "rare",
          effect_code: "TRANSFER_PAO",
          icon: "ScrollText",
          min_level: 2,
          stackable: true,
          target_category: "pao",
          metadata: { activation: "active" },
        },
        {
          id: crypto.randomUUID(),
          name: "Contrato de Terceirização",
          description:
            "Se você for sorteado na Água, tenta terceirizar o turno para outro participante.",
          price: 180,
          type: "rare",
          effect_code: "OUTSOURCE_AGUA",
          icon: "RefreshCw",
          min_level: 3,
          stackable: true,
          target_category: "agua",
          metadata: { activation: "active" },
        },
        {
          id: crypto.randomUUID(),
          name: "Boia de Emergencia",
          description:
            "Fica no inventário e terceiriza automaticamente a próxima Água em que você for sorteado.",
          price: 165,
          type: "rare",
          effect_code: "AUTO_OUTSOURCE_AGUA",
          icon: "RefreshCw",
          min_level: 2,
          stackable: true,
          target_category: "agua",
          metadata: { activation: "auto" },
        },
        {
          id: crypto.randomUUID(),
          name: "Seguro Catastrofe",
          description:
            "Fica no inventário e transfere automaticamente o próximo Pão para outro participante elegível.",
          price: 230,
          type: "rare",
          effect_code: "AUTO_TRANSFER_PAO",
          icon: "ScrollText",
          min_level: 3,
          stackable: true,
          target_category: "pao",
          metadata: { activation: "auto" },
        },
        {
          id: crypto.randomUUID(),
          name: "Colete Anti-Balde",
          description:
            "Fica no inventário e reduz automaticamente o dano do próximo Balde.",
          price: 110,
          type: "consumable",
          effect_code: "AUTO_BALDE_SHIELD",
          icon: "Shield",
          min_level: 1,
          stackable: true,
          target_category: "balde",
          metadata: { activation: "auto", damageReduction: 12 },
        },
        {
          id: crypto.randomUUID(),
          name: "Vale Hora Extra",
          description:
            "No próximo sorteio Solo, você recebe bônus extra de XP e moedas.",
          price: 160,
          type: "rare",
          effect_code: "SOLO_REWARD_BOOST",
          icon: "BriefcaseBusiness",
          min_level: 1,
          stackable: true,
          metadata: { activation: "active", xpBonus: 10, coinBonus: 6 },
          target_category: null,
        },
        {
          id: crypto.randomUUID(),
          name: "Plantão Heroico",
          description:
            "No próximo sorteio Solo, você recebe um bônus absurdo de XP e moedas.",
          price: 210,
          type: "rare",
          effect_code: "SOLO_REWARD_BOOST",
          icon: "BriefcaseBusiness",
          min_level: 3,
          stackable: true,
          metadata: { activation: "active", xpBonus: 18, coinBonus: 12 },
          target_category: null,
        },
        {
          id: crypto.randomUUID(),
          name: "Fura Olho",
          description:
            "Se voce participar de uma roleta e nao for sorteado, rouba a recompensa base de quem foi sorteado.",
          price: 190,
          type: "rare",
          effect_code: "FURA_OLHO",
          icon: "Eye",
          min_level: 2,
          stackable: true,
          metadata: { activation: "active" },
          target_category: null,
        },
        {
          id: crypto.randomUUID(),
          name: "Briga",
          description:
            "Rouba um item aleatorio do inventario de outra pessoa imediatamente.",
          price: 170,
          type: "rare",
          effect_code: "STEAL_INVENTORY_ITEM",
          icon: "Swords",
          min_level: 2,
          stackable: true,
          metadata: { activation: "active" },
          target_category: null,
        },
      ];

      await supabase
        .from("shop_items")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      const { data, error } = await supabase.from("shop_items").insert(items);
      if (error) throw error;

      res.json({ success: true, message: "Shop seeded successfully" });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({
        error: "Internal Server Error",
        details: JSON.stringify(error),
      });
    }
  });

  app.get("/api/state", async (req, res) => {
    try {
      await initDb();
      if (isSupabaseEnabled) {
        const { data, error } = await supabase
          .from("raffle_state")
          .select("data")
          .eq("id", 1)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is "no rows found"
          console.error("Supabase error fetching state:", error);
          throw error;
        }
        res.json(data ? JSON.parse(data.data) : null);
      } else if (db) {
        const row = db
          .prepare("SELECT data FROM raffle_state WHERE id = 1")
          .get() as { data: string } | undefined;
        res.json(row ? JSON.parse(row.data) : null);
      } else {
        res.status(500).json({ error: "No database provider available" });
      }
    } catch (error) {
      console.error("Error fetching state:", error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  app.post("/api/state", async (req, res) => {
    try {
      await initDb();
      const dataStr = JSON.stringify(req.body);

      if (isSupabaseEnabled) {
        const { error } = await supabase
          .from("raffle_state")
          .upsert({ id: 1, data: dataStr });

        if (error) {
          console.error("Supabase error saving state:", error);
          throw error;
        }
        res.json({ success: true });
      } else if (db) {
        db.prepare(
          "INSERT OR REPLACE INTO raffle_state (id, data) VALUES (1, ?)",
        ).run(dataStr);
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "No database provider available" });
      }
    } catch (error) {
      console.error("Error saving state:", error);
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  app.get("/api/mage/insights", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled) {
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });
      }

      const profileId = String(req.query.profileId || "");
      if (!profileId) {
        return res.status(400).json({ error: "profileId is required" });
      }

      const { data: mageProfile, error: mageError } = await supabase
        .from("profiles")
        .select("id, name, class")
        .eq("id", profileId)
        .single();

      if (mageError) throw mageError;
      if (!["mago", "aprendiz_mago"].includes(mageProfile.class)) {
        return res
          .status(403)
          .json({ error: "Only magos can access arcane insights" });
      }

      const [
        { data: stateRow, error: stateError },
        { data: profiles, error: profilesError },
        { data: logs, error: logsError },
      ] = await Promise.all([
        supabase.from("raffle_state").select("data").eq("id", 1).maybeSingle(),
        supabase.from("profiles").select("id, name"),
        supabase
          .from("battle_logs")
          .select("*, profiles(name, class)")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (stateError) throw stateError;
      if (profilesError) throw profilesError;
      if (logsError) throw logsError;

      const savedState = stateRow?.data ? JSON.parse(stateRow.data) : {};
      const nameMap = new Map(
        (profiles || []).map((profile: any) => [profile.id, profile.name]),
      );

      const queues = [
        {
          key: "pao",
          label: "Pão de Queijo",
          ids: savedState.excludedIdsPao || [],
        },
        { key: "agua", label: "Água", ids: savedState.excludedIdsAgua || [] },
        {
          key: "balde",
          label: "Balde",
          ids: savedState.excludedIdsBalde || [],
        },
        {
          key: "geral",
          label: "Geral",
          ids: savedState.excludedIdsGeral || [],
        },
      ].map((queue) => ({
        key: queue.key,
        label: queue.label,
        excludedIds: queue.ids,
        excludedNames: queue.ids.map(
          (id: string) => nameMap.get(id) || "Desconhecido",
        ),
      }));

      res.json({
        profileId: mageProfile.id,
        profileName: mageProfile.name,
        queues,
        recentLogs: logs || [],
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  app.get("/api/social/ranking", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled) {
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });
      }

      const [
        { data: profiles, error: profilesError },
        { data: logs, error: logsError },
      ] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase
          .from("battle_logs")
          .select("event_type, category, primary_actor_id"),
      ]);

      if (profilesError) throw profilesError;
      if (logsError) throw logsError;

      const titlesByProfileId = buildResolvedTitlesByProfileId(
        profiles || [],
        logs || [],
      );
      const ranking = (profiles || [])
        .map((profile: any) => ({
          id: profile.id,
          name: profile.name,
          class: profile.class,
          level: profile.level,
          xp: profile.xp,
          coins: profile.coins,
          titles: titlesByProfileId[profile.id] || [],
        }))
        .sort((a: any, b: any) => {
          if (b.level !== a.level) return b.level - a.level;
          if (b.xp !== a.xp) return b.xp - a.xp;
          return b.coins - a.coins;
        });

      res.json(ranking);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  app.get("/api/social/titles", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled) {
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });
      }

      const [
        { data: profiles, error: profilesError },
        { data: logs, error: logsError },
      ] = await Promise.all([
        supabase.from("profiles").select("id, titles, level, xp, coins"),
        supabase
          .from("battle_logs")
          .select("event_type, category, primary_actor_id"),
      ]);

      if (profilesError) throw profilesError;
      if (logsError) throw logsError;

      res.json({
        titlesByProfileId: buildResolvedTitlesByProfileId(
          profiles || [],
          logs || [],
        ),
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  // --- RPG Routes ---

  // Profiles
  app.get("/api/profiles", async (req, res) => {
    try {
      await initDb();
      if (isSupabaseEnabled) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("name");
        if (error) throw error;
        res.json(data);
      } else {
        res.status(501).json({ error: "Not implemented for SQLite yet" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  app.post("/api/profiles", async (req, res) => {
    try {
      await initDb();
      if (isSupabaseEnabled) {
        const payload = {
          name: String(req.body?.name || "").trim(),
          participates_in_pao: req.body?.participates_in_pao ?? true,
          participates_in_agua: req.body?.participates_in_agua ?? true,
          participates_in_balde: req.body?.participates_in_balde ?? true,
          participates_in_geral: req.body?.participates_in_geral ?? true,
          class: "novato",
          level: 1,
          xp: 0,
          coins: 50,
          hp: 100,
          max_hp: 100,
          luck: 0,
          titles: [],
          passive_coin_multiplier: 1,
          temporary_coin_multiplier: 1,
          exhaustion_threshold: 0.3,
          exhaustion_penalty_multiplier: 0.5,
          active_buffs: [],
          daily_challenge_state: {},
          stat_points: 0,
          stat_foco: 0,
          stat_resiliencia: 0,
          stat_networking: 0,
          stat_malandragem: 0,
        };

        if (!payload.name) {
          return res.status(400).json({ error: "Name is required" });
        }

        const { data, error } = await supabase
          .from("profiles")
          .insert([payload])
          .select()
          .single();
        if (error) throw error;
        res.json(data);
      } else {
        res.status(501).json({ error: "Not implemented for SQLite yet" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  app.post("/api/profiles/:id/allocate", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled)
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });
      const { id } = req.params;
      const { stat } = req.body;
      const allowedStats = [
        "stat_foco",
        "stat_resiliencia",
        "stat_networking",
        "stat_malandragem",
      ];
      if (!allowedStats.includes(stat))
        return res.status(400).json({ error: "Invalid stat" });

      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (pErr) throw pErr;
      if (!profile || profile.stat_points <= 0)
        return res.status(400).json({ error: "No points available" });

      const updates: any = {
        stat_points: profile.stat_points - 1,
        [stat]: (profile[stat] || 0) + 1,
      };

      if (stat === "stat_resiliencia") {
        updates.max_hp = profile.max_hp + 1; // +1 HP per Resilience
        updates.hp = profile.hp + 1; // Heal 1 HP immediately
      }

      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      res.json(data);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  app.put("/api/profiles/:id", async (req, res) => {
    try {
      await initDb();
      if (isSupabaseEnabled) {
        const { data: currentProfile, error: currentProfileError } =
          await supabase
            .from("profiles")
            .select("id, class, level")
            .eq("id", req.params.id)
            .single();

        if (currentProfileError) throw currentProfileError;

        if (req.body.class) {
          if (
            !isApprenticeClass(currentProfile.class) ||
            !isApprenticeClass(req.body.class)
          ) {
            return res.status(400).json({ error: "Invalid class transition" });
          }

          const allowedTransitions = getAllowedClassTransitions(
            currentProfile.class,
            currentProfile.level,
          );

          if (!allowedTransitions.includes(req.body.class)) {
            return res
              .status(400)
              .json({ error: "Class promotion is locked for this profile" });
          }
        }

        const { data, error } = await supabase
          .from("profiles")
          .update(req.body)
          .eq("id", req.params.id)
          .select()
          .single();
        if (error) throw error;
        res.json(data);
      } else {
        res.status(501).json({ error: "Not implemented for SQLite yet" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  app.delete("/api/profiles/:id", async (req, res) => {
    try {
      await initDb();
      if (isSupabaseEnabled) {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", req.params.id);
        if (error) throw error;
        res.json({ success: true });
      } else {
        res.status(501).json({ error: "Not implemented for SQLite yet" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  // Roadmap
  app.get("/api/roadmap", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled)
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });
      const { data, error } = await supabase
        .from("roadmap")
        .select("*, profiles(name, class)")
        .order("votes", { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  app.post("/api/roadmap", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled)
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });
      const { title, description, created_by } = req.body;
      const { error } = await supabase
        .from("roadmap")
        .insert([{ title, description, created_by }]);
      if (error) throw error;
      const { data: all } = await supabase
        .from("roadmap")
        .select("*, profiles(name, class)")
        .order("votes", { ascending: false });
      res.json(all || []);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  app.put("/api/roadmap/:id", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled)
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });
      const { status } = req.body;
      if (
        typeof status !== "string" ||
        !ROADMAP_STATUSES.includes(status as (typeof ROADMAP_STATUSES)[number])
      ) {
        return res.status(400).json({
          error: "Invalid roadmap status",
          allowed: ROADMAP_STATUSES,
        });
      }
      const { error } = await supabase
        .from("roadmap")
        .update({ status })
        .eq("id", req.params.id);
      if (error) throw error;
      const { data: all } = await supabase
        .from("roadmap")
        .select("*, profiles(name, class)")
        .order("votes", { ascending: false });
      res.json(all || []);
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "23514"
      ) {
        return res.status(400).json({
          error: "Roadmap status rejected by database constraint",
          details:
            "Run the roadmap discarded migration so status 'discarded' is accepted.",
        });
      }
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  app.post("/api/roadmap/:id/vote", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled)
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });
      const { data: roadmap, error: rErr } = await supabase
        .from("roadmap")
        .select("votes")
        .eq("id", req.params.id)
        .single();
      if (rErr) throw rErr;
      const { error } = await supabase
        .from("roadmap")
        .update({ votes: (roadmap.votes || 0) + 1 })
        .eq("id", req.params.id);
      if (error) throw error;
      const { data: all } = await supabase
        .from("roadmap")
        .select("*, profiles(name, class)")
        .order("votes", { ascending: false });
      res.json(all || []);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  // Shop
  app.get("/api/shop", async (req, res) => {
    try {
      await initDb();
      if (isSupabaseEnabled) {
        const { data, error } = await supabase
          .from("shop_items")
          .select("*")
          .order("price");
        if (error) throw error;
        res.json(
          (data || [])
            .map((item: ShopItemRecord) => normalizeShopItem(item))
            .sort((left: any, right: any) => left.price - right.price),
        );
      } else {
        res.status(501).json({ error: "Not implemented for SQLite yet" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  app.post("/api/shop/pull", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled)
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });

      const profileId = String(req.body?.profileId || "");
      const rawCount = Number(req.body?.count);
      const count: 1 | 10 = rawCount === 10 ? 10 : 1;
      const banner: ShopBanner =
        req.body?.banner === "catastrophe" ? "catastrophe" : "standard";

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();
      if (profileError) throw profileError;

      const { data: items, error: itemError } = await supabase
        .from("shop_items")
        .select("*");
      if (itemError) throw itemError;

      const normalizedItems = (items || [])
        .map((item: ShopItemRecord) => normalizeShopItem(item))
        .filter((item) => getShopItemBanner(item) === banner);
      if (normalizedItems.length === 0) {
        return res.status(400).json({ error: "Shop pool is empty" });
      }

      const chargedPrice = getShopPullPrice(profile.class, count);
      if (profile.coins < chargedPrice) {
        return res.status(400).json({ error: "Not enough coins" });
      }

      const inventory = Array.isArray(profile.inventory)
        ? [...profile.inventory]
        : [];
      let activeBuffs = normalizeBuffs(profile.active_buffs);
      let pityToRare = getPersistentPityCount(
        activeBuffs,
        getShopPityBuffType(banner, "rare"),
      );
      let pityToLegendary = getPersistentPityCount(
        activeBuffs,
        getShopPityBuffType(banner, "legendary"),
      );
      const drops: Array<{
        item: ReturnType<typeof normalizeShopItem>;
        rarity: ShopItemRarity;
        isGuaranteed: boolean;
      }> = [];

      for (let pullIndex = 0; pullIndex < count; pullIndex++) {
        const forceLegendary =
          pityToLegendary + 1 >= SHOP_LEGENDARY_PITY_THRESHOLD;
        const forceRareOrBetter =
          forceLegendary || pityToRare + 1 >= SHOP_RARE_PITY_THRESHOLD;

        let rarity = pickShopRarity(forceRareOrBetter, forceLegendary, banner);
        let pool = normalizedItems.filter((item) => item.rarity === rarity);

        if (pool.length === 0 && rarity === "legendary") {
          rarity = "epic";
          pool = normalizedItems.filter((item) => item.rarity === rarity);
        }
        if (pool.length === 0 && rarity === "epic") {
          rarity = "rare";
          pool = normalizedItems.filter((item) => item.rarity === rarity);
        }
        if (pool.length === 0 && rarity === "rare") {
          rarity = "common";
          pool = normalizedItems.filter((item) => item.rarity === rarity);
        }
        if (pool.length === 0) {
          pool = normalizedItems;
          rarity = pool[0].rarity || "common";
        }

        const awardedItem = pickWeightedShopItem(pool);
        const existingItem = inventory.find(
          (entry: any) => entry.item_id === awardedItem.id,
        );

        if (existingItem) {
          existingItem.qty = (existingItem.qty || 1) + 1;
        } else {
          inventory.push({ item_id: awardedItem.id, qty: 1 });
        }

        drops.push({
          item: awardedItem,
          rarity,
          isGuaranteed:
            forceLegendary || (forceRareOrBetter && rarity !== "common"),
        });

        pityToRare = rarity === "common" ? pityToRare + 1 : 0;
        pityToLegendary = rarity === "legendary" ? 0 : pityToLegendary + 1;
      }

      activeBuffs = upsertPersistentPityBuff(
        activeBuffs,
        getShopPityBuffType(banner, "rare"),
        pityToRare,
      );
      activeBuffs = upsertPersistentPityBuff(
        activeBuffs,
        getShopPityBuffType(banner, "legendary"),
        pityToLegendary,
      );

      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .update({
          coins: profile.coins - chargedPrice,
          inventory,
          active_buffs: activeBuffs,
        })
        .eq("id", profileId)
        .select()
        .single();

      if (updateError) throw updateError;

      await supabase.from("battle_logs").insert([
        {
          event_type: "gacha_pull",
          category: "system",
          message: `Fez ${count} pull${count > 1 ? "s" : ""} no Banner ${banner === "catastrophe" ? "Catástrofe" : "Padrão"}`,
          primary_actor_id: profileId,
          metadata: {
            banner,
            coinsChanged: -chargedPrice,
            count,
            pityToRare,
            pityToLegendary,
            drops: drops.map((drop) => ({
              itemId: drop.item.id,
              rarity: drop.rarity,
              guaranteed: drop.isGuaranteed,
            })),
          },
        },
      ]);

      res.json({
        profile: updatedProfile,
        banner,
        spentCoins: chargedPrice,
        totalPulls: count,
        pityToRare,
        pityToLegendary,
        drops,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  // Logs
  app.get("/api/logs", async (req, res) => {
    try {
      await initDb();
      if (isSupabaseEnabled) {
        const { data, error } = await supabase
          .from("battle_logs")
          .select("*, profiles(name, class)")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        res.json(data);
      } else {
        res.status(501).json({ error: "Not implemented for SQLite yet" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  // Transaction: Buy Item
  app.post("/api/shop/buy", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled)
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });

      const { profileId, itemId } = req.body;

      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();
      if (pErr) throw pErr;

      const { data: item, error: iErr } = await supabase
        .from("shop_items")
        .select("*")
        .eq("id", itemId)
        .single();
      if (iErr) throw iErr;

      const basePrice = getEffectiveShopPrice(item);
      const chargedPrice =
        profile.class === "mago"
          ? Math.ceil(basePrice * 0.8)
          : profile.class === "aprendiz_mago"
            ? Math.ceil(basePrice * 0.9)
            : basePrice;

      if (profile.coins < chargedPrice)
        return res.status(400).json({ error: "Not enough coins" });
      if (profile.level < item.min_level)
        return res.status(400).json({ error: "Level too low" });

      const newCoins = profile.coins - chargedPrice;
      const inventory = profile.inventory || [];
      const existingItem = inventory.find((i: any) => i.item_id === itemId);

      if (existingItem) {
        existingItem.qty = (existingItem.qty || 1) + 1;
      } else {
        inventory.push({ item_id: itemId, qty: 1 });
      }

      const { data: updatedProfile, error: uErr } = await supabase
        .from("profiles")
        .update({ coins: newCoins, inventory })
        .eq("id", profileId)
        .select()
        .single();

      if (uErr) throw uErr;

      await supabase.from("battle_logs").insert([
        {
          event_type: "item_buy",
          category: "system",
          message: `Comprou ${item.name}`,
          primary_actor_id: profileId,
          metadata: {
            coinsChanged: -chargedPrice,
            originalPrice: basePrice,
            itemId,
          },
        },
      ]);

      res.json(updatedProfile);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  // Use Item
  app.post("/api/inventory/use", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled)
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });

      const { profileId, itemId } = req.body;

      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();
      if (pErr) throw pErr;

      const { data: item, error: iErr } = await supabase
        .from("shop_items")
        .select("*")
        .eq("id", itemId)
        .single();
      if (iErr) throw iErr;

      const inventory = profile.inventory || [];
      const itemIndex = inventory.findIndex((i: any) => i.item_id === itemId);

      if (itemIndex === -1 || inventory[itemIndex].qty <= 0) {
        return res.status(400).json({ error: "Item not found in inventory" });
      }

      // Consume item
      inventory[itemIndex].qty -= 1;
      if (inventory[itemIndex].qty === 0) {
        inventory.splice(itemIndex, 1);
      }

      let updates: any = { inventory };
      let activeBuffs = purgeExpiredBuffs(normalizeBuffs(profile.active_buffs));
      let logMessage = `Usou ${item.name}`;
      let logMetadata: Record<string, unknown> = {
        itemId,
        effect: item.effect_code,
      };
      const itemDurationMinutes =
        typeof item.duration_minutes === "number" && item.duration_minutes > 0
          ? item.duration_minutes
          : 60;
      const itemMetadata = normalizeItemMetadata(item.metadata);

      if (itemMetadata.activation === "auto") {
        return res.status(400).json({
          error: "Automatic items cannot be used manually",
        });
      }

      // Apply effect based on effect_code
      if (
        item.effect_code === "HEAL_50" ||
        item.effect_code === "HEAL_PERCENT_50"
      ) {
        const recoveredHp = Math.max(1, Math.ceil(profile.max_hp * 0.5));
        updates.hp = Math.min(profile.max_hp, profile.hp + recoveredHp);
        logMessage = `Usou ${item.name} e recuperou ${recoveredHp} HP`;
      } else if (item.effect_code === "HEAL_PERCENT_25") {
        const recoveredHp = Math.max(1, Math.ceil(profile.max_hp * 0.25));
        updates.hp = Math.min(profile.max_hp, profile.hp + recoveredHp);
        logMessage = `Usou ${item.name} e recuperou ${recoveredHp} HP`;
      } else if (item.effect_code === "HEAL_100") {
        updates.hp = Math.min(profile.max_hp, profile.hp + 100);
        logMessage = `Usou ${item.name} e recuperou 100 HP`;
      } else if (
        item.effect_code === "SKIP_BALDE" ||
        item.effect_code === "SKIP_BALDE_NEXT"
      ) {
        activeBuffs.push({
          type: "SKIP_BALDE",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        });
        updates.active_buffs = activeBuffs;
        logMessage = `Usou ${item.name} e ficará fora do próximo Balde`;
      } else if (item.effect_code === "SKIP_AGUA_NEXT") {
        activeBuffs.push({
          type: "OUTSOURCE_AGUA",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        });
        updates.active_buffs = activeBuffs;
        logMessage = `Usou ${item.name} e terceirizará a próxima Água para outro participante aleatório`;
      } else if (item.effect_code === "AGUA_SHIELD") {
        const damageReduction =
          typeof itemMetadata.damageReduction === "number" &&
          itemMetadata.damageReduction > 0
            ? itemMetadata.damageReduction
            : 6;
        activeBuffs.push({
          type: "AGUA_SHIELD",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          value: damageReduction,
        });
        updates.active_buffs = activeBuffs;
        logMessage = `Usou ${item.name} e reduzirá o impacto da próxima Água em ${damageReduction} HP`;
      } else if (item.effect_code === "COIN_MAGNET") {
        const magnetMultiplier =
          typeof itemMetadata.multiplier === "number" &&
          itemMetadata.multiplier > 1
            ? itemMetadata.multiplier
            : COIN_MAGNET_MULTIPLIER;
        activeBuffs.push({
          type: "COIN_MAGNET",
          expiresAt: new Date(
            Date.now() + itemDurationMinutes * 60 * 1000,
          ).toISOString(),
          value: magnetMultiplier,
        });
        updates.active_buffs = activeBuffs;
        updates.temporary_coin_multiplier = magnetMultiplier;
        logMessage = `Usou ${item.name} e aumentou seus ganhos de SetorCoins por ${itemDurationMinutes} min`;
      } else if (item.effect_code === "RELIEF_LUCK_BOOST") {
        const luckBonus =
          typeof itemMetadata.luckBonus === "number" &&
          itemMetadata.luckBonus > 0
            ? itemMetadata.luckBonus
            : DEFAULT_RELIEF_LUCK_BONUS;
        const durationHours =
          typeof itemMetadata.duration_hours === "number" &&
          itemMetadata.duration_hours > 0
            ? itemMetadata.duration_hours
            : 24;

        activeBuffs.push({
          type: "RELIEF_LUCK",
          expiresAt: new Date(
            Date.now() + durationHours * 60 * 60 * 1000,
          ).toISOString(),
          value: luckBonus,
        });
        updates.active_buffs = activeBuffs;
        logMessage = `Usou ${item.name} e ganhou +${luckBonus.toFixed(2)} de sorte por ${durationHours}h`;
      } else if (item.effect_code === "MOGADO_DEBUFF") {
        const durationHours =
          typeof itemMetadata.duration_hours === "number" &&
          itemMetadata.duration_hours > 0
            ? itemMetadata.duration_hours
            : DEFAULT_MOGADO_DURATION_HOURS;
        const metadataOptions = Array.isArray(itemMetadata.debuffOptions)
          ? itemMetadata.debuffOptions
              .filter((entry) => {
                if (!entry || typeof entry !== "object") return false;
                return (
                  typeof entry.targetStat === "string" &&
                  typeof entry.amount === "number" &&
                  entry.amount > 0
                );
              })
              .map((entry) => ({
                targetStat: entry.targetStat as string,
                amount: entry.amount as number,
                label: entry.label,
              }))
          : [];
        const debuffPool =
          metadataOptions.length > 0
            ? metadataOptions
            : [...DEFAULT_MOGADO_OPTIONS];
        const { data: targetProfiles, error: targetErr } = await supabase
          .from("profiles")
          .select("id, active_buffs")
          .neq("id", profileId);
        if (targetErr) throw targetErr;

        const targets = Array.isArray(targetProfiles) ? targetProfiles : [];
        await Promise.all(
          targets.map(async (targetProfile: any) => {
            const targetActiveBuffs = purgeExpiredBuffs(
              normalizeBuffs(targetProfile.active_buffs),
            );
            const pickedDebuff = debuffPool[randomIndex(debuffPool.length)];
            targetActiveBuffs.push({
              type: "MOGADO",
              expiresAt: new Date(
                Date.now() + durationHours * 60 * 60 * 1000,
              ).toISOString(),
              metadata: {
                targetStat: pickedDebuff.targetStat,
                amount: pickedDebuff.amount,
              },
            });

            const { error: updateTargetErr } = await supabase
              .from("profiles")
              .update({ active_buffs: targetActiveBuffs })
              .eq("id", targetProfile.id);
            if (updateTargetErr) throw updateTargetErr;
          }),
        );

        logMetadata.affectedTargets = targets.length;
        logMessage =
          targets.length > 0
            ? `Usou ${item.name} e aplicou Mogado em ${targets.length} jogador(es) por ${durationHours}h`
            : `Usou ${item.name}, mas não havia outros jogadores para receber Mogado`;
      } else if (
        item.effect_code === "TRANSFER_PAO" ||
        item.effect_code === "OUTSOURCE_AGUA"
      ) {
        activeBuffs.push({
          type:
            item.effect_code === "OUTSOURCE_AGUA"
              ? "OUTSOURCE_AGUA"
              : "TRANSFER_PAO",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        });
        updates.active_buffs = activeBuffs;
        logMessage =
          item.effect_code === "OUTSOURCE_AGUA"
            ? `Usou ${item.name} e terceirizará a próxima Água se for sorteado`
            : `Usou ${item.name} e transferirá o próximo Pão se for sorteado`;
      } else if (item.effect_code === "SOLO_REWARD_BOOST") {
        const xpBonus =
          typeof itemMetadata.xpBonus === "number" ? itemMetadata.xpBonus : 10;
        const coinBonus =
          typeof itemMetadata.coinBonus === "number"
            ? itemMetadata.coinBonus
            : 6;

        activeBuffs.push({
          type: "SOLO_XP_BONUS",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          value: xpBonus,
        });
        activeBuffs.push({
          type: "SOLO_COIN_BONUS",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          value: coinBonus,
        });
        updates.active_buffs = activeBuffs;
        logMessage = `Usou ${item.name} e preparou bonus para o próximo sorteio Solo`;
      } else if (item.effect_code === "FURA_OLHO") {
        activeBuffs.push({
          type: "FURA_OLHO",
          expiresAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        });
        updates.active_buffs = activeBuffs;
        logMessage = `Usou ${item.name} e tentará roubar a próxima recompensa de sorteado`;
      } else if (item.effect_code === "STEAL_INVENTORY_ITEM") {
        const { data: targetProfiles, error: targetErr } = await supabase
          .from("profiles")
          .select("id, name, inventory")
          .neq("id", profileId);
        if (targetErr) throw targetErr;

        const targets = (
          Array.isArray(targetProfiles) ? targetProfiles : []
        ).filter(
          (candidate: any) =>
            Array.isArray(candidate.inventory) &&
            candidate.inventory.some((entry: any) => (entry.qty ?? 0) > 0),
        );

        if (targets.length === 0) {
          logMessage = `Usou ${item.name}, mas não havia inventários para roubar`;
        } else {
          const target = targets[randomIndex(targets.length)];
          const targetInventory = Array.isArray(target.inventory)
            ? [...target.inventory]
            : [];
          const availableEntries = targetInventory.filter(
            (entry: any) => (entry.qty ?? 0) > 0,
          );
          const stolenEntry =
            availableEntries[randomIndex(availableEntries.length)];
          const targetEntryIndex = targetInventory.findIndex(
            (entry: any) => entry.item_id === stolenEntry.item_id,
          );
          targetInventory[targetEntryIndex].qty =
            (targetInventory[targetEntryIndex].qty ?? 1) - 1;
          const sanitizedTargetInventory = targetInventory.filter(
            (entry: any) => (entry.qty ?? 0) > 0,
          );

          inventory.push({ item_id: stolenEntry.item_id, qty: 1 });
          const mergedInventory: Array<{ item_id: string; qty: number }> = [];
          for (const entry of inventory) {
            const existing = mergedInventory.find(
              (candidate) => candidate.item_id === entry.item_id,
            );
            if (existing) {
              existing.qty += entry.qty ?? 1;
            } else {
              mergedInventory.push({
                item_id: entry.item_id,
                qty: entry.qty ?? 1,
              });
            }
          }
          updates.inventory = mergedInventory;

          const { error: updateTargetErr } = await supabase
            .from("profiles")
            .update({ inventory: sanitizedTargetInventory })
            .eq("id", target.id);
          if (updateTargetErr) throw updateTargetErr;

          logMessage = `Usou ${item.name} e roubou o item ${stolenEntry.item_id} de ${target.name}`;
        }
      }
      updates = applyProfileModifiersFromItem(profile, itemMetadata, updates);
      // Add more effects as needed

      const { data: updatedProfile, error: uErr } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", profileId)
        .select()
        .single();

      if (uErr) throw uErr;

      await supabase.from("battle_logs").insert([
        {
          event_type: "item_use",
          category: "system",
          message: logMessage,
          primary_actor_id: profileId,
          metadata: logMetadata,
        },
      ]);

      res.json(updatedProfile);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
    }
  });

  // Process Draw Results
  app.post("/api/draw/process", async (req, res) => {
    try {
      await initDb();
      if (!isSupabaseEnabled)
        return res
          .status(501)
          .json({ error: "Not implemented for SQLite yet" });

      const { category, winnerIds, participants } = req.body;

      const validCategories = ["pao", "agua", "balde", "geral", "solo"];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ error: "Invalid draw category" });
      }

      if (!Array.isArray(winnerIds) || winnerIds.length === 0) {
        return res
          .status(400)
          .json({ error: "winnerIds must be a non-empty array" });
      }

      if (!Array.isArray(participants)) {
        return res.status(400).json({ error: "participants must be an array" });
      }

      const normalizedWinnerIds = winnerIds
        .filter(
          (id: unknown): id is string =>
            typeof id === "string" && id.trim().length > 0,
        )
        .map((id: string) => id.trim());
      const normalizedParticipants = participants
        .filter(
          (id: unknown): id is string =>
            typeof id === "string" && id.trim().length > 0,
        )
        .map((id: string) => id.trim());

      if (normalizedWinnerIds.length === 0) {
        return res
          .status(400)
          .json({ error: "winnerIds contains no valid profile ids" });
      }

      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*");
      if (pErr) throw pErr;

      if (!Array.isArray(profiles) || profiles.length === 0) {
        return res.status(409).json({
          error: "No profiles available to process draw",
          details:
            "A API nao conseguiu ler perfis do banco. Verifique permissao/RLS e chave do Supabase.",
        });
      }

      const profileIds = new Set<string>(
        profiles.map((profile: any) => profile.id),
      );
      const requestedWinnerIds = normalizedWinnerIds.filter((id) =>
        profileIds.has(id),
      );
      const missingWinnerIds = normalizedWinnerIds.filter(
        (id) => !profileIds.has(id),
      );

      if (requestedWinnerIds.length === 0) {
        return res.status(409).json({
          error: "None of the requested winnerIds exist in profiles",
          missingWinnerIds,
        });
      }

      const participantSet = new Set<string>(
        normalizedParticipants.filter((id) => profileIds.has(id)),
      );

      const { data: shopItems, error: shopErr } = await supabase
        .from("shop_items")
        .select("id, name, effect_code, metadata");
      if (shopErr) throw shopErr;

      if (category === "solo") {
        participantSet.clear();
        participantSet.add(requestedWinnerIds[0]);
      }

      if (participantSet.size === 0) {
        return res.status(409).json({
          error: "No valid participants found for draw",
        });
      }

      const {
        updates,
        logs,
        rewards,
        winnerIds: resolvedWinnerIds,
      } = sharedProcessDrawOutcome({
        category,
        winnerIds: requestedWinnerIds,
        participants: Array.from(participantSet),
        profiles,
        shopItems: shopItems || [],
        enableDailyChallenges: true,
      });

      if (!updates.length) {
        return res.status(409).json({
          error: "Draw processing returned no profile updates",
          details:
            "Resultado invalido para sincronizacao: nenhuma atualizacao de perfil foi gerada.",
        });
      }

      if (category === "solo") {
        logs.push({
          event_type: "daily_challenge",
          category,
          message: "Missão Solo processada no sorteio Solo",
          primary_actor_id: resolvedWinnerIds[0] ?? requestedWinnerIds[0] ?? "",
        });
      }

      const unresolvedWinnerIds = resolvedWinnerIds.filter(
        (id) => !updates.some((profile) => profile.id === id),
      );
      if (unresolvedWinnerIds.length > 0) {
        return res.status(409).json({
          error: "Draw produced unresolved winner ids",
          unresolvedWinnerIds,
        });
      }

      const { error: uErr } = await supabase.from("profiles").upsert(updates);
      if (uErr) throw uErr;

      if (logs.length > 0) {
        const { error: logErr } = await supabase
          .from("battle_logs")
          .insert(logs);
        if (logErr) {
          console.error("Failed to persist draw logs:", logErr);
        }
      }

      res.json({
        success: true,
        updates,
        winnerIds: resolvedWinnerIds,
        rewards,
        warnings:
          missingWinnerIds.length > 0
            ? [{ type: "missing_winner_ids", ids: missingWinnerIds }]
            : [],
      });
    } catch (error) {
      const errorMessage = String(error);
      const isLikelyClassConstraintMismatch =
        errorMessage.includes("profiles_class_check") &&
        errorMessage.includes("violates check constraint");

      res.status(500).json({
        error: "Internal Server Error",
        details: errorMessage,
        hint: isLikelyClassConstraintMismatch
          ? "Constraint de classe desatualizada no banco. Rode supabase_phase3_reconcile.sql para incluir classes aprendiz_* no profiles_class_check."
          : undefined,
      });
    }
  });

  // Catch-all for API routes that don't exist
  app.all("/api/*", (req, res) => {
    res.status(404).json({
      error: "API Route Not Found",
      method: req.method,
      path: req.url,
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.error("Failed to initialize Vite middleware:", err);
    }
  } else if (!process.env.VERCEL) {
    // Only serve static files if NOT on Vercel (Vercel handles this via vercel.json)
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  cachedApp = app;
  return app;
}

// For local development
if (!process.env.VERCEL) {
  const PORT = 3000;
  createExpressApp().then((app) => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}

// Export for Vercel
export default async (req: any, res: any) => {
  // Simple raw health check to bypass Express if needed for debugging
  if (req.url === "/api/raw-health") {
    return res.status(200).json({ raw: "ok", vercel: !!process.env.VERCEL });
  }

  try {
    const app = await createExpressApp();
    return app(req, res);
  } catch (err) {
    console.error("CRITICAL SERVER ERROR:", err);
    res.setHeader("Content-Type", "application/json");
    res.status(500).send(
      JSON.stringify({
        error: "Critical server error",
        details: String(err),
        stack:
          process.env.NODE_ENV === "development"
            ? (err as Error).stack
            : undefined,
      }),
    );
  }
};
