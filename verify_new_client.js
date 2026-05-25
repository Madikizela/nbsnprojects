const { Client } = require('pg');

async function checkNewClient() {
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

        // Check for the new client
        const result = await client.query(`
            SELECT "Id", "Name", "Email", "Address", "ContactPerson", "PhoneNumber", "Status", "CreatedAt"
            FROM "Clients"
            WHERE "Email" = 'newtestcompany@example.com'
        `);

        if (result.rows.length > 0) {
            console.log('🎉 New client found!');
            console.log('📊 Client details:');
            console.log(JSON.stringify(result.rows[0], null, 2));
        } else {
            console.log('❌ New client not found');
        }

        // Check for the admin user
        const userResult = await client.query(`
            SELECT "Id", "FirstName", "LastName", "Username", "Email", "Role", "Status"
            FROM "Users"
            WHERE "Email" = 'newtestcompany@example.com'
        `);

        if (userResult.rows.length > 0) {
            console.log('\n🎉 Admin user found!');
            console.log('👤 User details:');
            console.log(JSON.stringify(userResult.rows[0], null, 2));
        } else {
            console.log('\n❌ Admin user not found');
        }

        // Show all clients
        const allClients = await client.query('SELECT "Id", "Name", "Email" FROM "Clients" ORDER BY "Id"');
        console.log(`\n📋 Total clients: ${allClients.rows.length}`);
        allClients.rows.forEach(client => {
            console.log(`   ID ${client.Id}: ${client.Name} (${client.Email})`);
        });

    } catch (error) {
        console.error('❌ Error checking new client:', error);
    } finally {
        await client.end();
    }
}

checkNewClient();