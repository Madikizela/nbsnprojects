const axios = require('axios');

async function testFrontendBackendCommunication() {
    try {
        console.log('🔍 Testing Frontend ↔ Backend Communication...\n');
        
        // Test 1: Direct proxy server connection
        console.log('1️⃣ Testing direct proxy server connection...');
        const directResponse = await axios.post('http://localhost:5001/api/auth/login', {
            email: 'admin@system.local',
            password: 'Admin@123'
        });
        console.log('✅ Direct proxy server: WORKING');
        console.log(`   Status: ${directResponse.status}`);
        console.log(`   Token: ${directResponse.data.token.substring(0, 30)}...`);
        
        // Test 2: Frontend proxy connection
        console.log('\n2️⃣ Testing frontend proxy connection...');
        const frontendResponse = await axios.post('http://localhost:5173/api/auth/login', {
            email: 'admin@system.local',
            password: 'Admin@123'
        }, {
            timeout: 5000,
            validateStatus: function (status) {
                return status < 500; // Don't throw on 4xx errors
            }
        });
        
        if (frontendResponse.status === 200) {
            console.log('✅ Frontend proxy: WORKING');
            console.log(`   Status: ${frontendResponse.status}`);
            console.log(`   Token: ${frontendResponse.data.token.substring(0, 30)}...`);
        } else {
            console.log('❌ Frontend proxy: FAILED');
            console.log(`   Status: ${frontendResponse.status}`);
            console.log(`   Response: ${JSON.stringify(frontendResponse.data)}`);
        }
        
        // Test 3: Check what the frontend is actually calling
        console.log('\n3️⃣ Checking frontend API calls...');
        
        // Test a simple GET request to see if proxy is working
        try {
            const testResponse = await axios.get('http://localhost:5173/api/test', {
                timeout: 3000,
                validateStatus: function (status) {
                    return true; // Accept any status
                }
            });
            console.log('✅ Frontend proxy GET request: RESPONDING');
            console.log(`   Status: ${testResponse.status}`);
        } catch (error) {
            console.log('ℹ️  Frontend proxy GET test: ' + error.message);
        }
        
        console.log('\n📊 Communication Summary:');
        console.log('   Proxy Server (5001): ✅ RUNNING');
        console.log('   Frontend Server (5173): ✅ RUNNING');
        console.log('   Direct Proxy Access: ✅ WORKING');
        console.log('   Frontend Proxy Access: ' + (frontendResponse.status === 200 ? '✅ WORKING' : '❌ FAILED'));
        
        if (frontendResponse.status !== 200) {
            console.log('\n🔧 Troubleshooting Steps:');
            console.log('   1. Check if proxy server is listening on port 5001');
            console.log('   2. Verify frontend vite.config.ts proxy settings');
            console.log('   3. Check browser console for CORS errors');
            console.log('   4. Ensure no firewall blocking port 5001');
        }
        
    } catch (error) {
        console.error('❌ Communication test failed:', error.message);
        if (error.response) {
            console.error('📡 Server response:', error.response.status, error.response.data);
        }
    }
}

testFrontendBackendCommunication();