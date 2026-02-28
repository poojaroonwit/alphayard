import type { TokenSet } from './types';

const TOKEN_KEY = 'appkit_tokens';
const PKCE_KEY = 'appkit_pkce_verifier';
const STATE_KEY = 'appkit_auth_state';

export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

class LocalStorageAdapter implements StorageAdapter {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  }
  set(key: string, value: string): void {
    if (typeof window !== 'undefined') localStorage.setItem(key, value);
  }
  remove(key: string): void {
    if (typeof window !== 'undefined') localStorage.removeItem(key);
  }
}

class SessionStorageAdapter implements StorageAdapter {
  get(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key);
  }
  set(key: string, value: string): void {
    if (typeof window !== 'undefined') sessionStorage.setItem(key, value);
  }
  remove(key: string): void {
    if (typeof window !== 'undefined') sessionStorage.removeItem(key);
  }
}

class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, string>();
  get(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  set(key: string, value: string): void {
    this.store.set(key, value);
  }
  remove(key: string): void {
    this.store.delete(key);
  }
}

class CookieStorageAdapter implements StorageAdapter {
  get(key: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  }
  set(key: string, value: string): void {
    if (typeof document === 'undefined') return;
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=${maxAge};SameSite=Lax;Secure`;
  }
  remove(key: string): void {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=;path=/;max-age=0`;
  }
}

export function createStorage(type: string): StorageAdapter {
  switch (type) {
    case 'sessionStorage':
      return new SessionStorageAdapter();
    case 'cookie':
      return new CookieStorageAdapter();
    case 'memory':
      return new MemoryStorageAdapter();
    default:
      return new LocalStorageAdapter();
  }
}

export class TokenStorage {
  constructor(private adapter: StorageAdapter) {}

  getTokens(): TokenSet | null {
    const raw = this.adapter.get(TOKEN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TokenSet;
    } catch {
      return null;
    }
  }

  setTokens(tokens: TokenSet): void {
    this.adapter.set(TOKEN_KEY, JSON.stringify(tokens));
  }

  clearTokens(): void {
    this.adapter.remove(TOKEN_KEY);
  }

  getPKCEVerifier(): string | null {
    return this.adapter.get(PKCE_KEY);
  }

  setPKCEVerifier(verifier: string): void {
    this.adapter.set(PKCE_KEY, verifier);
  }

  clearPKCEVerifier(): void {
    this.adapter.remove(PKCE_KEY);
  }

  getState(): string | null {
    return this.adapter.get(STATE_KEY);
  }

  setState(state: string): void {
    this.adapter.set(STATE_KEY, state);
  }

  clearState(): void {
    this.adapter.remove(STATE_KEY);
  }

  clear(): void {
    this.clearTokens();
    this.clearPKCEVerifier();
    this.clearState();
  }
}
