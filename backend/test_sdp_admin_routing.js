const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function testSDPAdminRouting() {
  try {
    console.log('=== TESTING SDP ADMINISTRATOR ROUTING ===\n');
    
    // Get all Role 3 users to identify the main SDP admin
    const role3Query = `
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
      WHERE u."Role" = 3 
        AND u."Status" = 1
      ORDER BY u."Email"
    `;
    
    const role3Result = await pool.query(role3Query);
    
    console.log(`Found ${role3Result.rows.length} Role 3 users:\n`);
    
    for (const user of role3Result.rows) {
      console.log(`👤 ${user.FirstName} ${user.LastName} (${user.Email})`);
      console.log(`   Role: ${user.Role}`);
      console.log(`   SDP ID: ${user.SkillsDevelopmentProviderId}`);
      console.log(`   Department ID: ${user.DepartmentId}`);
      console.log(`   Client ID: ${user.ClientId}`);
      
      // Apply the current routing logic
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
      // Client
      else if (
        normalizedUser.role === 'ClientAdmin' ||
        normalizedUser.userType === 'ClientAdmin' ||
        normalizedUser.accessLevel === 3 ||
        (typeof normalizedUser.clientId === 'number' && normalizedUser.clientId !== null && normalizedUser.clientId > 0)
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
      
      // Determine if this is correct
      const hasClientId = normalizedUser.clientId !== null && normalizedUser.clientId > 0;
      const hasDepartmentId = normalizedUser.departmentId !== null && normalizedUser.departmentId > 0;
      const hasSDPId = normalizedUser.skillsDevelopmentProviderId !== null && normalizedUser.skillsDevelopmentProviderId > 0;
      
      console.log(`   📊 Analysis:`);
      console.log(`      - Has Client ID: ${hasClientId}`);
      console.log(`      - Has Department ID: ${hasDepartmentId}`);
      console.log(`      - Has SDP ID: ${hasSDPId}`);
      
      if (hasDepartmentId) {
        console.log(`   ✅ CORRECT: Department manager should go to Manager Dashboard`);
      } else if (hasSDPId && !hasClientId) {
        console.log(`   ${expectedRoute === '/sdp-dashboard' ? '✅ CORRECT' : '❌ INCORRECT'}: Main SDP Admin should go to SDP Dashboard`);
      } else if (hasClientId) {
        console.log(`   ${expectedRoute === '/client-dashboard' ? '✅ CORRECT' : '❌ INCORRECT'}: Client Admin should go to Client Dashboard`);
      } else {
        console.log(`   ⚠️  UNCLEAR: User has no clear affiliation`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testSDPAdminRouting();