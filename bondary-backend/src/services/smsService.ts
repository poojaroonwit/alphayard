import { appkitClient } from '../lib/appkitClient';

/**
 * @deprecated SMS logic has been migrated to AppKit's CommunicationService.
 * bondary-backend now uses the AppKit SDK to send SMS messages via the 
 * primary provider configured in the AppKit Admin UI.
 */

export interface SMSOptions {
  to: string;
  message: string;
  priority?: 'normal' | 'high';
}

class SMSService {
  /**
   * Send SMS via AppKit's primary provider
   */
  async sendSMS({ to, message }: SMSOptions) {
    try {
      if (!to || !message) {
        throw new Error('Phone number and message are required');
      }

      // AppKit's sendSMS takes a template. In our current AppKit implementation,
      // if we pass the raw message as the 'template', it uses it as the body.
      const result = await appkitClient.communication.sendSMS({
        to,
        template: message,
      });

      console.log(`✅ SMS sent via AppKit to ${to}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        status: 'sent',
        to,
      };
    } catch (error) {
      console.error('❌ SMS sending error (via AppKit):', error);
      throw error;
    }
  }

  /**
   * Legacy wrapper for emergency alerts. 
   * Triggers SMS to all emergency contacts using the primary provider.
   */
  async sendEmergencyAlert(user: any, emergencyContacts: any[], location: any) {
    const message = `EMERGENCY ALERT: ${user.firstName} ${user.lastName} has triggered an emergency alert. ` +
      `Location: ${location ? `${location.latitude}, ${location.longitude}` : 'Unknown'}. ` +
      `Call: ${user.phone}. ` +
      `Map: https://maps.google.com/?q=${location ? `${location.latitude},${location.longitude}` : ''}`;

    const promises = emergencyContacts
      .filter(contact => contact.phone || contact.phoneNumber)
      .map(contact => 
        this.sendSMS({
          to: contact.phone || contact.phoneNumber,
          message,
          priority: 'high',
        }).catch(error => {
          console.error(`Failed to send emergency SMS to ${contact.phone || contact.phoneNumber}:`, error);
          return { success: false, error };
        })
      );

    return Promise.all(promises);
  }

  /**
   * Helper for sending verification codes.
   * Note: For login/registration OTP, use AppKit's direct OTP endpoints instead.
   */
  async sendVerificationCode(phoneNumber: string, code: string) {
    const message = `Your Boundary verification code is: ${code}. ` +
      `This code will expire in 10 minutes. Do not share this code with anyone.`;

    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal',
    });
  }
}

// Create singleton instance
export const smsService = new SMSService();

export const sendSMS = (options: SMSOptions) => smsService.sendSMS(options);

export default smsService;
