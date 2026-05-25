const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('skills_development.db');

// Check if SystemAdmins table exists
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name='SystemAdmins'", (err, rows) => {
    if (err) {
        console.error('Error checking table existence:', err);
        return;
    }
    
    console.log('SystemAdmins table exists:', rows.length > 0);
    
    if (rows.length > 0) {
        // Count records in SystemAdmins table
        db.all("SELECT COUNT(*) as count FROM SystemAdmins", (err, countRows) => {
            if (err) {
                console.error('Error counting SystemAdmins:', err.message);
            } else {
                console.log('SystemAdmins count:', countRows[0].count);
                
                // Show first few records
                db.all("SELECT Id, Email, Username FROM SystemAdmins LIMIT 3", (err, records) => {
                    if (err) {
                        console.error('Error fetching SystemAdmins:', err.message);
                    } else {
                        console.log('Sample SystemAdmins records:', records);
                    }
                    db.close();
                });
            }
        });
    } else {
        console.log('SystemAdmins table does not exist');
        db.close();
    }
});