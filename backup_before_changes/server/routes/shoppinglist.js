// server/routes/shoppinglist.js
import express from "express";
import pool from "../db.js";

const router = express.Router();

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';

// Middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// GENERATE SHOPPING LIST FROM A MEAL PLAN
router.get("/:planId", requireAuth, async (req, res) => {
  const { planId } = req.params;

  try {
    // Verify access to this plan
    const planResult = await pool.query(
      "SELECT * FROM meal_plans WHERE plan_id = $1",
      [planId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    if (planResult.rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all recipe IDs from meal plan items
    const itemsResult = await pool.query(
      `SELECT DISTINCT r.recipe_id, r.title
       FROM meal_plan_items mpi
       JOIN recipes r ON mpi.recipe_id = r.recipe_id
       WHERE mpi.plan_id = $1`,
      [planId]
    );

    const recipes = itemsResult.rows;
    
    // Map to store aggregated ingredients
    const ingredientsMap = new Map();

    // For each recipe, check if we have ingredients stored locally first
    for (const recipe of recipes) {
      // Check if ingredients exist in YOUR recipe_ingredients table
      const storedIngredients = await pool.query(
        `SELECT i.name, i.category, ri.amount, ri.unit
         FROM recipe_ingredients ri
         JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
         WHERE ri.recipe_id = $1`,
        [recipe.recipe_id]
      );

      if (storedIngredients.rows.length > 0) {
        // Use stored ingredients
        storedIngredients.rows.forEach(ing => {
          const key = ing.name.toLowerCase();
          if (ingredientsMap.has(key)) {
            const existing = ingredientsMap.get(key);
            if (existing.unit === ing.unit) {
              existing.amount += parseFloat(ing.amount);
            } else {
              existing.notes = `${existing.amount} ${existing.unit} + ${ing.amount} ${ing.unit}`;
            }
          } else {
            ingredientsMap.set(key, {
              name: ing.name,
              amount: parseFloat(ing.amount),
              unit: ing.unit,
              aisle: ing.category || 'Other'
            });
          }
        });
      } else {
        // Fetch from Spoonacular API if not in database
        // Note: You would need to store the Spoonacular recipe ID to do this
        // For now, we'll skip recipes without stored ingredients
        console.log(`No ingredients found for recipe: ${recipe.title}`);
      }
    }

    // Convert map to array and group by aisle
    const shoppingList = Array.from(ingredientsMap.values());
    
    // Group by aisle (category)
    const groupedList = shoppingList.reduce((acc, item) => {
      const aisle = item.aisle || 'Other';
      if (!acc[aisle]) {
        acc[aisle] = [];
      }
      acc[aisle].push(item);
      return acc;
    }, {});

    // Optionally, save to shopping_list_items table
    // Clear existing shopping list for this plan
    await pool.query("DELETE FROM shopping_list_items WHERE plan_id = $1", [planId]);

    // Insert aggregated ingredients
    for (const item of shoppingList) {
      // Find or create ingredient
      let ingredientResult = await pool.query(
        "SELECT ingredient_id FROM ingredients WHERE LOWER(name) = LOWER($1)",
        [item.name]
      );

      let ingredientId;
      if (ingredientResult.rows.length === 0) {
        // Create new ingredient
        const newIng = await pool.query(
          "INSERT INTO ingredients (name, category) VALUES ($1, $2) RETURNING ingredient_id",
          [item.name, item.aisle]
        );
        ingredientId = newIng.rows[0].ingredient_id;
      } else {
        ingredientId = ingredientResult.rows[0].ingredient_id;
      }

      // Insert into shopping_list_items
      await pool.query(
        `INSERT INTO shopping_list_items (plan_id, ingredient_id, total_amount, unit)
         VALUES ($1, $2, $3, $4)`,
        [planId, ingredientId, item.amount, item.unit]
      );
    }

    res.json({
      planId: parseInt(planId),
      shoppingList: groupedList,
      totalItems: shoppingList.length
    });
  } catch (err) {
    console.error("Shopping list error:", err);
    res.status(500).json({ error: "Failed to generate shopping list" });
  }
});

export default router;