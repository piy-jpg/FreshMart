/**
 * FreshMart Production Database Engine Singleton Connection
 * Manages the single source of truth connection lifecycle, migrations, indexes, and backups.
 */

const dbInstance = require('../database.js');
const IndexManager = require('./indexes/indexManager');
const BackupManager = require('./backupManager');
const MigrationManager = require('./migrations/migrationManager');

// Attach production subsystem managers to singleton
if (!dbInstance.indexManager) {
  dbInstance.indexManager = new IndexManager(dbInstance);
  dbInstance.indexManager.rebuild();
}

if (!dbInstance.backupManager) {
  dbInstance.backupManager = new BackupManager(dbInstance);
}

if (!dbInstance.migrationManager) {
  dbInstance.migrationManager = new MigrationManager(dbInstance);
  // Auto-run schema migrations asynchronously on connection startup
  dbInstance.migrationManager.runPendingMigrations().catch(err => {
    console.warn('Non-fatal migration check warning:', err.message);
  });
}

module.exports = {
  db: dbInstance,
  getDb: () => dbInstance,
  IndexManager,
  BackupManager,
  MigrationManager
};
