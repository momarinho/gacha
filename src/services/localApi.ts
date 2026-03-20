import { processDrawOutcome } from "../../shared/drawLogic";
import { CUSTOM_TITLE_PREFIX } from "../app/constants";
import type {
  BattleLog,
  DailyChallengeState,
  ProcessDrawResponse,
  Profile,
  ShopBanner,
  ShopItem,
  ShopPullResult,
  SocialTitlesResponse,
} from "../types";

const LOCAL_DB_KEY = "devgacha_local_db_v1";
const SHOP_PULL_PRICE_SINGLE = 10;
const SHOP_PULL_PRICE_MULTI = 100;
const SHOP_RARE_PITY_THRESHOLD = 10;
const SHOP_LEGENDARY_PITY_THRESHOLD = 90;
const SHOP_BANNER_RATES = {
  standard: { common: 0.88, rare: 0.09, epic: 0.024, legendary: 0.006 },
  catastrophe: { common: 0.82, rare: 0.12, epic: 0.05, legendary: 0.01 },
} as const;
const SHOP_PITY_EXPIRES_AT = "2099-12-31T23:59:59.999Z";
const COIN_MAGNET_MULTIPLIER = 1.5;
const DEFAULT_RELIEF_LUCK_BONUS = 0.1;
const DEFAULT_MOGADO_DURATION_HOURS = 12;
const DEFAULT_MOGADO_OPTIONS = [
  { targetStat: "stat_foco", amount: 4, label: "Foco" },
  { targetStat: "stat_networking", amount: 4, label: "Networking" },
  { targetStat: "stat_malandragem", amount: 4, label: "Malandragem" },
  { targetStat: "luck", amount: 0.04, label: "Sorte" },
] as const;

type LocalDb = {
  profiles: Profile[];
  shopItems: ShopItem[];
  logs: BattleLog[];
};

