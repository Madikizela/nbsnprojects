const sqlite3 = require('sqlite3').verbose();

function populateOccupationalData() {
    const dbPath = 'skills_development.db';
    
    console.log('Populating occupational_unit_standards with data from legacy_unit_standards...');
    
    try {
        const db = new sqlite3.Database(dbPath);
        
        // First, check what data we have in legacy_unit_standards
        db.all('SELECT COUNT(*) as count FROM legacy_unit_standards', (err, result) => {
            if (err) {
                console.error('Error counting legacy data:', err);
                db.close();
                return;
            }
            
            console.log(`Found ${result[0].count} records in legacy_unit_standards`);
            
            // Get some sample data to understand the structure
            db.all('SELECT * FROM legacy_unit_standards LIMIT 3', (err, sampleRows) => {
                if (err) {
                    console.error('Error getting sample data:', err);
                    db.close();
                    return;
                }
                
                console.log('Sample legacy data:');
                sampleRows.forEach(row => {
                    console.log('-', JSON.stringify(row));
                });
                
                // Now populate occupational_unit_standards with this data
                console.log('\nPopulating occupational_unit_standards...');
                
                const insertSQL = `
                    INSERT INTO occupational_unit_standards 
                    (qualification_id, module_code, unit_standard_name, module_type, level, credits)
                    SELECT 
                        qualification_id,
                        'MODULE-' || unitstandard_id,
                        unit_standard_name,
                        'Core',
                        level,
                        credits
                    FROM legacy_unit_standards
                    WHERE qualification_id IS NOT NULL
                `;
                
                db.exec(insertSQL, function(err) {
                    if (err) {
                        console.error('Error inserting data:', err);
                        db.close();
                        return;
                    }
                    
                    console.log('Data insertion completed!');
                    
                    // Verify the insertion
                    db.all('SELECT COUNT(*) as count FROM occupational_unit_standards', (err, result) => {
                        if (err) {
                            console.error('Error counting new data:', err);
                        } else {
                            console.log(`Now ${result[0].count} records in occupational_unit_standards`);
                            
                            // Show some sample data
                            db.all('SELECT * FROM occupational_unit_standards LIMIT 3', (err, newRows) => {
                                if (err) {
                                    console.error('Error getting new sample data:', err);
                                } else {
                                    console.log('\nSample occupational data:');
                                    newRows.forEach(row => {
                                        console.log('-', JSON.stringify(row));
                                    });
                                    
                                    // Test with a specific qualification_id
                                    db.all('SELECT COUNT(*) as count FROM occupational_unit_standards WHERE qualification_id = 1660', (err, testResult) => {
                                        if (err) {
                                            console.error('Error testing data:', err);
                                        } else {
                                            console.log(`\nRecords with qualification_id = 1660: ${testResult[0].count}`);
                                        }
                                        db.close();
                                    });
                                }
                            });
                        }
                    });
                });
            });
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

populateOccupationalData();