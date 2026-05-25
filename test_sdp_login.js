const axios = require('axios');

async function testSDPLogin() {
    try {
        console.log('🧪 Testing SDP User Login Flow...');
        
        const loginData = {
            email: 'testsdp@example.com',
            password: 'testpassword123'
        };

        console.log('📋 Login data:', JSON.stringify(loginData, null, 2));
        console.log('🌐 Endpoint: http://localhost:5001/api/auth/login');
        
        const response = await axios.post('http://localhost:5001/api/auth/login', loginData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Login successful!');
        console.log('📊 Response data:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.token) {
            console.log('\n🔑 JWT Token received successfully');
            console.log('👤 User info:');
            console.log(`   Name: ${response.data.user.firstName} ${response.data.user.lastName}`);
            console.log(`   Email: ${response.data.user.email}`);
            console.log(`   User Type: ${response.data.user.userType}`);
            console.log(`   SDP ID: ${response.data.user.skillsDevelopmentProviderId}`);
            
            // Check if user should be redirected to SDP dashboard
            const isSDP = 
                response.data.user.userType === 'SDPAdmin' ||
                (typeof response.data.user.skillsDevelopmentProviderId === 'number' && 
                 response.data.user.skillsDevelopmentProviderId !== null && 
                 response.data.user.skillsDevelopmentProviderId > 0);
            
            console.log('\n🎯 Routing Decision:');
            if (isSDP) {
                console.log('✅ User should be redirected to: /sdp-dashboard');
                console.log('   Reason: SDP user detected');
            } else {
                console.log('❌ User would be redirected to: /dashboard or /client-dashboard');
                console.log('   Reason: Not detected as SDP user');
            }
        }

    } catch (error) {
        console.error('❌ Login failed:', error.message);
        
        if (error.response) {
            console.error('📡 Server response:', error.response.status, error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('🔌 Connection refused - server not running');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('⏱️  Request timeout');
        }
    }
}

testSDPLogin();