import { Response } from 'express';
import { supabase } from '../config/supabase';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and documents
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'));
    }
  }
});

export class AssetController {
  // Multer middleware for single file upload
  uploadMiddleware = upload.single('file');

  /**
   * Upload an asset to Supabase Storage
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

      // Generate unique filename
      const fileExt = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading to storage:', uploadError);
        return res.status(400).json({ error: uploadError.message });
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(filePath);

      const asset = {
        id: uuidv4(),
        name: file.originalname,
        file_name: fileName,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.mimetype,
        url: urlData.publicUrl,
        folder,
        uploaded_by: userId,
        created_at: new Date().toISOString()
      };

      res.status(201).json({ asset });
    } catch (error) {
      console.error('Error uploading asset:', error);
      res.status(500).json({ error: 'Internal server error' });
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

      for (const file of req.files) {
        try {
          // Generate unique filename
          const fileExt = path.extname(file.originalname);
          const fileName = `${uuidv4()}${fileExt}`;
          const filePath = `${folder}/${fileName}`;

          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('assets')
            .upload(filePath, file.buffer, {
              contentType: file.mimetype,
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            errors.push({
              file: file.originalname,
              error: uploadError.message
            });
            continue;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('assets')
            .getPublicUrl(filePath);

          uploadedAssets.push({
            id: uuidv4(),
            name: file.originalname,
            file_name: fileName,
            file_path: filePath,
            file_size: file.size,
            mime_type: file.mimetype,
            url: urlData.publicUrl,
            folder,
            uploaded_by: userId,
            created_at: new Date().toISOString()
          });
        } catch (error) {
          errors.push({
            file: file.originalname,
            error: error instanceof Error ? error.message : 'Unknown error'
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
    } catch (error) {
      console.error('Error uploading multiple assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get asset by path
   */
  async getAsset(req: any, res: Response) {
    try {
      const { path: assetPath } = req.params;

      const { data } = supabase.storage
        .from('assets')
        .getPublicUrl(assetPath);

      if (!data || !data.publicUrl) {
        console.error('Error getting asset: No public URL returned');
        return res.status(404).json({ error: 'Asset not found' });
      }

      res.json({ url: data.publicUrl });
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

      const { error } = await supabase.storage
        .from('assets')
        .remove([assetPath]);

      if (error) {
        console.error('Error deleting asset:', error);
        return res.status(400).json({ error: error.message });
      }

      res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
      console.error('Error deleting asset:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * List assets in a folder
   */
  async listAssets(req: any, res: Response) {
    try {
      const { folder = 'page-builder', limit = 100, offset = 0 } = req.query;

      const { data, error } = await supabase.storage
        .from('assets')
        .list(folder, {
          limit: parseInt(String(limit)),
          offset: parseInt(String(offset)),
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('Error listing assets:', error);
        return res.status(400).json({ error: error.message });
      }

      // Get public URLs for all assets
      const assetsWithUrls = data.map(asset => {
        const { data: urlData } = supabase.storage
          .from('assets')
          .getPublicUrl(`${folder}/${asset.name}`);

        return {
          ...asset,
          url: urlData.publicUrl,
          folder
        };
      });

      res.json({ assets: assetsWithUrls });
    } catch (error) {
      console.error('Error listing assets:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get asset metadata
   */
  async getAssetMetadata(req: any, res: Response) {
    try {
      const { path: assetPath } = req.params;

      // Get file info from storage
      const pathParts = assetPath.split('/');
      const folder = pathParts.slice(0, -1).join('/');
      const fileName = pathParts[pathParts.length - 1];

      const { data, error } = await supabase.storage
        .from('assets')
        .list(folder, {
          search: fileName
        });

      if (error || !data || data.length === 0) {
        console.error('Error getting asset metadata:', error);
        return res.status(404).json({ error: 'Asset not found' });
      }

      const asset = data[0];
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(assetPath);

      res.json({
        metadata: {
          name: asset.name,
          size: asset.metadata?.size,
          mimeType: asset.metadata?.mimetype,
          lastModified: asset.updated_at,
          created: asset.created_at,
          url: urlData.publicUrl
        }
      });
    } catch (error) {
      console.error('Error getting asset metadata:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
