const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkUser() {
  try {
    await client.connect();
    const res = await client.query('SELECT "Id", "FirstName", "LastName", "Role", "DepartmentId" FROM "Users" WHERE "FirstName" = $1', ['Nokwethemba']);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkUser();
