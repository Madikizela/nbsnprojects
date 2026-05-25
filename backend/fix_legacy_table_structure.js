const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('skills_development.db');

console.log('Adding missing columns to legacy_unit_standards to match controller expectations...');

db.serialize(() => {
    // Add missing columns to legacy_unit_standards
    console.log('Adding module_code and module_type columns to legacy_unit_standards...');
    
    db.run("ALTER TABLE legacy_unit_standards ADD COLUMN module_code TEXT;", (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding module_code:', err);
        } else {
            console.log('module_code column added or already exists');
        }
    });
    
    db.run("ALTER TABLE legacy_unit_standards ADD COLUMN module_type TEXT;", (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding module_type:', err);
        } else {
            console.log('module_type column added or already exists');
        }
    });
    
    // Wait a bit for the schema changes to complete
    setTimeout(() => {
        // Populate the new columns with default values
        console.log('Populating new columns with default values...');
        
        db.run(`
            UPDATE legacy_unit_standards 
            SET module_code = 'LEGACY-' || unitstandard_id,
                module_type = 'Legacy'
            WHERE module_code IS NULL OR module_type IS NULL
        `, function(err) {
            if (err) {
                console.error('Error updating data:', err);
            } else {
                console.log(`Updated ${this.changes} records with module_code and module_type`);
            }
            
            // Verify the changes
            console.log('\nVerifying updated legacy_unit_standards structure:');
            db.all("PRAGMA table_info(legacy_unit_standards)", (err, rows) => {
                if (err) {
                    console.error('Error checking structure:', err);
                } else {
                    rows.forEach(row => {
                        console.log(`- ${row.name}: ${row.type}`);
                    });
                }
                
                // Test the updated data
                console.log('\nTesting updated legacy data with qualification_id = 1660:');
                db.all(`
                    SELECT 
                        id,
                        unitstandard_id,
                        qualification_id,
                        unit_standard_name,
                        level,
                        credits,
                        module_code,
                        module_type
                    FROM legacy_unit_standards 
                    WHERE qualification_id = '1660'
                    LIMIT 1
                `, (err, rows) => {
                    if (err) {
                        console.error('Error testing data:', err);
                    } else {
                        console.log(`Found ${rows.length} records`);
                        if (rows.length > 0) {
                            console.log('Sample record:', JSON.stringify(rows[0], null, 2));
                        }
                    }
                    
                    db.close();
                    console.log('\nLegacy table structure fix completed!');
                });
            });
        });
    }, 1000);
});

db.on('error', (err) => {
    console.error('Database error:', err);
    db.close();
});