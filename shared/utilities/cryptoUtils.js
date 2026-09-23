const crypto = require('crypto');

function hashPassword(password, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  if (!password || !hash || !salt) return false;
  const computed = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return computed === hash;
}

function generateRandomToken(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateNumericOTP(digits = 4) {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateRandomToken,
  generateNumericOTP
};
