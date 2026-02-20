import express from 'express';
import http from 'http';
import https from 'https';
import { authenticateToken, requireCircleMember } from '../../middleware/auth';
import storageService from '../../services/storageService';
import StorageController from '../../controllers/mobile/StorageController';
import { prisma } from '../../lib/prisma';

const router = express.Router();

// Helper function to fetch URL data
function fetchUrl(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (response) => {
            if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                // Follow redirect
                fetchUrl(response.headers.location).then(resolve).catch(reject);
                return;
            }
            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

// Public image proxy endpoint (no auth required) - proxies images from MinIO
router.get('/proxy/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;

        // Look up the file metadata from unified_entities table
        const rows = await prisma.$queryRaw<any[]>`
            SELECT id, type, data, status 
             FROM public.unified_entities 
             WHERE id = ${fileId}::uuid AND type = 'file' AND status = 'active'
        `;

        if (rows.length === 0) {
            console.error('[Storage Proxy] File not found:', fileId);
            return res.status(404).json({ error: 'File not found' });
        }

        const entity = rows[0];
        const fileData = entity.data || {};
        
        // Extract file metadata from JSONB data column
        const mimeType = fileData.mime_type || fileData.mimeType || 'application/octet-stream';
        const path = fileData.path || fileData.filePath;
        
        if (!path) {
            console.error('[Storage Proxy] No path found in file data:', fileId, fileData);
            return res.status(404).json({ error: 'File path not found' });
        }

        console.log('[Storage Proxy] Fetching file:', { fileId, path, mimeType, bucket: process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'boundary-files' });

        // Fetch the image from MinIO/S3 using storageService
        const imageData = await storageService.downloadFile(path);

        if (!imageData) {
            console.error('[Storage Proxy] File content not found in storage:', { fileId, path, bucket: process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || 'boundary-files' });
            return res.status(404).json({ error: 'File content not found', details: `Path: ${path}` });
        }

        console.log('[Storage Proxy] File downloaded successfully:', { fileId, size: imageData.length });

        // Set appropriate headers for cross-origin image loading
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        // Send the image data
        res.send(imageData);
    } catch (error: any) {
        console.error('[Storage Proxy] Error:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch image', details: error.message });
    }
});

// All other routes require authentication
router.use(authenticateToken as any);

// Check for circle membership, unless admin
const requirecircleOrAdmin = async (req: any, res: any, next: any) => {
    // If admin, skip circle check
    if (req.user && (req.user.role === 'admin' || req.user.type === 'admin')) {
        return next();
    }
    return requireCircleMember(req, res, next);
};

router.use(requirecircleOrAdmin);

// Get files
router.get('/files', StorageController.getFiles);

// Get file by ID
router.get('/files/:id', StorageController.getFileById);

// Upload file
router.post('/upload', storageService.getMulterConfig().single('file'), (req, res) => StorageController.uploadFile(req, res));

// Update file
router.put('/files/:id', StorageController.updateFile);

// Delete file
router.delete('/files/:id', StorageController.deleteFile);

// Get storage statistics
router.get('/stats', StorageController.getStorageStats);

// Create folder
router.post('/folders', StorageController.createFolder);

// Toggle file favorite status
router.patch('/files/:id/favorite', StorageController.toggleFavorite);

// Toggle file shared status
router.patch('/files/:id/shared', StorageController.toggleShared);

export default router;

