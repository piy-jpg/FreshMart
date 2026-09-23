const authMiddleware = require('./authMiddleware');
const rbacMiddleware = require('./rbacMiddleware');
const rateLimiter = require('./rateLimiter');
const corsMiddleware = require('./corsMiddleware');

module.exports = {
  ...authMiddleware,
  ...rbacMiddleware,
  ...rateLimiter,
  ...corsMiddleware
};
