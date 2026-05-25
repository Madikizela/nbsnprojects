const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkExistingTables() {
  try {
    console.log('🔍 Checking existing tables in database...\n');
    
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`Found ${result.rows.length} tables:`);
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check for qualification-related tables
    console.log('\n🔍 Looking for qualification-related tables:');
    const qualificationTables = result.rows.filter(row => 
      row.table_name.toLowerCase().includes('qualification') ||
      row.table_name.toLowerCase().includes('unit') ||
      row.table_name.toLowerCase().includes('standard')
    );
    
    if (qualificationTables.length > 0) {
      console.log('Found qualification-related tables:');
      qualificationTables.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('❌ No qualification-related tables found');
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkExistingTables();