// Vercel Serverless Function entrypoint
const { server } = require("../server");

module.exports = (req, res) => {
  // Attach request to response for origin and header inspection in helpers
  res.req = req;

  // Resolve the true requested URL on Vercel
  const originalUrl = req.originalUrl;
  const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-real-url'] || req.headers['x-original-uri'];
  const matchedPath = req.headers['x-matched-path'] || req.headers['x-vercel-matched-path'];
  const nowRouteMatches = req.headers['x-now-route-matches'] || req.headers['x-vercel-route-matches'];
  
  if (originalUrl && typeof originalUrl === 'string' && originalUrl.startsWith('/api')) {
    req.url = originalUrl;
  } else if (forwardedUri && typeof forwardedUri === 'string' && forwardedUri.startsWith('/api')) {
    req.url = forwardedUri;
  } else if (matchedPath && typeof matchedPath === 'string' && matchedPath.length > 4 && matchedPath.startsWith('/api/')) {
    const urlParts = req.url.split('?');
    const query = urlParts.length > 1 ? '?' + urlParts.slice(1).join('?') : '';
    req.url = matchedPath + query;
  } else if (req.query && (req.query.match || req.query['0'] || req.query['1'])) {
    const subpath = req.query.match || req.query['0'] || req.query['1'];
    const queryParts = req.url.split('?');
    const query = queryParts.length > 1 ? '?' + queryParts.slice(1).join('?') : '';
    req.url = '/api/' + String(subpath).replace(/^\//, '') + query;
  } else if (req.url && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }

  server.emit("request", req, res);
};
