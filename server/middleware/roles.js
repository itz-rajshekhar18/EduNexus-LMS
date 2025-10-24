// server/middleware/roles.js
exports.allowRoles = (...allowed) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    return next();
  };
};
