/**
 * FreshMart Modular Backend Entry Server
 */
const http = require('http');
const { PORT } = require('./config/environment');
const { db } = require('./config/database');

console.log('Starting FreshMart Modular Backend API...');

// Delegates to root server for integrated routing & SSE
const rootServer = require('../../server.js');

module.exports = rootServer;
