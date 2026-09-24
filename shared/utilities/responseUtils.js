function sendJson(res, statusCode, data, headers = {}) {
  const json = JSON.stringify(data);
  const reqOrigin = res.req?.headers?.origin;
  const defaultHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
    'Access-Control-Allow-Origin': reqOrigin || '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Role, X-Requested-With, Accept',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Content-Length': Buffer.byteLength(json)
  };
  if (reqOrigin) {
    defaultHeaders['Access-Control-Allow-Credentials'] = 'true';
  }
  res.writeHead(statusCode, {
    ...defaultHeaders,
    ...headers
  });
  res.end(json);
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.socket.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts.shift().trim();
    const value = decodeURIComponent(parts.join('=') || '');
    if (name) list[name] = value;
  });
  return list;
}

function setAuthCookie(res, sessionId, rememberMe = false) {
  const maxAgeSeconds = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
  const isSecure = process.env.NODE_ENV === 'production';
  const cookieVal = `sjh_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${isSecure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', cookieVal);
}

function clearAuthCookie(res) {
  res.setHeader('Set-Cookie', 'sjh_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
}

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, salt, passwordSalt, verificationToken, verificationTokenExpires, resetToken, resetTokenExpires, ...safe } = user;
  return safe;
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || '127.0.0.1';
}

module.exports = {
  sendJson,
  parseBody,
  parseCookies,
  setAuthCookie,
  clearAuthCookie,
  sanitizeUser,
  getClientIp
};
