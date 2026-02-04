import { pool } from '../config/database';
import emailService from './emailService';
import smsService from './smsService';
import pushService from './pushService';
import { UserModel } from '../models/UserModel';

export enum NotificationType {
  EMERGENCY_ALERT = 'emergency_alert',
  SAFETY_CHECK = 'safety_check',
  LOCATION_UPDATE = 'location_update',
  CIRCLE_INVITE = 'circle_invite',
  MESSAGE = 'message',
  GEOFENCE_BREACH = 'geofence_breach',
  SUBSCRIPTION = 'subscription',
  SYSTEM = 'system',
}

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
}

export interface NotificationData {
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  priority?: 'normal' | 'high';
  sound?: string;
  badge?: number;
}

class NotificationService {
  // Send emergency alert notifications
  async sendEmergencyAlert(alert: any, recipients: any[] = []) {
    try {
      const notificationData: NotificationData = {
        type: NotificationType.EMERGENCY_ALERT,
        title: '🚨 Emergency Alert',
        body: `${alert.user.firstName} ${alert.user.lastName} has sent an emergency alert`,
        data: {
          alertId: alert.id || alert._id,
          userId: alert.user.id || alert.user._id,
          type: alert.type,
          message: alert.message,
          location: alert.location,
        },
        priority: 'high',
        sound: 'emergency',
        badge: 1,
      };

      // Get recipients if not provided
      if (recipients.length === 0) {
        recipients = await this.getEmergencyRecipients(alert.user);
      }

      // Send notifications through all channels
      const results = await Promise.allSettled([
        this.sendPushNotifications(recipients, notificationData),
        this.sendEmailNotifications(recipients, 'emergency-alert', {
          alert,
          user: alert.user,
        }, '🚨 Emergency Alert'),
        this.sendSMSNotifications(recipients, `EMERGENCY: ${alert.user.firstName} needs help!`),
      ]);

      return {
        success: true,
        recipientCount: recipients.length,
        results: {
          push: results[0].status === 'fulfilled' ? results[0].value : (results[0] as PromiseRejectedResult).reason,
          email: results[1].status === 'fulfilled' ? results[1].value : (results[1] as PromiseRejectedResult).reason,
          sms: results[2].status === 'fulfilled' ? results[2].value : (results[2] as PromiseRejectedResult).reason,
        },
      };
    } catch (error) {
      console.error('Send emergency alert notification error:', error);
      throw error;
    }
  }

  // Send safety check notifications
  async sendSafetyCheck(safetyCheck: any, recipients: any[] = []) {
    try {
      const notificationData: NotificationData = {
        type: NotificationType.SAFETY_CHECK,
        title: '👋 Safety Check',
        body: `${safetyCheck.requestedBy.firstName} is checking on your safety`,
        data: {
          safetyCheckId: safetyCheck.id || safetyCheck._id,
          requestedBy: safetyCheck.requestedBy.id || safetyCheck.requestedBy._id,
          message: safetyCheck.message,
          expiresAt: safetyCheck.expiresAt,
        },
        priority: 'high',
        sound: 'default',
        badge: 1,
      };

      // Get recipients if not provided
      if (recipients.length === 0) {
        recipients = [safetyCheck.user];
      }

      // Send notifications
      const results = await Promise.allSettled([
        this.sendPushNotifications(recipients, notificationData),
        this.sendEmailNotifications(recipients, 'safety-check', {
          safetyCheck,
          requestedBy: safetyCheck.requestedBy,
        }, '👋 Safety Check'),
      ]);

      return {
        success: true,
        recipientCount: recipients.length,
        results: {
          push: results[0].status === 'fulfilled' ? results[0].value : (results[0] as PromiseRejectedResult).reason,
          email: results[1].status === 'fulfilled' ? results[1].value : (results[1] as PromiseRejectedResult).reason,
        },
      };
    } catch (error) {
      console.error('Send safety check notification error:', error);
      throw error;
    }
  }

