const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

// Create a new sales order
router.post('/', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { user_id, items, shipping_address, billing_address } = req.body;
    
    // Validate user_id matches token or is admin
    if (user_id !== req.user.userId && req.user.role !== 'admin') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!items || items.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Items are required' });
    }

    // Calculate total amount
    let total_amount = 0;
    for (const item of items) {
      if (!item.variant_id || !item.quantity || !item.unit_price) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Each item must have variant_id, quantity, and unit_price' });
      }
      total_amount += item.quantity * item.unit_price;
    }

    // Create sales order
    const orderResult = await client.query(
      `INSERT INTO sales_orders (user_id, status, total_amount, shipping_address, billing_address) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [user_id, 'pending', total_amount, shipping_address, billing_address]
    );
    
    const orderId = orderResult.rows[0].id;

    // Insert order items
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, variant_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [orderId, item.variant_id, item.quantity, item.unit_price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ orderId, total_amount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Get sales order by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const orderResult = await pool.query(
      `SELECT so.*, u.email as user_email, u.name as user_name
       FROM sales_orders so
       JOIN users u ON so.user_id = u.id
       WHERE so.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult.rows[0];

    // Check authorization
    if (order.user_id !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get order items
    const itemsResult = await pool.query(
      `SELECT oi.*, pv.sku, p.title as product_title
       FROM order_items oi
       JOIN product_variants pv ON oi.variant_id = pv.id
       JOIN products p ON pv.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    order.items = itemsResult.rows;
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List sales orders (user's own or all if admin)
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = `
      SELECT so.*, u.email as user_email, u.name as user_name
      FROM sales_orders so
      JOIN users u ON so.user_id = u.id
    `;
    let params = [];

    // If not admin, only show user's own orders
    if (req.user.role !== 'admin') {
      query += ' WHERE so.user_id = $1';
      params.push(req.user.userId);
    }

    query += ' ORDER BY so.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Check if admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'paid', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await pool.query(
      'UPDATE sales_orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
