const { db } = require('../../database/connection');
const { getClientIp, sendJson } = require('../../shared/utilities');

function rateLimit(prefix, maxAttempts = 10, windowMs = 15 * 60 * 1000) {
  return function(req, res, next) {
    const ip = getClientIp(req);
    const key = `${prefix}:${ip}`;
    const check = db.checkRateLimit(key, maxAttempts, windowMs);

    if (!check.allowed) {
      return sendJson(res, 429, {
        error: `Too many requests. Please try again in ${Math.ceil((check.retryAfterSeconds || 60) / 60)} minutes.`
      });
    }

    if (typeof next === 'function') next();
    return true;
  };
}

module.exports = {
  rateLimit
};
