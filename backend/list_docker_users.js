const { Client } = require('pg');

async function listAllUsers() {
    const client = new Client({
        host: 'localhost',
        database: 'rlms',
        user: 'postgres',
        password: '12345',
        port: 5432,
    });

    try {
        await client.connect();
        console.log('✅ Connected to Docker PostgreSQL on port 5432');

        console.log('\n📋 All Users in "Users" table:');
        const userResult = await client.query('SELECT "Id", "Email", "Username", "FirstName", "LastName", "Role", "Status", "PasswordHash" FROM "Users"');
        console.table(userResult.rows.map(u => ({
            Id: u.Id,
            Email: u.Email,
            Name: `${u.FirstName} ${u.LastName}`,
            Role: u.Role,
            Status: u.Status,
            HasHash: u.PasswordHash ? 'Yes' : 'No'
        })));

        console.log('\n📋 All System Admins in "SystemAdmins" table:');
        const adminResult = await client.query('SELECT "Id", "Email", "FirstName", "LastName", "Status" FROM "SystemAdmins"');
        console.table(adminResult.rows);

        await client.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

listAllUsers();
