const { APP_CONSTANTS } = require('../shared/constants');

module.exports = {
  ...APP_CONSTANTS,
  JWT_SECRET: process.env.JWT_SECRET || 'freshmart_super_secure_enterprise_key_2026',
  SESSION_COOKIE_NAME: 'sjh_session'
};
