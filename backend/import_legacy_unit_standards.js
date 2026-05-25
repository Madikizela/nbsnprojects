const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

function importLegacyUnitStandards() {
    const dbPath = 'skills_development.db';
    const sqlFile = 'legacy_unit_standards_inserts.sql';
    
    console.log('Starting legacy unit standards import...');
    
    // Check if database exists
    if (!fs.existsSync(dbPath)) {
        console.error(`Error: Database ${dbPath} not found!`);
        return false;
    }
    
    // Check if SQL file exists
    if (!fs.existsSync(sqlFile)) {
        console.error(`Error: SQL file ${sqlFile} not found!`);
        return false;
    }
    
    try {
        // Connect to database
        const db = new sqlite3.Database(dbPath);
        
        // Create LegacyUnitStandard table if it doesn't exist
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS LegacyUnitStandard (
                id INTEGER PRIMARY KEY,
                unitStandardId INTEGER,
                qualificationId INTEGER,
                unitStandardName TEXT,
                level TEXT,
                credits INTEGER,
                synced INTEGER
            );
        `;
        
        console.log('Creating LegacyUnitStandard table if needed...');
        db.exec(createTableSQL, (err) => {
            if (err) {
                console.error('Error creating table:', err);
                db.close();
                return false;
            }
            console.log('LegacyUnitStandard table created/verified successfully!');
        });
        
        // Read SQL file
        console.log('Reading SQL file...');
        const sqlContent = fs.readFileSync(sqlFile, 'utf8');
        
        // Split into individual INSERT statements
        const insertStatements = sqlContent.split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);
        
        console.log(`Found ${insertStatements.length} INSERT statements to execute`);
        
        let successCount = 0;
        let errorCount = 0;
        let processedCount = 0;
        
        // Execute each INSERT statement
        const executeStatements = () => {
            if (processedCount >= insertStatements.length) {
                // All statements processed, show results
                console.log('\nImport completed!');
                console.log(`Successfully executed: ${successCount} statements`);
                console.log(`Errors: ${errorCount}`);
                
                // Verify the import by counting records
                db.get("SELECT COUNT(*) as count FROM LegacyUnitStandard", (err, row) => {
                    if (err) {
                        console.error('Error counting records:', err);
                    } else {
                        console.log(`Total records in LegacyUnitStandard table: ${row.count}`);
                    }
                    
                    // Show a few sample records
                    console.log('\nSample records:');
                    db.all("SELECT id, unitStandardId, unitStandardName FROM LegacyUnitStandard LIMIT 5", (err, rows) => {
                        if (err) {
                            console.error('Error fetching samples:', err);
                        } else {
                            rows.forEach(row => {
                                console.log(`ID: ${row.id}, Unit Standard ID: ${row.unitStandardId}, Name: ${row.unitStandardName.substring(0, 50)}...`);
                            });
                        }
                        
                        db.close();
                        console.log('\nLegacy unit standards import completed successfully!');
                    });
                });
                
                return;
            }
            
            const statement = insertStatements[processedCount];
            
            db.exec(statement, (err) => {
                if (err) {
                    errorCount++;
                    console.error(`Error executing statement ${processedCount + 1}:`, err.message);
                    if (statement.length > 100) {
                        console.error('Statement:', statement.substring(0, 100) + '...');
                    } else {
                        console.error('Statement:', statement);
                    }
                } else {
                    successCount++;
                    
                    if ((processedCount + 1) % 1000 === 0) {
                        console.log(`Progress: ${processedCount + 1}/${insertStatements.length} statements executed`);
                    }
                }
                
                processedCount++;
                
                // Process next statement
                setImmediate(executeStatements);
            });
        };
        
        // Start processing
        executeStatements();
        
        return true;
        
    } catch (error) {
        console.error('Error importing legacy unit standards:', error);
        return false;
    }
}

// Run the import
console.log('Starting legacy unit standards import...');
importLegacyUnitStandards();