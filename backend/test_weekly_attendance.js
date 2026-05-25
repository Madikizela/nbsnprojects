const http = require('http');

function testWeeklyAttendanceAPI() {
  // Test the weekly attendance endpoint
  // Project ID: 3 (Masakhane), Class ID: 4 (Class A)
  const options = {
    hostname: '192.168.68.117',
    port: 5213,
    path: '/api/AttendanceTracking/project/3/class/4/learners/weekly',
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  };

  console.log('🔍 Testing Weekly Attendance API...');
  console.log(`   URL: http://192.168.68.117:5213${options.path}`);

  const req = http.request(options, (res) => {
    console.log(`   Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Weekly Attendance API Response:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
  });

  req.end();
}

testWeeklyAttendanceAPI();