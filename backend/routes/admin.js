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
    // Include active, returned, and completed rentals
    const rentalRevenueResult = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as rental_revenue FROM rentals WHERE status IN ('active', 'returned', 'completed')"
    );
    const rentalRevenue = parseFloat(rentalRevenueResult.rows[0].rental_revenue);

    // Get total revenue from sales
    // Include paid, shipped, delivered, and completed orders
    const salesRevenueResult = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as sales_revenue FROM sales_orders WHERE status IN ('paid', 'shipped', 'delivered', 'completed')"
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
    console.error('Error fetching admin dashboard data:', err);
    res.status(500).json({ error: 'Server error fetching dashboard data', details: err.message });
  }
});

// Revenue analytics endpoint
router.get('/analytics/revenue', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range based on period
    let startDate = new Date();
    let groupBy = 'day';
    
    switch(period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        groupBy = 'day';
        break;
      case '1m':
        startDate.setMonth(startDate.getMonth() - 1);
        groupBy = 'day';
        break;
      case '3m':
        startDate.setMonth(startDate.getMonth() - 3);
        groupBy = 'day';
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupBy = 'month';
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // Or your business start date
        groupBy = 'month';
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    // Get rental revenue over time
    const rentalQuery = groupBy === 'day' 
      ? `SELECT DATE(created_at) as date, SUM(total_amount) as revenue
         FROM rentals 
         WHERE status IN ('active', 'returned', 'completed')
         AND created_at >= $1
         GROUP BY DATE(created_at)
         ORDER BY date`
      : `SELECT DATE_TRUNC('month', created_at) as date, SUM(total_amount) as revenue
         FROM rentals 
         WHERE status IN ('active', 'returned', 'completed')
         AND created_at >= $1
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY date`;

    const rentalResult = await pool.query(rentalQuery, [startDate]);

    // Get sales revenue over time
    const salesQuery = groupBy === 'day'
      ? `SELECT DATE(created_at) as date, SUM(total_amount) as revenue
         FROM sales_orders 
         WHERE status IN ('paid', 'shipped', 'delivered', 'completed')
         AND created_at >= $1
         GROUP BY DATE(created_at)
         ORDER BY date`
      : `SELECT DATE_TRUNC('month', created_at) as date, SUM(total_amount) as revenue
         FROM sales_orders 
         WHERE status IN ('paid', 'shipped', 'delivered', 'completed')
         AND created_at >= $1
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY date`;

    const salesResult = await pool.query(salesQuery, [startDate]);

    // Combine and format data
    const dateMap = new Map();
    
    rentalResult.rows.forEach(row => {
      const dateKey = new Date(row.date).toISOString().split('T')[0];
      dateMap.set(dateKey, {
        date: dateKey,
        rentalRevenue: parseFloat(row.revenue) || 0,
        salesRevenue: 0,
        totalRevenue: parseFloat(row.revenue) || 0
      });
    });

    salesResult.rows.forEach(row => {
      const dateKey = new Date(row.date).toISOString().split('T')[0];
      if (dateMap.has(dateKey)) {
        const existing = dateMap.get(dateKey);
        existing.salesRevenue = parseFloat(row.revenue) || 0;
        existing.totalRevenue += parseFloat(row.revenue) || 0;
      } else {
        dateMap.set(dateKey, {
          date: dateKey,
          rentalRevenue: 0,
          salesRevenue: parseFloat(row.revenue) || 0,
          totalRevenue: parseFloat(row.revenue) || 0
        });
      }
    });

    // Convert to array and sort
    const chartData = Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Calculate summary stats
    const totalRentalRevenue = chartData.reduce((sum, item) => sum + item.rentalRevenue, 0);
    const totalSalesRevenue = chartData.reduce((sum, item) => sum + item.salesRevenue, 0);
    const totalRevenue = totalRentalRevenue + totalSalesRevenue;

    res.json({
      period,
      groupBy,
      chartData,
      summary: {
        totalRevenue,
        totalRentalRevenue,
        totalSalesRevenue,
        averageDaily: chartData.length > 0 ? totalRevenue / chartData.length : 0
      }
    });
  } catch (err) {
    console.error('Error fetching revenue analytics:', err);
    res.status(500).json({ error: 'Server error fetching analytics', details: err.message });
  }
});


// Get all inventory units with filtering
router.get('/inventory', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, search, variant_id, type } = req.query;
    
    let query = `
      SELECT iu.*, p.sku, p.title as product_title, p.id as product_id
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

    if (type) {
      query += ` AND iu.inventory_type = $${paramCount}`;
      params.push(type);
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
// Add new inventory unit (with optional new product creation)
router.post('/inventory', verifyToken, requireRole('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { 
      is_new_product,
      // Inventory fields
      serial_number, // Optional if quantity > 1
      serial_number_prefix, // Required if quantity > 1
      quantity = 1,
      status, location, inventory_type,
      // Existing product fields
      variant_id,
      // New product fields
      title, description, category, base_price, sku, image_url,
      // New variant fields
      pixel_pitch, width_cm, height_cm, rent_price_per_day
    } = req.body;

    if (quantity > 1 && !serial_number_prefix) {
      throw new Error('serial_number_prefix is required when adding multiple units');
    }

    if (quantity === 1 && !serial_number) {
      throw new Error('serial_number is required for single unit');
    }

    if (!inventory_type || !['rental', 'sale'].includes(inventory_type)) {
      throw new Error('inventory_type must be either "rental" or "sale"');
    }

    let finalVariantId = variant_id;

    if (is_new_product) {
      // Validate new product fields
      if (!title || !base_price || !sku) {
        throw new Error('Title, base_price, and SKU are required for new products');
      }

      // 1. Create Product
      const productRes = await client.query(
        'INSERT INTO products (title, description, category, base_price, sku, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [title, description, category, base_price, sku, image_url || null]
      );
      const productId = productRes.rows[0].id;

      // 2. Create Default Variant
      const variantRes = await client.query(
        'INSERT INTO product_variants (product_id, name, price, pixel_pitch, width_cm, height_cm, rent_price_per_day) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [productId, 'Standard', base_price, pixel_pitch || null, width_cm || null, height_cm || null, rent_price_per_day || null]
      );
      finalVariantId = variantRes.rows[0].id;
    } else {
      if (!finalVariantId) {
        throw new Error('variant_id is required for existing products');
      }
    }

    // 3. Create Inventory Units
    const createdUnits = [];
    const qty = parseInt(quantity);
    
    for (let i = 0; i < qty; i++) {
      const currentSerial = qty === 1 ? serial_number : `${serial_number_prefix}-${i + 1}`;
      
      const result = await client.query(
        'INSERT INTO inventory_units (variant_id, serial_number, status, location, inventory_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [finalVariantId, currentSerial, status || 'available', location, inventory_type]
      );
      createdUnits.push(result.rows[0]);
    }

    await client.query('COMMIT');
    res.status(201).json(qty === 1 ? createdUnits[0] : { message: `Successfully added ${qty} units`, units: createdUnits });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message || 'Server error' });
  } finally {
    client.release();
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

// Get all users
router.get('/users', verifyToken, requireRole('admin'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', verifyToken, requireRole('admin'), async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    // Prevent deleting yourself
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
