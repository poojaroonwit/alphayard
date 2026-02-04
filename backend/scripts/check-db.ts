import { pool } from '../src/config/database';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
    try {
        const res = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_name = 'users'");
        console.log('Users table exists:', res.rows[0].count === '1');
        
        const res2 = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_name = 'circles'");
        console.log('Circles table exists:', res2.rows[0].count === '1');

        const res3 = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_name = 'migration_history'");
        console.log('Migration history table exists:', res3.rows[0].count === '1');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
