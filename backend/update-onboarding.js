const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function updateOnboarding() {
    try {
        const result = await pool.query(
            "UPDATE users SET is_onboarding_complete = true WHERE email = 'dev@bondarys.com' RETURNING email, is_onboarding_complete"
        );
        if (result.rows.length > 0) {
            console.log('Updated user:', result.rows[0]);
        } else {
            console.log('No user found with email dev@bondarys.com');
        }
    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        await pool.end();
    }
}

updateOnboarding();
