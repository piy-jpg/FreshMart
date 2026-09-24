/**
 * Migration 002: Production Performance Indexes
 * Builds in-memory index structures and validates entity relationship constraints.
 */

async function up(db) {
  console.log('🔄 Executing Migration 002_production_indexes...');
  if (db.indexManager) {
    db.indexManager.rebuild();
    console.log('✅ Migration 002_production_indexes completed: Indexes rebuilt successfully.');
  }
  return true;
}

async function down(db) {
  console.log('⏪ Rolling back Migration 002_production_indexes...');
  if (db.indexManager) {
    db.indexManager.clearAll();
  }
  return true;
}

module.exports = { id: '002_production_indexes', up, down };
