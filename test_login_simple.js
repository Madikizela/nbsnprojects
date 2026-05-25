const http = require('http');

const postData = JSON.stringify({
    email: 'admin@system.local',
    password: 'Admin@123!System'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Status Message:', res.statusMessage);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response Body:', data);
    });
});

req.on('error', (e) => {
    console.error('Request error:', e);
});

req.write(postData);
req.end();