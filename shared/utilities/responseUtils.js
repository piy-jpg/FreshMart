function sendJson(res, statusCode, data, headers = {}) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
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
