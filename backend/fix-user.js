const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
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

        // Create new family
        console.log('Creating new family...');
        const familyRes = await pool.query(`
      INSERT INTO families (name, created_at, updated_at)
      VALUES ($1, NOW(), NOW())
      RETURNING *
    `, ['Dev Family']);
        const family = familyRes.rows[0];
        console.log(`Family created: ${family.id}`);

        // Insert into family_members
        console.log('Linking user to family...');
        try {
            await pool.query(`
          INSERT INTO family_members (user_id, family_id, role)
          VALUES ($1, $2, 'owner')
        `, [user.id, family.id]);
            console.log('Linked with role "owner"');
        } catch (e) {
            console.log('Failed to link:', e.message);
            // Maybe try without role?
            try {
                await pool.query(`
              INSERT INTO family_members (user_id, family_id)
              VALUES ($1, $2)
            `, [user.id, family.id]);
                console.log('Linked without role');
            } catch (e2) {
                console.log('Failed again:', e2.message);
            }
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

fixUserData();
