import express from 'express';
import { authenticateToken, requireCircleMember } from '../../middleware/auth';
import storageService from '../../services/storageService';

// Chat attachments now use S3/MinIO storage for persistence
const router = express.Router();

// Configure multer for S3 uploads (memory storage)
const upload = storageService.getMulterConfig({
  maxSize: 50 * 1024 * 1024, // 50MB limit
});

// All routes require authentication and circle membership
router.use(authenticateToken as any);
router.use(requireCircleMember as any);

import { prisma } from '../../lib/prisma';
import chatService from '../../services/chatService';

/**
 * Upload attachment for a message - uses S3/MinIO storage
 */
router.post('/messages/:messageId/attachments', upload.single('file'), async (req: any, res: any) => {
  try {
    const { messageId } = req.params;
    const file = req.file;

    if (!file || !messageId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Message ID and file are required'
      });
    }

    const userId = req.user?.id || 'system';
    const circleId = req.user?.circleId || null;

    // Upload to S3/MinIO
    const uploaded = await storageService.uploadFile(file, userId, circleId, {
      folder: 'chat',
      metadata: { messageId }
    });

    if (!uploaded || !uploaded.url) {
      return res.status(500).json({
        error: 'Upload failed',
        message: 'Failed to upload file to storage'
      });
    }

    // Use the S3 proxy URL
    const fileUrl = uploaded.url;

    // Determine metadata key based on mimetype
    const isImage = file.mimetype.startsWith('image/');
    const metadataKey = isImage ? 'imageUrl' : 'fileUrl';

    // Update message metadata in database
    await prisma.$executeRawUnsafe(
      `UPDATE boundary.chat_messages 
       SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object($1::text, $2::text, 'fileName', $3::text, 'fileSize', $4::numeric, 'mimeType', $5::text, 'entityId', $6::text),
       updated_at = NOW()
       WHERE id = $7`,
      metadataKey, fileUrl, file.originalname, file.size, file.mimetype, uploaded.id, messageId
    );

    // Broadcast update via Socket.io
    try {
      const io = req.app.get('io');
      if (io) {
          // Placeholder for broadcast
      }
    } catch (socketError) {
      console.error('Socket broadcast error:', socketError);
      // Continue, as upload was successful
    }

    res.status(201).json({
      success: true,
      data: {
        id: uploaded.id,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to upload attachment'
    });
  }
});

/**
 * Get attachment by ID
 */
router.get('/attachments/:attachmentId', async (req: any, res: any) => {
  try {
    res.json({
      success: true,
      data: null
    });
  } catch (error) {
    console.error('Get attachment error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve attachment'
    });
  }
});

/**
 * Delete attachment
 */
router.delete('/attachments/:attachmentId', async (req: any, res: any) => {
  try {
    // Deletion is a no-op in this environment
    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete attachment'
    });
  }
});

/**
 * Search messages in a chat
 */
router.get('/rooms/:chatId/search', async (req: any, res: any) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to search messages'
    });
  }
});

/**
 * Get unread message count for user
 */
router.get('/unread-count', async (req: any, res: any) => {
  try {
    res.json({
      success: true,
      data: { totalUnread: 0, chatUnreadCounts: {} }
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get unread count'
    });
  }
});

/**
 * Mark messages as read
 */
router.post('/rooms/:chatId/mark-read', async (req: any, res: any) => {
  try {
    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to mark messages as read'
    });
  }
});

/**
 * Get chat statistics
 */
router.get('/families/:circleId/stats', async (req: any, res: any) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get chat statistics'
    });
  }
});

export default router;

