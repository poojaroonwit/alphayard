import { Server, Socket } from 'socket.io';
import {
  pinningService,
  forwardingService,
  threadingService,
  chatMentionsService,
  chatPollsService,
  callsService,
  disappearingService,
} from '../../services/chat';

export function registerChatFeaturesHandlers(io: Server, socket: Socket) {
  const userId = (socket as any).userId;

  // =====================================================
  // MESSAGE PINNING
  // =====================================================
  
  socket.on('pin-message', async (data: {
    chatRoomId: string;
    messageId: string;
    expiresAt?: string;
  }) => {
    try {
      const pinned = await pinningService.pinMessage(
        data.chatRoomId,
        data.messageId,
        userId,
        data.expiresAt ? new Date(data.expiresAt) : undefined
      );

      // Broadcast to room
      io.to(`chat:${data.chatRoomId}`).emit('message-pinned', {
        chatRoomId: data.chatRoomId,
        pinned,
      });
    } catch (error: any) {
      socket.emit('error', { event: 'pin-message', message: error.message });
    }
  });

  socket.on('unpin-message', async (data: {
    chatRoomId: string;
    messageId: string;
  }) => {
    try {
      await pinningService.unpinMessage(data.chatRoomId, data.messageId);

      io.to(`chat:${data.chatRoomId}`).emit('message-unpinned', {
        chatRoomId: data.chatRoomId,
        messageId: data.messageId,
      });
    } catch (error: any) {
      socket.emit('error', { event: 'unpin-message', message: error.message });
    }
  });

  // =====================================================
  // MESSAGE FORWARDING
  // =====================================================
  
  socket.on('forward-message', async (data: {
    originalMessageId: string;
    targetChatRoomIds: string[];
  }) => {
    try {
      const newMessageIds = await forwardingService.forwardMessage({
        originalMessageId: data.originalMessageId,
        targetChatRoomIds: data.targetChatRoomIds,
        senderId: userId,
      });

      // Notify each target room
      for (let i = 0; i < data.targetChatRoomIds.length; i++) {
        io.to(`chat:${data.targetChatRoomIds[i]}`).emit('new-message', {
          chatRoomId: data.targetChatRoomIds[i],
          messageId: newMessageIds[i],
          isForwarded: true,
        });
      }

      socket.emit('message-forwarded', {
        originalMessageId: data.originalMessageId,
        newMessageIds,
      });
    } catch (error: any) {
      socket.emit('error', { event: 'forward-message', message: error.message });
    }
  });

  // =====================================================
  // THREAD REPLIES
  // =====================================================
  
  socket.on('thread-reply', async (data: {
    threadId: string;
    chatRoomId: string;
    content: string;
    messageType?: string;
  }) => {
    try {
      const reply = await threadingService.replyToThread(
        data.threadId,
        data.chatRoomId,
        userId,
        data.content,
        data.messageType || 'text'
      );

      // Process mentions in the reply
      await chatMentionsService.processMentions(
        reply.id,
        data.chatRoomId,
        userId,
        data.content
      );

      // Broadcast to room
      io.to(`chat:${data.chatRoomId}`).emit('thread-reply', {
        threadId: data.threadId,
        reply,
      });

      // Get updated thread summary
      const summary = await threadingService.getThreadSummary(data.threadId);
      io.to(`chat:${data.chatRoomId}`).emit('thread-updated', {
        threadId: data.threadId,
        summary,
      });
    } catch (error: any) {
      socket.emit('error', { event: 'thread-reply', message: error.message });
    }
  });

  // =====================================================
  // POLLS
  // =====================================================
  
  socket.on('poll-vote', async (data: {
    pollId: string;
    optionIds: string[];
    chatRoomId: string;
  }) => {
    try {
      const poll = await chatPollsService.vote(data.pollId, userId, data.optionIds);

      // Broadcast updated poll to room
      io.to(`chat:${data.chatRoomId}`).emit('poll-updated', {
        pollId: data.pollId,
        poll,
      });
    } catch (error: any) {
      socket.emit('error', { event: 'poll-vote', message: error.message });
    }
  });

  socket.on('poll-add-option', async (data: {
    pollId: string;
    optionText: string;
    chatRoomId: string;
  }) => {
    try {
      const option = await chatPollsService.addOption(data.pollId, userId, data.optionText);

      io.to(`chat:${data.chatRoomId}`).emit('poll-option-added', {
        pollId: data.pollId,
        option,
      });
    } catch (error: any) {
      socket.emit('error', { event: 'poll-add-option', message: error.message });
    }
  });

  socket.on('poll-close', async (data: {
    pollId: string;
    chatRoomId: string;
  }) => {
    try {
      const poll = await chatPollsService.closePoll(data.pollId, userId);

      io.to(`chat:${data.chatRoomId}`).emit('poll-closed', {
        pollId: data.pollId,
        poll,
      });
    } catch (error: any) {
      socket.emit('error', { event: 'poll-close', message: error.message });
    }
  });

  // =====================================================
  // CALLS
  // =====================================================
  
  socket.on('call-initiate', async (data: {
    callType: 'voice' | 'video' | 'screen_share';
    chatRoomId?: string;
    participantIds: string[];
  }) => {
    try {
      const call = await callsService.initiateCall(
        userId,
        data.callType,
        data.chatRoomId,
        data.participantIds
      );

      // Notify all participants
      for (const participantId of data.participantIds) {
        io.to(`user:${participantId}`).emit('incoming-call', {
          call,
          initiator: userId,
        });
      }

      socket.emit('call-initiated', { call });
    } catch (error: any) {
      socket.emit('error', { event: 'call-initiate', message: error.message });
    }
  });

  socket.on('call-join', async (data: { callId: string }) => {
    try {
      const participant = await callsService.joinCall(data.callId, userId);
      const call = await callsService.getCall(data.callId);

      if (call) {
        // Notify all call participants
        for (const p of call.participants || []) {
          io.to(`user:${p.userId}`).emit('call-participant-joined', {
            callId: data.callId,
            participant,
          });
        }

        // Update call status if this is the second participant
        if (call.status === 'initiated' || call.status === 'ringing') {
          await callsService.updateCallStatus(data.callId, 'ongoing');
          for (const p of call.participants || []) {
            io.to(`user:${p.userId}`).emit('call-started', {
              callId: data.callId,
            });
          }
        }
      }

      socket.emit('call-joined', { callId: data.callId, participant });
    } catch (error: any) {
      socket.emit('error', { event: 'call-join', message: error.message });
    }
  });

  socket.on('call-leave', async (data: { callId: string }) => {
    try {
      await callsService.leaveCall(data.callId, userId);
      const call = await callsService.getCall(data.callId);

      if (call) {
        for (const p of call.participants || []) {
          io.to(`user:${p.userId}`).emit('call-participant-left', {
            callId: data.callId,
            userId,
          });
        }

        if (call.status === 'ended') {
          for (const p of call.participants || []) {
            io.to(`user:${p.userId}`).emit('call-ended', {
              callId: data.callId,
              reason: 'all_left',
            });
          }
        }
      }
    } catch (error: any) {
      socket.emit('error', { event: 'call-leave', message: error.message });
    }
  });

  socket.on('call-decline', async (data: { callId: string }) => {
    try {
      await callsService.declineCall(data.callId, userId);
      const call = await callsService.getCall(data.callId);

      if (call) {
        // Notify the initiator
        io.to(`user:${call.initiatorId}`).emit('call-declined', {
          callId: data.callId,
          userId,
        });

        if (call.status === 'declined') {
          io.to(`user:${call.initiatorId}`).emit('call-ended', {
            callId: data.callId,
            reason: 'declined',
          });
        }
      }
    } catch (error: any) {
      socket.emit('error', { event: 'call-decline', message: error.message });
    }
  });

  socket.on('call-update-state', async (data: {
    callId: string;
    isMuted?: boolean;
    isVideoOff?: boolean;
    isScreenSharing?: boolean;
  }) => {
    try {
      const participant = await callsService.updateParticipantState(
        data.callId,
        userId,
        {
          isMuted: data.isMuted,
          isVideoOff: data.isVideoOff,
          isScreenSharing: data.isScreenSharing,
        }
      );

      const call = await callsService.getCall(data.callId);
      if (call) {
        for (const p of call.participants || []) {
          io.to(`user:${p.userId}`).emit('call-participant-state-changed', {
            callId: data.callId,
            participant,
          });
        }
      }
    } catch (error: any) {
      socket.emit('error', { event: 'call-update-state', message: error.message });
    }
  });

  // WebRTC Signaling
  socket.on('call-signal', (data: {
    callId: string;
    targetUserId: string;
    signal: any;
  }) => {
    io.to(`user:${data.targetUserId}`).emit('call-signal', {
      callId: data.callId,
      fromUserId: userId,
      signal: data.signal,
    });
  });

  // =====================================================
  // DISAPPEARING MESSAGES
  // =====================================================
  
  socket.on('set-disappear-settings', async (data: {
    chatRoomId: string;
    enabled: boolean;
    durationSeconds?: number;
  }) => {
    try {
      const settings = await disappearingService.setDisappearSettings(
        data.chatRoomId,
        userId,
        data.enabled,
        data.durationSeconds
      );

      io.to(`chat:${data.chatRoomId}`).emit('disappear-settings-changed', {
        chatRoomId: data.chatRoomId,
        settings,
      });
    } catch (error: any) {
      socket.emit('error', { event: 'set-disappear-settings', message: error.message });
    }
  });

  // =====================================================
  // MENTIONS
  // =====================================================
  
  socket.on('mention-read', async (data: { mentionId: string }) => {
    try {
      await chatMentionsService.markAsRead(data.mentionId, userId);
      socket.emit('mention-marked-read', { mentionId: data.mentionId });
    } catch (error: any) {
      socket.emit('error', { event: 'mention-read', message: error.message });
    }
  });
}

export default registerChatFeaturesHandlers;
