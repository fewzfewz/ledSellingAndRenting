const express = require('express');
const pool = require('../db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// List products (only show products with available inventory for customers)
router.get('/', async (req, res) => {
  try {
    const { category, q, page = 1, limit = 20, show_all } = req.query;
    
    // Base query - join with inventory to check availability
    let query = `
      SELECT DISTINCT p.*, 
        COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'available' AND i.inventory_type = 'rental') as rental_count,
        COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'available' AND i.inventory_type = 'sale') as sale_count
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN inventory_units i ON pv.id = i.variant_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    // Search by title or description
    if (q) {
      query += ` AND (p.title ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`;
      params.push(`%${q}%`);
      paramCount++;
    }

    query += ` GROUP BY p.id`;

    // Only show products with available inventory (unless admin requests all)
    if (!show_all || show_all !== 'true') {
      query += ` HAVING (COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'available' AND i.inventory_type = 'rental') > 0 
                 OR COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'available' AND i.inventory_type = 'sale') > 0)`;
    }

    // Add pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    
    // Get total count
    let countQuery = `
      SELECT p.id
      FROM products p
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN inventory_units i ON pv.id = i.variant_id
      WHERE 1=1
    `;
    const countParams = [];
    let countParamCount = 1;
    
    if (category) {
      countQuery += ` AND p.category = $${countParamCount}`;
      countParams.push(category);
      countParamCount++;
    }
    
    if (q) {
      countQuery += ` AND (p.title ILIKE $${countParamCount} OR p.description ILIKE $${countParamCount})`;
      countParams.push(`%${q}%`);
    }

    countQuery += ` GROUP BY p.id`;

    if (!show_all || show_all !== 'true') {
      countQuery += ` HAVING (COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'available' AND i.inventory_type = 'rental') > 0 
                       OR COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'available' AND i.inventory_type = 'sale') > 0)`;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const totalCount = countResult.rows.length;
    
    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get product detail
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const productRes = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    
    if (productRes.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productRes.rows[0];
    
    const variantsRes = await pool.query(`
      SELECT pv.*, 
        COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'available' AND i.inventory_type = 'rental') as rental_count,
        COUNT(DISTINCT i.id) FILTER (WHERE i.status = 'available' AND i.inventory_type = 'sale') as sale_count
      FROM product_variants pv
      LEFT JOIN inventory_units i ON pv.id = i.variant_id
      WHERE pv.product_id = $1
      GROUP BY pv.id
    `, [id]);
    product.variants = variantsRes.rows;
    
    const mediaRes = await pool.query('SELECT * FROM media WHERE product_id = $1 ORDER BY order_index', [id]);
    product.media = mediaRes.rows;
    
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create product (Admin only - simplified, no auth check for now)
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { sku, title, description, category, base_price, image_url, variants } = req.body;
    
    console.log('Creating product:', { sku, title, category, base_price, image_url: image_url ? 'provided' : 'null' });
    
    // Validate required fields
    if (!sku || !title || !category || !base_price) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Missing required fields: sku, title, category, base_price' });
    }
    
    const productRes = await client.query(
      'INSERT INTO products (sku, title, description, category, base_price, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [sku, title, description, category, base_price, image_url || null]
    );
    
    const product = productRes.rows[0];
    console.log('Product created:', product.id);
    
    // If variants provided, insert them
    if (variants && variants.length > 0) {
      console.log('Creating', variants.length, 'variants');
      for (const variant of variants) {
        await client.query(
          'INSERT INTO product_variants (product_id, name, pixel_pitch, width_cm, height_cm, weight_kg, price, rent_price_per_day) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          [product.id, variant.name, variant.pixel_pitch, variant.width_cm, variant.height_cm, variant.weight_kg, variant.price, variant.rent_price_per_day]
        );
      }
      console.log('Variants created successfully');
    }
    
    await client.query('COMMIT');
    console.log('Transaction committed');
    res.status(201).json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating product:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ error: 'Server error: ' + err.message });
  } finally {
    client.release();
  }
});

// Delete product (Admin only)
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    
    // Check if product exists
    const checkRes = await client.query('SELECT id FROM products WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete product (cascade should handle variants/media)
    await client.query('DELETE FROM products WHERE id = $1', [id]);
    
    await client.query('COMMIT');
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
