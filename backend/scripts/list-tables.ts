import { pool } from '../src/config/database';
import dotenv from 'dotenv';
dotenv.config();

async function listTables() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
        res.rows.forEach(r => console.log(r.table_name));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

listTables();
