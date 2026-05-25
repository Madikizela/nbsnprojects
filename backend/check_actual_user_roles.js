const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

// Role enum mapping from the C# code
const roleMapping = {
  1: 'SystemAdmin',
  2: 'ClientAdmin', 
  3: 'SDPAdministrator',
  4: 'SDPFinance',
  5: 'SDPLogistics',
  6: 'SDPIT',
  7: 'SDPModerator',
  8: 'SDPAssessor',
  9: 'SDPFacilitator',
  10: 'Learner',
  11: 'FinanceSupport',
  12: 'LogisticsSupport',
  13: 'ITSupport',
  14: 'QualityAssuranceSupport',
  15: 'AdministrationSupport',
  16: 'Teacher'
};

async function checkActualUserRoles() {
  try {
    console.log('=== CHECKING ACTUAL USER ROLES ===\n');
    
    const testUsers = [
      'zondis411@gmail.com',
      'maphangomaphango931@gmail.com', 
      'nkwenkwezi68@gmail.com'
    ];
    
    for (const email of testUsers) {
      const userQuery = `
        SELECT 
          u."FirstName",
          u."LastName", 
          u."Email",
          u."Role",
          u."SkillsDevelopmentProviderId",
          u."DepartmentId",
          u."ClientId",
          d."Name" as "DepartmentName"
        FROM "Users" u 
        LEFT JOIN "Departments" d ON u."DepartmentId" = d."Id"
        WHERE u."Email" = $1 AND u."Status" = 1
      `;
      
      const result = await pool.query(userQuery, [email]);
      
      if (result.rows.length === 0) {
        console.log(`❌ User ${email} not found`);
        continue;
      }
      
      const user = result.rows[0];
      const roleNumber = user.Role;
      const roleName = roleMapping[roleNumber] || 'Unknown';
      
      console.log(`👤 ${user.FirstName} ${user.LastName} (${user.Email})`);
      console.log(`   Role: ${roleNumber} (${roleName})`);
      console.log(`   SDP ID: ${user.SkillsDevelopmentProviderId}`);
      console.log(`   Department ID: ${user.DepartmentId}`);
      console.log(`   Department Name: ${user.DepartmentName}`);
      
      // Determine what this user should be based on their department
      let expectedDashboard = '';
      if (user.DepartmentName && user.DepartmentName.toLowerCase().includes('quality')) {
        expectedDashboard = 'QA Manager Dashboard';
      } else if (user.DepartmentName && user.DepartmentName.toLowerCase().includes('logistic')) {
        expectedDashboard = 'Logistics Manager Dashboard';
      } else if (user.DepartmentName && user.DepartmentName.toLowerCase().includes('admin')) {
        expectedDashboard = 'Admin Manager Dashboard';
      } else {
        expectedDashboard = 'Unknown - check department name';
      }
      
      console.log(`   Expected Dashboard: ${expectedDashboard}`);
      console.log('');
    }
    
    console.log('🔍 ROLE ANALYSIS:');
    console.log('Based on the UserRole enum:');
    console.log('- Role 7 = SDPModerator (not QA Manager!)');
    console.log('- Role 5 = SDPLogistics (correct)');
    console.log('- Role 3 = SDPAdministrator (correct)');
    console.log('');
    console.log('💡 SOLUTION:');
    console.log('The routing logic should be based on DEPARTMENT NAME or a combination of role + department,');
    console.log('not just role numbers, since the role enum doesn\'t have specific manager roles.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkActualUserRoles();