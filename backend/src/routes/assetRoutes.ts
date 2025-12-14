import { Router } from 'express';
import { AssetController } from '../controllers/AssetController';
import { authenticateToken } from '../middleware/auth';
import multer from 'multer';

const router = Router();
const assetController = new AssetController();

// Configure multer for multiple file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload single asset
router.post('/upload', authenticateToken as any, assetController.uploadMiddleware, assetController.uploadAsset.bind(assetController));

// Upload multiple assets
router.post('/upload-multiple', authenticateToken as any, upload.array('files', 10), assetController.uploadMultipleAssets.bind(assetController));

// List assets
router.get('/list', authenticateToken as any, assetController.listAssets.bind(assetController));

// Get asset by path
router.get('/:path(*)', assetController.getAsset.bind(assetController));

// Get asset metadata
router.get('/metadata/:path(*)', authenticateToken as any, assetController.getAssetMetadata.bind(assetController));

// Delete asset
router.delete('/:path(*)', authenticateToken as any, assetController.deleteAsset.bind(assetController));

export default router;
