const { Pool } = require('pg');

// First connect to default postgres database to check what databases exist
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres', // Connect to default postgres database
  password: 'postgres',
  port: 5433,
});

async function checkDatabases() {
  try {
    console.log('Connecting to PostgreSQL...');
    
    // List all databases
    const databases = await pool.query(`
      SELECT datname FROM pg_database 
      WHERE datistemplate = false;
    `);
    
    console.log('\n=== Available Databases ===');
    databases.rows.forEach((row, index) => {
      console.log(`${index + 1}: ${row.datname}`);
    });
    
    // Check if RLMS database exists
    const rlmsExists = databases.rows.some(row => row.datname === 'RLMS');
    console.log(`\nRLMS database exists: ${rlmsExists}`);
    
    if (!rlmsExists) {
      console.log('\nCreating RLMS database...');
      await pool.query('CREATE DATABASE "RLMS";');
      console.log('RLMS database created successfully!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkDatabases();