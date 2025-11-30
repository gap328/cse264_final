// server/routes/users.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

// SIGNUP
router.post("/signup", async (req, res) => {
  const { email, password_hash } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *",
      [email, password_hash]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

export default router;
