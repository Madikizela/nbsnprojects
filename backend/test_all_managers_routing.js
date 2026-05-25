const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function testAllManagersRouting() {
  try {
    console.log('=== TESTING ALL MANAGERS ROUTING ===\n');
    
    // Get all manager users (roles 3, 4, 5, 7 with department IDs)
    const managersQuery = `
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
      WHERE u."Role" IN (3, 4, 5, 7) 
        AND u."Status" = 1
      ORDER BY u."Role", u."Email"
    `;
    
    const managersResult = await pool.query(managersQuery);
    
    if (managersResult.rows.length === 0) {
      console.log('❌ No managers found!');
      return;
    }
    
    console.log(`Found ${managersResult.rows.length} managers to test:\n`);
    
    let correctCount = 0;
    let totalCount = 0;
    
    for (const user of managersResult.rows) {
      totalCount++;
      console.log(`\n${totalCount}. 👤 ${user.FirstName} ${user.LastName} (${user.Email})`);
      console.log(`   Role: ${user.Role}, SDP ID: ${user.SkillsDevelopmentProviderId}, Dept ID: ${user.DepartmentId}`);
      
      // Apply the same routing logic as Login.tsx
      const normalizedUser = {
        role: user.Role,
        skillsDevelopmentProviderId: user.SkillsDevelopmentProviderId,
        departmentId: user.DepartmentId,
        clientId: user.ClientId
      };
      
      let expectedRoute = '';
      let routingReason = '';
      
      // QA Manager check first (Role 7)
      if (normalizedUser.role === 7 || normalizedUser.role === '7') {
        expectedRoute = '/sdp-manager-dashboard';
        routingReason = 'QA Manager (Role 7)';
      }
      // Other SDP Manager roles
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
      // Main SDP Admin (role 3 without departmentId)
      else if (
        (normalizedUser.role === '3' || normalizedUser.role === 3) && 
        !normalizedUser.departmentId &&
        (typeof normalizedUser.skillsDevelopmentProviderId === 'number' && normalizedUser.skillsDevelopmentProviderId !== null && normalizedUser.skillsDevelopmentProviderId > 0)
      ) {
        expectedRoute = '/sdp-dashboard';
        routingReason = 'Main SDP Admin';
      }
      else {
        expectedRoute = '/dashboard';
        routingReason = 'Default';
      }
      
      const isManagerRoute = expectedRoute === '/sdp-manager-dashboard';
      const shouldBeManager = (user.Role === 7) || (user.Role !== 3 || user.DepartmentId !== null);
      
      if (isManagerRoute && shouldBeManager) {
        correctCount++;
        console.log(`   ✅ CORRECT: ${routingReason} → ${expectedRoute}`);
      } else if (!isManagerRoute && !shouldBeManager) {
        correctCount++;
        console.log(`   ✅ CORRECT: ${routingReason} → ${expectedRoute}`);
      } else {
        console.log(`   ❌ INCORRECT: ${routingReason} → ${expectedRoute}`);
        console.log(`      Expected: ${shouldBeManager ? 'Manager Dashboard' : 'SDP Dashboard'}`);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total Managers Tested: ${totalCount}`);
    console.log(`Correct Routing: ${correctCount}`);
    console.log(`Incorrect Routing: ${totalCount - correctCount}`);
    console.log(`Success Rate: ${Math.round((correctCount / totalCount) * 100)}%`);
    
    if (correctCount === totalCount) {
      console.log('\n🎉 ALL MANAGERS WILL ROUTE CORRECTLY!');
    } else {
      console.log('\n⚠️  Some managers have incorrect routing!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testAllManagersRouting();