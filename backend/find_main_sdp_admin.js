const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function findMainSDPAdmin() {
  try {
    console.log('=== FINDING MAIN SDP ADMINISTRATOR ===\n');
    
    // Get all users with SDP IDs
    const sdpUsersQuery = `
      SELECT 
        u."Id",
        u."FirstName",
        u."LastName", 
        u."Email",
        u."Role",
        u."Status",
        u."SkillsDevelopmentProviderId",
        u."DepartmentId",
        u."ClientId",
        u."CreatedAt"
      FROM "Users" u 
      WHERE u."SkillsDevelopmentProviderId" IS NOT NULL
        AND u."Status" = 1
      ORDER BY u."Role", u."CreatedAt"
    `;
    
    const sdpResult = await pool.query(sdpUsersQuery);
    
    console.log(`Found ${sdpResult.rows.length} users with SDP IDs:\n`);
    
    const sdpGroups = {};
    
    for (const user of sdpResult.rows) {
      const sdpId = user.SkillsDevelopmentProviderId;
      if (!sdpGroups[sdpId]) {
        sdpGroups[sdpId] = [];
      }
      sdpGroups[sdpId].push(user);
    }
    
    for (const [sdpId, users] of Object.entries(sdpGroups)) {
      console.log(`🏢 SDP ID ${sdpId} (${users.length} users):`);
      console.log('─'.repeat(50));
      
      let mainAdmin = null;
      let departmentManagers = [];
      
      for (const user of users) {
        console.log(`👤 ${user.FirstName} ${user.LastName} (${user.Email})`);
        console.log(`   Role: ${user.Role}`);
        console.log(`   Department ID: ${user.DepartmentId}`);
        console.log(`   Client ID: ${user.ClientId}`);
        console.log(`   Created: ${new Date(user.CreatedAt).toLocaleDateString()}`);
        
        // Identify potential main admin
        if (user.Role === 3) {
          if (!user.DepartmentId) {
            mainAdmin = user;
            console.log(`   🎯 POTENTIAL MAIN SDP ADMIN (Role 3, No Department)`);
          } else {
            departmentManagers.push(user);
            console.log(`   👥 DEPARTMENT MANAGER (Role 3, Has Department)`);
          }
        } else {
          departmentManagers.push(user);
          console.log(`   👥 DEPARTMENT MANAGER (Role ${user.Role})`);
        }
        console.log('');
      }
      
      console.log(`📋 Summary for SDP ${sdpId}:`);
      if (mainAdmin) {
        console.log(`   ✅ Main Admin: ${mainAdmin.FirstName} ${mainAdmin.LastName} (${mainAdmin.Email})`);
        console.log(`      Should route to: /sdp-dashboard`);
      } else {
        console.log(`   ⚠️  No clear main admin found`);
        console.log(`      All Role 3 users have department IDs`);
        console.log(`      Consider designating one as main admin by removing their department ID`);
      }
      console.log(`   👥 Department Managers: ${departmentManagers.length}`);
      departmentManagers.forEach(mgr => {
        console.log(`      - ${mgr.FirstName} ${mgr.LastName} (Role ${mgr.Role}) → /sdp-manager-dashboard`);
      });
      console.log('');
    }
    
    // Check if there are any Role 3 users without SDP IDs (might be system admins)
    const systemAdminsQuery = `
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
        AND u."SkillsDevelopmentProviderId" IS NULL
        AND u."Status" = 1
    `;
    
    const systemResult = await pool.query(systemAdminsQuery);
    
    if (systemResult.rows.length > 0) {
      console.log(`🔧 SYSTEM ADMINISTRATORS (Role 3, No SDP ID):`);
      console.log('─'.repeat(50));
      for (const user of systemResult.rows) {
        console.log(`👤 ${user.FirstName} ${user.LastName} (${user.Email})`);
        console.log(`   Should route to: /dashboard (system admin)`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

findMainSDPAdmin();