function makeShopItems(): ShopItem[] {
  return [
    {
      id: "shop-heal-50",
      name: "Café Expresso",
      description: "Recupera 50% do HP/Sanidade instantaneamente.",
      price: 35,
      type: "consumable",
      rarity: "common",
      effect_code: "HEAL_PERCENT_50",
      icon: "Coffee",
      min_level: 1,
      stackable: true,
      metadata: { activation: "active" },
    },
    {
      id: "shop-heal-100",
      name: "Band-Aid Corporativo",
      description: "Recupera 100 HP instantaneamente.",
      price: 55,
      type: "consumable",
      rarity: "rare",
      effect_code: "HEAL_100",
      icon: "HeartPulse",
      min_level: 1,
      stackable: true,
      metadata: { activation: "active" },
    },
    {
      id: "shop-luck-8",
      name: "Capa de Fuga",
      description:
        "Aumenta sua chance de escapar de sorteios de risco por 24 horas.",
      price: 60,
      type: "consumable",
      rarity: "rare",
      effect_code: "RELIEF_LUCK_BOOST",
      icon: "Shield",
      min_level: 1,
      stackable: true,
      metadata: { activation: "active", luckBonus: 0.08, duration_hours: 24 },
    },
    {
      id: "shop-luck-4",
      name: "Crachá de Prioridade",
      description:
        "Aumenta levemente sua chance de escapar de sorteios de risco por 12 horas.",
      price: 40,
      type: "consumable",
      rarity: "common",
      effect_code: "RELIEF_LUCK_BOOST",
      icon: "Shield",
      min_level: 1,
      stackable: true,
      metadata: { activation: "active", luckBonus: 0.04, duration_hours: 12 },
    },
    {
      id: "shop-mogado-badge",
      name: "Selo Mogado",
      description:
        "Aplica o status Mogado nos outros jogadores, reduzindo aleatoriamente um status por 12 horas.",
      price: 30,
      type: "consumable",
      rarity: "common",
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
      id: "shop-luck-12",
      name: "VPN do Home Office",
      description:
        "Aumenta bastante sua chance de escapar de sorteios de risco por 48 horas.",
      price: 130,
      type: "rare",
      rarity: "epic",
      effect_code: "RELIEF_LUCK_BOOST",
      icon: "Shield",
      min_level: 2,
      stackable: true,
      metadata: { activation: "active", luckBonus: 0.12, duration_hours: 48 },
    },
    {
      id: "shop-skip-agua",
      name: "Atestado de Agua",
      description:
        "Prepara imunidade para a próxima Água e joga o turno para outro participante aleatório.",
      price: 85,
      type: "consumable",
      rarity: "rare",
      effect_code: "SKIP_AGUA_NEXT",
      icon: "Shield",
      min_level: 1,
      stackable: true,
      target_category: "agua",
      metadata: { activation: "active" },
    },
    {
      id: "shop-agua-shield",
      name: "Boia Corporativa",
      description: "Reduz o impacto da próxima Água para você.",
      price: 70,
      type: "consumable",
      rarity: "rare",
      effect_code: "AGUA_SHIELD",
      icon: "Shield",
      min_level: 1,
      stackable: true,
      target_category: "agua",
      metadata: { activation: "active", damageReduction: 6 },
    },
    {
      id: "shop-skip-balde",
      name: "Relatório Falso",
      description: "Te tira do próximo sorteio de Balde.",
      price: 120,
      type: "consumable",
      rarity: "rare",
      effect_code: "SKIP_BALDE_NEXT",
      icon: "Shield",
      min_level: 1,
      stackable: true,
      target_category: "balde",
      metadata: { activation: "active" },
    },
    {
      id: "shop-coin-lite",
      name: "Imã de Moedas Lite",
      description:
        "Aumenta modestamente seus ganhos de SetorCoins por 30 minutos.",
      price: 95,
      type: "passive",
      rarity: "rare",
      effect_code: "COIN_MAGNET",
      icon: "Coins",
      min_level: 1,
      duration_minutes: 30,
      stackable: false,
      metadata: { activation: "active", multiplier: 1.2 },
    },
    {
      id: "shop-coin-std",
      name: "Imã de Moedas",
      description: "Aumenta seus ganhos de SetorCoins por 1 hora.",
      price: 180,
      type: "passive",
      rarity: "epic",
      effect_code: "COIN_MAGNET",
      icon: "Coins",
      min_level: 2,
      duration_minutes: 60,
      stackable: false,
      metadata: { activation: "active", multiplier: 1.5 },
    },
    {
      id: "shop-coin-turbo",
      name: "Imã de Moedas Turbo",
      description: "Dispara seus ganhos de SetorCoins por 90 minutos.",
      price: 220,
      type: "rare",
      rarity: "legendary",
      effect_code: "COIN_MAGNET",
      icon: "Coins",
      min_level: 3,
      duration_minutes: 90,
      stackable: false,
      metadata: { activation: "active", multiplier: 1.8 },
    },
    {
      id: "shop-transfer-pao",
      name: "Procuração do Pão",
      description:
        "Se você for sorteado no Pão, transfere o problema para outro participante.",
      price: 140,
      type: "rare",
      rarity: "epic",
      effect_code: "TRANSFER_PAO",
      icon: "ScrollText",
      min_level: 2,
      stackable: true,
      target_category: "pao",
      metadata: { activation: "active" },
    },
    {
      id: "shop-outsource-agua",
      name: "Contrato de Terceirização",
      description:
        "Se você for sorteado na Água, tenta terceirizar o turno para outro participante.",
      price: 180,
      type: "rare",
      rarity: "legendary",
      effect_code: "OUTSOURCE_AGUA",
      icon: "RefreshCw",
      min_level: 3,
      stackable: true,
      target_category: "agua",
      metadata: { activation: "active" },
    },
    {
      id: "shop-auto-outsource-agua",
      name: "Boia de Emergencia",
      description:
        "Fica no inventário e terceiriza automaticamente a próxima Água em que você for sorteado.",
      price: 165,
      type: "rare",
      rarity: "epic",
      effect_code: "AUTO_OUTSOURCE_AGUA",
      icon: "RefreshCw",
      min_level: 2,
      stackable: true,
      target_category: "agua",
      metadata: { activation: "auto" },
    },
    {
      id: "shop-auto-transfer-pao",
      name: "Seguro Catastrofe",
      description:
        "Fica no inventário e transfere automaticamente o próximo Pão para outro participante elegível.",
      price: 230,
      type: "rare",
      rarity: "legendary",
      effect_code: "AUTO_TRANSFER_PAO",
      icon: "ScrollText",
      min_level: 3,
      stackable: true,
      target_category: "pao",
      metadata: { activation: "auto" },
    },
    {
      id: "shop-auto-balde-shield",
      name: "Colete Anti-Balde",
      description:
        "Fica no inventário e reduz automaticamente o dano do próximo Balde.",
      price: 110,
      type: "consumable",
      rarity: "rare",
      effect_code: "AUTO_BALDE_SHIELD",
      icon: "Shield",
      min_level: 1,
      stackable: true,
      target_category: "balde",
      metadata: { activation: "auto", damageReduction: 12 },
    },
    {
      id: "shop-solo-boost",
      name: "Vale Hora Extra",
      description:
        "No próximo sorteio Solo, você recebe bônus extra de XP e moedas.",
      price: 160,
      type: "rare",
      rarity: "epic",
      effect_code: "SOLO_REWARD_BOOST",
      icon: "BriefcaseBusiness",
      min_level: 1,
      stackable: true,
      metadata: { activation: "active", xpBonus: 10, coinBonus: 6 },
    },
    {
      id: "shop-solo-boost-big",
      name: "Plantão Heroico",
      description:
        "No próximo sorteio Solo, você recebe um bônus absurdo de XP e moedas.",
      price: 210,
      type: "rare",
      rarity: "legendary",
      effect_code: "SOLO_REWARD_BOOST",
      icon: "BriefcaseBusiness",
      min_level: 3,
      stackable: true,
      metadata: { activation: "active", xpBonus: 18, coinBonus: 12 },
    },
  ];
}

