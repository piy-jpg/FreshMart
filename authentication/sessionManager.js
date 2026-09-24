const { db } = require('../database/connection');
const { parseCookies, setAuthCookie, clearAuthCookie } = require('../shared/utilities');

class SessionManager {
  create(userId, rememberMe = false, req = null) {
    return db.createSession(userId, rememberMe, req);
  }

  validate(token) {
    return db.validateSession(token);
  }

  destroy(token) {
    return db.destroySession(token);
  }

  extract(req) {
    const cookies = parseCookies(req);
    let token = cookies.sjh_session || cookies.sabjihub_session || cookies.freshmart_session;
    if (!token && req?.headers) {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      } else if (req.headers['x-session-token']) {
        token = req.headers['x-session-token'];
      } else if (req.headers['x-auth-token']) {
        token = req.headers['x-auth-token'];
      }
    }
    if (!token) return null;
    return this.validate(token);
  }
}

module.exports = new SessionManager();
