import { pool } from '../src/config/database';
async function run() {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications' ORDER BY ordinal_position");
    console.log('notifications columns:', res.rows);
    await pool.end();
}
run();
