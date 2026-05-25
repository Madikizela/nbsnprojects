const { Client } = require('pg');
const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'rlms',
    password: '12345',
    port: 5432,
});

async function run() {
    try {
        await client.connect();
        const email = 'maphangontsika@gmail.com';
        const res = await client.query('SELECT "Email", "Role", "Status" FROM "Users" WHERE LOWER("Email") = LOWER($1)', [email]);
        console.log(`Checking for ${email}:`, res.rows);
        
        const allUsers = await client.query('SELECT "Email" FROM "Users"');
        console.log('All user emails:', allUsers.rows.map(r => r.Email));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

run();
