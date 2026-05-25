const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkQAUsers() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database');

    // Check all QA managers (SDPModerator role = 7)
    console.log('\n=== QA MANAGERS (SDPModerator Role) ===');
    const qaUsersQuery = `
      SELECT 
        u."Id",
        u."Name",
        u."Email",
        u."Role",
        u."Status",
        d."Name" as "DepartmentName",
        sdp."Name" as "SDPName"
      FROM "Users" u
      LEFT JOIN "Departments" d ON u."DepartmentId" = d."Id"
      LEFT JOIN "SkillsDevelopmentProviders" sdp ON u."SkillsDevelopmentProviderId" = sdp."Id"
      WHERE u."Role" = 7
      ORDER BY u."Name";
    `;
    
    const qaUsers = await client.query(qaUsersQuery);
    
    if (qaUsers.rows.length === 0) {
      console.log('❌ No QA managers found with role 7 (SDPModerator)');
    } else {
      console.log(`✅ Found ${qaUsers.rows.length} QA managers:`);
      qaUsers.rows.forEach(user => {
        console.log(`\n👤 ${user.Name}`);
        console.log(`   📧 Email: ${user.Email}`);
        console.log(`   🎭 Role: ${user.Role} (SDPModerator)`);
        console.log(`   📊 Status: ${user.Status}`);
        console.log(`   🏢 Department: ${user.DepartmentName || 'None'}`);
        console.log(`   🏛️ SDP: ${user.SDPName || 'None'}`);
      });
    }

    // Check all users to see role distribution
    console.log('\n=== ALL USERS BY ROLE ===');
    const allUsersQuery = `
      SELECT 
        u."Role",
        COUNT(*) as "UserCount",
        STRING_AGG(u."Email", ', ') as "Emails"
      FROM "Users" u
      GROUP BY u."Role"
      ORDER BY u."Role";
    `;
    
    const allUsers = await client.query(allUsersQuery);
    allUsers.rows.forEach(roleGroup => {
      const roleName = getRoleName(roleGroup.Role);
      console.log(`\n🎭 Role ${roleGroup.Role} (${roleName}): ${roleGroup.UserCount} users`);
      console.log(`   📧 Emails: ${roleGroup.Emails}`);
    });

    // Check if there are any authentication tokens
    console.log('\n=== RECENT LOGIN ACTIVITY ===');
    try {
      const recentLoginsQuery = `
        SELECT 
          u."Name",
          u."Email",
          u."Role",
          u."LastLoginAt"
        FROM "Users" u
        WHERE u."LastLoginAt" IS NOT NULL
        ORDER BY u."LastLoginAt" DESC
        LIMIT 5;
      `;
      
      const recentLogins = await client.query(recentLoginsQuery);
      if (recentLogins.rows.length > 0) {
        console.log('Recent logins:');
        recentLogins.rows.forEach(user => {
          console.log(`   👤 ${user.Name} (${user.Email}) - Role ${user.Role} - Last login: ${user.LastLoginAt}`);
        });
      } else {
        console.log('No recent login data found (LastLoginAt column might not exist)');
      }
    } catch (error) {
      console.log('LastLoginAt column not found - this is normal');
    }

  } catch (error) {
    console.error('Error checking QA users:', error);
  } finally {
    await client.end();
  }
}

function getRoleName(roleId) {
  const roles = {
    1: 'SuperAdmin',
    2: 'Admin', 
    3: 'SDPAdministrator',
    4: 'SDPFinance',
    5: 'SDPLogistics',
    6: 'SDPManager',
    7: 'SDPModerator',
    8: 'Teacher',
    9: 'Learner'
  };
  return roles[roleId] || 'Unknown';
}

checkQAUsers();