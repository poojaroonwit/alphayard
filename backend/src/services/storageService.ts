import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import entityService from './EntityService';

class StorageService {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.s3Client = new S3Client({
            endpoint: process.env.AWS_S3_ENDPOINT || 'http://localhost:9000',
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
            },
            forcePathStyle: true, // Required for MinIO
        });
        this.bucketName = process.env.AWS_S3_BUCKET || 'bondarys-files';
    }

    getMulterConfig(options: any = {}) {
        const multerOptions: any = { storage: multer.memoryStorage() };
        if (options.maxSize) {
            multerOptions.limits = { fileSize: options.maxSize };
        }
        return multer(multerOptions);
    }

    async uploadFile(file: any, userId: string, circleId?: string, options: any = {}) {
        const fileId = uuidv4();
        const extension = file.originalname.split('.').pop();
        const key = `uploads/${userId}/${fileId}.${extension}`;

        const uploadParams = {
            Bucket: this.bucketName,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        await this.s3Client.send(new PutObjectCommand(uploadParams));

        const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/v1/storage/proxy/${fileId}`;

        const entity = await entityService.createEntity({
            typeName: 'file',
            ownerId: userId,
            applicationId: circleId,
            attributes: {
                original_name: file.originalname,
                file_name: `${fileId}.${extension}`,
                mime_type: file.mimetype,
                size: file.size,
                url,
                path: key,
                is_shared: options.is_shared || false,
                is_favorite: options.is_favorite || false,
                metadata: options.metadata || {}
            }
        } as any);

        return { id: entity.id, ...entity.attributes };
    }

    async uploadRawBuffer(buffer: Buffer, fileName: string, mimeType: string) {
        const key = fileName;
        await this.s3Client.send(new PutObjectCommand({
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        }));

        // Return a proxy URL or direct URL if needed
        return key; 
    }

    async deleteFile(fileId: string, userId: string) {
        const entity = await entityService.getEntity(fileId);
        if (!entity || entity.ownerId !== userId) return false;

        const key = entity.attributes.path;
        await this.s3Client.send(new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
        }));

        await entityService.deleteEntity(fileId);
        return true;
    }

    async downloadFile(key: string): Promise<Buffer | null> {
        try {
            const response = await this.s3Client.send(new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            }));

            if (!response.Body) return null;
            const streamToBuffer = (stream: any): Promise<Buffer> =>
                new Promise((resolve, reject) => {
                    const chunks: any[] = [];
                    stream.on('data', (chunk: any) => chunks.push(chunk));
                    stream.on('error', reject);
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                });

            return await streamToBuffer(response.Body);
        } catch (error) {
            console.error('S3 download error:', error);
            return null;
        }
    }

    async getStorageUsage(userId: string, circleId?: string) {
        const result = await entityService.queryEntities('file', {
            applicationId: circleId,
            status: 'active'
        } as any);

        const totalSize = result.entities.reduce((acc: number, e: any) => acc + (e.attributes.size || 0), 0);
        return {
            used: totalSize,
            limit: 5 * 1024 * 1024 * 1024, // 5GB limit example
            fileCount: result.total
        };
    }
}

const storageService = new StorageService();
export default storageService;
