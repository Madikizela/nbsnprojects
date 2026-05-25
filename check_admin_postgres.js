const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345',
  port: 5432
});

async function checkAdmin() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');
    console.log('');
    
    // Check SystemAdmins table
    const adminResult = await client.query('SELECT "Id", "Email", "FirstName", "LastName", "Status", "CreatedAt" FROM "SystemAdmins"');
    
    console.log('SystemAdmins Table:');
    console.log('==================');
    if (adminResult.rows.length === 0) {
      console.log('❌ No admin accounts found!');
    } else {
      console.table(adminResult.rows);
    }
    
    console.log('');
    
    // Check Users table
    const userResult = await client.query('SELECT "Id", "Email", "FirstName", "LastName", "Role", "Status" FROM "Users" LIMIT 5');
    
    console.log('Users Table (first 5):');
    console.log('======================');
    if (userResult.rows.length === 0) {
      console.log('No users found');
    } else {
      console.table(userResult.rows);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkAdmin();
