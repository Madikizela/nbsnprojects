const sqlite3 = require('sqlite3').verbose();

function migrateLegacyData() {
    const dbPath = 'skills_development.db';
    
    console.log('Migrating legacy unit standards data to correct table...');
    
    try {
        const db = new sqlite3.Database(dbPath);
        
        // First, let's check if we need to migrate data
        db.get("SELECT COUNT(*) as count FROM LegacyUnitStandard", (err, row) => {
            if (err) {
                console.error('Error counting LegacyUnitStandard records:', err);
                return;
            }
            
            const legacyCount = row.count;
            console.log(`Found ${legacyCount} records in LegacyUnitStandard table`);
            
            // Check existing records in legacy_unit_standards
            db.get("SELECT COUNT(*) as count FROM legacy_unit_standards", (err, row) => {
                if (err) {
                    console.error('Error counting legacy_unit_standards records:', err);
                    return;
                }
                
                const underscoreCount = row.count;
                console.log(`Found ${underscoreCount} records in legacy_unit_standards table`);
                
                if (underscoreCount === 0 && legacyCount > 0) {
                    console.log('Migrating data from LegacyUnitStandard to legacy_unit_standards...');
                    
                    // Copy data from camelCase table to underscore table
                    const migrateSQL = `
                        INSERT INTO legacy_unit_standards (id, unitstandard_id, qualification_id, unit_standard_name, level, credits, synced)
                        SELECT id, unitStandardId, qualificationId, unitStandardName, level, credits, synced
                        FROM LegacyUnitStandard
                    `;
                    
                    db.exec(migrateSQL, (err) => {
                        if (err) {
                            console.error('Error migrating data:', err);
                        } else {
                            console.log('Data migration completed successfully!');
                            
                            // Verify the migration
                            db.get("SELECT COUNT(*) as count FROM legacy_unit_standards", (err, row) => {
                                if (err) {
                                    console.error('Error verifying migration:', err);
                                } else {
                                    console.log(`Now ${row.count} records in legacy_unit_standards table`);
                                }
                                
                                db.close();
                            });
                        }
                    });
                } else {
                    console.log('No migration needed.');
                    db.close();
                }
            });
        });
        
    } catch (error) {
        console.error('Error migrating data:', error);
    }
}

migrateLegacyData();