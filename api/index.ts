import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const GUERREIRO_PASSIVE_XP = 5;
const CLERIGO_GROUP_COINS = 3;
const COIN_MAGNET_MULTIPLIER = 1.5;
const NOVATO_XP_MULTIPLIER = 1.1;
const APPRENTICE_UNLOCK_LEVEL = 3;
const FINAL_CLASS_UNLOCK_LEVEL = 5;
const CUSTOM_TITLE_PREFIX = "custom:";

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

type ProfileClass = (typeof PROFILE_CLASSES)[number];

type ActiveBuff = {
  type: string;
  expiresAt: string;
  value?: number;
  metadata?: Record<string, any>;
};

type ItemMetadata = {
  multiplier?: number;
  profileModifiers?: {
    passive_coin_multiplier?: number;
    temporary_coin_multiplier?: number;
    exhaustion_threshold?: number;
    exhaustion_penalty_multiplier?: number;
    luck?: number;
  };
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
    acc[rawKey] = decodeURIComponent(rawValue.join("="));
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
) {
  const normalizedLuck =
    typeof luck === "number" && Number.isFinite(luck) ? Math.max(0, luck) : 0;
  const reliefLuckBonus = getBuffValue(buffs, "RELIEF_LUCK");

  if (profileClass === "ladino") {
    return LADINO_DODGE_BASE + normalizedLuck + reliefLuckBonus;
  }

  return 0;
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
    const dbPath = path.join(__dirname, "..", "raffle.db");
    console.log(`No Supabase config found. Using local SQLite at ${dbPath}`);
    try {
      const { default: Database } = await import("better-sqlite3");
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
          name: "Café Expresso",
          description: "Recupera 50% do HP/Sanidade instantaneamente.",
          price: 50,
          type: "consumable",
          effect_code: "HEAL_PERCENT_50",
          icon: "Coffee",
          min_level: 1,
          stackable: true,
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
          name: "Contrato de Terceirização",
          description:
            "Se você for sorteado na Água, tenta terceirizar o turno para outro participante.",
          price: 260,
          type: "rare",
          effect_code: "OUTSOURCE_AGUA",
          icon: "RefreshCw",
          min_level: 3,
          stackable: true,
          target_category: "agua",
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

      const chargedPrice =
        profile.class === "mago"
          ? Math.ceil(item.price * 0.8)
          : profile.class === "aprendiz_mago"
            ? Math.ceil(item.price * 0.9)
            : item.price;

      if (profile.coins < chargedPrice)
        return res.status(400).json({ error: "Not enough coins" });
      if (profile.level < item.min_level)
        return res.status(400).json({ error: "Level too low" });

      const newCoins = profile.coins - chargedPrice;
      const inventory = profile.inventory || [];
      const existingItem = inventory.find((i: any) => i.item_id === itemId);

      if (existingItem) {
        existingItem.qty += 1;
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
            originalPrice: item.price,
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
      const itemDurationMinutes =
        typeof item.duration_minutes === "number" && item.duration_minutes > 0
          ? item.duration_minutes
          : 60;
      const itemMetadata = normalizeItemMetadata(item.metadata);

      // Apply effect based on effect_code
      if (
        item.effect_code === "HEAL_50" ||
        item.effect_code === "HEAL_PERCENT_50"
      ) {
        const recoveredHp = Math.max(1, Math.ceil(profile.max_hp * 0.5));
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
          metadata: { itemId, effect: item.effect_code },
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

      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("*");
      if (pErr) throw pErr;

      const participantSet = new Set<string>(participants);
      const participantProfiles = profiles.filter((profile: any) =>
        participantSet.has(profile.id),
      );
      const profileMap = new Map<string, any>(
        profiles.map((profile: any) => [profile.id, profile]),
      );

      const resolvedWinnerIds = [...winnerIds];
      const consumedBuffsByProfile = new Map<string, Set<string>>();
      const updates = [];
      const logs = [];

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
        );
        let shouldReroll = false;

        if (category === "balde" && hasBuff(activeBuffs, "SKIP_BALDE")) {
          shouldReroll = true;
          consumeBuff(requestedWinner.id, "SKIP_BALDE");
          logs.push({
            event_type: "item_use",
            category,
            message: `${requestedWinner.name} usou Relatório Falso e escapou do Balde`,
            primary_actor_id: requestedWinner.id,
          });
        }

        if (["pao", "agua", "balde"].includes(category)) {
          const dodgeChance = getDodgeChance(
            requestedWinner.class,
            requestedWinner.luck,
            activeBuffs,
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
            message: `${requestedWinner.name} terceirizou a Água`,
            primary_actor_id: requestedWinner.id,
          });
        }

        if (category === "pao" && hasBuff(activeBuffs, "TRANSFER_PAO")) {
          shouldReroll = true;
          consumeBuff(requestedWinner.id, "TRANSFER_PAO");
          logs.push({
            event_type: "item_use",
            category,
            message: `${requestedWinner.name} transferiu o Pão de Queijo`,
            primary_actor_id: requestedWinner.id,
          });
        }

        if (!shouldReroll) continue;

        const rerollPool = participantProfiles.filter(
          (profile: any) =>
            profile.id !== requestedWinner.id &&
            !resolvedWinnerIds.includes(profile.id),
        );

        if (rerollPool.length === 0) continue;

        resolvedWinnerIds[index] =
          rerollPool[randomIndex(rerollPool.length)].id;
      }

      const clericWinnerIds = resolvedWinnerIds.filter((id) => {
        const profile = profileMap.get(id);
        return profile?.class === "clerigo";
      });

      for (const p of profiles) {
        const isParticipant = participantSet.has(p.id);
        const isWinner = resolvedWinnerIds.includes(p.id);
        let hpChange = 0;
        let xpChange = p.class === "guerreiro" ? GUERREIRO_PASSIVE_XP : 0;
        let coinsChange = 0;
        let activeBuffs = purgeExpiredBuffs(normalizeBuffs(p.active_buffs));
        let titles = normalizeTitles(p.titles);
        const luck = typeof p.luck === "number" ? p.luck : 0;
        const exhaustionThreshold =
          typeof p.exhaustion_threshold === "number"
            ? p.exhaustion_threshold
            : 0.3;
        const exhaustionPenaltyMultiplier =
          typeof p.exhaustion_penalty_multiplier === "number"
            ? p.exhaustion_penalty_multiplier
            : 0.5;

        if (category === "balde") {
          activeBuffs = activeBuffs.filter(
            (buff) => buff.type !== "SKIP_BALDE",
          );
        }

        const consumedBuffs = consumedBuffsByProfile.get(p.id);
        if (consumedBuffs) {
          activeBuffs = activeBuffs.filter(
            (buff) => !consumedBuffs.has(buff.type),
          );
        }

        const recoveryPerDraw = getBuffValue(activeBuffs, "POST_PAO_RECOVERY");
        let newHp = Math.min(p.max_hp, p.hp + recoveryPerDraw);

        if (newHp >= p.max_hp) {
          activeBuffs = activeBuffs.filter(
            (buff) => buff.type !== "POST_PAO_RECOVERY",
          );
        }

        const {
          passive: passiveCoinMultiplier,
          temporary: temporaryCoinMultiplier,
        } = resolveCoinMultipliers(
          activeBuffs,
          p.passive_coin_multiplier,
          p.temporary_coin_multiplier,
        );

        if (isParticipant) {
          if (category === "pao") {
            if (isWinner) {
              hpChange = -40;
            } else {
              xpChange += 20;
              coinsChange += 10;
              activeBuffs.push({
                type: "RELIEF_LUCK",
                expiresAt: new Date(
                  Date.now() + 6 * 60 * 60 * 1000,
                ).toISOString(),
                value: DEFAULT_RELIEF_LUCK_BONUS,
              });
            }
          } else if (category === "agua") {
            if (isWinner) {
              xpChange += 10;
              coinsChange += 5;
            } else {
              xpChange += 5;
            }
          } else if (category === "balde") {
            if (isWinner) {
              hpChange = -20;
              xpChange += 30;
              coinsChange += 15;
            } else {
              xpChange += 10;
            }
          } else if (category === "geral") {
            coinsChange += 5;
          }
        }

        if (p.class === "novato" && xpChange > 0) {
          xpChange = Math.ceil(xpChange * NOVATO_XP_MULTIPLIER);
        }

        if (
          (p.class === "ladino" || p.class === "aprendiz_ladino") &&
          isParticipant &&
          !isWinner &&
          coinsChange > 0
        ) {
          coinsChange = Math.floor(
            coinsChange * (p.class === "ladino" ? 1.25 : 1.1),
          );
        }

        if (
          (p.class === "guerreiro" || p.class === "aprendiz_guerreiro") &&
          hpChange < 0
        ) {
          hpChange = Math.floor(
            hpChange * (p.class === "guerreiro" ? 0.6 : 0.8),
          );
        }

        if (clericWinnerIds.length > 0 && isParticipant && !isWinner) {
          coinsChange += clericWinnerIds.length * CLERIGO_GROUP_COINS;
        }

        if (coinsChange > 0) {
          coinsChange = Math.floor(
            coinsChange * passiveCoinMultiplier * temporaryCoinMultiplier,
          );
        }

        const exhausted =
          p.max_hp > 0 && p.hp / p.max_hp <= exhaustionThreshold;
        if (exhausted && coinsChange > 0) {
          coinsChange = Math.max(
            0,
            Math.floor(coinsChange * exhaustionPenaltyMultiplier),
          );
        }

        newHp = Math.min(p.max_hp, Math.max(0, newHp + hpChange));

        if (category === "pao" && isWinner) {
          activeBuffs.push({
            type: "POST_PAO_RECOVERY",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            value:
              p.class === "clerigo"
                ? 10
                : p.class === "aprendiz_clerigo"
                  ? 8
                  : 5,
          });
        }

        let newXp = p.xp + xpChange;
        let newCoins = p.coins + coinsChange;
        let newLevel = p.level;

        while (newXp >= newLevel * 100) {
          newXp -= newLevel * 100;
          newLevel++;
          newHp = p.max_hp;
          logs.push({
            event_type: "level_up",
            category: "system",
            message: `Subiu para o nível ${newLevel}!`,
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
          id: p.id,
          hp: newHp,
          xp: newXp,
          coins: newCoins,
          level: newLevel,
          name: p.name,
          class: p.class,
          luck,
          titles,
          passive_coin_multiplier: passiveCoinMultiplier,
          temporary_coin_multiplier: hasBuff(activeBuffs, "COIN_MAGNET")
            ? temporaryCoinMultiplier
            : 1,
          exhaustion_threshold: exhaustionThreshold,
          exhaustion_penalty_multiplier: exhaustionPenaltyMultiplier,
          max_hp: p.max_hp,
          inventory: p.inventory,
          active_buffs: activeBuffs,
          participates_in_pao: p.participates_in_pao,
          participates_in_agua: p.participates_in_agua,
          participates_in_balde: p.participates_in_balde,
          participates_in_geral: p.participates_in_geral,
        });
      }

      const { error: uErr } = await supabase.from("profiles").upsert(updates);
      if (uErr) throw uErr;

      for (const clericId of clericWinnerIds) {
        logs.push({
          event_type: "class_passive",
          category,
          message: `Aura de Comunhão concedeu moedas extras ao grupo`,
          primary_actor_id: clericId,
        });
      }

      for (const wId of resolvedWinnerIds) {
        logs.push({
          event_type: "draw_result",
          category,
          message: `Sorteado para ${category.toUpperCase()}`,
          primary_actor_id: wId,
          metadata: { participantsCount: participants.length },
        });
      }

      if (logs.length > 0) {
        await supabase.from("battle_logs").insert(logs);
      }

      res.json({ success: true, updates, winnerIds: resolvedWinnerIds });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", details: String(error) });
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
    app.use(express.static(path.join(__dirname, "..", "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
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
