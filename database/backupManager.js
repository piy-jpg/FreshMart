/**
 * FreshMart Database Backup Manager
 * Handles automated snapshots, backups, and point-in-time recovery.
 */

const fs = require('fs');
const path = require('path');

class BackupManager {
  constructor(db, backupDir = null) {
    this.db = db;
    this.backupDir = backupDir || path.join(__dirname, 'backups');
    this.maxBackups = 15;
  }

  ensureDir() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }
    } catch (e) {}
  }

  /**
   * Create an automated timestamped backup snapshot of the database
   */
  createBackup(tag = 'auto') {
    try {
      this.ensureDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${tag}_${timestamp}.json`;
      const targetPath = path.join(this.backupDir, filename);

      const snapshot = {
        version: '2.0.0',
        createdAt: new Date().toISOString(),
        tag,
        counts: Object.keys(this.db.data || {}).reduce((acc, k) => {
          acc[k] = Array.isArray(this.db.data[k]) ? this.db.data[k].length : 1;
          return acc;
        }, {}),
        data: this.db.data
      };

      fs.writeFileSync(targetPath, JSON.stringify(snapshot, null, 2), 'utf8');
      this.rotateBackups();
      return { success: true, file: filename, path: targetPath };
    } catch (err) {
      console.error('Backup creation failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Keep only the latest N backups to conserve storage
   */
  rotateBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) return;
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('backup_') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f),
          time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > this.maxBackups) {
        const toDelete = files.slice(this.maxBackups);
        for (const file of toDelete) {
          try { fs.unlinkSync(file.path); } catch (e) {}
        }
      }
    } catch (e) {}
  }

  /**
   * Restore database state from a backup file
   */
  restore(backupPath) {
    try {
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file does not exist');
      }
      const raw = fs.readFileSync(backupPath, 'utf8');
      const parsed = JSON.parse(raw);
      const dataToRestore = parsed.data || parsed;
      this.db.data = dataToRestore;
      this.db.save();
      if (this.db.indexManager) {
        this.db.indexManager.rebuild();
      }
      return { success: true, message: 'Database successfully restored from backup' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  listBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) return [];
      return fs.readdirSync(this.backupDir)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          const p = path.join(this.backupDir, f);
          const stat = fs.statSync(p);
          return {
            filename: f,
            path: p,
            sizeBytes: stat.size,
            createdAt: stat.mtime
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
      return [];
    }
  }
}

module.exports = BackupManager;
