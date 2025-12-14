const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function addLastLoginColumn() {
    try {
        console.log('Adding last_login column if not exists...');
        await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
    `);
        console.log('Column added or already exists.');

        // Also verify users table structure
        const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
        console.log('Users table columns:');
        cols.rows.forEach(r => console.log(`  - ${r.column_name}: ${r.data_type}`));

    } catch (err) {
        console.error('Failed:', err.message);
    } finally {
        await pool.end();
    }
}

addLastLoginColumn();
