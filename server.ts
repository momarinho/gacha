import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database.Database;
try {
  db = new Database("raffle.db");
  // Initialize database
  db.exec(`
    CREATE TABLE IF NOT EXISTS raffle_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL
    )
  `);
  console.log("Database initialized successfully");
} catch (err) {
  console.error("Failed to initialize database:", err);
  // Fallback to in-memory or just exit
  process.exit(1);
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
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.get("/api/state", (req, res) => {
    const row = db.prepare("SELECT data FROM raffle_state WHERE id = 1").get() as { data: string } | undefined;
    if (row) {
      res.json(JSON.parse(row.data));
    } else {
      res.json(null);
    }
  });

  app.post("/api/state", (req, res) => {
    const data = JSON.stringify(req.body);
    db.prepare("INSERT OR REPLACE INTO raffle_state (id, data) VALUES (1, ?)").run(data);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
