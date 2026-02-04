const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function applyMigration() {
  const client = await pool.connect();
  try {
    const migrationPath = path.join(__dirname, '../src/database/migrations/027_refine_entity_types.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('🚀 Applying migration 027...');
    await client.query(sql);
    console.log('✅ Migration 027 applied successfully!');

    // Verification
    const { rows } = await client.query('SELECT name, title, api_endpoint, response_key FROM entity_types WHERE name IN (\'note\', \'todo\', \'circles\', \'users\')');
    console.log('\n📊 Seeding Verification:');
    rows.forEach(r => {
      console.log(`   - [${r.name}] Title: ${r.title}, API: ${r.api_endpoint}, Key: ${r.response_key}`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();
