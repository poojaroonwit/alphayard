import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export interface EncryptedData {
  iv: string;
  encrypted: string;
  tag: string;
}

class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits
  private saltRounds = 12;
  private encryptionKey: Buffer;

  constructor() {
    this.encryptionKey = this.getEncryptionKey();
  }

  private getEncryptionKey(): Buffer {
    let key = process.env.ENCRYPTION_KEY;

    if (!key) {
      console.warn('⚠️ No encryption key found in environment, generating one...');
      key = crypto.randomBytes(this.keyLength).toString('hex');
      console.warn('⚠️ Generated encryption key. Please set ENCRYPTION_KEY in your environment variables.');
    }

    if (key.length !== this.keyLength * 2) {
      throw new Error('Encryption key must be 64 characters (32 bytes) in hex');
    }

    return Buffer.from(key, 'hex');
  }

  async encrypt(data: any): Promise<EncryptedData | null> {
    try {
      if (!data) return null;

      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = (cipher as any).getAuthTag();

      return {
        iv: iv.toString('hex'),
        encrypted: encrypted,
        tag: tag.toString('hex'),
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  async decrypt(encryptedData: EncryptedData): Promise<string | null> {
    try {
      if (!encryptedData || !encryptedData.iv || !encryptedData.encrypted || !encryptedData.tag) {
        return null;
      }

      const iv = Buffer.from(encryptedData.iv, 'hex');
      const tag = Buffer.from(encryptedData.tag, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      (decipher as any).setAuthTag(tag);

      let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  async hashPassword(password: string): Promise<string> {
    if (!password) throw new Error('Password is required');
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }

  generateSecureString(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  exportStatus() {
    return {
      algorithm: this.algorithm,
      hasKey: !!this.encryptionKey,
    };
  }
}

export const encryptionService = new EncryptionService();
export default encryptionService;
