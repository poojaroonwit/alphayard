import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NotificationService from '../services/notification/NotificationService';

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
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => Promise<void>;
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
  const service = NotificationService.getInstance();

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
        // service will assign id/timestamp/isRead
        // keep shape compatible
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
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    addNotification,
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
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}; 