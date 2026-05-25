const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('skills_development.db');

console.log('Examining SQLite database...');

db.serialize(() => {
    // Get all tables
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
        if (err) {
            console.error('Error getting tables:', err);
            return;
        }
        
        console.log('Tables found:', tables.map(t => t.name));
        
        let completed = 0;
        const totalTables = tables.length;
        
        tables.forEach(table => {
            db.all(`SELECT COUNT(*) as count FROM ${table.name}`, (err, result) => {
                if (err) {
                    console.error(`Error counting ${table.name}:`, err);
                } else {
                    console.log(`${table.name}: ${result[0].count} records`);
                }
                
                completed++;
                if (completed === totalTables) {
                    // Show sample data from key tables
                    console.log('\n--- Sample Data ---');
                    
                    db.all("SELECT * FROM SystemAdmins", (err, admins) => {
                        if (!err && admins.length > 0) {
                            console.log('SystemAdmins sample:', admins[0]);
                        }
                        
                        db.all("SELECT * FROM Users", (err, users) => {
                            if (!err && users.length > 0) {
                                console.log('Users sample:', users[0]);
                            }
                            
                            db.close();
                        });
                    });
                }
            });
        });
    });
});