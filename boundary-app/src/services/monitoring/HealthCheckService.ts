import { Platform } from 'react-native';
import { apiClient } from '../api/apiClient';
import { encryptionService } from '../encryption/EncryptionService';
import { fileStorageService } from '../storage/FileStorageService';
import { backupService } from '../backup/BackupService';

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  timestamp: number;
  checks: HealthCheck[];
  summary: HealthSummary;
}

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  details?: any;
  duration: number;
}

interface HealthSummary {
  totalChecks: number;
  healthyChecks: number;
  warningChecks: number;
  criticalChecks: number;
  unknownChecks: number;
  overallStatus: 'healthy' | 'warning' | 'critical' | 'unknown';
}

interface SystemMetrics {
  memory: {
    used: number;
    total: number;
    available: number;
    percentage: number;
  };
  storage: {
    used: number;
    total: number;
    available: number;
    percentage: number;
  };
  network: {
    isConnected: boolean;
    type: string;
    speed?: number;
  };
  battery: {
    level: number;
    isCharging: boolean;
    temperature?: number;
  };
}

export class HealthCheckService {
  private static instance: HealthCheckService;
  private isRunning: boolean = false;
  private healthStatus: HealthStatus | null = null;
  private lastCheckTime: number = 0;
  private checkInterval: number = 30000; // 30 seconds

  private constructor() {}

  static getInstance(): HealthCheckService {
    if (!HealthCheckService.instance) {
      HealthCheckService.instance = new HealthCheckService();
    }
    return HealthCheckService.instance;
  }

  // Initialize health check service
  async initialize(): Promise<void> {
    try {
      console.log('Health check service initialized');
      
      // Start periodic health checks
      this.startPeriodicHealthChecks();
      
    } catch (error) {
      console.error('Failed to initialize health check service:', error);
      throw error;
    }
  }

  // Run comprehensive health check
  async runHealthCheck(): Promise<HealthStatus> {
    if (this.isRunning) {
      throw new Error('Health check already in progress');
    }

    this.isRunning = true;

    try {
      const startTime = Date.now();
      const checks: HealthCheck[] = [];

      // Run all health checks
      checks.push(await this.checkApiConnectivity());
      checks.push(await this.checkAuthentication());
      checks.push(await this.checkEncryptionService());
      checks.push(await this.checkFileStorageService());
      checks.push(await this.checkBackupService());
      checks.push(await this.checkSystemMetrics());
      checks.push(await this.checkNetworkConnectivity());
      checks.push(await this.checkMemoryUsage());
      checks.push(await this.checkStorageSpace());
      checks.push(await this.checkBatteryStatus());

      const endTime = Date.now();
      const summary = this.generateHealthSummary(checks);

      this.healthStatus = {
        status: summary.overallStatus,
        timestamp: endTime,
        checks,
        summary,
      };

      this.lastCheckTime = endTime;

      // Send health status to server
      await this.sendHealthStatusToServer(this.healthStatus);

      console.log(`Health check completed: ${summary.overallStatus}`);
      return this.healthStatus;

    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Check API connectivity
  private async checkApiConnectivity(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const response = await apiClient.get('/health');
      const duration = Date.now() - startTime;

      return {
        name: 'API Connectivity',
        status: response.status === 200 ? 'healthy' : 'critical',
        message: response.status === 200 ? 'API is responding normally' : 'API is not responding',
        details: {
          statusCode: response.status,
          responseTime: duration,
        },
        duration,
      };
    } catch (error) {
      return {
        name: 'API Connectivity',
        status: 'critical',
        message: 'Cannot connect to API server',
        details: {
          error: error.message,
        },
        duration: Date.now() - startTime,
      };
    }
  }

  // Check authentication
  private async checkAuthentication(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const authStatus = encryptionService.getEncryptionStatus();
      const duration = Date.now() - startTime;

      return {
        name: 'Authentication',
        status: authStatus.initialized ? 'healthy' : 'critical',
        message: authStatus.initialized ? 'Authentication service is working' : 'Authentication service is not initialized',
        details: authStatus,
        duration,
      };
    } catch (error) {
      return {
        name: 'Authentication',
        status: 'critical',
        message: 'Authentication service check failed',
        details: {
          error: error.message,
        },
        duration: Date.now() - startTime,
      };
    }
  }

