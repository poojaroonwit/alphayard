import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  iterations: number;
}

interface EncryptedData {
  data: string;
  iv: string;
  salt: string;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: string | null = null;
  private config: EncryptionConfig = {
    algorithm: 'AES',
    keySize: 256,
    iterations: 10000,
  };

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  // Initialize encryption service
  async initialize(): Promise<void> {
    try {
      // Generate or retrieve master key
      await this.initializeMasterKey();
      
      console.log('Encryption service initialized');
    } catch (error) {
      console.error('Failed to initialize encryption service:', error);
      throw error;
    }
  }

  // Initialize master key
  private async initializeMasterKey(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web fallback - iterate from simple usage (insecure but functional for dev)
        // Check if master key is in memory or local storage if needed
        let storedKey = await AsyncStorage.getItem('boundary_master_key');
        if (storedKey) {
            this.masterKey = storedKey;
        } else {
            this.masterKey = this.generateMasterKey();
            await AsyncStorage.setItem('boundary_master_key', this.masterKey);
        }
        return;
      }

      
      // Try to get existing master key from keychain
      const Keychain = require('react-native-keychain');
      const credentials = await Keychain.getGenericPassword('boundary_master_key');
      
      if (credentials) {
        this.masterKey = credentials.password;
      } else {
        // Generate new master key
        this.masterKey = this.generateMasterKey();
        
        // Store in keychain
        await Keychain.setGenericPassword(
          'boundary_master_key',
          this.masterKey,
          {
            accessControl: Keychain.ACCESS_CONTROL.BIOMETRICS_ANY_OR_DEVICE_PASSCODE,
            accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
          }
        );
      }
    } catch (error) {
      console.error('Failed to initialize master key:', error);
      throw error;
    }
  }

  // Generate master key
  private generateMasterKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Encrypt data
  async encrypt(data: string, key?: string): Promise<EncryptedData> {
    try {
      const Crypto = require('react-native-crypto-js');
      const encryptionKey = key || this.masterKey;
      if (!encryptionKey) {
        throw new Error('No encryption key available');
      }

      // Generate salt and IV
      const salt = Crypto.lib.WordArray.random(128 / 8);
      const iv = Crypto.lib.WordArray.random(128 / 8);

      // Derive key from password
      const derivedKey = Crypto.PBKDF2(encryptionKey, salt, {
        keySize: this.config.keySize / 32,
        iterations: this.config.iterations,
      });

      // Encrypt data
      const encrypted = Crypto.AES.encrypt(data, derivedKey, {
        iv: iv,
        mode: Crypto.mode.CBC,
        padding: Crypto.pad.Pkcs7,
      });

      return {
        data: encrypted.toString(),
        iv: iv.toString(),
        salt: salt.toString(),
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  // Decrypt data
  async decrypt(encryptedData: EncryptedData, key?: string): Promise<string> {
    try {
      const Crypto = require('react-native-crypto-js');
      const encryptionKey = key || this.masterKey;
      if (!encryptionKey) {
        throw new Error('No encryption key available');
      }

      // Parse salt and IV
      const salt = Crypto.enc.Hex.parse(encryptedData.salt);
      const iv = Crypto.enc.Hex.parse(encryptedData.iv);

      // Derive key from password
      const derivedKey = Crypto.PBKDF2(encryptionKey, salt, {
        keySize: this.config.keySize / 32,
        iterations: this.config.iterations,
      });

      // Decrypt data
      const decrypted = Crypto.AES.decrypt(encryptedData.data, derivedKey, {
        iv: iv,
        mode: Crypto.mode.CBC,
        padding: Crypto.pad.Pkcs7,
      });

      return decrypted.toString(Crypto.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  // Encrypt object
  async encryptObject(obj: any, key?: string): Promise<EncryptedData> {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString, key);
  }

  // Decrypt object
  async decryptObject(encryptedData: EncryptedData, key?: string): Promise<any> {
    const jsonString = await this.decrypt(encryptedData, key);
    return JSON.parse(jsonString);
  }

  // Encrypt file
  async encryptFile(filePath: string, outputPath: string, key?: string): Promise<void> {
    try {
      // Read file
      const RNFS = require('react-native-fs');
      const fileData = await RNFS.readFile(filePath, 'base64');
      
      // Encrypt data
      const encrypted = await this.encrypt(fileData, key);
      
      // Write encrypted file
      const encryptedData = JSON.stringify(encrypted);
      await RNFS.writeFile(outputPath, encryptedData, 'utf8');
    } catch (error) {
      console.error('File encryption failed:', error);
      throw error;
    }
  }

  // Decrypt file
  async decryptFile(filePath: string, outputPath: string, key?: string): Promise<void> {
    try {
      // Read encrypted file
      const RNFS = require('react-native-fs');
      const encryptedData = await RNFS.readFile(filePath, 'utf8');
      const encrypted = JSON.parse(encryptedData);
      
      // Decrypt data
      const decrypted = await this.decrypt(encrypted, key);
      
      // Write decrypted file
      await RNFS.writeFile(outputPath, decrypted, 'base64');
    } catch (error) {
      console.error('File decryption failed:', error);
      throw error;
    }
  }

  // Hash data
  hash(data: string, algorithm: string = 'SHA256'): string {
    try {
      const Crypto = require('react-native-crypto-js');
      return Crypto[algorithm](data).toString();
    } catch (error) {
      console.error('Hashing failed:', error);
      throw error;
    }
  }

  // Generate secure random string
  generateSecureRandom(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Store encrypted data in AsyncStorage
  async storeEncrypted(key: string, data: any): Promise<void> {
    try {
      const encrypted = await this.encryptObject(data);
      await AsyncStorage.setItem(key, JSON.stringify(encrypted));
    } catch (error) {
      console.error('Failed to store encrypted data:', error);
      throw error;
    }
  }

  // Retrieve encrypted data from AsyncStorage
  async retrieveEncrypted(key: string): Promise<any> {
    try {
      const encryptedData = await AsyncStorage.getItem(key);
      if (!encryptedData) return null;

      const encrypted = JSON.parse(encryptedData);
      return await this.decryptObject(encrypted);
    } catch (error) {
      console.error('Failed to retrieve encrypted data:', error);
      throw error;
    }
  }

  // Encrypt sensitive user data
  async encryptUserData(userData: any): Promise<EncryptedData> {
    const sensitiveFields = ['password', 'ssn', 'creditCard', 'bankAccount'];
    const encryptedData: any = {};

    for (const [key, value] of Object.entries(userData)) {
      if (sensitiveFields.includes(key)) {
        encryptedData[key] = await this.encrypt(value as string);
      } else {
        encryptedData[key] = value;
      }
    }

    return await this.encryptObject(encryptedData);
  }

  // Decrypt sensitive user data
  async decryptUserData(encryptedUserData: EncryptedData): Promise<any> {
    const decryptedData = await this.decryptObject(encryptedUserData);
    const sensitiveFields = ['password', 'ssn', 'creditCard', 'bankAccount'];
    const result: any = {};

    for (const [key, value] of Object.entries(decryptedData)) {
      if (sensitiveFields.includes(key) && typeof value === 'object') {
        result[key] = await this.decrypt(value as EncryptedData);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  // Generate key pair for asymmetric encryption
  async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    try {
      // This is a simplified implementation
      // In a real app, you'd use a proper asymmetric encryption library
      const publicKey = this.generateSecureRandom(64);
      const privateKey = this.generateSecureRandom(128);
      
      return { publicKey, privateKey };
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw error;
    }
  }

  // Sign data
  async signData(data: string, privateKey: string): Promise<string> {
    try {
      const Crypto = require('react-native-crypto-js');
      const signature = Crypto.HmacSHA256(data, privateKey).toString();
      return signature;
    } catch (error) {
      console.error('Data signing failed:', error);
      throw error;
    }
  }

  // Verify signature
  async verifySignature(data: string, signature: string, publicKey: string): Promise<boolean> {
    try {
      const Crypto = require('react-native-crypto-js');
      const expectedSignature = Crypto.HmacSHA256(data, publicKey).toString();
      return signature === expectedSignature;
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  // Change master key
  async changeMasterKey(newKey: string): Promise<void> {
    try {
      // Re-encrypt all stored data with new key
      const keys = await AsyncStorage.getAllKeys();
      const encryptedKeys = keys.filter(key => key.startsWith('encrypted_'));

      for (const key of encryptedKeys) {
        const encryptedData = await AsyncStorage.getItem(key);
        if (encryptedData) {
          const decrypted = await this.decryptObject(JSON.parse(encryptedData));
          const reEncrypted = await this.encryptObject(decrypted, newKey);
          await AsyncStorage.setItem(key, JSON.stringify(reEncrypted));
        }
      }

      // Update master key
      this.masterKey = newKey;
      const Keychain = require('react-native-keychain');
      await Keychain.setGenericPassword('boundary_master_key', newKey);
    } catch (error) {
      console.error('Failed to change master key:', error);
      throw error;
    }
  }

  // Wipe all encrypted data
  async wipeAllEncryptedData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const encryptedKeys = keys.filter(key => key.startsWith('encrypted_'));
      
      for (const key of encryptedKeys) {
        await AsyncStorage.removeItem(key);
      }

      // Remove master key from keychain
      const Keychain = require('react-native-keychain');
      await Keychain.resetGenericPassword();
      this.masterKey = null;
    } catch (error) {
      console.error('Failed to wipe encrypted data:', error);
      throw error;
    }
  }

  // Get encryption status
  getEncryptionStatus(): { initialized: boolean; hasMasterKey: boolean } {
    return {
      initialized: this.masterKey !== null,
      hasMasterKey: this.masterKey !== null,
    };
  }

  // Validate encryption strength
  validateEncryptionStrength(password: string): {
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    // Complexity checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    return { score, feedback };
  }
}

export const encryptionService = EncryptionService.getInstance();
export default encryptionService; 
