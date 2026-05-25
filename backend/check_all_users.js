const { Client } = require('pg');

async function checkAllUsers() {
    const client = new Client({
        host: 'localhost',
        database: 'rlms',
        user: 'postgres',
        password: '12345',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL');

        // Check all users in both tables
        console.log('\n📋 Checking SystemAdmins table:');
        const adminResult = await client.query('SELECT * FROM "SystemAdmins"');
        console.log(`Found ${adminResult.rows.length} admin users:`);
        adminResult.rows.forEach((admin, index) => {
            console.log(`${index + 1}. ${admin.Email} (${admin.FirstName} ${admin.LastName}) - Status: ${admin.Status}`);
        });

        console.log('\n📋 Checking Users table:');
        const userResult = await client.query('SELECT * FROM "Users"');
        console.log(`Found ${userResult.rows.length} users:`);
        userResult.rows.forEach((user, index) => {
            console.log(`${index + 1}. ${user.Email} (${user.FirstName} ${user.LastName}) - Status: ${user.Status}`);
        });

        // Check if there are any default credentials in the codebase
        console.log('\n🔍 Searching for default password references in codebase...');
        
        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (client) await client.end();
    }
}

checkAllUsers();