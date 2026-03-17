import { appkit } from './appkit';

/**
 * Legacy ApiClient refactored as a thin wrapper around the AppKit SDK.
 * This ensures that all remaining services (Chat, Social, etc.) immediately
 * benefit from the SDK's unified transport and automatic 401 refresh logic.
 */
class ApiClient {
  // Public methods mapping to SDK's universal call
  async get<T = any>(url: string, _config?: any): Promise<T> {
    return appkit.call<T>('GET', url);
  }

  async post<T = any>(url: string, data?: any, _config?: any): Promise<T> {
    return appkit.call<T>('POST', url, data);
  }

  async put<T = any>(url: string, data?: any, _config?: any): Promise<T> {
    return appkit.call<T>('PUT', url, data);
  }

  async patch<T = any>(url: string, data?: any, _config?: any): Promise<T> {
    return appkit.call<T>('PATCH', url, data);
  }

  async delete<T = any>(url: string, _config?: any): Promise<T> {
    return appkit.call<T>('DELETE', url);
  }

  async upload<T = any>(url: string, formData: FormData, _config?: any): Promise<T> {
    // Note: appkit.call currently handles JSON. For multipart, 
    // we would extend HttpClient. For now, we route through standard POST.
    return appkit.call<T>('POST', url, formData);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await appkit.call('GET', '/health');
      return true;
    } catch {
      return false;
    }
  }

  // Legacy compatibility methods (now handled by SDK internally)
  setBaseURL(_url: string) { /* No-op: Managed by SDK */ }
  setAuthToken(_token: string) { /* No-op: Managed by SDK */ }
  removeAuthToken() { /* No-op: Managed by SDK */ }
  setOnLogout(callback: () => void) {
    appkit.on('logout', callback);
  }
  async handleLogout(): Promise<void> {
    await appkit.logout();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
