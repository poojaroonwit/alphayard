import { appkit } from './appkit';
import { config } from '../../config/environment';

/**
 * ApiClient routes feature API calls to bondary-backend (config.apiUrl),
 * using the access token from the AppKit SDK for authentication.
 * SDK module methods (appkit.branding.*, appkit.cms.*, etc.) continue
 * to route to appkit directly and should not go through this client.
 */
class ApiClient {
  // Explicit token set after login (used by directLogin / OTP flows that bypass the SDK's
  // internal token storage). Falls back to the SDK's own getAccessToken() if not set.
  private _token: string | null = null;

  private async authHeaders(): Promise<Record<string, string>> {
    let token = this._token;
    if (!token) {
      try {
        token = await appkit.auth.getAccessToken();
      } catch {
        // SDK storage may be unavailable (e.g. after hot reload) — proceed without token
      }
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  private async request<T>(method: string, url: string, data?: any): Promise<T> {
    const base = config.apiUrl.replace(/\/$/, ''); // e.g. http://localhost:4000/api/v1
    // Strip /api/v1 prefix from url since base already includes it
    let path = url.startsWith('/') ? url : `/${url}`;
    if (path.startsWith('/api/v1/') || path === '/api/v1') {
      path = path.slice('/api/v1'.length) || '/';
    }
    const headers = await this.authHeaders();
    const res = await fetch(`${base}${path}`, {
      method,
      headers,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async get<T = any>(url: string, _config?: any): Promise<T> {
    return this.request<T>('GET', url);
  }

  async post<T = any>(url: string, data?: any, _config?: any): Promise<T> {
    return this.request<T>('POST', url, data);
  }

  async put<T = any>(url: string, data?: any, _config?: any): Promise<T> {
    return this.request<T>('PUT', url, data);
  }

  async patch<T = any>(url: string, data?: any, _config?: any): Promise<T> {
    return this.request<T>('PATCH', url, data);
  }

  async delete<T = any>(url: string, _config?: any): Promise<T> {
    return this.request<T>('DELETE', url);
  }

  async upload<T = any>(url: string, formData: FormData, _config?: any): Promise<T> {
    const base = config.apiUrl.replace(/\/$/, '');
    const path = url.startsWith('/') ? url : `/${url}`;
    const token = this._token || await appkit.auth.getAccessToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${base}${path}`, { method: 'POST', headers, body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || err.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('GET', '/health');
      return true;
    } catch {
      return false;
    }
  }

  // Token management
  setBaseURL(_url: string) { /* No-op */ }
  setAuthToken(token: string) { this._token = token; }
  removeAuthToken() { this._token = null; }
  setOnLogout(callback: () => void) {
    appkit.on('logout', callback);
  }
  async handleLogout(): Promise<void> {
    await appkit.logout();
  }
}

export const apiClient = new ApiClient();
export default apiClient;
