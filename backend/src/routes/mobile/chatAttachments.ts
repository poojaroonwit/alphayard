import express from 'express';
import multer from 'multer';
import { authenticateToken, requireCircleMember } from '../../middleware/auth';

// Chat/message/attachment persistence is disabled in this local setup.
// Routes will return stubbed success responses so the rest of the app can run.
const router = express.Router();

import fs from 'fs';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/chat');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow all file types for now
    cb(null, true);
  }
});

// All routes require authentication and circle membership
router.use(authenticateToken as any);
router.use(requireCircleMember as any);

import { pool } from '../../config/database';
import chatService from '../../services/chatService';

/**
 * Upload attachment for a message
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

    // Construct URLs
    // Relative URL (safer for mobile clients with different base URLs)
    const relativeUrl = `/uploads/chat/${file.filename}`;
    // Absolute URL (for convenience)
    const fullUrl = `${req.protocol}://${req.get('host')}/uploads/chat/${file.filename}`;

    // Determine metadata key based on mimetype
    const isImage = file.mimetype.startsWith('image/');
    const metadataKey = isImage ? 'imageUrl' : 'fileUrl';

    // Update message metadata in database
    await pool.query(
      `UPDATE chat_messages 
       SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object($1::text, $2::text, 'fileName', $3::text, 'fileSize', $4::numeric, 'mimeType', $5::text),
       updated_at = NOW()
       WHERE id = $6`,
      [metadataKey, relativeUrl, file.originalname, file.size, file.mimetype, messageId]
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
        id: file.filename,
        file_name: file.originalname,
        file_size: file.size,
        mime_type: file.mimetype,
        url: relativeUrl,
        fullUrl: fullUrl
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

