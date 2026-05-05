import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@libsql/client";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for media items

const client = createClient({
  url: process.env.DATABASE_URL || "file:local.db",
  authToken: process.env.AUTH_TOKEN,
});

// Initialize Database
async function initDB() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS app_state (
      id TEXT PRIMARY KEY,
      data TEXT
    )
  `);
}
initDB();

// GET all data
app.get("/api/data", async (req, res) => {
  try {
    const result = await client.execute({
      sql: "SELECT data FROM app_state WHERE id = 'main'",
      args: []
    });
    
    if (result.rows.length === 0) {
      return res.json(null);
    }
    
    res.json(JSON.parse(result.rows[0].data));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// POST update data
app.post("/api/data", async (req, res) => {
  try {
    const data = JSON.stringify(req.body);
    await client.execute({
      sql: "INSERT OR REPLACE INTO app_state (id, data) VALUES ('main', ?)",
      args: [data]
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save data" });
  }
});

// DELETE all data
app.delete("/api/data", async (req, res) => {
  try {
    await client.execute({
      sql: "DELETE FROM app_state WHERE id = 'main'",
      args: []
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete data" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
