#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Setting up Appkit Development Environment');
console.log('================================================');

// Check if we're in the right directory
const currentDir = process.cwd();
const isAdminConsole = currentDir.includes('admin');

if (!isAdminConsole) {
  console.error('❌ Please run this script from the admin directory');
  process.exit(1);
}

console.log('📁 Current directory:', currentDir);

// Check if backend exists
const backendPath = path.join(currentDir, '..', 'backend');
const fs = require('fs');

if (!fs.existsSync(backendPath)) {
  console.error('❌ Backend directory not found. Expected:', backendPath);
  process.exit(1);
}

console.log('✅ Backend directory found');

// Check if backend has package.json
const backendPackageJson = path.join(backendPath, 'package.json');
if (!fs.existsSync(backendPackageJson)) {
  console.error('❌ Backend package.json not found');
  process.exit(1);
}

console.log('✅ Backend package.json found');

// Check if node_modules exists in backend
const backendNodeModules = path.join(backendPath, 'node_modules');
if (!fs.existsSync(backendNodeModules)) {
  console.log('📦 Installing backend dependencies...');
  try {
    execSync('npm install', { cwd: backendPath, stdio: 'inherit' });
    console.log('✅ Backend dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install backend dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Backend dependencies already installed');
}

// Check if admin has node_modules
const adminNodeModules = path.join(currentDir, 'node_modules');
if (!fs.existsSync(adminNodeModules)) {
  console.log('📦 Installing admin console dependencies...');
  try {
    execSync('npm install', { cwd: currentDir, stdio: 'inherit' });
    console.log('✅ Admin console dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install admin console dependencies:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Admin console dependencies already installed');
}

console.log('\n🎯 Development Setup Complete!');
console.log('==============================');
console.log('To start the development environment:');
console.log('');
console.log('1. Start the backend server:');
console.log(`   cd ${backendPath}`);
console.log('   npm run dev');
console.log('');
console.log('2. Start the admin console (in a new terminal):');
console.log(`   cd ${currentDir}`);
console.log('   npm run dev');
console.log('');
console.log('3. Access the admin console at: http://localhost:3000');
console.log('4. Backend API will be available at: http://localhost:3001');
console.log('');
console.log('📝 Note: Make sure your backend server is running before using the admin console.');
console.log('   The admin console will show empty states if the backend is not available.');
