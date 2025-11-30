// server/db.js
import pg from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: join(__dirname, "..", ".env") });

const { Pool } = pg;

// Create a pool but do not block startup
const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "recipe_planner",
  user: process.env.DB_USER || "gabrielpetertonjes",
  password: process.env.DB_PASSWORD || "",
});

// Test connection safely
(async () => {
  try {
    const client = await pool.connect();
    console.log("Database connected successfully");
    client.release();
  } catch (err) {
    console.warn(
      "Database connection failed (server will still start):",
      err.message
    );
  }
})();

export default pool;
