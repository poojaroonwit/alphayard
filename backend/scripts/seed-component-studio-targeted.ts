// Targeted migration runner for Component Studio
import { pool } from '../src/config/database';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function seedComponentStudio() {
    const migrationsDir = path.join(__dirname, '../src/database/migrations');
    const files = ['024_component_studio_baseline.sql', '025_component_studio_seed.sql'];

    const client = await pool.connect();
    try {
        for (const file of files) {
            console.log(`Applying ${file}...`);
            const filePath = path.join(migrationsDir, file);
            if (!fs.existsSync(filePath)) {
                console.error(`File ${file} not found!`);
                continue;
            }
            const sql = fs.readFileSync(filePath, 'utf8');
            
            await client.query('BEGIN');
            try {
                // Split by ';' but be careful with functions
                // For simplicity, just run the whole block
                await client.query(sql);
                await client.query('COMMIT');
                console.log(`✅ ${file} applied successfully.`);
            } catch (err: any) {
                await client.query('ROLLBACK');
                console.error(`❌ Failed to apply ${file}:`, err.message);
                // If it's "already exists", we can ignore if we want, but let's see.
            }
        }
    } finally {
        client.release();
        await pool.end();
    }
}

seedComponentStudio().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
