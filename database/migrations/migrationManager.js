/**
 * FreshMart Database Migration Manager
 * Automates schema upgrades, index creation, and data integrity validations.
 */

const fs = require('fs');
const path = require('path');

class MigrationManager {
  constructor(db) {
    this.db = db;
    this.migrationsDir = __dirname;
  }

  async runPendingMigrations() {
    try {
      if (!this.db.data) this.db.data = {};
      if (!this.db.data.applied_migrations) {
        this.db.data.applied_migrations = [];
      }

      const applied = new Set(this.db.data.applied_migrations);
      const files = fs.readdirSync(this.migrationsDir)
        .filter(f => f.match(/^\d+.*\.js$/) && f !== 'migrationManager.js')
        .sort();

      for (const file of files) {
        const migration = require(path.join(this.migrationsDir, file));
        const migId = migration.id || file.replace(/\.js$/, '');

        if (!applied.has(migId)) {
          console.log(`Applying migration: ${migId}...`);
          await migration.up(this.db);
          this.db.data.applied_migrations.push(migId);
          applied.add(migId);
          this.db.save();
        }
      }

      return { success: true, totalApplied: this.db.data.applied_migrations.length };
    } catch (err) {
      console.error('Migration execution error:', err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = MigrationManager;

if (require.main === module) {
  const { db } = require('../connection');
  const mm = new MigrationManager(db);
  mm.runPendingMigrations().then(res => {
    console.log('Migrations result:', res);
  });
}
