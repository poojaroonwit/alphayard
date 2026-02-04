import { pool } from '../src/config/database';
async function run() {
    await pool.query("INSERT INTO migration_history (name) VALUES ('003_add_communication_tables.sql') ON CONFLICT DO NOTHING");
    console.log('Done');
    await pool.end();
}
run();
