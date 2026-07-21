const { Client } = require('pg');

async function check() {
    const client = new Client({
        host: 'localhost', database: 'nbsnproject',
        user: 'postgres', password: 'postgres', port: 5432,
    });
    try {
        await client.connect();

        // Check ClassTeachers structure
        const cols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'ClassTeachers'
            ORDER BY ordinal_position
        `);
        console.log('ClassTeachers columns:', cols.rows);

        // Check data
        const data = await client.query(`
            SELECT ct.*, 
                   CASE WHEN ct."Signature" IS NULL THEN 'NULL'
                        WHEN ct."Signature" = '' THEN 'EMPTY'
                        ELSE LEFT(ct."Signature", 80) END AS "SigPreview"
            FROM "ClassTeachers" ct
            LIMIT 10
        `);
        console.log('\nClassTeachers data:');
        data.rows.forEach(r => {
            const { Signature, ...rest } = r;
            console.log({ ...rest, hasSig: !!Signature && Signature !== 'NULL' });
        });

        await client.end();
    } catch (e) {
        console.error('Error:', e.message);
        if (client) await client.end();
    }
}
check();
