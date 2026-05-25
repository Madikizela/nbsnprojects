const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  user: 'postgres',
  password: 'postgres',
  port: 5433,
  database: 'postgres'
});

async function forceReset() {
  try {
    await client.connect();
    // Change password to 'admin'
    await client.query("ALTER USER postgres WITH PASSWORD 'admin';");
    console.log('✅ Password for user "postgres" on Port 5433 has been force-reset to "admin"');
  } catch (err) {
    console.error('❌ Error resetting password:', err.message);
  } finally {
    await client.end();
  }
}

forceReset();
