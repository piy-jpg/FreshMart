/**
 * FreshMart Initial Migration Script
 * Initializes standard collections and indexes.
 */

const fs = require('fs');
const path = require('path');

async function up() {
  console.log('Running Migration 001_initial_schema...');
  const dataPath = path.join(__dirname, '../data.json');
  
  if (!fs.existsSync(dataPath)) {
    const initialData = {
      users: [],
      products: [],
      categories: [],
      orders: [],
      addresses: [],
      deliveryZones: [],
      settings: {
        platformName: "FreshMart",
        supportPhone: "1800-FRESH-MART",
        supportEmail: "care@freshmart.in",
        maintenanceMode: false
      }
    };
    fs.writeFileSync(dataPath, JSON.stringify(initialData, null, 2));
    console.log('Initialized database/data.json successfully.');
  } else {
    console.log('database/data.json already exists.');
  }
}

async function down() {
  console.log('Rolling back Migration 001_initial_schema...');
}

module.exports = { up, down };

if (require.main === module) {
  up();
}
