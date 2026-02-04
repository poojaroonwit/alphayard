// Migration runner using pg pool
import { pool } from '../src/config/database';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function applyMigrations() {
    const migrationsDir = path.join(__dirname, '../src/database/migrations');
    const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort((a, b) => {
            const numA = parseInt(a.split('_')[0]);
            const numB = parseInt(b.split('_')[0]);
            return numA - numB;
        });

    console.log(`Found ${files.length} migrations.`);

    const client = await pool.connect();
    try {
        // Create migrations table if not exists
        await client.query(`
            CREATE TABLE IF NOT EXISTS migration_history (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);

        for (const file of files) {
            const { rows } = await client.query('SELECT name FROM migration_history WHERE name = $1', [file]);
            
            if (rows.length > 0) {
                console.log(`Skipping ${file} (already applied)`);
                continue;
            }

            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            console.log(`Starting transaction for ${file}...`);
            await client.query('BEGIN');
            try {
                await client.query(sql);
                await client.query('INSERT INTO migration_history (name) VALUES ($1)', [file]);
                await client.query('COMMIT');
                console.log(`✅ ${file} applied successfully.`);
            } catch (err: any) {
                await client.query('ROLLBACK');
                console.error(`❌ Failed to apply ${file}: ${err.message}`);
                if (err.detail) console.error(`   Detail: ${err.detail}`);
                if (err.hint) console.error(`   Hint: ${err.hint}`);
                if (err.where) console.error(`   Where: ${err.where}`);
                if (err.position) {
                    const pos = parseInt(err.position);
                    const start = Math.max(0, pos - 100);
                    const end = Math.min(sql.length, pos + 100);
                    console.error(`   SQL Context: ...${sql.substring(start, end)}...`);
                }
                throw err;
            }
        }
        console.log('All migrations processed.');
    } finally {
        client.release();
        await pool.end();
    }
}

applyMigrations().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
