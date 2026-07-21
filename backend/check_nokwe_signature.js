const { Client } = require('pg');

async function checkNokweSignature() {
    const client = new Client({
        host: 'localhost', database: 'nbsnproject',
        user: 'postgres', password: 'postgres', port: 5432,
    });

    try {
        await client.connect();
        console.log('✅ Connected\n');

        // Check the Users table for Nokwe
        const userResult = await client.query(`
            SELECT "Id", "Email", "FirstName", "LastName", "Role",
                   "Signature",
                   CASE WHEN "Signature" IS NULL THEN 'NULL' 
                        WHEN "Signature" = '' THEN 'EMPTY'
                        ELSE LEFT("Signature", 60) END AS "SignaturePreview"
            FROM "Users"
            WHERE "Email" ILIKE '%nokwe%' OR "Email" ILIKE '%ngidinokwe%'
        `);
        console.log('Users matching nokwe:');
        userResult.rows.forEach(r => console.log(r));

        // Also check Teachers table if it exists
        const teacherResult = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_name ILIKE '%teacher%'
        `);
        console.log('\nTeacher-related tables:', teacherResult.rows);

        // Check the SiteClasses to find what CreatedByUserId is for Nokwe's class
        const classResult = await client.query(`
            SELECT sc."Id", sc."ClassName", sc."CreatedByUserId",
                   u."Email", u."FirstName", u."LastName",
                   u."Signature",
                   CASE WHEN u."Signature" IS NULL THEN 'NULL'
                        WHEN u."Signature" = '' THEN 'EMPTY'
                        ELSE LEFT(u."Signature", 80) END AS "SigPreview"
            FROM "SiteClasses" sc
            LEFT JOIN "Users" u ON sc."CreatedByUserId" = u."Id"
            LIMIT 20
        `);
        console.log('\nSiteClasses with CreatedByUser:');
        classResult.rows.forEach(r => console.log(r));

        await client.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (client) await client.end();
    }
}

checkNokweSignature();
