const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkTable() {
  try {
    await client.connect();
    
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'ClassEnrollments' 
      ORDER BY ordinal_position
    `);
    
    if (res.rows.length === 0) {
      console.log('❌ ClassEnrollments table does NOT exist');
    } else {
      console.log('✅ ClassEnrollments table exists:');
      res.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable})`));
    }
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTable();