  // Send location update notifications
  async sendLocationUpdate(user: any, location: any, circleMembers: any[] = []) {
    try {
      const notificationData: NotificationData = {
        type: NotificationType.LOCATION_UPDATE,
        title: '📍 Location Update',
        body: `${user.firstName} has updated their location`,
        data: {
          userId: user.id || user._id,
          location: location,
          timestamp: new Date().toISOString(),
        },
        priority: 'normal',
        sound: 'default',
      };

      // Get circle members if not provided
      if (circleMembers.length === 0) {
        // Query PG for circle members
        const { rows } = await pool.query(`
          SELECT u.* 
          FROM users u 
          JOIN circle_members cm ON u.id = cm.user_id 
          WHERE cm.circle_id = ANY($1::uuid[]) AND u.id != $2
        `, [user.circleIds || [], user.id]);
        circleMembers = rows;
      }

      // Send notifications to circle members
      const results = await Promise.allSettled([
        this.sendPushNotifications(circleMembers, notificationData),
        this.sendEmailNotifications(circleMembers, 'location-update', {
          user,
          location,
        }, '📍 Location Update'),
      ]);

      return {
        success: true,
        recipientCount: circleMembers.length,
        results: {
          push: results[0].status === 'fulfilled' ? results[0].value : (results[0] as PromiseRejectedResult).reason,
          email: results[1].status === 'fulfilled' ? results[1].value : (results[1] as PromiseRejectedResult).reason,
        },
      };
    } catch (error) {
      console.error('Send location update notification error:', error);
      throw error;
    }
  }

  // Send circle invitation notifications
  async sendCircleInvite(invitation: any, invitedUser: any) {
    try {
      const notificationData: NotificationData = {
        type: NotificationType.CIRCLE_INVITE,
        title: '👨‍👩‍👧‍👦 Circle Invitation',
        body: `${invitation.invitedBy.firstName} has invited you to join their circle`,
        data: {
          invitationId: invitation.id || invitation._id,
          circleId: invitation.circle.id || invitation.circle._id,
          invitedBy: invitation.invitedBy.id || invitation.invitedBy._id,
          message: invitation.message,
        },
        priority: 'normal',
        sound: 'default',
        badge: 1,
      };

      // Send notifications
      const results = await Promise.allSettled([
        this.sendPushNotifications([invitedUser], notificationData),
        this.sendEmailNotifications([invitedUser], 'circle-invitation', {
          invitation,
          circle: invitation.circle,
          invitedBy: invitation.invitedBy,
        }, '👨‍👩‍👧‍👦 Circle Invitation'),
        this.sendSMSNotifications([invitedUser], `You've been invited to join ${invitation.circle.name} circle on Boundary`),
      ]);

      return {
        success: true,
        recipientCount: 1,
        results: {
          push: results[0].status === 'fulfilled' ? results[0].value : (results[0] as PromiseRejectedResult).reason,
          email: results[1].status === 'fulfilled' ? results[1].value : (results[1] as PromiseRejectedResult).reason,
          sms: results[2].status === 'fulfilled' ? results[2].value : (results[2] as PromiseRejectedResult).reason,
        },
      };
    } catch (error) {
      console.error('Send circle invite notification error:', error);
      throw error;
    }
  }

  // Send message notifications
  async sendMessageNotification(message: any, recipients: any[] = []) {
    try {
      const notificationData: NotificationData = {
        type: NotificationType.MESSAGE,
        title: `💬 New Message from ${message.sender.firstName}`,
        body: message.type === 'text' ? message.content.substring(0, 100) : `Sent a ${message.type}`,
        data: {
          messageId: message.id || message._id,
          chatId: message.chat.id || message.chat._id,
          senderId: message.sender.id || message.sender._id,
          type: message.type,
        },
        priority: 'normal',
        sound: 'default',
        badge: 1,
      };

      // Send notifications
      const results = await Promise.allSettled([
        this.sendPushNotifications(recipients, notificationData),
        this.sendEmailNotifications(recipients, 'new-message', {
          message,
          sender: message.sender,
          chat: message.chat,
        }, `💬 New Message from ${message.sender.firstName}`),
      ]);

      return {
        success: true,
        recipientCount: recipients.length,
        results: {
          push: results[0].status === 'fulfilled' ? results[0].value : (results[0] as PromiseRejectedResult).reason,
          email: results[1].status === 'fulfilled' ? results[1].value : (results[1] as PromiseRejectedResult).reason,
        },
      };
    } catch (error) {
      console.error('Send message notification error:', error);
      throw error;
    }
  }

