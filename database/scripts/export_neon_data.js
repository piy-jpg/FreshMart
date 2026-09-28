/**
 * FreshMart Production Database Export Tool
 * Safely extracts and snapshots all data from existing database tables.
 * 
 * Usage:
 *   node database/scripts/export_neon_data.js  (Legacy snapshot tool)
 */

const fs = require('fs');
const path = require('path');
const PostgresAdapter = require('../adapters/postgresAdapter');

async function exportDatabase() {
  console.log('====================================================');
  console.log(' FRESHMART DATABASE EXPORT & BACKUP TOOL');
  console.log('====================================================');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const jsonOutputFile = path.join(backupDir, `database_export_${timestamp}.json`);
  const sqlOutputFile = path.join(backupDir, `database_export_${timestamp}.sql`);

  const tables = [
    'freshmart_users',
    'freshmart_products',
    'freshmart_categories',
    'freshmart_orders',
    'freshmart_reviews',
    'freshmart_delivery_partners',
    'freshmart_farmers',
    'freshmart_hubs',
    'freshmart_inventory_movements',
    'freshmart_settings',
    'freshmart_audit_logs',
    'freshmart_kv'
  ];

  const exportData = {
    exportedAt: new Date().toISOString(),
    source: 'PostgreSQL',
    tables: {}
  };

  let sqlStatements = `-- FreshMart PostgreSQL Database Dump\n-- Exported At: ${exportData.exportedAt}\n\n`;

  const adapter = new PostgresAdapter();

  if (adapter.isAvailable()) {
    console.log('Connecting to database via configured connection...');
    try {
      await adapter.init();
      console.log('✅ Connected to database. Querying tables...\n');

      for (const table of tables) {
        try {
          const res = await adapter.query(`SELECT * FROM ${table}`);
          exportData.tables[table] = res.rows;
          console.log(`- ${table}: ${res.rows.length} rows exported`);

          if (res.rows.length > 0) {
            sqlStatements += `-- Table: ${table}\n`;
            for (const row of res.rows) {
              const cols = Object.keys(row);
              const vals = Object.values(row).map(v => {
                if (v === null || v === undefined) return 'NULL';
                if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
                if (typeof v === 'number') return v;
                if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
                return `'${String(v).replace(/'/g, "''")}'`;
              });
              sqlStatements += `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
            }
            sqlStatements += '\n';
          }
        } catch (err) {
          console.warn(`⚠️ Warning querying ${table}:`, err.message);
          exportData.tables[table] = [];
        }
      }
    } catch (err) {
      console.error('❌ Failed to connect to live database:', err.message);
      console.log('Falling back to local data snapshot...');
      loadFromLocalSnapshot(exportData, tables);
    }
  } else {
    console.log('No live PostgreSQL connection available. Using local data snapshot...');
    loadFromLocalSnapshot(exportData, tables);
  }

  // Write JSON backup
  fs.writeFileSync(jsonOutputFile, JSON.stringify(exportData, null, 2), 'utf8');
  console.log(`\n💾 JSON export saved to: ${jsonOutputFile}`);

  // Write SQL backup
  fs.writeFileSync(sqlOutputFile, sqlStatements, 'utf8');
  console.log(`💾 SQL dump saved to: ${sqlOutputFile}`);

  // Create/update 'latest_export.json' for easy migration
  const latestJson = path.join(backupDir, 'latest_export.json');
  fs.writeFileSync(latestJson, JSON.stringify(exportData, null, 2), 'utf8');

  console.log('\n✅ Database Export Complete!');
  return exportData;
}

function loadFromLocalSnapshot(exportData, tables) {
  const dbJsonPath = path.join(__dirname, '..', '..', 'data', 'db.json');
  if (fs.existsSync(dbJsonPath)) {
    try {
      const localData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
      exportData.source = 'LocalDataSnapshot';
      const mapping = {
        freshmart_users: 'users',
        freshmart_products: 'products',
        freshmart_categories: 'categories',
        freshmart_orders: 'orders',
        freshmart_delivery_partners: 'delivery_partners',
        freshmart_farmers: 'farmers',
        freshmart_hubs: 'hubs',
        freshmart_inventory_movements: 'inventory_movements',
        freshmart_settings: 'settings',
        freshmart_audit_logs: 'audit_logs',
        freshmart_reviews: 'reviews'
      };

      for (const t of tables) {
        const collKey = mapping[t];
        if (collKey && localData[collKey]) {
          exportData.tables[t] = Array.isArray(localData[collKey]) 
            ? localData[collKey].map(item => ({ id: item.id, data: item }))
            : (t === 'freshmart_settings' ? [{ key: 'global_settings', value: localData[collKey] }] : []);
          console.log(`- ${t}: ${exportData.tables[t].length} records from local snapshot`);
        } else {
          exportData.tables[t] = [];
        }
      }
    } catch (e) {
      console.error('Error reading local db.json:', e.message);
    }
  }
}

if (require.main === module) {
  exportDatabase().catch(err => {
    console.error('Export Error:', err);
    process.exit(1);
  });
}

module.exports = { exportDatabase };
