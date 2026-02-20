/**
 * Chat Socket Handlers
 * 
 * TypeScript implementation of chat socket event handlers.
 * Replaces Mongoose models with Supabase queries.
 * Includes rate limiting and retry logic.
 */

import { Server, Socket } from 'socket.io';
import {
  handleSendMessage,
  handleUpdateMessage,
  handleDeleteMessage,
  handleMarkMessagesRead
} from './handlers/messageHandlers';
import {
  handleJoinChat,
  handleLeaveChat,
  handleChatRoomUpdated,
  handleParticipantAdded,
  handleParticipantRemoved
} from './handlers/roomHandlers';
import {
  handleAddReaction,
  handleRemoveReaction
} from './handlers/reactionHandlers';
import {
  handleTyping,
  handleStopTyping
} from './handlers/typingHandlers';

// interface SocketData { // Not used
//   userId: string;
// }

export const setupChatHandlers = (io: Server, socket: Socket & { userId?: string }) => {
  // Room Management
  socket.on('join-chat', handleJoinChat(io, socket));
  socket.on('leave-chat', handleLeaveChat(io, socket));
  socket.on('chat-room-updated', handleChatRoomUpdated(io, socket));
  socket.on('participant-added', handleParticipantAdded(io, socket));
  socket.on('participant-removed', handleParticipantRemoved(io, socket));

  // Message Management
  socket.on('send-message', handleSendMessage(io, socket));
  socket.on('update-message', handleUpdateMessage(io, socket));
  socket.on('delete-message', handleDeleteMessage(io, socket));
  socket.on('mark-messages-read', handleMarkMessagesRead(io, socket));

  // Reactions
  socket.on('add-reaction', handleAddReaction(io, socket));
  socket.on('remove-reaction', handleRemoveReaction(io, socket));

  // Typing Indicators
  socket.on('typing', handleTyping(io, socket));
  socket.on('stop-typing', handleStopTyping(io, socket));
};
