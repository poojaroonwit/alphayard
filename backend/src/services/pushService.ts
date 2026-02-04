// @ts-ignore
import * as admin from 'firebase-admin';
// @ts-ignore
import * as webpush from 'web-push';
import { UserModel } from '../models/UserModel';

export interface PushNotification {
  title: string;
  body: string;
  image?: string;
  icon?: string;
  tag?: string;
  url?: string;
  data?: any;
  priority?: 'normal' | 'high';
  requireInteraction?: boolean;
  actions?: any[];
}

class PushService {
  private initialized = false;
  private fcm?: admin.messaging.Messaging;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      // Initialize Firebase Admin SDK
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
          });
        }

        this.fcm = admin.messaging();
        console.log('Firebase Admin SDK initialized');
      }

      // Initialize Web Push
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        webpush.setVapidDetails(
          'mailto:' + (process.env.SUPPORT_EMAIL || 'support@boundary.com'),
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
        console.log('Web Push initialized');
      }

      this.initialized = true;
    } catch (error) {
      console.error('Push service initialization error:', error);
    }
  }

  // Send push notification to specific user
  async sendToUser(userId: string, notification: PushNotification) {
    try {
      if (!this.initialized) {
        throw new Error('Push service not initialized');
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const results: any[] = [];

      // Send to mobile devices (FCM) - Mapping to deviceTokens based on UserModel
      const deviceTokens = user.metadata?.deviceTokens || [];
      if (deviceTokens.length > 0) {
        const fcmResult = await this.sendToFCM(deviceTokens, notification);
        results.push(...fcmResult);
      }

      // Send to web browsers
      const webPushSubscriptions = user.metadata?.webPushSubscriptions || [];
      if (webPushSubscriptions.length > 0) {
        const webResult = await this.sendToWebPush(webPushSubscriptions, notification);
        results.push(...webResult);
      }

      return results;
    } catch (error) {
      console.error('Send to user error:', error);
      throw error;
    }
  }

  // Send to multiple users
  async sendToUsers(userIds: string[], notification: PushNotification) {
    try {
      const results: any[] = [];
      
      for (const userId of userIds) {
        try {
          const result = await this.sendToUser(userId, notification);
          results.push(...result);
        } catch (error: any) {
          console.error(`Failed to send to user ${userId}:`, error);
          results.push({ userId, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Send to users error:', error);
      throw error;
    }
  }

  // Send to FCM (mobile devices)
  async sendToFCM(tokens: string[], notification: PushNotification) {
    try {
      if (!this.fcm) {
        throw new Error('FCM not initialized');
      }

      const message: any = {
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.image,
        },
        data: notification.data || {},
        android: {
          notification: {
            sound: 'default',
            channelId: 'boundary_channel',
            priority: notification.priority || 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              alert: {
                title: notification.title,
                body: notification.body,
              },
            },
          },
        },
        webpush: {
          notification: {
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: notification.tag,
            requireInteraction: notification.requireInteraction || false,
            actions: notification.actions || [],
          },
          fcmOptions: {
            link: notification.url || '/',
          },
        },
      };

      const response = await this.fcm.sendEachForMulticast({
        tokens,
        ...message,
      });

      const results: any[] = [];
      response.responses.forEach((resp: any, idx: number) => {
        results.push({
          token: tokens[idx],
          success: resp.success,
          messageId: resp.messageId,
          error: resp.error,
        });
      });

      return results;
    } catch (error) {
      console.error('FCM send error:', error);
      throw error;
    }
  }

  // Send to Web Push (browsers)
  async sendToWebPush(subscriptions: any[], notification: PushNotification) {
    try {
      const results: any[] = [];
      
      for (const subscription of subscriptions) {
        try {
          const payload = JSON.stringify({
            title: notification.title,
            body: notification.body,
            icon: notification.icon || '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: notification.tag,
            requireInteraction: notification.requireInteraction || false,
            actions: notification.actions || [],
            data: notification.data || {},
            url: notification.url || '/',
          });

          const result = await webpush.sendNotification(subscription, payload);
          
          results.push({
            subscription: subscription.endpoint,
            success: true,
            statusCode: result.statusCode,
          });
        } catch (error: any) {
          results.push({
            subscription: subscription.endpoint,
            success: false,
            error: error.message,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Web Push send error:', error);
      throw error;
    }
  }

  // Send to topic (for broadcast messages)
  async sendToTopic(topic: string, notification: PushNotification) {
    try {
      if (!this.fcm) {
        throw new Error('FCM not initialized');
      }

      const message: any = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        topic,
      };

      const response = await this.fcm.send(message);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Topic send error:', error);
      throw error;
    }
  }

  // Subscribe user to topic
  async subscribeToTopic(tokens: string[], topic: string) {
    try {
      if (!this.fcm) {
        throw new Error('FCM not initialized');
      }

      const response = await this.fcm.subscribeToTopic(tokens, topic);
      return response;
    } catch (error) {
      console.error('Subscribe to topic error:', error);
      throw error;
    }
  }

  // Unsubscribe user from topic
  async unsubscribeFromTopic(tokens: string[], topic: string) {
    try {
      if (!this.fcm) {
        throw new Error('FCM not initialized');
      }

      const response = await this.fcm.unsubscribeFromTopic(tokens, topic);
      return response;
    } catch (error) {
      console.error('Unsubscribe from topic error:', error);
      throw error;
    }
  }

  // Add FCM token for user
  async addFCMToken(userId: string, token: string) {
    try {
      await UserModel.findByIdAndUpdate(userId, {
        $push: { deviceTokens: token },
      });

      return true;
    } catch (error) {
      console.error('Add FCM token error:', error);
      throw error;
    }
  }

  // Remove FCM token for user
  async removeFCMToken(userId: string, token: string) {
    try {
      await UserModel.findByIdAndUpdate(userId, {
        $pull: { deviceTokens: token },
      });

      return true;
    } catch (error) {
      console.error('Remove FCM token error:', error);
      throw error;
    }
  }

  // Add web push subscription for user
  async addWebPushSubscription(userId: string, subscription: any) {
    try {
      await UserModel.findByIdAndUpdate(userId, {
        $push: { webPushSubscriptions: subscription },
      });

      return true;
    } catch (error) {
      console.error('Add web push subscription error:', error);
      throw error;
    }
  }

  // Remove web push subscription for user
  async removeWebPushSubscription(userId: string, endpoint: string) {
    try {
      await UserModel.findByIdAndUpdate(userId, {
        $pull: { webPushSubscriptions: { endpoint } },
      });

      return true;
    } catch (error) {
      console.error('Remove web push subscription error:', error);
      throw error;
    }
  }

  // Clean up invalid tokens
  async cleanupInvalidTokens() {
    try {
      // Logic for cleanup would need careful implementation with PG
      console.log('Cleanup invalid tokens logic would go here');
      return true;
    } catch (error) {
      console.error('Cleanup invalid tokens error:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(userId: string, days = 30) {
    try {
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalFailed: 0,
        successRate: 0,
      };
    } catch (error) {
      console.error('Get notification stats error:', error);
      throw error;
    }
  }
}

// Create push service instance
export const pushService = new PushService();

// Export functions for convenience
export const sendPushNotification = (userId: string, notification: PushNotification) => pushService.sendToUser(userId, notification);
export const sendToTopic = (topic: string, notification: PushNotification) => pushService.sendToTopic(topic, notification);
export const subscribeToTopic = (tokens: string[], topic: string) => pushService.subscribeToTopic(tokens, topic);
export const unsubscribeFromTopic = (tokens: string[], topic: string) => pushService.unsubscribeFromTopic(tokens, topic);
export const addFCMToken = (userId: string, token: string) => pushService.addFCMToken(userId, token);
export const removeFCMToken = (userId: string, token: string) => pushService.removeFCMToken(userId, token);
export const addWebPushSubscription = (userId: string, subscription: any) => pushService.addWebPushSubscription(userId, subscription);
export const removeWebPushSubscription = (userId: string, endpoint: string) => pushService.removeWebPushSubscription(userId, endpoint);
export const cleanupInvalidTokens = () => pushService.cleanupInvalidTokens();
export const getNotificationStats = (userId: string, days: number) => pushService.getNotificationStats(userId, days);

export default pushService;
