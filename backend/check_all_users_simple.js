const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkUsers() {
  try {
    await client.connect();
    
    const result = await client.query(`
      SELECT "Id", "FirstName", "LastName", "Email", "Role", "Status"
      FROM "Users"
      ORDER BY "Id"
    `);

    console.log(`Found ${result.rows.length} users:\n`);
    result.rows.forEach(user => {
      console.log(`ID: ${user.Id} | ${user.FirstName} ${user.LastName} | ${user.Email} | Role: ${user.Role} | Status: ${user.Status}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsers();
