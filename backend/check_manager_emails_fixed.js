const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkManagerEmails() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // First, let's see all unique roles and their counts
    const rolesQuery = `
      SELECT 
        "Role",
        COUNT(*) as count
      FROM "Users" 
      GROUP BY "Role"
      ORDER BY "Role";
    `;

    const rolesResult = await client.query(rolesQuery);
    
    console.log('\n=== ALL ROLES IN DATABASE ===');
    rolesResult.rows.forEach(row => {
      console.log(`Role ${row.Role}: ${row.count} users`);
    });

    // Get all users to see their details
    const usersQuery = `
      SELECT 
        "Id",
        "FirstName",
        "LastName",
        "Email",
        "Role",
        "Status",
        "CreatedAt",
        "ClientId",
        "SkillsDevelopmentProviderId",
        "DepartmentId"
      FROM "Users" 
      ORDER BY "Role", "FirstName", "LastName";
    `;

    const usersResult = await client.query(usersQuery);
    
    console.log('\n=== ALL USERS ===\n');
    
    if (usersResult.rows.length === 0) {
      console.log('No users found in the database.');
      return;
    }

    // Group by role
    const usersByRole = {};
    usersResult.rows.forEach(user => {
      if (!usersByRole[user.Role]) {
        usersByRole[user.Role] = [];
      }
      usersByRole[user.Role].push(user);
    });

    // Display by role
    Object.keys(usersByRole).forEach(role => {
      console.log(`ROLE ${role}:`);
      console.log('─'.repeat(50));
      
      usersByRole[role].forEach(user => {
        const fullName = `${user.FirstName || ''} ${user.LastName || ''}`.trim();
        console.log(`👤 ${fullName || 'No Name'}`);
        console.log(`   Email: ${user.Email || 'No Email'}`);
        console.log(`   Status: ${user.Status}`);
        console.log(`   SDP ID: ${user.SkillsDevelopmentProviderId || 'None'}`);
        console.log(`   Department ID: ${user.DepartmentId || 'None'}`);
        console.log(`   Client ID: ${user.ClientId || 'None'}`);
        console.log(`   Created: ${new Date(user.CreatedAt).toLocaleDateString()}`);
        console.log('');
      });
      console.log('');
    });

    // Let's also check if there are any SDP-related tables for more context
    const sdpQuery = `
      SELECT 
        "Id",
        "Name",
        "ContactEmail"
      FROM "SkillsDevelopmentProviders" 
      ORDER BY "Name";
    `;

    try {
      const sdpResult = await client.query(sdpQuery);
      console.log('\n=== SKILLS DEVELOPMENT PROVIDERS ===');
      sdpResult.rows.forEach(sdp => {
        console.log(`🏢 ${sdp.Name} (ID: ${sdp.Id})`);
        console.log(`   Contact Email: ${sdp.ContactEmail || 'No Email'}`);
        console.log('');
      });
    } catch (error) {
      console.log('Could not fetch SDP data:', error.message);
    }

    // Check departments
    const deptQuery = `
      SELECT 
        "Id",
        "Name",
        "ManagerEmail"
      FROM "Departments" 
      ORDER BY "Name";
    `;

    try {
      const deptResult = await client.query(deptQuery);
      console.log('\n=== DEPARTMENTS ===');
      deptResult.rows.forEach(dept => {
        console.log(`🏢 ${dept.Name} (ID: ${dept.Id})`);
        console.log(`   Manager Email: ${dept.ManagerEmail || 'No Email'}`);
        console.log('');
      });
    } catch (error) {
      console.log('Could not fetch Department data:', error.message);
    }

  } catch (error) {
    console.error('Error checking manager emails:', error);
  } finally {
    await client.end();
  }
}

checkManagerEmails();