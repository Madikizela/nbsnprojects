const { Client } = require('pg');

async function check() {
    const client = new Client({
        host: 'localhost', database: 'nbsnproject',
        user: 'postgres', password: 'postgres', port: 5432,
    });
    await client.connect();

    // Check LearnerAttendances columns
    const cols = await client.query(`
        SELECT column_name, data_type FROM information_schema.columns 
        WHERE table_name = 'LearnerAttendances' ORDER BY ordinal_position
    `);
    console.log('LearnerAttendances columns:', cols.rows.map(r => r.column_name));

    // Check TeacherAttendances table if it exists
    const ta = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_name ILIKE '%teacher%attend%' OR table_name ILIKE '%attend%teacher%'
    `);
    console.log('\nTeacher attendance tables:', ta.rows);

    // Check if there is a TeacherAttendances table with signature
    try {
        const taCols = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'TeacherAttendances' ORDER BY ordinal_position
        `);
        console.log('\nTeacherAttendances columns:', taCols.rows.map(r => r.column_name));

        const taData = await client.query(`
            SELECT ta.*, 
                   u."Email", u."FirstName", u."LastName"
            FROM "TeacherAttendances" ta
            LEFT JOIN "Users" u ON ta."UserId" = u."Id"
            WHERE u."Email" = 'ngidinokwe@gmail.com'
            ORDER BY ta."AttendanceDate" DESC LIMIT 5
        `);
        console.log('\nNokwe TeacherAttendances:', taData.rows.length > 0 ? taData.rows : 'No records');
    } catch (e) {
        console.log('TeacherAttendances:', e.message);
    }

    // Check Learners table for SignaturePath
    try {
        const learnerSig = await client.query(`
            SELECT "Id", "FirstName", "LastName", "SignaturePath"
            FROM "Learners"
            WHERE "SignaturePath" IS NOT NULL AND "SignaturePath" != ''
            LIMIT 5
        `);
        console.log('\nLearners with signatures:', learnerSig.rows);
    } catch (e) {
        console.log('Learner signature check:', e.message);
    }

    // Look for profile/user update endpoint - maybe signature is in uploads
    // Check uploads folder
    const { execSync } = require('child_process');
    try {
        const files = execSync('dir /b /s "C:\\Users\\madik\\Documents\\nbsnprojects\\backend\\uploads\\signatures" 2>nul || echo NO_DIR').toString();
        console.log('\nSignature files in uploads:', files.trim());
    } catch (e) {
        console.log('Uploads check:', e.message);
    }

    await client.end();
}
check().catch(console.error);
