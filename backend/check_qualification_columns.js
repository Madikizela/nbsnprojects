const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkQualificationColumns() {
  try {
    console.log('🔍 Checking qualification table columns...\n');
    
    // Check occupational_qualifications columns
    console.log('📚 occupational_qualifications columns:');
    const occResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'occupational_qualifications'
      ORDER BY ordinal_position
    `);
    occResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Check legacy_qualifications columns
    console.log('\n📚 legacy_qualifications columns:');
    const legacyResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'legacy_qualifications'
      ORDER BY ordinal_position
    `);
    legacyResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Sample data from each table
    console.log('\n📚 Sample occupational_qualifications data:');
    const occSample = await pool.query('SELECT * FROM occupational_qualifications LIMIT 1');
    if (occSample.rows.length > 0) {
      console.log(JSON.stringify(occSample.rows[0], null, 2));
    }
    
    console.log('\n📚 Sample legacy_qualifications data:');
    const legacySample = await pool.query('SELECT * FROM legacy_qualifications LIMIT 1');
    if (legacySample.rows.length > 0) {
      console.log(JSON.stringify(legacySample.rows[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error checking qualification columns:', error);
  } finally {
    await pool.end();
  }
}

checkQualificationColumns();