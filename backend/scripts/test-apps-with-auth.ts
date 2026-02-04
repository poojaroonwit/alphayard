import fetch from 'node-fetch';

async function testWithAuth() {
    try {
        // Login first
        const loginRes = await fetch('http://localhost:3001/api/v1/admin/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@bondarys.com',
                password: 'admin123'
            })
        });

        const loginText = await loginRes.text();
        console.log('Login status:', loginRes.status);
        console.log('Login response:', loginText.substring(0, 200));
        
        if (!loginRes.ok) {
            console.error('Login failed');
            return;
        }

        const loginData = JSON.parse(loginText);
        const token = loginData.token;
        console.log('\n✅ Login successful, token received');

        // Test applications endpoint
        console.log('\nTesting /api/v1/admin/applications...');
        const appsRes = await fetch('http://localhost:3001/api/v1/admin/applications', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Applications status:', appsRes.status);
        const appsText = await appsRes.text();
        console.log('Applications response:', appsText);
        
        if (appsRes.ok) {
            console.log('\n✅ Success!');
            const appsData = JSON.parse(appsText);
            console.log('Data:', JSON.stringify(appsData, null, 2));
        } else {
            console.log('\n❌ Failed');
        }
    } catch (error: any) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testWithAuth();
