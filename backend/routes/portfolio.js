const express = require("express");
const pool = require("../db"); // your PostgreSQL pool
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get all portfolio items
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p."productId", p.title, p."imageUrl", p.description, p.type, p.location, p.date,
             pr.id AS "product_id", pr.name AS "product_name", pr.description AS "product_description",
             pr.price AS "product_price", pr."imageUrl" AS "product_imageUrl", pr.type AS "product_type"
      FROM "Portfolio" p
      JOIN "Product" pr ON p."productId" = pr.id
      ORDER BY p.date DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch portfolio items" });
  }
});

// Create a new portfolio item
router.post("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { productId, title, imageUrl, description, type, location, date } =
      req.body;

    const result = await pool.query(
      `INSERT INTO "Portfolio" ("productId", title, "imageUrl", description, type, location, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, "productId", title, "imageUrl", description, type, location, date`,
      [productId, title, imageUrl, description, type, location, date]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to create portfolio item" });
  }
});

module.exports = router;
