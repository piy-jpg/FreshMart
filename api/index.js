// Vercel Serverless Function entrypoint
const url = require("url");
const { server } = require("../server");
const db = require("../database");

module.exports = async (req, res) => {
  if (db.postgres && db.postgres.isAvailable()) {
    try {
      if (!db.postgres.isInitialized) {
        await db.initPostgres();
      } else {
        await db.syncFromPostgres();
      }
    } catch (e) {
      console.warn('PostgreSQL sync notice:', e.message);
      // If we don't have products loaded in memory yet (cold container error), retry once
      if (!db.data || !db.data.products || db.data.products.length === 0) {
        try {
          await db.initPostgres();
        } catch (retryErr) {
          console.error('PostgreSQL cold-start init failed:', retryErr.message);
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            error: 'Database Unavailable',
            message: 'PostgreSQL is the production single source of truth and is currently unreachable.',
            detail: retryErr.message
          }));
        }
      }
    }
  }
  // Attach request to response for origin and header inspection in helpers
  res.req = req;

  // Resolve the true requested URL on Vercel
  let rawUrl = req.url || '/';
  const parsed = url.parse(rawUrl, true);
  let resolvedPath = parsed.pathname || '/';

  const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-real-url'] || req.headers['x-original-uri'] || req.originalUrl;
  const matchedPath = req.headers['x-matched-path'];

  if (forwardedUri && typeof forwardedUri === 'string' && forwardedUri.startsWith('/api') && !forwardedUri.includes('/api/index')) {
    resolvedPath = forwardedUri;
  } else if (matchedPath && matchedPath.startsWith('/api/') && !matchedPath.includes('/api/index')) {
    resolvedPath = matchedPath;
  } else if (parsed.query && (parsed.query.subpath || parsed.query.match || parsed.query['0'] || parsed.query['1'])) {
    const subpath = parsed.query.subpath || parsed.query.match || parsed.query['0'] || parsed.query['1'];
    resolvedPath = '/api/' + String(subpath).replace(/^\//, '');
  } else if (req.query && (req.query.subpath || req.query.match || req.query['0'] || req.query['1'])) {
    const subpath = req.query.subpath || req.query.match || req.query['0'] || req.query['1'];
    resolvedPath = '/api/' + String(subpath).replace(/^\//, '');
  }

  if (!resolvedPath.startsWith('/api')) {
    resolvedPath = '/api' + (resolvedPath.startsWith('/') ? resolvedPath : '/' + resolvedPath);
  }

  // Retain original query string if any
  const search = parsed.search || '';
  req.url = resolvedPath + (search && !resolvedPath.includes('?') ? search : '');

  server.emit("request", req, res);
};
