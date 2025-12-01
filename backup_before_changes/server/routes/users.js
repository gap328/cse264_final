// server/routes/users.js
import express from "express";
import bcrypt from "bcrypt";
import pool from "../db.js";

const router = express.Router();

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// SIGNUP
router.post("/signup", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING user_id, email",
      [email, hashedPassword]
    );

    const newUser = result.rows[0];

    // Set session
    req.session.userId = newUser.user_id;

    res.status(201).json({
      message: 'User created successfully',
      user: {
        user_id: newUser.user_id,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Find user by email
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set session
    req.session.userId = user.user_id;

    res.json({
      message: 'Login successful',
      user: {
        user_id: user.user_id,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ message: 'Logout successful' });
  });
});

// GET CURRENT USER
router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id, email FROM users WHERE user_id = $1",
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET USER PREFERENCES
router.get("/preferences", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM preferences WHERE user_id = $1",
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.json({ preferences: null });
    }

    res.json({ preferences: result.rows[0] });
  } catch (err) {
    console.error("Get preferences error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// SAVE OR UPDATE USER PREFERENCES
router.post("/preferences", requireAuth, async (req, res) => {
  const { diet_type, calorie_target, meals_per_day, allergies } = req.body;

  try {
    // Check if preferences exist
    const existing = await pool.query(
      "SELECT * FROM preferences WHERE user_id = $1",
      [req.session.userId]
    );

    let result;
    if (existing.rows.length > 0) {
      // Update existing preferences
      result = await pool.query(
        `UPDATE preferences 
         SET diet_type = $1, calorie_target = $2, meals_per_day = $3, allergies = $4
         WHERE user_id = $5
         RETURNING *`,
        [diet_type, calorie_target, meals_per_day, allergies, req.session.userId]
      );
    } else {
      // Insert new preferences
      result = await pool.query(
        `INSERT INTO preferences (user_id, diet_type, calorie_target, meals_per_day, allergies)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.session.userId, diet_type, calorie_target, meals_per_day, allergies]
      );
    }

    res.json({
      message: 'Preferences saved successfully',
      preferences: result.rows[0]
    });
  } catch (err) {
    console.error("Save preferences error:", err);
    res.status(500).json({ error: "Server error saving preferences" });
  }
});

export default router;