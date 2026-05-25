const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'rlms',
    user: 'postgres',
    password: '12345'
});

async function checkColumns() {
    try {
        await client.connect();
        const result = await client.query('SELECT * FROM "ProjectSites" LIMIT 1');
        console.log('ProjectSites columns:', Object.keys(result.rows[0] || {}));
        await client.end();
    } catch (error) {
        console.error('Error:', error.message);
        await client.end();
    }
}

checkColumns();
