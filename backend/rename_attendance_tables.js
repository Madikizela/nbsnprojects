const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rlms',
    user: 'postgres',
    password: '12345'
});

async function renameTables() {
    try {
        await client.connect();
        console.log('Connected to database\n');

        // Rename LearnerAttendance to LearnerAttendances
        console.log('Renaming LearnerAttendance to LearnerAttendances...');
        await client.query('ALTER TABLE "LearnerAttendance" RENAME TO "LearnerAttendances"');
        console.log('✓ Renamed LearnerAttendance');

        // Rename AttendanceLog to AttendanceLogs
        console.log('Renaming AttendanceLog to AttendanceLogs...');
        await client.query('ALTER TABLE "AttendanceLog" RENAME TO "AttendanceLogs"');
        console.log('✓ Renamed AttendanceLog');

        // Verify
        console.log('\nVerifying tables:');
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%ttendance%'
            ORDER BY table_name
        `);

        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });

        console.log('\n✓ Tables renamed successfully!');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

renameTables();
