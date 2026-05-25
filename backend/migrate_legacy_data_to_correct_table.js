const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('skills_development.db');

console.log('Migrating data from LegacyUnitStandard to legacy_unit_standards...');

db.serialize(() => {
    // First, create the legacy_unit_standards table if it doesn't exist
    console.log('Creating legacy_unit_standards table...');
    db.run(`
        CREATE TABLE IF NOT EXISTS legacy_unit_standards (
            id INTEGER PRIMARY KEY,
            unitstandard_id INTEGER,
            qualification_id INTEGER,
            unit_standard_name TEXT,
            level TEXT,
            credits INTEGER,
            synced INTEGER,
            module_code TEXT,
            module_type TEXT
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err);
            return;
        }
        console.log('Table created successfully');
    });

    // Wait for table creation to complete
    setTimeout(() => {
        // Clear any existing data in legacy_unit_standards
        console.log('Clearing existing data from legacy_unit_standards...');
        db.run('DELETE FROM legacy_unit_standards', (err) => {
            if (err) {
                console.error('Error clearing data:', err);
                return;
            }
            console.log('Existing data cleared');
            
            // Copy data from LegacyUnitStandard to legacy_unit_standards
            console.log('Copying data from LegacyUnitStandard to legacy_unit_standards...');
            db.run(`
                INSERT INTO legacy_unit_standards 
                (id, unitstandard_id, qualification_id, unit_standard_name, level, credits, synced, module_code, module_type)
                SELECT 
                    id,
                    unitStandardId,
                    qualificationId,
                    unitStandardName,
                    level,
                    credits,
                    synced,
                    'LEGACY-' || unitStandardId,
                    'Legacy'
                FROM LegacyUnitStandard
            `, function(err) {
                if (err) {
                    console.error('Error copying data:', err);
                    return;
                }
                console.log(`Successfully copied ${this.changes} records`);
                
                // Verify the migration
                console.log('Verifying migration...');
                db.get('SELECT COUNT(*) as count FROM legacy_unit_standards', (err, row) => {
                    if (err) {
                        console.error('Error verifying:', err);
                    } else {
                        console.log(`legacy_unit_standards now has ${row.count} records`);
                        
                        // Test the specific qualification ID
                        db.get('SELECT COUNT(*) as count FROM legacy_unit_standards WHERE qualification_id = 1660', (err, row) => {
                            if (err) {
                                console.error('Error testing qualification 1660:', err);
                            } else {
                                console.log(`Records with qualification_id = 1660: ${row.count}`);
                            }
                            
                            db.close();
                            console.log('Migration completed!');
                        });
                    }
                });
            });
        });
    }, 1000);
});