function defaultDb(): LocalDb {
  return {
    profiles: [],
    shopItems: makeShopItems(),
    logs: [],
  };
}

function loadDb(): LocalDb {
  const raw = localStorage.getItem(LOCAL_DB_KEY);
  if (!raw) {
    const db = defaultDb();
    saveDb(db);
    return db;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<LocalDb>;
    return {
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles : [],
      shopItems:
        Array.isArray(parsed.shopItems) && parsed.shopItems.length > 0
          ? parsed.shopItems
          : makeShopItems(),
      logs: Array.isArray(parsed.logs) ? parsed.logs : [],
    };
  } catch {
    const db = defaultDb();
    saveDb(db);
    return db;
  }
}

function saveDb(db: LocalDb) {
  localStorage.setItem(LOCAL_DB_KEY, JSON.stringify(db));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function addLog(
  db: LocalDb,
  log: Omit<BattleLog, "id" | "created_at" | "profiles"> & {
    profiles?: BattleLog["profiles"];
  },
) {
  db.logs.unshift({
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...log,
  });
}

function getProfileOrThrow(db: LocalDb, profileId: string) {
  const profile = db.profiles.find((entry) => entry.id === profileId);
  if (!profile) throw new Error("Profile not found");
  return profile;
}

function getItemOrThrow(db: LocalDb, itemId: string) {
  const item = db.shopItems.find((entry) => entry.id === itemId);
  if (!item) throw new Error("Item not found");
  return item;
}

function getEffectiveShopPrice(item: ShopItem) {
  if (item.effect_code === "HEAL_PERCENT_50") return 35;
  if (item.effect_code === "OUTSOURCE_AGUA") return 180;
  return item.price;
}

function getChargedItemPrice(profile: Profile, item: ShopItem) {
  const basePrice = getEffectiveShopPrice(item);
  if (profile.class === "mago") return Math.ceil(basePrice * 0.85);
  if (profile.class === "aprendiz_mago") return Math.ceil(basePrice * 0.92);
  return basePrice;
}

function getPityBuffType(banner: ShopBanner, type: "rare" | "legendary") {
  if (banner === "catastrophe") {
    return type === "rare"
      ? "SHOP_PITY_RARE_CATASTROPHE"
      : "SHOP_PITY_LEGENDARY_CATASTROPHE";
  }
  return type === "rare" ? "SHOP_PITY_RARE" : "SHOP_PITY_LEGENDARY";
}

function getPityCount(
  profile: Profile,
  banner: ShopBanner,
  type: "rare" | "legendary",
) {
  const buffType = getPityBuffType(banner, type);
  const pityBuff = profile.active_buffs.find((buff) => buff.type === buffType);
  return typeof pityBuff?.value === "number"
    ? Math.max(0, Math.floor(pityBuff.value))
    : 0;
}

function setPityCount(
  profile: Profile,
  banner: ShopBanner,
  type: "rare" | "legendary",
  value: number,
) {
  const buffType = getPityBuffType(banner, type);
  profile.active_buffs = profile.active_buffs.filter(
    (buff) => buff.type !== buffType,
  );
  profile.active_buffs.push({
    type: buffType,
    expiresAt: SHOP_PITY_EXPIRES_AT,
    value: Math.max(0, Math.floor(value)),
  });
}

function getBannerForItem(item: ShopItem): ShopBanner {
  const catastropheEffects = new Set([
    "TRANSFER_PAO",
    "AUTO_TRANSFER_PAO",
    "SKIP_BALDE_NEXT",
    "AUTO_BALDE_SHIELD",
    "HEAL_PERCENT_50",
    "HEAL_100",
  ]);
  if (
    item.target_category === "pao" ||
    item.target_category === "balde" ||
    catastropheEffects.has(item.effect_code)
  ) {
    return "catastrophe";
  }
  return "standard";
}

function pickWeightedItem(items: ShopItem[]) {
  const totalWeight = items.reduce(
    (sum, item) => sum + Math.max(1, Math.round(400 / Math.max(1, item.price))),
    0,
  );
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  let target = array[0] % totalWeight;
  for (const item of items) {
    target -= Math.max(1, Math.round(400 / Math.max(1, item.price)));
    if (target < 0) return item;
  }
  return items[items.length - 1];
}

function pickRarity(
  banner: ShopBanner,
  forceRareOrBetter: boolean,
  forceLegendary: boolean,
) {
  if (forceLegendary) return "legendary" as const;
  const baseRates = SHOP_BANNER_RATES[banner];
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
    if (roll <= 0) return rarity as "common" | "rare" | "epic" | "legendary";
  }
  return forceRareOrBetter ? "rare" : "common";
}

