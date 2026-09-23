const { parseCookies, sendJson } = require('../../shared/utilities');
const { db } = require('../../database/connection');

function extractUserSession(req) {
  const cookies = parseCookies(req);
  const token = cookies.sjh_session || cookies.sabjihub_session || cookies.freshmart_session;
  if (!token) return null;
  return db.validateSession(token);
}

function requireAuth(req, res, next) {
  const auth = extractUserSession(req);
  if (!auth || !auth.user) {
    return sendJson(res, 401, { error: 'Authentication required. Please sign in.' });
  }
  req.auth = auth;
  req.user = auth.user;
  if (typeof next === 'function') next();
  return auth;
}

module.exports = {
  extractUserSession,
  requireAuth
};
