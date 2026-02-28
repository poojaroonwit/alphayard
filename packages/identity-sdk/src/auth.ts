import type {
  AppKitConfig,
  AuthUrlOptions,
  TokenResponse,
  TokenSet,
  LoginOptions,
  LogoutOptions,
  CallbackResult,
} from './types';
import { AppKitError } from './types';
import { generatePKCEChallenge, generateRandomString } from './pkce';
import { TokenStorage } from './storage';
import { HttpClient } from './http';

export class AuthModule {
  private refreshTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private config: AppKitConfig,
    private tokenStorage: TokenStorage,
    private http: HttpClient,
    private emit: (event: string, payload?: unknown) => void,
  ) {}

  /** Build an OAuth authorization URL */
  async buildAuthUrl(options: AuthUrlOptions = {}): Promise<string> {
    const redirectUri = options.redirect_uri || this.config.redirectUri;
    if (!redirectUri) throw new AppKitError('redirect_uri is required', 'missing_redirect_uri');

    const scope = options.scope || this.config.scopes?.join(' ') || 'openid profile email';
    const state = options.state || generateRandomString(32);
    this.tokenStorage.setState(state);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope,
      state,
    });

    // PKCE (enabled by default)
    if (options.usePKCE !== false) {
      const pkce = await generatePKCEChallenge();
      this.tokenStorage.setPKCEVerifier(pkce.codeVerifier);
      params.set('code_challenge', pkce.codeChallenge);
      params.set('code_challenge_method', pkce.codeChallengeMethod);
    }

    if (options.extraParams) {
      for (const [k, v] of Object.entries(options.extraParams)) {
        params.set(k, v);
      }
    }

    return `${this.config.domain}/oauth/authorize?${params.toString()}`;
  }

  /** Redirect the browser to the login page */
  async login(options: LoginOptions = {}): Promise<void> {
    const url = await this.buildAuthUrl({
      redirect_uri: options.redirectUri || this.config.redirectUri,
      scope: options.scope,
      extraParams: {
        ...(options.loginHint ? { login_hint: options.loginHint } : {}),
        ...(options.prompt ? { prompt: options.prompt } : {}),
      },
    });

    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  }

  /** Handle the OAuth callback — exchange code for tokens */
  async handleCallback(callbackUrl?: string): Promise<CallbackResult> {
    const url = callbackUrl
      ? new URL(callbackUrl)
      : typeof window !== 'undefined'
        ? new URL(window.location.href)
        : null;

    if (!url) throw new AppKitError('No callback URL available', 'no_callback_url');

    const params = url.searchParams;
    const error = params.get('error');
    if (error) {
      throw new AppKitError(
        params.get('error_description') || error,
        error,
      );
    }

    const code = params.get('code');
    if (!code) throw new AppKitError('Missing authorization code', 'missing_code');

    // Validate state
    const returnedState = params.get('state');
    const savedState = this.tokenStorage.getState();
    if (savedState && returnedState !== savedState) {
      throw new AppKitError('State mismatch — possible CSRF attack', 'state_mismatch');
    }
    this.tokenStorage.clearState();

    // Exchange code for tokens
    const body: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri || '',
    };

    // Attach PKCE verifier
    const verifier = this.tokenStorage.getPKCEVerifier();
    if (verifier) {
      body.code_verifier = verifier;
      this.tokenStorage.clearPKCEVerifier();
    }

    const tokenResponse = await this.http.postForm<TokenResponse>(
      '/oauth/token',
      body,
    );

    const tokens = this.mapTokenResponse(tokenResponse);
    this.tokenStorage.setTokens(tokens);
    this.scheduleRefresh(tokens);
    this.emit('login', tokens);

    return { tokens, state: returnedState || undefined };
  }

  /** Refresh the access token using the refresh token */
  async refreshToken(): Promise<TokenSet> {
    const current = this.tokenStorage.getTokens();
    if (!current?.refreshToken) {
      throw new AppKitError('No refresh token available', 'no_refresh_token');
    }

    const tokenResponse = await this.http.postForm<TokenResponse>(
      '/oauth/token',
      {
        grant_type: 'refresh_token',
        refresh_token: current.refreshToken,
        client_id: this.config.clientId,
      },
    );

    const tokens = this.mapTokenResponse(tokenResponse);
    this.tokenStorage.setTokens(tokens);
    this.scheduleRefresh(tokens);
    this.emit('token_refreshed', tokens);

    return tokens;
  }

  /** Log out — clear local session and optionally revoke server-side */
  async logout(options: LogoutOptions = {}): Promise<void> {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);

    const tokens = this.tokenStorage.getTokens();

    // Revoke refresh token on the server
    if (options.revokeToken !== false && tokens?.refreshToken) {
      try {
        await this.http.postForm('/oauth/revoke', {
          token: tokens.refreshToken,
          token_type_hint: 'refresh_token',
          client_id: this.config.clientId,
        });
      } catch {
        // Best-effort revocation
      }
    }

    this.tokenStorage.clear();
    this.emit('logout');

    // Redirect to post-logout URL
    if (options.post_logout_redirect_uri && typeof window !== 'undefined') {
      const params = new URLSearchParams({
        post_logout_redirect_uri: options.post_logout_redirect_uri,
        client_id: this.config.clientId,
      });
      if (tokens?.idToken) params.set('id_token_hint', tokens.idToken);
      window.location.href = `${this.config.domain}/oauth/logout?${params.toString()}`;
    }
  }

  /** Get the current access token, refreshing if expired */
  async getAccessToken(): Promise<string | null> {
    const tokens = this.tokenStorage.getTokens();
    if (!tokens) return null;

    // If token is expired or about to expire (30s buffer)
    if (Date.now() >= tokens.expiresAt - 30_000) {
      if (tokens.refreshToken) {
        try {
          const refreshed = await this.refreshToken();
          return refreshed.accessToken;
        } catch {
          this.emit('token_expired');
          return null;
        }
      }
      this.emit('token_expired');
      return null;
    }

    return tokens.accessToken;
  }

  /** Check if the user is currently authenticated */
  isAuthenticated(): boolean {
    const tokens = this.tokenStorage.getTokens();
    return !!tokens && Date.now() < tokens.expiresAt;
  }

  /** Get current token set (without auto-refresh) */
  getTokens(): TokenSet | null {
    return this.tokenStorage.getTokens();
  }

  /** Stop background token refresh */
  destroy(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
  }

  // ─── Private ──────────────────────────────────────────────────

  private mapTokenResponse(res: TokenResponse): TokenSet {
    return {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      idToken: res.id_token,
      expiresAt: Date.now() + res.expires_in * 1000,
      scope: res.scope,
    };
  }

  private scheduleRefresh(tokens: TokenSet): void {
    if (!this.config.autoRefresh || this.config.autoRefresh === undefined) {
      // auto-refresh is on by default
    }
    if (this.config.autoRefresh === false) return;
    if (!tokens.refreshToken) return;

    if (this.refreshTimer) clearTimeout(this.refreshTimer);

    // Refresh 60 seconds before expiry
    const delay = Math.max(tokens.expiresAt - Date.now() - 60_000, 5_000);
    this.refreshTimer = setTimeout(() => {
      this.refreshToken().catch(() => this.emit('token_expired'));
    }, delay);
  }
}
