#!/usr/bin/env node

const https = require('https');
const http = require('http');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    }).on('error', reject);
  });
}

async function testAPIEndpoints() {
  console.log('🧪 Testing Appkit API Endpoints');
  console.log('====================================');
  console.log(`📍 Testing: ${API_BASE_URL}`);
  console.log('');

  const endpoints = [
    { path: '/health', name: 'Health Check' },
    { path: '/api/users', name: 'Mobile App Users' },
    { path: '/api/admin/users', name: 'Admin Console Users' },
    { path: '/api/admin/roles', name: 'Admin Roles' },
    { path: '/api/admin/permissions', name: 'Admin Permissions' },
    { path: '/api/admin/user-groups', name: 'Admin User Groups' },
    { path: '/api/circles', name: 'Families' }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testing ${endpoint.name}...`);
      const result = await makeRequest(`${API_BASE_URL}${endpoint.path}`);
      
      if (result.status === 200) {
        console.log(`✅ ${endpoint.name}: OK (${result.status})`);
        results.push({ ...endpoint, status: 'success', code: result.status });
      } else {
        console.log(`⚠️  ${endpoint.name}: ${result.status} - ${result.data.error || 'Unknown error'}`);
        results.push({ ...endpoint, status: 'warning', code: result.status, error: result.data.error });
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Connection failed - ${error.message}`);
      results.push({ ...endpoint, status: 'error', error: error.message });
    }
  }

  console.log('\n📊 Test Results Summary');
  console.log('======================');
  
  const successful = results.filter(r => r.status === 'success').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Errors: ${errors}`);

  if (errors > 0) {
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Make sure the backend server is running: npm run dev');
    console.log('2. Check if the server is accessible: curl http://localhost:3001/health');
    console.log('3. Verify the admin routes are enabled in backend/src/server.ts');
    console.log('4. Check the backend logs for any errors');
  }

  if (successful === results.length) {
    console.log('\n🎉 All API endpoints are working correctly!');
  } else if (successful > 0) {
    console.log('\n⚠️  Some API endpoints are working, but there may be issues with specific endpoints.');
  } else {
    console.log('\n❌ No API endpoints are working. Please check your backend server setup.');
  }
}

// Run the test
testAPIEndpoints().catch(console.error);

