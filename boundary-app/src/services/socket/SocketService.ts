import { io, Socket } from 'socket.io-client';
import { config } from '../../config/environment';
import { appkit } from '../api/appkit';

export interface SocketEvents {
  // Connection events (custom server events)
  connected: (data: { message: string; userId: string; timestamp: string }) => void;
  error: (data: { message: string }) => void;

  // Chat events (aligned with backend socket/chat.ts)
  'chat-joined': (data: { chatId: string }) => void;
  'chat-left': (data: { chatId: string }) => void;
  'user-joined': (data: { chatId: string; userId: string; timestamp: string }) => void;
  'user-left': (data: { chatId: string; userId: string; timestamp: string }) => void;
  'new-message': (data: { message: any }) => void;
  'message-updated': (data: { message: any }) => void;
  'message-deleted': (data: { messageId: string; chatRoomId: string }) => void;
  'reaction-added': (data: any) => void;
  'reaction-removed': (data: any) => void;
  'chat:typing': (data: { chatId: string; userId: string; isTyping: boolean }) => void;

  // Location events
  'location:update': (data: { userId: string; latitude: number; longitude: number; accuracy?: number; address?: string; timestamp: string }) => void;

  // Safety events
  'safety:alert': (data: { id: string; type: string; message: string; location?: any; userId: string; circleId: string; timestamp: string; status: string }) => void;

  // Presence events
  'user:online': (data: { userId: string; timestamp: string }) => void;
  'user:offline': (data: { userId: string; timestamp: string }) => void;

  // Call events
  'incoming-call': (data: { callerId: string; callType: 'voice' | 'video'; participants: string[] }) => void;
  'call-answered': (data: { answererId: string; answer: boolean }) => void;
  'call-ended': (data: { endedBy: string }) => void;
  'call-signal': (data: { fromId: string; signal: any }) => void;

  // Notification events
  'notification:new': (data: { id: string; type: string; title: string; message: string; data?: any; timestamp: string }) => void;
  'notification:read': (data: { notificationId: string }) => void;
  'notification:deleted': (data: { notificationId: string }) => void;
  'notification:count': (data: { unreadCount: number }) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  async connect(): Promise<void> {
    try {
      // Use the AppKit SDK to get the current access token
      const token = await appkit.auth.getAccessToken();

      if (!token) {
        console.log('No authentication token found via AppKit, skipping socket connection');
        return;
      }

      // Strip /api/v1 from the URL for Socket.IO connection as it appends /socket.io automatically
      const socketUrl = config.apiUrl.replace('/api/v1', '');

      this.socket = io(socketUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket initialization failed'));
          return;
        }

        this.socket.on('connect', () => {
          console.log('Socket connected:', this.socket?.id);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('connect_error', async (error) => {
          // Only log if it's not a connection refused error (backend offline)
          const isConnectionRefused = error.message?.includes('ERR_CONNECTION_REFUSED') || 
                                     error.message?.includes('Connection refused') ||
                                     error.message?.includes('websocket error');
          
          if (!isConnectionRefused) {
            console.error('Socket connection error:', error.message);
          }

          // Only force logout on confirmed JWT expiry (not general auth failures,
          // which can occur when socket and API server have different JWT secrets
          // in dev — degrading gracefully is better than logging the user out).
          if (error.message.includes('jwt expired')) {
            console.log('Socket: JWT expired, logging out');
            await appkit.auth.logout();
            this.disconnect();
          } else {
            console.log('Socket auth failed (degraded mode — real-time features unavailable)');
            this.disconnect();
          }

          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('Socket disconnected:', reason);
          this.isConnected = false;
          this.handleReconnection();
        });
      });
    } catch (error) {
      console.error('Failed to connect to socket:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connected', (data) => {
      console.log('Socket server connected:', data);
    });

    this.socket.on('error', (data) => {
      console.error('Socket error:', data);
    });
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // =============================================
  // CHAT METHODS
  // =============================================

  joinChat(chatId: string): void {
    if (this.socket && this.isConnected) {
      // Backend expects simple chatId with event name "join-chat"
      this.socket.emit('join-chat', chatId);
    }
  }

  leaveChat(chatId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-chat', chatId);
    }
  }

  sendMessage(chatId: string, content: string, messageType: string = 'text', attachments: any[] = []): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('send-message', {
        chatId,
        content,
        type: messageType,
        metadata: {
          attachments,
        },
      });
    }
  }

  startTyping(chatId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('chat:typing', { chatId, isTyping: true });
    }
  }

  stopTyping(chatId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('chat:typing', { chatId, isTyping: false });
    }
  }

  // =============================================
  // LOCATION METHODS
  // =============================================

  updateLocation(latitude: number, longitude: number, address?: string, accuracy?: number): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('location:update', {
        latitude,
        longitude,
        address,
        accuracy
      });
    }
  }

  requestLocation(targetUserId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('location:request', { targetUserId });
    }
  }

  // =============================================
  // SAFETY METHODS
  // =============================================

  sendEmergencyAlert(message: string, location?: string, type: string = 'panic'): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('safety:alert', {
        message,
        location,
        type
      });
    }
  }

  acknowledgeAlert(alertId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('acknowledge_alert', { alertId });
    }
  }

  // =============================================
  // Circle METHODS
  // =============================================

  updateStatus(status: string, message?: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('update_status', { status, message });
    }
  }

  // =============================================
  // EVENT LISTENERS
  // =============================================

  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback as any);
      } else {
        this.socket.removeAllListeners(event);
      }
    }
  }

  // =============================================
  // NOTIFICATION METHODS
  // =============================================

  // Subscribe to notification events
  subscribeToNotifications(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('notification:subscribe');
    }
  }

  // Unsubscribe from notification events
  unsubscribeFromNotifications(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('notification:unsubscribe');
    }
  }

  // Mark notification as read via socket
  markNotificationRead(notificationId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('notification:mark-read', { notificationId });
    }
  }

  // Request unread notification count
  requestNotificationCount(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('notification:get-count');
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Reconnect with new token
  async reconnectWithNewToken(_token: string): Promise<void> {
    // The SDK handles tokens now, so we just trigger a reconnect
    this.disconnect();
    await this.connect();
  }

  // =============================================
  // CALL METHODS
  // =============================================

  initiateCall(participants: string[], callType: 'voice' | 'video' = 'voice'): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('initiate-call', {
        participants,
        callType
      });
    }
  }

  answerCall(callerId: string, answer: boolean): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('answer-call', {
        callerId,
        answer
      });
    }
  }

  endCall(participants: string[]): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('end-call', {
        participants
      });
    }
  }

  sendCallSignal(targetId: string, signal: any): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('call-signal', {
        targetId,
        signal
      });
    }
  }
}

// Singleton instance
export const socketService = new SocketService();
export default socketService;
