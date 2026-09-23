const handleApiRoutes = require('../routes');
const { addClient } = require('./events');
const { handleCors } = require('../middleware');

async function handleApiRequest(req, res, pathname, method, queryParams) {
  // CORS pre-flight & headers
  if (handleCors(req, res)) return true;

  // SSE Real-time events endpoint
  if (pathname === '/api/events' && method === 'GET') {
    addClient(res, req);
    return true;
  }

  // Delegated modular routes
  return handleApiRoutes(req, res, pathname, method, queryParams);
}

module.exports = {
  handleApiRequest
};
