const express = require("express");
const pool = require("../db"); // your PostgreSQL pool
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get all learn posts
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, category, content, author, "createdAt"
      FROM "Learn"
      ORDER BY "createdAt" DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch learn posts" });
  }
});

// Create a new learn post (admin only)
router.post("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { title, category, content, author } = req.body;

    const result = await pool.query(
      `INSERT INTO "Learn" (title, category, content, author)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, category, content, author, "createdAt"`,
      [title, category, content, author]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create learn post" });
  }
});

module.exports = router;
