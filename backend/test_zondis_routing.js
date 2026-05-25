const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function testZondisRouting() {
  try {
    console.log('=== TESTING ZONDIS411@GMAIL.COM ROUTING ===\n');
    
    // Get user details
    const userQuery = `
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
      WHERE u."Email" = 'zondis411@gmail.com'
    `;
    
    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('👤 USER DETAILS:');
    console.log(`   Name: ${user.FirstName} ${user.LastName}`);
    console.log(`   Email: ${user.Email}`);
    console.log(`   Role: ${user.Role} (${typeof user.Role})`);
    console.log(`   Status: ${user.Status}`);
    console.log(`   SDP ID: ${user.SkillsDevelopmentProviderId}`);
    console.log(`   Department ID: ${user.DepartmentId}`);
    console.log(`   Client ID: ${user.ClientId}`);
    
    // Apply the same routing logic as Login.tsx
    console.log('\n🔄 ROUTING LOGIC:');
    
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
      routingReason = 'QA Manager (Role 7) - EXPLICIT CHECK';
      console.log('✅ MATCHED: QA Manager (Role 7)');
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
      console.log('✅ MATCHED: SDP Manager Role');
    }
    // Main SDP Admin (role 3 without departmentId)
    else if (
      (normalizedUser.role === '3' || normalizedUser.role === 3) && 
      !normalizedUser.departmentId &&
      (typeof normalizedUser.skillsDevelopmentProviderId === 'number' && normalizedUser.skillsDevelopmentProviderId !== null && normalizedUser.skillsDevelopmentProviderId > 0)
    ) {
      expectedRoute = '/sdp-dashboard';
      routingReason = 'Main SDP Admin';
      console.log('✅ MATCHED: Main SDP Admin');
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
      console.log('✅ MATCHED: Client Admin');
    }
    else {
      expectedRoute = '/dashboard';
      routingReason = 'Default';
      console.log('✅ MATCHED: Default');
    }
    
    console.log(`\n🎯 FINAL ROUTING DECISION:`);
    console.log(`   Expected Route: ${expectedRoute}`);
    console.log(`   Reason: ${routingReason}`);
    
    // Check if this is correct for a manager
    const isManagerRoute = expectedRoute === '/sdp-manager-dashboard';
    console.log(`\n${isManagerRoute ? '✅' : '❌'} RESULT: ${isManagerRoute ? 'CORRECT - Will route to Manager Dashboard' : 'INCORRECT - Will NOT route to Manager Dashboard'}`);
    
    if (user.Role === 7) {
      console.log('\n📋 EXPECTED BEHAVIOR:');
      console.log('   - Role 7 (QA Manager) should route to /sdp-manager-dashboard');
      console.log('   - This user should NOT go to SDP dashboard');
      console.log(`   - Current logic will route to: ${expectedRoute}`);
      console.log(`   - This is ${isManagerRoute ? 'CORRECT' : 'INCORRECT'}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testZondisRouting();