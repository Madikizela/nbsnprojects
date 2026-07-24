/**
 * Seeds qualifications and unit standards into Railway PostgreSQL.
 * 
 * Usage:
 *   1. Set DATABASE_URL environment variable to your Railway PostgreSQL URL
 *      (found in Railway → Postgres → Connect → External Connection URL)
 *   2. Run: node run_seed_railway.js
 * 
 * Or pass it directly:
 *   $env:DATABASE_URL="postgresql://postgres:PASS@HOST:PORT/railway"; node run_seed_railway.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required.');
  console.error('   Set it to your Railway PostgreSQL connection URL.');
  console.error('   Example: $env:DATABASE_URL="postgresql://postgres:PASS@HOST:PORT/railway"; node run_seed_railway.js');
  process.exit(1);
}

async function main() {
  console.log('Connecting to Railway database...');
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✅ Connected!');

  // Check current counts
  const beforeQuals = await client.query('SELECT COUNT(*) FROM legacy_qualifications');
  const beforeUS    = await client.query('SELECT COUNT(*) FROM legacy_unit_standards');
  console.log(`Before: ${beforeQuals.rows[0].count} qualifications, ${beforeUS.rows[0].count} unit standards`);

  // Read and execute the seed SQL
  const sqlFile = path.join(__dirname, 'backend', 'seed_railway_qualifications.sql');
  console.log(`Reading ${sqlFile}...`);
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('Executing seed SQL (this may take 30-60 seconds for 9000+ records)...');
  
  try {
    await client.query(sql);
    console.log('✅ Seed SQL executed successfully!');
  } catch (err) {
    console.error('❌ SQL execution error:', err.message);
    await client.end();
    process.exit(1);
  }

  // Check counts after
  const afterQuals = await client.query('SELECT COUNT(*) FROM legacy_qualifications');
  const afterUS    = await client.query('SELECT COUNT(*) FROM legacy_unit_standards');
  console.log(`After:  ${afterQuals.rows[0].count} qualifications, ${afterUS.rows[0].count} unit standards`);
  console.log('🎉 Done! Qualifications and unit standards are now in Railway.');

  await client.end();
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
