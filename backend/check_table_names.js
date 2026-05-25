const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('skills_development.db');

console.log('Checking actual table names:');
db.all("SELECT name FROM sqlite_master WHERE type='table' AND (name LIKE '%occupational%' OR name LIKE '%legacy%')", (err, rows) => {
    if (err) {
        console.error(err);
    } else {
        rows.forEach(row => console.log('- ' + row.name));
    }
    
    console.log('\nAll tables with unit_standard in name:');
    db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%unit_standard%'", (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            rows.forEach(row => console.log('- ' + row.name));
        }
        db.close();
    });
});