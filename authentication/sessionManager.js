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
    const token = cookies.sjh_session || cookies.sabjihub_session || cookies.freshmart_session;
    if (!token) return null;
    return this.validate(token);
  }
}

module.exports = new SessionManager();
