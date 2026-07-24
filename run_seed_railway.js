/**
 * Seeds qualifications and unit standards into Railway PostgreSQL.
 * Usage:
 *   $env:DATABASE_URL="postgresql://postgres:PASS@HOST:PORT/railway"
 *   node run_seed_railway.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set DATABASE_URL first.');
  process.exit(1);
}

async function runBatch(client, statements, label) {
  console.log(`Running ${statements.length} ${label}...`);
  let done = 0, skipped = 0;
  for (const stmt of statements) {
    if (!stmt.trim()) continue;
    try {
      await client.query(stmt);
      done++;
      if (done % 1000 === 0) console.log(`  ${done}/${statements.length}...`);
    } catch (e) {
      skipped++;
    }
  }
  console.log(`  ✅ ${done} inserted, ${skipped} skipped`);
}

async function main() {
  console.log('Connecting...');
  const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('✅ Connected!\n');

  // Step 1: Drop the FK constraint temporarily so we can insert freely
  console.log('Dropping FK constraint temporarily...');
  try {
    await client.query('ALTER TABLE legacy_unit_standards DROP CONSTRAINT IF EXISTS "FK_legacy_unit_standards_legacy_qualifications_qualification_id"');
    console.log('✅ FK constraint dropped\n');
  } catch(e) {
    console.log('Note:', e.message);
  }

  // Step 2: Clear tables
  console.log('Clearing tables...');
  await client.query('DELETE FROM legacy_unit_standards');
  await client.query('DELETE FROM legacy_qualifications');
  console.log('✅ Tables cleared\n');

  // Step 3: Read SQL file
  const sql = fs.readFileSync(path.join(__dirname, 'backend', 'seed_railway_qualifications.sql'), 'utf8');
  const allLines = sql.split('\n').filter(l => l.trim() && !l.trim().startsWith('--'));

  const qualInserts = allLines
    .filter(l => l.includes('INSERT INTO legacy_qualifications'))
    .map(l => l.replace(/ON CONFLICT.*?;/, ';'));

  const usInserts = allLines
    .filter(l => l.includes('INSERT INTO legacy_unit_standards'))
    .map(l => l.replace(/ON CONFLICT.*?;/, ';'));

  // Step 4: Seed qualifications
  await runBatch(client, qualInserts, 'qualifications');

  // Step 5: Seed unit standards
  await runBatch(client, usInserts, 'unit standards');

  // Step 6: Reset sequences
  await client.query("SELECT setval('legacy_qualifications_id_seq', (SELECT MAX(id) FROM legacy_qualifications))");
  await client.query("SELECT setval('legacy_unit_standards_id_seq', (SELECT MAX(id) FROM legacy_unit_standards))");

  // Step 7: Verify
  const result = await client.query(`
    SELECT 
      (SELECT COUNT(*) FROM legacy_qualifications) as quals,
      (SELECT COUNT(*) FROM legacy_unit_standards) as us
  `);
  console.log(`\n✅ Final: ${result.rows[0].quals} qualifications, ${result.rows[0].us} unit standards`);
  console.log('🎉 Done!');

  await client.end();
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
