const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    // Note: failing status codes are handled by caller for logging 
                    // but we add a flag.
                    const json = JSON.parse(body);
                    if (res.statusCode >= 400) {
                        json.failed = true;
                        json.statusCode = res.statusCode;
                    }
                    resolve(json);
                } catch (e) {
                    resolve({ failed: true, raw: body, statusCode: res.statusCode });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function run() {
    try {
        console.log("Logging in...");
        const loginRes = await request({
            method: 'POST',
            hostname: 'localhost',
            port: 3000,
            path: '/api/v1/auth/login',
            headers: { 'Content-Type': 'application/json' }
        }, {
            email: 'dev@bondarys.com',
            password: 'Development123!'
        });

        if (loginRes.failed) {
            console.error("Login failed:", JSON.stringify(loginRes, null, 2));
            return;
        }

        console.log("Login Success!");
        const token = loginRes.token || loginRes.accessToken || (loginRes.data && (loginRes.data.token || loginRes.data.accessToken));
        const user = loginRes.user || (loginRes.data && loginRes.data.user);

        if (!token || !user) {
            console.error("Missing token or user in response.", JSON.stringify(loginRes, null, 2));
            return;
        }

        console.log("User ID:", user.id);
        let familyId = user.familyId || user.family_id;
        if (!familyId) {
            // Fallback to seeded family ID
            familyId = 'f173d2a6-4c0e-4e8b-9458-101b8d0b13a3';
            console.log("Using fallback Family ID:", familyId);
        } else {
            console.log("Family ID from user:", familyId);
        }

        if (familyId) {
            console.log("\nFetching chats for family:", familyId);
            // Correct endpoint: /families/:familyId/rooms
            const chatsRes = await request({
                method: 'GET',
                hostname: 'localhost',
                port: 3000,
                path: `/api/v1/chat/families/${familyId}/rooms`,
                headers: { 'Authorization': `Bearer ${token}` }
            });

            console.log("Get Chats Result:", JSON.stringify(chatsRes, null, 2));

            if (chatsRes.failed) {
                console.log("Failed to get chats.");
                return;
            }

            let chatId;
            let chats = chatsRes.data || (Array.isArray(chatsRes) ? chatsRes : []);

            if (chats.length > 0) {
                chatId = chats[0].id;
                console.log("Found existing chat:", chatId);
            } else {
                console.log("\nCreating 'General' chat...");
                const createRes = await request({
                    method: 'POST',
                    hostname: 'localhost',
                    port: 3000,
                    path: `/api/v1/chat/families/${familyId}/rooms`,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }, {
                    name: "General",
                    type: "hourse"
                });
                console.log("Create Chat Result:", JSON.stringify(createRes, null, 2));
                if (!createRes.failed) {
                    chatId = (createRes.data && createRes.data.id) || createRes.id;
                }
            }

            if (chatId) {
                console.log("\nSending message to chat:", chatId);
                const msgRes = await request({
                    method: 'POST',
                    hostname: 'localhost',
                    port: 3000,
                    path: `/api/v1/chat/rooms/${chatId}/messages`,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }, {
                    content: "Hello from test script!",
                    type: "text"
                });
                console.log("Send Message Result:", JSON.stringify(msgRes, null, 2));

                console.log("\nFetching messages...");
                const msgsRes = await request({
                    method: 'GET',
                    hostname: 'localhost',
                    port: 3000,
                    path: `/api/v1/chat/rooms/${chatId}/messages`,
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log("Get Messages Result:", JSON.stringify(msgsRes, null, 2));
            }

        }
    } catch (e) {
        console.error("Script error:", e);
    }
}

run();
