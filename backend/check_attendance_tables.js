const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rlms',
    user: 'postgres',
    password: '12345'
});

async function checkTables() {
    try {
        await client.connect();
        console.log('Connected to database\n');

        // Check for attendance-related tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%ttendance%'
            ORDER BY table_name
        `);

        console.log('Attendance-related tables:');
        if (result.rows.length === 0) {
            console.log('  No attendance tables found!');
        } else {
            result.rows.forEach(row => {
                console.log(`  - ${row.table_name}`);
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

checkTables();
