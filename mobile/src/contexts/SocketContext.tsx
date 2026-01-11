import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Alert } from 'react-native';
import socketService, { SocketEvents } from '../services/socket/SocketService';
import { useAuth } from './AuthContext';
import { usePin } from './PinContext';

interface SocketContextType {
  isConnected: boolean;
  socketId: string | undefined;
  onlineUserIds: string[];
  joinChat: (chatId: string) => void;
  leaveChat: (chatId: string) => void;
  sendMessage: (chatId: string, content: string, messageType?: string, attachments?: any[]) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  updateLocation: (latitude: number, longitude: number, address?: string, accuracy?: number) => void;
  requestLocation: (targetUserId: string) => void;
  sendEmergencyAlert: (message: string, location?: string, type?: string) => void;
  acknowledgeAlert: (alertId: string) => void;
  updateStatus: (status: string, message?: string) => void;
  initiateCall: (participants: string[], callType?: 'voice' | 'video') => void;
  answerCall: (callerId: string, answer: boolean) => void;
  endCall: (participants: string[]) => void;
  sendCallSignal: (targetId: string, signal: any) => void;
  on: <K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) => void;
  off: <K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { isPinLocked } = usePin();
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>();
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    // Only connect socket when user is authenticated AND app is not PIN locked
    if (isAuthenticated && user && !isPinLocked) {
      connectSocket();
    } else {
      // Don't try to connect if not authenticated or app is locked
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user, isPinLocked]);

  const connectSocket = async () => {
    try {
      if (!isAuthenticated || !user || isPinLocked) {
        console.log('[SOCKET] Connect aborted: User not authenticated or app is PIN locked');
        return;
      }
      await socketService.connect();
      setIsConnected(true);
      setSocketId(socketService.getSocketId());

      // Setup global event listeners
      setupGlobalEventListeners();

      console.log('Socket connected successfully');
    } catch (error) {
      console.error('Failed to connect socket:', error);
      setIsConnected(false);
      setSocketId(undefined);
    }
  };

  const disconnectSocket = () => {
    socketService.disconnect();
    setIsConnected(false);
    setSocketId(undefined);
  };

  const setupGlobalEventListeners = () => {
    // Presence listeners
    socketService.on('user:online', (data) => {
      if (!data?.userId) return;
      setOnlineUserIds((prev) => (prev.includes(data.userId) ? prev : [...prev, data.userId]));
    });

    socketService.on('user:offline', (data) => {
      if (!data?.userId) return;
      setOnlineUserIds((prev) => prev.filter((id) => id !== data.userId));
    });

    // Emergency alert listener
    socketService.on('safety:alert', (data) => {
      Alert.alert(
        '🚨 Emergency Alert',
        data.message || 'A family member has sent an emergency alert.',
        [
          {
            text: 'Acknowledge',
            onPress: () => acknowledgeAlert(data.alert.id),
            style: 'default'
          },
          {
            text: 'View Details',
            onPress: () => {
              // Navigate to safety screen or alert details
              console.log('Navigate to alert details');
            },
            style: 'default'
          }
        ],
        { cancelable: false }
      );
    });

    // Location request listener
    socketService.on('location_request', (data) => {
      Alert.alert(
        '📍 Location Request',
        `${data.fromUserName} is requesting your location`,
        [
          {
            text: 'Share Location',
            onPress: () => {
              // Share current location
              console.log('Share location with', data.fromUserId);
            },
            style: 'default'
          },
          {
            text: 'Decline',
            style: 'cancel'
          }
        ]
      );
    });

    // Connection status listener
    socketService.on('connected', (data) => {
      console.log('Socket server connected:', data);
      setIsConnected(true);
      setSocketId(socketService.getSocketId());
    });

    socketService.on('error', (data) => {
      console.error('Socket error:', data);
      // Suppress auth-related errors as they are handled by AuthContext
      if (data?.message &&
        !data.message.includes('Invalid token') &&
        !data.message.includes('inactive user')) {
        Alert.alert('Connection Error', data.message);
      }
    });
  };

  // =============================================
  // CHAT METHODS
  // =============================================

  const joinChat = (chatId: string) => {
    socketService.joinChat(chatId);
  };

  const leaveChat = (chatId: string) => {
    socketService.leaveChat(chatId);
  };

  const sendMessage = (chatId: string, content: string, messageType: string = 'text', attachments: any[] = []) => {
    socketService.sendMessage(chatId, content, messageType, attachments);
  };

  const startTyping = (chatId: string) => {
    socketService.startTyping(chatId);
  };

  const stopTyping = (chatId: string) => {
    socketService.stopTyping(chatId);
  };

  // =============================================
  // LOCATION METHODS
  // =============================================

  const updateLocation = (latitude: number, longitude: number, address?: string, accuracy?: number) => {
    socketService.updateLocation(latitude, longitude, address, accuracy);
  };

  const requestLocation = (targetUserId: string) => {
    socketService.requestLocation(targetUserId);
  };

  // =============================================
  // SAFETY METHODS
  // =============================================

  const sendEmergencyAlert = (message: string, location?: string, type: string = 'panic') => {
    socketService.sendEmergencyAlert(message, location, type);
  };

  const acknowledgeAlert = (alertId: string) => {
    socketService.acknowledgeAlert(alertId);
  };

  // =============================================
  // hourse METHODS
  // =============================================

  const updateStatus = (status: string, message?: string) => {
    socketService.updateStatus(status, message);
  };

  // =============================================
  // CALL METHODS
  // =============================================

  const initiateCall = (participants: string[], callType: 'voice' | 'video' = 'voice') => {
    socketService.initiateCall(participants, callType);
  };

  const answerCall = (callerId: string, answer: boolean) => {
    socketService.answerCall(callerId, answer);
  };

  const endCall = (participants: string[]) => {
    socketService.endCall(participants);
  };

  const sendCallSignal = (targetId: string, signal: any) => {
    socketService.sendCallSignal(targetId, signal);
  };

  // =============================================
  // EVENT LISTENER METHODS
  // =============================================

  const on = <K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) => {
    socketService.on(event, callback);
  };

  const off = <K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]) => {
    socketService.off(event, callback);
  };

  const contextValue: SocketContextType = {
    isConnected,
    socketId,
    onlineUserIds,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    updateLocation,
    requestLocation,
    sendEmergencyAlert,
    acknowledgeAlert,
    updateStatus,
    initiateCall,
    answerCall,
    endCall,
    sendCallSignal,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// Safe default values for when SocketProvider is not present
const defaultSocketContext: SocketContextType = {
  isConnected: false,
  socketId: undefined,
  onlineUserIds: [],
  joinChat: () => { },
  leaveChat: () => { },
  sendMessage: () => { },
  startTyping: () => { },
  stopTyping: () => { },
  updateLocation: () => { },
  requestLocation: () => { },
  sendEmergencyAlert: () => { },
  acknowledgeAlert: () => { },
  updateStatus: () => { },
  initiateCall: () => { },
  answerCall: () => { },
  endCall: () => { },
  sendCallSignal: () => { },
  on: () => { },
  off: () => { },
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  // Return safe defaults if provider is not present (prevents crashes)
  if (context === undefined) {
    console.warn('useSocket: SocketProvider not found, using defaults');
    return defaultSocketContext;
  }
  return context;
};

export default SocketContext;
