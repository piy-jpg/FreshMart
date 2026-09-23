const sessionManager = require('./sessionManager');
const passwordHasher = require('./passwordHasher');
const googleOAuth = require('./googleOAuth');

module.exports = {
  sessionManager,
  ...passwordHasher,
  ...googleOAuth
};
