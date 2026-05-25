const http = require('http');

function testAPI(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '192.168.68.117',
      port: 5213,
      path: path,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    console.log(`\n🔍 Testing: ${description}`);
    console.log(`   URL: http://192.168.68.117:5213${path}`);

    const req = http.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            console.log(`   ✅ SUCCESS - Response length: ${JSON.stringify(jsonData).length} chars`);
            resolve({ success: true, data: jsonData });
          } catch (e) {
            console.log(`   ✅ SUCCESS - Raw response: ${data.substring(0, 100)}...`);
            resolve({ success: true, data: data });
          }
        } else {
          console.log(`   ❌ ERROR - Status: ${res.statusCode}`);
          console.log(`   Response: ${data}`);
          resolve({ success: false, status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      console.log(`   ❌ NETWORK ERROR: ${e.message}`);
      reject(e);
    });

    req.setTimeout(5000, () => {
      console.log(`   ❌ TIMEOUT`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing Backend API Endpoints...');
  
  try {
    // Test basic endpoints
    await testAPI('/api/Projects', 'Projects Controller');
    await testAPI('/api/AttendanceTracking/projects', 'Attendance Tracking Controller');
    await testAPI('/api/Auth/test', 'Auth Controller (might not exist)');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();