import { pool } from '../src/config/database';

async function checkAdminSchema() {
    try {
        // Check admin_users columns
        const cols = await pool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'admin_users' 
            ORDER BY ordinal_position
        `);
        
        console.log('admin_users columns:');
        cols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type} ${r.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`));
        
        // Check if user_id column exists
        const hasUserId = cols.rows.some(r => r.column_name === 'user_id');
        const hasEmail = cols.rows.some(r => r.column_name === 'email');
        const hasPasswordHash = cols.rows.some(r => r.column_name === 'password_hash');
        
        console.log('\nSchema check:');
        console.log(`  has user_id: ${hasUserId}`);
        console.log(`  has email: ${hasEmail}`);
        console.log(`  has password_hash: ${hasPasswordHash}`);
        
        // Check admin user data
        const adminData = await pool.query('SELECT * FROM admin_users LIMIT 1');
        console.log('\nSample admin user:', adminData.rows[0]);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkAdminSchema();
