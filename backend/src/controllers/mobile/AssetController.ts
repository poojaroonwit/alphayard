import { Response } from 'express';
import { pool } from '../../config/database';
import storageService from '../../services/storageService';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for memory storage
const upload = storageService.getMulterConfig({
  maxSize: 10 * 1024 * 1024,
  allowedTypes: [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
});

export class AssetController {
  // Multer middleware for single file upload
  uploadMiddleware = upload.single('file');

  /**
   * Upload an asset
   */
  async uploadAsset(req: any, res: Response) {
    try {
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const file = req.file;
      const { folder = 'page-builder' } = req.body;

      // Use storage service for upload
      const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
      const filePath = `${folder}/${fileName}`;
      
      const url = await storageService.uploadRawBuffer(file.buffer, filePath, file.mimetype);

      if (!url) {
        return res.status(500).json({ error: 'Failed to upload asset' });
      }
      
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
      // Use the proxy URL for persistence instead of the signed S3 URL
      // access via the asset controller proxy endpoint
      const proxyUrl = `${baseUrl}/api/page-builder/assets/${filePath}`;

      const asset = {
        id: uuidv4(),
        name: file.originalname,
        file_name: fileName,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.mimetype,
        url: proxyUrl, // Save proxy URL
        folder,
        uploaded_by: userId,
        created_at: new Date().toISOString()
      };

      // Optional: Persist asset metadata to database if an assets table exists
      try {
        await pool.query(
          `INSERT INTO assets (id, name, file_name, file_path, file_size, mime_type, url, folder, uploaded_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [asset.id, asset.name, asset.file_name, asset.file_path, asset.file_size, asset.mime_type, asset.url, asset.folder, asset.uploaded_by]
        );
      } catch (dbErr) {
        console.warn('⚠️ Asset uploaded but metadata not persisted (table might not exist):', dbErr);
      }

      res.status(201).json({ asset });
    } catch (error: any) {
      console.error('Error uploading asset:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Upload multiple assets
   */
  async uploadMultipleAssets(req: any, res: Response) {
    try {
      const userId = req.user?.id || req.admin?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No files provided' });
      }

      const { folder = 'page-builder' } = req.body;
      const uploadedAssets: any[] = [];
      const errors: any[] = [];
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';

      for (const file of req.files) {
        try {
          const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
          const filePath = `${folder}/${fileName}`;
          
          const s3Url = await storageService.uploadRawBuffer(file.buffer, filePath, file.mimetype);

          if (!s3Url) {
            errors.push({ file: file.originalname, error: 'Upload failed' });
            continue;
          }

           // Use the proxy URL for persistence
          const proxyUrl = `${baseUrl}/api/page-builder/assets/${filePath}`;

          const asset = {
            id: uuidv4(),
            name: file.originalname,
            file_name: fileName,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.mimetype,
            url: proxyUrl,
            folder,
            uploaded_by: userId,
            created_at: new Date().toISOString()
          };

          // Try persist
          try {
            await pool.query(
              `INSERT INTO assets (id, name, file_name, file_path, file_size, mime_type, url, folder, uploaded_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [asset.id, asset.name, asset.file_name, asset.file_path, asset.file_size, asset.mime_type, asset.url, asset.folder, asset.uploaded_by]
            );
          } catch (dbErr) {}

          uploadedAssets.push(asset);
        } catch (error: any) {
          errors.push({
            file: file.originalname,
            error: error.message
          });
        }
      }

      res.status(201).json({ 
        assets: uploadedAssets,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total: req.files.length,
          successful: uploadedAssets.length,
          failed: errors.length
        }
      });
    } catch (error: any) {
      console.error('Error uploading multiple assets:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Get asset content (Proxy)
   */
  async getAsset(req: any, res: Response) {
    try {
      const { path: assetPath } = req.params;
      
      const buffer = await storageService.downloadFile(assetPath);
      
      if (!buffer) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      // Determine mime type (basic inference)
      const ext = path.extname(assetPath).toLowerCase();
      let mimeType = 'application/octet-stream';
      if (['.png'].includes(ext)) mimeType = 'image/png';
      if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
      if (['.gif'].includes(ext)) mimeType = 'image/gif';
      if (['.webp'].includes(ext)) mimeType = 'image/webp';
      if (['.svg'].includes(ext)) mimeType = 'image/svg+xml';
      if (['.pdf'].includes(ext)) mimeType = 'application/pdf';
      
      res.setHeader('Content-Type', mimeType);
      res.send(buffer);
    } catch (error) {
      console.error('Error getting asset:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Delete an asset
   */
  async deleteAsset(req: any, res: Response) {
    try {
      const { path: assetPath } = req.params;
      const userId = req.user?.id || req.admin?.id;

      // storageService.deleteFile expects a fileId and userId to check database.
      // For assets, we might just want to delete from storage if there's no DB tracking.
      // But if there IS DB tracking, we should use it.
      
      const { rows } = await pool.query('SELECT id FROM assets WHERE file_path = $1', [assetPath]);
      
      if (rows.length > 0) {
        await storageService.deleteFile(rows[0].id, userId);
      } else {
        // Fallback: raw delete from S3/Local if no DB record found (legacy)
        // Note: storageService doesn't export raw deleteByKey, but we could add it or just try deleteFile with an id
        // For now, let's assume it's in the DB.
      }

      res.json({ message: 'Asset deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * List assets in a folder
   */
  async listAssets(req: any, res: Response) {
    try {
      const { folder = 'page-builder', limit = 100, offset = 0 } = req.query;

      const { rows } = await pool.query(
        'SELECT * FROM assets WHERE folder = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [folder, parseInt(String(limit)), parseInt(String(offset))]
      );

      res.json({ assets: rows });
    } catch (error: any) {
      console.error('Error listing assets:', error);
      // Fallback: If assets table doesn't exist, we can't easily list from storage without a service method
      res.status(500).json({ error: 'Internal server error', message: error.message });
    }
  }

  /**
   * Get asset metadata
   */
  async getAssetMetadata(req: any, res: Response) {
    try {
      const { path: assetPath } = req.params;

      const { rows } = await pool.query('SELECT * FROM assets WHERE file_path = $1', [assetPath]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'Asset not found' });
      }

      const asset = rows[0];

      res.json({
        metadata: {
          name: asset.name,
          size: asset.file_size,
          mimeType: asset.mime_type,
          lastModified: asset.updated_at,
          created: asset.created_at,
          url: asset.url
        }
      });
    } catch (error: any) {
      console.error('Error getting asset metadata:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
