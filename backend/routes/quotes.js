const express = require('express');
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Create a quote
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { contact_email, contact_phone, event_date, notes, items } = req.body;
    // Optional: user_id if logged in
    const user_id = req.body.user_id || null;

    const quoteRes = await client.query(
      'INSERT INTO quotes (user_id, contact_email, contact_phone, event_date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user_id, contact_email, contact_phone, event_date, notes]
    );
    const quoteId = quoteRes.rows[0].id;

    if (items && items.length > 0) {
      for (const item of items) {
        await client.query(
          'INSERT INTO quote_items (quote_id, variant_id, quantity, price) VALUES ($1, $2, $3, $4)',
          [quoteId, item.variant_id, item.quantity, item.price] // Price might be estimated or null initially
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: 'Quote requested successfully', quoteId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// List quotes (Admin)
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quotes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
