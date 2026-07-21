const { Client } = require('pg');
async function check() {
    const client = new Client({ host:'localhost', database:'nbsnproject', user:'postgres', password:'postgres', port:5432 });
    await client.connect();

    // Check all projects with their province values
    const r = await client.query('SELECT "Id","ProjectName","Province" FROM "Projects"');
    console.log('All Projects:');
    r.rows.forEach(p => console.log(`  ID:${p.Id} Name:${p.ProjectName} Province:"${p.Province}"`));

    // Check ProjectSites provinces
    const s = await client.query('SELECT "Id","SiteName","Province","ProjectId" FROM "ProjectSites"');
    console.log('\nAll ProjectSites:');
    s.rows.forEach(s => console.log(`  ID:${s.Id} Site:${s.SiteName} Province:"${s.Province}" ProjectId:${s.ProjectId}`));

    await client.end();
}
check().catch(console.error);
