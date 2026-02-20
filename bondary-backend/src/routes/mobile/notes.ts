import express from 'express';
import { authenticateToken, optionalCircleMember } from '../../middleware/auth';
import NotesController from '../../controllers/mobile/NotesController';
import storageService from '../../services/storageService';

const router = express.Router();

router.use(authenticateToken as any);
router.use(optionalCircleMember as any);

// =============================================
// NOTE CRUD OPERATIONS
// =============================================

/**
 * GET /api/notes
 * List notes with filtering, sorting, and pagination
 * Query params: folderId, tags, isPinned, isFavorite, isArchived, search, sortBy, sortOrder, page, limit
 */
router.get('/', NotesController.list);

/**
 * GET /api/notes/tags
 * Get all unique tags used across user's notes
 */
router.get('/tags', NotesController.getAllTags);

/**
 * GET /api/notes/folders
 * Get all folders
 */
router.get('/folders', NotesController.getFolders);

/**
 * POST /api/notes/folders
 * Create a new folder
 */
router.post('/folders', NotesController.createFolder);

/**
 * PUT /api/notes/folders/:folderId
 * Update a folder
 */
router.put('/folders/:folderId', NotesController.updateFolder);

/**
 * DELETE /api/notes/folders/:folderId
 * Delete a folder (moves notes to no folder)
 */
router.delete('/folders/:folderId', NotesController.deleteFolder);

/**
 * GET /api/notes/:id
 * Get a single note by ID
 */
router.get('/:id', NotesController.getById);

/**
 * POST /api/notes
 * Create a new note
 */
router.post('/', NotesController.create);

/**
 * PUT /api/notes/:id
 * Update a note
 */
router.put('/:id', NotesController.update);

/**
 * DELETE /api/notes/:id
 * Delete a note
 */
router.delete('/:id', NotesController.remove);

// =============================================
// PIN / FAVORITE / ARCHIVE
// =============================================

/**
 * POST /api/notes/:id/pin
 * Toggle pin status
 */
router.post('/:id/pin', NotesController.togglePin);

/**
 * POST /api/notes/:id/favorite
 * Toggle favorite status
 */
router.post('/:id/favorite', NotesController.toggleFavorite);

/**
 * POST /api/notes/:id/archive
 * Archive a note
 */
router.post('/:id/archive', NotesController.archive);

/**
 * POST /api/notes/:id/unarchive
 * Unarchive a note
 */
router.post('/:id/unarchive', NotesController.unarchive);

/**
 * POST /api/notes/:id/duplicate
 * Duplicate a note
 */
router.post('/:id/duplicate', NotesController.duplicate);

// =============================================
// TAGS
// =============================================

/**
 * POST /api/notes/:id/tags
 * Add a tag to a note
 */
router.post('/:id/tags', NotesController.addTag);

/**
 * DELETE /api/notes/:id/tags/:tag
 * Remove a tag from a note
 */
router.delete('/:id/tags/:tag', NotesController.removeTag);

// =============================================
// FOLDER MANAGEMENT
// =============================================

/**
 * POST /api/notes/:id/move
 * Move note to a folder
 */
router.post('/:id/move', NotesController.moveToFolder);

// =============================================
// COLOR
// =============================================

/**
 * POST /api/notes/:id/color
 * Set note color
 */
router.post('/:id/color', NotesController.setColor);

// =============================================
// CHECKLISTS
// =============================================

/**
 * POST /api/notes/:id/checklist
 * Add a checklist item
 */
router.post('/:id/checklist', NotesController.addChecklistItem);

/**
 * PUT /api/notes/:id/checklist/:itemId
 * Update a checklist item (toggle complete, edit text)
 */
router.put('/:id/checklist/:itemId', NotesController.updateChecklistItem);

/**
 * DELETE /api/notes/:id/checklist/:itemId
 * Remove a checklist item
 */
router.delete('/:id/checklist/:itemId', NotesController.removeChecklistItem);

/**
 * POST /api/notes/:id/checklist/reorder
 * Reorder checklist items
 */
router.post('/:id/checklist/reorder', NotesController.reorderChecklist);

// =============================================
// SHARING
// =============================================

/**
 * GET /api/notes/shared
 * Get notes shared with me
 */
router.get('/shared', NotesController.getSharedWithMe);

/**
 * POST /api/notes/:id/share/circle
 * Share note with a circle
 */
router.post('/:id/share/circle', NotesController.shareWithCircle);

/**
 * POST /api/notes/:id/share/user
 * Share note with a user
 */
router.post('/:id/share/user', NotesController.shareWithUser);

/**
 * DELETE /api/notes/:id/share/circle/:circleId
 * Unshare note from a circle
 */
router.delete('/:id/share/circle/:circleId', NotesController.unshareWithCircle);

