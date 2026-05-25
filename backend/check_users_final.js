const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:12345@localhost:5432/rlms"
});

async function checkUsers() {
  try {
    await client.connect();
    const res = await client.query('SELECT "Email", "FirstName", "LastName", "Role" FROM "Users"');
    console.log('--- Users in Database ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

checkUsers();
