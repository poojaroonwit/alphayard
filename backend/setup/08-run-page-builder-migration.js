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

  console.log('🚀 Page Builder Migration Script');
  console.log('================================\n');

  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const migrationFile = path.join(__dirname, '..', 'src', 'migrations', '013_page_builder.sql');
    
    if (!fs.existsSync(migrationFile)) {
      console.error(`❌ Migration file not found: ${migrationFile}`);
      process.exit(1);
    }

    console.log('📋 Running Page Builder Migration:');
    console.log(`   File: 013_page_builder.sql`);
    
    await applySql(client, migrationFile);
    
    console.log('\n✅ Page Builder migration completed successfully!');
    console.log('\n📊 Created tables:');
    console.log('   - pages');
    console.log('   - page_components');
    console.log('   - component_definitions');
    console.log('   - templates');
    console.log('   - page_versions');
    console.log('   - page_hierarchy');
    console.log('   - publishing_workflows');
    console.log('   - page_audit_log');
    console.log('\n🎨 Inserted default data:');
    console.log('   - 9 component definitions (Container, Grid, Section, Heading, Text, Image, Button, Hero, FeatureGrid)');
    console.log('   - 4 templates (Blank, Landing Page, Blog Post, Product Page)');
    console.log('\n🔧 Created functions:');
    console.log('   - create_page_version()');
    console.log('   - update_page_hierarchy()');
    console.log('   - log_page_audit()');
    console.log('   - check_published_url_uniqueness()');
    console.log('   - auto_publish_scheduled_pages()');
    console.log('   - auto_unpublish_expired_pages()');
    console.log('   - get_page_with_components()');
    console.log('   - duplicate_page()');
    
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
