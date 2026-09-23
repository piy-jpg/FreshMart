const { authController } = require('../controllers');
const { extractUserSession } = require('../middleware');

async function handleAuthRoutes(req, res, pathname, method) {
  if (pathname === '/api/auth/register' && method === 'POST') {
    return authController.register(req, res);
  }
  if (pathname === '/api/auth/login' && method === 'POST') {
    return authController.login(req, res);
  }
  if (pathname === '/api/auth/logout' && method === 'POST') {
    return authController.logout(req, res);
  }
  if (pathname === '/api/auth/me' && method === 'GET') {
    req.auth = extractUserSession(req);
    return authController.me(req, res);
  }
  return false;
}

module.exports = handleAuthRoutes;
