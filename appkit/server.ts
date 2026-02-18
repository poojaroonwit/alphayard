import dotenv from 'dotenv';
import path from 'path';

// Load environment variables immediately
dotenv.config({ path: path.resolve(__dirname, '../.env') }); 

import express from 'express';
import next from 'next';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createApp } from './src/server/server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3002', 10);

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

(async () => {
    try {
        console.log('🚀 Starting UniApps Full-Stack Server...');
        await app.prepare();
        console.log('✅ Next.js prepared');

        // Create the Express app from the backend code
        const server = await createApp();
        const httpServer = createServer(server);

        // Initialize Socket.IO
        const io = new Server(httpServer, {
            cors: {
                origin: process.env.NEXT_PUBLIC_SITE_URL || '*',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        // Store IO instance for use in controllers if needed
        // (You might need to export a setter from server/server.ts to pass this down)
        // setSocketIO(io); 

        // Handle Next.js requests
        // This failsafe route catches everything not handled by the Express routes
        server.all('*', (req, res) => {
            return handle(req, res);
        });

        httpServer.listen(port, (err?: any) => {
            if (err) throw err;
            console.log(`> Ready on http://${hostname}:${port}`);
            console.log(`> Environment: ${process.env.NODE_ENV}`);
        });

    } catch (e) {
        console.error('❌ Server startup failed:', e);
        process.exit(1);
    }
})();
