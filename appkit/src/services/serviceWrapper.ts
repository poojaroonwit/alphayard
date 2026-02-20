/**
 * Service Wrapper Utility
 * 
 * Provides wrapper functions for service calls with consistent error handling
 * and service availability checking.
 */

export class ServiceError extends Error {
  public code: string;
  public statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface ServiceWrapper {
  wrapCall<T>(fn: () => Promise<T>): Promise<T>;
  isServiceAvailable(serviceName: string): boolean;
}

class ServiceWrapperImpl implements ServiceWrapper {
  private availableServices: Set<string> = new Set();

  constructor() {
    // Initialize with known available services
    this.checkServiceAvailability();
  }

  private checkServiceAvailability() {
    // Check for SSOProvider service
    try {
      require('../services/SSOProviderService');
      this.availableServices.add('SSOProvider');
    } catch (error) {
      // Service not available
    }
  }

  async wrapCall<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      
      // Wrap unknown errors
      if (error instanceof Error) {
        throw new ServiceError(error.message, 'SERVICE_ERROR', 500);
      }
      
      throw new ServiceError('Unknown service error', 'UNKNOWN_ERROR', 500);
    }
  }

  isServiceAvailable(serviceName: string): boolean {
    return this.availableServices.has(serviceName);
  }
}

export const serviceWrapper = new ServiceWrapperImpl();

// OAuth-specific wrapper
export const oauthServiceWrapper = {
  wrapCall: async <T>(fn: () => Promise<T>, context?: any): Promise<T> => {
    return serviceWrapper.wrapCall(fn);
  },
  isServiceAvailable: (serviceName: string = 'SSOProvider'): boolean => {
    return serviceWrapper.isServiceAvailable(serviceName);
  }
};

