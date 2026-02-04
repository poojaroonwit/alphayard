import { pool } from '../src/config/database';

async function fixEmailLogs() {
    console.log('Creating email_logs table manually...');
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS email_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                to_email VARCHAR(255) NOT NULL,
                subject VARCHAR(500) NOT NULL,
                template VARCHAR(100),
                message_id VARCHAR(255),
                status VARCHAR(20) NOT NULL DEFAULT 'sent',
                error_message TEXT,
                sent_at TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
            CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
            CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
        `);
        console.log('✅ email_logs table created successfully.');
    } catch (err: any) {
        console.error('❌ Failed to create email_logs table:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

fixEmailLogs();
