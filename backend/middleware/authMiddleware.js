// middleware/authMiddleware.js - JWT authentication middleware
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Verify JWT token attached in Authorization header
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided." });
  }

  // Expect header format: "Bearer <token>"
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Token missing." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded; // attach user info to request
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token." });
  }
}

// Role-based access control middleware factory
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Access denied: insufficient permissions.",
        });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
