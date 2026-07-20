const { Client } = require('pg');

async function listAllUsers() {
    const client = new Client({
        host: 'localhost',
        database: 'nbsnproject',
        user: 'postgres',
        password: 'postgres',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('✅ Connected to PostgreSQL database: nbsnproject\n');

        // Get all users
        const result = await client.query(
            'SELECT "Id", "Email", "FirstName", "LastName", "Role", "Status" FROM "Users" ORDER BY "Id"'
        );

        console.log(`Found ${result.rowCount} users:\n`);
        console.log('='.repeat(80));
        
        result.rows.forEach(user => {
            console.log(`ID: ${user.Id}`);
            console.log(`   Email: ${user.Email}`);
            console.log(`   Name: ${user.FirstName} ${user.LastName}`);
            console.log(`   Role: ${user.Role}`);
            console.log(`   Status: ${user.Status}`);
            console.log('-'.repeat(80));
        });

        await client.end();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (client) await client.end();
        process.exit(1);
    }
}

listAllUsers();
