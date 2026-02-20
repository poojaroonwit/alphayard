// @ts-ignore
import twilio from 'twilio';

export interface SMSOptions {
  to: string;
  message: string;
  priority?: 'normal' | 'high';
}

class SMSService {
  private client: twilio.Twilio | null = null;
  private fromNumber: string | undefined;

  constructor() {
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    this.init();
  }

  init() {
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('SMS service initialized successfully');
      } else {
        console.warn('Twilio credentials not found - SMS service disabled');
      }
    } catch (error) {
      console.error('SMS service initialization error:', error);
    }
  }

  async sendSMS({ to, message, priority = 'normal' }: SMSOptions) {
    try {
      if (!this.client) {
        throw new Error('SMS service not initialized');
      }

      if (!to || !message) {
        throw new Error('Phone number and message are required');
      }

      // Format phone number
      const formattedNumber = this.formatPhoneNumber(to);

      // Send SMS
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedNumber,
        // Twilio prioritisation is slightly different, but roughly map high to something if supported
      });

      console.log(`SMS sent successfully to ${formattedNumber}: ${result.sid}`);
      
      return {
        success: true,
        messageId: result.sid,
        status: result.status,
        to: formattedNumber,
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      throw error;
    }
  }

  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      cleaned = '1' + cleaned; // US/Canada
    }
    
    // Add + prefix
    return '+' + cleaned;
  }

  // Emergency alert SMS
  async sendEmergencyAlert(user: any, emergencyContacts: any[], location: any) {
    if (!this.client) return;

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

  // Verification code
  async sendVerificationCode(phoneNumber: string, code: string) {
    const message = `Your Boundary verification code is: ${code}. ` +
      `This code will expire in 10 minutes. Do not share this code with anyone.`;

    return this.sendSMS({
      to: phoneNumber,
      message,
      priority: 'normal',
    });
  }

  // Validation
  async validatePhoneNumber(phoneNumber: string) {
    try {
      if (!this.client) {
        throw new Error('SMS service not initialized');
      }

      const formattedNumber = this.formatPhoneNumber(phoneNumber);
      const lookup = await this.client.lookups.v1.phoneNumbers(formattedNumber).fetch();
      
      return {
        valid: true,
        formatted: lookup.phoneNumber,
        countryCode: lookup.countryCode,
        nationalFormat: lookup.nationalFormat,
        internationalFormat: (lookup as any).internationalFormat,
      };
    } catch (error: any) {
      console.error('Phone number validation error:', error);
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}

// Create singleton instance
export const smsService = new SMSService();

export const sendSMS = (options: SMSOptions) => smsService.sendSMS(options);

export default smsService;
