const { Client } = require('pg');

// South Africa province mapping (numeric ID to name - matches southAfricaData in frontend)
const provinceMap = {
    '1': 'Eastern Cape',
    '2': 'Free State',
    '3': 'Gauteng',
    '4': 'KwaZulu-Natal',
    '5': 'Limpopo',
    '6': 'Mpumalanga',
    '7': 'Northern Cape',
    '8': 'North West',
    '9': 'Western Cape'
};

async function fixProvince() {
    const client = new Client({ host:'localhost', database:'nbsnproject', user:'postgres', password:'postgres', port:5432 });
    await client.connect();
    console.log('✅ Connected\n');

    // Fix Projects with numeric province codes
    const projects = await client.query('SELECT "Id","ProjectName","Province" FROM "Projects"');
    for (const p of projects.rows) {
        const mapped = provinceMap[p.Province];
        if (mapped) {
            await client.query('UPDATE "Projects" SET "Province" = $1 WHERE "Id" = $2', [mapped, p.Id]);
            console.log(`✅ Project "${p.ProjectName}": Province "${p.Province}" → "${mapped}"`);
        } else if (!p.Province || p.Province.trim() === '') {
            console.log(`⚠️  Project "${p.ProjectName}": Province is empty — skipping`);
        } else {
            console.log(`ℹ️  Project "${p.ProjectName}": Province "${p.Province}" — already a name, no change`);
        }
    }

    // Fix ProjectSites with empty province — use the parent project's province
    const sites = await client.query(`
        SELECT ps."Id", ps."SiteName", ps."Province", ps."ProjectId", p."Province" AS "ProjectProvince"
        FROM "ProjectSites" ps
        JOIN "Projects" p ON ps."ProjectId" = p."Id"
        WHERE ps."Province" IS NULL OR ps."Province" = ''
    `);
    
    console.log(`\nFound ${sites.rowCount} site(s) with empty province`);
    for (const s of sites.rows) {
        // Use the project's province (already fixed above)
        const projectProvince = provinceMap[s.ProjectProvince] || s.ProjectProvince;
        if (projectProvince) {
            await client.query('UPDATE "ProjectSites" SET "Province" = $1 WHERE "Id" = $2', [projectProvince, s.Id]);
            console.log(`✅ Site "${s.SiteName}": Province "" → "${projectProvince}" (from project)`);
        }
    }

    // Verify
    console.log('\n📋 After fix:');
    const rp = await client.query('SELECT "Id","ProjectName","Province" FROM "Projects"');
    rp.rows.forEach(p => console.log(`  Project: ${p.ProjectName} → "${p.Province}"`));
    const rs = await client.query('SELECT "Id","SiteName","Province" FROM "ProjectSites"');
    rs.rows.forEach(s => console.log(`  Site: ${s.SiteName} → "${s.Province}"`));

    await client.end();
    console.log('\n✅ Done!');
}
fixProvince().catch(console.error);
