// server/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function extractToken(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
}

exports.verifyJWT = (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized: token missing' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Unauthorized: token expired' });
    }
    return res.status(401).json({ success: false, message: 'Unauthorized: invalid token' });
  }
};

// Optional: does not fail if no token, just sets req.user when available
exports.optionalAuth = (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = { id: decoded.id, role: decoded.role };
    }
  } catch (_e) {
    // Ignore token errors in optional auth
  }
  return next();
};