  // Send subscription notifications
  async sendSubscriptionNotification(user: any, subscription: any, type: string) {
    try {
      let title = '📋 Subscription Update';
      let body = 'Your subscription has been updated';
      let template = 'subscription-update';

      switch (type) {
        case 'created':
          title = '🎉 Subscription Active';
          body = `Your ${subscription.plan.name} subscription is now active`;
          template = 'subscription-created';
          break;
        case 'renewed':
          title = '✅ Subscription Renewed';
          body = `Your ${subscription.plan.name} subscription has been renewed`;
          template = 'subscription-renewed';
          break;
        case 'cancelled':
          title = '❌ Subscription Cancelled';
          body = `Your ${subscription.plan.name} subscription has been cancelled`;
          template = 'subscription-cancelled';
          break;
        case 'payment_failed':
          title = '⚠️ Payment Failed';
          body = `Payment for your ${subscription.plan.name} subscription failed`;
          template = 'payment-failed';
          break;
      }

      const notificationData: NotificationData = {
        type: NotificationType.SUBSCRIPTION,
        title,
        body,
        data: {
          subscriptionId: subscription.id || subscription._id,
          planName: subscription.plan.name,
          status: subscription.status,
          type,
        },
        priority: 'normal',
        sound: 'default',
      };

      // Send notifications
      const results = await Promise.allSettled([
        this.sendPushNotifications([user], notificationData),
        this.sendEmailNotifications([user], template, {
          user,
          subscription,
          type,
        }, title),
      ]);

      return {
        success: true,
        recipientCount: 1,
        results: {
          push: results[0].status === 'fulfilled' ? results[0].value : (results[0] as PromiseRejectedResult).reason,
          email: results[1].status === 'fulfilled' ? results[1].value : (results[1] as PromiseRejectedResult).reason,
        },
      };
    } catch (error) {
      console.error('Send subscription notification error:', error);
      throw error;
    }
  }

  // Helper methods
  async getEmergencyRecipients(user: any) {
    try {
      const recipients: any[] = [];

      // Add emergency contacts
      const emergencyContacts = user.emergencyContacts || [];
      if (emergencyContacts.length > 0) {
        const phoneNumbers = emergencyContacts.map((c: any) => c.phoneNumber);
        const { rows } = await pool.query('SELECT * FROM users WHERE phone = ANY($1)', [phoneNumbers]);
        recipients.push(...rows);
      }

      // Add circle members
      const circleIds = user.circleIds || [];
      if (circleIds.length > 0) {
        const { rows } = await pool.query(`
          SELECT u.* 
          FROM users u 
          JOIN circle_members cm ON u.id = cm.user_id 
          WHERE cm.circle_id = ANY($1::uuid[]) AND u.id != $2
        `, [circleIds, user.id]);
        recipients.push(...rows);
      }

      return recipients;
    } catch (error) {
      console.error('Get emergency recipients error:', error);
      return [];
    }
  }

  async sendPushNotifications(users: any[], notificationData: NotificationData) {
    try {
      // Map users to tokens
      const results = await Promise.all(
        users.map(user => pushService.sendToUser(user.id || user._id, {
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data,
          priority: notificationData.priority,
        }))
      );

      const items = results.flat();
      const successful = items.filter((r: any) => r.success).length;
      
      return {
        success: true,
        sent: successful,
        total: items.length,
      };
    } catch (error) {
      console.error('Send push notifications error:', error);
      throw error;
    }
  }

  async sendEmailNotifications(users: any[], template: string, data: any, subject: string) {
    try {
      const emailPromises = users
        .filter(user => user.email)
        .map(user => emailService.sendEmail({
          to: user.email,
          subject,
          template,
          data: { ...data, user },
        }));

      if (emailPromises.length === 0) {
        return { success: true, sent: 0, message: 'No email notifications to send' };
      }

      const results = await Promise.allSettled(emailPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      return {
        success: true,
        sent: successful,
        total: emailPromises.length,
      };
    } catch (error) {
      console.error('Send email notifications error:', error);
      throw error;
    }
  }

  async sendSMSNotifications(users: any[], message: string) {
    try {
      const smsPromises = users
        .filter(user => user.phone || user.phoneNumber)
        .map(user => smsService.sendSMS({
          to: user.phone || user.phoneNumber,
          message,
        }));

      if (smsPromises.length === 0) {
        return { success: true, sent: 0, message: 'No SMS notifications to send' };
      }

      const results = await Promise.allSettled(smsPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      return {
        success: true,
        sent: successful,
        total: smsPromises.length,
      };
    } catch (error) {
      console.error('Send SMS notifications error:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
