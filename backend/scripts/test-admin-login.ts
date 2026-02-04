import fetch from 'node-fetch';

async function testAdminLogin() {
    try {
        const response = await fetch('http://localhost:3001/api/v1/admin/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'admin@bondarys.com',
                password: 'admin123'
            })
        });

        const data = await response.json();
        
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));
        
        if (response.ok) {
            console.log('\n✅ Login successful!');
            console.log('Token:', data.token?.substring(0, 50) + '...');
            console.log('User:', data.user);
        } else {
            console.log('\n❌ Login failed');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testAdminLogin();
