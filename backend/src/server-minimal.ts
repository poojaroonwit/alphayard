import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config();

console.log('Starting minimal server...');

const app = express();
const server = createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Admin auth routes (for admin panel)
import adminUsersRoutes from './routes/admin/adminUsers';
app.use('/api/admin/auth', adminUsersRoutes);

// Standard auth routes (for mobile app)
import authRoutes from './routes/mobile/auth';
import socialRoutes from './routes/mobile/social.mobile';

app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes); // Also mount without v1 prefix

// Social routes (using real data via mobile adapter)
app.use('/api/v1/social', socialRoutes);
app.use('/api/social', socialRoutes);

const PORT = parseInt(process.env.PORT || '3000');

async function start() {
    try {
        // Database verification instead of Supabase
        const { pool } = require('./config/database');
        await pool.query('SELECT 1');
        console.log('✅ Database connection verified');
        
        server.listen(PORT, () => {
            console.log(`🚀 Minimal server running on port ${PORT}`);
            console.log(`📱 Mobile login: POST http://127.0.0.1:${PORT}/api/v1/auth/login`);
            console.log(`🖥️  Admin login: POST http://localhost:${PORT}/api/admin/auth/login`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
    }
}

start();
