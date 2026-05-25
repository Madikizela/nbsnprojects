const { Client } = require('pg');

async function checkAccounts() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'rlms',
        user: 'postgres',
        password: '12345'
    });

    try {
        await client.connect();
        console.log('🔍 Checking for Client and SDP accounts...\n');

        // Check Clients table
        const clientsResult = await client.query(`
            SELECT "Id", "Name", "Email", "ContactPerson", "Status"
            FROM "Clients"
            ORDER BY "Id"
        `);
        console.log('📋 CLIENTS:');
        console.log(clientsResult.rows);
        console.log('');

        // Check SDPs table
        const sdpsResult = await client.query(`
            SELECT "Id", "Name", "ClientId", "ContactPerson", "Status"
            FROM "SkillsDevelopmentProviders"
            ORDER BY "Id"
        `);
        console.log('🏢 SKILLS DEVELOPMENT PROVIDERS:');
        console.log(sdpsResult.rows);
        console.log('');

        // Check if there are separate login tables for clients/SDPs
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE '%login%' OR table_name LIKE '%auth%'
            ORDER BY table_name
        `);
        console.log('🔐 AUTH/LOGIN TABLES:');
        console.log(tablesResult.rows.map(r => r.table_name));
        console.log('');

        // Check Users table for all users
        const usersResult = await client.query(`
            SELECT "Id", "FirstName", "LastName", "Email", "Role", "ClientId", "SkillsDevelopmentProviderId"
            FROM "Users"
            ORDER BY "Id"
        `);
        console.log('👥 ALL USERS:');
        console.log(usersResult.rows);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkAccounts();
