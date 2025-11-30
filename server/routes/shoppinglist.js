import express from "express";
const router = express.Router();
import pool from "../db.js";

// test route
router.get("/", (req, res) => {
  res.send("Shopping list route working!");
});

export default router;
