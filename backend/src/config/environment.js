module.exports = {
  PORT: process.env.PORT || 8080,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'freshmart_super_secure_jwt_secret_2026',
  SESSION_COOKIE: 'sjh_session',
  OWNER_EMAIL: (process.env.OWNER_EMAIL || 'piyushverma730929@gmail.com').trim().toLowerCase(),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '880806707459-ci9gcf8sni1h6u0gmd1qtp96mg2u9l9g.apps.googleusercontent.com',
  DEFAULT_DELIVERY_FEE: 30,
  FREE_DELIVERY_THRESHOLD: 199,
  DELIVERY_SLA: '10-90 mins'
};
