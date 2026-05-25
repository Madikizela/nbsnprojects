const mysql = require('mysql2/promise');

async function dropAllTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'nbsnproject'
  });

  try {
    console.log('Fetching all tables...');
    const [rows] = await connection.query('SHOW TABLES');
    const tables = rows.map(row => Object.values(row)[0]);

    if (tables.length === 0) {
      console.log('No tables found.');
      return;
    }

    console.log('Disabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of tables) {
      console.log(`Dropping table: ${table}`);
      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
    }

    console.log('Enabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ All tables dropped successfully.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await connection.end();
  }
}

dropAllTables();
