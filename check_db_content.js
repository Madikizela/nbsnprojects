const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5433,
  database: 'rlms',
  user: 'postgres',
  password: '12345',
});

async function checkUsers() {
  try {
    await client.connect();
    console.log('Connected to database');

    const adminRes = await client.query('SELECT "Email", "Status", "PasswordHash" FROM "SystemAdmins"');
    console.log('\n--- SystemAdmins ---');
    adminRes.rows.forEach(row => {
      console.log(`Email: ${row.Email}, Status: ${row.Status}, Hash: ${row.PasswordHash.substring(0, 10)}...`);
    });

    const userRes = await client.query('SELECT "Email", "Status", "PasswordHash" FROM "Users"');
    console.log('\n--- Users ---');
    userRes.rows.forEach(row => {
      console.log(`Email: ${row.Email}, Status: ${row.Status}, Hash: ${row.PasswordHash.substring(0, 10)}...`);
    });

    await client.end();
  } catch (err) {
    console.error('Database connection error:', err.stack);
  }
}

checkUsers();
