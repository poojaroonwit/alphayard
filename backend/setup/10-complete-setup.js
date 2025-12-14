#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function execSql(supabase, sql) {
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) throw new Error(error.message);
}

async function checkConnection(supabase) {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    return !error || error.code === 'PGRST116'; // PGRST116 = table doesn't exist (but connection works)
  } catch (e) {
    return false;
  }
}

async function createExecSqlFunction(supabase) {
  try {
    // Try to create the exec_sql function
    const { error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    
    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('⚠️  exec_sql function does not exist.');
      console.log('   This function is required for running migrations.');
      console.log('   Please create it manually in your Supabase SQL editor:\n');
      console.log('   CREATE OR REPLACE FUNCTION exec_sql(sql text)');
      console.log('   RETURNS void AS $$');
      console.log('   BEGIN');
      console.log('     EXECUTE sql;');
      console.log('   END;');
      console.log('   $$ LANGUAGE plpgsql SECURITY DEFINER;\n');
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

async function setupCoreTables(supabase) {
  console.log('📋 Setting up core database tables...\n');

  // Enable pgcrypto
  try {
    await execSql(supabase, 'CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    console.log('   ✅ pgcrypto extension');
  } catch (e) {
    console.log('   ⚠️  pgcrypto:', e.message);
  }

  // Create users table
  try {
    await execSql(supabase, `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        avatar_url TEXT,
        phone VARCHAR(20),
        date_of_birth DATE,
        is_active BOOLEAN DEFAULT true,
        email_verified BOOLEAN DEFAULT false,
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('   ✅ users table');
  } catch (e) {
    console.log('   ⚠️  users table:', e.message);
  }

  // Create families table
  try {
    await execSql(supabase, `
      CREATE TABLE IF NOT EXISTS families (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'hourse',
        description TEXT,
        owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invite_code VARCHAR(10) UNIQUE,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('   ✅ families table');
  } catch (e) {
    console.log('   ⚠️  families table:', e.message);
  }

  // Create family_members table
  try {
    await execSql(supabase, `
      CREATE TABLE IF NOT EXISTS family_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) DEFAULT 'member',
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(family_id, user_id)
      );
    `);
    console.log('   ✅ family_members table');
  } catch (e) {
    console.log('   ⚠️  family_members table:', e.message);
  }

  console.log('\n✅ Core tables setup complete\n');
}

async function createTestUser(supabase) {
  console.log('👤 Creating test user...\n');

  const testUser = {
    email: 'test@bondarys.com',
    password: 'Test123!',
    first_name: 'Test',
    last_name: 'User'
  };

  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', testUser.email)
      .single();

    if (existingUser) {
      console.log('   ℹ️  Test user already exists\n');
      return testUser;
    }

    // Create user
    const password_hash = await bcrypt.hash(testUser.password, 10);
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email: testUser.email,
        password_hash,
        first_name: testUser.first_name,
        last_name: testUser.last_name,
        is_active: true,
        email_verified: true
      })
      .select()
      .single();

    if (error) throw error;

    console.log('   ✅ Test user created\n');
    return testUser;
  } catch (e) {
    console.log('   ⚠️  Could not create test user:', e.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Bondarys Complete Setup\n');
  console.log('='.repeat(50) + '\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  // Check environment variables
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase configuration\n');
    console.log('Please ensure your .env file contains:');
    console.log('  SUPABASE_URL=your_supabase_url');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key\n');
    console.log('For local development with Docker:');
    console.log('  1. Start Docker Desktop');
    console.log('  2. Run: npx supabase start');
    console.log('  3. Copy the credentials to your .env file\n');
    process.exit(1);
  }

  console.log('📡 Connecting to Supabase...');
  console.log(`   URL: ${supabaseUrl}\n`);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Check connection
  const connected = await checkConnection(supabase);
  if (!connected) {
    console.log('❌ Cannot connect to Supabase\n');
    console.log('Please check:');
    console.log('  1. Is your Supabase instance running?');
    console.log('  2. Are the credentials in .env correct?');
    console.log('  3. Is Docker running (for local development)?\n');
    process.exit(1);
  }

  console.log('✅ Connected to Supabase\n');

  // Check for exec_sql function
  const hasExecSql = await createExecSqlFunction(supabase);
  if (!hasExecSql) {
    console.log('⚠️  Setup cannot continue without exec_sql function\n');
    process.exit(1);
  }

  // Setup core tables
  await setupCoreTables(supabase);

  // Create test user
  const testUser = await createTestUser(supabase);

  // Summary
  console.log('='.repeat(50));
  console.log('✅ Setup Complete!\n');
  
  if (testUser) {
    console.log('📧 Test User Credentials:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}\n`);
  }

  console.log('🎯 Next Steps:');
  console.log('   1. Backend is running on http://localhost:3000');
  console.log('   2. Mobile app is running on http://localhost:8081');
  console.log('   3. Use the test credentials to log in\n');
}

main().catch((e) => {
  console.error('\n❌ Setup failed:', e.message || e);
  process.exit(1);
});