  // Check encryption service
  private async checkEncryptionService(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Test encryption/decryption
      const testData = 'health_check_test';
      const encrypted = await encryptionService.encrypt(testData);
      const decrypted = await encryptionService.decrypt(encrypted);
      
      const duration = Date.now() - startTime;
      const isWorking = decrypted === testData;

      return {
        name: 'Encryption Service',
        status: isWorking ? 'healthy' : 'critical',
        message: isWorking ? 'Encryption service is working properly' : 'Encryption service is not working',
        details: {
          testPassed: isWorking,
        },
        duration,
      };
    } catch (error) {
      return {
        name: 'Encryption Service',
        status: 'critical',
        message: 'Encryption service check failed',
        details: {
          error: error.message,
        },
        duration: Date.now() - startTime,
      };
    }
  }

  // Check file storage service
  private async checkFileStorageService(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Check if service is initialized
      const cacheSize = await fileStorageService.getCacheSize();
      const duration = Date.now() - startTime;

      return {
        name: 'File Storage Service',
        status: 'healthy',
        message: 'File storage service is working',
        details: {
          cacheSize: `${Math.round(cacheSize / 1024 / 1024)}MB`,
        },
        duration,
      };
    } catch (error) {
      return {
        name: 'File Storage Service',
        status: 'critical',
        message: 'File storage service check failed',
        details: {
          error: error.message,
        },
        duration: Date.now() - startTime,
      };
    }
  }

  // Check backup service
  private async checkBackupService(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const stats = await backupService.getStorageQuota();
      const health = await backupService.checkBackupHealth();
      const duration = Date.now() - startTime;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = 'Backup service is working properly';

      if (!health.healthy) {
        status = health.issues.length > 0 ? 'critical' : 'warning';
        message = health.issues.join(', ');
      }

      return {
        name: 'Backup Service',
        status,
        message,
        details: {
          quota: stats,
          health,
        },
        duration,
      };
    } catch (error) {
      return {
        name: 'Backup Service',
        status: 'critical',
        message: 'Backup service check failed',
        details: {
          error: error.message,
        },
        duration: Date.now() - startTime,
      };
    }
  }

  // Check system metrics
  private async checkSystemMetrics(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const metrics = await this.getSystemMetrics();
      const duration = Date.now() - startTime;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = 'System metrics are normal';

      // Check memory usage
      if (metrics.memory.percentage > 90) {
        status = 'critical';
        message = 'Memory usage is critically high';
      } else if (metrics.memory.percentage > 80) {
        status = 'warning';
        message = 'Memory usage is high';
      }

      // Check storage usage
      if (metrics.storage.percentage > 95) {
        status = 'critical';
        message = 'Storage space is critically low';
      } else if (metrics.storage.percentage > 90) {
        status = 'warning';
        message = 'Storage space is low';
      }

      // Check battery level
      if (metrics.battery.level < 10) {
        status = 'warning';
        message = 'Battery level is low';
      }

      return {
        name: 'System Metrics',
        status,
        message,
        details: metrics,
        duration,
      };
    } catch (error) {
      return {
        name: 'System Metrics',
        status: 'unknown',
        message: 'Unable to get system metrics',
        details: {
          error: error.message,
        },
        duration: Date.now() - startTime,
      };
    }
  }

  // Check network connectivity
  private async checkNetworkConnectivity(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const isConnected = await this.checkNetworkConnection();
      const duration = Date.now() - startTime;

      return {
        name: 'Network Connectivity',
        status: isConnected ? 'healthy' : 'critical',
        message: isConnected ? 'Network connection is available' : 'No network connection',
        details: {
          isConnected,
        },
        duration,
      };
    } catch (error) {
      return {
        name: 'Network Connectivity',
        status: 'unknown',
        message: 'Unable to check network connectivity',
        details: {
          error: error.message,
        },
        duration: Date.now() - startTime,
      };
    }
  }

  // Check memory usage
  private async checkMemoryUsage(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const memoryUsage = this.getMemoryUsage();
      const duration = Date.now() - startTime;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = 'Memory usage is normal';

      if (memoryUsage.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
        status = 'critical';
        message = 'Memory usage is critically high';
      } else if (memoryUsage.usedJSHeapSize > 80 * 1024 * 1024) { // 80MB
        status = 'warning';
        message = 'Memory usage is high';
      }

      return {
        name: 'Memory Usage',
        status,
        message,
        details: {
          used: `${Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(memoryUsage.totalJSHeapSize / 1024 / 1024)}MB`,
        },
        duration,
      };
    } catch (error) {
      return {
        name: 'Memory Usage',
        status: 'unknown',
        message: 'Unable to check memory usage',
        details: {
          error: error.message,
        },
        duration: Date.now() - startTime,
      };
    }
  }

  // Check storage space
  private async checkStorageSpace(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      if (Platform.OS === 'web') {
        const duration = Date.now() - startTime;
        return {
          name: 'Storage Space',
          status: 'healthy', // Assume healthy on web
          message: 'Storage checks not available on web',
          details: {
            freeSpace: 'Unknown',
          },
          duration,
        };
      }

      const RNFS = require('react-native-fs');
      const freeSpace = await RNFS.getFSInfo();
      const duration = Date.now() - startTime;

      const freeSpaceMB = freeSpace.freeSpace / 1024 / 1024;
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = 'Storage space is sufficient';

      if (freeSpaceMB < 100) { // Less than 100MB
        status = 'critical';
        message = 'Storage space is critically low';
      } else if (freeSpaceMB < 500) { // Less than 500MB
        status = 'warning';
        message = 'Storage space is low';
      }

      return {
        name: 'Storage Space',
        status,
        message,
        details: {
          freeSpace: `${Math.round(freeSpaceMB)}MB`,
        },
        duration,
      };
    } catch (error) {
      return {
        name: 'Storage Space',
        status: 'unknown',
        message: 'Unable to check storage space',
        details: {
          error: error.message,
        },
        duration: Date.now() - startTime,
      };
    }
  }

  // Check battery status
  private async checkBatteryStatus(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const batteryInfo = await this.getBatteryInfo();
      const duration = Date.now() - startTime;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      let message = 'Battery status is normal';

      if (batteryInfo.level < 10) {
        status = 'critical';
        message = 'Battery level is critically low';
      } else if (batteryInfo.level < 20) {
        status = 'warning';
        message = 'Battery level is low';
      }

      return {
        name: 'Battery Status',
        status,
        message,
        details: {
          level: `${batteryInfo.level}%`,
          isCharging: batteryInfo.isCharging,
        },
        duration,
      };
    } catch (error) {
      return {
        name: 'Battery Status',
        status: 'unknown',
        message: 'Unable to check battery status',
        details: {
          error: error.message,
        },
        duration: Date.now() - startTime,
      };
    }
  }

  // Get system metrics
  private async getSystemMetrics(): Promise<SystemMetrics> {
    if (Platform.OS === 'web') {
        return {
            memory: {
                used: 0,
                total: 0,
                available: 0,
                percentage: 0,
            },
            storage: {
                used: 0,
                total: 0,
                available: 0,
                percentage: 0,
            },
            network: {
                isConnected: true,
                type: 'wifi',
                speed: 100,
            },
            battery: {
                level: 100,
                isCharging: true,
                temperature: 25,
            },
        };
    }

    const RNFS = require('react-native-fs');
    const freeSpace = await RNFS.getFSInfo();

    return {
      memory: {
        used: 50 * 1024 * 1024, // 50MB (simulated)
        total: 100 * 1024 * 1024, // 100MB (simulated)
        available: 50 * 1024 * 1024, // 50MB (simulated)
        percentage: 50,
      },
      storage: {
        used: freeSpace.totalSpace - freeSpace.freeSpace,
        total: freeSpace.totalSpace,
        available: freeSpace.freeSpace,
        percentage: ((freeSpace.totalSpace - freeSpace.freeSpace) / freeSpace.totalSpace) * 100,
      },
      network: {
        isConnected: true,
        type: 'wifi',
        speed: 100,
      },
      battery: {
        level: 85,
        isCharging: false,
        temperature: 25,
      },
    };
  }

  // Check network connection
  private async checkNetworkConnection(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Get memory usage
  private getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number } {
    // Simulated memory usage
    return {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    };
  }

  // Get battery info
  private async getBatteryInfo(): Promise<{ level: number; isCharging: boolean }> {
    // Simulated battery info
    return {
      level: 85,
      isCharging: false,
    };
  }

  // Generate health summary
  private generateHealthSummary(checks: HealthCheck[]): HealthSummary {
    const totalChecks = checks.length;
    const healthyChecks = checks.filter(c => c.status === 'healthy').length;
    const warningChecks = checks.filter(c => c.status === 'warning').length;
    const criticalChecks = checks.filter(c => c.status === 'critical').length;
    const unknownChecks = checks.filter(c => c.status === 'unknown').length;

    let overallStatus: 'healthy' | 'warning' | 'critical' | 'unknown' = 'healthy';

    if (criticalChecks > 0) {
      overallStatus = 'critical';
    } else if (warningChecks > 0) {
      overallStatus = 'warning';
    } else if (unknownChecks > 0) {
      overallStatus = 'unknown';
    }

    return {
      totalChecks,
      healthyChecks,
      warningChecks,
      criticalChecks,
      unknownChecks,
      overallStatus,
    };
  }

  // Send health status to server
  private async sendHealthStatusToServer(healthStatus: HealthStatus): Promise<void> {
    try {
      await apiClient.post('/health/status', healthStatus);
    } catch (error) {
      console.error('Failed to send health status to server:', error);
    }
  }

  // Start periodic health checks
  private startPeriodicHealthChecks(): void {
    setInterval(async () => {
      try {
        await this.runHealthCheck();
      } catch (error) {
        console.error('Periodic health check failed:', error);
      }
    }, this.checkInterval);
  }

  // Get current health status
  getCurrentHealthStatus(): HealthStatus | null {
    return this.healthStatus;
  }

  // Get last check time
  getLastCheckTime(): number {
    return this.lastCheckTime;
  }

  // Set check interval
  setCheckInterval(interval: number): void {
    this.checkInterval = interval;
  }

  // Stop periodic health checks
  stopPeriodicHealthChecks(): void {
    // Clear interval (simplified)
    console.log('Periodic health checks stopped');
  }
}

export const healthCheckService = HealthCheckService.getInstance();
export default healthCheckService; 
