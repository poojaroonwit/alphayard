import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { PRODUCTION_CONFIG } from '../../config/production';

interface SecurityConfig {
  encryptionEnabled: boolean;
  biometricAuth: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
}

export class SecurityService {
  private static instance: SecurityService;
  private config: SecurityConfig;
  private loginAttempts: number = 0;
  private lastLoginAttempt: number = 0;

  private constructor() {
    this.config = PRODUCTION_CONFIG.SECURITY;
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // Encrypt sensitive data
  async encryptData(data: string): Promise<string> {
    if (!this.config.encryptionEnabled) {
      return data;
    }

    try {
      // Here you would implement actual encryption
      // For now, we'll use a simple base64 encoding
      return btoa(data);
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt sensitive data
  async decryptData(encryptedData: string): Promise<string> {
    if (!this.config.encryptionEnabled) {
      return encryptedData;
    }

    try {
      // Here you would implement actual decryption
      // For now, we'll use a simple base64 decoding
      return atob(encryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Store secure data
  async storeSecureData(key: string, value: string): Promise<void> {
    try {
      const encryptedValue = await this.encryptData(value);
      await AsyncStorage.setItem(key, encryptedValue);
    } catch (error) {
      console.error('Store secure data error:', error);
      throw error;
    }
  }

  // Retrieve secure data
  async getSecureData(key: string): Promise<string | null> {
    try {
      const encryptedValue = await AsyncStorage.getItem(key);
      if (!encryptedValue) return null;
      
      return await this.decryptData(encryptedValue);
    } catch (error) {
      console.error('Get secure data error:', error);
      return null;
    }
  }

  // Check if biometric authentication is available
  async isBiometricAvailable(): Promise<boolean> {
    if (!this.config.biometricAuth) {
      return false;
    }

    try {
      // Here you would check if biometric auth is available
      // For now, we'll return false
      return false;
    } catch (error) {
      console.error('Biometric check error:', error);
      return false;
    }
  }

  // Authenticate with biometrics
  async authenticateWithBiometrics(): Promise<boolean> {
    if (!this.config.biometricAuth) {
      return false;
    }

    try {
      // Here you would implement biometric authentication
      // For now, we'll return false
      return false;
    } catch (error) {
      console.error('Biometric auth error:', error);
      return false;
    }
  }

  // Track login attempts
  async trackLoginAttempt(): Promise<boolean> {
    const now = Date.now();
    
    // Reset attempts if more than 1 hour has passed
    if (now - this.lastLoginAttempt > 3600000) {
      this.loginAttempts = 0;
    }

    this.loginAttempts++;
    this.lastLoginAttempt = now;

    // Store attempts securely
    await this.storeSecureData('login_attempts', this.loginAttempts.toString());
    await this.storeSecureData('last_login_attempt', this.lastLoginAttempt.toString());

    return this.loginAttempts < this.config.maxLoginAttempts;
  }

  // Reset login attempts
  async resetLoginAttempts(): Promise<void> {
    this.loginAttempts = 0;
    this.lastLoginAttempt = 0;
    
    await AsyncStorage.multiRemove(['login_attempts', 'last_login_attempt']);
  }

  // Check if account is locked
  async isAccountLocked(): Promise<boolean> {
    const attempts = await this.getSecureData('login_attempts');
    const lastAttempt = await this.getSecureData('last_login_attempt');
    
    if (!attempts || !lastAttempt) {
      return false;
    }

    const attemptCount = parseInt(attempts);
    const lastAttemptTime = parseInt(lastAttempt);
    const now = Date.now();

    // Account is locked if max attempts reached and within timeout period
    return attemptCount >= this.config.maxLoginAttempts && 
           (now - lastAttemptTime) < 3600000; // 1 hour
  }

  // Validate session
  async validateSession(): Promise<boolean> {
    try {
      const sessionData = await this.getSecureData('session_data');
      if (!sessionData) return false;

      const session = JSON.parse(sessionData);
      const now = Date.now();

      // Check if session has expired
      if (now > session.expiresAt) {
        await this.clearSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  // Create session
  async createSession(userId: string, token: string): Promise<void> {
    const session = {
      userId,
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + (this.config.sessionTimeout * 1000),
    };

    await this.storeSecureData('session_data', JSON.stringify(session));
  }

  // Clear session
  async clearSession(): Promise<void> {
    await AsyncStorage.multiRemove([
      'session_data',
      'login_attempts',
      'last_login_attempt',
    ]);
  }

  // Validate password strength
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password must be at least 8 characters long');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one uppercase letter');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one number');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Password must contain at least one special character');
    }

    return {
      isValid: score >= 4,
      score,
      feedback,
    };
  }

  // Sanitize input
  sanitizeInput(input: string): string {
    // Remove potentially dangerous characters
    return input.replace(/[<>]/g, '');
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get security config
  getSecurityConfig(): SecurityConfig {
    return this.config;
  }

  // Update security config
  updateSecurityConfig(config: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

export const securityService = SecurityService.getInstance();
export default securityService; 
