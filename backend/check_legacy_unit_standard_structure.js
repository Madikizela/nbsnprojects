const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkLegacyUnitStandardStructure() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'LegacyUnitStandard'
      ORDER BY ordinal_position
    `);
    
    console.log('LegacyUnitStandard table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
    // Also check a sample row
    const sampleResult = await pool.query('SELECT * FROM "LegacyUnitStandard" LIMIT 3');
    console.log('\nSample data:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`  Row ${index + 1}:`, row);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkLegacyUnitStandardStructure();