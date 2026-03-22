import { apiClient } from '../api/apiClient';
import { Notification, NotificationType, NotificationSettings } from './NotificationService.types';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Optional imports with fallbacks
let Device: any = null;
let Constants: any = null;

try {
  Device = require('expo-device');
} catch (e) {
  console.warn('expo-device not available');
}

try {
  Constants = require('expo-constants');
} catch (e) {
  console.warn('expo-constants not available');
}

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
  private expoPushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private onNotificationReceived: ((notification: Notifications.Notification) => void) | null = null;
  private onNotificationResponse: ((response: Notifications.NotificationResponse) => void) | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): NotificationServiceClass {
    if (!NotificationServiceClass.instance) {
      NotificationServiceClass.instance = new NotificationServiceClass();
    }
    return NotificationServiceClass.instance;
  }

  // Initialize push notifications - call this after user authenticates
  async initialize(): Promise<string | null> {
    try {
      // Setup Android notification channel
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Request permissions and get token
      const token = await this.registerForPushNotifications();
      
      // Setup notification listeners
      this.setupNotificationListeners();

      return token;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return null;
    }
  }

  // Setup Android notification channels
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FA7272',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergency Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#FF0000',
      sound: 'default',
      bypassDnd: true,
    });

    await Notifications.setNotificationChannelAsync('circle', {
      name: 'Circle Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FA7272',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('chat', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4A90D9',
      sound: 'default',
    });
  }

  // Register for push notifications
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if physical device (skip check if Device module not available)
      if (Device && !Device.isDevice) {
        console.log('Push notifications require a physical device');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Permission for push notifications not granted');
        return null;
      }

      // Get Expo push token
      let projectId = undefined;
      if (Constants) {
        projectId = Constants.expoConfig?.extra?.eas?.projectId ?? 
                    Constants.easConfig?.projectId ?? 
                    Constants.manifest?.extra?.eas?.projectId;
      }
      
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      this.expoPushToken = tokenData.data;
      console.log('Expo push token:', this.expoPushToken);

      // Register token with backend
      await this.registerTokenWithBackend(this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Register push token with backend
  async registerTokenWithBackend(token: string): Promise<void> {
    try {
      const deviceInfo = Device ? {
        brand: Device.brand,
        modelName: Device.modelName,
        osVersion: Device.osVersion,
      } : {
        platform: Platform.OS,
      };

      await apiClient.post('/notifications/register-token', {
        token,
        platform: Platform.OS,
        deviceInfo,
      });
      console.log('Push token registered with backend');
    } catch (error: any) {
      // Silently fail if endpoint doesn't exist yet
      if (error?.response?.status !== 404) {
        console.error('Error registering push token:', error);
      }
    }
  }

  // Unregister push token (call on logout)
  async unregisterToken(): Promise<void> {
    try {
      if (this.expoPushToken) {
        await apiClient.post('/notifications/unregister-token', {
          token: this.expoPushToken,
        });
        this.expoPushToken = null;
      }
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error('Error unregistering push token:', error);
      }
    }
  }

  // Setup notification listeners
  private setupNotificationListeners(): void {
    // Clean up existing listeners
    this.cleanupListeners();

    // Notification received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      
      // Refresh notifications list
      this.getNotifications().catch(console.error);
      
      // Call custom handler if set
      if (this.onNotificationReceived) {
        this.onNotificationReceived(notification);
      }
    });

    // User tapped on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      // Call custom handler if set
      if (this.onNotificationResponse) {
        this.onNotificationResponse(response);
      }
    });
  }

  // Set custom notification received handler
  setOnNotificationReceived(handler: (notification: Notifications.Notification) => void): void {
    this.onNotificationReceived = handler;
  }

  // Set custom notification response handler (when user taps notification)
  setOnNotificationResponse(handler: (response: Notifications.NotificationResponse) => void): void {
    this.onNotificationResponse = handler;
  }

  // Clean up listeners
  cleanupListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  // Get current push token
  getPushToken(): string | null {
    return this.expoPushToken;
  }

  // Set badge count
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Clear badge
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
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
        const data = Array.isArray(response) ? response : (response?.data || []);
        const notifications = data.map((n: any) => ({
          ...n,
          timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
        }));
        return notifications;
      } else {
        // Get all notifications (for singleton pattern used in NotificationContext)
        const response = await apiClient.get('/notifications');
        const data = Array.isArray(response) ? response : (response?.data || []);
        const notifications = data.map((n: any) => ({
          ...n,
          timestamp: n.timestamp ? new Date(n.timestamp) : new Date(),
        }));
        this.notifyListeners(notifications);
        return notifications;
      }
    } catch (error: any) {
      // Handle 404 gracefully - endpoint may not exist yet
      if (error?.code === 'NOT_FOUND' || error?.response?.status === 404) {
        // Endpoint doesn't exist yet - return empty array silently
        return [];
      }
      // Only log unexpected errors
      if (error?.code !== 'UNAUTHORIZED' && error?.response?.status !== 401) {
        console.error('Error fetching notifications:', error);
      }
      return [];
    }
  }

  // Get unread count
  async getUnreadCount(userId?: string): Promise<number> {
    try {
      // If no userId provided, return 0 (can't fetch without userId)
      if (!userId) {
        return 0;
      }
      const response = await apiClient.get(`/notifications/unread-count`, {
        params: { userId },
      });
      return response.data.count || 0;
    } catch (error: any) {
      // Handle 404 gracefully - endpoint may not exist yet
      if (error?.code === 'NOT_FOUND' || error?.response?.status === 404) {
        // Endpoint doesn't exist yet - return 0 silently
        return 0;
      }
      // Only log unexpected errors
      if (error?.code !== 'UNAUTHORIZED' && error?.response?.status !== 401) {
        console.error('Error fetching unread count:', error);
      }
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

  // Send circle notification
  async sendCircleNotification(
    circleId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    try {
      await apiClient.post('/notifications/circle', {
        circleId,
        type,
        title,
        message,
        data,
      });
    } catch (error) {
      console.error('Error sending circle notification:', error);
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
          Circle: true,
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

  // Clear all notifications for a user
  async clearAllNotifications(userId?: string): Promise<void> {
    try {
      await apiClient.delete('/notifications/all', {
        params: userId ? { userId } : undefined,
      });
      // Clear cache
      this.notificationsCache = [];
      this.notifyListeners(this.notificationsCache);
    } catch (error: any) {
      // Handle 404 gracefully
      if (error?.response?.status === 404) {
        // Endpoint doesn't exist - just clear local cache
        this.notificationsCache = [];
        this.notifyListeners(this.notificationsCache);
        return;
      }
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }

  // Add notification (create a local notification)
  async addNotification(notification: Omit<Notification, 'id' | 'timestamp'>): Promise<Notification> {
    try {
      // Generate a local ID
      const id = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date();

      const newNotification: Notification = {
        ...notification,
        id,
        timestamp,
        status: notification.status || 'unread',
      };

      // Add to cache
      this.notificationsCache = [newNotification, ...this.notificationsCache];
      this.notifyListeners(this.notificationsCache);

      // Try to sync with backend
      try {
        const response = await apiClient.post('/notifications', newNotification);
        if (response?.data?.id) {
          // Update with server ID
          const serverNotification = {
            ...newNotification,
            id: response.data.id,
            timestamp: response.data.timestamp ? new Date(response.data.timestamp) : timestamp,
          };
          this.notificationsCache = this.notificationsCache.map(n =>
            n.id === id ? serverNotification : n
          );
          this.notifyListeners(this.notificationsCache);
          return serverNotification;
        }
      } catch (error: any) {
        // If backend sync fails, keep local notification
        if (error?.response?.status !== 404) {
          console.warn('Failed to sync notification with backend:', error);
        }
      }

      return newNotification;
    } catch (error) {
      console.error('Error adding notification:', error);
      throw error;
    }
  }

  // Handle incoming notification from socket
  handleSocketNotification(notification: any): void {
    const newNotification: Notification = {
      ...notification,
      timestamp: notification.timestamp ? new Date(notification.timestamp) : new Date(),
      status: 'unread',
    };

    // Add to cache
    this.notificationsCache = [newNotification, ...this.notificationsCache];
    this.notifyListeners(this.notificationsCache);

    // Show local push notification
    this.sendPushNotification(newNotification).catch(console.error);
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

  // Cleanup on logout
  async cleanup(): Promise<void> {
    this.cleanupListeners();
    await this.unregisterToken();
    this.notificationsCache = [];
    this.notifyListeners([]);
  }
}

// Export singleton instance
export const notificationService = NotificationServiceClass.getInstance();

// Export class as default for getInstance() pattern
export default NotificationServiceClass;


