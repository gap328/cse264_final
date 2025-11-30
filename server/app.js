// server/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

// ROUTES
import usersRoutes from "./routes/users.js";
import recipesRoutes from "./routes/recipes.js";
import mealplanRoutes from "./routes/mealplan.js";
import shoppinglistRoutes from "./routes/shoppinglist.js";

const app = express();

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// ROUTE MOUNTING
app.use("/api/users", usersRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/mealplan", mealplanRoutes);
app.use("/api/shoppinglist", shoppinglistRoutes);

// ROOT TEST
app.get("/", (req, res) => {
  res.send("Meal Planner API running!");
});

// START SERVER
app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});