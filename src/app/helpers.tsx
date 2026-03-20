import type { ReactNode } from "react";

import { Crosshair, Heart, Shield, Wand2 } from "lucide-react";

import type {
  BattleLog,
  Profile,
  ProfileClass,
  ShopBanner,
  ShopItem,
} from "../types";
import {
  APPRENTICE_UNLOCK_LEVEL,
  CUSTOM_TITLE_PREFIX,
  FINAL_CLASS_UNLOCK_LEVEL,
  RECENT_EFFECT_WINDOW_MS,
} from "./constants";

export function getCustomTitle(profile: Profile) {
  const customTitle = profile.titles.find((title) =>
    title.startsWith(CUSTOM_TITLE_PREFIX),
  );
  return customTitle ? customTitle.slice(CUSTOM_TITLE_PREFIX.length) : "";
}

export function getSecureRandomInt(max: number) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

export function resolveWinnerNames(
  winnerIds: string[],
  updatedProfiles: Profile[],
) {
  const profileMap = new Map(
    updatedProfiles.map((profile) => [profile.id, profile.name]),
  );
  return winnerIds.map(
    (winnerId) => profileMap.get(winnerId) ?? "Desconhecido",
  );
}

export function getHighestLevel(profiles: Profile[]) {
  return profiles.reduce(
    (maxLevel, profile) => Math.max(maxLevel, profile.level),
    1,
  );
}

export function getExhaustionState(profile: Profile) {
  const hpRatio = profile.max_hp > 0 ? profile.hp / profile.max_hp : 0;
  const exhausted = hpRatio <= profile.exhaustion_threshold;

  if (hpRatio <= 0.15) {
    return {
      exhausted,
      label: "Crítico",
      tone: "critical" as const,
    };
  }

  if (exhausted) {
    return {
      exhausted,
      label: "Exaurido",
      tone: "warning" as const,
    };
  }

  return {
    exhausted: false,
    label: "Estável",
    tone: "safe" as const,
  };
}

export function getClassLabel(profileClass: ProfileClass) {
  switch (profileClass) {
    case "aprendiz_guerreiro":
      return "Aprendiz Guerreiro";
    case "aprendiz_mago":
      return "Aprendiz Mago";
    case "aprendiz_ladino":
      return "Aprendiz Ladino";
    case "aprendiz_clerigo":
      return "Aprendiz Clérigo";
    case "guerreiro":
      return "Guerreiro";
    case "mago":
      return "Mago";
    case "ladino":
      return "Ladino";
    case "clerigo":
      return "Clérigo";
    default:
      return "Novato";
  }
}

export function getClassPowerText(profileClass: Profile["class"]) {
  switch (profileClass) {
    case "aprendiz_guerreiro":
      return "Aprendiz: -20% de dano ruim enquanto treina.";
    case "aprendiz_mago":
      return "Aprendiz: -8% na loja e treino arcano básico.";
    case "aprendiz_ladino":
      return "Aprendiz: +5% SetorCoins quando não é sorteado.";
    case "aprendiz_clerigo":
      return "Aprendiz: recuperação acelerada após ser sorteado no Pão.";
    case "guerreiro":
      return "Tanque: -40% de dano ruim e +5 XP por sorteio.";
    case "mago":
      return "Arcano: -15% na loja e visão das filas e logs.";
    case "ladino":
      return "Esquiva: 5% de fuga e +15% SetorCoins quando não é sorteado.";
    case "clerigo":
      return "Suporte: aura de SetorCoins e recuperação pós-Pão melhorada.";
    default:
      return "Novato: +10% XP enquanto aprende o sistema.";
  }
}

