const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'rlms',
  password: '12345',
  port: 5432,
});

async function debugActualLoginRouting() {
  try {
    console.log('=== DEBUGGING ACTUAL LOGIN ROUTING ===\n');
    
    const testUsers = [
      'zondis411@gmail.com',
      'maphangomaphango931@gmail.com', 
      'nkwenkwezi68@gmail.com'
    ];
    
    for (const email of testUsers) {
      console.log(`🔍 Testing: ${email}`);
      
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            password: 'password123'
          })
        });

        if (response.ok) {
          const data = await response.json();
          const user = data.user;
          
          console.log('📊 Raw API Response:');
          console.log(`   Role: ${user.role} (${typeof user.role})`);
          console.log(`   SDP ID: ${user.skillsDevelopmentProviderId || user.SkillsDevelopmentProviderId}`);
          console.log(`   Department ID: ${user.departmentId || user.DepartmentId}`);
          console.log(`   Client ID: ${user.clientId || user.ClientId}`);
          
          // Apply the EXACT same logic as Login.tsx
          const normalizedUser = {
            role: user?.role ?? user?.Role,
            skillsDevelopmentProviderId: user?.skillsDevelopmentProviderId ?? user?.SkillsDevelopmentProviderId,
            departmentId: user?.departmentId ?? user?.DepartmentId,
            clientId: user?.clientId ?? user?.ClientId
          };
          
          console.log('🔄 Normalized User:');
          console.log(`   Role: ${normalizedUser.role} (${typeof normalizedUser.role})`);
          console.log(`   SDP ID: ${normalizedUser.skillsDevelopmentProviderId}`);
          console.log(`   Department ID: ${normalizedUser.departmentId}`);
          console.log(`   Client ID: ${normalizedUser.clientId}`);
          
          // Apply routing logic step by step
          console.log('🎯 Routing Logic:');
          
          if (normalizedUser.role === 7 || normalizedUser.role === '7') {
            console.log('   ✅ MATCHED: QA Manager (Role 7) → /qa-manager-dashboard');
          } else if ((normalizedUser.role === 5 || normalizedUser.role === '5') && normalizedUser.departmentId) {
            console.log('   ✅ MATCHED: Logistics Manager (Role 5 + Dept) → /logistics-manager-dashboard');
          } else if ((normalizedUser.role === 3 || normalizedUser.role === '3') && normalizedUser.departmentId) {
            console.log('   ✅ MATCHED: Admin Manager (Role 3 + Dept) → /admin-manager-dashboard');
          } else {
            console.log('   ❌ NO MATCH: Falling through to other logic...');
            
            const isOtherSDPManager = (
              normalizedUser.role === '4' || normalizedUser.role === 4 ||
              normalizedUser.role === 'SDPIT' ||
              normalizedUser.role === 'SDPAssessor' ||
              normalizedUser.role === 'SDPFacilitator'
            );
            
            const isMainSDPAdmin = (
              (normalizedUser.role === '3' || normalizedUser.role === 3) && 
              !normalizedUser.departmentId &&
              (typeof normalizedUser.skillsDevelopmentProviderId === 'number' && normalizedUser.skillsDevelopmentProviderId !== null && normalizedUser.skillsDevelopmentProviderId > 0)
            );
            
            const isSDPAffiliated = (
              (typeof normalizedUser.skillsDevelopmentProviderId === 'number' && normalizedUser.skillsDevelopmentProviderId !== null && normalizedUser.skillsDevelopmentProviderId > 0) &&
              !isOtherSDPManager && !isMainSDPAdmin
            );
            
            console.log(`   isOtherSDPManager: ${isOtherSDPManager}`);
            console.log(`   isMainSDPAdmin: ${isMainSDPAdmin}`);
            console.log(`   isSDPAffiliated: ${isSDPAffiliated}`);
            
            if (isOtherSDPManager) {
              console.log('   → /sdp-manager-dashboard');
            } else if (isMainSDPAdmin) {
              console.log('   → /sdp-dashboard');
            } else if (isSDPAffiliated) {
              console.log('   → /sdp-dashboard (SDP Affiliated)');
            } else {
              console.log('   → /dashboard (Default)');
            }
          }
          
        } else {
          console.log(`❌ Login failed for ${email}`);
        }
        
      } catch (error) {
        console.log(`❌ Network error for ${email}: ${error.message}`);
      }
      
      console.log('');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

debugActualLoginRouting();