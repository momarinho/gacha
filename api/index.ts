import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const isSupabaseEnabled = !!(supabaseUrl && supabaseKey);

const dbPath = path.join(__dirname, "..", "raffle.db");
let db: any = null;
let supabase: any = null;
let dbInitialized = false;

async function initDb() {
  if (dbInitialized) return;
  
  if (isSupabaseEnabled) {
    console.log("Supabase detected, using Supabase as database provider.");
    supabase = createClient(supabaseUrl!, supabaseKey!);
  } else if (process.env.VERCEL) {
    console.warn("Running on Vercel but no Supabase config found. Cloud sync will be offline.");
  } else {
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Request logger
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // API Routes
  app.get("/api/health", async (req, res) => {
    await initDb();
    res.json({ 
      status: "ok", 
      provider: isSupabaseEnabled ? "supabase" : (db ? "sqlite" : "none"),
      time: new Date().toISOString(),
      env: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL
    });
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
        
        if (error && error.code !== "PGRST116") { // PGRST116 is "no rows found"
          throw error;
        }
        res.json(data ? JSON.parse(data.data) : null);
      } else if (db) {
        const row = db.prepare("SELECT data FROM raffle_state WHERE id = 1").get() as { data: string } | undefined;
        res.json(row ? JSON.parse(row.data) : null);
      } else {
        res.status(500).json({ error: "No database provider available" });
      }
    } catch (error) {
      console.error("Error fetching state:", error);
      res.status(500).json({ error: "Internal Server Error" });
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
        
        if (error) throw error;
        res.json({ success: true });
      } else if (db) {
        db.prepare("INSERT OR REPLACE INTO raffle_state (id, data) VALUES (1, ?)").run(dataStr);
        res.json({ success: true });
      } else {
        res.status(500).json({ error: "No database provider available" });
      }
    } catch (error) {
      console.error("Error saving state:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Catch-all for API routes that don't exist
  app.all("/api/*", (req, res) => {
    console.log(`404 API Route: ${req.method} ${req.url}`);
    res.status(404).json({ 
      error: "API Route Not Found",
      method: req.method,
      path: req.url 
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    // Only serve static files if NOT on Vercel (Vercel handles this via vercel.json)
    app.use(express.static(path.join(__dirname, "..", "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
    });
  }

  // Only listen if not on Vercel
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

export default async (req: any, res: any) => {
  try {
    const app = await startServer();
    return app(req, res);
  } catch (err) {
    console.error("SERVERLESS FUNCTION ERROR:", err);
    res.status(500).json({ 
      error: "Serverless function failed to initialize", 
      details: String(err),
      stack: process.env.NODE_ENV === "development" ? (err as Error).stack : undefined
    });
  }
};
