// Vercel Serverless Function entrypoint
const { server } = require("../server");

module.exports = (req, res) => {
  // Attach request to response for origin and header inspection in helpers
  res.req = req;

  // Resolve the true requested URL on Vercel
  let resolvedPath = req.url || '/';
  const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-real-url'] || req.headers['x-original-uri'] || req.originalUrl;

  if (forwardedUri && typeof forwardedUri === 'string' && forwardedUri.startsWith('/api')) {
    resolvedPath = forwardedUri;
  } else if (req.headers['x-matched-path'] && req.headers['x-matched-path'].startsWith('/api/') && !req.headers['x-matched-path'].includes('/api/index')) {
    const queryParts = (req.url || '').split('?');
    const query = queryParts.length > 1 ? '?' + queryParts.slice(1).join('?') : '';
    resolvedPath = req.headers['x-matched-path'] + query;
  } else if (req.query && (req.query.subpath || req.query.match || req.query['0'] || req.query['1'])) {
    const subpath = req.query.subpath || req.query.match || req.query['0'] || req.query['1'];
    const queryParts = (req.url || '').split('?');
    const query = queryParts.length > 1 ? '?' + queryParts.slice(1).join('?') : '';
    resolvedPath = '/api/' + String(subpath).replace(/^\//, '') + query;
  }

  if (!resolvedPath.startsWith('/api')) {
    resolvedPath = '/api' + (resolvedPath.startsWith('/') ? resolvedPath : '/' + resolvedPath);
  }

  req.url = resolvedPath;

  server.emit("request", req, res);
};
