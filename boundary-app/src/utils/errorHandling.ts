export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}

export class ErrorHandler {
  static handle(error: any): ApiError {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      return {
        message: error.response.data?.message || error.response.data?.error || 'Server error occurred',
        code: error.response.data?.code,
        status: error.response.status,
        details: error.response.data
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
        status: 0
      };
    } else {
      // Something else happened
      return {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR'
      };
    }
  }

  static isNetworkError(error: ApiError): boolean {
    return error.code === 'NETWORK_ERROR' || error.status === 0;
  }

  static isServerError(error: ApiError): boolean {
    return error.status ? error.status >= 500 : false;
  }

  static isClientError(error: ApiError): boolean {
    return error.status ? error.status >= 400 && error.status < 500 : false;
  }

  static getErrorMessage(error: ApiError): string {
    if (this.isNetworkError(error)) {
      return 'Please check your internet connection and try again.';
    }
    
    if (this.isServerError(error)) {
      return 'Server is temporarily unavailable. Please try again later.';
    }
    
    if (this.isClientError(error)) {
      return error.message || 'Invalid request. Please check your input.';
    }
    
    return error.message || 'An unexpected error occurred.';
  }

  static shouldRetry(error: ApiError): boolean {
    // Retry on network errors and server errors (5xx)
    return this.isNetworkError(error) || this.isServerError(error);
  }
}

export class ServiceWrapper {
  static async execute<T>(
    serviceCall: () => Promise<T>,
    options: {
      retries?: number;
      retryDelay?: number;
      fallbackData?: T;
    } = {}
  ): Promise<ServiceResponse<T>> {
    const { retries = 2, retryDelay = 1000, fallbackData = null } = options;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const data = await serviceCall();
        return {
          data,
          error: null,
          loading: false
        };
      } catch (error) {
        const apiError = ErrorHandler.handle(error);
        
        // If this is the last attempt or we shouldn't retry, return error
        if (attempt === retries || !ErrorHandler.shouldRetry(apiError)) {
          return {
            data: fallbackData,
            error: apiError,
            loading: false
          };
        }
        
        // Wait before retrying
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    // This should never be reached, but just in case
    return {
      data: fallbackData,
      error: {
        message: 'Maximum retry attempts exceeded',
        code: 'MAX_RETRIES_EXCEEDED'
      },
      loading: false
    };
  }
}

export const createServiceHook = <T>(
  serviceCall: () => Promise<T>,
  _dependencies: any[] = []
) => {
  return {
    execute: (options?: Parameters<typeof ServiceWrapper.execute>[1]) => 
      ServiceWrapper.execute(serviceCall, options)
  };
};
