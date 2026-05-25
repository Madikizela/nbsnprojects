const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'RLMS',
  password: '12345',
  port: 5432,
});

async function checkAllTables() {
  try {
    console.log('Connecting to RLMS database...');
    
    // List all tables in the database
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('\n=== Available Tables in RLMS Database ===');
    if (tables.rows.length === 0) {
      console.log('No tables found in RLMS database');
    } else {
      tables.rows.forEach((row, index) => {
        console.log(`${index + 1}: ${row.table_name}`);
      });
    }
    
    // Check if SystemAdmins table exists
    const systemAdminsExists = tables.rows.some(row => row.table_name === 'SystemAdmins');
    console.log(`\nSystemAdmins table exists: ${systemAdminsExists}`);
    
    // Check if Users table exists
    const usersExists = tables.rows.some(row => row.table_name === 'Users');
    console.log(`Users table exists: ${usersExists}`);
    
    // If SystemAdmins table exists, check its data
    if (systemAdminsExists) {
      console.log('\n=== SystemAdmins Table Data ===');
      const systemAdminsData = await pool.query('SELECT * FROM "SystemAdmins";');
      console.log(`Records in SystemAdmins: ${systemAdminsData.rowCount}`);
      systemAdminsData.rows.forEach((row, index) => {
        console.log(`${index + 1}:`, row);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAllTables();