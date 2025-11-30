// const pool = require('./db');
// const bcrypt = require('bcrypt');
// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '.env') });

// async function seed() {
//   const client = await pool.connect();
//   try {
//     await client.query('BEGIN');

//     // Create Admin User
//     const passwordHash = await bcrypt.hash('admin123', 10);
//     const adminRes = await client.query(`
//       INSERT INTO users (email, password_hash, role, name)
//       VALUES ($1, $2, $3, $4)
//       ON CONFLICT (email) DO NOTHING
//       RETURNING id
//     `, ['admin@example.com', passwordHash, 'admin', 'Admin User']);

//     let adminId;
//     if (adminRes.rows.length > 0) {
//       adminId = adminRes.rows[0].id;
//       console.log('Admin user created:', adminId);
//     } else {
//       const res = await client.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
//       adminId = res.rows[0].id;
//       console.log('Admin user already exists:', adminId);
//     }

//     // Create Categories (using products table for now as category is a text field, but we can seed some products)
//     // Seed Products
//     const products = [
//       {
//         sku: 'P3.9-INDOOR',
//         title: 'P3.9 Indoor LED Panel',
//         description: 'High resolution indoor LED panel, perfect for events.',
//         category: 'indoor',
//         base_price: 500.00,
//         variants: [
//           { name: '500x500mm', pixel_pitch: 3.9, width_cm: 50, height_cm: 50, weight_kg: 8, price: 500.00, rent_price_per_day: 50.00 },
//           { name: '500x1000mm', pixel_pitch: 3.9, width_cm: 50, height_cm: 100, weight_kg: 14, price: 900.00, rent_price_per_day: 90.00 }
//         ]
//       },
//       {
//         sku: 'P4.8-OUTDOOR',
//         title: 'P4.8 Outdoor LED Panel',
//         description: 'Weatherproof outdoor LED panel, high brightness.',
//         category: 'outdoor',
//         base_price: 600.00,
//         variants: [
//           { name: '500x500mm', pixel_pitch: 4.8, width_cm: 50, height_cm: 50, weight_kg: 9, price: 600.00, rent_price_per_day: 60.00 },
//           { name: '500x1000mm', pixel_pitch: 4.8, width_cm: 50, height_cm: 100, weight_kg: 16, price: 1100.00, rent_price_per_day: 110.00 }
//         ]
//       }
//     ];

//     for (const p of products) {
//       const pRes = await client.query(`
//         INSERT INTO products (sku, title, description, category, base_price)
//         VALUES ($1, $2, $3, $4, $5)
//         ON CONFLICT (sku) DO NOTHING
//         RETURNING id
//       `, [p.sku, p.title, p.description, p.category, p.base_price]);

//       let productId;
//       if (pRes.rows.length > 0) {
//         productId = pRes.rows[0].id;
//         console.log(`Product created: ${p.title}`);
//       } else {
//         const res = await client.query('SELECT id FROM products WHERE sku = $1', [p.sku]);
//         productId = res.rows[0].id;
//         console.log(`Product already exists: ${p.title}`);
//       }

//       for (const v of p.variants) {
//         await client.query(`
//           INSERT INTO product_variants (product_id, name, pixel_pitch, width_cm, height_cm, weight_kg, price, rent_price_per_day)
//           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
//           ON CONFLICT DO NOTHING
//         `, [productId, v.name, v.pixel_pitch, v.width_cm, v.height_cm, v.weight_kg, v.price, v.rent_price_per_day]);
//       }
//     }

//     await client.query('COMMIT');
//     console.log('Seeding completed successfully');
//   } catch (e) {
//     await client.query('ROLLBACK');
//     console.error('Error seeding database:', e);
//   } finally {
//     client.release();
//     pool.end(); // Close pool to exit script
//   }
// }

// seed();


const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // This must be FIRST

const pool = require('./db');
const bcrypt = require('bcrypt');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create Admin User
    const passwordHash = await bcrypt.hash('admin123', 10);
    const adminRes = await client.query(`
      INSERT INTO users (email, password_hash, role, name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `, ['admin@example.com', passwordHash, 'admin', 'Admin User']);

    let adminId;
    if (adminRes.rows.length > 0) {
      adminId = adminRes.rows[0].id;
      console.log('Admin user created:', adminId);
    } else {
      const res = await client.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
      adminId = res.rows[0].id;
      console.log('Admin user already exists:', adminId);
    }

    // Create Categories (using products table for now as category is a text field, but we can seed some products)
    // Seed Products
    const products = [
      {
        sku: 'P3.9-INDOOR',
        title: 'P3.9 Indoor LED Panel',
        description: 'High resolution indoor LED panel, perfect for events.',
        category: 'indoor',
        base_price: 500.00,
        variants: [
          { name: '500x500mm', pixel_pitch: 3.9, width_cm: 50, height_cm: 50, weight_kg: 8, price: 500.00, rent_price_per_day: 50.00 },
          { name: '500x1000mm', pixel_pitch: 3.9, width_cm: 50, height_cm: 100, weight_kg: 14, price: 900.00, rent_price_per_day: 90.00 }
        ]
      },
      {
        sku: 'P4.8-OUTDOOR',
        title: 'P4.8 Outdoor LED Panel',
        description: 'Weatherproof outdoor LED panel, high brightness.',
        category: 'outdoor',
        base_price: 600.00,
        variants: [
          { name: '500x500mm', pixel_pitch: 4.8, width_cm: 50, height_cm: 50, weight_kg: 9, price: 600.00, rent_price_per_day: 60.00 },
          { name: '500x1000mm', pixel_pitch: 4.8, width_cm: 50, height_cm: 100, weight_kg: 16, price: 1100.00, rent_price_per_day: 110.00 }
        ]
      }
    ];

    for (const p of products) {
      const pRes = await client.query(`
        INSERT INTO products (sku, title, description, category, base_price)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (sku) DO NOTHING
        RETURNING id
      `, [p.sku, p.title, p.description, p.category, p.base_price]);

      let productId;
      if (pRes.rows.length > 0) {
        productId = pRes.rows[0].id;
        console.log(`Product created: ${p.title}`);
      } else {
        const res = await client.query('SELECT id FROM products WHERE sku = $1', [p.sku]);
        productId = res.rows[0].id;
        console.log(`Product already exists: ${p.title}`);
      }

      for (const v of p.variants) {
        await client.query(`
          INSERT INTO product_variants (product_id, name, pixel_pitch, width_cm, height_cm, weight_kg, price, rent_price_per_day)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `, [productId, v.name, v.pixel_pitch, v.width_cm, v.height_cm, v.weight_kg, v.price, v.rent_price_per_day]);
      }
    }

    await client.query('COMMIT');
    console.log('Seeding completed successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', e);
  } finally {
    client.release();
    pool.end(); // Close pool to exit script
  }
}

seed();