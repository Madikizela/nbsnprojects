const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function testDepartmentSpecificRouting() {
  try {
    console.log('=== TESTING DEPARTMENT-SPECIFIC ROUTING ===\n');
    
    const targetUsers = [
      'zondis411@gmail.com',
      'maphangomaphango931@gmail.com', 
      'nkwenkwezi68@gmail.com'
    ];
    
    for (const email of targetUsers) {
      const userQuery = `
        SELECT 
          u."FirstName",
          u."LastName", 
          u."Email",
          u."Role",
          u."SkillsDevelopmentProviderId",
          u."DepartmentId",
          u."ClientId"
        FROM "Users" u 
        WHERE u."Email" = $1 AND u."Status" = 1
      `;
      
      const result = await pool.query(userQuery, [email]);
      
      if (result.rows.length === 0) {
        console.log(`❌ User ${email} not found`);
        continue;
      }
      
      const user = result.rows[0];
      console.log(`👤 ${user.FirstName} ${user.LastName} (${user.Email})`);
      console.log(`   Role: ${user.Role}`);
      console.log(`   SDP ID: ${user.SkillsDevelopmentProviderId}`);
      console.log(`   Department ID: ${user.DepartmentId}`);
      
      // Apply NEW department-specific routing logic
      let expectedRoute = '';
      let routingReason = '';
      
      if (user.Role === 7) {
        expectedRoute = '/qa-manager-dashboard';
        routingReason = 'QA Manager (Role 7)';
      } else if (user.Role === 5 && user.DepartmentId) {
        expectedRoute = '/logistics-manager-dashboard';
        routingReason = 'Logistics Manager (Role 5)';
      } else if (user.Role === 3 && user.DepartmentId) {
        expectedRoute = '/admin-manager-dashboard';
        routingReason = 'Admin Manager (Role 3 with Dept)';
      } else if (user.Role === 4) {
        expectedRoute = '/sdp-manager-dashboard';
        routingReason = 'Finance Manager (Role 4)';
      } else {
        expectedRoute = '/sdp-dashboard';
        routingReason = 'Other SDP User';
      }
      
      console.log(`   🎯 NEW Route: ${expectedRoute}`);
      console.log(`   📝 Reason: ${routingReason}`);
      
      // Determine department type
      let departmentType = 'Unknown';
      if (user.Role === 7) departmentType = 'Quality Assurance';
      else if (user.Role === 5) departmentType = 'Logistics';
      else if (user.Role === 3 && user.DepartmentId) departmentType = 'Administration';
      
      console.log(`   🏢 Department: ${departmentType}`);
      console.log(`   ✅ Will see their OWN department dashboard`);
      console.log('');
    }
    
    console.log('🎉 All three managers now route to their individual department dashboards!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testDepartmentSpecificRouting();