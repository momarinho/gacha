import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "raffle.db");
console.log(`Initializing database at ${dbPath}`);

let db: Database.Database;
try {
  db = new Database(dbPath);
  // Initialize database
  db.exec(`
    CREATE TABLE IF NOT EXISTS raffle_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT NOT NULL
    )
  `);
  console.log("Database initialized successfully");
  
  // Test query
  const test = db.prepare("SELECT COUNT(*) as count FROM raffle_state").get() as { count: number };
  console.log(`Database test query successful. Current rows: ${test.count}`);
} catch (err) {
  console.error("Failed to initialize database:", err);
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
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      dbPath: dbPath,
      env: process.env.NODE_ENV
    });
  });

  app.get("/api/state", (req, res) => {
    try {
      const row = db.prepare("SELECT data FROM raffle_state WHERE id = 1").get() as { data: string } | undefined;
      if (row) {
        res.json(JSON.parse(row.data));
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error fetching state:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  app.post("/api/state", (req, res) => {
    try {
      const data = JSON.stringify(req.body);
      db.prepare("INSERT OR REPLACE INTO raffle_state (id, data) VALUES (1, ?)").run(data);
      res.json({ success: true });
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
