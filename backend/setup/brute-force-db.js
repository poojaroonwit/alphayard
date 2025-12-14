const { Client } = require('pg');

const passwords = [
    'postgres',
    'supabase',
    'password',
    'admin',
    'root',
    'your-super-secret-and-long-postgres-password',
    'bondarys'
];

async function main() {
    console.log('🔍 Testing passwords on 127.0.0.1:54322...');

    for (const pass of passwords) {
        const client = new Client({
            user: 'postgres',
            host: '127.0.0.1',
            database: 'postgres',
            password: pass,
            port: 54322,
        });

        try {
            await client.connect();
            console.log(`✅ SUCCESS! Password is: "${pass}"`);
            await client.end();
            process.exit(0);
        } catch (err) {
            console.log(`❌ Failed: "${pass}" - ${err.message}`);
        }
    }

    console.log('🔴 All passwords failed.');
    process.exit(1);
}

main();
