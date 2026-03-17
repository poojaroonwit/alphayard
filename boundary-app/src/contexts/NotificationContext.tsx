import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import NotificationService, { notificationService } from '../services/notification/NotificationService';
import { socketService } from '../services/socket/SocketService';
import * as Notifications from 'expo-notifications';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  pushToken: string | null;
  isInitialized: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => Promise<void>;
  initializeNotifications: () => Promise<string | null>;
  setNotificationNavigationHandler: (handler: (data: any) => void) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigationHandlerRef = useRef<((data: any) => void) | null>(null);
  const service = NotificationService.getInstance();

  // Set navigation handler for notification tap
  const setNotificationNavigationHandler = useCallback((handler: (data: any) => void) => {
    navigationHandlerRef.current = handler;
  }, []);

  // Initialize push notifications
  const initializeNotifications = useCallback(async (): Promise<string | null> => {
    try {
      console.log('[NOTIFICATION] Initializing push notifications...');
      const token = await service.initialize();
      setPushToken(token);
      setIsInitialized(true);

      // Set up notification response handler for deep linking
      service.setOnNotificationResponse((response) => {
        const data = response.notification.request.content.data;
        console.log('[NOTIFICATION] User tapped notification:', data);
        
        if (navigationHandlerRef.current && data) {
          navigationHandlerRef.current(data);
        }
      });

      // Set up notification received handler
      service.setOnNotificationReceived((notification) => {
        console.log('[NOTIFICATION] Received in foreground:', notification.request.content);
        // Update unread count
        setUnreadCount(prev => prev + 1);
      });

      // Subscribe to socket notifications
      if (socketService.isSocketConnected()) {
        socketService.subscribeToNotifications();
      }

      console.log('[NOTIFICATION] Initialized with token:', token);
      return token;
    } catch (err) {
      console.error('[NOTIFICATION] Initialization failed:', err);
      return null;
    }
  }, []);

  // Setup socket notification listeners
  useEffect(() => {
    // Listen for new notifications from socket
    const handleNewNotification = (data: any) => {
      console.log('[NOTIFICATION] Socket - New notification:', data);
      const newNotification: Notification = {
        id: data.id,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        timestamp: data.timestamp || new Date().toISOString(),
        isRead: false,
        actionUrl: data.actionUrl,
        metadata: data.data,
      };
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show local notification
      service.handleSocketNotification(data);
    };

    const handleNotificationRead = (data: { notificationId: string }) => {
      setNotifications(prev =>
        prev.map(n => n.id === data.notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const handleNotificationDeleted = (data: { notificationId: string }) => {
      setNotifications(prev => prev.filter(n => n.id !== data.notificationId));
    };

    const handleNotificationCount = (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
    };

    // Register socket listeners
    socketService.on('notification:new', handleNewNotification);
    socketService.on('notification:read', handleNotificationRead);
    socketService.on('notification:deleted', handleNotificationDeleted);
    socketService.on('notification:count', handleNotificationCount);

    return () => {
      socketService.off('notification:new', handleNewNotification);
      socketService.off('notification:read', handleNotificationRead);
      socketService.off('notification:deleted', handleNotificationDeleted);
      socketService.off('notification:count', handleNotificationCount);
    };
  }, []);

  // Initial load of notifications
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const loaded = await service.getNotifications();
        setNotifications(loaded.map(n => ({
          ...n,
          timestamp: (n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp)).toISOString(),
        })) as unknown as Notification[]);
        const unread = await service.getUnreadCount();
        setUnreadCount(unread);
        unsubscribe = service.addListener((list) => {
          setNotifications(list.map(n => ({
            ...n,
            timestamp: (n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp)).toISOString(),
          })) as unknown as Notification[]);
        });
      } catch (err: any) {
        // Don't set error for expected failures (404, 401)
        if (err?.code !== 'NOT_FOUND' && err?.code !== 'UNAUTHORIZED' && err?.response?.status !== 404 && err?.response?.status !== 401) {
          setError(err instanceof Error ? err.message : 'Failed to initialize notifications');
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const updateUnreadCount = () => {
    const unread = notifications.filter(n => !n.isRead).length;
    setUnreadCount(unread);
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await service.getNotifications();
      setNotifications(list.map(n => ({
        ...n,
        timestamp: (n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp)).toISOString(),
      })) as unknown as Notification[]);
      const unread = await service.getUnreadCount();
      setUnreadCount(unread);
    } catch (err: any) {
      // Don't set error for expected failures (404, 401)
      if (err?.code !== 'NOT_FOUND' && err?.code !== 'UNAUTHORIZED' && err?.response?.status !== 404 && err?.response?.status !== 401) {
        setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await service.markAsRead(notificationId);
      const list = await service.getNotifications();
      setNotifications(list.map(n => ({
        ...n,
        timestamp: (n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp)).toISOString(),
      })) as unknown as Notification[]);
      const unread = await service.getUnreadCount();
      setUnreadCount(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await service.markAllAsRead();
      const list = await service.getNotifications();
      setNotifications(list.map(n => ({
        ...n,
        timestamp: (n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp)).toISOString(),
      })) as unknown as Notification[]);
      const unread = await service.getUnreadCount();
      setUnreadCount(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await service.deleteNotification(notificationId);
      const list = await service.getNotifications();
      setNotifications(list.map(n => ({
        ...n,
        timestamp: (n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp)).toISOString(),
      })) as unknown as Notification[]);
      const unread = await service.getUnreadCount();
      setUnreadCount(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete notification');
    }
  };

  const clearAllNotifications = async () => {
    try {
      await service.clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear notifications');
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    try {
      await service.addNotification({
        ...(notification as any),
        status: notification.isRead ? 'read' : 'unread',
      } as any);
      const list = await service.getNotifications();
      setNotifications(list.map(n => ({
        ...n,
        timestamp: (n.timestamp instanceof Date ? n.timestamp : new Date(n.timestamp)).toISOString(),
      })) as unknown as Notification[]);
      const unread = await service.getUnreadCount();
      setUnreadCount(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add notification');
    }
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    error,
    pushToken,
    isInitialized,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
    initializeNotifications,
    setNotificationNavigationHandler,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    // Return a safe fallback instead of throwing
    return {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      error: null,
      pushToken: null,
      isInitialized: false,
      fetchNotifications: async () => {},
      markAsRead: async () => {},
      markAllAsRead: async () => {},
      deleteNotification: async () => {},
      clearAllNotifications: async () => {},
      addNotification: async () => {},
      initializeNotifications: async () => null,
      setNotificationNavigationHandler: () => {},
    };
  }
  return context;
}; 
