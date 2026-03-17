import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { apiClient } from '../api/apiClient';
import { encryptionService } from '../encryption/EncryptionService';

interface BackupData {
  id: string;
  timestamp: number;
  version: string;
  size: number;
  type: 'full' | 'incremental';
  description?: string;
  encrypted: boolean;
}

interface BackupProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'preparing' | 'uploading' | 'encrypting' | 'completed' | 'failed';
}

interface RestoreProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'downloading' | 'decrypting' | 'restoring' | 'completed' | 'failed';
}

export class BackupService {
  private static instance: BackupService;
  private backupDir: string;
  private isBackingUp: boolean = false;
  private isRestoring: boolean = false;

  private constructor() {
    this.backupDir = `${RNFS.DocumentDirectoryPath}/boundary/backups`;
  }

  static getInstance(): BackupService {
    if (!BackupService.instance) {
      BackupService.instance = new BackupService();
    }
    return BackupService.instance;
  }

  // Initialize backup service
  async initialize(): Promise<void> {
    try {
      // Create backup directory
      const exists = await RNFS.exists(this.backupDir);
      if (!exists) {
        await RNFS.mkdir(this.backupDir);
      }

      console.log('Backup service initialized');
    } catch (error) {
      console.error('Failed to initialize backup service:', error);
      throw error;
    }
  }

  // Create local backup
  async createLocalBackup(
    description?: string,
    onProgress?: (progress: BackupProgress) => void
  ): Promise<BackupData> {
    if (this.isBackingUp) {
      throw new Error('Backup already in progress');
    }

    this.isBackingUp = true;

    try {
      onProgress?.({
        current: 0,
        total: 100,
        percentage: 0,
        status: 'preparing',
      });

      // Collect all data
      const allKeys = await AsyncStorage.getAllKeys();
      const backupData: any = {};

      for (let i = 0; i < allKeys.length; i++) {
        const key = allKeys[i];
        const value = await AsyncStorage.getItem(key);
        if (value) {
          backupData[key] = value;
        }

        onProgress?.({
          current: i + 1,
          total: allKeys.length,
          percentage: ((i + 1) / allKeys.length) * 50,
          status: 'preparing',
        });
      }

      // Create backup object
      const backup: BackupData = {
        id: this.generateBackupId(),
        timestamp: Date.now(),
        version: '1.0.0',
        size: JSON.stringify(backupData).length,
        type: 'full',
        description,
        encrypted: true,
      };

      onProgress?.({
        current: 50,
        total: 100,
        percentage: 50,
        status: 'encrypting',
      });

      // Encrypt backup data
      const encryptedData = await encryptionService.encryptObject({
        backup,
        data: backupData,
      });

      onProgress?.({
        current: 75,
        total: 100,
        percentage: 75,
        status: 'uploading',
      });

      // Save to local file
      const backupPath = `${this.backupDir}/${backup.id}.backup`;
      await RNFS.writeFile(backupPath, JSON.stringify(encryptedData), 'utf8');

      onProgress?.({
        current: 100,
        total: 100,
        percentage: 100,
        status: 'completed',
      });

      return backup;
    } catch (error) {
      console.error('Local backup failed:', error);
      throw error;
    } finally {
      this.isBackingUp = false;
    }
  }

  // Create cloud backup
  async createCloudBackup(
    description?: string,
    onProgress?: (progress: BackupProgress) => void
  ): Promise<BackupData> {
    if (this.isBackingUp) {
      throw new Error('Backup already in progress');
    }

    this.isBackingUp = true;

    try {
      onProgress?.({
        current: 0,
        total: 100,
        percentage: 0,
        status: 'preparing',
      });

      // Create local backup first
      const localBackup = await this.createLocalBackup(description, (progress) => {
        onProgress?.({
          current: progress.current,
          total: progress.total,
          percentage: progress.percentage * 0.5,
          status: progress.status,
        });
      });

      onProgress?.({
        current: 50,
        total: 100,
        percentage: 50,
        status: 'uploading',
      });

      // Upload to cloud
      const backupPath = `${this.backupDir}/${localBackup.id}.backup`;
      const backupFile = await RNFS.readFile(backupPath, 'utf8');

      const response = await apiClient.post('/backup/upload', {
        backup: localBackup,
        data: backupFile,
      });

      onProgress?.({
        current: 100,
        total: 100,
        percentage: 100,
        status: 'completed',
      });

      return response.data;
    } catch (error) {
      console.error('Cloud backup failed:', error);
      throw error;
    } finally {
      this.isBackingUp = false;
    }
  }

