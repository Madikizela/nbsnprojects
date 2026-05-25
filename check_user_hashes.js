const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345',
  port: 5432
});

async function checkHashes() {
  try {
    await client.connect();
    const res = await client.query('SELECT "Email", "PasswordHash", "Status" FROM "Users"');
    console.table(res.rows.map(r => ({
      Email: r.Email,
      HashPrefix: r.PasswordHash ? r.PasswordHash.substring(0, 7) : 'NULL',
      Status: r.Status
    })));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkHashes();
