const express = require("express");
const pool = require("../db"); // your PostgreSQL pool
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

// Get all community posts
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cp.id, cp.title, cp.content, cp."createdAt", u.name AS author
      FROM "CommunityPost" cp
      LEFT JOIN "User" u ON cp."userId" = u.id
      ORDER BY cp."createdAt" DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch community posts" });
  }
});

// Create a new community post
router.post("/", verifyToken, async (req, res) => {
  try {
    const { userId, title, content } = req.body;

    const result = await pool.query(
      `INSERT INTO "CommunityPost" ("userId", title, content)
       VALUES ($1, $2, $3)
       RETURNING id, "userId", title, content, "createdAt"`,
      [userId, title, content]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create community post" });
  }
});

module.exports = router;
