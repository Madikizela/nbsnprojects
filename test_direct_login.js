const axios = require('axios');

async function testDirectLogin() {
    try {
        console.log('🧪 Testing Direct Login to PostgreSQL Proxy Server...');
        
        const loginData = {
            email: 'newtestcompany@example.com',
            password: 'c05hs5uqA1!' // Updated to match admin credentials returned by registration
        };

        console.log('📋 Login data:', JSON.stringify(loginData, null, 2));
        console.log('🌐 Direct endpoint: http://localhost:5001/api/auth/login');
        
        const response = await axios.post('http://localhost:5001/api/auth/login', loginData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Direct login successful!');
        console.log('📊 Response data:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.token) {
            console.log('\n🔑 JWT Token received successfully');
            console.log('👤 User info:');
            console.log(`   Name: ${response.data.user.firstName} ${response.data.user.lastName}`);
            console.log(`   Email: ${response.data.user.email}`);
            console.log(`   Role: ${response.data.user.userType}`);
            if (typeof response.data.user.clientId !== 'undefined') {
                console.log(`   ClientId: ${response.data.user.clientId}`);
            }
        }

    } catch (error) {
        console.error('❌ Direct login failed:', error.message);
        
        if (error.response) {
            console.error('📡 Server response:', error.response.status, error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('🔌 Connection refused - PostgreSQL proxy server not running');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('⏱️  Request timeout');
        }
    }
}

testDirectLogin();