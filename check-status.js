#!/usr/bin/env node

const http = require('http');
const https = require('https');
require('dotenv').config();

async function checkEndpoint(url, name) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      resolve({ name, status: res.statusCode, ok: res.statusCode === 200 });
    }).on('error', () => {
      resolve({ name, status: 'offline', ok: false });
    });
  });
}

async function checkSupabase() {
  return new Promise((resolve) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return resolve({ name: 'Supabase', status: 'not configured in .env', ok: false });
    }

    const url = supabaseUrl.replace('http://', '').replace('https://', '');
    const isHttps = supabaseUrl.startsWith('https://');
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.split(':')[0],
      port: url.split(':')[1] || (isHttps ? 443 : 80),
      path: '/rest/v1/',
      method: 'GET',
      headers: {
        'apikey': supabaseKey
      },
      timeout: 3000
    };

    client.get(options, (res) => {
      resolve({ name: 'Supabase', status: 'connected', ok: true });
    }).on('error', () => {
      resolve({ name: 'Supabase', status: 'offline (Docker not running?)', ok: false });
    }).on('timeout', () => {
      resolve({ name: 'Supabase', status: 'timeout', ok: false });
    });
  });
}

async function main() {
  console.log('\n🔍 Bondarys System Status Check\n');
  console.log('='.repeat(60) + '\n');

  // Check backend
  const backend = await checkEndpoint('http://localhost:3000/health', 'Backend Server');
  console.log(`${backend.ok ? '✅' : '❌'} ${backend.name}: ${backend.status}`);

  // Check mobile app
  const mobile = await checkEndpoint('http://localhost:8081', 'Mobile App (Metro)');
  console.log(`${mobile.ok ? '✅' : '❌'} ${mobile.name}: ${mobile.status}`);

  // Check marketing API
  const marketing = await checkEndpoint('http://localhost:3000/api/v1/cms/marketing/slides', 'Marketing API');
  console.log(`${marketing.ok ? '✅' : '❌'} ${marketing.name}: ${marketing.status}`);

  // Check Supabase
  const supabase = await checkSupabase();
  console.log(`${supabase.ok ? '✅' : '⚠️ '} ${supabase.name}: ${supabase.status}`);

  console.log('\n' + '='.repeat(60));
  
  const allOk = backend.ok && mobile.ok && marketing.ok;
  const dbOk = supabase.ok;

  if (allOk && dbOk) {
    console.log('\n✅ All systems operational!\n');
    console.log('🎯 You can now:');
    console.log('   • Open http://localhost:8081 in your browser');
    console.log('   • Scan the QR code with Expo Go app');
    console.log('   • Login with: test@bondarys.com / Test123!\n');
  } else if (allOk && !dbOk) {
    console.log('\n⚠️  Apps running, but database not connected\n');
    console.log('🎯 Current status:');
    console.log('   • Backend and mobile app are working');
    console.log('   • Marketing slides use fallback data');
    console.log('   • Login will not work until database is set up\n');
    console.log('💡 To set up database:');
    console.log('   1. Start Docker Desktop');
    console.log('   2. Run: npx supabase start');
    console.log('   3. Update .env with credentials');
    console.log('   4. Run: node backend/setup/10-complete-setup.js\n');
  } else {
    console.log('\n❌ Some services are not running\n');
    console.log('💡 To start the apps:');
    console.log('   Backend: cd backend && npm run dev');
    console.log('   Mobile: cd mobile && npm start\n');
  }
}

main().catch(console.error);
