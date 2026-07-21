const { Client } = require('pg');

async function check() {
    const client = new Client({
        host: 'localhost', database: 'nbsnproject',
        user: 'postgres', password: 'postgres', port: 5432,
    });
    try {
        await client.connect();

        // Find Teachers table
        const tables = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name ILIKE '%teacher%'
            ORDER BY table_name
        `);
        console.log('Teacher tables:', tables.rows);

        // Check Teachers table if it exists
        try {
            const cols = await client.query(`
                SELECT column_name, data_type FROM information_schema.columns 
                WHERE table_name = 'Teachers' ORDER BY ordinal_position
            `);
            console.log('\nTeachers columns:', cols.rows);

            const data = await client.query(`
                SELECT "Id", "UserId", "FirstName", "LastName", "Email",
                       CASE WHEN "Signature" IS NULL THEN 'NULL'
                            WHEN "Signature" = '' THEN 'EMPTY'
                            ELSE LEFT("Signature", 80) END AS "SigPreview"
                FROM "Teachers" LIMIT 10
            `);
            console.log('\nTeachers data:');
            data.rows.forEach(r => console.log(r));
        } catch (e) {
            console.log('Teachers table error:', e.message);
        }

        // Also check ClassTeachers with join to see teacher info
        const joined = await client.query(`
            SELECT ct."Id", ct."ClassId", ct."TeacherId", ct."IsActive",
                   t."FirstName", t."LastName", t."Email",
                   CASE WHEN t."Signature" IS NULL THEN 'NULL'
                        WHEN t."Signature" = '' THEN 'EMPTY'
                        ELSE LEFT(t."Signature", 80) END AS "TeacherSig"
            FROM "ClassTeachers" ct
            JOIN "Teachers" t ON ct."TeacherId" = t."Id"
            LIMIT 10
        `);
        console.log('\nClassTeachers joined with Teachers:');
        joined.rows.forEach(r => console.log(r));

        await client.end();
    } catch (e) {
        console.error('Error:', e.message);
        if (client) await client.end();
    }
}
check();
