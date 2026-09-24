/**
 * FreshMart Production Database Schema Migration & Catalog Population Runner
 * Executes all DDL, schema definitions, and catalog migrations directly on PostgreSQL.
 */

const PostgresAdapter = require('./adapters/postgresAdapter');

async function runMigrations() {
  console.log('====================================================');
  console.log(' FRESHMART PRODUCTION POSTGRESQL MIGRATION RUNNER');
  console.log('====================================================');

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not defined.');
    process.exit(1);
  }

  const adapter = new PostgresAdapter(dbUrl);
  try {
    console.log('Connecting to PostgreSQL database...');
    let seedData = null;
    try {
      seedData = require('../data/db.json');
    } catch (e) {}

    await adapter.init(seedData);

    const tables = [
      'freshmart_products',
      'freshmart_users',
      'freshmart_categories',
      'freshmart_orders',
      'freshmart_delivery_partners',
      'freshmart_farmers',
      'freshmart_hubs',
      'freshmart_inventory_movements',
      'freshmart_settings',
      'freshmart_audit_logs',
      'freshmart_kv'
    ];

    console.log('\n--- PostgreSQL Production Table Row Counts ---');
    for (const t of tables) {
      const res = await adapter.query(`SELECT COUNT(*) FROM ${t}`);
      console.log(`- ${t}: ${res.rows[0].count} rows`);
    }

    const prodCountRes = await adapter.query('SELECT COUNT(*) FROM freshmart_products');
    const finalCount = parseInt(prodCountRes.rows[0].count, 10);
    console.log(`\n✅ Migration Complete! freshmart_products now contains ${finalCount} products in PostgreSQL.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigrations();
