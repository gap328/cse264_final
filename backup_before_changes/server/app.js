dotenv.config();
console.log("Loaded Spoon Key:", process.env.SPOONACULAR_API_KEY);

// ---------------------
// IMPORTS
// ---------------------
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import pgSession from "connect-pg-simple";
import pool from "./db.js";

dotenv.config();

// ROUTES
import usersRoutes from "./routes/users.js";
import recipesRoutes from "./routes/recipes.js";
import mealplanRoutes from "./routes/mealplan.js";
import shoppinglistRoutes from "./routes/shoppinglist.js";

const app = express();

// ---------------------
// CORS CONFIG (FINAL WORKING VERSION)
// ---------------------
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
    credentials: true,
  })
);

app.use(express.json());

// ---------------------
// SESSION CONFIG (FINAL WORKING VERSION)
// ---------------------
const PgSession = pgSession(session);

app.use(
  session({
    store: new PgSession({
      pool: pool,
      tableName: "session",
    }),
    secret: "keyboard_cat_123",
    resave: false,
    saveUninitialized: false,
    cookie: {
  secure: false,
  httpOnly: true,
  sameSite: "lax",
  maxAge: 30 * 24 * 60 * 60 * 1000
}
  })
);

// ---------------------
// ROUTES
// ---------------------
app.use("/api/users", usersRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/mealplan", mealplanRoutes);
app.use("/api/shoppinglist", shoppinglistRoutes);

app.get("/", (req, res) => {
  res.send("Meal Planner API running!");
});

// ---------------------
// START SERVER
// ---------------------
app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
