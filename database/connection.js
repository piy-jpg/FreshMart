/**
 * FreshMart Database Engine Singleton Connection
 */
const dbInstance = require('../database.js');

module.exports = {
  db: dbInstance,
  getDb: () => dbInstance
};
