import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Coins,
  Coffee,
  Droplets,
  Shuffle,
  Trash2,
  User,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  PaintBucket,
  Star,
  Cloud,
  CloudOff,
  RefreshCw,
  RotateCcw,
  History,
  Shield,
  Wand2,
  Crosshair,
  Heart,
  ShoppingCart,
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
import { GuideSection } from "./components/app/GuideSection";
import { HistorySection } from "./components/app/HistorySection";
import { MageSection } from "./components/app/MageSection";
import { ParticipantHomeSection } from "./components/app/ParticipantHomeSection";
import { SettingsSection } from "./components/app/SettingsSection";
import { ClassSelectionModal } from "./components/app/ClassSelectionModal";
import { ShopModal } from "./components/app/ShopModal";
import { InventoryModal } from "./components/app/InventoryModal";

const STATE_KEY = "sorteio_estado_completo";
const APPRENTICE_UNLOCK_LEVEL = 3;
const FINAL_CLASS_UNLOCK_LEVEL = 5;
const RECENT_EFFECT_WINDOW_MS = 15 * 60 * 1000;
const CUSTOM_TITLE_PREFIX = "custom:";

export default function App() {
  const [currentPage, setCurrentPage] = useState<
    "home" | "draws" | "history" | "settings" | "guide"
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

      setIsDrawingPao(true);
      setPaoDeQueijoWinners([]);

      const timer = setInterval(async () => {
        const randomIndex = getSecureRandomInt(eligibleProfiles.length);
        setCyclingNamePao(eligibleProfiles[randomIndex].name);
        currentStep++;

        if (currentStep >= steps) {
          clearInterval(timer);

          const winnerIndex = getSecureRandomInt(eligibleProfiles.length);
          const winner = eligibleProfiles[winnerIndex];

          setPaoDeQueijoWinners([winner.name]);
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

      setIsDrawingAgua(true);
      setAguaWinners([]);

      const timer = setInterval(async () => {
        const randomIndex = getSecureRandomInt(eligibleProfiles.length);
        setCyclingNameAgua(eligibleProfiles[randomIndex].name);
        currentStep++;

        if (currentStep >= steps) {
          clearInterval(timer);

          const indices = new Set<number>();
          while (
            indices.size < Math.min(winnerCount, eligibleProfiles.length)
          ) {
            indices.add(getSecureRandomInt(eligibleProfiles.length));
          }

          const selectedWinners = Array.from(indices).map(
            (i) => eligibleProfiles[i],
          );
          setAguaWinners(selectedWinners.map((w) => w.name));
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

      setIsDrawingBalde(true);
      setBaldeWinners([]);

      const timer = setInterval(async () => {
        const randomIndex = getSecureRandomInt(eligibleProfiles.length);
        setCyclingNameBalde(eligibleProfiles[randomIndex].name);
        currentStep++;

        if (currentStep >= steps) {
          clearInterval(timer);

          const winnerIndex = getSecureRandomInt(eligibleProfiles.length);
          const winner = eligibleProfiles[winnerIndex];

          setBaldeWinners([winner.name]);
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

      setIsDrawingGeral(true);
      setGeralWinners([]);

      const timer = setInterval(async () => {
        const randomIndex = getSecureRandomInt(eligibleProfiles.length);
        setCyclingNameGeral(eligibleProfiles[randomIndex].name);
        currentStep++;

        if (currentStep >= steps) {
          clearInterval(timer);

          const winnerIndex = getSecureRandomInt(eligibleProfiles.length);
          const winner = eligibleProfiles[winnerIndex];

          setGeralWinners([winner.name]);
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

  const handleGeneralReset = () => {
    if (
      window.confirm(
        "Deseja realizar um reset geral? Isso limpará os vencedores atuais e o histórico visual, mantendo os participantes e suas funções.",
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

  const getParticipationCount = (
    category: "pao" | "agua" | "balde" | "geral",
  ) => {
    if (category === "pao")
      return profiles.filter((profile) => profile.participates_in_pao).length;
    if (category === "agua")
      return profiles.filter((profile) => profile.participates_in_agua).length;
    if (category === "balde")
      return profiles.filter((profile) => profile.participates_in_balde).length;
    return profiles.filter((profile) => profile.participates_in_geral).length;
  };

  const getParticipationRatio = (
    category: "pao" | "agua" | "balde" | "geral",
  ) => {
    if (profiles.length === 0) return 0;
    return (getParticipationCount(category) / profiles.length) * 100;
  };

  const historySection = (
    <HistorySection battleLogs={battleLogs} onClear={() => setBattleLogs([])} />
  );

  const settingsSection = (
    <SettingsSection
      dbProvider={dbProvider}
      isSyncing={isSyncing}
      syncError={syncError}
      profilesCount={profiles.length}
      battleLogsCount={battleLogs.length}
      onResetVisualState={handleGeneralReset}
      onClearLocalState={() => {
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
      onClearScreenLogs={() => setBattleLogs([])}
    />
  );

  const guideSection = <GuideSection />;

  const participantHomeSection = (
    <ParticipantHomeSection
      profiles={profiles}
      highestLevel={highestLevel}
      newName={newName}
      titleDrafts={titleDrafts}
      titlesByProfileId={titlesByProfileId}
      selectedMageId={selectedMageId}
      mageInsights={mageInsights}
      onOpenDraws={() => setCurrentPage("draws")}
      onOpenGuide={() => setCurrentPage("guide")}
      onAddName={addName}
      onNewNameChange={setNewName}
      onOpenClassSelection={(profileId) => {
        setSelectedProfileId(profileId);
        setClassModalOpen(true);
      }}
      onOpenInventory={(profileId) => {
        setSelectedInventoryProfileId(profileId);
        setInventoryModalOpen(true);
      }}
      onToggleParticipation={toggleParticipation}
      onTitleDraftChange={(profileId, title) =>
        setTitleDrafts((currentDrafts) => ({
          ...currentDrafts,
          [profileId]: title,
        }))
      }
      onSaveCustomTitle={saveCustomTitle}
      onRemoveProfile={removeName}
      getParticipationCount={getParticipationCount}
      getExhaustionState={getExhaustionState}
      getCustomTitle={getCustomTitle}
      getClassPowerText={getClassPowerText}
      recentClassEffectsByProfileId={recentClassEffectsByProfileId}
    />
  );

  const mageSection = (
    <MageSection
      mageProfiles={mageProfiles}
      mageInsights={mageInsights}
      selectedMageId={selectedMageId}
      onSelectMage={setSelectedMageId}
    />
  );

  const selectedProfile =
    selectedProfileId !== null
      ? profiles.find((profile) => profile.id === selectedProfileId) || null
      : null;
  const selectedInventoryProfile =
    selectedInventoryProfileId !== null
      ? profiles.find((profile) => profile.id === selectedInventoryProfileId) ||
        null
      : null;

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
          <div className="flex flex-col gap-4 lg:col-span-2">
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
                    Participantes
                  </button>
                </li>
                <li
                  className={`menu-entry ${currentPage === "draws" ? "menu-entry-active" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => setCurrentPage("draws")}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <Shuffle className="h-4 w-4 text-[var(--color-snes-gold)]" />
                    Sorteios
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
          </div>

          {/* Main Content */}
          <div className="flex min-h-0 flex-col gap-4 lg:col-span-10">
            {currentPage === "home" ? (
              participantHomeSection
            ) : currentPage === "draws" ? (
              <>
                <section className="glass-card p-5">
                  <div className="flex flex-col gap-4 border-b-2 border-white/20 pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="pixel-text text-[10px] text-[var(--color-snes-gold)]">
                        MESA DE SORTEIOS
                      </h2>
                      <p className="pixel-text mt-2 text-[7px] text-white/55">
                        EXECUTE O TURNO COM O GRUPO JÁ PREPARADO NA CENTRAL DE
                        PARTICIPANTES
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentPage("home")}
                      className="pixel-text border-2 border-white bg-black px-4 py-2 text-[7px] text-white hover:border-[var(--color-snes-gold)] hover:text-[var(--color-snes-gold)]"
                    >
                      VOLTAR PARA PARTICIPANTES
                    </button>
                  </div>
                </section>

                <div className="grid auto-rows-fr grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Pão de Queijo Section */}
                  <section className="draw-card group">
                    <div className="draw-card-header">
                      <div className="flex items-center gap-3">
                        <div>
                          <h2 className="draw-card-title">Pão de Queijo</h2>
                          <div className="draw-card-meta">
                            WORLD BOSS DO SETOR
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="draw-card-progress w-44">
                              <motion.div
                                className="h-full bg-orange-500"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${getParticipationRatio("pao")}%`,
                                }}
                              />
                            </div>
                            <span className="pixel-text border-2 border-white bg-black px-2 py-1 text-[7px] text-white">
                              {getParticipationCount("pao")}/{profiles.length}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => drawWinner("pao")}
                          disabled={
                            isDrawingPao || getParticipationCount("pao") === 0
                          }
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
                                    width: `${getParticipationRatio("agua")}%`,
                                  }}
                                />
                              </div>
                              <span className="pixel-text border-2 border-white bg-black px-2 py-1 text-[7px] text-white">
                                {getParticipationCount("agua")}/
                                {profiles.length}
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
                        <button
                          onClick={() => drawWinner("agua")}
                          disabled={
                            isDrawingAgua || getParticipationCount("agua") === 0
                          }
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
                                  width: `${getParticipationRatio("balde")}%`,
                                }}
                              />
                            </div>
                            <span className="pixel-text border-2 border-white bg-black px-2 py-1 text-[7px] text-white">
                              {getParticipationCount("balde")}/{profiles.length}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => drawWinner("balde")}
                          disabled={
                            isDrawingBalde ||
                            getParticipationCount("balde") === 0
                          }
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
                          <div className="draw-card-meta">
                            RECOMPENSA BASE DO SETOR
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="draw-card-progress w-44">
                              <motion.div
                                className="h-full bg-emerald-500"
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${getParticipationRatio("geral")}%`,
                                }}
                              />
                            </div>
                            <span className="pixel-text border-2 border-white bg-black px-2 py-1 text-[7px] text-white">
                              {getParticipationCount("geral")}/{profiles.length}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => drawWinner("geral")}
                          disabled={
                            isDrawingGeral ||
                            getParticipationCount("geral") === 0
                          }
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

                {mageSection}
              </>
            ) : currentPage === "history" ? (
              <>
                {historySection}
                {mageSection}
              </>
            ) : currentPage === "guide" ? (
              guideSection
            ) : (
              settingsSection
            )}
          </div>
        </main>
      </div>

      <ClassSelectionModal
        open={classModalOpen}
        profile={selectedProfile}
        apprenticeUnlockLevel={APPRENTICE_UNLOCK_LEVEL}
        finalClassUnlockLevel={FINAL_CLASS_UNLOCK_LEVEL}
        getClassLabel={getClassLabel}
        getClassProgressionOptions={getClassProgressionOptions}
        classOptionMeta={classOptionMeta}
        onChangeClass={changeClass}
        onClose={() => {
          setClassModalOpen(false);
          setSelectedProfileId(null);
        }}
      />

      <ShopModal
        open={shopModalOpen}
        profiles={profiles}
        shopItems={shopItems}
        selectedProfileId={selectedProfileId}
        getItemEffectText={getItemEffectText}
        onClose={() => setShopModalOpen(false)}
        onSelectProfile={setSelectedProfileId}
        onBuyItem={buyItem}
      />

      <InventoryModal
        open={inventoryModalOpen}
        profile={selectedInventoryProfile}
        shopItems={shopItems}
        getItemEffectText={getItemEffectText}
        onClose={() => {
          setInventoryModalOpen(false);
          setSelectedInventoryProfileId(null);
        }}
        onUseItem={useItem}
      />
    </div>
  );
}
