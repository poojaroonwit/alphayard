const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function createDevUser() {
    try {
        const email = 'dev@bondarys.com';
        const passwordRaw = 'Development123!';
        const hashedPassword = await bcrypt.hash(passwordRaw, 10);
        // Use the ID used in seed_family.js
        const userId = 'c173d2a6-4c0e-4e8b-9458-101b8d0b13a3';

        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userRes.rows.length === 0) {
            console.log("Creating user...", userId);
            await pool.query(`
                INSERT INTO users (id, email, password, first_name, last_name, is_email_verified, is_onboarding_complete)
                VALUES ($1, $2, $3, 'Dev', 'User', true, true)
            `, [userId, email, hashedPassword]);
        } else {
            console.log("User exists. Updating password...");
            await pool.query(`
                UPDATE users SET password = $1, is_email_verified = true, is_onboarding_complete = true 
                WHERE email = $2
            `, [hashedPassword, email]);
        }

        console.log("User setup complete.");

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

createDevUser();