/**
 * DELETE /api/notes/:id/share/user/:targetUserId
 * Unshare note from a user
 */
router.delete('/:id/share/user/:targetUserId', NotesController.unshareWithUser);

// =============================================
// REMINDERS
// =============================================

/**
 * POST /api/notes/:id/reminder
 * Set a reminder for a note
 */
router.post('/:id/reminder', NotesController.setReminder);

/**
 * DELETE /api/notes/:id/reminder
 * Clear reminder from a note
 */
router.delete('/:id/reminder', NotesController.clearReminder);

// =============================================
// TRASH
// =============================================

/**
 * GET /api/notes/trash
 * Get all trashed notes
 */
router.get('/trash', NotesController.getTrash);

/**
 * POST /api/notes/:id/trash
 * Move note to trash
 */
router.post('/:id/trash', NotesController.moveToTrash);

/**
 * POST /api/notes/:id/restore
 * Restore note from trash
 */
router.post('/:id/restore', NotesController.restoreFromTrash);

/**
 * DELETE /api/notes/trash
 * Empty trash (delete all trashed notes permanently)
 */
router.delete('/trash', NotesController.emptyTrash);

/**
 * DELETE /api/notes/:id/permanent
 * Permanently delete a trashed note
 */
router.delete('/:id/permanent', NotesController.permanentDelete);

// =============================================
// TEMPLATES
// =============================================

/**
 * GET /api/notes/templates
 * Get all note templates
 */
router.get('/templates', NotesController.getTemplates);

/**
 * POST /api/notes/templates
 * Create a new template
 */
router.post('/templates', NotesController.createTemplate);

/**
 * PUT /api/notes/templates/:templateId
 * Update a template
 */
router.put('/templates/:templateId', NotesController.updateTemplate);

/**
 * DELETE /api/notes/templates/:templateId
 * Delete a template
 */
router.delete('/templates/:templateId', NotesController.deleteTemplate);

/**
 * POST /api/notes/templates/:templateId/create
 * Create a note from a template
 */
router.post('/templates/:templateId/create', NotesController.createFromTemplate);

// =============================================
// NOTE LINKING
// =============================================

/**
 * GET /api/notes/:id/links
 * Get linked notes (both links and backlinks)
 */
router.get('/:id/links', NotesController.getLinkedNotes);

/**
 * POST /api/notes/:id/links
 * Link this note to another note
 */
router.post('/:id/links', NotesController.linkNotes);

/**
 * DELETE /api/notes/:id/links/:targetNoteId
 * Unlink notes
 */
router.delete('/:id/links/:targetNoteId', NotesController.unlinkNotes);

// =============================================
// VERSION HISTORY
// =============================================

/**
 * GET /api/notes/:id/versions
 * Get version history for a note
 */
router.get('/:id/versions', NotesController.getVersions);

/**
 * POST /api/notes/:id/versions
 * Save current state as a version
 */
router.post('/:id/versions', NotesController.saveVersion);

/**
 * POST /api/notes/:id/versions/:versionId/restore
 * Restore a previous version
 */
router.post('/:id/versions/:versionId/restore', NotesController.restoreVersion);

// =============================================
// EXPORT
// =============================================

/**
 * GET /api/notes/:id/export/markdown
 * Export note as Markdown
 */
router.get('/:id/export/markdown', NotesController.exportToMarkdown);

/**
 * GET /api/notes/:id/export/json
 * Export note as JSON
 */
router.get('/:id/export/json', NotesController.exportToJSON);

// =============================================
// ENHANCED SEARCH
// =============================================

/**
 * GET /api/notes/search
 * Search notes with advanced options
 * Query params: q, inContent, inTags, inChecklist, includeShared, includeArchived
 */
router.get('/search', NotesController.searchNotes);

// =============================================
// ATTACHMENTS - Images, Videos, Files
// =============================================

const attachmentConfig = storageService.getMulterConfig({
  allowedTypes: [
    // Images
    'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
    // Videos
    'video/mp4', 'video/webm', 'video/quicktime',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ],
  maxSize: 50 * 1024 * 1024, // 50MB max
});

/**
 * POST /api/notes/upload
 * Upload attachment for notes - returns URL to use when creating/updating notes
 */
router.post('/upload', attachmentConfig.single('file'), NotesController.uploadAttachment);

/**
 * POST /api/notes/:id/attachments
 * Upload and attach file to an existing note
 */
router.post('/:id/attachments', attachmentConfig.single('file'), NotesController.addAttachmentToNote);

/**
 * DELETE /api/notes/:id/attachments/:attachmentId
 * Remove attachment from a note
 */
router.delete('/:id/attachments/:attachmentId', NotesController.removeAttachmentFromNote);

export default router;



