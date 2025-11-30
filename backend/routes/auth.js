const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { email, password, name, phone } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, phone) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, passwordHash, name, phone]
    );
    
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    // In a real app, send token as HttpOnly cookie
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    
    // Remove password hash from response
    delete user.password_hash;
    
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user (protected)
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, email, name, role, phone FROM users WHERE id = $1', [decoded.userId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
