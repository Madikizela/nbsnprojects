const { Client } = require('pg');
async function check() {
    const client = new Client({ host:'localhost', database:'nbsnproject', user:'postgres', password:'postgres', port:5432 });
    await client.connect();

    // Check UserRole enum values in the codebase vs database
    // Role 3 = ?  Role 4 = Teacher?
    const r = await client.query('SELECT "Id","Email","Role","Signature" FROM "Users" ORDER BY "Role"');
    console.log('All users with roles:');
    r.rows.forEach(row => {
        console.log(`  ID:${row.Id} Email:${row.Email} Role:${row.Role} Signature:${row.Signature ? 'HAS_SIG' : 'NULL'}`);
    });

    // Check the Nokwe profile via API simulation - what does the TeacherProfile GET return?
    // Role 3 = Manager? Let's check the enum from the code
    console.log('\nNote: Need to check UserRole enum values');
    
    await client.end();
}
check().catch(console.error);
