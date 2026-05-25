const { Client } = require('pg');
const fs = require('fs');

async function importUnitStandards() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL database');

        // Check if data already exists
        const countResult = await client.query('SELECT COUNT(*) FROM occupational_unit_standards');
        console.log(`Current unit standards count: ${countResult.rows[0].count}`);

        if (countResult.rows[0].count > 0) {
            console.log('Unit standards data already exists. Skipping import.');
            return;
        }

        // Read the SQL file
        const sqlContent = fs.readFileSync('occupational_unit_standards.sql', 'utf8');
        
        // Extract INSERT statements
        const insertPattern = /INSERT INTO `occupational_unit_standards`.*?VALUES\s*\((.*?)\);/gs;
        const matches = sqlContent.match(insertPattern);
        
        if (!matches) {
            console.log('No INSERT statements found in SQL file');
            return;
        }

        console.log(`Found ${matches.length} INSERT statements`);

        // Process each INSERT statement
        let importedCount = 0;
        for (const match of matches) {
            try {
                // Convert MySQL syntax to PostgreSQL
                let postgresSQL = match
                    .replace(/`/g, '"')  // Replace backticks with double quotes
                    .replace(/INSERT INTO "occupational_unit_standards"/g, 'INSERT INTO occupational_unit_standards')
                    .replace(/VALUES\s*\(/g, 'VALUES (')
                    .replace(/'([^']*)'/g, (match, content) => {
                        // Escape single quotes in string values
                        return `'${content.replace(/'/g, "''")}'`;
                    });

                await client.query(postgresSQL);
                importedCount++;
                
                if (importedCount % 100 === 0) {
                    console.log(`Imported ${importedCount} records...`);
                }
            } catch (error) {
                console.error(`Error importing record ${importedCount + 1}:`, error.message);
                // Continue with next record
            }
        }

        console.log(`✅ Successfully imported ${importedCount} unit standards`);

        // Verify the import
        const finalCount = await client.query('SELECT COUNT(*) FROM occupational_unit_standards');
        console.log(`Total unit standards in database: ${finalCount.rows[0].count}`);

        // Test with qualification 91782
        const testResult = await client.query('SELECT COUNT(*) FROM occupational_unit_standards WHERE qualification_id = $1', ['91782']);
        console.log(`Unit standards for qualification 91782: ${testResult.rows[0].count}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

importUnitStandards();
