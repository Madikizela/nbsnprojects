const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  database: 'rlms',
  user: 'postgres',
  password: '12345'
});

async function checkData() {
  try {
    await client.connect();
    
    console.log('=== CHECKING SDPS ===');
    const sdps = await client.query('SELECT * FROM "SkillsDevelopmentProviders"');
    console.log('SDPs found:', sdps.rows.length);
    sdps.rows.forEach(sdp => {
      console.log(`SDP ID: ${sdp.Id}, Name: ${sdp.Name}, ClientId: ${sdp.ClientId}`);
    });
    
    console.log('\n=== CHECKING PROJECTS ===');
    const projects = await client.query('SELECT * FROM "Projects"');
    console.log('Projects found:', projects.rows.length);
    projects.rows.forEach(project => {
      console.log(`Project ID: ${project.Id}, Name: ${project.ProjectName}, SDP ID: ${project.SkillsDevelopmentProviderId}`);
    });
    
    console.log('\n=== CHECKING USERS ===');
    const users = await client.query('SELECT * FROM "Users" WHERE "SkillsDevelopmentProviderId" IS NOT NULL');
    console.log('SDP Users found:', users.rows.length);
    users.rows.forEach(user => {
      console.log(`User ID: ${user.Id}, Email: ${user.Email}, Role: ${user.Role}, SDP ID: ${user.SkillsDevelopmentProviderId}`);
    });
    
    console.log('\n=== CHECKING ALL USERS ===');
    const allUsers = await client.query('SELECT "Id", "Email", "Role", "SkillsDevelopmentProviderId" FROM "Users"');
    console.log('All Users found:', allUsers.rows.length);
    allUsers.rows.forEach(user => {
      console.log(`User ID: ${user.Id}, Email: ${user.Email}, Role: ${user.Role}, SDP ID: ${user.SkillsDevelopmentProviderId}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkData();