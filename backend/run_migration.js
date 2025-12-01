const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function runMigration() {
  try {
    const sqlPath = path.join(__dirname, 'migrations', '006_add_delivery_address_to_rentals.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running delivery_address migration...');
    await pool.query(sql);
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