  // Restore from local backup
  async restoreFromLocalBackup(
    backupId: string,
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<void> {
    if (this.isRestoring) {
      throw new Error('Restore already in progress');
    }

    this.isRestoring = true;

    try {
      onProgress?.({
        current: 0,
        total: 100,
        percentage: 0,
        status: 'downloading',
      });

      // Read backup file
      const backupPath = `${this.backupDir}/${backupId}.backup`;
      const exists = await RNFS.exists(backupPath);
      if (!exists) {
        throw new Error('Backup file not found');
      }

      const backupFile = await RNFS.readFile(backupPath, 'utf8');
      const encryptedData = JSON.parse(backupFile);

      onProgress?.({
        current: 25,
        total: 100,
        percentage: 25,
        status: 'decrypting',
      });

      // Decrypt backup data
      const decryptedData = await encryptionService.decryptObject(encryptedData);

      onProgress?.({
        current: 50,
        total: 100,
        percentage: 50,
        status: 'restoring',
      });

      // Clear existing data
      const allKeys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(allKeys);

      // Restore data
      const { data } = decryptedData;
      const keys = Object.keys(data);
      const values = Object.values(data);

      await AsyncStorage.multiSet(keys.map((key, index) => [key, values[index] as string]));

      onProgress?.({
        current: 100,
        total: 100,
        percentage: 100,
        status: 'completed',
      });
    } catch (error) {
      console.error('Local restore failed:', error);
      throw error;
    } finally {
      this.isRestoring = false;
    }
  }

  // Restore from cloud backup
  async restoreFromCloudBackup(
    backupId: string,
    onProgress?: (progress: RestoreProgress) => void
  ): Promise<void> {
    if (this.isRestoring) {
      throw new Error('Restore already in progress');
    }

    this.isRestoring = true;

    try {
      onProgress?.({
        current: 0,
        total: 100,
        percentage: 0,
        status: 'downloading',
      });

      // Download backup from cloud
      const response = await apiClient.get(`/backup/download/${backupId}`);
      const { backup, data } = response.data;

      onProgress?.({
        current: 50,
        total: 100,
        percentage: 50,
        status: 'decrypting',
      });

      // Decrypt backup data
      const encryptedData = JSON.parse(data);
      const decryptedData = await encryptionService.decryptObject(encryptedData);

      onProgress?.({
        current: 75,
        total: 100,
        percentage: 75,
        status: 'restoring',
      });

      // Clear existing data
      const allKeys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(allKeys);

      // Restore data
      const { data: backupData } = decryptedData;
      const keys = Object.keys(backupData);
      const values = Object.values(backupData);

      await AsyncStorage.multiSet(keys.map((key, index) => [key, values[index] as string]));

      onProgress?.({
        current: 100,
        total: 100,
        percentage: 100,
        status: 'completed',
      });
    } catch (error) {
      console.error('Cloud restore failed:', error);
      throw error;
    } finally {
      this.isRestoring = false;
    }
  }

  // Get local backups
  async getLocalBackups(): Promise<BackupData[]> {
    try {
      const files = await RNFS.readDir(this.backupDir);
      const backups: BackupData[] = [];

      for (const file of files) {
        if (file.name.endsWith('.backup')) {
          try {
            const backupFile = await RNFS.readFile(file.path, 'utf8');
            const encryptedData = JSON.parse(backupFile);
            const decryptedData = await encryptionService.decryptObject(encryptedData);
            backups.push(decryptedData.backup);
          } catch (error) {
            console.error(`Failed to read backup ${file.name}:`, error);
          }
        }
      }

      return backups.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get local backups:', error);
      return [];
    }
  }

  // Get cloud backups
  async getCloudBackups(): Promise<BackupData[]> {
    try {
      const response = await apiClient.get('/backup/list');
      return response.data;
    } catch (error) {
      console.error('Failed to get cloud backups:', error);
      return [];
    }
  }

  // Delete local backup
  async deleteLocalBackup(backupId: string): Promise<void> {
    try {
      const backupPath = `${this.backupDir}/${backupId}.backup`;
      const exists = await RNFS.exists(backupPath);
      if (exists) {
        await RNFS.unlink(backupPath);
      }
    } catch (error) {
      console.error('Failed to delete local backup:', error);
      throw error;
    }
  }

  // Delete cloud backup
  async deleteCloudBackup(backupId: string): Promise<void> {
    try {
      await apiClient.delete(`/backup/${backupId}`);
    } catch (error) {
      console.error('Failed to delete cloud backup:', error);
      throw error;
    }
  }

  // Auto backup
  async autoBackup(): Promise<void> {
    try {
      const lastBackup = await this.getLastBackupTime();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;

      if (!lastBackup || (now - lastBackup) > oneDay) {
        await this.createCloudBackup('Auto backup');
      }
    } catch (error) {
      console.error('Auto backup failed:', error);
    }
  }

  // Get last backup time
  private async getLastBackupTime(): Promise<number | null> {
    try {
      const backups = await this.getCloudBackups();
      if (backups.length > 0) {
        return backups[0].timestamp;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  // Generate backup ID
  private generateBackupId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `backup_${timestamp}_${random}`;
  }

  // Export backup
  async exportBackup(backupId: string, format: 'json' | 'zip' = 'json'): Promise<string> {
    try {
      const backupPath = `${this.backupDir}/${backupId}.backup`;
      const exists = await RNFS.exists(backupPath);
      if (!exists) {
        throw new Error('Backup file not found');
      }

      const backupFile = await RNFS.readFile(backupPath, 'utf8');
      const encryptedData = JSON.parse(backupFile);
      const decryptedData = await encryptionService.decryptObject(encryptedData);

      const exportPath = `${this.backupDir}/${backupId}_export.${format}`;
      await RNFS.writeFile(exportPath, JSON.stringify(decryptedData, null, 2), 'utf8');

      return exportPath;
    } catch (error) {
      console.error('Export backup failed:', error);
      throw error;
    }
  }

  // Import backup
  async importBackup(importPath: string): Promise<BackupData> {
    try {
      const importFile = await RNFS.readFile(importPath, 'utf8');
      const backupData = JSON.parse(importFile);

      // Validate backup data
      if (!backupData.backup || !backupData.data) {
        throw new Error('Invalid backup format');
      }

      // Encrypt and save
      const encryptedData = await encryptionService.encryptObject(backupData);
      const backupPath = `${this.backupDir}/${backupData.backup.id}.backup`;
      await RNFS.writeFile(backupPath, JSON.stringify(encryptedData), 'utf8');

      return backupData.backup;
    } catch (error) {
      console.error('Import backup failed:', error);
      throw error;
    }
  }

  // Get backup statistics
  async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    lastBackup: number | null;
    nextAutoBackup: number | null;
  }> {
    try {
      const localBackups = await this.getLocalBackups();
      const cloudBackups = await this.getCloudBackups();
      const allBackups = [...localBackups, ...cloudBackups];

      const totalSize = allBackups.reduce((sum, backup) => sum + backup.size, 0);
      const lastBackup = allBackups.length > 0 ? Math.max(...allBackups.map(b => b.timestamp)) : null;
      const nextAutoBackup = lastBackup ? lastBackup + (24 * 60 * 60 * 1000) : null;

      return {
        totalBackups: allBackups.length,
        totalSize,
        lastBackup,
        nextAutoBackup,
      };
    } catch (error) {
      console.error('Failed to get backup stats:', error);
      return {
        totalBackups: 0,
        totalSize: 0,
        lastBackup: null,
        nextAutoBackup: null,
      };
    }
  }

  // Check backup health
  async checkBackupHealth(): Promise<{
    healthy: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const stats = await this.getBackupStats();

      // Check if backups exist
      if (stats.totalBackups === 0) {
        issues.push('No backups found');
        recommendations.push('Create your first backup');
      }

      // Check backup age
      if (stats.lastBackup) {
        const daysSinceLastBackup = (Date.now() - stats.lastBackup) / (24 * 60 * 60 * 1000);
        if (daysSinceLastBackup > 7) {
          issues.push('Last backup is older than 7 days');
          recommendations.push('Create a new backup soon');
        }
      }

      // Check backup size
      if (stats.totalSize > 100 * 1024 * 1024) { // 100MB
        issues.push('Backup size is large');
        recommendations.push('Consider cleaning up old backups');
      }

      return {
        healthy: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      console.error('Backup health check failed:', error);
      return {
        healthy: false,
        issues: ['Backup health check failed'],
        recommendations: ['Check backup service configuration'],
      };
    }
  }
}

export const backupService = BackupService.getInstance();
export default backupService; 
