const jwt = require('jsonwebtoken');

// Verify JWT and attach user info to request
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // contains id and role
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Role-based access control middleware
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden: insufficient privileges' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
