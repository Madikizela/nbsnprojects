const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function testFixedRoutingLogic() {
  try {
    console.log('=== TESTING FIXED ROUTING LOGIC ===\n');
    
    // Get all active users
    const usersQuery = `
      SELECT 
        u."Id",
        u."FirstName",
        u."LastName", 
        u."Email",
        u."Role",
        u."Status",
        u."SkillsDevelopmentProviderId",
        u."DepartmentId",
        u."ClientId"
      FROM "Users" u 
      WHERE u."Status" = 1
      ORDER BY u."Role", u."Email"
    `;
    
    const usersResult = await pool.query(usersQuery);
    
    console.log(`Testing ${usersResult.rows.length} active users:\n`);
    
    let correctRouting = 0;
    let totalUsers = 0;
    
    for (const user of usersResult.rows) {
      totalUsers++;
      console.log(`${totalUsers}. 👤 ${user.FirstName} ${user.LastName} (${user.Email})`);
      console.log(`   Role: ${user.Role}, SDP: ${user.SkillsDevelopmentProviderId}, Dept: ${user.DepartmentId}, Client: ${user.ClientId}`);
      
      // Apply the NEW routing logic
      const normalizedUser = {
        role: user.Role,
        skillsDevelopmentProviderId: user.SkillsDevelopmentProviderId,
        departmentId: user.DepartmentId,
        clientId: user.ClientId
      };
      
      let expectedRoute = '';
      let routingReason = '';
      
      // PRIORITY 1: QA MANAGER (ROLE 7)
      if (normalizedUser.role === 7 || normalizedUser.role === '7') {
        expectedRoute = '/sdp-manager-dashboard';
        routingReason = 'QA Manager (Role 7)';
      }
      // PRIORITY 2: SDP Manager roles
      else if (
        (normalizedUser.role === '3' && normalizedUser.departmentId) || 
        (normalizedUser.role === 3 && normalizedUser.departmentId) ||   
        normalizedUser.role === '4' || normalizedUser.role === 4 ||     
        normalizedUser.role === '5' || normalizedUser.role === 5 ||     
        normalizedUser.role === 'SDPIT' ||
        normalizedUser.role === 'SDPAssessor' ||
        normalizedUser.role === 'SDPFacilitator'
      ) {
        expectedRoute = '/sdp-manager-dashboard';
        routingReason = 'SDP Manager Role';
      }
      // PRIORITY 3: Main SDP Administrator
      else if (
        (normalizedUser.role === '3' || normalizedUser.role === 3) && 
        !normalizedUser.departmentId &&
        (typeof normalizedUser.skillsDevelopmentProviderId === 'number' && normalizedUser.skillsDevelopmentProviderId !== null && normalizedUser.skillsDevelopmentProviderId > 0)
      ) {
        expectedRoute = '/sdp-dashboard';
        routingReason = 'Main SDP Admin';
      }
      // PRIORITY 4: SDP-affiliated users
      else if (
        (typeof normalizedUser.skillsDevelopmentProviderId === 'number' && normalizedUser.skillsDevelopmentProviderId !== null && normalizedUser.skillsDevelopmentProviderId > 0)
      ) {
        expectedRoute = '/sdp-dashboard';
        routingReason = 'SDP Affiliated';
      }
      // PRIORITY 5: Client users (only if NOT SDP-affiliated)
      else if (
        !normalizedUser.skillsDevelopmentProviderId && 
        (
          normalizedUser.role === 'ClientAdmin' ||
          normalizedUser.userType === 'ClientAdmin' ||
          normalizedUser.accessLevel === 3 ||
          (typeof normalizedUser.clientId === 'number' && normalizedUser.clientId !== null && normalizedUser.clientId > 0)
        )
      ) {
        expectedRoute = '/client-dashboard';
        routingReason = 'Client Admin';
      }
      else {
        expectedRoute = '/dashboard';
        routingReason = 'Default';
      }
      
      console.log(`   🎯 Route: ${expectedRoute}`);
      console.log(`   📝 Reason: ${routingReason}`);
      
      // Determine if this routing makes sense
      let isCorrect = true;
      let expectedBehavior = '';
      
      if (user.Role === 7) {
        expectedBehavior = 'QA Manager → Manager Dashboard';
        isCorrect = expectedRoute === '/sdp-manager-dashboard';
      } else if ([3, 4, 5].includes(user.Role) && user.DepartmentId) {
        expectedBehavior = 'Department Manager → Manager Dashboard';
        isCorrect = expectedRoute === '/sdp-manager-dashboard';
      } else if (user.Role === 3 && !user.DepartmentId && user.SkillsDevelopmentProviderId) {
        expectedBehavior = 'Main SDP Admin → SDP Dashboard';
        isCorrect = expectedRoute === '/sdp-dashboard';
      } else if (user.SkillsDevelopmentProviderId && !user.DepartmentId) {
        expectedBehavior = 'SDP User → SDP Dashboard';
        isCorrect = expectedRoute === '/sdp-dashboard';
      } else if (user.ClientId && !user.SkillsDevelopmentProviderId) {
        expectedBehavior = 'Client User → Client Dashboard';
        isCorrect = expectedRoute === '/client-dashboard';
      } else {
        expectedBehavior = 'Other → Default Dashboard';
        isCorrect = expectedRoute === '/dashboard';
      }
      
      if (isCorrect) {
        correctRouting++;
        console.log(`   ✅ CORRECT: ${expectedBehavior}`);
      } else {
        console.log(`   ❌ INCORRECT: Expected ${expectedBehavior}, got ${expectedRoute}`);
      }
      
      console.log('');
    }
    
    console.log(`=== SUMMARY ===`);
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Correct Routing: ${correctRouting}`);
    console.log(`Incorrect Routing: ${totalUsers - correctRouting}`);
    console.log(`Success Rate: ${Math.round((correctRouting / totalUsers) * 100)}%`);
    
    if (correctRouting === totalUsers) {
      console.log('\n🎉 ALL USERS WILL ROUTE CORRECTLY!');
    } else {
      console.log('\n⚠️  Some users have incorrect routing!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testFixedRoutingLogic();