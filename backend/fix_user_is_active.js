// Fix existing users with is_active = NULL or false
// Run this script with: node fix_user_is_active.js

require('dotenv').config();
const { Pool } = require('pg');

async function fixUserIsActive() {
    // Use environment variables directly like the main app
    const config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    };

    // If DATABASE_URL is provided, use it instead
    if (process.env.DATABASE_URL) {
        config.connectionString = process.env.DATABASE_URL;
    }

    const pool = new Pool(config);

    try {
        console.log('Connecting to database...');
        console.log('Host:', config.host, 'Database:', config.database);

        // Update users where is_active is NULL or false
        const result = await pool.query(`
      UPDATE public.users 
      SET is_active = true 
      WHERE is_active IS NULL OR is_active = false
    `);

        console.log(`✅ Updated ${result.rowCount} users to is_active=true`);

        // Verify the update
        const verification = await pool.query(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active,
             SUM(CASE WHEN is_active IS NULL OR is_active = false THEN 1 ELSE 0 END) as inactive
      FROM public.users
    `);

        console.log('User status summary:');
        console.log(`  - Total users: ${verification.rows[0].total}`);
        console.log(`  - Active users: ${verification.rows[0].active}`);
        console.log(`  - Inactive users: ${verification.rows[0].inactive}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await pool.end();
        console.log('Database connection closed.');
    }
}

fixUserIsActive();
