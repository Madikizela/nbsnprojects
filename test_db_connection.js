const { Client } = require('pg');

async function testDatabaseConnection() {
    const client = new Client({
        host: 'localhost',
        database: 'rlms',
        user: 'postgres',
        password: '12345',
        port: 5432,
    });

    try {
        console.log('Attempting to connect to PostgreSQL...');
        await client.connect();
        console.log('✓ Successfully connected to PostgreSQL');

        // Test basic query
        console.log('\nTesting basic query...');
        const result = await client.query('SELECT NOW()');
        console.log('✓ Basic query successful:', result.rows[0]);

        // Check if SystemAdmins table exists and has data
        console.log('\nChecking SystemAdmins table...');
        const systemAdminsResult = await client.query('SELECT COUNT(*) FROM "SystemAdmins"');
        console.log('✓ SystemAdmins table accessible, count:', systemAdminsResult.rows[0].count);

        // Check if Users table exists and has data
        console.log('\nChecking Users table...');
        const usersResult = await client.query('SELECT COUNT(*) FROM "Users"');
        console.log('✓ Users table accessible, count:', usersResult.rows[0].count);

        // Test a sample login query similar to what the backend does
        console.log('\nTesting sample login query...');
        const loginTest = await client.query('SELECT * FROM "SystemAdmins" WHERE "Email" = $1 LIMIT 1', ['admin@example.com']);
        console.log('✓ Login query test successful, found records:', loginTest.rows.length);

        // Check table names and case sensitivity
        console.log('\nChecking all tables in the database...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        console.log('✓ Available tables:');
        tablesResult.rows.forEach(row => {
            console.log('  -', row.table_name);
        });

    } catch (error) {
        console.error('✗ Database connection error:', error.message);
        console.error('Error details:', error);
    } finally {
        await client.end();
        console.log('\nConnection closed.');
    }
}

testDatabaseConnection();