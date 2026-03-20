import { AppKitError } from './types';
import { safelyJoinPath } from './utils';

export class HttpClient {
  private isRefreshing = false;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(
    private baseUrl: string,
    private getAccessToken: () => string | null,
    private onUnauthorized?: () => Promise<string | null>,
    private fetchFn: typeof globalThis.fetch = globalThis.fetch.bind(globalThis),
  ) {}

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = this.getAccessToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  async postForm<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = path.startsWith('http://') || path.startsWith('https://')
      ? path
      : safelyJoinPath(this.baseUrl, path);

    const res = await this.fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new AppKitError(
        err.error_description || err.message || `HTTP ${res.status}`,
        err.error || 'request_failed',
        res.status,
      );
    }
    return res.json();
  }

  private async request<T>(method: string, path: string, body?: unknown, isRetry = false): Promise<T> {
    // Proactive refresh: if the access token is already known to be expired (getAccessToken
    // returns null) but a refresh might be possible, refresh BEFORE sending the request.
    // This avoids the needless 401 round-trip and console noise for the common case of an
    // expired access token with a still-valid refresh token.
    let didProactiveRefresh = false;
    if (!this.getAccessToken() && this.onUnauthorized && !isRetry) {
      await this.handleRefresh();
      didProactiveRefresh = true;
    }

    const url = path.startsWith('http://') || path.startsWith('https://')
      ? path
      : safelyJoinPath(this.baseUrl, path);

    const init: RequestInit = { method, headers: this.headers };
    if (body !== undefined) init.body = JSON.stringify(body);

    const res = await this.fetchFn(url, init);

    // Reactive refresh: handle 401 when we had a seemingly-valid token (e.g. server-side
    // revocation, clock skew). Skip if we already did a proactive refresh above.
    if (res.status === 401 && !isRetry && !didProactiveRefresh && this.onUnauthorized) {
      const newToken = await this.handleRefresh();
      if (newToken) {
        return this.request<T>(method, path, body, true);
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new AppKitError(
        err.error_description || err.message || `HTTP ${res.status}`,
        err.error || 'request_failed',
        res.status,
      );
    }

    const text = await res.text();
    if (!text) return {} as T;
    return JSON.parse(text);
  }

  private async handleRefresh(): Promise<string | null> {
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        if (this.onUnauthorized) {
          return await this.onUnauthorized();
        }
        return null;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
