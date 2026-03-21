import crypto from 'crypto';
import redisService from './redisService';
import { communicationService } from './CommunicationService';

// ============================================================================
// OTP Service
// ============================================================================

export class OtpService {
  private readonly OTP_EXPIRY = 600; // 10 minutes in seconds

  /**
   * Generate a secure 6-digit OTP
   */
  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Generate, store, and deliver an OTP
   */
  async createOtp(identifier: string, type: 'email' | 'phone' = 'email', applicationId?: string): Promise<string> {
    try {
      const otp = this.generateOtp();
      const key = `otp:request:${identifier.toLowerCase()}`;

      // Store in Redis with TTL
      await redisService.set(key, otp, this.OTP_EXPIRY);

      // Deliver the OTP via CommunicationService
      await this.deliverOtp(identifier, otp, type, applicationId);

      return otp;
    } catch (error) {
      console.error('[OtpService] Error creating OTP:', error);
      throw new Error('Failed to create OTP');
    }
  }

  /**
   * Deliver OTP via the appropriate channel using the PRIMARY provider
   */
  private async deliverOtp(identifier: string, otp: string, type: 'email' | 'phone', applicationId?: string): Promise<void> {
    try {
      if (type === 'email') {
        await communicationService.sendEmailByTemplate({
          slug: 'otp-verification',
          to: identifier,
          data: { otp, expiry: '10 minutes' },
          applicationId,
        });
        console.log(`[OtpService] OTP email sent to ${identifier}`);
      } else {
        const message = `Your verification code is: ${otp}. It expires in 10 minutes. Do not share this code.`;
        await communicationService.sendSms(identifier, message);
        console.log(`[OtpService] OTP SMS sent to ${identifier}`);
      }
    } catch (error) {
      // Log but don't fail — the OTP is still stored in Redis so debug_otp still works in dev.
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[OtpService] Failed to deliver OTP via ${type} to ${identifier}: ${message}`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[OtpService] debug_otp for ${identifier}: ${otp}`);
      }
    }
  }

  /**
   * Verify an OTP and delete it if successful
   */
  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    try {
      const key = `otp:request:${identifier.toLowerCase()}`;
      const cachedOtp = await redisService.get(key);

      if (cachedOtp && cachedOtp === otp) {
        // Delete after successful use (one-time use best practice)
        await redisService.del(key);
        return true;
      }

      return false;
    } catch (error) {
      console.error('[OtpService] Error verifying OTP:', error);
      return false;
    }
  }
}

export const otpService = new OtpService();
