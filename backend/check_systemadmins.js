const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('skills_development.db');

console.log('=== SystemAdmins Table Structure ===');
db.all("PRAGMA table_info(SystemAdmins)", (err, rows) => {
  if (err) {
    console.error('Error getting table info:', err);
  } else {
    console.log('Columns:');
    rows.forEach(row => {
      console.log(`- ${row.name} (${row.type}) - ${row.notnull ? 'NOT NULL' : 'NULL'}`);
    });
  }
  
  console.log('\n=== SystemAdmins Data ===');
  db.all("SELECT * FROM SystemAdmins", (err, rows) => {
    if (err) {
      console.error('Error querying SystemAdmins:', err);
    } else {
      console.log('Records found:', rows.length);
      rows.forEach(row => {
        console.log('Row:', JSON.stringify(row, null, 2));
      });
    }
    db.close();
  });
});