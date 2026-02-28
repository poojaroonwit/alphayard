import { AppKitError } from './types';

export class HttpClient {
  constructor(
    private baseUrl: string,
    private getAccessToken: () => string | null,
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
    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
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

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const init: RequestInit = { method, headers: this.headers };
    if (body !== undefined) init.body = JSON.stringify(body);

    const res = await this.fetchFn(`${this.baseUrl}${path}`, init);
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
}
