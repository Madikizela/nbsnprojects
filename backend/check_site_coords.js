const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres:Nbsn%402026@localhost:5432/nbsn_db"
});

async function checkSiteCoords() {
  try {
    await client.connect();
    const res = await client.query('SELECT "Id", "SiteName", "Latitude", "Longitude" FROM "ProjectSites" ORDER BY "Id" DESC LIMIT 10');
    console.log('--- Project Sites Coordinates ---');
    console.table(res.rows);
    
    // Check classes for a specific teacher (Sandile Zondi)
    const teacherRes = await client.query(`
      SELECT 
        ct."ClassId", 
        sc."ClassName", 
        ps."SiteName", 
        ps."Latitude", 
        ps."Longitude"
      FROM "ClassTeachers" ct
      JOIN "SiteClasses" sc ON ct."ClassId" = sc."Id"
      JOIN "ProjectSites" ps ON sc."ProjectSiteId" = ps."Id"
      JOIN "Users" u ON ct."TeacherId" = u."Id"
      WHERE u."Email" = 'maphangomaphango931@gmail.com' AND ct."IsActive" = true
    `);
    console.log('\n--- Sandile Zondi Assigned Classes with Coords ---');
    console.table(teacherRes.rows);
    
  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

checkSiteCoords();
