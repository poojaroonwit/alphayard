const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function addMissingColumns() {
    try {
        console.log('Adding missing columns to users table...');

        // Add is_onboarding_complete column
        await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_onboarding_complete BOOLEAN DEFAULT false;
    `);

        // Add refresh_tokens column
        await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_tokens TEXT[] DEFAULT '{}';
    `);

        // Add email_verified_at column  
        await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_code VARCHAR(10);
    `);

        await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expiry TIMESTAMP;
    `);

        console.log('Columns added successfully.');

        // Update dev user
        const result = await pool.query(
            "UPDATE users SET is_onboarding_complete = true, is_email_verified = true WHERE email = 'dev@bondarys.com' RETURNING email, is_onboarding_complete"
        );

        if (result.rows.length > 0) {
            console.log('Updated user:', result.rows[0]);
        } else {
            console.log('No user found with email dev@bondarys.com');
        }

    } catch (err) {
        console.error('Failed:', err.message);
    } finally {
        await pool.end();
    }
}

addMissingColumns();
