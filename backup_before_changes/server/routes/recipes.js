// server/routes/recipes.js
import express from "express";

const router = express.Router();

const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com/recipes';

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// SEARCH RECIPES based on query and filters
router.get("/search", requireAuth, async (req, res) => {
  const { query, diet, intolerances, number = 10 } = req.query;

  try {
    // Build URL with query parameters
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_API_KEY,
      number: number,
      addRecipeInformation: true,
      fillIngredients: true
    });

    if (query) params.append('query', query);
    if (diet) params.append('diet', diet);
    if (intolerances) params.append('intolerances', intolerances);

    const response = await fetch(`${SPOONACULAR_BASE_URL}/complexSearch?${params}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json({ recipes: data.results });
  } catch (err) {
    console.error("Recipe search error:", err.message);
    res.status(500).json({ error: "Failed to search recipes" });
  }
});

// GET RANDOM RECIPES based on dietary preferences
router.get("/random", requireAuth, async (req, res) => {
  const { diet, number = 7 } = req.query;

  try {
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_API_KEY,
      number: number,
      limitLicense: true
    });

    if (diet) params.append('tags', diet);

    const response = await fetch(`${SPOONACULAR_BASE_URL}/random?${params}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json({ recipes: data.recipes });
  } catch (err) {
    console.error("Random recipes error:", err.message);
    res.status(500).json({ error: "Failed to get random recipes" });
  }
});

// GET DETAILED RECIPE INFORMATION
router.get("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const params = new URLSearchParams({
      apiKey: SPOONACULAR_API_KEY,
      includeNutrition: true
    });

    const response = await fetch(`${SPOONACULAR_BASE_URL}/${id}/information?${params}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json({ recipe: data });
  } catch (err) {
    console.error("Get recipe error:", err.message);
    res.status(500).json({ error: "Failed to get recipe details" });
  }
});

export default router;