const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'Departments' 
      ORDER BY ordinal_position;
    `);
    console.log('Current Departments table structure:');
    console.table(result.rows);
    
    // Also check if table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Departments'
      );
    `);
    console.log('Table exists:', tableExists.rows[0].exists);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();