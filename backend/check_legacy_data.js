const sqlite3 = require('sqlite3').verbose();

function checkLegacyData() {
    const dbPath = 'skills_development.db';
    
    console.log('Checking legacy unit standards data...');
    
    try {
        const db = new sqlite3.Database(dbPath);
        
        // Check LegacyUnitStandard table
        db.get("SELECT COUNT(*) as count FROM LegacyUnitStandard", (err, row) => {
            if (err) {
                console.error('Error counting LegacyUnitStandard records:', err);
            } else {
                console.log(`Total LegacyUnitStandard records: ${row.count}`);
            }
            
            // Show sample records
            console.log('\nSample LegacyUnitStandard records:');
            db.all("SELECT id, unitStandardId, qualificationId, unitStandardName, level, credits FROM LegacyUnitStandard LIMIT 5", (err, rows) => {
                if (err) {
                    console.error('Error fetching samples:', err);
                } else {
                    rows.forEach(row => {
                        console.log(`ID: ${row.id}, UnitStandardID: ${row.unitStandardId}, QualificationID: ${row.qualificationId}, Name: ${row.unitStandardName ? row.unitStandardName.substring(0, 50) : 'N/A'}, Level: ${row.level}, Credits: ${row.credits}`);
                    });
                }
                
                // Check unique qualification IDs
                console.log('\nUnique Qualification IDs in LegacyUnitStandard:');
                db.all("SELECT DISTINCT qualificationId FROM LegacyUnitStandard WHERE qualificationId IS NOT NULL ORDER BY qualificationId LIMIT 10", (err, rows) => {
                    if (err) {
                        console.error('Error fetching qualification IDs:', err);
                    } else {
                        rows.forEach(row => {
                            console.log(`Qualification ID: ${row.qualificationId}`);
                        });
                    }
                    
                    db.close();
                });
            });
        });
        
    } catch (error) {
        console.error('Error checking data:', error);
    }
}

checkLegacyData();