const https = require('https');

const API_BASE = 'http://192.168.0.53:5213';

async function makeRequest(path, method = 'GET', body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_BASE + path);
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const lib = url.protocol === 'https:' ? require('https') : require('http');
        const req = lib.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(data)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function testLearnerMaterials() {
    console.log('🔍 Testing Learner Materials API\n');
    console.log('=' .repeat(60));

    try {
        // Step 1: Login as learner
        console.log('\n📝 Step 1: Login as learner...');
        const loginResponse = await makeRequest('/api/Auth/learner-login', 'POST', {
            Login: 'nbsnprojects@gmail.com',
            Password: 'B,.:x!:t6QXe'
        });

        if (loginResponse.status !== 200) {
            console.error('❌ Login failed:', loginResponse.data);
            return;
        }

        const { token, user } = loginResponse.data;
        console.log('✅ Login successful');
        console.log(`   Learner ID: ${user.id}`);
        console.log(`   Learner Name: ${user.name} ${user.surname}`);
        console.log(`   Token: ${token.substring(0, 20)}...`);

        // Step 2: Fetch learner materials
        console.log('\n📚 Step 2: Fetching study materials...');
        const materialsResponse = await makeRequest(
            `/api/LearningMaterials/learner/${user.id}/materials`,
            'GET',
            null,
            token
        );

        if (materialsResponse.status !== 200) {
            console.error('❌ Failed to fetch materials:', materialsResponse.data);
            return;
        }

        const materials = materialsResponse.data;
        console.log(`✅ Materials fetched: ${materials.length} item(s)`);

        if (materials.length === 0) {
            console.log('⚠️  No materials found for this learner');
            return;
        }

        // Step 3: Display materials
        console.log('\n📋 Study Materials:');
        console.log('=' .repeat(60));
        materials.forEach((material, index) => {
            console.log(`\n${index + 1}. ${material.title}`);
            console.log(`   ID: ${material.id}`);
            console.log(`   Type: ${material.materialType}`);
            console.log(`   Qualification: ${material.qualificationName || 'N/A'}`);
            console.log(`   Unit Standard: ${material.unitStandardName || 'N/A'}`);
            console.log(`   File: ${material.fileName || 'N/A'}`);
            console.log(`   Size: ${formatFileSize(material.fileSize)}`);
            console.log(`   MIME: ${material.mimeType || 'N/A'}`);
            if (material.description) {
                console.log(`   Description: ${material.description}`);
            }
        });

        // Step 4: Test download endpoint
        console.log('\n🔽 Step 3: Testing download capability...');
        const firstMaterial = materials[0];
        const downloadResponse = await makeRequest(
            `/api/LearningMaterials/${firstMaterial.id}/download`,
            'GET',
            null,
            token
        );

        if (downloadResponse.status === 200) {
            console.log(`✅ Download endpoint accessible for: ${firstMaterial.fileName}`);
        } else {
            console.log(`❌ Download failed with status: ${downloadResponse.status}`);
        }

        console.log('\n' + '=' .repeat(60));
        console.log('✅ All tests completed successfully!');

    } catch (error) {
        console.error('\n❌ Error during test:', error.message);
    }
}

function formatFileSize(bytes) {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Run the test
testLearnerMaterials();
