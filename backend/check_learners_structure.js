const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rlms',
    user: 'postgres',
    password: '12345'
});

async function checkStructure() {
    try {
        await client.connect();
        console.log('Connected to database\n');

        // Check if Learners table exists and get its structure
        const tableCheck = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Learners'
            ORDER BY ordinal_position
        `);

        if (tableCheck.rows.length > 0) {
            console.log('Learners table columns:');
            tableCheck.rows.forEach(col => {
                console.log(`  ${col.column_name}: ${col.data_type}`);
            });

            // Get sample data
            console.log('\nSample learner data:');
            const sampleData = await client.query(`SELECT * FROM "Learners" LIMIT 1`);
            if (sampleData.rows.length > 0) {
                console.log(JSON.stringify(sampleData.rows[0], null, 2));
            } else {
                console.log('  No learners found');
            }
        } else {
            console.log('Learners table not found');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

checkStructure();
