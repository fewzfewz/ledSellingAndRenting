const express = require('express');
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Create a rental booking
router.post('/', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { user_id, start_date, end_date, items } = req.body;
    
    // Calculate total amount (simplified logic)
    let total_amount = 0;
    // In a real app, we would fetch prices from DB to ensure validity
    
    const rentalRes = await client.query(
      'INSERT INTO rentals (user_id, start_date, end_date, status) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_id, start_date, end_date, 'pending']
    );
    const rentalId = rentalRes.rows[0].id;

    if (items && items.length > 0) {
        const start = new Date(start_date);
        const end = new Date(end_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // Minimum 1 day

        for (const item of items) {
          await client.query(
            'INSERT INTO rental_items (rental_id, variant_id, quantity, unit_rent_price) VALUES ($1, $2, $3, $4)',
            [rentalId, item.variant_id, item.quantity, item.unit_rent_price]
          );
          total_amount += item.quantity * item.unit_rent_price * diffDays;
        }
      }
    
    // Update total amount
    await client.query('UPDATE rentals SET total_amount = $1 WHERE id = $2', [total_amount, rentalId]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Rental booking created', rentalId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Get rental detail
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const rentalRes = await pool.query('SELECT * FROM rentals WHERE id = $1', [id]);
    
    if (rentalRes.rows.length === 0) {
      return res.status(404).json({ error: 'Rental not found' });
    }
    
    const rental = rentalRes.rows[0];
    const itemsRes = await pool.query('SELECT * FROM rental_items WHERE rental_id = $1', [id]);
    rental.items = itemsRes.rows;
    
    res.json(rental);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
