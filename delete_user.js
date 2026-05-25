const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function deleteUser() {
  try {
    await client.connect();
    // Delete project assignments first
    await client.query('DELETE FROM "ProjectAssignments" WHERE "UserId" IN (SELECT "Id" FROM "Users" WHERE "Email" = $1)', ['nkwenkwezimaphango@gmail.com']);
    const res = await client.query('DELETE FROM "Users" WHERE "Email" = $1', ['nkwenkwezimaphango@gmail.com']);
    console.log(`Deleted ${res.rowCount} user(s).`);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

deleteUser();
