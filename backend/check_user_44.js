const mysql = require('mysql2/promise');

async function checkUsers() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'nbsnproject'
    });

    const [rows] = await connection.execute('SELECT Id, Email, FirstName, LastName FROM Users LIMIT 5');
    console.log('Users found:');
    console.table(rows);
    
    const [countRows] = await connection.execute('SELECT COUNT(*) as count FROM Users WHERE Id = 44');
    console.log(`User ID 44 exists: ${countRows[0].count > 0}`);
    
    await connection.end();
  } catch (err) {
    console.error('Error connecting to database:', err);
  }
}

checkUsers();
