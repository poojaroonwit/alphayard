import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import {
  pinningService,
  forwardingService,
  threadingService,
  scheduledService,
  disappearingService,
  chatBookmarksService,
  linkPreviewService,
  chatMentionsService,
  chatPollsService,
  broadcastService,
  chatSettingsService,
  templatesService,
  stickersService,
  callsService,
} from '../../services/chat';

const router = Router();

// =====================================================
// MESSAGE PINNING
// =====================================================

// Pin a message
router.post('/rooms/:chatRoomId/pin/:messageId', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId, messageId } = req.params;
    const userId = (req as any).user?.id;
    const { expiresAt } = req.body;

    const pinned = await pinningService.pinMessage(chatRoomId, messageId, userId, expiresAt);
    res.json({ success: true, pinned });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unpin a message
router.delete('/rooms/:chatRoomId/pin/:messageId', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId, messageId } = req.params;
    const result = await pinningService.unpinMessage(chatRoomId, messageId);
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pinned messages
router.get('/rooms/:chatRoomId/pinned', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const pinnedMessages = await pinningService.getPinnedMessages(chatRoomId);
    res.json({ success: true, pinnedMessages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// MESSAGE FORWARDING
// =====================================================

// Forward a message
router.post('/messages/:messageId/forward', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = (req as any).user?.id;
    const { targetChatRoomIds } = req.body;

    const newMessageIds = await forwardingService.forwardMessage({
      originalMessageId: messageId,
      targetChatRoomIds,
      senderId: userId,
    });
    res.json({ success: true, newMessageIds });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get forward info for a message
router.get('/messages/:messageId/forward-info', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { messageId } = req.params;
    const forwardInfo = await forwardingService.getForwardInfo(messageId);
    res.json({ success: true, forwardInfo });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// MESSAGE THREADS
// =====================================================

// Reply to a thread
router.post('/threads/:threadId/reply', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { threadId } = req.params;
    const userId = (req as any).user?.id;
    const { chatRoomId, content, messageType } = req.body;

    const reply = await threadingService.replyToThread(threadId, chatRoomId, userId, content, messageType);
    res.json({ success: true, reply });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get thread replies
router.get('/threads/:threadId/replies', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { threadId } = req.params;
    const { limit, offset, before } = req.query;

    const replies = await threadingService.getThreadReplies(threadId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      before: before ? new Date(before as string) : undefined,
    });
    res.json({ success: true, replies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get thread summary
router.get('/threads/:threadId/summary', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { threadId } = req.params;
    const summary = await threadingService.getThreadSummary(threadId);
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get threads in a chat room
router.get('/rooms/:chatRoomId/threads', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const { limit } = req.query;
    const threads = await threadingService.getChatThreads(chatRoomId, limit ? parseInt(limit as string) : undefined);
    res.json({ success: true, threads });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// SCHEDULED MESSAGES
// =====================================================

// Create scheduled message
router.post('/scheduled', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { chatRoomId, content, messageType, attachments, scheduledFor, timezone } = req.body;

    const scheduled = await scheduledService.createScheduledMessage({
      chatRoomId,
      senderId: userId,
      content,
      messageType,
      attachments,
      scheduledFor: new Date(scheduledFor),
      timezone,
    });
    res.json({ success: true, scheduled });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's scheduled messages
router.get('/scheduled', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { chatRoomId } = req.query;
    const scheduledMessages = await scheduledService.getScheduledMessages(userId, chatRoomId as string);
    res.json({ success: true, scheduledMessages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update scheduled message
router.put('/scheduled/:id', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const updates = req.body;

    const scheduled = await scheduledService.updateScheduledMessage(id, userId, updates);
    res.json({ success: true, scheduled });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel scheduled message
router.delete('/scheduled/:id', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const result = await scheduledService.cancelScheduledMessage(id, userId);
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// DISAPPEARING MESSAGES
// =====================================================

// Set disappearing message settings
router.put('/rooms/:chatRoomId/disappear', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const userId = (req as any).user?.id;
    const { enabled, durationSeconds } = req.body;

    const settings = await disappearingService.setDisappearSettings(chatRoomId, userId, enabled, durationSeconds);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get disappearing message settings
router.get('/rooms/:chatRoomId/disappear', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const settings = await disappearingService.getDisappearSettings(chatRoomId);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get duration presets
router.get('/disappear/presets', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const presets = disappearingService.getDurationPresets();
    res.json({ success: true, presets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// MESSAGE BOOKMARKS
// =====================================================

// Bookmark a message
router.post('/bookmarks', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { messageId, note, collectionName } = req.body;

    const bookmark = await chatBookmarksService.bookmarkMessage(userId, messageId, note, collectionName);
    res.json({ success: true, bookmark });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove bookmark
router.delete('/bookmarks/:messageId', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = (req as any).user?.id;
    const result = await chatBookmarksService.removeBookmark(userId, messageId);
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get bookmarks
router.get('/bookmarks', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { collectionName, limit, offset } = req.query;

    const bookmarks = await chatBookmarksService.getBookmarks(userId, {
      collectionName: collectionName as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json({ success: true, bookmarks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get bookmark collections
router.get('/bookmarks/collections', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const collections = await chatBookmarksService.getCollections(userId);
    res.json({ success: true, collections });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search bookmarks
router.get('/bookmarks/search', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { q, limit } = req.query;
    const bookmarks = await chatBookmarksService.searchBookmarks(userId, q as string, limit ? parseInt(limit as string) : undefined);
    res.json({ success: true, bookmarks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// CHAT MENTIONS
// =====================================================

// Get unread mentions
router.get('/mentions/unread', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { limit } = req.query;
    const mentions = await chatMentionsService.getUnreadMentions(userId, limit ? parseInt(limit as string) : undefined);
    res.json({ success: true, mentions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all mentions
router.get('/mentions', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { limit, offset } = req.query;
    const mentions = await chatMentionsService.getAllMentions(userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json({ success: true, mentions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark mention as read
router.post('/mentions/:mentionId/read', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { mentionId } = req.params;
    const userId = (req as any).user?.id;
    const result = await chatMentionsService.markAsRead(mentionId, userId);
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all mentions as read
router.post('/mentions/read-all', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { chatRoomId } = req.body;
    const count = await chatMentionsService.markAllAsRead(userId, chatRoomId);
    res.json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get unread mention count
router.get('/mentions/count', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const count = await chatMentionsService.getUnreadCount(userId);
    res.json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// CHAT POLLS
// =====================================================

// Create a poll
router.post('/polls', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { chatRoomId, question, options, pollType, isAnonymous, allowsAddOptions, closesAt, correctOptionIndex } = req.body;

    const poll = await chatPollsService.createPoll({
      chatRoomId,
      creatorId: userId,
      question,
      options,
      pollType,
      isAnonymous,
      allowsAddOptions,
      closesAt: closesAt ? new Date(closesAt) : undefined,
      correctOptionIndex,
    });
    res.json({ success: true, poll });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get poll
router.get('/polls/:pollId', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { pollId } = req.params;
    const userId = (req as any).user?.id;
    const poll = await chatPollsService.getPoll(pollId, userId);
    res.json({ success: true, poll });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Vote on poll
router.post('/polls/:pollId/vote', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { pollId } = req.params;
    const userId = (req as any).user?.id;
    const { optionIds } = req.body;

    const poll = await chatPollsService.vote(pollId, userId, optionIds);
    res.json({ success: true, poll });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Retract vote
router.delete('/polls/:pollId/vote', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { pollId } = req.params;
    const userId = (req as any).user?.id;
    const { optionId } = req.body;

    const poll = await chatPollsService.retractVote(pollId, userId, optionId);
    res.json({ success: true, poll });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add option to poll
router.post('/polls/:pollId/options', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { pollId } = req.params;
    const userId = (req as any).user?.id;
    const { optionText } = req.body;

    const option = await chatPollsService.addOption(pollId, userId, optionText);
    res.json({ success: true, option });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Close poll
router.post('/polls/:pollId/close', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { pollId } = req.params;
    const userId = (req as any).user?.id;
    const poll = await chatPollsService.closePoll(pollId, userId);
    res.json({ success: true, poll });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// BROADCAST LISTS
// =====================================================

// Create broadcast list
router.post('/broadcasts', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { name, description } = req.body;
    const list = await broadcastService.createList(userId, name, description);
    res.json({ success: true, list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get broadcast lists
router.get('/broadcasts', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const lists = await broadcastService.getLists(userId);
    res.json({ success: true, lists });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add recipients to broadcast list
router.post('/broadcasts/:listId/recipients', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { listId } = req.params;
    const { userIds } = req.body;
    const count = await broadcastService.addRecipients(listId, userIds);
    res.json({ success: true, addedCount: count });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send broadcast message
router.post('/broadcasts/:listId/send', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { listId } = req.params;
    const userId = (req as any).user?.id;
    const { content, messageType, attachments } = req.body;

    const message = await broadcastService.sendBroadcast(listId, userId, content, messageType, attachments);
    res.json({ success: true, message });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// CHAT SETTINGS (Mute, Archive, Pin)
// =====================================================

// Mute chat
router.post('/rooms/:chatRoomId/mute', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const userId = (req as any).user?.id;
    const { mutedUntil } = req.body;

    const settings = await chatSettingsService.muteChat(userId, chatRoomId, mutedUntil ? new Date(mutedUntil) : undefined);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unmute chat
router.delete('/rooms/:chatRoomId/mute', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const userId = (req as any).user?.id;
    const settings = await chatSettingsService.unmuteChat(userId, chatRoomId);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Archive chat
router.post('/rooms/:chatRoomId/archive', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const userId = (req as any).user?.id;
    const settings = await chatSettingsService.archiveChat(userId, chatRoomId);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unarchive chat
router.delete('/rooms/:chatRoomId/archive', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const userId = (req as any).user?.id;
    const settings = await chatSettingsService.unarchiveChat(userId, chatRoomId);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get archived chats
router.get('/archived', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const archivedChatIds = await chatSettingsService.getArchivedChats(userId);
    res.json({ success: true, archivedChatIds });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pin chat
router.post('/rooms/:chatRoomId/pin-chat', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const userId = (req as any).user?.id;
    const settings = await chatSettingsService.pinChat(userId, chatRoomId);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unpin chat
router.delete('/rooms/:chatRoomId/pin-chat', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const userId = (req as any).user?.id;
    const settings = await chatSettingsService.unpinChat(userId, chatRoomId);
    res.json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pinned chats
router.get('/pinned-chats', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const pinnedChatIds = await chatSettingsService.getPinnedChats(userId);
    res.json({ success: true, pinnedChatIds });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// QUICK REPLY TEMPLATES
// =====================================================

// Get templates
router.get('/templates', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const templates = await templatesService.getTemplates(userId);
    res.json({ success: true, templates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create template
router.post('/templates', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { shortcut, title, content, attachments } = req.body;
    const template = await templatesService.createTemplate(userId, shortcut, title, content, attachments);
    res.json({ success: true, template });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update template
router.put('/templates/:id', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const template = await templatesService.updateTemplate(id, userId, req.body);
    res.json({ success: true, template });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete template
router.delete('/templates/:id', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const result = await templatesService.deleteTemplate(id, userId);
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// STICKERS
// =====================================================

// Get user's sticker packs
router.get('/stickers/packs', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const packs = await stickersService.getUserPacks(userId);
    res.json({ success: true, packs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all available packs
router.get('/stickers/store', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const packs = await stickersService.getAllPacks(false);
    res.json({ success: true, packs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get pack details with stickers
router.get('/stickers/packs/:packId', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { packId } = req.params;
    const pack = await stickersService.getPack(packId);
    res.json({ success: true, pack });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add pack to user's collection
router.post('/stickers/packs/:packId', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { packId } = req.params;
    const userId = (req as any).user?.id;
    const result = await stickersService.addPackToUser(userId, packId);
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove pack from user's collection
router.delete('/stickers/packs/:packId', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { packId } = req.params;
    const userId = (req as any).user?.id;
    const result = await stickersService.removePackFromUser(userId, packId);
    res.json({ success: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get recent stickers
router.get('/stickers/recent', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { limit } = req.query;
    const stickers = await stickersService.getRecentStickers(userId, limit ? parseInt(limit as string) : undefined);
    res.json({ success: true, stickers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track sticker usage
router.post('/stickers/:stickerId/use', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { stickerId } = req.params;
    const userId = (req as any).user?.id;
    await stickersService.trackStickerUsage(userId, stickerId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// VOICE/VIDEO CALLS
// =====================================================

// Initiate a call
router.post('/calls', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { callType, chatRoomId, participantIds } = req.body;

    const call = await callsService.initiateCall(userId, callType, chatRoomId, participantIds);
    res.json({ success: true, call });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get call
router.get('/calls/:callId', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { callId } = req.params;
    const call = await callsService.getCall(callId);
    res.json({ success: true, call });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join call
router.post('/calls/:callId/join', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { callId } = req.params;
    const userId = (req as any).user?.id;
    const participant = await callsService.joinCall(callId, userId);
    res.json({ success: true, participant });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Leave call
router.post('/calls/:callId/leave', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { callId } = req.params;
    const userId = (req as any).user?.id;
    await callsService.leaveCall(callId, userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Decline call
router.post('/calls/:callId/decline', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { callId } = req.params;
    const userId = (req as any).user?.id;
    await callsService.declineCall(callId, userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update call status (end call)
router.put('/calls/:callId/status', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { callId } = req.params;
    const { status, endReason } = req.body;
    const call = await callsService.updateCallStatus(callId, status, endReason);
    res.json({ success: true, call });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get call history
router.get('/calls/history', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { limit, offset, callType } = req.query;

    const calls = await callsService.getCallHistory(userId, {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      callType: callType as string,
    });
    res.json({ success: true, calls });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active call for chat room
router.get('/rooms/:chatRoomId/active-call', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const call = await callsService.getActiveCall(chatRoomId);
    res.json({ success: true, call });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// LINK PREVIEWS
// =====================================================

// Get link previews for a message
router.get('/messages/:messageId/previews', authenticateToken as any, async (req: any, res: Response) => {
  try {
    const { messageId } = req.params;
    const previews = await linkPreviewService.getMessagePreviews(messageId);
    res.json({ success: true, previews });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
