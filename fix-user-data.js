const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'bondarys_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432'),
});

async function fixUserData() {
    try {
        const email = 'dev@bondarys.com';
        console.log(`Fixing data for user: ${email}`);

        // Find User
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            console.log('User not found! Please register first.');
            return;
        }
        const user = userRes.rows[0];
        console.log(`User found: ${user.id}`);

        // Check if user has family
        const familyIds = user.family_ids || [];
        if (familyIds.length > 0) {
            console.log('User already has family:', familyIds);
            return;
        }

        console.log('User has no family. Creating one...');
        const familyRes = await pool.query(`
      INSERT INTO families (name, created_at, updated_at)
      VALUES ($1, NOW(), NOW())
      RETURNING *
    `, ['Dev Family']);
        const family = familyRes.rows[0];
        console.log(`Family created: ${family.id}`);

        // Update User
        await pool.query(`
      UPDATE users 
      SET family_ids = array_append(COALESCE(family_ids, '{}'), $1)
      WHERE id = $2
    `, [family.id, user.id]);

        console.log('User updated with family ID.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

fixUserData();
