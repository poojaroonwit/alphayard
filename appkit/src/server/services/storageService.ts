import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import entityService from './EntityService';
import { prisma } from '../lib/prisma';

class StorageService {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.s3Client = new S3Client({
            endpoint: process.env.S3_ENDPOINT || process.env.AWS_S3_ENDPOINT || process.env.AWS_ENDPOINT || 'http://localhost:9000',
            region: process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || 'minioadmin',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || 'minioadmin',
            },
            forcePathStyle: true, // Required for MinIO
        });
        this.bucketName = process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME || 'appkit-files';
    }

    getMulterConfig(options: any = {}) {
        const multerOptions: any = { storage: multer.memoryStorage() };
        if (options.maxSize) {
            multerOptions.limits = { fileSize: options.maxSize };
        }
        return multer(multerOptions);
    }

    async uploadFile(file: any, userId: string, circleId?: string | null, options: any = {}) {
        try {
            const fileId = uuidv4();
            const extension = file.originalname?.split('.').pop() || 'bin';
            const key = `uploads/${userId}/${fileId}.${extension}`;

            console.log('[StorageService] Uploading file:', {
                fileId,
                key,
                userId,
                circleId,
                bucketName: this.bucketName,
                fileSize: file.size,
                endpoint: process.env.AWS_S3_ENDPOINT || 'http://localhost:9000',
                fileName: file.originalname,
                mimeType: file.mimetype
            });

            const uploadParams = {
                Bucket: this.bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype || 'application/octet-stream',
            };

            try {
                await this.s3Client.send(new PutObjectCommand(uploadParams));
                console.log('[StorageService] File uploaded to S3 successfully');
            } catch (s3Error: any) {
                if (s3Error.code === 'ECONNREFUSED' || s3Error.name === 'AggregateError') {
                    const endpoint = process.env.AWS_S3_ENDPOINT || 'http://localhost:9000';
                    throw new Error(
                        `Cannot connect to MinIO storage at ${endpoint}. ` +
                        `Please start MinIO with: docker-compose up -d minio ` +
                        `or check if MinIO is running on port 9000.`
                    );
                }
                throw s3Error;
            }

            // Resolve ownerId: For admin users, we need to ensure we have a valid users.id
            // The foreign key constraint requires owner_id to reference users(id)
            let resolvedOwnerId: string | null = userId;
            
            console.log('[StorageService] Starting ownerId resolution:', { userId, circleId });
            
            try {
                // First, check if userId exists in users table
                const userCheck = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true }
                });
                
                console.log('[StorageService] User check result:', { userId, found: !!userCheck });
                
                if (userCheck) {
                    // User exists in users table, use it
                    resolvedOwnerId = userId;
                    console.log('[StorageService] Using existing user:', resolvedOwnerId);
                } else {
                    // User doesn't exist in users table - might be an admin user
                    // Check if this is an admin_users.id
                    const adminCheck = await prisma.$queryRaw<Array<{ id: string; email: string }>>`
                        SELECT id, email FROM admin.admin_users WHERE id = ${userId}::uuid
                    `;
                    
                    if (adminCheck.length > 0) {
                        // This is an admin user - we need to find or create a corresponding user in core.users
                        const adminUser = adminCheck[0];
                        
                        // Try to find an existing user with the same email
                        const existingUser = await prisma.user.findUnique({
                            where: { email: adminUser.email },
                            select: { id: true }
                        });
                        
                        if (existingUser) {
                            // Use the existing user
                            resolvedOwnerId = existingUser.id;
                            console.log('[StorageService] Found existing user for admin:', { adminId: userId, userId: resolvedOwnerId, email: adminUser.email });
                        } else {
                            // Create a system user for this admin (or use a system user ID)
                            // For now, we'll try to find a system user or create one
                            // Check if there's a system user we can use
                            const systemUser = await prisma.user.findFirst({
                                where: { email: { contains: 'system' } },
                                select: { id: true }
                            });
                            
                            if (systemUser) {
                                resolvedOwnerId = systemUser.id;
                                console.log('[StorageService] Using system user for admin upload:', { adminId: userId, systemUserId: resolvedOwnerId });
                            } else {
                                // Last resort: try to create a user for the admin
                                // But this might fail if required fields are missing, so we'll catch and handle it
                                try {
                                    const newUser = await prisma.user.create({
                                        data: {
                                            email: adminUser.email,
                                            firstName: 'Admin',
                                            lastName: 'User',
                                            isActive: true,
                                            isVerified: true
                                        },
                                        select: { id: true }
                                    });
                                    resolvedOwnerId = newUser.id;
                                    console.log('[StorageService] Created user for admin:', { adminId: userId, userId: resolvedOwnerId });
                                } catch (createError: any) {
                                    console.error('[StorageService] Failed to create user for admin:', createError.message);
                                    // If we can't create a user, we'll need to fail gracefully
                                    throw new Error(`Cannot upload file: Admin user ${userId} does not have a corresponding user account. Please contact system administrator.`);
                                }
                            }
                        }
                    } else {
                        // Not an admin user and not a regular user - invalid ID
                        throw new Error(`Invalid user ID: ${userId} does not exist in users or admin_users tables`);
                    }
                }
            } catch (dbError: any) {
                console.error('[StorageService] Error resolving user ID:', dbError.message);
                throw dbError; // Re-throw to let the caller handle it
            }

            // ownerId can be null now (we made the column nullable)
            // But if we have a resolvedOwnerId, verify it exists
            if (resolvedOwnerId) {
                // Final verification: ensure the resolvedOwnerId exists in users table
                const finalCheck = await prisma.user.findUnique({
                    where: { id: resolvedOwnerId },
                    select: { id: true }
                });

                if (!finalCheck) {
                    console.warn('[StorageService] resolvedOwnerId does not exist in users table, setting to null:', { 
                        originalUserId: userId, 
                        resolvedOwnerId 
                    });
                    resolvedOwnerId = null; // Set to null if invalid
                } else {
                    console.log('[StorageService] Final ownerId verification passed:', { resolvedOwnerId });
                }
            } else {
                console.log('[StorageService] No ownerId resolved, using null (allowed for admin uploads)');
            }

            const entity = await entityService.createEntity({
                typeName: 'file',
                ownerId: resolvedOwnerId || undefined, // Can be undefined/null for admin uploads
                applicationId: circleId || undefined, // Use undefined instead of null if circleId is null
                attributes: {
                    original_name: file.originalname || 'uploaded-file',
                    file_name: `${fileId}.${extension}`,
                    file_id: fileId, // Store fileId for proxy lookup
                    mime_type: file.mimetype || 'application/octet-stream',
                    size: file.size || 0,
                    path: key,
                    uploaded_by: userId, // Keep original userId in attributes for tracking
                    is_shared: options.is_shared || false,
                    is_favorite: options.is_favorite || false,
                    metadata: options.metadata || {}
                }
            } as any);

            // Construct URL using entity ID (not fileId) so proxy can look it up directly
            const baseUrl = process.env.API_BASE_URL || 'http://localhost:4000';
            const url = `${baseUrl}/api/v1/storage/proxy/${entity.id}`;

            // Update entity with the final URL
            await entityService.updateEntity(entity.id, {
                attributes: { url }
            } as any);

            console.log('[StorageService] Entity created:', { 
                entityId: entity.id, 
                url, 
                path: key,
                mimeType: file.mimetype 
            });
            return { 
                id: entity.id, 
                url: url,
                mime_type: file.mimetype || 'application/octet-stream',
                file_name: `${fileId}.${extension}`,
                path: key,
                ...entity.attributes 
            };
        } catch (error: any) {
            console.error('[StorageService] Upload error:', error);
            throw new Error(`File upload failed: ${error.message}`);
        }
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
            console.log('[StorageService] Downloading file:', { key, bucket: this.bucketName, endpoint: process.env.AWS_S3_ENDPOINT || 'http://localhost:9000' });
            
            const response = await this.s3Client.send(new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            }));

            if (!response.Body) {
                console.error('[StorageService] No body in S3 response for key:', key);
                return null;
            }
            
            const streamToBuffer = (stream: any): Promise<Buffer> =>
                new Promise((resolve, reject) => {
                    const chunks: any[] = [];
                    stream.on('data', (chunk: any) => chunks.push(chunk));
                    stream.on('error', reject);
                    stream.on('end', () => resolve(Buffer.concat(chunks)));
                });

            const buffer = await streamToBuffer(response.Body);
            console.log('[StorageService] File downloaded successfully:', { key, size: buffer.length });
            return buffer;
        } catch (error: any) {
            console.error('[StorageService] S3 download error:', { 
                key, 
                bucket: this.bucketName,
                error: error.message,
                code: error.code,
                name: error.name,
                endpoint: process.env.AWS_S3_ENDPOINT || 'http://localhost:9000'
            });
            
            if (error.code === 'NoSuchKey') {
                console.error('[StorageService] File not found in bucket:', key);
            } else if (error.code === 'ECONNREFUSED' || error.name === 'AggregateError') {
                console.error('[StorageService] Cannot connect to MinIO:', process.env.AWS_S3_ENDPOINT || 'http://localhost:9000');
            }
            
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