export function getItemEffectText(item: ShopItem) {
  const metadata =
    item.metadata && typeof item.metadata === "object" ? item.metadata : {};
  const profileModifiers =
    metadata.profileModifiers && typeof metadata.profileModifiers === "object"
      ? metadata.profileModifiers
      : {};

  if (
    typeof metadata.multiplier === "number" &&
    item.effect_code === "COIN_MAGNET"
  ) {
    const duration = item.duration_minutes || 60;
    return `x${metadata.multiplier.toFixed(2)} moedas por ${duration} min`;
  }

  if (
    typeof metadata.luckBonus === "number" &&
    item.effect_code === "RELIEF_LUCK_BOOST"
  ) {
    const durationHours =
      typeof metadata.duration_hours === "number"
        ? metadata.duration_hours
        : 24;
    return `Sorte +${metadata.luckBonus.toFixed(2)} por ${durationHours}h`;
  }

  if (item.effect_code === "SKIP_AGUA_NEXT") {
    return "Terceiriza a próxima Água para outro participante aleatório";
  }

  if (
    item.effect_code === "AGUA_SHIELD" &&
    typeof metadata.damageReduction === "number"
  ) {
    return `Reduz a próxima Água em ${metadata.damageReduction} HP`;
  }

  if (
    item.effect_code === "SOLO_REWARD_BOOST" &&
    (typeof metadata.xpBonus === "number" ||
      typeof metadata.coinBonus === "number")
  ) {
    const xpBonus = typeof metadata.xpBonus === "number" ? metadata.xpBonus : 0;
    const coinBonus =
      typeof metadata.coinBonus === "number" ? metadata.coinBonus : 0;
    return `Próximo Solo: +${xpBonus} XP e +${coinBonus} $C`;
  }

  if (item.effect_code === "MOGADO_DEBUFF") {
    const durationHours =
      typeof metadata.duration_hours === "number" && metadata.duration_hours > 0
        ? metadata.duration_hours
        : 12;
    return `Aplica Mogado nos outros jogadores: debuff aleatório de status por ${durationHours}h`;
  }

  if (typeof profileModifiers.passive_coin_multiplier === "number") {
    return `Economia passiva x${profileModifiers.passive_coin_multiplier.toFixed(2)}`;
  }

  if (typeof profileModifiers.luck === "number") {
    return `Sorte +${profileModifiers.luck.toFixed(2)}`;
  }

  if (item.effect_code === "AUTO_TRANSFER_PAO") {
    return "Dispara sozinho no próximo Pão e transfere para outro participante";
  }

  if (item.effect_code === "AUTO_OUTSOURCE_AGUA") {
    return "Dispara sozinho na próxima Água e terceiriza o turno";
  }

  if (
    item.effect_code === "AUTO_BALDE_SHIELD" &&
    typeof metadata.damageReduction === "number"
  ) {
    return `Dispara sozinho no próximo Balde e reduz ${metadata.damageReduction} HP`;
  }

  return null;
}

export function getItemActivationType(item: ShopItem) {
  const metadata =
    item.metadata && typeof item.metadata === "object" ? item.metadata : {};
  return metadata.activation === "auto" ? "auto" : "active";
}

export function getItemActivationLabel(item: ShopItem) {
  return getItemActivationType(item) === "auto"
    ? "Automático"
    : "Usar antes";
}

export function getShopPullPrice(
  profile: Pick<Profile, "class"> | null | undefined,
  count: 1 | 10,
) {
  const basePrice = count === 10 ? 100 : 10;

  if (!profile) return basePrice;
  if (profile.class === "mago") return Math.ceil(basePrice * 0.85);
  if (profile.class === "aprendiz_mago") return Math.ceil(basePrice * 0.92);
  return basePrice;
}

export function getShopBannerLabel(banner: ShopBanner) {
  return banner === "catastrophe" ? "Catástrofe" : "Padrão";
}

export function getShopPityBuffType(
  banner: ShopBanner,
  type: "rare" | "legendary",
) {
  if (banner === "catastrophe") {
    return type === "rare"
      ? "SHOP_PITY_RARE_CATASTROPHE"
      : "SHOP_PITY_LEGENDARY_CATASTROPHE";
  }

  return type === "rare" ? "SHOP_PITY_RARE" : "SHOP_PITY_LEGENDARY";
}

export function getShopRarityLabel(rarity?: ShopItem["rarity"]) {
  switch (rarity) {
    case "legendary":
      return "Lendário";
    case "epic":
      return "Épico";
    case "rare":
      return "Raro";
    default:
      return "Comum";
  }
}

export function getShopPityCount(
  profile: Pick<Profile, "active_buffs"> | null | undefined,
  type: "rare" | "legendary",
  banner: ShopBanner = "standard",
) {
  if (!profile || !Array.isArray(profile.active_buffs)) return 0;

  const buffType = getShopPityBuffType(banner, type);
  const pityBuff = profile.active_buffs.find((buff) => buff.type === buffType);
  return typeof pityBuff?.value === "number" && pityBuff.value > 0
    ? Math.floor(pityBuff.value)
    : 0;
}

export function getClassProgressionOptions(profile: Profile) {
  if (profile.class === "novato") {
    if (profile.level < APPRENTICE_UNLOCK_LEVEL) return [];
    return [
      "aprendiz_guerreiro",
      "aprendiz_mago",
      "aprendiz_ladino",
      "aprendiz_clerigo",
    ] as ProfileClass[];
  }

  if (profile.level < FINAL_CLASS_UNLOCK_LEVEL) return [];

  if (profile.class === "aprendiz_guerreiro")
    return ["guerreiro"] as ProfileClass[];
  if (profile.class === "aprendiz_mago") return ["mago"] as ProfileClass[];
  if (profile.class === "aprendiz_ladino") return ["ladino"] as ProfileClass[];
  if (profile.class === "aprendiz_clerigo")
    return ["clerigo"] as ProfileClass[];

  return [];
}

