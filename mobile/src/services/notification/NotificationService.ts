import { apiClient } from '../api/apiClient';
import { Notification, NotificationType, NotificationSettings } from './NotificationService.types';
import * as Notifications from 'expo-notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationServiceClass {
  private static instance: NotificationServiceClass;
  private listeners: Array<(notifications: Notification[]) => void> = [];
  private notificationsCache: Notification[] = [];

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): NotificationServiceClass {
    if (!NotificationServiceClass.instance) {
      NotificationServiceClass.instance = new NotificationServiceClass();
    }
    return NotificationServiceClass.instance;
  }

  // Add listener for notification updates
  addListener(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private notifyListeners(notifications: Notification[]) {
    this.notificationsCache = notifications;
    this.listeners.forEach(callback => callback(notifications));
  }

  // Get all notifications (no user filter - for singleton pattern)
  async getNotifications(): Promise<Notification[]>;
  // Get notifications for a specific user
  async getNotifications(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  async getNotifications(userId?: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    try {
      if (userId) {
        const response = await apiClient.get('/notifications', {
          params: { userId, limit, offset },
        });
        const notifications = response.data.map((n: any) => ({
          ...n,
          timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
        }));
        return notifications;
      } else {
        // Get all notifications (for singleton pattern used in NotificationContext)
        const response = await apiClient.get('/notifications');
        const notifications = response.data.map((n: any) => ({
          ...n,
          timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
        }));
        this.notifyListeners(notifications);
        return notifications;
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await apiClient.get(`/notifications/unread-count`, {
        params: { userId },
      });
      return response.data.count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
      // Update cache
      this.notificationsCache = this.notificationsCache.map(n =>
        n.id === notificationId ? { ...n, status: 'read' } : n
      );
      this.notifyListeners(this.notificationsCache);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/read-all`, { userId });
      // Update cache
      this.notificationsCache = this.notificationsCache.map(n => ({
        ...n,
        status: 'read' as const,
      }));
      this.notifyListeners(this.notificationsCache);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      // Update cache
      this.notificationsCache = this.notificationsCache.filter(n => n.id !== notificationId);
      this.notifyListeners(this.notificationsCache);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Create notification
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<Notification> {
    try {
      const response = await apiClient.post('/notifications', {
        userId,
        type,
        title,
        message,
        data,
      });
      const notification = {
        ...response.data,
        timestamp: response.data.timestamp ? new Date(response.data.timestamp) : new Date(),
      };
      
      // Update cache
      this.notificationsCache = [notification, ...this.notificationsCache];
      this.notifyListeners(this.notificationsCache);
      
      // Send push notification
      await this.sendPushNotification(notification);
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Schedule notification
  async scheduleNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    scheduledAt: Date,
    data?: Record<string, any>
  ): Promise<Notification> {
    try {
      const response = await apiClient.post('/notifications/schedule', {
        userId,
        type,
        title,
        message,
        scheduledAt: scheduledAt.toISOString(),
        data,
      });
      const notification = {
        ...response.data,
        timestamp: response.data.timestamp ? new Date(response.data.timestamp) : new Date(),
        scheduledAt: response.data.scheduledAt ? new Date(response.data.scheduledAt) : scheduledAt,
      };
      
      // Schedule local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: message,
          data: data || {},
        },
        trigger: scheduledAt,
      });
      
      return notification;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/schedule/${notificationId}`);
      // Cancel local notification if exists
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error cancelling scheduled notification:', error);
      throw error;
    }
  }

  // Send family notification
  async sendFamilyNotification(
    familyId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await apiClient.post('/notifications/family', {
        familyId,
        type,
        title,
        message,
        data,
      });
    } catch (error) {
      console.error('Error sending family notification:', error);
      throw error;
    }
  }

  // Get notification settings
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    try {
      const response = await apiClient.get(`/notifications/settings/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      // Return default settings
      return {
        pushEnabled: true,
        emailEnabled: false,
        smsEnabled: false,
        types: {
          info: true,
          success: true,
          warning: true,
          error: true,
          system: true,
          hourse: true,
          finance: true,
          health: true,
        },
      };
    }
  }

  // Update notification settings
  async updateNotificationSettings(userId: string, settings: Partial<NotificationSettings>): Promise<void> {
    try {
      await apiClient.put(`/notifications/settings/${userId}`, settings);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }

  // Clear old notifications
  async clearOldNotifications(userId: string, days: number = 30): Promise<void> {
    try {
      await apiClient.delete('/notifications/old', {
        params: { userId, days },
      });
      // Reload notifications
      await this.getNotifications(userId);
    } catch (error) {
      console.error('Error clearing old notifications:', error);
      throw error;
    }
  }

  // Send push notification
  private async sendPushNotification(notification: Notification): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.message,
          data: notification.data || {},
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
      // Don't throw - push notifications are optional
    }
  }
}

// Export singleton instance
export const notificationService = NotificationServiceClass.getInstance();

// Export class as default for getInstance() pattern
export default NotificationServiceClass;

