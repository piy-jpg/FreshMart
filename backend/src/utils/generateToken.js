const crypto = require('crypto');
module.exports = {
  generateToken: (bytes = 32) => crypto.randomBytes(bytes).toString('hex'),
  generateOtp: () => String(Math.floor(1000 + Math.random() * 9000))
};
