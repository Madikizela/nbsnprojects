const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

(async () => {
  try {
    await client.connect();
    console.log('\n=== SYSTEM ADMINS ===');
    const admins = await client.query('SELECT "Email", "PasswordHash", "Status" FROM "SystemAdmins"');
    console.log(admins.rows.length ? JSON.stringify(admins.rows, null, 2) : 'No admins found');
    
    console.log('\n=== USERS ===');
    const users = await client.query('SELECT "Email", "PasswordHash", "Status", "Role" FROM "Users" LIMIT 10');
    console.log(users.rows.length ? JSON.stringify(users.rows, null, 2) : 'No users found');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
})();
