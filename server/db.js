// server/db.js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

console.log("Loaded ENV:", {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  pass: process.env.DB_PASSWORD ? "OK" : "MISSING"
});

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, 
  ssl: false
});

pool.connect()
  .then(() => console.log("Connected to Postgres successfully!"))
  .catch(err => console.error("DB Connection Error:", err));

export default pool;