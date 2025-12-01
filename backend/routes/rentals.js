const express = require('express');
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Create a rental booking
router.post('/', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { user_id, start_date, end_date, items, delivery_address } = req.body;
    
    // Calculate total amount (simplified logic)
    let total_amount = 0;
    // In a real app, we would fetch prices from DB to ensure validity
    
    const rentalRes = await client.query(
      'INSERT INTO rentals (user_id, start_date, end_date, status, delivery_address) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [user_id, start_date, end_date, 'pending', delivery_address || null]
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

// List rentals (user's own or all if admin)
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = `
      SELECT r.*, u.email as user_email, u.name as user_name
      FROM rentals r
      JOIN users u ON r.user_id = u.id
    `;
    let params = [];

    // If not admin, only show user's own rentals
    if (req.user.role !== 'admin') {
      query += ' WHERE r.user_id = $1';
      params.push(req.user.userId);
    }

    query += ' ORDER BY r.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update rental status (admin only)
router.put('/:id', verifyToken, requireRole(['admin', 'staff']), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'active', 'completed', 'cancelled', 'returned'].includes(status)) {
      throw new Error('Invalid status');
    }

    // Check if rental exists
    const rentalCheck = await client.query('SELECT status FROM rentals WHERE id = $1', [id]);
    if (rentalCheck.rows.length === 0) {
      throw new Error('Rental not found');
    }
    const oldStatus = rentalCheck.rows[0].status;

    // Update rental status
    const result = await client.query(
      'UPDATE rentals SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    // Handle inventory updates based on status change
    if (status === 'returned' || status === 'cancelled') {
      // If previously active/confirmed/pending, release units
      if (oldStatus !== 'returned' && oldStatus !== 'cancelled') {
        // Find assigned units
        const assignmentsRes = await client.query(
          'SELECT inventory_unit_id FROM rental_unit_assignments WHERE rental_id = $1',
          [id]
        );
        
        const unitIds = assignmentsRes.rows.map(a => a.inventory_unit_id);
        
        if (unitIds.length > 0) {
          // Set units back to available
          await client.query(
            `UPDATE inventory_units SET status = 'available' WHERE id = ANY($1)`,
            [unitIds]
          );
          
          // Mark returned timestamp
          if (status === 'returned') {
            await client.query(
              'UPDATE rental_unit_assignments SET returned_at = CURRENT_TIMESTAMP WHERE rental_id = $1',
              [id]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
