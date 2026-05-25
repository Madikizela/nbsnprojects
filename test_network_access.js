const axios = require('axios');

// Test both localhost and network IP
const endpoints = [
  'http://localhost:5213/api/auth/login',
  'http://192.168.31.166:5213/api/auth/login'
];

async function testEndpoint(url) {
  console.log(`\nTesting: ${url}`);
  console.log('='.repeat(60));
  
  try {
    const response = await axios.post(url, {
      Email: 'admin@system.local',
      Password: 'Admin@123'
    }, {
      timeout: 5000
    });
    
    console.log('✅ SUCCESS!');
    console.log('Status:', response.status);
    console.log('Token:', response.data.token ? response.data.token.substring(0, 30) + '...' : 'MISSING');
    console.log('User:', response.data.user?.name || 'MISSING');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection refused - backend not running or firewall blocking');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('❌ Connection timeout - network issue or firewall blocking');
    } else if (error.response) {
      console.error('❌ HTTP Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

async function runTests() {
  console.log('Testing Backend Network Access');
  console.log('Current IP: 192.168.31.166');
  console.log('Backend Port: 5213\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('INSTRUCTIONS FOR PHONE:');
  console.log('1. Make sure your phone is on the same WiFi network');
  console.log('2. Update Flutter app to use: http://192.168.31.166:5213');
  console.log('3. If localhost works but network IP fails, run:');
  console.log('   update_firewall_5213.ps1 (as Administrator)');
  console.log('='.repeat(60));
}

runTests();
