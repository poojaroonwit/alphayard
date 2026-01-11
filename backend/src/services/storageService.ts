import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/database';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

interface FileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  generateThumbnails?: boolean;
  compressImages?: boolean;
}

interface UploadedFile {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
  familyId?: string;
}

class StorageService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private uploadPath: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || 'bondarys-files';
    this.uploadPath = process.env.UPLOAD_PATH || 'uploads';
    this.initializeS3();
  }

  private initializeS3() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    // Check if credentials are valid (not placeholders)
    if (accessKeyId && secretAccessKey && !accessKeyId.startsWith('your-') && accessKeyId !== 'you') {
      try {
        const s3Config: any = {
          region: process.env.AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          },
          forcePathStyle: true, // Needed for MinIO
        };

        if (process.env.AWS_S3_ENDPOINT) {
          s3Config.endpoint = process.env.AWS_S3_ENDPOINT;
        }

        this.s3Client = new S3Client(s3Config);
        console.log('✅ AWS S3 client initialized (v3)');
        if (process.env.AWS_S3_ENDPOINT) {
          console.log(`✅ Using S3 Endpoint: ${process.env.AWS_S3_ENDPOINT}`);
        }
        console.log(`🔍 S3 Credentials: KeyID=${process.env.AWS_ACCESS_KEY_ID?.substring(0, 3)}... Secret=${process.env.AWS_SECRET_ACCESS_KEY?.substring(0, 3)}... Region=${process.env.AWS_REGION}`);
        console.log(`🔍 S3 Bucket: ${this.bucketName}`);
      } catch (error) {
        console.warn('⚠️ Failed to initialize AWS S3 - using local storage:', error);
      }
    } else {
      console.warn('⚠️ AWS S3 not configured - using local storage');
    }
  }

  // Configure multer for file uploads
  getMulterConfig(options: FileUploadOptions = {}) {
    const maxSize = options.maxSize || parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
    const allowedTypes = options.allowedTypes || (process.env.ALLOWED_FILE_TYPES
      ? process.env.ALLOWED_FILE_TYPES.split(',')
      : ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'application/pdf']);

    const storage = multer.memoryStorage();

    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return cb(new Error(`File type ${file.mimetype} is not allowed`));
      }
      cb(null, true);
    };

    return multer({
      storage,
      limits: {
        fileSize: maxSize,
        files: 10, // Max 10 files per request
      },
      fileFilter,
    });
  }

  // Upload file to S3 or local storage
  async uploadFile(
    file: Express.Multer.File,
    userId: string,
    familyId?: string,
    options: FileUploadOptions = {}
  ): Promise<UploadedFile> {
    try {
      const fileId = uuidv4();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${fileId}${fileExtension}`;
      const filePath = `${this.uploadPath}/${userId}/${fileName}`;

      let processedBuffer = file.buffer;
      let thumbnailBuffer: Buffer | undefined;

      // Process image files
      if (file.mimetype.startsWith('image/')) {
        if (options.compressImages !== false) {
          processedBuffer = await this.compressImage(file.buffer, file.mimetype);
        }

        if (options.generateThumbnails !== false) {
          thumbnailBuffer = await this.generateThumbnail(file.buffer);
        }
      }

      let fileUrl: string;
      let thumbnailUrl: string | undefined;

      if (this.s3Client) {
        // Upload to S3
        await this.uploadToS3(processedBuffer, filePath, file.mimetype);
        fileUrl = await this.getSignedUrl(filePath);

        if (thumbnailBuffer) {
          const thumbnailPath = `${this.uploadPath}/${userId}/thumbnails/${fileName}`;
          await this.uploadToS3(thumbnailBuffer, thumbnailPath, 'image/jpeg');
          thumbnailUrl = await this.getSignedUrl(thumbnailPath);
        }
      } else {
        // Local storage fallback
        fileUrl = await this.uploadToLocal(processedBuffer, filePath);

        if (thumbnailBuffer) {
          const thumbnailPath = `${this.uploadPath}/${userId}/thumbnails/${fileName}`;
          thumbnailUrl = await this.uploadToLocal(thumbnailBuffer, thumbnailPath);
        }
      }

      // Save file metadata to database
      const uploadedFile = await this.saveFileMetadata({
        id: fileId,
        originalName: file.originalname,
        fileName,
        mimeType: file.mimetype,
        size: processedBuffer.length,
        url: fileUrl,
        thumbnailUrl,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
        familyId
      });

      return uploadedFile;
    } catch (error: any) {
      console.error('File upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  private async uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<void> {
    if (!this.s3Client) throw new Error('S3 client not initialized');

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // ACL: 'private', // MinIO might not support ACLs depending on config, better to omit for buckets controlled by policy
    });

    await this.s3Client.send(command);
  }

  private async uploadToLocal(buffer: Buffer, filePath: string): Promise<string> {
    const fullPath = path.join(process.cwd(), 'uploads', filePath);
    const dir = path.dirname(fullPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, buffer);
    return `/uploads/${filePath}`;
  }

  private async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3Client) {
      return `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    // For presigned URLs to work with MinIO in Docker when accessed from host (mobile app),
    // the endpoint in S3Client might need to be different than internal one (http://minio:9000 vs http://localhost:9000).
    // However, since backend generates the URL, it uses the configured endpoint.
    // If backend uses http://minio:9000, the signed URL will have that host. 
    // The mobile app (on host/emulator) cannot resolve 'minio'.
    // Solution: We might need a PUBLIC_S3_ENDPOINT env var to override the host in the signed URL, 
    // or rely on MinIO handling Host header. 
    // For now, standard presigning. If issues arise, we can replace the host in result.

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  private async compressImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    try {
      const sharpInstance = sharp(buffer);

      // Get image metadata
      const metadata = await sharpInstance.metadata();

      // Resize if too large
      if (metadata.width && metadata.width > 1920) {
        sharpInstance.resize(1920, null, { withoutEnlargement: true });
      }

      // Compress based on format
      if (mimeType === 'image/jpeg') {
        return await sharpInstance.jpeg({ quality: 85, progressive: true }).toBuffer();
      } else if (mimeType === 'image/png') {
        return await sharpInstance.png({ compressionLevel: 8 }).toBuffer();
      } else if (mimeType === 'image/webp') {
        return await sharpInstance.webp({ quality: 85 }).toBuffer();
      }

      return buffer;
    } catch (error) {
      console.error('Image compression error:', error);
      return buffer; // Return original if compression fails
    }
  }

  private async generateThumbnail(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(300, 300, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      throw error;
    }
  }

  private async saveFileMetadata(fileData: UploadedFile): Promise<UploadedFile> {
    try {
      const { rows } = await pool.query(
        `INSERT INTO files (id, original_name, file_name, mime_type, size, url, thumbnail_url, uploaded_at, uploaded_by, family_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          fileData.id,
          fileData.originalName,
          fileData.fileName,
          fileData.mimeType,
          fileData.size,
          fileData.url,
          fileData.thumbnailUrl,
          fileData.uploadedAt,
          fileData.uploadedBy,
          fileData.familyId
        ]
      );

      const data = rows[0];
      return {
        id: data.id,
        originalName: data.original_name,
        fileName: data.file_name,
        mimeType: data.mime_type,
        size: data.size,
        url: data.url,
        thumbnailUrl: data.thumbnail_url,
        uploadedAt: data.uploaded_at,
        uploadedBy: data.uploaded_by,
        familyId: data.family_id
      };
    } catch (error: any) {
      console.error('Failed to save file metadata:', error);
      throw new Error(`Failed to save file metadata: ${error.message}`);
    }
  }

  // Get files for a user or family
  async getFiles(userId: string, familyId?: string, limit: number = 50, offset: number = 0): Promise<{
    files: UploadedFile[];
    total: number;
  }> {
    try {
      let query = `SELECT * FROM files WHERE uploaded_by = $1`;
      let countQuery = `SELECT COUNT(*) FROM files WHERE uploaded_by = $1`;
      const params: any[] = [userId];

      if (familyId) {
        query += ` AND family_id = $2`;
        countQuery += ` AND family_id = $2`;
        params.push(familyId);
      }

      query += ` ORDER BY uploaded_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);

      const { rows } = await pool.query(query, params);
      const countResult = await pool.query(countQuery, familyId ? [userId, familyId] : [userId]);

      const files: UploadedFile[] = rows.map((file: any) => ({
        id: file.id,
        originalName: file.original_name,
        fileName: file.file_name,
        mimeType: file.mime_type,
        size: file.size,
        url: file.url,
        thumbnailUrl: file.thumbnail_url,
        uploadedAt: file.uploaded_at,
        uploadedBy: file.uploaded_by,
        familyId: file.family_id
      }));

      return {
        files,
        total: parseInt(countResult.rows[0].count, 10)
      };
    } catch (error: any) {
      console.error('Failed to get files:', error);
      throw new Error('Failed to get files');
    }
  }

  // Delete file
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      // Get file metadata
      const { rows } = await pool.query(
        `SELECT * FROM files WHERE id = $1 AND uploaded_by = $2`,
        [fileId, userId]
      );

      if (rows.length === 0) {
        throw new Error('File not found or access denied');
      }

      const file = rows[0];

      // Delete from storage
      if (this.s3Client) {
        const filePath = `${this.uploadPath}/${userId}/${file.file_name}`;
        await this.deleteFromS3(filePath);

        if (file.thumbnail_url) {
          const thumbnailPath = `${this.uploadPath}/${userId}/thumbnails/${file.file_name}`;
          await this.deleteFromS3(thumbnailPath);
        }
      } else {
        // Delete from local storage
        const filePath = path.join(process.cwd(), 'uploads', this.uploadPath, userId, file.file_name);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }

        const thumbnailPath = path.join(process.cwd(), 'uploads', this.uploadPath, userId, 'thumbnails', file.file_name);
        if (fs.existsSync(thumbnailPath)) {
          fs.unlinkSync(thumbnailPath);
        }
      }

      // Delete from database
      await pool.query(
        `DELETE FROM files WHERE id = $1 AND uploaded_by = $2`,
        [fileId, userId]
      );

      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }

  private async deleteFromS3(key: string): Promise<void> {
    if (!this.s3Client) return;

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  // Get storage usage for a user
  async getStorageUsage(userId: string, familyId?: string): Promise<{
    totalSize: number;
    fileCount: number;
    limit: number;
  }> {
    try {
      let query = `SELECT COALESCE(SUM(size), 0) as total_size, COUNT(*) as file_count FROM files WHERE uploaded_by = $1`;
      const params: any[] = [userId];

      if (familyId) {
        query += ` AND family_id = $2`;
        params.push(familyId);
      }

      const { rows } = await pool.query(query, params);
      const limit = parseInt(process.env.STORAGE_LIMIT || '1073741824'); // 1GB default

      return {
        totalSize: parseInt(rows[0].total_size, 10) || 0,
        fileCount: parseInt(rows[0].file_count, 10) || 0,
        limit
      };
    } catch (error: any) {
      console.error('Failed to get storage usage:', error);
      throw new Error('Failed to get storage usage');
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    if (this.s3Client) {
      try {
        // Test S3 connection
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: 'health-check',
        });
        await this.s3Client.send(command);
        return true;
      } catch (error: any) {
        // NoSuchKey is fine, means we connected to bucket
        if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
          return true;
        }
        return false;
      }
    }
    return true; // Local storage is always available
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
