const { Client } = require('pg');

async function check() {
    const client = new Client({
        host: 'localhost', database: 'nbsnproject',
        user: 'postgres', password: 'postgres', port: 5432,
    });
    try {
        await client.connect();

        // Search ALL tables for any column that might have signature data for Nokwe
        // Check if Users table has a different signature column
        const userCols = await client.query(`
            SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'Users' ORDER BY ordinal_position
        `);
        console.log('Users columns:', userCols.rows.map(r => r.column_name));

        // Get full Nokwe user record
        const nokwe = await client.query(`
            SELECT * FROM "Users" WHERE "Email" = 'ngidinokwe@gmail.com'
        `);
        console.log('\nNokwe full record:');
        const row = nokwe.rows[0];
        Object.entries(row).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') {
                const display = typeof v === 'string' && v.length > 100 ? v.substring(0, 100) + '...' : v;
                console.log(`  ${k}: ${display}`);
            } else {
                console.log(`  ${k}: ${v}`);
            }
        });

        // Check uploads folder for any signature files
        const sigs = await client.query(`
            SELECT "Id", "Email", "Signature", "ProfileImage"
            FROM "Users" 
            WHERE "Signature" IS NOT NULL AND "Signature" != ''
            LIMIT 10
        `);
        console.log('\nUsers WITH signatures:');
        sigs.rows.forEach(r => console.log({ Id: r.Id, Email: r.Email, SigPreview: r.Signature?.substring(0, 80) }));

        await client.end();
    } catch (e) {
        console.error('Error:', e.message);
        if (client) await client.end();
    }
}
check();