function applyProfileModifiersFromItem(
  currentProfile: Profile,
  metadata: Record<string, any>,
  updates: Partial<Profile>,
) {
  const modifiers = metadata.profileModifiers;
  if (!modifiers || typeof modifiers !== "object") return updates;
  if (
    typeof modifiers.passive_coin_multiplier === "number" &&
    modifiers.passive_coin_multiplier > 0
  ) {
    updates.passive_coin_multiplier = Number(
      (
        (currentProfile.passive_coin_multiplier || 1) *
        modifiers.passive_coin_multiplier
      ).toFixed(2),
    );
  }
  if (
    typeof modifiers.temporary_coin_multiplier === "number" &&
    modifiers.temporary_coin_multiplier > 0
  ) {
    updates.temporary_coin_multiplier = Number(
      (
        (currentProfile.temporary_coin_multiplier || 1) *
        modifiers.temporary_coin_multiplier
      ).toFixed(2),
    );
  }
  if (typeof modifiers.exhaustion_threshold === "number") {
    updates.exhaustion_threshold = modifiers.exhaustion_threshold;
  }
  if (typeof modifiers.exhaustion_penalty_multiplier === "number") {
    updates.exhaustion_penalty_multiplier =
      modifiers.exhaustion_penalty_multiplier;
  }
  if (typeof modifiers.luck === "number") {
    updates.luck = Number(
      ((currentProfile.luck || 0) + modifiers.luck).toFixed(3),
    );
  }
  return updates;
}

