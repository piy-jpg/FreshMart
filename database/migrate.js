/**
 * FreshMart Production Database Schema Migration Runner
 * Executes all DDL and schema definitions directly on PostgreSQL.
 */

const PostgresAdapter = require('./adapters/postgresAdapter');

async function runMigrations() {
  console.log('====================================================');
  console.log(' FRESHMART PRODUCTION POSTGRESQL MIGRATION RUNNER');
  console.log('====================================================');

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL environment variable is not defined.');
    console.error('Please set DATABASE_URL (e.g. postgresql://user:pass@host:5432/dbname?sslmode=require)');
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
    console.log('✅ All PostgreSQL schemas, tables, and indexes created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigrations();
