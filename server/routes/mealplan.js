// server/routes/mealplan.js
import express from "express";
import pool from "../db.js";
import { checkSubscription } from '../subscription.js';

const router = express.Router();

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';

// make sure theyre logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// GENERATE A WEEKLY MEAL PLAN
router.post("/generate", requireAuth, checkSubscription, async (req, res) => {
  const userId = req.session.userId;

  try {
    // see if they hit their plan limit
    if (req.tierLimits.maxMealPlans !== -1) {
      const planCount = await pool.query(
        "SELECT COUNT(*) FROM meal_plans WHERE user_id = $1",
        [userId]
      );

      if (parseInt(planCount.rows[0].count) >= req.tierLimits.maxMealPlans) {
        return res.status(403).json({ 
          error: `Your ${req.subscriptionTier} tier is limited to ${req.tierLimits.maxMealPlans} meal plans. Upgrade for more!`,
          upgradeRequired: true
        });
      }
    }

    // grab their food preferences
    const prefsResult = await pool.query(
      "SELECT * FROM preferences WHERE user_id = $1",
      [userId]
    );

    if (prefsResult.rows.length === 0) {
      return res.status(400).json({ error: 'Please set your preferences first' });
    }

    const prefs = prefsResult.rows[0];
    let mealsPerDay = prefs.meals_per_day || 3;

    // make sure they cant pick too many meals per day
    const maxMealsPerDay = Math.floor(req.tierLimits.mealsPerPlan / 7);
    if (mealsPerDay > maxMealsPerDay) {
      return res.status(403).json({
        error: `Your ${req.subscriptionTier} tier allows up to ${maxMealsPerDay} meals per day. Upgrade for more!`,
        upgradeRequired: true
      });
    }

    const totalMeals = 7 * mealsPerDay;

    // build the spoonacular api url
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_API_KEY,
      number: totalMeals,
      addRecipeInformation: true,
      fillIngredients: true
    });

    if (prefs.diet_type) params.append('diet', prefs.diet_type);
    if (prefs.allergies) params.append('intolerances', prefs.allergies);

    // filter by calories if they set a target
    if (prefs.calorie_target) {
      const target = parseInt(prefs.calorie_target);
      const caloriesPerMeal = Math.floor(target / mealsPerDay);
      
      // give some wiggle room on calories
      params.append('minCalories', Math.max(0, caloriesPerMeal - 200));
      params.append('maxCalories', caloriesPerMeal + 200);
    }

    const response = await fetch(`${SPOONACULAR_BASE_URL}/complexSearch?${params}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const recipesFromAPI = data.results;

    if (recipesFromAPI.length < totalMeals) {
      return res.status(400).json({ 
        error: 'Not enough recipes found. Try adjusting your preferences.' 
      });
    }

    // Create a new meal plan
    const planResult = await pool.query(
      "INSERT INTO meal_plans (user_id, week_start_date) VALUES ($1, $2) RETURNING *",
      [userId, new Date()]
    );

    const mealPlan = planResult.rows[0];
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Insert recipes into YOUR recipes table and create meal plan items
    let recipeIndex = 0;
    const mealPlanItems = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      for (let mealNumber = 1; mealNumber <= mealsPerDay; mealNumber++) {
        const apiRecipe = recipesFromAPI[recipeIndex];
        
        // Insert recipe into YOUR recipes table
        const recipeResult = await pool.query(
          `INSERT INTO recipes (title, image_url, source, calories, diet_type)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING recipe_id`,
          [
            apiRecipe.title,
            apiRecipe.image,
            'spoonacular',
            apiRecipe.nutrition?.nutrients?.[0]?.amount || 0,
            prefs.diet_type
          ]
        );

        const recipeId = recipeResult.rows[0].recipe_id;

        // grab the full recipe details so we can store ingredients
        try {
          const detailsParams = new URLSearchParams({
            apiKey: SPOONACULAR_API_KEY,
            includeNutrition: false
          });

          const detailsResponse = await fetch(
            `${SPOONACULAR_BASE_URL}/${apiRecipe.id}/information?${detailsParams}`
          );
          
          if (detailsResponse.ok) {
            const recipeDetails = await detailsResponse.json();

            // save all the ingredients for this recipe
            if (recipeDetails.extendedIngredients && recipeDetails.extendedIngredients.length > 0) {
              for (const ing of recipeDetails.extendedIngredients) {
                try {
                  // add ingredient to our database
                  const ingResult = await pool.query(
                    `INSERT INTO ingredients (name, category) 
                     VALUES ($1, $2) 
                     ON CONFLICT (name) DO NOTHING 
                     RETURNING ingredient_id`,
                    [ing.nameClean || ing.name, ing.aisle || 'Other']
                  );

                  let ingredientId = ingResult.rows[0]?.ingredient_id;
                  
                  // if it already existed grab its id
                  if (!ingredientId) {
                    const existing = await pool.query(
                      `SELECT ingredient_id FROM ingredients WHERE name = $1`,
                      [ing.nameClean || ing.name]
                    );
                    ingredientId = existing.rows[0]?.ingredient_id;
                  }

                  // link this ingredient to the recipe
                  if (ingredientId) {
                    await pool.query(
                      `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
                       VALUES ($1, $2, $3, $4)`,
                      [recipeId, ingredientId, ing.amount || 0, ing.unit || '']
                    );
                  }
                } catch (ingErr) {
                  console.log(`Error storing ingredient: ${ing.name}`);
                }
              }
              console.log(`✓ Stored ingredients for: ${apiRecipe.title}`);
            }
          }
        } catch (ingError) {
          console.log(`Could not fetch ingredients for ${apiRecipe.title}`);
        }

        // Insert into meal_plan_items
        const itemResult = await pool.query(
          `INSERT INTO meal_plan_items (plan_id, day_of_week, meal_number, recipe_id)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [mealPlan.plan_id, days[dayIndex], mealNumber, recipeId]
        );

        mealPlanItems.push(itemResult.rows[0]);
        recipeIndex++;
      }
    }

    res.json({
      message: 'Meal plan generated successfully',
      mealPlan: {
        ...mealPlan,
        items: mealPlanItems
      }
    });
  } catch (err) {
    console.error("Generate meal plan error:", err.message);
    res.status(500).json({ error: "Failed to generate meal plan" });
  }
});

