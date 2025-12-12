const express = require("express");
const pool = require("../db"); // your PostgreSQL pool
const { verifyToken, requireRole } = require("../middleware/auth");

const router = express.Router();
// Example: Get all inventory
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.id, i.quantity, i.type, i."createdAt", i."updatedAt",
             p.id AS "productId", p.name AS "productName", p.description AS "productDescription",
             p.price AS "productPrice", p."imageUrl" AS "productImageUrl", p.type AS "productType",
             p."createdAt" AS "productCreatedAt", p."updatedAt" AS "productUpdatedAt"
      FROM "Inventory" i
      LEFT JOIN "Product" p ON i."productId" = p.id
      ORDER BY i."createdAt" DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

module.exports = router;
