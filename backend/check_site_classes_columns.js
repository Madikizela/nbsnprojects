const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkSiteClassesColumns() {
  try {
    console.log('🔍 Checking SiteClasses table columns...\n');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'SiteClasses'
      ORDER BY ordinal_position
    `);
    
    console.log('📚 SiteClasses columns:');
    result.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check existing data
    const dataResult = await pool.query('SELECT * FROM "SiteClasses" LIMIT 5');
    console.log(`\n📚 Sample SiteClasses data (${dataResult.rows.length} rows):`);
    dataResult.rows.forEach((row, index) => {
      console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
    });
    
  } catch (error) {
    console.error('❌ Error checking SiteClasses columns:', error);
  } finally {
    await pool.end();
  }
}

checkSiteClassesColumns();