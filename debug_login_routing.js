const axios = require('axios');

async function debugLoginRouting() {
    try {
        console.log('🔍 Debugging SDP Login Routing...');
        
        const loginData = {
            email: 'testsdp@example.com',
            password: 'testpassword123'
        };

        console.log('📋 Testing with credentials:', loginData.email);
        
        const response = await axios.post('http://localhost:5001/api/auth/login', loginData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Login Response Status:', response.status);
        console.log('📊 Raw Response Data:');
        console.log(JSON.stringify(response.data, null, 2));

        // Simulate the exact normalization logic from Login.tsx
        const data = response.data;
        const normalizedUser = {
          id: data.user?.id ?? data.user?.Id,
          firstName: data.user?.firstName ?? data.user?.FirstName,
          lastName: data.user?.lastName ?? data.user?.LastName,
          email: data.user?.email ?? data.user?.Email,
          userType: data.user?.userType ?? data.user?.UserType,
          accessLevel: data.user?.accessLevel ?? data.user?.AccessLevel ?? data.user?.role ?? data.user?.Role ?? 0,
          clientId: data.user?.clientId ?? data.user?.ClientId ?? null,
          clientName: data.user?.clientName ?? data.user?.ClientName ?? null,
          skillsDevelopmentProviderId: data.user?.skillsDevelopmentProviderId ?? data.user?.SkillsDevelopmentProviderId ?? null,
          skillsDevelopmentProviderName: data.user?.skillsDevelopmentProviderName ?? data.user?.SkillsDevelopmentProviderName ?? null,
          departmentId: data.user?.departmentId ?? data.user?.DepartmentId ?? null,
          departmentName: data.user?.departmentName ?? data.user?.DepartmentName ?? null,
        };

        console.log('\n🔄 Normalized User Object:');
        console.log(JSON.stringify(normalizedUser, null, 2));

        // Simulate the exact routing logic from Login.tsx
        const isClient =
          normalizedUser.userType === 'ClientAdmin' ||
          normalizedUser.accessLevel === 3 ||
          (typeof normalizedUser.clientId === 'number' && normalizedUser.clientId !== null && normalizedUser.clientId > 0);

        const isSDP = 
          normalizedUser.userType === 'SDPAdmin' ||
          (typeof normalizedUser.skillsDevelopmentProviderId === 'number' && normalizedUser.skillsDevelopmentProviderId !== null && normalizedUser.skillsDevelopmentProviderId > 0);

        console.log('\n🎯 Routing Logic Analysis:');
        console.log('userType:', normalizedUser.userType);
        console.log('userType === "SDPAdmin":', normalizedUser.userType === 'SDPAdmin');
        console.log('skillsDevelopmentProviderId:', normalizedUser.skillsDevelopmentProviderId);
        console.log('typeof skillsDevelopmentProviderId:', typeof normalizedUser.skillsDevelopmentProviderId);
        console.log('skillsDevelopmentProviderId !== null:', normalizedUser.skillsDevelopmentProviderId !== null);
        console.log('skillsDevelopmentProviderId > 0:', normalizedUser.skillsDevelopmentProviderId > 0);
        
        console.log('\n📍 Route Decision:');
        console.log('isClient:', isClient);
        console.log('isSDP:', isSDP);
        
        if (isSDP) {
          console.log('✅ Should navigate to: /sdp-dashboard');
        } else if (isClient) {
          console.log('🏢 Should navigate to: /client-dashboard');
        } else {
          console.log('⚙️ Should navigate to: /dashboard (SYSTEM ADMIN)');
        }

        // Additional debugging
        console.log('\n🔍 Additional Debug Info:');
        console.log('accessLevel:', normalizedUser.accessLevel);
        console.log('clientId:', normalizedUser.clientId);

    } catch (error) {
        console.error('❌ Login failed:', error.message);
        
        if (error.response) {
            console.error('📡 Server response:', error.response.status, error.response.data);
        }
    }
}

debugLoginRouting();