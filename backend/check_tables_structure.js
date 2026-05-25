const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkTables() {
  try {
    await client.connect();
    
    // Check Learners table
    console.log('\n=== Learners Table ===');
    const learnersRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Learners' 
      ORDER BY ordinal_position
      LIMIT 5
    `);
    learnersRes.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable})`));
    
    // Check for primary key
    const pkRes = await client.query(`
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = '"Learners"'::regclass AND i.indisprimary
    `);
    console.log('  Primary key:', pkRes.rows.map(r => r.attname).join(', ') || 'NONE');
    
    // Check SiteClasses table
    console.log('\n=== SiteClasses Table ===');
    const classesRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'SiteClasses' 
      ORDER BY ordinal_position
      LIMIT 10
    `);
    classesRes.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable})`));
    
    // Check Users table (for teachers)
    console.log('\n=== Users Table (first 5 columns) ===');
    const usersRes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Users' 
      ORDER BY ordinal_position
      LIMIT 5
    `);
    usersRes.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable})`));
    
    await client.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkTables();
