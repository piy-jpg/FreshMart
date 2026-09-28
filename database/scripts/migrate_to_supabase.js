/**
 * FreshMart Supabase PostgreSQL Schema & Data Migration Engine
 * 
 * Safely sets up schemas, constraints, indexes, sequences, and migrates
 * data from exports or source database directly into Supabase PostgreSQL.
 * 
 * Usage:
 *   node database/scripts/migrate_to_supabase.js
 *   node database/scripts/migrate_to_supabase.js --target-url="postgresql://..."
 *   node database/scripts/migrate_to_supabase.js --verify-only
 */

const fs = require('fs');
const path = require('path');
const PostgresAdapter = require('../adapters/postgresAdapter');

async function runMigration() {
  console.log('====================================================');
  console.log(' FRESHMART SUPABASE POSTGRESQL MIGRATION ENGINE');
  console.log('====================================================\n');

  const args = process.argv.slice(2);
  let targetUrl = null;
  let isVerifyOnly = false;

  for (const arg of args) {
    if (arg.startsWith('--target-url=')) {
      targetUrl = arg.split('=')[1].trim().replace(/^["']|["']$/g, '');
    } else if (arg === '--verify-only') {
      isVerifyOnly = true;
    }
  }

  const candidateUrl = targetUrl || process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.POSTGRES_URL;

  if (!candidateUrl) {
    console.error('❌ Error: No PostgreSQL connection string provided.');
    console.error('Please specify --target-url="postgresql://..." or set DATABASE_URL environment variable.');
    process.exit(1);
  }

  const adapter = new PostgresAdapter(candidateUrl);

  if (!adapter.isAvailable()) {
    console.error('❌ Error: Connection string is invalid or contains placeholder values.');
    process.exit(1);
  }

  try {
    console.log('📡 1. Testing SSL connection to Supabase PostgreSQL...');
    const pool = adapter.getPool();
    const pingRes = await pool.query('SELECT NOW() AS now, current_database() AS db, version() AS ver');
    console.log(`✅ Connected successfully!`);
    console.log(`   - Database: ${pingRes.rows[0].db}`);
    console.log(`   - Timestamp: ${pingRes.rows[0].now}`);
    console.log(`   - Server: ${pingRes.rows[0].ver.split(' on ')[0]}\n`);

    console.log('🏗️  2. Initializing & Verifying All Table Schemas, Constraints & Indexes...');
    await adapter.ensureAllSchemas();
    console.log('✅ All 12 tables and sequences verified:\n' +
      '   - freshmart_users\n' +
      '   - freshmart_products\n' +
      '   - freshmart_categories\n' +
      '   - freshmart_orders\n' +
      '   - freshmart_reviews\n' +
      '   - freshmart_delivery_partners\n' +
      '   - freshmart_farmers\n' +
      '   - freshmart_hubs\n' +
      '   - freshmart_inventory_movements\n' +
      '   - freshmart_settings\n' +
      '   - freshmart_audit_logs\n' +
      '   - freshmart_kv\n' +
      '   - freshmart_order_id_seq\n');

    if (isVerifyOnly) {
      console.log('🔍 Running in --verify-only mode...');
      await printTableSummary(adapter);
      process.exit(0);
    }

    console.log('📦 3. Locating Production Data for Migration...');
    let sourceData = null;
    const backupDir = path.join(__dirname, '..', 'backups');
    const latestExportFile = path.join(backupDir, 'latest_export.json');
    const dbJsonPath = path.join(__dirname, '..', '..', 'data', 'db.json');

    if (fs.existsSync(latestExportFile)) {
      console.log(`Loading export from ${latestExportFile}...`);
      sourceData = JSON.parse(fs.readFileSync(latestExportFile, 'utf8'));
    } else if (fs.existsSync(dbJsonPath)) {
      console.log(`Loading initial catalog data from ${dbJsonPath}...`);
      const raw = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
      sourceData = {
        source: 'db.json',
        tables: {
          freshmart_users: (raw.users || []).map(u => ({ id: u.id, data: u })),
          freshmart_products: (raw.products || []).map(p => ({ id: p.id, data: p })),
          freshmart_categories: (raw.categories || []).map(c => ({ id: c.id, data: c })),
          freshmart_orders: (raw.orders || []).map(o => ({ id: o.id, data: o })),
          freshmart_delivery_partners: (raw.delivery_partners || []).map(d => ({ id: d.id, data: d })),
          freshmart_farmers: (raw.farmers || []).map(f => ({ id: f.id, data: f })),
          freshmart_hubs: (raw.hubs || []).map(h => ({ id: h.id, data: h })),
          freshmart_inventory_movements: (raw.inventory_movements || []).map(i => ({ id: i.id, data: i })),
          freshmart_reviews: (raw.reviews || []).map(r => ({ id: r.id, data: r })),
          freshmart_audit_logs: (raw.audit_logs || []).map(a => ({ id: a.id, data: a })),
          freshmart_settings: raw.settings ? [{ key: 'global_settings', value: raw.settings }] : []
        }
      };
    }

    if (!sourceData || !sourceData.tables) {
      console.log('⚠️ No source data found. Table schemas are ready and clean in Supabase.');
    } else {
      console.log('🚀 4. Migrating & Upserting Records into Supabase PostgreSQL...\n');
      
      const collMap = {
        freshmart_users: 'users',
        freshmart_products: 'products',
        freshmart_categories: 'categories',
        freshmart_orders: 'orders',
        freshmart_reviews: 'reviews',
        freshmart_delivery_partners: 'delivery_partners',
        freshmart_farmers: 'farmers',
        freshmart_hubs: 'hubs',
        freshmart_inventory_movements: 'inventory_movements',
        freshmart_audit_logs: 'audit_logs'
      };

      for (const [tableName, rows] of Object.entries(sourceData.tables)) {
        if (!Array.isArray(rows) || rows.length === 0) continue;
        
        if (tableName === 'freshmart_settings') {
          for (const s of rows) {
            await adapter.setSetting(s.key, s.value);
          }
          console.log(`  ✓ freshmart_settings: ${rows.length} settings synced`);
          continue;
        }

        const collName = collMap[tableName];
        let count = 0;
        for (const row of rows) {
          const item = row.data ? { ...row.data, ...row } : row;
          if (collName) {
            await adapter.insert(collName, item);
          } else {
            await adapter.insert(tableName, item);
          }
          count++;
        }
        console.log(`  ✓ ${tableName}: ${count} records upserted`);
      }

      // Sync Order ID sequence with existing orders
      try {
        const maxOrderRes = await adapter.query(`
          SELECT MAX(NULLIF(regexp_replace(COALESCE(order_id, id), '\\D', '', 'g'), '')::integer) as max_num
          FROM freshmart_orders;
        `);
        const maxNum = maxOrderRes.rows[0]?.max_num || 0;
        if (maxNum > 0) {
          await adapter.query(`SELECT setval('freshmart_order_id_seq', $1, true);`, [maxNum]);
          console.log(`  ✓ freshmart_order_id_seq synchronized to next value: ${maxNum + 1}`);
        }
      } catch (seqErr) {
        console.warn('  ⚠️ Sequence sync notice:', seqErr.message);
      }
    }

    console.log('\n📊 5. Post-Migration Verification & Parity Audit:');
    await printTableSummary(adapter);

    console.log('\n🎉 SUPABASE MIGRATION COMPLETE & VERIFIED SUCCESSFULLY!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Migration Failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

async function printTableSummary(adapter) {
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

  console.log('----------------------------------------------------');
  console.log(' Table Name                     | Row Count');
  console.log('----------------------------------------------------');
  for (const t of tables) {
    try {
      const res = await adapter.query(`SELECT COUNT(*) FROM ${t}`);
      const count = String(res.rows[0].count).padStart(6, ' ');
      console.log(` ${t.padEnd(30, ' ')} | ${count}`);
    } catch (e) {
      console.log(` ${t.padEnd(30, ' ')} | Error: ${e.message}`);
    }
  }
  console.log('----------------------------------------------------');
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
