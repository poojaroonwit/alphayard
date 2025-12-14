#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Load root .env (if present)
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
} catch (_) {}

function readSqlFile(filePath) {
  let sql = fs.readFileSync(filePath, 'utf8');
  // Remove common psql meta-commands which are not understood by Postgres protocol
  sql = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('\\'))
    .join('\n');
  return sql;
}

async function applySql(client, filePath) {
  const sql = readSqlFile(filePath);
  process.stdout.write(`\n📄 Running: ${path.basename(filePath)}\n`);
  process.stdout.write(`   📊 File size: ${sql.length} characters\n`);
  await client.query(sql);
  process.stdout.write('   ✅ Migration applied\n');
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set.');
    console.error('Please set DATABASE_URL in your .env file');
    console.error('Example: DATABASE_URL=postgresql://user:password@localhost:5432/database');
    process.exit(1);
  }

  console.log('🚀 App Configuration Migration Script');
  console.log('====================================\n');

  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const migrationFile = path.join(__dirname, '..', 'src', 'migrations', '014_app_configuration.sql');
    
    if (!fs.existsSync(migrationFile)) {
      console.error(`❌ Migration file not found: ${migrationFile}`);
      process.exit(1);
    }

    console.log('📋 Running App Configuration Migration:');
    console.log(`   File: 014_app_configuration.sql`);
    
    await applySql(client, migrationFile);
    
    console.log('\n✅ App Configuration migration completed successfully!');
    console.log('\n📊 Created tables:');
    console.log('   - app_configuration');
    console.log('   - app_screens');
    console.log('   - app_themes');
    console.log('   - app_assets');
    console.log('   - app_feature_flags');
    console.log('\n🎨 Inserted default data:');
    console.log('   - App configuration (app name, version, timeouts, branding)');
    console.log('   - Screen configs (login, splash, onboarding)');
    console.log('   - Default theme (colors, fonts, spacing)');
    console.log('   - Default assets (logos, backgrounds, onboarding images)');
    console.log('   - Feature flags (social login, biometric auth, dark mode, etc.)');
    console.log('\n🔒 Security:');
    console.log('   - Row Level Security (RLS) enabled');
    console.log('   - Public read access for all config tables');
    console.log('   - Authenticated write access');
    console.log('\n🎉 Your mobile app can now fetch dynamic configuration!');
    
  } catch (err) {
    console.error(`\n❌ Error running migration: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((e) => { 
  console.error(e); 
  process.exit(1); 
});
