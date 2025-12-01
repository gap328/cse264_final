// server/db.js
import pg from "pg";

const { Pool } = pg;

// No env
const pool = new Pool({
  host: "localhost",
  port: 5432,
  database: "recipe_planner",  //postgres
  user: "postgres",
  password: "Titans1042", // <-- change password to your local password (Use the SAME password you use when you run `psql -U postgres`)
});

// Debug what we're actually passing in
console.log("DB CONFIG USED BY Pool:", {
  host: "localhost",
  port: 5432,
  database: "recipe_planner",
  user: "postgres",
  passwordType: typeof "YOUR_POSTGRES_PASSWORD_HERE",
});

(async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL as postgres");
    client.release();
  } catch (err) {
    console.error("Database connection failed (hardcoded):", err.message);
  }
})();

export default pool;