// GET MEAL PLAN FOR A USER
router.get("/:userId", requireAuth, async (req, res) => {
  const { userId } = req.params;

  // Make sure user can only access their own meal plans
  if (parseInt(userId) !== req.session.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    // Get the most recent meal plan
    const planResult = await pool.query(
      "SELECT * FROM meal_plans WHERE user_id = $1 ORDER BY week_start_date DESC LIMIT 1",
      [userId]
    );

    if (planResult.rows.length === 0) {
      return res.json({ mealPlan: null });
    }

    const mealPlan = planResult.rows[0];

    // Get all meal plan items with recipe details
    const itemsResult = await pool.query(
      `SELECT mpi.*, r.title, r.image_url, r.calories
       FROM meal_plan_items mpi
       JOIN recipes r ON mpi.recipe_id = r.recipe_id
       WHERE mpi.plan_id = $1
       ORDER BY 
         CASE day_of_week
           WHEN 'Mon' THEN 1
           WHEN 'Tue' THEN 2
           WHEN 'Wed' THEN 3
           WHEN 'Thu' THEN 4
           WHEN 'Fri' THEN 5
           WHEN 'Sat' THEN 6
           WHEN 'Sun' THEN 7
         END,
         mpi.meal_number`,
      [mealPlan.plan_id]
    );

    res.json({
      mealPlan: {
        ...mealPlan,
        items: itemsResult.rows
      }
    });
  } catch (err) {
    console.error("Get meal plan error:", err);
    res.status(500).json({ error: "Failed to get meal plan" });
  }
});

