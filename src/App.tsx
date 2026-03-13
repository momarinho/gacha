import React, { useEffect, useState } from "react";
import { Trash2, UserPlus, Package } from "lucide-react";

import {
  BattleLog,
  MageInsights,
  Profile,
  ProfileClass,
  ShopItem,
} from "./types";
import { api } from "./services/api";
import {
  APPRENTICE_UNLOCK_LEVEL,
  AppPage,
  CUSTOM_TITLE_PREFIX,
  FINAL_CLASS_UNLOCK_LEVEL,
  STATE_KEY,
} from "./app/constants";
import {
  buildRecentClassEffectsByProfileId,
  classOptionMeta,
  getClassLabel,
  getClassPowerText,
  getClassProgressionOptions,
  getCustomTitle,
  getExhaustionState,
  getHighestLevel,
  getItemEffectText,
  getSecureRandomInt,
  resolveWinnerNames,
} from "./app/helpers";
import { AppHeader } from "./components/app/AppHeader";
import { AppSidebar } from "./components/app/AppSidebar";
import { GuideSection } from "./components/app/GuideSection";
import { HistorySection } from "./components/app/HistorySection";
import { MageSection } from "./components/app/MageSection";
import { ParticipantHomeSection } from "./components/app/ParticipantHomeSection";
import { SettingsSection } from "./components/app/SettingsSection";
import { ClassSelectionModal } from "./components/app/ClassSelectionModal";
import { ShopModal } from "./components/app/ShopModal";
import { InventoryModal } from "./components/app/InventoryModal";
import { DrawsPage } from "./components/app/DrawsPage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<AppPage>("home");
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

  const highestLevel = getHighestLevel(profiles);
  const recentClassEffectsByProfileId = buildRecentClassEffectsByProfileId(
    profiles,
    battleLogs,
  );

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
        <AppHeader
          dbProvider={dbProvider}
          isSyncing={isSyncing}
          syncError={syncError}
          onOpenShop={() => setShopModalOpen(true)}
          onReset={handleGeneralReset}
          onOpenSettings={() => setCurrentPage("settings")}
        />

        <main className="grid min-h-[calc(100vh-82px)] grid-cols-1 gap-3 px-2 py-3 lg:grid-cols-12 lg:px-3 lg:py-3 xl:px-4">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
          </div>

          <div className="flex min-h-0 flex-col gap-4 lg:col-span-10">
            {currentPage === "home" ? (
              participantHomeSection
            ) : currentPage === "draws" ? (
              <DrawsPage
                profilesCount={profiles.length}
                aguaMode={aguaMode}
                mageSection={mageSection}
                paoDeQueijoWinners={paoDeQueijoWinners}
                aguaWinners={aguaWinners}
                baldeWinners={baldeWinners}
                geralWinners={geralWinners}
                isDrawingPao={isDrawingPao}
                isDrawingAgua={isDrawingAgua}
                isDrawingBalde={isDrawingBalde}
                isDrawingGeral={isDrawingGeral}
                cyclingNamePao={cyclingNamePao}
                cyclingNameAgua={cyclingNameAgua}
                cyclingNameBalde={cyclingNameBalde}
                cyclingNameGeral={cyclingNameGeral}
                onBack={() => setCurrentPage("home")}
                onSetAguaMode={setAguaMode}
                onDraw={drawWinner}
                getParticipationCount={getParticipationCount}
                getParticipationRatio={getParticipationRatio}
              />
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
