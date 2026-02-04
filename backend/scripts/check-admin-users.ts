import { pool } from '../src/config/database';
async function run() {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'admin_users' ORDER BY ordinal_position");
    console.log('admin_users columns:', res.rows);
    await pool.end();
}
run();
