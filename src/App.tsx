import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Coffee,
  Droplets,
  UserPlus,
  Trash2,
  Shuffle,
  User,
  CheckCircle2,
  AlertCircle,
  PaintBucket,
  Star,
  Cloud,
  CloudOff,
  RefreshCw,
  RotateCcw,
  History,
  Clock,
  Shield,
  Wand2,
  Crosshair,
  Heart,
  Coins,
  ShoppingCart,
  X,
  Package,
  Settings,
} from "lucide-react";

import {
  Profile,
  ProfileClass,
  ShopItem,
  BattleLog,
  MageInsights,
} from "./types";
import { api } from "./services/api";

const STATE_KEY = "sorteio_estado_completo";
const APPRENTICE_UNLOCK_LEVEL = 3;
const FINAL_CLASS_UNLOCK_LEVEL = 5;
const RECENT_EFFECT_WINDOW_MS = 15 * 60 * 1000;
const CUSTOM_TITLE_PREFIX = "custom:";

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    "home" | "history" | "settings" | "guide"
  >("home");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([]);

  // Initialize other states from localStorage if available
  const getInitialState = (key: string, defaultValue: any) => {
    const saved = localStorage.getItem(STATE_KEY);
    if (!saved) return defaultValue;
    try {
      const state = JSON.parse(saved);
      return state[key] !== undefined ? state[key] : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const [newName, setNewName] = useState("");
  const [paoDeQueijoWinners, setPaoDeQueijoWinners] = useState<string[]>(() =>
    getInitialState("paoDeQueijoWinners", []),
  );
  const [aguaWinners, setAguaWinners] = useState<string[]>(() =>
    getInitialState("aguaWinners", []),
  );
  const [baldeWinners, setBaldeWinners] = useState<string[]>(() =>
    getInitialState("baldeWinners", []),
  );
  const [geralWinners, setGeralWinners] = useState<string[]>(() =>
    getInitialState("geralWinners", []),
  );

  const [excludedIdsPao, setExcludedIdsPao] = useState<string[]>(() =>
    getInitialState("excludedIdsPao", []),
  );
  const [excludedIdsAgua, setExcludedIdsAgua] = useState<string[]>(() =>
    getInitialState("excludedIdsAgua", []),
  );
  const [excludedIdsBalde, setExcludedIdsBalde] = useState<string[]>(() =>
    getInitialState("excludedIdsBalde", []),
  );
  const [excludedIdsGeral, setExcludedIdsGeral] = useState<string[]>(() =>
    getInitialState("excludedIdsGeral", []),
  );

  const [aguaMode, setAguaMode] = useState<"muita" | "pouca">(() =>
    getInitialState("aguaMode", "muita"),
  );

  const [isDrawingPao, setIsDrawingPao] = useState(false);
  const [isDrawingAgua, setIsDrawingAgua] = useState(false);
  const [isDrawingBalde, setIsDrawingBalde] = useState(false);
  const [isDrawingGeral, setIsDrawingGeral] = useState(false);

  const [cyclingNamePao, setCyclingNamePao] = useState<string>("");
  const [cyclingNameAgua, setCyclingNameAgua] = useState<string>("");
  const [cyclingNameBalde, setCyclingNameBalde] = useState<string>("");
  const [cyclingNameGeral, setCyclingNameGeral] = useState<string>("");

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [dbProvider, setDbProvider] = useState<"sqlite" | "supabase" | null>(
    null,
  );

  const [classModalOpen, setClassModalOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [shopModalOpen, setShopModalOpen] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [selectedInventoryProfileId, setSelectedInventoryProfileId] = useState<
    string | null
  >(null);
  const [selectedMageId, setSelectedMageId] = useState<string | null>(null);
  const [mageInsights, setMageInsights] = useState<MageInsights | null>(null);
  const [titlesByProfileId, setTitlesByProfileId] = useState<
    Record<string, string[]>
  >({});
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
  const mageProfiles = profiles.filter(
    (profile) => profile.class === "mago" || profile.class === "aprendiz_mago",
  );

  const refreshSocialData = async () => {
    const titles = await api.getTitles();
    setTitlesByProfileId(titles.titlesByProfileId);
  };

  // Initial fetch from server
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch("/api/health");
        if (!response.ok) {
          const text = await response.text();
          console.error(`Health check failed (${response.status}):`, text);
          return;
        }
        const data = await response.json();
        if (data.provider) setDbProvider(data.provider);
      } catch (e) {
        console.error("Failed to fetch health:", e);
      }
    };

    const fetchData = async () => {
      try {
        const [fetchedProfiles, fetchedShop, fetchedLogs, fetchedTitles] =
          await Promise.all([
            api.getProfiles(),
            api.getShopItems(),
            api.getLogs(),
            api.getTitles(),
          ]);

        setProfiles(fetchedProfiles);

        setShopItems(fetchedShop);
        setBattleLogs(fetchedLogs);
        setTitlesByProfileId(fetchedTitles.titlesByProfileId);
      } catch (error) {
        console.error("Failed to fetch RPG data:", error);
      }
    };

    const fetchState = async () => {
      try {
        const response = await fetch("/api/state");
        if (response.status === 404) return;
        if (!response.ok) return;

        const data = await response.json();
        if (data) {
          if (data.paoDeQueijoWinners)
            setPaoDeQueijoWinners(data.paoDeQueijoWinners);
          if (data.aguaWinners) setAguaWinners(data.aguaWinners);
          if (data.baldeWinners) setBaldeWinners(data.baldeWinners);
          if (data.geralWinners) setGeralWinners(data.geralWinners);
          if (data.excludedIdsPao) setExcludedIdsPao(data.excludedIdsPao);
          if (data.excludedIdsAgua) setExcludedIdsAgua(data.excludedIdsAgua);
          if (data.excludedIdsBalde) setExcludedIdsBalde(data.excludedIdsBalde);
          if (data.excludedIdsGeral) setExcludedIdsGeral(data.excludedIdsGeral);
          if (data.aguaMode) setAguaMode(data.aguaMode);
        }
      } catch (error) {
        console.error("Failed to fetch state from server:", error);
      }
    };

    fetchHealth();
    fetchData();
    fetchState();
  }, []);

  // Persist all other state to localStorage and Server
  useEffect(() => {
    const stateToSave = {
      paoDeQueijoWinners,
      aguaWinners,
      baldeWinners,
      geralWinners,
      excludedIdsPao,
      excludedIdsAgua,
      excludedIdsBalde,
      excludedIdsGeral,
      aguaMode,
    };

    // Local storage persistence
    localStorage.setItem(STATE_KEY, JSON.stringify(stateToSave));

    // Server persistence with debounce
    const saveToServer = async () => {
      setIsSyncing(true);
      setSyncError(false);
      try {
        const response = await fetch("/api/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stateToSave),
        });
        if (!response.ok) throw new Error("Sync failed");
      } catch (error) {
        console.error("Failed to save state to server:", error);
        setSyncError(true);
      } finally {
        setIsSyncing(false);
      }
    };

    const timeoutId = setTimeout(saveToServer, 1000);
    return () => clearTimeout(timeoutId);
  }, [
    paoDeQueijoWinners,
    aguaWinners,
    baldeWinners,
    geralWinners,
    excludedIdsPao,
    excludedIdsAgua,
    excludedIdsBalde,
    excludedIdsGeral,
    aguaMode,
  ]);

  useEffect(() => {
    setTitleDrafts((currentDrafts) => {
      const nextDrafts: Record<string, string> = {};

      for (const profile of profiles) {
        const customTitle = profile.titles.find((title) =>
          title.startsWith(CUSTOM_TITLE_PREFIX),
        );
        nextDrafts[profile.id] = customTitle
          ? customTitle.slice(CUSTOM_TITLE_PREFIX.length)
          : "";
      }

      const hasSameKeys =
        Object.keys(currentDrafts).length === Object.keys(nextDrafts).length;
      const hasSameValues = Object.entries(nextDrafts).every(
        ([id, title]) => currentDrafts[id] === title,
      );

      return hasSameKeys && hasSameValues ? currentDrafts : nextDrafts;
    });
  }, [profiles]);

  useEffect(() => {
    const hasStaleDrawState =
      paoDeQueijoWinners.length > 0 ||
      aguaWinners.length > 0 ||
      baldeWinners.length > 0 ||
      geralWinners.length > 0 ||
      excludedIdsPao.length > 0 ||
      excludedIdsAgua.length > 0 ||
      excludedIdsBalde.length > 0 ||
      excludedIdsGeral.length > 0 ||
      aguaMode !== "muita";

    if (profiles.length === 0 && battleLogs.length === 0 && hasStaleDrawState) {
      setPaoDeQueijoWinners([]);
      setAguaWinners([]);
      setBaldeWinners([]);
      setGeralWinners([]);
      setExcludedIdsPao([]);
      setExcludedIdsAgua([]);
      setExcludedIdsBalde([]);
      setExcludedIdsGeral([]);
      setAguaMode("muita");
      localStorage.removeItem(STATE_KEY);
    }
  }, [
    profiles.length,
    battleLogs.length,
    paoDeQueijoWinners.length,
    aguaWinners.length,
    baldeWinners.length,
    geralWinners.length,
    excludedIdsPao.length,
    excludedIdsAgua.length,
    excludedIdsBalde.length,
    excludedIdsGeral.length,
    aguaMode,
  ]);

  useEffect(() => {
    if (mageProfiles.length === 0) {
      setSelectedMageId(null);
      setMageInsights(null);
      return;
    }

    if (
      !selectedMageId ||
      !mageProfiles.some((profile) => profile.id === selectedMageId)
    ) {
      setSelectedMageId(mageProfiles[0].id);
    }
  }, [mageProfiles, selectedMageId]);

  useEffect(() => {
    if (!selectedMageId) return;

    const fetchMageInsights = async () => {
      try {
        const insights = await api.getMageInsights(selectedMageId);
        setMageInsights(insights);
      } catch (error) {
        console.error("Failed to fetch mage insights:", error);
        setMageInsights(null);
      }
    };

    const timeoutId = setTimeout(fetchMageInsights, 300);
    return () => clearTimeout(timeoutId);
  }, [
    selectedMageId,
    battleLogs.length,
    excludedIdsPao,
    excludedIdsAgua,
    excludedIdsBalde,
    excludedIdsGeral,
  ]);

  const addName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      try {
        const newProfile = await api.createProfile({
          name: newName.trim(),
          participates_in_pao: true,
          participates_in_agua: true,
          participates_in_balde: true,
          participates_in_geral: true,
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
        });
        setProfiles([...profiles, newProfile]);
        await refreshSocialData();
        setNewName("");
      } catch (err) {
        console.error("Failed to add profile", err);
      }
    }
  };

  const toggleParticipation = async (
    id: string,
    type: "pao" | "agua" | "balde" | "geral",
  ) => {
    const profile = profiles.find((p) => p.id === id);
    if (!profile) return;

    const updates: Partial<Profile> = {};
    if (type === "pao")
      updates.participates_in_pao = !profile.participates_in_pao;
    if (type === "agua")
      updates.participates_in_agua = !profile.participates_in_agua;
    if (type === "balde")
      updates.participates_in_balde = !profile.participates_in_balde;
    if (type === "geral")
      updates.participates_in_geral = !profile.participates_in_geral;

    try {
      const updated = await api.updateProfile(id, updates);
      setProfiles(profiles.map((p) => (p.id === id ? updated : p)));

      // Clear from exclusion list if they are no longer participating
      if (type === "pao" && !updated.participates_in_pao)
        setExcludedIdsPao((prev) => prev.filter((eId) => eId !== id));
      if (type === "agua" && !updated.participates_in_agua)
        setExcludedIdsAgua((prev) => prev.filter((eId) => eId !== id));
      if (type === "balde" && !updated.participates_in_balde)
        setExcludedIdsBalde((prev) => prev.filter((eId) => eId !== id));
      if (type === "geral" && !updated.participates_in_geral)
        setExcludedIdsGeral((prev) => prev.filter((eId) => eId !== id));
    } catch (err) {
      console.error("Failed to update participation", err);
    }
  };

  const removeName = async (id: string) => {
    try {
      await api.deleteProfile(id);
      setProfiles(profiles.filter((p) => p.id !== id));
      await refreshSocialData();
      setExcludedIdsPao((prev) => prev.filter((eId) => eId !== id));
      setExcludedIdsAgua((prev) => prev.filter((eId) => eId !== id));
      setExcludedIdsBalde((prev) => prev.filter((eId) => eId !== id));
      setExcludedIdsGeral((prev) => prev.filter((eId) => eId !== id));
    } catch (err) {
      console.error("Failed to delete profile", err);
    }
  };

  const changeClass = async (id: string, newClass: ProfileClass) => {
    try {
      const updated = await api.updateProfile(id, { class: newClass });
      setProfiles(profiles.map((p) => (p.id === id ? updated : p)));
      await refreshSocialData();
      setClassModalOpen(false);
      setSelectedProfileId(null);
    } catch (err) {
      console.error("Failed to change class", err);
    }
  };

  const buyItem = async (profileId: string, itemId: string) => {
    try {
      const updatedProfile = await api.buyItem(profileId, itemId);
      setProfiles(
        profiles.map((p) => (p.id === profileId ? updatedProfile : p)),
      );
      const [logs] = await Promise.all([api.getLogs(), refreshSocialData()]);
      setBattleLogs(logs);
    } catch (err) {
      console.error("Failed to buy item", err);
      alert(
        "Falha ao comprar item. Verifique se você tem SetorCoins suficientes e nível adequado.",
      );
    }
  };

  const useItem = async (profileId: string, itemId: string) => {
    try {
      const updatedProfile = await api.useItem(profileId, itemId);
      setProfiles(
        profiles.map((p) => (p.id === profileId ? updatedProfile : p)),
      );
      const [logs] = await Promise.all([api.getLogs(), refreshSocialData()]);
      setBattleLogs(logs);
    } catch (err) {
      console.error("Failed to use item", err);
      alert("Falha ao usar item.");
    }
  };

  const getCustomTitle = (profile: Profile) => {
    const customTitle = profile.titles.find((title) =>
      title.startsWith(CUSTOM_TITLE_PREFIX),
    );
    return customTitle ? customTitle.slice(CUSTOM_TITLE_PREFIX.length) : "";
  };

  const saveCustomTitle = async (profile: Profile) => {
    const nextTitle = (titleDrafts[profile.id] || "").trim().slice(0, 40);
    const preservedTitles = profile.titles.filter(
      (title) => !title.startsWith(CUSTOM_TITLE_PREFIX),
    );
    const nextTitles = nextTitle
      ? [...preservedTitles, `${CUSTOM_TITLE_PREFIX}${nextTitle}`]
      : preservedTitles;

    try {
      const updated = await api.updateProfile(profile.id, {
        titles: nextTitles,
      });
      setProfiles(profiles.map((p) => (p.id === profile.id ? updated : p)));
      setTitleDrafts((currentDrafts) => ({
        ...currentDrafts,
        [profile.id]: nextTitle,
      }));
      await refreshSocialData();
    } catch (err) {
      console.error("Failed to save custom title", err);
    }
  };

  const getSecureRandomInt = (max: number) => {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  };

  const resolveWinnerNames = (
    winnerIds: string[],
    updatedProfiles: Profile[],
  ) => {
    const profileMap = new Map(
      updatedProfiles.map((profile) => [profile.id, profile.name]),
    );
    return winnerIds.map(
      (winnerId) => profileMap.get(winnerId) ?? "Desconhecido",
    );
  };

  const highestLevel = profiles.reduce(
    (maxLevel, profile) => Math.max(maxLevel, profile.level),
    1,
  );
  const getExhaustionState = (profile: Profile) => {
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
  };
  const getClassLabel = (profileClass: ProfileClass) => {
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
  };
  const getClassPowerText = (profileClass: Profile["class"]) => {
    switch (profileClass) {
      case "aprendiz_guerreiro":
        return "Aprendiz: -20% de dano ruim enquanto treina.";
      case "aprendiz_mago":
        return "Aprendiz: -10% na loja e treino arcano básico.";
      case "aprendiz_ladino":
        return "Aprendiz: +10% SetorCoins quando não é sorteado.";
      case "aprendiz_clerigo":
        return "Aprendiz: recuperação acelerada após ser sorteado no Pão.";
      case "guerreiro":
        return "Tanque: -40% de dano ruim e +5 XP por sorteio.";
      case "mago":
        return "Arcano: -20% na loja e visão das filas e logs.";
      case "ladino":
        return "Esquiva: 5% de fuga e +25% SetorCoins quando não é sorteado.";
      case "clerigo":
        return "Suporte: aura de SetorCoins e recuperação pós-Pão melhorada.";
      default:
        return "Novato: +10% XP enquanto aprende o sistema.";
    }
  };
  const getItemEffectText = (item: ShopItem) => {
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

    if (typeof profileModifiers.passive_coin_multiplier === "number") {
      return `Economia passiva x${profileModifiers.passive_coin_multiplier.toFixed(2)}`;
    }

    if (typeof profileModifiers.luck === "number") {
      return `Sorte +${profileModifiers.luck.toFixed(2)}`;
    }

    return null;
  };
  const getClassProgressionOptions = (profile: Profile) => {
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
    if (profile.class === "aprendiz_ladino")
      return ["ladino"] as ProfileClass[];
    if (profile.class === "aprendiz_clerigo")
      return ["clerigo"] as ProfileClass[];

    return [];
  };
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
  const recentClassEffectsByProfileId = recentLogs.reduce<
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
  const classOptionMeta: Record<
    Exclude<ProfileClass, "novato">,
    { label: string; description: string; tone: string; icon: React.ReactNode }
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

  const drawWinner = (type: "pao" | "agua" | "balde" | "geral") => {
    if (profiles.length === 0) return;

    const duration = 2000;
    const interval = 100;
    const steps = duration / interval;
    let currentStep = 0;

    if (type === "pao") {
      const eligibleProfiles = profiles.filter((p) => p.participates_in_pao);
      if (eligibleProfiles.length === 0) return;

      let pool = eligibleProfiles.filter((p) => !excludedIdsPao.includes(p.id));
      if (pool.length === 0) {
        pool = [...eligibleProfiles];
        setExcludedIdsPao([]);
      }

      setIsDrawingPao(true);
      setPaoDeQueijoWinners([]);

      const timer = setInterval(async () => {
        const randomIndex = getSecureRandomInt(eligibleProfiles.length);
        setCyclingNamePao(eligibleProfiles[randomIndex].name);
        currentStep++;

        if (currentStep >= steps) {
          clearInterval(timer);

          const winnerIndex = getSecureRandomInt(pool.length);
          const winner = pool[winnerIndex];

          setPaoDeQueijoWinners([winner.name]);
          setExcludedIdsPao((prev) => {
            const next = [...prev, winner.id];
            return next.length >= eligibleProfiles.length ? [] : next;
          });
          setIsDrawingPao(false);

          // Process RPG logic
          try {
            const result = await api.processDraw(
              "pao",
              [winner.id],
              eligibleProfiles.map((p) => p.id),
            );
            setProfiles(result.updates);
            setPaoDeQueijoWinners(
              resolveWinnerNames(result.winnerIds, result.updates),
            );
            setExcludedIdsPao((prev) => {
              const next = [
                ...prev.filter((excludedId) => excludedId !== winner.id),
                ...result.winnerIds,
              ];
              const unique = Array.from(new Set(next));
              return unique.length >= eligibleProfiles.length ? [] : unique;
            });
            const [logs] = await Promise.all([
              api.getLogs(),
              refreshSocialData(),
            ]);
            setBattleLogs(logs);
          } catch (err) {
            console.error("Failed to process RPG draw", err);
          }
        }
      }, interval);
    } else if (type === "agua") {
      const eligibleProfiles = profiles.filter((p) => p.participates_in_agua);
      if (eligibleProfiles.length === 0) return;

      const winnerCount = aguaMode === "muita" ? 2 : 1;
      let pool = eligibleProfiles.filter(
        (p) => !excludedIdsAgua.includes(p.id),
      );
      if (pool.length < Math.min(winnerCount, eligibleProfiles.length)) {
        pool = [...eligibleProfiles];
        setExcludedIdsAgua([]);
      }

      setIsDrawingAgua(true);
      setAguaWinners([]);

      const timer = setInterval(async () => {
        const randomIndex = getSecureRandomInt(eligibleProfiles.length);
        setCyclingNameAgua(eligibleProfiles[randomIndex].name);
        currentStep++;

        if (currentStep >= steps) {
          clearInterval(timer);

          const indices = new Set<number>();
          while (indices.size < Math.min(winnerCount, pool.length)) {
            indices.add(getSecureRandomInt(pool.length));
          }

          const selectedWinners = Array.from(indices).map((i) => pool[i]);
          setAguaWinners(selectedWinners.map((w) => w.name));
          setExcludedIdsAgua((prev) => {
            const next = [...prev, ...selectedWinners.map((w) => w.id)];
            return next.length >= eligibleProfiles.length ? [] : next;
          });
          setIsDrawingAgua(false);

          // Process RPG logic
          try {
            const result = await api.processDraw(
              "agua",
              selectedWinners.map((w) => w.id),
              eligibleProfiles.map((p) => p.id),
            );
            setProfiles(result.updates);
            setAguaWinners(
              resolveWinnerNames(result.winnerIds, result.updates),
            );
            setExcludedIdsAgua((prev) => {
              const requestedIds = new Set(
                selectedWinners.map((selected) => selected.id),
              );
              const next = [
                ...prev.filter((excludedId) => !requestedIds.has(excludedId)),
                ...result.winnerIds,
              ];
              const unique = Array.from(new Set(next));
              return unique.length >= eligibleProfiles.length ? [] : unique;
            });
            const [logs] = await Promise.all([
              api.getLogs(),
              refreshSocialData(),
            ]);
            setBattleLogs(logs);
          } catch (err) {
            console.error("Failed to process RPG draw", err);
          }
        }
      }, interval);
    } else if (type === "balde") {
      const eligibleProfiles = profiles.filter((p) => p.participates_in_balde);
      if (eligibleProfiles.length === 0) return;

      let pool = eligibleProfiles.filter(
        (p) => !excludedIdsBalde.includes(p.id),
      );
      if (pool.length === 0) {
        pool = [...eligibleProfiles];
        setExcludedIdsBalde([]);
      }

      setIsDrawingBalde(true);
      setBaldeWinners([]);

      const timer = setInterval(async () => {
        const randomIndex = getSecureRandomInt(eligibleProfiles.length);
        setCyclingNameBalde(eligibleProfiles[randomIndex].name);
        currentStep++;

        if (currentStep >= steps) {
          clearInterval(timer);

          const winnerIndex = getSecureRandomInt(pool.length);
          const winner = pool[winnerIndex];

          setBaldeWinners([winner.name]);
          setExcludedIdsBalde((prev) => {
            const next = [...prev, winner.id];
            return next.length >= eligibleProfiles.length ? [] : next;
          });
          setIsDrawingBalde(false);

          // Process RPG logic
          try {
            const result = await api.processDraw(
              "balde",
              [winner.id],
              eligibleProfiles.map((p) => p.id),
            );
            setProfiles(result.updates);
            setBaldeWinners(
              resolveWinnerNames(result.winnerIds, result.updates),
            );
            setExcludedIdsBalde((prev) => {
              const next = [
                ...prev.filter((excludedId) => excludedId !== winner.id),
                ...result.winnerIds,
              ];
              const unique = Array.from(new Set(next));
              return unique.length >= eligibleProfiles.length ? [] : unique;
            });
            const [logs] = await Promise.all([
              api.getLogs(),
              refreshSocialData(),
            ]);
            setBattleLogs(logs);
          } catch (err) {
            console.error("Failed to process RPG draw", err);
          }
        }
      }, interval);
    } else {
      const eligibleProfiles = profiles.filter((p) => p.participates_in_geral);
      if (eligibleProfiles.length === 0) return;

      let pool = eligibleProfiles.filter(
        (p) => !excludedIdsGeral.includes(p.id),
      );
      if (pool.length === 0) {
        pool = [...eligibleProfiles];
        setExcludedIdsGeral([]);
      }

      setIsDrawingGeral(true);
      setGeralWinners([]);

      const timer = setInterval(async () => {
        const randomIndex = getSecureRandomInt(eligibleProfiles.length);
        setCyclingNameGeral(eligibleProfiles[randomIndex].name);
        currentStep++;

        if (currentStep >= steps) {
          clearInterval(timer);

          const winnerIndex = getSecureRandomInt(pool.length);
          const winner = pool[winnerIndex];

          setGeralWinners([winner.name]);
          setExcludedIdsGeral((prev) => {
            const next = [...prev, winner.id];
            return next.length >= eligibleProfiles.length ? [] : next;
          });
          setIsDrawingGeral(false);

          // Process RPG logic
          try {
            const result = await api.processDraw(
              "geral",
              [winner.id],
              eligibleProfiles.map((p) => p.id),
            );
            setProfiles(result.updates);
            setGeralWinners(
              resolveWinnerNames(result.winnerIds, result.updates),
            );
            setExcludedIdsGeral((prev) => {
              const next = [
                ...prev.filter((excludedId) => excludedId !== winner.id),
                ...result.winnerIds,
              ];
              const unique = Array.from(new Set(next));
              return unique.length >= eligibleProfiles.length ? [] : unique;
            });
            const [logs] = await Promise.all([
              api.getLogs(),
              refreshSocialData(),
            ]);
            setBattleLogs(logs);
          } catch (err) {
            console.error("Failed to process RPG draw", err);
          }
        }
      }, interval);
    }
  };

  const resetCycle = (type: "pao" | "agua" | "balde" | "geral") => {
    if (type === "pao") setExcludedIdsPao([]);
    else if (type === "agua") setExcludedIdsAgua([]);
    else if (type === "balde") setExcludedIdsBalde([]);
    else setExcludedIdsGeral([]);
  };

  const handleGeneralReset = () => {
    if (
      window.confirm(
        "Deseja realizar um reset geral? Isso limpará os vencedores atuais, o histórico e reiniciará todos os ciclos (pools), mantendo os participantes e suas funções.",
      )
    ) {
      setPaoDeQueijoWinners([]);
      setAguaWinners([]);
      setBaldeWinners([]);
      setGeralWinners([]);
      setExcludedIdsPao([]);
      setExcludedIdsAgua([]);
      setExcludedIdsBalde([]);
      setExcludedIdsGeral([]);
      // aguaMode is maintained as requested ("funções escolhidas serão mantidas")
    }
  };

  const historySection = (
    <section className="glass-card flex min-h-[420px] flex-col p-5 lg:min-h-[calc(100vh-170px)] lg:p-6">
      <div className="mb-6 flex items-center justify-between border-b-2 border-white/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="border-2 border-white bg-black/35 p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <History className="h-5 w-5 text-[var(--color-snes-gold)]" />
          </div>
          <div>
            <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
              HISTÓRICO DE SORTEIOS
            </h2>
            <p className="pixel-text mt-2 text-[7px] text-white/55">
              REGISTROS DAS ÚLTIMAS ATIVIDADES
            </p>
          </div>
        </div>
        {battleLogs.length > 0 && (
          <button
            onClick={async () => {
              setBattleLogs([]);
            }}
            className="pixel-text border-2 border-white bg-black/35 px-3 py-2 text-[8px] text-white/70 hover:border-[var(--color-snes-gold)] hover:text-white"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto pr-2">
        <AnimatePresence mode="popLayout">
          {battleLogs.map((entry) => (
            <motion.div
              key={entry.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="history-log-entry"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center border-2 border-white ${
                  entry.event_type === "draw_result"
                    ? "bg-[var(--color-snes-gold)] text-slate-950"
                    : entry.event_type === "level_up"
                      ? "bg-emerald-600 text-white"
                      : entry.event_type === "item_buy"
                        ? "bg-blue-600 text-white"
                        : "bg-black/40 text-white"
                }`}
              >
                {entry.event_type === "draw_result" && (
                  <Star className="h-4 w-4" />
                )}
                {entry.event_type === "level_up" && (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {entry.event_type === "item_buy" && (
                  <ShoppingCart className="h-4 w-4" />
                )}
                {!["draw_result", "level_up", "item_buy"].includes(
                  entry.event_type,
                ) && <History className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="pixel-text mb-1 text-[8px] text-white">
                  {entry.profiles?.name || "SISTEMA"}
                </div>
                <div className="pixel-text text-[7px] text-white/60">
                  {entry.message}
                </div>
              </div>
              <div className="pixel-text flex items-center gap-1 text-[7px] text-white/45">
                <Clock className="h-3 w-3" />
                {new Date(entry.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {battleLogs.length === 0 && (
          <div className="retro-empty-state mt-4">
            <div className="retro-empty-icon">
              <History className="h-7 w-7 text-white/25" />
            </div>
            <p className="pixel-text text-[8px] text-white/35">
              FIM DOS REGISTROS
            </p>
          </div>
        )}
      </div>
    </section>
  );

  const settingsSection = (
    <section className="glass-card flex min-h-[420px] flex-col p-5 lg:min-h-[calc(100vh-170px)] lg:p-6">
      <div className="mb-6 flex items-center justify-between border-b-2 border-white/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="border-2 border-white bg-black/35 p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <Settings className="h-5 w-5 text-[var(--color-snes-gold)]" />
          </div>
          <div>
            <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
              CONFIGURAÇÕES
            </h2>
            <p className="pixel-text mt-2 text-[7px] text-white/55">
              STATUS DO SISTEMA E CONTROLES RÁPIDOS
            </p>
          </div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            STATUS
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between border-2 border-white/15 bg-black/35 px-3 py-3">
              <span className="pixel-text text-[7px] text-white/60">
                Banco ativo
              </span>
              <span className="pixel-text text-[7px] text-white">
                {dbProvider || "indefinido"}
              </span>
            </div>
            <div className="flex items-center justify-between border-2 border-white/15 bg-black/35 px-3 py-3">
              <span className="pixel-text text-[7px] text-white/60">
                Sincronização
              </span>
              <span className="pixel-text text-[7px] text-white">
                {isSyncing ? "sincronizando" : syncError ? "offline" : "ok"}
              </span>
            </div>
            <div className="flex items-center justify-between border-2 border-white/15 bg-black/35 px-3 py-3">
              <span className="pixel-text text-[7px] text-white/60">
                Participantes
              </span>
              <span className="pixel-text text-[7px] text-white">
                {profiles.length}
              </span>
            </div>
            <div className="flex items-center justify-between border-2 border-white/15 bg-black/35 px-3 py-3">
              <span className="pixel-text text-[7px] text-white/60">
                Logs na tela
              </span>
              <span className="pixel-text text-[7px] text-white">
                {battleLogs.length}
              </span>
            </div>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            AÇÕES
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={handleGeneralReset}
              className="pixel-text border-2 border-white bg-red-900/80 px-4 py-3 text-[7px] text-white hover:bg-red-800"
            >
              RESETAR CICLOS VISUAIS
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(STATE_KEY);
                setPaoDeQueijoWinners([]);
                setAguaWinners([]);
                setBaldeWinners([]);
                setGeralWinners([]);
                setExcludedIdsPao([]);
                setExcludedIdsAgua([]);
                setExcludedIdsBalde([]);
                setExcludedIdsGeral([]);
                setAguaMode("muita");
              }}
              className="pixel-text border-2 border-white bg-slate-900 px-4 py-3 text-[7px] text-white hover:border-[var(--color-snes-gold)] hover:text-[var(--color-snes-gold)]"
            >
              LIMPAR ESTADO LOCAL
            </button>
            <button
              type="button"
              onClick={() => setBattleLogs([])}
              className="pixel-text border-2 border-white bg-slate-900 px-4 py-3 text-[7px] text-white hover:border-[var(--color-snes-gold)] hover:text-[var(--color-snes-gold)]"
            >
              LIMPAR LOGS DA TELA
            </button>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4 xl:col-span-2">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            NOTAS
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              Reset Geral limpa vencedores visuais e reinicia ciclos, sem
              remover participantes.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Limpar estado local apaga apenas o cache visual salvo no
              navegador.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Para limpar dados reais, perfis e histórico do banco, continue
              usando SQL no Supabase.
            </p>
          </div>
        </section>
      </div>
    </section>
  );

  const guideSection = (
    <section className="glass-card flex min-h-[420px] flex-col p-5 lg:min-h-[calc(100vh-170px)] lg:p-6">
      <div className="mb-6 flex items-center justify-between border-b-2 border-white/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="border-2 border-white bg-black/35 p-3 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <AlertCircle className="h-5 w-5 text-[var(--color-snes-gold)]" />
          </div>
          <div>
            <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
              COMO JOGAR
            </h2>
            <p className="pixel-text mt-2 text-[7px] text-white/55">
              GUIA RÁPIDO DO SISTEMA, CLASSES E LOJA
            </p>
          </div>
        </div>
      </div>

      <div className="custom-scrollbar grid flex-1 grid-cols-1 gap-4 overflow-y-auto pr-2 xl:grid-cols-2">
        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            VISÃO GERAL
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              Cada participante acumula XP, nível, HP e SetorCoins conforme os
              sorteios acontecem.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              O objetivo é evoluir a classe, sobreviver aos sorteios piores e
              usar a loja para melhorar o desempenho diário.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              O HP também representa sanidade. Quando fica baixo demais, os
              ganhos de moedas caem.
            </p>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            PROGRESSÃO
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              Todo mundo começa como Novato.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              No nível 3, o jogador escolhe uma trilha de aprendiz.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              No nível 5, a classe final é liberada.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Novato recebe +10% XP enquanto aprende o sistema.
            </p>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            CLASSES
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              Guerreiro: reduz dano ruim e ganha XP passivo em todo sorteio.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Mago: recebe desconto na loja e acessa o Olhar Arcano.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Ladino: pode esquivar e ganha mais moedas quando escapa do
              sorteio.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Clérigo: distribui moedas extras ao grupo e recupera melhor após
              Pão.
            </p>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            CATEGORIAS
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              Água: tarefa diária, segura, com ganho leve de XP e moedas.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Balde: desafio intermediário, dá mais XP e cobra HP.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Pão de Queijo: evento pesado; quem não é sorteado recebe alívio e
              sorte temporária.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Geral: evento neutro com moedas base para os envolvidos.
            </p>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            EXAUSTÃO E FEITOS
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              Quando o HP fica abaixo do limite de exaustão, o jogador recebe
              menos moedas.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Os feitos aparecem conforme eventos reais do jogo, como vencer Pão
              ou Balde.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              O título pessoal é separado dos feitos e pode ser definido pelo
              próprio jogador.
            </p>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            LOJA E ITENS
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              Café Expresso: recupera 50% do HP instantaneamente.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Relatório Falso: tira o jogador do próximo Balde.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Imã de Moedas: aumenta ganhos por tempo limitado.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              Contrato de Terceirização: terceiriza a próxima Água se o jogador
              for sorteado.
            </p>
          </div>
        </section>

        <section className="border-2 border-white/30 bg-black/25 p-4 xl:col-span-2">
          <h3 className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
            FLUXO RECOMENDADO
          </h3>
          <div className="mt-4 space-y-3">
            <p className="pixel-text text-[7px] text-white/65">
              1. Adicione os participantes.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              2. Deixe todos evoluírem como Novato até destravar a trilha.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              3. Faça os sorteios do dia e acompanhe HP, XP e moedas.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              4. Use a loja para recuperar HP ou alterar o meta.
            </p>
            <p className="pixel-text text-[7px] text-white/65">
              5. Consulte Histórico e Olhar Arcano para acompanhar o estado do
              setor.
            </p>
          </div>
        </section>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen px-0 py-0 font-sans text-zinc-100 lg:px-1 lg:py-1">
      <div className="app-shell mx-auto min-h-screen max-w-[1440px] overflow-hidden">
        {/* Header */}
        <header className="top-nav px-3 py-2.5 lg:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-[2px] border-2 border-[#ae8407] bg-[var(--color-snes-gold)] shadow-[3px_3px_0px_rgba(0,0,0,0.85)]">
                <Shuffle className="h-4.5 w-4.5 text-slate-950" />
              </div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pixel-text text-[12px] text-[var(--color-snes-gold)] md:text-[15px]"
                >
                  DEVGACHA
                </motion.h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
              <button
                onClick={() => setShopModalOpen(true)}
                className="top-nav-button-neutral"
                title="Loja do Setor"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-white" />
                <span>Loja</span>
              </button>
              <button
                onClick={handleGeneralReset}
                className="top-nav-button-danger"
                title="Reset Geral"
              >
                <RotateCcw className="w-3.5 h-3.5 text-white" />
                <span>Reset Geral</span>
              </button>
              <div className="top-nav-button-cloud">
                {isSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-yellow-400 animate-spin" />
                    <span className="text-yellow-400">Sincronizando</span>
                  </>
                ) : syncError ? (
                  <>
                    <CloudOff className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-red-500">Offline</span>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 animate-pulse" />
                    </div>
                    <span className="text-emerald-400">
                      Nuvem {dbProvider ? `(${dbProvider})` : ""}
                    </span>
                  </>
                )}
              </div>
              {/*<div className="snes-window px-2.5 py-1">
                <div className="pixel-text text-[8px] text-white">
                  LVL {highestLevel}
                </div>
              </div>*/}
              <button
                type="button"
                onClick={() => setCurrentPage("settings")}
                className="p-1 text-[var(--color-snes-gold)] hover:rotate-90 transition-transform"
                title="Configurações"
              >
                <Settings className="h-7 w-7" />
              </button>
            </div>
          </div>
        </header>

        <main className="grid min-h-[calc(100vh-82px)] grid-cols-1 gap-3 px-2 py-3 lg:grid-cols-12 lg:px-3 lg:py-3 xl:px-4">
          <div className="flex flex-col gap-4 lg:col-span-3">
            <section className="glass-card p-5">
              <h2 className="panel-title">MENU PRINCIPAL</h2>
              <ul className="space-y-2">
                <li
                  className={`menu-entry ${currentPage === "home" ? "menu-entry-active" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPage("home")}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <User className="h-4 w-4 text-[var(--color-snes-gold)]" />
                    Início
                  </button>
                </li>
                <li
                  className={`menu-entry ${currentPage === "history" ? "menu-entry-active" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPage("history")}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <History className="h-4 w-4 text-[var(--color-snes-gold)]" />
                    Histórico
                  </button>
                </li>
                <li
                  className={`menu-entry ${currentPage === "guide" ? "menu-entry-active" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPage("guide")}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <AlertCircle className="h-4 w-4 text-[var(--color-snes-gold)]" />
                    Guia
                  </button>
                </li>
                <li
                  className={`menu-entry ${currentPage === "settings" ? "menu-entry-active" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPage("settings")}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <Settings className="h-4 w-4 text-[var(--color-snes-gold)]" />
                    Config
                  </button>
                </li>
              </ul>
            </section>
            <section className="glass-card flex min-h-[0] flex-1 flex-col p-5">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="border-2 border-white bg-black/35 p-2.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <User className="w-5 h-5 text-[var(--color-snes-gold)]" />
                  </div>
                  <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
                    PARTICIPANTES
                  </h2>
                </div>
                <span className="snes-chip">{profiles.length} TOTAL</span>
              </div>

              <form onSubmit={addName} className="relative mb-6 group">
                <label className="pixel-text mb-2 block text-[8px] text-white/70">
                  NOVO MEMBRO:
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="NOME..."
                  className="snes-input pixel-text w-full pr-14 text-[9px] placeholder:text-white/35"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-[30px] flex h-9 w-9 items-center justify-center border-2 border-white bg-[var(--color-snes-gold)] text-slate-950 shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-white active:translate-y-1 active:shadow-none"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </form>

              <div className="custom-scrollbar min-h-[260px] flex-1 space-y-3 overflow-y-auto pr-1 lg:min-h-0">
                <AnimatePresence mode="popLayout">
                  {profiles.map((person) =>
                    (() => {
                      const exhaustionState = getExhaustionState(person);
                      const recentClassEffect =
                        recentClassEffectsByProfileId[person.id];
                      const achievementTitles =
                        titlesByProfileId[person.id] || [];
                      const customTitle = getCustomTitle(person);
                      const isArcaneFocus =
                        selectedMageId === person.id &&
                        ["mago", "aprendiz_mago"].includes(person.class) &&
                        Boolean(mageInsights);
                      return (
                        <motion.div
                          key={person.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`relative overflow-hidden border-2 bg-black/35 p-3 transition-none group snes-card-hover ${
                            exhaustionState.tone === "critical"
                              ? "border-red-400 shadow-[0_0_18px_rgba(239,68,68,0.35)]"
                              : exhaustionState.tone === "warning"
                                ? "border-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.28)]"
                                : "border-white"
                          } ${recentClassEffect?.cardClassName || ""} ${
                            isArcaneFocus
                              ? "snes-arcane-glow border-blue-300 shadow-[0_0_18px_rgba(96,165,250,0.24)]"
                              : ""
                          }`}
                        >
                          {/* HP Bar Background */}
                          <div className="absolute bottom-0 left-0 h-2 bg-black w-full border-t-2 border-white">
                            <div
                              className="h-full bg-red-600"
                              style={{
                                width: `${(person.hp / person.max_hp) * 100}%`,
                              }}
                            />
                          </div>
                          {/* XP Bar Background */}
                          <div className="absolute top-0 left-0 h-1 bg-black w-full border-b-2 border-white">
                            <div
                              className="h-full bg-blue-500"
                              style={{
                                width: `${(person.xp / (person.level * 100)) * 100}%`,
                              }}
                            />
                          </div>

                          <div className="mt-2 flex w-full flex-col gap-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedProfileId(person.id);
                                      setClassModalOpen(true);
                                    }}
                                    className="flex h-7 w-7 items-center justify-center border-2 border-white bg-black/60 text-zinc-300 hover:bg-white hover:text-black transition-none"
                                    title="Mudar Classe"
                                  >
                                    {person.class === "guerreiro" && (
                                      <Shield className="w-3 h-3 text-red-400" />
                                    )}
                                    {person.class === "aprendiz_guerreiro" && (
                                      <Shield className="w-3 h-3 text-red-300" />
                                    )}
                                    {person.class === "mago" && (
                                      <Wand2 className="w-3 h-3 text-blue-400" />
                                    )}
                                    {person.class === "aprendiz_mago" && (
                                      <Wand2 className="w-3 h-3 text-blue-300" />
                                    )}
                                    {person.class === "ladino" && (
                                      <Crosshair className="w-3 h-3 text-emerald-400" />
                                    )}
                                    {person.class === "aprendiz_ladino" && (
                                      <Crosshair className="w-3 h-3 text-emerald-300" />
                                    )}
                                    {person.class === "clerigo" && (
                                      <Heart className="w-3 h-3 text-pink-400" />
                                    )}
                                    {person.class === "aprendiz_clerigo" && (
                                      <Heart className="w-3 h-3 text-pink-300" />
                                    )}
                                    {person.class === "novato" && (
                                      <User className="w-3 h-3 text-zinc-400" />
                                    )}
                                  </button>
                                  <div className="min-w-0">
                                    <div className="truncate text-sm font-semibold tracking-tight text-white">
                                      {person.name}
                                    </div>
                                    {customTitle && (
                                      <div className="pixel-text mt-1 truncate text-[7px] text-cyan-200">
                                        {customTitle}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <span className="snes-chip">
                                    LV.{person.level}
                                  </span>
                                  <span
                                    className={`pixel-text px-2 py-1 text-[7px] border ${
                                      exhaustionState.tone === "critical"
                                        ? "border-red-300 bg-red-950/70 text-red-200"
                                        : exhaustionState.tone === "warning"
                                          ? "border-yellow-300 bg-yellow-950/50 text-yellow-200"
                                          : "border-emerald-300/40 bg-emerald-950/30 text-emerald-200/80"
                                    }`}
                                  >
                                    {exhaustionState.label}
                                  </span>
                                  {recentClassEffect && (
                                    <span
                                      className={`pixel-text px-2 py-1 text-[7px] border ${recentClassEffect.badgeClassName}`}
                                    >
                                      {recentClassEffect.label}
                                    </span>
                                  )}
                                  {isArcaneFocus && (
                                    <span className="pixel-text border border-blue-300 bg-blue-950/55 px-2 py-1 text-[7px] text-blue-200">
                                      Arcano ativo
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <div className="flex items-center gap-1 border-2 border-[var(--color-snes-gold)] bg-black px-2 py-0.5 text-[var(--color-snes-gold)]">
                                  <Coins className="w-3 h-3" />
                                  <span className="text-[10px] font-bold">
                                    {person.coins}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    setSelectedInventoryProfileId(person.id);
                                    setInventoryModalOpen(true);
                                  }}
                                  className="border-2 border-white bg-black p-1.5 text-zinc-300 hover:bg-white hover:text-black transition-none"
                                  title="Inventário"
                                >
                                  <Package className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="pixel-text text-[7px] text-white/60">
                              {getClassPowerText(person.class)}
                            </div>

                            {!customTitle && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={titleDrafts[person.id] || ""}
                                  onChange={(e) =>
                                    setTitleDrafts((currentDrafts) => ({
                                      ...currentDrafts,
                                      [person.id]: e.target.value,
                                    }))
                                  }
                                  maxLength={40}
                                  placeholder="Titulo pessoal..."
                                  className="snes-input pixel-text h-8 flex-1 px-2.5 py-1 text-[7px] placeholder:text-white/30"
                                />
                                <button
                                  type="button"
                                  onClick={() => saveCustomTitle(person)}
                                  className="pixel-text border-2 border-white bg-black px-2.5 text-[7px] text-white hover:border-[var(--color-snes-gold)] hover:text-[var(--color-snes-gold)]"
                                >
                                  SALVAR
                                </button>
                              </div>
                            )}

                            {(person.passive_coin_multiplier > 1 ||
                              person.temporary_coin_multiplier > 1 ||
                              person.luck > 0) && (
                              <div className="flex flex-wrap gap-1.5">
                                {person.passive_coin_multiplier > 1 && (
                                  <span className="pixel-text border border-yellow-300 bg-yellow-950/45 px-2 py-1 text-[7px] text-yellow-200">
                                    Economia x
                                    {person.passive_coin_multiplier.toFixed(2)}
                                  </span>
                                )}
                                {person.temporary_coin_multiplier > 1 && (
                                  <span className="pixel-text border border-cyan-300 bg-cyan-950/45 px-2 py-1 text-[7px] text-cyan-200">
                                    Boost x
                                    {person.temporary_coin_multiplier.toFixed(
                                      2,
                                    )}
                                  </span>
                                )}
                                {person.luck > 0 && (
                                  <span className="pixel-text border border-blue-300 bg-blue-950/45 px-2 py-1 text-[7px] text-blue-200">
                                    Sorte +{person.luck.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            )}

                            {recentClassEffect && (
                              <div className="pixel-text text-[7px] text-white/75">
                                {recentClassEffect.detail}
                              </div>
                            )}

                            {achievementTitles.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="pixel-text text-[7px] text-white/45">
                                  FEITOS:
                                </span>
                                {achievementTitles.map((title) => (
                                  <span
                                    key={`${person.id}-${title}`}
                                    className="pixel-text border border-[var(--color-snes-gold)]/70 bg-black/45 px-2 py-1 text-[7px] text-[var(--color-snes-gold)]/90"
                                  >
                                    {title}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-0.5 flex gap-1.5">
                              <button
                                onClick={() =>
                                  toggleParticipation(person.id, "pao")
                                }
                                className={`p-1.5 transition-none border-2 ${
                                  person.participates_in_pao
                                    ? "bg-orange-600 text-white border-white"
                                    : "bg-black text-zinc-700 border-zinc-700 hover:border-white hover:text-white"
                                }`}
                                title="Participar do Pão de Queijo"
                              >
                                <Coffee className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  toggleParticipation(person.id, "agua")
                                }
                                className={`p-1.5 transition-none border-2 ${
                                  person.participates_in_agua
                                    ? "bg-blue-600 text-white border-white"
                                    : "bg-black text-zinc-700 border-zinc-700 hover:border-white hover:text-white"
                                }`}
                                title="Participar da Água"
                              >
                                <Droplets className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  toggleParticipation(person.id, "balde")
                                }
                                className={`p-1.5 transition-none border-2 ${
                                  person.participates_in_balde
                                    ? "bg-purple-600 text-white border-white"
                                    : "bg-black text-zinc-700 border-zinc-700 hover:border-white hover:text-white"
                                }`}
                                title="Participar do Balde"
                              >
                                <PaintBucket className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() =>
                                  toggleParticipation(person.id, "geral")
                                }
                                className={`p-1.5 transition-none border-2 ${
                                  person.participates_in_geral
                                    ? "bg-emerald-600 text-white border-white"
                                    : "bg-black text-zinc-700 border-zinc-700 hover:border-white hover:text-white"
                                }`}
                                title="Participar do Geral"
                              >
                                <Star className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => removeName(person.id)}
                            className="border-2 border-transparent p-2 text-zinc-500 opacity-0 transition-none group-hover:opacity-100 hover:border-red-500 hover:bg-black hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      );
                    })(),
                  )}
                </AnimatePresence>
                {profiles.length === 0 && (
                  <div className="retro-empty-state">
                    <div className="retro-empty-icon">
                      <User className="h-7 w-7 text-white/25" />
                    </div>
                    <p className="pixel-text text-[8px] text-white/50">
                      EQUIPE VAZIA.
                      <br />
                      ADICIONE NOMES PARA LUTAR!
                    </p>
                    <button
                      type="button"
                      className="pixel-text border-2 border-white bg-slate-700 px-3 py-2 text-[8px] text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-slate-600"
                    >
                      Importar Lista
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Draw Sections */}
          <div className="flex min-h-0 flex-col gap-4 lg:col-span-9">
            {currentPage === "home" ? (
              <>
                <div className="grid auto-rows-fr grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Pão de Queijo Section */}
                  <section className="draw-card group">
                    <div className="draw-card-header">
                      <div className="flex items-center gap-3">
                        <div>
                          <h2 className="draw-card-title">Pão de Queijo</h2>
                          <div className="draw-card-meta">
                            CICLO DO WORLD BOSS
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="draw-card-progress w-44">
                              <motion.div
                                className="h-full bg-orange-500"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${((profiles.filter((n) => n.participates_in_pao).length - excludedIdsPao.length) / profiles.filter((n) => n.participates_in_pao).length) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="pixel-text border-2 border-white bg-black px-2 py-1 text-[7px] text-white">
                              {profiles.filter((n) => n.participates_in_pao)
                                .length - excludedIdsPao.length}
                              /
                              {
                                profiles.filter((n) => n.participates_in_pao)
                                  .length
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {excludedIdsPao.length > 0 && (
                          <button
                            onClick={() => resetCycle("pao")}
                            className="draw-card-reset"
                            title="Resetar ciclo"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => drawWinner("pao")}
                          disabled={isDrawingPao || profiles.length === 0}
                          className="draw-card-action disabled:rpg-button-disabled"
                        >
                          <Shuffle
                            className={`w-5 h-5 ${isDrawingPao ? "animate-spin" : ""}`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="draw-card-screen">
                      <AnimatePresence mode="wait">
                        {isDrawingPao ? (
                          <motion.div
                            key="drawing"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex flex-col items-center gap-4"
                          >
                            <div className="text-3xl md:text-4xl font-black text-orange-500 tracking-tighter font-display drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                              {cyclingNamePao}
                            </div>
                            <div className="flex gap-2">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  animate={{
                                    opacity: [0.3, 1, 0.3],
                                    scale: [1, 1.2, 1],
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 0.8,
                                    delay: i * 0.2,
                                  }}
                                  className="w-2 h-2 bg-orange-500"
                                />
                              ))}
                            </div>
                          </motion.div>
                        ) : paoDeQueijoWinners.length > 0 ? (
                          <motion.div
                            key="winner"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                          >
                            <motion.div
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="flex items-center justify-center gap-2 text-white mb-3"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                                O escolhido é
                              </span>
                            </motion.div>
                            <div className="flex flex-col gap-2">
                              {paoDeQueijoWinners.map((winner, idx) => (
                                <motion.div
                                  key={winner}
                                  initial={{ y: 20, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  transition={{
                                    delay: 0.3 + idx * 0.1,
                                    type: "spring",
                                  }}
                                  className="text-3xl md:text-4xl font-black text-orange-500 tracking-tighter font-display drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                                >
                                  {winner}
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        ) : (
                          <div className="retro-empty-state w-full max-w-[240px]">
                            <div className="retro-empty-icon">
                              <Coffee className="h-7 w-7 text-white/20" />
                            </div>
                            <p className="pixel-text text-[8px] text-white/45">
                              AGUARDANDO
                              <br />
                              SORTEIO
                            </p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </section>

                  {/* Água Section */}
                  <section className="draw-card group">
                    <div className="draw-card-header">
                      <div className="flex items-center gap-3">
                        <div>
                          <h2 className="draw-card-title">Água</h2>
                          <div className="draw-card-meta">
                            QUEST DIARIA DO SETOR
                          </div>
                          <div className="flex flex-col gap-2 mt-1">
                            <div className="flex items-center gap-2">
                              <div className="draw-card-progress w-44">
                                <motion.div
                                  className="h-full bg-blue-500"
                                  initial={{ width: 0 }}
                                  animate={{
                                    width: `${((profiles.filter((n) => n.participates_in_agua).length - excludedIdsAgua.length) / profiles.filter((n) => n.participates_in_agua).length) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="pixel-text border-2 border-white bg-black px-2 py-1 text-[7px] text-white">
                                {profiles.filter((n) => n.participates_in_agua)
                                  .length - excludedIdsAgua.length}
                                /
                                {
                                  profiles.filter((n) => n.participates_in_agua)
                                    .length
                                }
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setAguaMode("pouca")}
                                className={`text-[8px] px-2 py-1 font-black uppercase tracking-wider transition-none border-2 ${
                                  aguaMode === "pouca"
                                    ? "bg-blue-600 text-white border-white shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                                    : "bg-black text-zinc-500 border-zinc-800 hover:text-white hover:border-white"
                                }`}
                              >
                                Pouca (1)
                              </button>
                              <button
                                onClick={() => setAguaMode("muita")}
                                className={`text-[8px] px-2 py-1 font-black uppercase tracking-wider transition-none border-2 ${
                                  aguaMode === "muita"
                                    ? "bg-blue-600 text-white border-white shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                                    : "bg-black text-zinc-500 border-zinc-800 hover:text-white hover:border-white"
                                }`}
                              >
                                Muita (2)
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {excludedIdsAgua.length > 0 && (
                          <button
                            onClick={() => resetCycle("agua")}
                            className="draw-card-reset"
                            title="Resetar ciclo"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => drawWinner("agua")}
                          disabled={isDrawingAgua || profiles.length === 0}
                          className="draw-card-action disabled:rpg-button-disabled"
                        >
                          <Shuffle
                            className={`w-5 h-5 ${isDrawingAgua ? "animate-spin" : ""}`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="draw-card-screen">
                      <AnimatePresence mode="wait">
                        {isDrawingAgua ? (
                          <motion.div
                            key="drawing-agua"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex flex-col items-center gap-4"
                          >
                            <div className="text-3xl md:text-4xl font-black text-blue-500 tracking-tighter font-display drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                              {cyclingNameAgua}
                            </div>
                            <div className="flex gap-2">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  animate={{
                                    opacity: [0.3, 1, 0.3],
                                    scale: [1, 1.2, 1],
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 0.8,
                                    delay: i * 0.2,
                                  }}
                                  className="w-2 h-2 bg-blue-500"
                                />
                              ))}
                            </div>
                          </motion.div>
                        ) : aguaWinners.length > 0 ? (
                          <motion.div
                            key="winner-agua"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                          >
                            <motion.div
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="flex items-center justify-center gap-2 text-white mb-3"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                                {aguaWinners.length > 1
                                  ? "Os escolhidos são"
                                  : "O escolhido é"}
                              </span>
                            </motion.div>
                            <div className="flex flex-col gap-2">
                              {aguaWinners.map((winner, idx) => (
                                <motion.div
                                  key={winner}
                                  initial={{ x: -20, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: 0.3 + idx * 0.1 }}
                                  className="text-2xl md:text-3xl font-black text-blue-500 tracking-tighter font-display drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                                >
                                  {winner}
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        ) : (
                          <div className="retro-empty-state w-full max-w-[240px]">
                            <div className="retro-empty-icon">
                              <Droplets className="h-7 w-7 text-white/20" />
                            </div>
                            <p className="pixel-text text-[8px] text-white/45">
                              AGUARDANDO
                              <br />
                              SORTEIO
                            </p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </section>

                  {/* Balde Section */}
                  <section className="draw-card group">
                    <div className="draw-card-header">
                      <div className="flex items-center gap-3">
                        <div>
                          <h2 className="draw-card-title">Balde</h2>
                          <div className="draw-card-meta">
                            DESAFIO INTERMEDIARIO
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="draw-card-progress w-44">
                              <motion.div
                                className="h-full bg-purple-500"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${((profiles.filter((n) => n.participates_in_balde).length - excludedIdsBalde.length) / profiles.filter((n) => n.participates_in_balde).length) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="pixel-text border-2 border-white bg-black px-2 py-1 text-[7px] text-white">
                              {profiles.filter((n) => n.participates_in_balde)
                                .length - excludedIdsBalde.length}
                              /
                              {
                                profiles.filter((n) => n.participates_in_balde)
                                  .length
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {excludedIdsBalde.length > 0 && (
                          <button
                            onClick={() => resetCycle("balde")}
                            className="draw-card-reset"
                            title="Resetar ciclo"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => drawWinner("balde")}
                          disabled={isDrawingBalde || profiles.length === 0}
                          className="draw-card-action disabled:rpg-button-disabled"
                        >
                          <Shuffle
                            className={`w-5 h-5 ${isDrawingBalde ? "animate-spin" : ""}`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="draw-card-screen">
                      <AnimatePresence mode="wait">
                        {isDrawingBalde ? (
                          <motion.div
                            key="drawing-balde"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex flex-col items-center gap-4"
                          >
                            <div className="text-3xl md:text-4xl font-black text-purple-500 tracking-tighter font-display drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                              {cyclingNameBalde}
                            </div>
                            <div className="flex gap-2">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  animate={{
                                    opacity: [0.3, 1, 0.3],
                                    scale: [1, 1.2, 1],
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 0.8,
                                    delay: i * 0.2,
                                  }}
                                  className="w-2 h-2 bg-purple-500"
                                />
                              ))}
                            </div>
                          </motion.div>
                        ) : baldeWinners.length > 0 ? (
                          <motion.div
                            key="winner-balde"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                          >
                            <motion.div
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="flex items-center justify-center gap-2 text-white mb-3"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                                O escolhido é
                              </span>
                            </motion.div>
                            <div className="flex flex-col gap-2">
                              {baldeWinners.map((winner, idx) => (
                                <motion.div
                                  key={winner}
                                  initial={{ y: 20, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  transition={{
                                    delay: 0.3 + idx * 0.1,
                                    type: "spring",
                                  }}
                                  className="text-3xl md:text-4xl font-black text-purple-500 tracking-tighter font-display drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                                >
                                  {winner}
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        ) : (
                          <div className="retro-empty-state w-full max-w-[240px]">
                            <div className="retro-empty-icon">
                              <PaintBucket className="h-7 w-7 text-white/20" />
                            </div>
                            <p className="pixel-text text-[8px] text-white/45">
                              AGUARDANDO
                              <br />
                              SORTEIO
                            </p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </section>

                  {/* Geral Section */}
                  <section className="draw-card group">
                    <div className="draw-card-header">
                      <div className="flex items-center gap-3">
                        <div>
                          <h2 className="draw-card-title">Geral</h2>
                          <div className="draw-card-meta">EVENTO NEUTRO</div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="draw-card-progress w-44">
                              <motion.div
                                className="h-full bg-emerald-500"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${((profiles.filter((n) => n.participates_in_geral).length - excludedIdsGeral.length) / profiles.filter((n) => n.participates_in_geral).length) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="pixel-text border-2 border-white bg-black px-2 py-1 text-[7px] text-white">
                              {profiles.filter((n) => n.participates_in_geral)
                                .length - excludedIdsGeral.length}
                              /
                              {
                                profiles.filter((n) => n.participates_in_geral)
                                  .length
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {excludedIdsGeral.length > 0 && (
                          <button
                            onClick={() => resetCycle("geral")}
                            className="draw-card-reset"
                            title="Resetar ciclo"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => drawWinner("geral")}
                          disabled={isDrawingGeral || profiles.length === 0}
                          className="draw-card-action disabled:rpg-button-disabled"
                        >
                          <Shuffle
                            className={`w-5 h-5 ${isDrawingGeral ? "animate-spin" : ""}`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="draw-card-screen">
                      <AnimatePresence mode="wait">
                        {isDrawingGeral ? (
                          <motion.div
                            key="drawing-geral"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex flex-col items-center gap-4"
                          >
                            <div className="text-3xl md:text-4xl font-black text-emerald-500 tracking-tighter font-display drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                              {cyclingNameGeral}
                            </div>
                            <div className="flex gap-2">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  animate={{
                                    opacity: [0.3, 1, 0.3],
                                    scale: [1, 1.2, 1],
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 0.8,
                                    delay: i * 0.2,
                                  }}
                                  className="w-2 h-2 bg-emerald-500"
                                />
                              ))}
                            </div>
                          </motion.div>
                        ) : geralWinners.length > 0 ? (
                          <motion.div
                            key="winner-geral"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-center"
                          >
                            <motion.div
                              initial={{ y: 10, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="flex items-center justify-center gap-2 text-white mb-3"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                                O escolhido é
                              </span>
                            </motion.div>
                            <div className="flex flex-col gap-2">
                              {geralWinners.map((winner, idx) => (
                                <motion.div
                                  key={winner}
                                  initial={{ y: 20, opacity: 0 }}
                                  animate={{ y: 0, opacity: 1 }}
                                  transition={{
                                    delay: 0.3 + idx * 0.1,
                                    type: "spring",
                                  }}
                                  className="text-3xl md:text-4xl font-black text-emerald-500 tracking-tighter font-display drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                                >
                                  {winner}
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        ) : (
                          <div className="retro-empty-state w-full max-w-[240px]">
                            <div className="retro-empty-icon">
                              <Star className="h-7 w-7 text-white/20" />
                            </div>
                            <p className="pixel-text text-[8px] text-white/45">
                              AGUARDANDO
                              <br />
                              SORTEIO
                            </p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </section>
                </div>

                {mageProfiles.length > 0 && (
                  <section
                    className={`glass-card p-5 ${
                      mageInsights && selectedMageId ? "snes-arcane-glow" : ""
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between border-b border-white/20 pb-3">
                      <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
                        OLHAR ARCANO
                      </h2>
                      <Wand2 className="h-4 w-4 text-[var(--color-snes-gold)]" />
                    </div>

                    <div className="mb-4">
                      <label className="pixel-text mb-2 block text-[8px] text-white/70">
                        MAGO ATIVO:
                      </label>
                      <select
                        className="snes-input pixel-text w-full text-[8px]"
                        value={selectedMageId || ""}
                        onChange={(e) => setSelectedMageId(e.target.value)}
                      >
                        {mageProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {mageInsights ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {mageInsights.queues.map((queue) => (
                            <div
                              key={queue.key}
                              className="border-2 border-white/20 bg-black/30 p-3"
                            >
                              <div className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
                                {queue.label}
                              </div>
                              <div className="mt-2 pixel-text text-[7px] text-white/65">
                                FILA: {queue.excludedNames.length}
                              </div>
                              <div className="mt-2 min-h-9 space-y-1">
                                {queue.excludedNames.length > 0 ? (
                                  queue.excludedNames
                                    .slice(0, 3)
                                    .map((name) => (
                                      <div
                                        key={`${queue.key}-${name}`}
                                        className="pixel-text truncate text-[7px] text-white"
                                      >
                                        {name}
                                      </div>
                                    ))
                                ) : (
                                  <div className="pixel-text text-[7px] text-white/40">
                                    LIMPA
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-2 border-white/20 bg-black/30 p-3">
                          <div className="pixel-text mb-3 text-[8px] text-[var(--color-snes-gold)]">
                            LOG DETALHADO
                          </div>
                          <div className="space-y-2">
                            {mageInsights.recentLogs
                              .slice(0, 4)
                              .map((entry) => (
                                <div
                                  key={entry.id}
                                  className="border-l-2 border-[var(--color-snes-gold)] bg-white/5 px-2 py-2"
                                >
                                  <div className="pixel-text text-[7px] text-white">
                                    {entry.profiles?.name || "SISTEMA"}
                                  </div>
                                  <div className="pixel-text mt-1 text-[7px] text-white/60">
                                    {entry.message}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-white/20 p-6 text-center">
                        <p className="pixel-text text-[8px] text-white/50">
                          SEM LEITURA ARCANA
                        </p>
                      </div>
                    )}
                  </section>
                )}
              </>
            ) : currentPage === "history" ? (
              <>
                {historySection}
                {mageProfiles.length > 0 && (
                  <section
                    className={`glass-card p-5 ${
                      mageInsights && selectedMageId ? "snes-arcane-glow" : ""
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between border-b border-white/20 pb-3">
                      <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
                        OLHAR ARCANO
                      </h2>
                      <Wand2 className="h-4 w-4 text-[var(--color-snes-gold)]" />
                    </div>

                    <div className="mb-4">
                      <label className="pixel-text mb-2 block text-[8px] text-white/70">
                        MAGO ATIVO:
                      </label>
                      <select
                        className="snes-input pixel-text w-full text-[8px]"
                        value={selectedMageId || ""}
                        onChange={(e) => setSelectedMageId(e.target.value)}
                      >
                        {mageProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {mageInsights ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {mageInsights.queues.map((queue) => (
                            <div
                              key={queue.key}
                              className="border-2 border-white/20 bg-black/30 p-3"
                            >
                              <div className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
                                {queue.label}
                              </div>
                              <div className="mt-2 pixel-text text-[7px] text-white/65">
                                FILA: {queue.excludedNames.length}
                              </div>
                              <div className="mt-2 min-h-9 space-y-1">
                                {queue.excludedNames.length > 0 ? (
                                  queue.excludedNames
                                    .slice(0, 3)
                                    .map((name) => (
                                      <div
                                        key={`${queue.key}-${name}`}
                                        className="pixel-text truncate text-[7px] text-white"
                                      >
                                        {name}
                                      </div>
                                    ))
                                ) : (
                                  <div className="pixel-text text-[7px] text-white/40">
                                    LIMPA
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-2 border-white/20 bg-black/30 p-3">
                          <div className="pixel-text mb-3 text-[8px] text-[var(--color-snes-gold)]">
                            LOG DETALHADO
                          </div>
                          <div className="space-y-2">
                            {mageInsights.recentLogs
                              .slice(0, 4)
                              .map((entry) => (
                                <div
                                  key={entry.id}
                                  className="border-l-2 border-[var(--color-snes-gold)] bg-white/5 px-2 py-2"
                                >
                                  <div className="pixel-text text-[7px] text-white">
                                    {entry.profiles?.name || "SISTEMA"}
                                  </div>
                                  <div className="pixel-text mt-1 text-[7px] text-white/60">
                                    {entry.message}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-white/20 p-6 text-center">
                        <p className="pixel-text text-[8px] text-white/50">
                          SEM LEITURA ARCANA
                        </p>
                      </div>
                    )}
                  </section>
                )}
              </>
            ) : currentPage === "guide" ? (
              guideSection
            ) : (
              settingsSection
            )}
          </div>
        </main>
      </div>

      {/* Class Selection Modal */}
      <AnimatePresence>
        {classModalOpen &&
          selectedProfileId &&
          (() => {
            const selectedProfile = profiles.find(
              (profile) => profile.id === selectedProfileId,
            );
            if (!selectedProfile) return null;

            const classOptions = getClassProgressionOptions(selectedProfile);
            const progressionMessage =
              selectedProfile.class === "novato"
                ? selectedProfile.level >= APPRENTICE_UNLOCK_LEVEL
                  ? "Promovido. Escolha sua trilha de aprendiz."
                  : `Alcance o nível ${APPRENTICE_UNLOCK_LEVEL} para escolher sua trilha.`
                : selectedProfile.class.startsWith("aprendiz_")
                  ? selectedProfile.level >= FINAL_CLASS_UNLOCK_LEVEL
                    ? "Evolução liberada. Conclua sua classe final."
                    : `Alcance o nível ${FINAL_CLASS_UNLOCK_LEVEL} para concluir sua classe final.`
                  : "Classe final já definida.";

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => {
                  setClassModalOpen(false);
                  setSelectedProfileId(null);
                }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-black border-4 border-white p-6 max-w-md w-full shadow-[8px_8px_0px_rgba(0,0,0,1)]"
                >
                  <h3 className="text-xl font-black text-white mb-2 text-center font-display drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    Progresso de Classe
                  </h3>
                  <p className="text-zinc-400 text-[10px] uppercase tracking-widest text-center mb-6">
                    {selectedProfile.name} está como{" "}
                    {getClassLabel(selectedProfile.class)}. {progressionMessage}
                  </p>

                  {selectedProfile.class === "novato" && (
                    <div className="mb-4 border-2 border-white/20 bg-black/30 p-3 text-center">
                      <div className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
                        PASSIVA DE NOVATO
                      </div>
                      <div className="pixel-text mt-2 text-[7px] text-white/65">
                        +10% XP enquanto aprende o sistema
                      </div>
                    </div>
                  )}

                  {classOptions.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {classOptions.map((classOption) => {
                        const meta = classOptionMeta[classOption];
                        return (
                          <button
                            key={classOption}
                            onClick={() =>
                              changeClass(selectedProfileId, classOption)
                            }
                            className={`flex flex-col items-center gap-3 p-4 bg-black border-2 border-zinc-800 transition-none group ${meta.tone}`}
                          >
                            <div className="p-3 bg-black/30 border-2 border-transparent group-hover:border-white transition-none">
                              {meta.icon}
                            </div>
                            <div className="text-center">
                              <span className="block font-black text-white text-sm uppercase tracking-widest">
                                {meta.label}
                              </span>
                              <span className="text-[8px] text-zinc-500 block mt-2 leading-tight uppercase tracking-wider">
                                {meta.description}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-white/20 p-5 text-center">
                      <div className="pixel-text text-[8px] text-[var(--color-snes-gold)]">
                        PROGRESSÃO BLOQUEADA
                      </div>
                      <div className="pixel-text mt-2 text-[7px] text-white/55">
                        {progressionMessage}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setClassModalOpen(false);
                      setSelectedProfileId(null);
                    }}
                    className="w-full mt-6 py-3 bg-black border-2 border-zinc-800 font-black text-zinc-500 hover:text-white hover:border-white uppercase tracking-widest transition-none"
                  >
                    Cancelar
                  </button>
                </motion.div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* Shop Modal */}
      <AnimatePresence>
        {shopModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShopModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border-4 border-white p-6 max-w-2xl w-full shadow-[8px_8px_0px_rgba(0,0,0,1)] max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white font-display flex items-center gap-3 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <ShoppingCart className="w-6 h-6 text-yellow-500" />
                    Loja do Setor
                  </h3>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-2">
                    Gaste suas SetorCoins ($C) aqui.
                  </p>
                </div>
                <button
                  onClick={() => setShopModalOpen(false)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-black border-2 border-transparent hover:border-white transition-none"
                >
                  <X className="w-5 h-5" />
                  <span className="sr-only">Fechar</span>
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                  Comprador:
                </label>
                <select
                  className="w-full bg-black border-2 border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-white transition-none appearance-none"
                  value={selectedProfileId || ""}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                >
                  <option value="" disabled>
                    Selecione um participante
                  </option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.coins} $C)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {shopItems.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-zinc-800">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest">
                      A loja está vazia no momento.
                    </p>
                  </div>
                ) : (
                  shopItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 bg-black border-2 border-zinc-800 hover:border-white transition-none"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white uppercase tracking-wider">
                            {item.name}
                          </h4>
                          <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-400">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-wider">
                          {item.description}
                        </p>
                        {getItemEffectText(item) && (
                          <p className="pixel-text mt-2 text-[7px] text-cyan-300">
                            {getItemEffectText(item)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="flex items-center gap-1 text-yellow-500 bg-black border-2 border-yellow-500 px-3 py-1">
                          <Coins className="w-4 h-4" />
                          <span className="font-black">{item.price}</span>
                        </div>
                        <button
                          disabled={
                            !selectedProfileId ||
                            (profiles.find((p) => p.id === selectedProfileId)
                              ?.coins || 0) < item.price
                          }
                          onClick={() =>
                            selectedProfileId &&
                            buyItem(selectedProfileId, item.id)
                          }
                          className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 border-2 transition-none ${
                            !selectedProfileId ||
                            (profiles.find((p) => p.id === selectedProfileId)
                              ?.coins || 0) < item.price
                              ? "bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed"
                              : "bg-yellow-600 border-white text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-yellow-500 active:translate-y-[2px] active:shadow-none"
                          }`}
                        >
                          Comprar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inventory Modal */}
      <AnimatePresence>
        {inventoryModalOpen && selectedInventoryProfileId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setInventoryModalOpen(false);
              setSelectedInventoryProfileId(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black border-4 border-white p-6 max-w-2xl w-full shadow-[8px_8px_0px_rgba(0,0,0,1)] max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-black text-white font-display flex items-center gap-3 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                    <Package className="w-6 h-6 text-emerald-500" />
                    Inventário
                  </h3>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-2">
                    {
                      profiles.find((p) => p.id === selectedInventoryProfileId)
                        ?.name
                    }
                  </p>
                </div>
                <button
                  onClick={() => {
                    setInventoryModalOpen(false);
                    setSelectedInventoryProfileId(null);
                  }}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-black border-2 border-transparent hover:border-white transition-none"
                >
                  <X className="w-5 h-5" />
                  <span className="sr-only">Fechar</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                {(() => {
                  const profile = profiles.find(
                    (p) => p.id === selectedInventoryProfileId,
                  );
                  if (
                    !profile ||
                    !profile.inventory ||
                    profile.inventory.length === 0
                  ) {
                    return (
                      <div className="text-center py-12 border-2 border-dashed border-zinc-800">
                        <p className="text-zinc-500 text-[10px] uppercase tracking-widest">
                          O inventário está vazio.
                        </p>
                      </div>
                    );
                  }

                  return profile.inventory.map((invItem) => {
                    const itemDetails = shopItems.find(
                      (si) => si.id === invItem.item_id,
                    );
                    if (!itemDetails) return null;

                    return (
                      <div
                        key={invItem.item_id}
                        className="flex items-center justify-between p-4 bg-black border-2 border-zinc-800 hover:border-white transition-none"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-white uppercase tracking-wider">
                              {itemDetails.name}
                            </h4>
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-zinc-900 border border-zinc-700 text-zinc-400">
                              {itemDetails.type}
                            </span>
                            <span className="text-[8px] font-black px-2 py-1 bg-indigo-900 border border-indigo-500 text-indigo-400">
                              x{invItem.qty}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-wider">
                            {itemDetails.description}
                          </p>
                          {getItemEffectText(itemDetails) && (
                            <p className="pixel-text mt-2 text-[7px] text-cyan-300">
                              {getItemEffectText(itemDetails)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <button
                            onClick={() => useItem(profile.id, itemDetails.id)}
                            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 border-2 bg-emerald-600 border-white text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-emerald-500 active:translate-y-[2px] active:shadow-none transition-none"
                          >
                            Usar
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
