const axios = require('axios');

async function testFrontendLogin() {
    try {
        console.log('🧪 Testing Frontend Login through Proxy Server...');
        
        // Test the login endpoint that the frontend would use
        const loginData = {
            email: 'admin@system.local',
            password: 'Admin@123'
        };

        console.log(`📧 Testing login with: ${loginData.email}`);
        console.log(`🌐 Endpoint: http://localhost:5173/api/auth/login`);
        
        // This simulates what the frontend would call
        const response = await axios.post('http://localhost:5173/api/auth/login', loginData, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Frontend login successful!');
        console.log('🔑 JWT Token received:', response.data.token.substring(0, 50) + '...');
        console.log('👤 User info:', response.data.user);
        
        console.log('\n🎉 Your application is ready to test!');
        console.log('🌐 Open http://localhost:5173 in your browser');
        console.log('📧 Login with: admin@system.local / Admin@123');

    } catch (error) {
        console.error('❌ Frontend login test failed:', error.message);
        
        if (error.response) {
            console.error('📡 Server response:', error.response.status, error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('🔌 Connection refused - frontend server not running');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('⏱️  Request timeout');
        }
    }
}

testFrontendLogin();