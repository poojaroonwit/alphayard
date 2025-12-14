#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE key in .env');
    console.log('\nPlease ensure your .env file has:');
    console.log('  SUPABASE_URL=your_supabase_url');
    console.log('  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔧 Creating test user...\n');

  // Test user credentials
  const testUser = {
    email: 'test@bondarys.com',
    password: 'Test123!',
    first_name: 'Test',
    last_name: 'User'
  };

  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', testUser.email)
      .single();

    if (existingUser) {
      console.log('✅ Test user already exists:');
      console.log(`   Email: ${testUser.email}`);
      console.log(`   Password: ${testUser.password}`);
      console.log(`   User ID: ${existingUser.id}\n`);
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(testUser.password, 10);

    // Create user
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

    if (error) {
      console.error('❌ Error creating user:', error.message);
      
      // If table doesn't exist, provide helpful message
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('\n⚠️  The users table does not exist yet.');
        console.log('   Please run the database migrations first:');
        console.log('   node backend/setup/07-bootstrap-core-tables.js\n');
      }
      
      process.exit(1);
    }

    console.log('✅ Test user created successfully!\n');
    console.log('📧 Login Credentials:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Password: ${testUser.password}`);
    console.log(`   User ID: ${newUser.id}\n`);
    console.log('💡 You can now use these credentials to log in to the mobile app.\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message || error);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('❌ Script failed:', e.message || e);
  process.exit(1);
});
