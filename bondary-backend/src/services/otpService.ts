import crypto from 'crypto';
import redisService from './redisService';
import { smsService } from './smsService';
import { emailService } from './emailService';

export class OtpService {
  private readonly OTP_EXPIRY = 600; // 10 minutes in seconds

  /**
   * Generate a secure 6-digit OTP
   */
  private generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Request an OTP and send it via the appropriate channel
   */
  async requestOtp(identifier: string, type: 'phone' | 'email'): Promise<{ success: boolean; message: string; debug_otp?: string }> {
    try {
      const otp = this.generateOtp();
      const key = `otp:request:${identifier.toLowerCase()}`;

      // Store in Redis with TTL
      await redisService.set(key, otp, this.OTP_EXPIRY);

      // Send via channel
      if (type === 'phone') {
        await smsService.sendVerificationCode(identifier, otp);
      } else {
        await emailService.sendEmail({
          to: identifier,
          subject: 'Your OTP Code',
          template: 'otp-code',
          data: { otp }
        });
      }

      console.log(`[OTP] Sent ${otp} to ${identifier}`);

      return {
        success: true,
        message: 'OTP sent successfully',
        debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined
      };
    } catch (error) {
      console.error('[OtpService] Error requesting OTP:', error);
      throw new Error('Failed to request OTP');
    }
  }

  /**
   * Verify an OTP and delete it if successful
   */
  async verifyOtp(identifier: string, otp: string): Promise<boolean> {
    try {
      const key = `otp:request:${identifier.toLowerCase()}`;
      const cachedOtp = await redisService.get<string>(key);

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
