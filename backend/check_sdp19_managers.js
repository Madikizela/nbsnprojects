const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function checkSDP19Managers() {
  try {
    console.log('=== CHECKING SDP 19 MANAGERS ===\n');
    
    const managersQuery = `
      SELECT 
        u."Id",
        u."FirstName",
        u."LastName", 
        u."Email",
        u."Role",
        u."SkillsDevelopmentProviderId",
        u."DepartmentId",
        u."ClientId"
      FROM "Users" u 
      WHERE u."SkillsDevelopmentProviderId" = 19
        AND u."Status" = 1
      ORDER BY u."Role"
    `;
    
    const result = await pool.query(managersQuery);
    
    console.log(`Found ${result.rows.length} users in SDP 19:\n`);
    
    for (const user of result.rows) {
      console.log(`👤 ${user.FirstName} ${user.LastName} (${user.Email})`);
      console.log(`   Role: ${user.Role}`);
      console.log(`   Department ID: ${user.DepartmentId}`);
      
      // Apply current routing logic
      let expectedRoute = '';
      if (user.Role === 7) {
        expectedRoute = '/sdp-manager-dashboard';
      } else if ([3, 4, 5].includes(user.Role) && user.DepartmentId) {
        expectedRoute = '/sdp-manager-dashboard';
      } else if (user.Role === 3 && !user.DepartmentId) {
        expectedRoute = '/sdp-dashboard';
      } else {
        expectedRoute = '/sdp-dashboard';
      }
      
      console.log(`   🎯 Routes to: ${expectedRoute}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkSDP19Managers();