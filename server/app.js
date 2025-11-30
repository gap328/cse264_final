// server/app.js
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "..", ".env") });

import express from "express";
import cors from "cors";
import session from "express-session";

// ROUTES
import usersRoutes from "./routes/users.js";
import recipesRoutes from "./routes/recipes.js";
import mealplanRoutes from "./routes/mealplan.js";
import shoppinglistRoutes from "./routes/shoppinglist.js";

const app = express();

// MIDDLEWARE
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3002", "http://localhost:3001"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SESSION CONFIGURATION (wrap in try/catch to avoid blocking)
try {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, secure: false },
    })
  );
} catch (err) {
  console.warn("Session middleware failed:", err.message);
}

// ROUTE MOUNTING
app.use("/api/users", usersRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/mealplan", mealplanRoutes);
app.use("/api/shoppinglist", shoppinglistRoutes);

// ROOT TEST
app.get("/", (req, res) => {
  res.send("Smart Recipe Meal Planner API running!");
});

// START SERVER
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
