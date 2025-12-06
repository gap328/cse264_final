// server/subscription.js
import pool from "./db.js";

// what each tier gets
const TIER_LIMITS = {
  free: {
    maxMealPlans: 3,
    mealsPerPlan: 14,  // 7 days times 2 meals
    canExport: false,
    canSharePlans: false,
    apiCallsPerDay: 50
  },
  premium: {
    maxMealPlans: 10,
    mealsPerPlan: 21,  // 7 days times 3 meals
    canExport: true,
    canSharePlans: false,
    apiCallsPerDay: 150
  },
  pro: {
    maxMealPlans: -1,  // no limit
    mealsPerPlan: 28,  // 7 days times 4 meals
    canExport: true,
    canSharePlans: true,
    apiCallsPerDay: 500
  }
};

export const checkSubscription = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const result = await pool.query(
      "SELECT subscription_tier, subscription_expires_at FROM users WHERE user_id = $1",
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    let tier = user.subscription_tier || 'free';

    // check if subscription ran out
    if (user.subscription_expires_at && new Date(user.subscription_expires_at) < new Date()) {
      tier = 'free';
      // downgrade them back to free
      await pool.query(
        "UPDATE users SET subscription_tier = 'free' WHERE user_id = $1",
        [req.session.userId]
      );
    }

    req.subscriptionTier = tier;
    req.tierLimits = TIER_LIMITS[tier];
    next();
  } catch (err) {
    console.error("Subscription check error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

export const requirePremium = (req, res, next) => {
  if (req.subscriptionTier === 'free') {
    return res.status(403).json({ 
      error: 'Premium subscription required',
      upgradeUrl: '/upgrade'
    });
  }
  next();
};

export { TIER_LIMITS };