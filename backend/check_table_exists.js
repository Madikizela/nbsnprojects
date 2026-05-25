const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('skills_development.db');

console.log('Checking if occupational_unit_standards table exists:');
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='occupational_unit_standards'", (err, row) => {
    if (err) {
        console.error(err);
    } else {
        console.log(row ? 'Table exists' : 'Table does not exist');
    }
    
    console.log('\nChecking if LegacyUnitStandard table exists:');
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='LegacyUnitStandard'", (err, row) => {
        if (err) {
            console.error(err);
        } else {
            console.log(row ? 'Table exists' : 'Table does not exist');
        }
        db.close();
    });
});