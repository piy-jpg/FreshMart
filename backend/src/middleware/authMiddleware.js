const { db } = require('../config/database');
module.exports = function authMiddleware(req, res, next) {
  const cookie = req.headers.cookie;
  const token = cookie?.match(/sjh_session=([^;]+)/)?.[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  const session = db.validateSession(token);
  if (!session) return res.status(401).json({ error: 'Invalid or expired session' });
  req.user = session.user;
  if (next) next();
};
