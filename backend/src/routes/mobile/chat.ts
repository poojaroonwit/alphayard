import express from 'express';
import { authenticateToken, requireCircleMember } from '../../middleware/auth';
import ChatController from '../../controllers/mobile/ChatController';

const router = express.Router();

// All routes require authentication and circle membership
router.use(authenticateToken as any);
router.use(requireCircleMember as any);

// Chat Rooms Routes
router.get('/families/:circleId/rooms', ChatController.getChatRooms as any);
router.post('/families/:circleId/rooms', ChatController.createChatRoom as any);
router.get('/rooms/:chatId', ChatController.getChatRoom as any);
router.put('/rooms/:chatId', ChatController.updateChatRoom as any);
router.delete('/rooms/:chatId', ChatController.deleteChatRoom as any);

// Chat Participants Routes
router.post('/rooms/:chatId/participants', ChatController.addParticipant as any);
router.delete('/rooms/:chatId/participants/:userId', ChatController.removeParticipant as any);

// Messages Routes
router.get('/rooms/:chatId/messages', ChatController.getMessages as any);
router.post('/rooms/:chatId/messages', ChatController.sendMessage as any);
router.put('/messages/:messageId', ChatController.updateMessage as any);
router.delete('/messages/:messageId', ChatController.deleteMessage as any);

// Message Reactions Routes
router.post('/messages/:messageId/reactions', ChatController.addReaction as any);
router.delete('/messages/:messageId/reactions', ChatController.removeReaction as any);

export default router;

