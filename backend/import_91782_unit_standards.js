const { Client } = require('pg');
const fs = require('fs');

async function import91782UnitStandards() {
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

        // Read the SQL file
        const sqlContent = fs.readFileSync('occupational_unit_standards.sql', 'utf8');
        
        // Extract INSERT statements for qualification 91782
        const insertPattern = /INSERT INTO `occupational_unit_standards`.*?VALUES\s*\((.*?)\);/gs;
        const matches = sqlContent.match(insertPattern);
        
        if (!matches) {
            console.log('No INSERT statements found in SQL file');
            return;
        }

        console.log(`Found ${matches.length} total INSERT statements`);

        // Filter for 91782 qualification
        const plumberInserts = matches.filter(match => match.includes("'91782'"));
        console.log(`Found ${plumberInserts.length} unit standards for qualification 91782`);

        if (plumberInserts.length === 0) {
            console.log('No unit standards found for qualification 91782');
            return;
        }

        // Process each INSERT statement for 91782
        let importedCount = 0;
        for (const match of plumberInserts) {
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
                console.log(`Imported unit standard ${importedCount}: ${match.match(/'MOD91782_\d+'/)?.[0] || 'Unknown'}`);
            } catch (error) {
                console.error(`Error importing record ${importedCount + 1}:`, error.message);
                // Continue with next record
            }
        }

        console.log(`✅ Successfully imported ${importedCount} unit standards for qualification 91782`);

        // Verify the import
        const finalCount = await client.query('SELECT COUNT(*) FROM occupational_unit_standards WHERE qualification_id = $1', [91782]);
        console.log(`Total unit standards for qualification 91782: ${finalCount.rows[0].count}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

import91782UnitStandards();
