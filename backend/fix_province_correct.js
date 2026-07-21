const { Client } = require('pg');

// Correct mapping from southAfricaData.ts (id: 1 = KwaZulu-Natal)
const provinceMap = {
    '1': 'KwaZulu-Natal',
    '2': 'Gauteng',
    '3': 'Western Cape',
    '4': 'Eastern Cape',
    '5': 'Free State',
    '6': 'Limpopo',
    '7': 'Mpumalanga',
    '8': 'North West',
    '9': 'Northern Cape'
};

async function fix() {
    const client = new Client({ host:'localhost', database:'nbsnproject', user:'postgres', password:'postgres', port:5432 });
    await client.connect();
    console.log('✅ Connected\n');

    // Fix Projects — currently "Eastern Cape" was wrongly set, should be "KwaZulu-Natal"
    await client.query('UPDATE "Projects" SET "Province" = $1 WHERE "Province" = $2', ['KwaZulu-Natal', 'Eastern Cape']);
    console.log('✅ Project province corrected: "Eastern Cape" → "KwaZulu-Natal"');

    // Fix Seaview site — was wrongly set to "Eastern Cape"
    await client.query('UPDATE "ProjectSites" SET "Province" = $1 WHERE "SiteName" = $2 AND "Province" = $3', ['KwaZulu-Natal', 'Seaview', 'Eastern Cape']);
    console.log('✅ Seaview site province corrected: "Eastern Cape" → "KwaZulu-Natal"');

    // Verify
    console.log('\n📋 Final state:');
    const rp = await client.query('SELECT "Id","ProjectName","Province" FROM "Projects"');
    rp.rows.forEach(p => console.log(`  Project: ${p.ProjectName} → "${p.Province}"`));
    const rs = await client.query('SELECT "Id","SiteName","Province" FROM "ProjectSites"');
    rs.rows.forEach(s => console.log(`  Site: ${s.SiteName} → "${s.Province}"`));

    await client.end();
    console.log('\n✅ Done!');
}
fix().catch(console.error);
