const http = require('http');

function testLogin() {
    const loginData = JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
    });

    const options = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': loginData.length
        }
    };

    console.log('Testing login with:', loginData);
    console.log('Sending request to: http://localhost:5000/api/auth/login');

    const req = http.request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('Response Body:', data);
            
            try {
                const parsedData = JSON.parse(data);
                console.log('Parsed Response:', parsedData);
            } catch (e) {
                console.log('Raw Response:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('Request Error:', error.message);
        console.error('Full Error:', error);
    });

    req.on('timeout', () => {
        console.error('Request timed out after 10 seconds');
        req.destroy();
    });

    req.setTimeout(10000);
    req.write(loginData);
    req.end();
}

testLogin();