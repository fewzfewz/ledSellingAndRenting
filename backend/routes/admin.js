const express = require('express');
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Admin dashboard stats
router.get('/dashboard', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // Get total users
    const usersResult = await pool.query('SELECT COUNT(*) as total_users FROM users');
    const totalUsers = parseInt(usersResult.rows[0].total_users);

    // Get total products
    const productsResult = await pool.query('SELECT COUNT(*) as total_products FROM products');
    const totalProducts = parseInt(productsResult.rows[0].total_products);

    // Get total rentals
    const rentalsResult = await pool.query('SELECT COUNT(*) as total_rentals FROM rentals');
    const totalRentals = parseInt(rentalsResult.rows[0].total_rentals);

    // Get total sales orders
    const ordersResult = await pool.query('SELECT COUNT(*) as total_orders FROM sales_orders');
    const totalOrders = parseInt(ordersResult.rows[0].total_orders);

    // Get total revenue from rentals
    const rentalRevenueResult = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as rental_revenue FROM rentals WHERE status = 'completed'"
    );
    const rentalRevenue = parseFloat(rentalRevenueResult.rows[0].rental_revenue);

    // Get total revenue from sales
    const salesRevenueResult = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as sales_revenue FROM sales_orders WHERE status IN ('paid', 'shipped', 'complete')"
    );
    const salesRevenue = parseFloat(salesRevenueResult.rows[0].sales_revenue);

    // Get inventory status
    const inventoryResult = await pool.query(
      'SELECT status, COUNT(*) as count FROM inventory_units GROUP BY status'
    );
    const inventoryStatus = inventoryResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});

    // Get recent quotes
    const recentQuotesResult = await pool.query(
      'SELECT id, contact_email, event_date, status, created_at FROM quotes ORDER BY created_at DESC LIMIT 5'
    );

    // Get recent rentals
    const recentRentalsResult = await pool.query(
      'SELECT id, user_id, start_date, end_date, status, total_amount, created_at FROM rentals ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      stats: {
        totalUsers,
        totalProducts,
        totalRentals,
        totalOrders,
        rentalRevenue,
        salesRevenue,
        totalRevenue: rentalRevenue + salesRevenue,
        inventoryStatus
      },
      recentQuotes: recentQuotesResult.rows,
      recentRentals: recentRentalsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all inventory units with filtering
router.get('/inventory', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, search, variant_id } = req.query;
    
    let query = `
      SELECT iu.*, pv.sku, p.title as product_title, p.id as product_id
      FROM inventory_units iu
      JOIN product_variants pv ON iu.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND iu.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (variant_id) {
      query += ` AND iu.variant_id = $${paramCount}`;
      params.push(variant_id);
      paramCount++;
    }

    if (search) {
      query += ` AND (iu.serial_number ILIKE $${paramCount} OR p.title ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY iu.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new inventory unit
router.post('/inventory', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { variant_id, serial_number, status, location } = req.body;

    if (!variant_id || !serial_number) {
      return res.status(400).json({ error: 'variant_id and serial_number are required' });
    }

    const result = await pool.query(
      'INSERT INTO inventory_units (variant_id, serial_number, status, location) VALUES ($1, $2, $3, $4) RETURNING *',
      [variant_id, serial_number, status || 'available', location]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Serial number already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Update inventory unit
router.put('/inventory/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location } = req.body;

    const result = await pool.query(
      'UPDATE inventory_units SET status = COALESCE($1, status), location = COALESCE($2, location), updated_at = NOW() WHERE id = $3 RETURNING *',
      [status, location, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory unit not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check inventory availability for date range
router.get('/inventory/availability', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { variant_id, start_date, end_date } = req.query;

    if (!variant_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'variant_id, start_date, and end_date are required' });
    }

    // Get total units for this variant
    const totalResult = await pool.query(
      'SELECT COUNT(*) as total FROM inventory_units WHERE variant_id = $1 AND status = $2',
      [variant_id, 'available']
    );

    // Get units already rented in this period
    const rentedResult = await pool.query(
      `SELECT COUNT(DISTINCT ri.inventory_unit_id) as rented
       FROM rental_items ri
       JOIN rentals r ON ri.rental_id = r.id
       WHERE ri.variant_id = $1
       AND r.status IN ('confirmed', 'active')
       AND (
         (r.start_date <= $2 AND r.end_date >= $2)
         OR (r.start_date <= $3 AND r.end_date >= $3)
         OR (r.start_date >= $2 AND r.end_date <= $3)
       )`,
      [variant_id, start_date, end_date]
    );

    const total = parseInt(totalResult.rows[0].total);
    const rented = parseInt(rentedResult.rows[0].rented || 0);
    const available = total - rented;

    res.json({ total, rented, available });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
