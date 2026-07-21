const { Client } = require('pg');
async function check() {
    const client = new Client({ host:'localhost', database:'nbsnproject', user:'postgres', password:'postgres', port:5432 });
    await client.connect();

    const projects = await client.query('SELECT "Id","ProjectName","Province" FROM "Projects" LIMIT 5');
    console.log('Projects:');
    projects.rows.forEach(r => console.log(`  ID:${r.Id} Name:${r.ProjectName} Province:${r.Province}`));

    const sites = await client.query('SELECT "Id","SiteName","Province","ProjectId" FROM "ProjectSites" LIMIT 10');
    console.log('\nProjectSites:');
    sites.rows.forEach(r => console.log(`  ID:${r.Id} Site:${r.SiteName} Province:${r.Province} ProjectId:${r.ProjectId}`));

    await client.end();
}
check().catch(console.error);
