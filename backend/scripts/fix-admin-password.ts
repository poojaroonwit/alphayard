import bcrypt from 'bcrypt';
import { pool } from '../src/config/database';

async function fixAdminPassword() {
    try {
        // Generate proper bcrypt hash for 'admin123'
        const password = 'admin123';
        const hash = await bcrypt.hash(password, 10);
        
        console.log('Generated hash for "admin123":', hash);
        
        // Update the admin user's password
        const result = await pool.query(
            `UPDATE admin_users SET password_hash = $1 WHERE email = $2 RETURNING email, first_name, last_name`,
            [hash, 'admin@bondarys.com']
        );
        
        if (result.rows.length > 0) {
            console.log('\n✅ Password updated successfully for:', result.rows[0]);
            
            // Test the password
            const testResult = await pool.query(
                `SELECT password_hash FROM admin_users WHERE email = $1`,
                ['admin@bondarys.com']
            );
            
            const isValid = await bcrypt.compare(password, testResult.rows[0].password_hash);
            console.log('Password verification test:', isValid ? '✅ PASS' : '❌ FAIL');
        } else {
            console.log('❌ No admin user found to update');
        }
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

fixAdminPassword();
