const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres'
});

async function seedFamily() {
    try {
        const userId = 'c173d2a6-4c0e-4e8b-9458-101b8d0b13a3'; // dev@bondarys.com from previous output
        const familyId = 'f173d2a6-4c0e-4e8b-9458-101b8d0b13a3'; // deterministic ID

        // Check if family exists
        const familyRes = await pool.query('SELECT * FROM families WHERE id = $1', [familyId]);

        if (familyRes.rows.length === 0) {
            console.log('Creating family...');
            await pool.query(`
        INSERT INTO families (id, name, type, description, owner_id, invite_code)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [familyId, 'Dev Family', 'hourse', 'Test Family for Dev', userId, 'ABCDEF']);
        } else {
            console.log('Family already exists.');
        }

        // Check membership
        const memberRes = await pool.query('SELECT * FROM family_members WHERE user_id = $1 AND family_id = $2', [userId, familyId]);

        if (memberRes.rows.length === 0) {
            console.log('Adding user to family...');
            await pool.query(`
        INSERT INTO family_members (family_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, NOW())
      `, [familyId, userId, 'owner']);
        } else {
            console.log('User already in family.');
        }

        console.log('Seeding complete.');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await pool.end();
    }
}

seedFamily();
