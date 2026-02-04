import fetch from 'node-fetch';

async function testApplicationsEndpoint() {
    try {
        // First login to get a valid token
        const loginRes = await fetch('http://localhost:3001/api/v1/admin/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@bondarys.com',
                password: 'admin123'
            })
        });

        const loginData: any = await loginRes.json();
        
        if (!loginRes.ok) {
            console.error('Login failed:', loginData);
            return;
        }

        console.log('✅ Login successful');
        const token = loginData.token;

        // Now test applications endpoint
        const appsRes = await fetch('http://localhost:3001/api/v1/admin/applications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('\nApplications endpoint status:', appsRes.status);
        
        const appsData = await appsRes.text();
        console.log('Response:', appsData);
        
        if (appsRes.ok) {
            console.log('\n✅ Applications fetched successfully');
            const parsed = JSON.parse(appsData);
            console.log('Applications:', JSON.stringify(parsed, null, 2));
        } else {
            console.log('\n❌ Applications fetch failed');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testApplicationsEndpoint();