function buildTitlesResponse(profiles: Profile[]): SocialTitlesResponse {
  return {
    titlesByProfileId: profiles.reduce<Record<string, string[]>>(
      (acc, profile) => {
        acc[profile.id] = profile.titles.filter(
          (title) => !title.startsWith(CUSTOM_TITLE_PREFIX),
        );
        return acc;
      },
      {},
    ),
  };
}

export const localApi = {
  getProfiles(): Profile[] {
    const db = loadDb();
    return clone(db.profiles).sort((a, b) => a.name.localeCompare(b.name));
  },
  createProfile(profile: Partial<Profile>): Profile {
    const db = loadDb();
    const newProfile: Profile = {
      id: crypto.randomUUID(),
      name: String(profile.name || "").trim(),
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
      inventory: [],
      active_buffs: [],
      daily_challenge_state: null as DailyChallengeState | null,
      participates_in_pao: true,
      participates_in_agua: true,
      participates_in_balde: true,
      participates_in_geral: true,
      stat_points: 0,
      stat_foco: 0,
      stat_resiliencia: 0,
      stat_networking: 0,
      stat_malandragem: 0,
      created_at: new Date().toISOString(),
      ...profile,
    };
    db.profiles.push(newProfile);
    saveDb(db);
    return clone(newProfile);
  },
  updateProfile(id: string, updates: Partial<Profile>): Profile {
    const db = loadDb();
    const profile = getProfileOrThrow(db, id);
    Object.assign(profile, updates);
    saveDb(db);
    return clone(profile);
  },
  deleteProfile(id: string): void {
    const db = loadDb();
    db.profiles = db.profiles.filter((profile) => profile.id !== id);
    db.logs = db.logs.filter((log) => log.primary_actor_id !== id);
    saveDb(db);
  },
  getShopItems(): ShopItem[] {
    const db = loadDb();
    return clone(db.shopItems).sort((a, b) => a.price - b.price);
  },
  getLogs(): BattleLog[] {
    const db = loadDb();
    return clone(db.logs);
  },
  getTitles(): SocialTitlesResponse {
    const db = loadDb();
    return buildTitlesResponse(db.profiles);
  },
  allocateStat(
    profileId: string,
    stat:
      | "stat_foco"
      | "stat_resiliencia"
      | "stat_networking"
      | "stat_malandragem",
  ): Profile {
    const db = loadDb();
    const profile = getProfileOrThrow(db, profileId);
    if ((profile.stat_points || 0) <= 0) throw new Error("No stat points");
    profile.stat_points -= 1;
    (profile[stat] as number) = ((profile[stat] as number) || 0) + 1;
    if (stat === "stat_resiliencia") {
      profile.max_hp += 1;
      profile.hp += 1;
    }
    saveDb(db);
    return clone(profile);
  },
  buyItem(profileId: string, itemId: string): Profile {
    const db = loadDb();
    const profile = getProfileOrThrow(db, profileId);
    const item = getItemOrThrow(db, itemId);
    const chargedPrice = getChargedItemPrice(profile, item);
    if (profile.coins < chargedPrice) throw new Error("Not enough coins");
    if (profile.level < item.min_level) throw new Error("Level too low");
    profile.coins -= chargedPrice;
    const existing = profile.inventory.find(
      (entry) => entry.item_id === itemId,
    );
    if (existing) existing.qty = (existing.qty ?? 1) + 1;
    else profile.inventory.push({ item_id: itemId, qty: 1 });
    addLog(db, {
      event_type: "item_buy",
      category: "system",
      message: `Comprou ${item.name}`,
      primary_actor_id: profileId,
      metadata: { itemId, coinsChanged: -chargedPrice },
    });
    saveDb(db);
    return clone(profile);
  },
  useItem(profileId: string, itemId: string): Profile {
    const db = loadDb();
    const profile = getProfileOrThrow(db, profileId);
    const item = getItemOrThrow(db, itemId);
    const metadata =
      item.metadata && typeof item.metadata === "object" ? item.metadata : {};
    if (metadata.activation === "auto")
      throw new Error("Automatic items cannot be used manually");
    const inventoryEntry = profile.inventory.find(
      (entry) => entry.item_id === itemId,
    );
    if (!inventoryEntry || inventoryEntry.qty <= 0)
      throw new Error("Item not found in inventory");
    inventoryEntry.qty = (inventoryEntry.qty ?? 1) - 1;
    if (inventoryEntry.qty === 0) {
      profile.inventory = profile.inventory.filter(
        (entry) => entry.item_id !== itemId,
      );
    }
    let logMessage = `Usou ${item.name}`;
    const activeBuffs = Array.isArray(profile.active_buffs)
      ? [...profile.active_buffs]
      : [];
    const durationMinutes =
      typeof item.duration_minutes === "number" && item.duration_minutes > 0
        ? item.duration_minutes
        : 60;
    if (item.effect_code === "HEAL_PERCENT_50") {
      const recoveredHp = Math.max(1, Math.ceil(profile.max_hp * 0.5));
      profile.hp = Math.min(profile.max_hp, profile.hp + recoveredHp);
      logMessage = `Usou ${item.name} e recuperou ${recoveredHp} HP`;
    } else if (item.effect_code === "HEAL_100") {
      profile.hp = Math.min(profile.max_hp, profile.hp + 100);
      logMessage = `Usou ${item.name} e recuperou 100 HP`;
    } else if (item.effect_code === "SKIP_BALDE_NEXT") {
      activeBuffs.push({
        type: "SKIP_BALDE",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      profile.active_buffs = activeBuffs;
      logMessage = `Usou ${item.name} e ficará fora do próximo Balde`;
    } else if (item.effect_code === "SKIP_AGUA_NEXT") {
      activeBuffs.push({
        type: "OUTSOURCE_AGUA",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      profile.active_buffs = activeBuffs;
      logMessage = `Usou ${item.name} e terceirizará a próxima Água para outro participante aleatório`;
    } else if (item.effect_code === "AGUA_SHIELD") {
      const damageReduction =
        typeof metadata.damageReduction === "number"
          ? metadata.damageReduction
          : 6;
      activeBuffs.push({
        type: "AGUA_SHIELD",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        value: damageReduction,
      });
      profile.active_buffs = activeBuffs;
      logMessage = `Usou ${item.name} e reduzirá o impacto da próxima Água em ${damageReduction} HP`;
    } else if (item.effect_code === "COIN_MAGNET") {
      const multiplier =
        typeof metadata.multiplier === "number" && metadata.multiplier > 1
          ? metadata.multiplier
          : COIN_MAGNET_MULTIPLIER;
      activeBuffs.push({
        type: "COIN_MAGNET",
        expiresAt: new Date(
          Date.now() + durationMinutes * 60 * 1000,
        ).toISOString(),
        value: multiplier,
      });
      profile.active_buffs = activeBuffs;
      profile.temporary_coin_multiplier = multiplier;
      logMessage = `Usou ${item.name} e aumentou seus ganhos de SetorCoins por ${durationMinutes} min`;
    } else if (item.effect_code === "RELIEF_LUCK_BOOST") {
      const luckBonus =
        typeof metadata.luckBonus === "number"
          ? metadata.luckBonus
          : DEFAULT_RELIEF_LUCK_BONUS;
      const durationHours =
        typeof metadata.duration_hours === "number"
          ? metadata.duration_hours
          : 24;
      activeBuffs.push({
        type: "RELIEF_LUCK",
        expiresAt: new Date(
          Date.now() + durationHours * 60 * 60 * 1000,
        ).toISOString(),
        value: luckBonus,
      });
      profile.active_buffs = activeBuffs;
      logMessage = `Usou ${item.name} e ganhou +${luckBonus.toFixed(2)} de sorte por ${durationHours}h`;
    } else if (item.effect_code === "MOGADO_DEBUFF") {
      const durationHours =
        typeof metadata.duration_hours === "number" &&
        metadata.duration_hours > 0
          ? metadata.duration_hours
          : DEFAULT_MOGADO_DURATION_HOURS;
      const metadataOptions = Array.isArray(metadata.debuffOptions)
        ? metadata.debuffOptions
            .filter(
              (
                entry,
              ): entry is {
                targetStat: string;
                amount: number;
                label?: string;
              } => {
                if (!entry || typeof entry !== "object") return false;
                const targetStat = (entry as { targetStat?: unknown })
                  .targetStat;
                const amount = (entry as { amount?: unknown }).amount;
                return (
                  typeof targetStat === "string" &&
                  typeof amount === "number" &&
                  amount > 0
                );
              },
            )
            .map((entry) => ({
              targetStat: entry.targetStat,
              amount: entry.amount,
              label: entry.label,
            }))
        : [];
      const debuffPool =
        metadataOptions.length > 0
          ? metadataOptions
          : [...DEFAULT_MOGADO_OPTIONS];
      const targets = db.profiles.filter(
        (candidate) => candidate.id !== profileId,
      );

      for (const target of targets) {
        const targetBuffs = Array.isArray(target.active_buffs)
          ? [...target.active_buffs]
          : [];
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        const pickedDebuff = debuffPool[randomArray[0] % debuffPool.length];

        targetBuffs.push({
          type: "MOGADO",
          expiresAt: new Date(
            Date.now() + durationHours * 60 * 60 * 1000,
          ).toISOString(),
          metadata: {
            targetStat: pickedDebuff.targetStat,
            amount: pickedDebuff.amount,
          },
        });
        target.active_buffs = targetBuffs;
      }

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
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      profile.active_buffs = activeBuffs;
      logMessage =
        item.effect_code === "OUTSOURCE_AGUA"
          ? `Usou ${item.name} e terceirizará a próxima Água se for sorteado`
          : `Usou ${item.name} e transferirá o próximo Pão se for sorteado`;
    } else if (item.effect_code === "SOLO_REWARD_BOOST") {
      const xpBonus =
        typeof metadata.xpBonus === "number" ? metadata.xpBonus : 10;
      const coinBonus =
        typeof metadata.coinBonus === "number" ? metadata.coinBonus : 6;
      activeBuffs.push({
        type: "SOLO_XP_BONUS",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        value: xpBonus,
      });
      activeBuffs.push({
        type: "SOLO_COIN_BONUS",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        value: coinBonus,
      });
      profile.active_buffs = activeBuffs;
      logMessage = `Usou ${item.name} e preparou bonus para o próximo sorteio Solo`;
    }
    applyProfileModifiersFromItem(profile, metadata, profile);
    addLog(db, {
      event_type: "item_use",
      category: "system",
      message: logMessage,
      primary_actor_id: profileId,
      metadata: { itemId, effect: item.effect_code },
    });
    saveDb(db);
    return clone(profile);
  },
  pullShopItems(
    profileId: string,
    count: 1 | 10,
    banner: ShopBanner,
  ): ShopPullResult {
    const db = loadDb();
    const profile = getProfileOrThrow(db, profileId);
    const poolItems = db.shopItems.filter(
      (item) => getBannerForItem(item) === banner,
    );
    if (poolItems.length === 0) throw new Error("Shop pool is empty");
    const chargedPrice =
      profile.class === "mago"
        ? Math.ceil(
            (count === 10 ? SHOP_PULL_PRICE_MULTI : SHOP_PULL_PRICE_SINGLE) *
              0.85,
          )
        : profile.class === "aprendiz_mago"
          ? Math.ceil(
              (count === 10 ? SHOP_PULL_PRICE_MULTI : SHOP_PULL_PRICE_SINGLE) *
                0.92,
            )
          : count === 10
            ? SHOP_PULL_PRICE_MULTI
            : SHOP_PULL_PRICE_SINGLE;
    if (profile.coins < chargedPrice) throw new Error("Not enough coins");

    let pityToRare = getPityCount(profile, banner, "rare");
    let pityToLegendary = getPityCount(profile, banner, "legendary");
    const drops: ShopPullResult["drops"] = [];

    for (let index = 0; index < count; index++) {
      const forceLegendary =
        pityToLegendary + 1 >= SHOP_LEGENDARY_PITY_THRESHOLD;
      const forceRareOrBetter =
        forceLegendary || pityToRare + 1 >= SHOP_RARE_PITY_THRESHOLD;
      let rarity = pickRarity(banner, forceRareOrBetter, forceLegendary);
      let pool = poolItems.filter((item) => item.rarity === rarity);
      if (pool.length === 0 && rarity === "legendary") {
        rarity = "epic";
        pool = poolItems.filter((item) => item.rarity === rarity);
      }
      if (pool.length === 0 && rarity === "epic") {
        rarity = "rare";
        pool = poolItems.filter((item) => item.rarity === rarity);
      }
      if (pool.length === 0 && rarity === "rare") {
        rarity = "common";
        pool = poolItems.filter((item) => item.rarity === rarity);
      }
      if (pool.length === 0) pool = poolItems;
      const awardedItem = pickWeightedItem(pool);
      const existing = profile.inventory.find(
        (entry) => entry.item_id === awardedItem.id,
      );
      if (existing) existing.qty = (existing.qty ?? 1) + 1;
      else profile.inventory.push({ item_id: awardedItem.id, qty: 1 });
      drops.push({
        item: clone(awardedItem),
        rarity: awardedItem.rarity || rarity,
        isGuaranteed:
          forceLegendary || (forceRareOrBetter && rarity !== "common"),
      });
      pityToRare = rarity === "common" ? pityToRare + 1 : 0;
      pityToLegendary = rarity === "legendary" ? 0 : pityToLegendary + 1;
    }

    setPityCount(profile, banner, "rare", pityToRare);
    setPityCount(profile, banner, "legendary", pityToLegendary);
    profile.coins -= chargedPrice;

    addLog(db, {
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
      },
    });
    saveDb(db);
    return {
      profile: clone(profile),
      banner,
      spentCoins: chargedPrice,
      totalPulls: count,
      pityToRare,
      pityToLegendary,
      drops,
    };
  },
  processDraw(
    category: string,
    winnerIds: string[],
    participants: string[],
  ): ProcessDrawResponse {
    const db = loadDb();
    const participantSet = new Set(participants);
    if (category === "solo" && winnerIds[0]) {
      participantSet.clear();
      participantSet.add(winnerIds[0]);
    }
    const result = processDrawOutcome({
      category: category as ProcessDrawResponse["rewards"][number]["category"],
      winnerIds,
      participants: Array.from(participantSet),
      profiles: clone(db.profiles),
      shopItems: db.shopItems.map((item) => ({
        id: item.id,
        name: item.name,
        effect_code: item.effect_code,
        metadata: item.metadata,
      })),
      enableDailyChallenges: true,
    });
    db.profiles = result.updates as Profile[];
    for (const log of result.logs) {
      addLog(db, {
        event_type: log.event_type,
        category: log.category,
        message: log.message,
        primary_actor_id: log.primary_actor_id,
        metadata: log.metadata,
      });
    }
    saveDb(db);
    return {
      success: true,
      updates: clone(db.profiles),
      winnerIds: result.winnerIds,
      rewards: result.rewards,
    };
  },
};
