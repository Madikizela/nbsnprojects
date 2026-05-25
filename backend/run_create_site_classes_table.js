const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function createSiteClassesTable() {
  try {
    await client.connect();
    
    const sql = fs.readFileSync('create_site_classes_table.sql', 'utf8');
    await client.query(sql);
    
    console.log('✅ SiteClasses table created successfully!');
    
    // Show table structure
    const structure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'SiteClasses'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Table structure:');
    structure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

createSiteClassesTable();
