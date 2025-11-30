// const { Pool } = require('pg');
// const dotenv = require('dotenv');

// dotenv.config();

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

// module.exports = pool;


const { Pool } = require('pg');

// Temporary debug + fallback
console.log('DATABASE_URL:', process.env.DATABASE_URL || 'postgresql://fewzan@localhost:5432/graceled');

const connectionString = process.env.DATABASE_URL || 'postgresql://fewzan@localhost:5432/graceled';

const pool = new Pool({
  connectionString: connectionString,
});

module.exports = pool;