const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  console.log("Auth header:", authHeader);
  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  // support "Bearer <token>" and raw token
  const parts = authHeader.split(" ");
  const token = parts.length === 2 ? parts[1] : parts[0];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    // Normalize decoded payload to req.user with .id and .role
    req.user = {
      id: decoded.userId || decoded.user_id || decoded.sub || decoded.id,
      role: decoded.role || decoded.roles || null,
      // keep full decoded if needed
      _raw: decoded,
    };

    if (!req.user.id) {
      console.error("Token missing user id:", decoded);
      return res.status(401).json({ error: "Invalid token: missing user id" });
    }

    return next();
  } catch (err) {
    console.error("Token verify error:", err);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Role-based access control middleware
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "No token provided" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
