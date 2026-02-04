import { pool } from '../src/config/database';
import dotenv from 'dotenv';
dotenv.config();

async function verify() {
    try {
        const catRes = await pool.query('SELECT count(*) FROM component_categories');
        const styleRes = await pool.query('SELECT count(*) FROM component_styles');
        console.log(`Categories: ${catRes.rows[0].count}`);
        console.log(`Styles: ${styleRes.rows[0].count}`);
        
        const sample = await pool.query('SELECT name, category_id FROM component_styles LIMIT 5');
        console.log('Sample styles:', sample.rows);
    } catch (err: any) {
        console.error('Verification failed:', err.message);
    } finally {
        await pool.end();
    }
}

verify();
