const { Client } = require('pg');

async function activateAdmin() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rlms',
    user: 'postgres',
    password: '12345',
  });

  try {
    await client.connect();
    const email = 'admin@system.local';

    const before = await client.query(
      'SELECT "Email", "Status" FROM "SystemAdmins" WHERE lower("Email") = lower($1)',
      [email]
    );
    console.log('Before:', before.rows);

    await client.query(
      'UPDATE "SystemAdmins" SET "Status" = $1, "UpdatedAt" = NOW() WHERE lower("Email") = lower($2)',
      [1, email]
    );

    const after = await client.query(
      'SELECT "Email", "Status" FROM "SystemAdmins" WHERE lower("Email") = lower($1)',
      [email]
    );
    console.log('After:', after.rows);

    console.log('✅ Admin status set to Active (1)');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

activateAdmin();


