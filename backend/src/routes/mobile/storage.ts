import express from 'express';
import http from 'http';
import https from 'https';
import { authenticateToken, requireCircleMember } from '../../middleware/auth';
import storageService from '../../services/storageService';
import StorageController from '../../controllers/mobile/StorageController';
import { pool } from '../../config/database';

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

        // Look up the file metadata from database
        const { rows } = await pool.query(
            'SELECT mime_type, file_name, uploaded_by FROM files WHERE id = $1',
            [fileId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = rows[0];
        
        // Reconstruct key: uploads/userId/fileName
        // Note: This assumes standard storageService path structure. 
        // ideally storageService should expose a method to get key from fileId, but this works for now.
        const uploadPath = process.env.UPLOAD_PATH || 'uploads';
        const key = `${uploadPath}/${file.uploaded_by}/${file.file_name}`;

        // Fetch the image from MinIO/S3 using storageService
        const imageData = await storageService.downloadFile(key);

        if (!imageData) {
             return res.status(404).json({ error: 'File content not found' });
        }

        // Set appropriate headers for cross-origin image loading
        res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

        // Send the image data
        res.send(imageData);
    } catch (error: any) {
        console.error('Image proxy error:', error.message);
        res.status(500).json({ error: 'Failed to fetch image' });
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