export function buildRecentClassEffectsByProfileId(
  profiles: Profile[],
  battleLogs: BattleLog[],
) {
  const recentLogs = [...battleLogs]
    .filter((entry) => {
      const createdAt = new Date(entry.created_at).getTime();
      return Number.isFinite(createdAt)
        ? Date.now() - createdAt <= RECENT_EFFECT_WINDOW_MS
        : false;
    })
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

  return recentLogs.reduce<
    Record<
      string,
      {
        label: string;
        detail: string;
        cardClassName: string;
        badgeClassName: string;
      }
    >
  >((acc, entry) => {
    if (!entry.primary_actor_id || acc[entry.primary_actor_id]) return acc;

    const profile = profiles.find(
      (person) => person.id === entry.primary_actor_id,
    );
    if (!profile) return acc;

    if (
      entry.event_type === "class_passive" &&
      entry.message.includes("Passo Leve")
    ) {
      acc[entry.primary_actor_id] = {
        label: "Esquivou",
        detail: "Passo Leve ativado no sorteio recente.",
        cardClassName:
          "snes-dodge-glow border-emerald-300 shadow-[0_0_18px_rgba(16,185,129,0.28)]",
        badgeClassName: "border-emerald-300 bg-emerald-950/55 text-emerald-200",
      };
      return acc;
    }

    if (
      entry.event_type === "class_passive" &&
      entry.message.includes("Aura de Comunhão")
    ) {
      acc[entry.primary_actor_id] = {
        label: "Abençoou",
        detail: "Aura de Comunhão reforçou o grupo agora há pouco.",
        cardClassName:
          "snes-blessing-glow border-pink-300 shadow-[0_0_18px_rgba(244,114,182,0.26)]",
        badgeClassName: "border-pink-300 bg-pink-950/55 text-pink-200",
      };
      return acc;
    }

    if (
      entry.event_type === "draw_result" &&
      ["pao", "balde"].includes(entry.category || "") &&
      ["guerreiro", "aprendiz_guerreiro"].includes(profile.class)
    ) {
      acc[entry.primary_actor_id] = {
        label: "Resistiu",
        detail: "Casca Grossa absorveu parte do impacto recente.",
        cardClassName:
          "snes-guard-glow border-red-300 shadow-[0_0_18px_rgba(248,113,113,0.24)]",
        badgeClassName: "border-red-300 bg-red-950/55 text-red-200",
      };
    }

    return acc;
  }, {});
}

export const classOptionMeta: Record<
  Exclude<ProfileClass, "novato">,
  { label: string; description: string; tone: string; icon: ReactNode }
> = {
  aprendiz_guerreiro: {
    label: "Aprendiz Guerreiro",
    description:
      "Primeiro passo da trilha de defesa. Reduz parte do dano ruim.",
    tone: "hover:border-red-400",
    icon: <Shield className="w-6 h-6 text-white" />,
  },
  aprendiz_mago: {
    label: "Aprendiz Mago",
    description:
      "Primeiro passo da trilha arcana. Já recebe desconto inicial na loja.",
    tone: "hover:border-blue-400",
    icon: <Wand2 className="w-6 h-6 text-white" />,
  },
  aprendiz_ladino: {
    label: "Aprendiz Ladino",
    description:
      "Primeiro passo da trilha furtiva. Melhora ganhos quando não é sorteado.",
    tone: "hover:border-emerald-400",
    icon: <Crosshair className="w-6 h-6 text-white" />,
  },
  aprendiz_clerigo: {
    label: "Aprendiz Clérigo",
    description:
      "Primeiro passo da trilha de suporte. Recupera melhor após o Pão.",
    tone: "hover:border-pink-400",
    icon: <Heart className="w-6 h-6 text-white" />,
  },
  guerreiro: {
    label: "Guerreiro",
    description: "Reduz em 40% o dano ruim e ganha 5 XP em todo sorteio.",
    tone: "hover:border-red-500",
    icon: <Shield className="w-6 h-6 text-white" />,
  },
  mago: {
    label: "Mago",
    description: "Recebe 20% de desconto na loja e enxerga filas e logs.",
    tone: "hover:border-blue-500",
    icon: <Wand2 className="w-6 h-6 text-white" />,
  },
  ladino: {
    label: "Ladino",
    description:
      "Tem 5% de esquiva e ganha 25% mais SetorCoins quando não é sorteado.",
    tone: "hover:border-emerald-500",
    icon: <Crosshair className="w-6 h-6 text-white" />,
  },
  clerigo: {
    label: "Clérigo",
    description:
      "Dá SetorCoins ao grupo quando é sorteado e recupera HP mais rápido após Pão.",
    tone: "hover:border-pink-500",
    icon: <Heart className="w-6 h-6 text-white" />,
  },
};
