/**
 * Migration 001: Core Production Entities Schema
 * Defines and initializes the 16 core production collections:
 * 1. Users & Authentication
 * 2. Customers
 * 3. Staff & Roles
 * 4. Products
 * 5. Categories
 * 6. Inventory & Movements
 * 7. Baskets (Carts)
 * 8. Orders
 * 9. Order Items
 * 10. Delivery Boys
 * 11. Hubs
 * 12. Delivery Assignments
 * 13. Payments
 * 14. Addresses & Locations
 * 15. Notifications
 * 16. Audit Logs
 */

async function up(db) {
  console.log('🔄 Executing Migration 001_initial_schema...');

  const requiredCollections = [
    'users',
    'admin_users',
    'customers',
    'delivery_partners',
    'products',
    'categories',
    'inventory_movements',
    'carts',
    'orders',
    'hubs',
    'delivery_zones',
    'payments',
    'addresses',
    'notifications',
    'activity_logs',
    'sessions',
    'wishlists',
    'settings'
  ];

  if (!db.data) db.data = {};

  let createdCount = 0;
  for (const coll of requiredCollections) {
    if (!db.data[coll]) {
      db.data[coll] = (coll === 'settings') ? {
        platformName: "FreshMart",
        supportPhone: "1800-FRESH-MART",
        supportEmail: "care@freshmart.in",
        maintenanceMode: false,
        version: "2.0.0"
      } : [];
      createdCount++;
    }
  }

  db.save();
  console.log(`✅ Migration 001_initial_schema completed. Verified ${requiredCollections.length} collections (${createdCount} newly initialized).`);
  return true;
}

async function down(db) {
  console.log('⏪ Rolling back Migration 001_initial_schema...');
  return true;
}

module.exports = { id: '001_initial_schema', up, down };
