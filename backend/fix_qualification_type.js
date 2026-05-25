const sqlite3 = require('sqlite3').verbose();

function fixQualificationType() {
    const dbPath = 'skills_development.db';
    
    console.log('Checking occupational_unit_standards table structure...');
    
    try {
        const db = new sqlite3.Database(dbPath);
        
        // Check occupational_unit_standards table structure
        console.log('\nChecking occupational_unit_standards table structure:');
        db.all("PRAGMA table_info(occupational_unit_standards)", (err, rows) => {
            if (err) {
                console.error('Error getting table info:', err);
                db.close();
                return;
            }
            
            console.log('occupational_unit_standards columns:');
            rows.forEach(row => {
                console.log(`- ${row.name}: ${row.type}`);
            });
            
            // Check if qualification_id is varchar and needs to be converted
            const qualIdColumn = rows.find(row => row.name === 'qualification_id');
            if (qualIdColumn && qualIdColumn.type.toLowerCase().includes('varchar')) {
                console.log('\nFound qualification_id as varchar - converting to INTEGER...');
                
                // First, let's see what data we have
                db.all("SELECT DISTINCT qualification_id FROM occupational_unit_standards LIMIT 10", (err, dataRows) => {
                    if (err) {
                        console.error('Error checking data:', err);
                        db.close();
                        return;
                    }
                    
                    console.log('Sample qualification_id values:');
                    dataRows.forEach(row => {
                        console.log(`- '${row.qualification_id}'`);
                    });
                    
                    // Try to convert the column to INTEGER
                    console.log('\nAttempting to convert qualification_id to INTEGER...');
                    
                    // SQLite doesn't support direct ALTER COLUMN, so we need to recreate the table
                    const recreateTableSQL = `
                        BEGIN TRANSACTION;
                        
                        -- Create temporary table with INTEGER type
                        CREATE TABLE occupational_unit_standards_new (
                            id INTEGER PRIMARY KEY,
                            unit_standard_id INTEGER,
                            qualification_id INTEGER,
                            unit_standard_name TEXT,
                            level TEXT,
                            credits INTEGER,
                            saqa_id INTEGER,
                            registration_status TEXT,
                            field TEXT,
                            sub_field TEXT,
                            created_at TEXT,
                            updated_at TEXT
                        );
                        
                        -- Copy data with conversion
                        INSERT INTO occupational_unit_standards_new 
                        SELECT 
                            id,
                            unit_standard_id,
                            CAST(qualification_id AS INTEGER),
                            unit_standard_name,
                            level,
                            credits,
                            saqa_id,
                            registration_status,
                            field,
                            sub_field,
                            created_at,
                            updated_at
                        FROM occupational_unit_standards;
                        
                        -- Drop old table
                        DROP TABLE occupational_unit_standards;
                        
                        -- Rename new table
                        ALTER TABLE occupational_unit_standards_new RENAME TO occupational_unit_standards;
                        
                        COMMIT;
                    `;
                    
                    db.exec(recreateTableSQL, function(err) {
                        if (err) {
                            console.error('Error converting table:', err);
                            db.close();
                            return;
                        }
                        
                        console.log('Table conversion completed successfully!');
                        
                        // Verify the conversion
                        db.all("PRAGMA table_info(occupational_unit_standards)", (err, rows) => {
                            if (err) {
                                console.error('Error verifying table:', err);
                            } else {
                                console.log('\nUpdated occupational_unit_standards columns:');
                                rows.forEach(row => {
                                    console.log(`- ${row.name}: ${row.type}`);
                                });
                                
                                // Test the data
                                db.all("SELECT COUNT(*) as count FROM occupational_unit_standards WHERE qualification_id = 91761", (err, result) => {
                                    if (err) {
                                        console.error('Error testing data:', err);
                                    } else {
                                        console.log(`\nRecords with qualification_id = 91761: ${result[0].count}`);
                                    }
                                    db.close();
                                });
                            }
                        });
                    });
                });
            } else {
                console.log('qualification_id is already INTEGER or not found as varchar');
                db.close();
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

fixQualificationType();