// REPLACE A SINGLE MEAL
router.put("/item/:itemId", requireAuth, async (req, res) => {
  const { itemId } = req.params;

  try {
    // Get the meal plan item and verify ownership
    const itemResult = await pool.query(
      `SELECT mpi.*, mp.user_id 
       FROM meal_plan_items mpi
       JOIN meal_plans mp ON mpi.plan_id = mp.plan_id
       WHERE mpi.item_id = $1`,
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    if (itemResult.rows[0].user_id !== req.session.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user preferences
    const prefsResult = await pool.query(
      "SELECT * FROM preferences WHERE user_id = $1",
      [req.session.userId]
    );

    const prefs = prefsResult.rows[0];

    // Fetch a new random recipe
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_API_KEY,
      number: 1,
      addRecipeInformation: true
    });

    if (prefs.diet_type) params.append('diet', prefs.diet_type);
    if (prefs.allergies) params.append('intolerances', prefs.allergies);

    const response = await fetch(`${SPOONACULAR_BASE_URL}/random?${params}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const newApiRecipe = data.recipes[0];

    // Insert new recipe
    const recipeResult = await pool.query(
      `INSERT INTO recipes (title, image_url, source, calories, diet_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING recipe_id`,
      [
        newApiRecipe.title,
        newApiRecipe.image,
        'spoonacular',
        newApiRecipe.nutrition?.nutrients?.[0]?.amount || 0,
        prefs.diet_type
      ]
    );

    const newRecipeId = recipeResult.rows[0].recipe_id;

    // Fetch and store ingredients for replacement recipe
    try {
      const detailsParams = new URLSearchParams({
        apiKey: SPOONACULAR_API_KEY,
        includeNutrition: false
      });

      const detailsResponse = await fetch(
        `${SPOONACULAR_BASE_URL}/${newApiRecipe.id}/information?${detailsParams}`
      );
      
      if (detailsResponse.ok) {
        const recipeDetails = await detailsResponse.json();

        if (recipeDetails.extendedIngredients && recipeDetails.extendedIngredients.length > 0) {
          for (const ing of recipeDetails.extendedIngredients) {
            try {
              const ingResult = await pool.query(
                `INSERT INTO ingredients (name, category) 
                 VALUES ($1, $2) 
                 ON CONFLICT (name) DO NOTHING 
                 RETURNING ingredient_id`,
                [ing.nameClean || ing.name, ing.aisle || 'Other']
              );

              let ingredientId = ingResult.rows[0]?.ingredient_id;
              
              if (!ingredientId) {
                const existing = await pool.query(
                  `SELECT ingredient_id FROM ingredients WHERE name = $1`,
                  [ing.nameClean || ing.name]
                );
                ingredientId = existing.rows[0]?.ingredient_id;
              }

              if (ingredientId) {
                await pool.query(
                  `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
                   VALUES ($1, $2, $3, $4)`,
                  [newRecipeId, ingredientId, ing.amount || 0, ing.unit || '']
                );
              }
            } catch (ingErr) {
              console.log(`Error storing ingredient: ${ing.name}`);
            }
          }
          console.log(`✓ Stored ingredients for replacement: ${newApiRecipe.title}`);
        }
      }
    } catch (ingError) {
      console.log(`Could not fetch ingredients for ${newApiRecipe.title}`);
    }

    // Update the meal plan item
    const updateResult = await pool.query(
      `UPDATE meal_plan_items 
       SET recipe_id = $1
       WHERE item_id = $2
       RETURNING *`,
      [newRecipeId, itemId]
    );

    res.json({
      message: 'Meal replaced successfully',
      item: updateResult.rows[0]
    });
  } catch (err) {
    console.error("Replace meal error:", err.message);
    res.status(500).json({ error: "Failed to replace meal" });
  }
});

// DELETE A MEAL PLAN
router.delete("/:planId", requireAuth, async (req, res) => {
  const { planId } = req.params;

  try {
    // Check ownership
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

    // Delete meal plan items first
    await pool.query("DELETE FROM meal_plan_items WHERE plan_id = $1", [planId]);

    // Delete shopping list items
    await pool.query("DELETE FROM shopping_list_items WHERE plan_id = $1", [planId]);

    // Delete the plan
    await pool.query("DELETE FROM meal_plans WHERE plan_id = $1", [planId]);

    res.json({ message: 'Meal plan deleted successfully' });
  } catch (err) {
    console.error("Delete meal plan error:", err);
    res.status(500).json({ error: "Failed to delete meal plan" });
  }
});

export default router;