const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function run() {
    try {
        await pool.query(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(255);
        `);
        console.log("Added avatar_url column.");
    } catch (e) {
        console.log(e);
    } finally {
        await pool.end();
    }
}
run();
