const { OWNER_EMAIL } = require('../config/environment');
module.exports = function adminMiddleware(req, res, next) {
  if (!req.user || (req.user.role !== 'OWNER' && req.user.role !== 'ADMIN' && req.user.email !== OWNER_EMAIL)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  if (next) next();
};
