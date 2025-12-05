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

    // Insert new user with default free tier
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, role, subscription_tier) VALUES ($1, $2, $3, $4) RETURNING user_id, email, role, subscription_tier",
      [email, hashedPassword, 'free', 'free']
    );

    const newUser = result.rows[0];

    // Set session
    req.session.userId = newUser.user_id;

    res.status(201).json({
      message: 'User created successfully',
      user: {
        user_id: newUser.user_id,
        email: newUser.email,
        role: newUser.role,
        subscription_tier: newUser.subscription_tier
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
        email: user.email,
        role: user.role,
        subscription_tier: user.subscription_tier
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
      "SELECT user_id, email, role, subscription_tier, subscription_expires_at FROM users WHERE user_id = $1",
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

// GET USER SUBSCRIPTION INFO
router.get("/subscription", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT role, subscription_tier, subscription_expires_at FROM users WHERE user_id = $1",
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const isPaid = user.subscription_tier === 'premium' || user.subscription_tier === 'pro';
    const isExpired = user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date();

    res.json({
      role: user.role,
      subscriptionTier: user.subscription_tier,
      isPaid: isPaid && !isExpired,
      expiresAt: user.subscription_expires_at
    });
  } catch (err) {
    console.error("Get subscription error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// UPGRADE TO PREMIUM (Simulated payment)
router.post("/upgrade", requireAuth, async (req, res) => {
  const { tier } = req.body; // 'premium' or 'pro'

  if (!['premium', 'pro'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid subscription tier' });
  }

  try {
    // In production, you'd integrate with Stripe/PayPal here
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

    const result = await pool.query(
      `UPDATE users 
       SET subscription_tier = $1, subscription_expires_at = $2
       WHERE user_id = $3
       RETURNING user_id, email, subscription_tier, subscription_expires_at`,
      [tier, expiresAt, req.session.userId]
    );

    res.json({
      message: 'Subscription upgraded successfully!',
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Upgrade error:", err);
    res.status(500).json({ error: "Failed to upgrade subscription" });
  }
});

// ADMIN: Set user role (admin only)
router.put("/admin/setrole/:userId", requireAuth, async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body; // 'free', 'premium', 'admin'

  if (!['free', 'premium', 'pro', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    // Check if current user is admin
    const adminCheck = await pool.query(
      "SELECT role FROM users WHERE user_id = $1",
      [req.session.userId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Update target user's role
    const result = await pool.query(
      "UPDATE users SET role = $1 WHERE user_id = $2 RETURNING user_id, email, role, subscription_tier",
      [role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User role updated',
      user: result.rows[0]
    });
  } catch (err) {
    console.error("Set role error:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
});

export default router;