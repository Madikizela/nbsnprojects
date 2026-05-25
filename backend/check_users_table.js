const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkUsersTable() {
  try {
    await client.connect();
    console.log('Connected to database\n');

    // Get table structure
    console.log('=== Users Table Structure ===');
    const structure = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Users'
      ORDER BY ordinal_position
    `);
    console.table(structure.rows);

    // Get all users
    console.log('\n=== All Users ===');
    const users = await client.query(`SELECT * FROM "Users" LIMIT 5`);
    console.table(users.rows);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkUsersTable();
