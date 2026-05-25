const axios = require('axios');

async function testNewClientLogin() {
    try {
        console.log('🧪 Testing Login with New Client Admin Credentials...');
        
        const loginData = {
            email: 'newtestcompany@example.com',
            password: 'ebv3wnqrA1!' // This was generated during registration
        };

        console.log('📋 Login data:', JSON.stringify(loginData, null, 2));
        console.log('🌐 Endpoint: http://localhost:5173/api/auth/login');
        
        const response = await axios.post('http://localhost:5173/api/auth/login', loginData, {
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
            console.log(`   Role: ${response.data.user.role}`);
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

testNewClientLogin();