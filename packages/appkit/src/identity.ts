import type {
  AppKitUser,
  MFAVerifyOptions,
  UserMFA,
  UserSession,
  UserDevice,
  LoginHistoryEntry,
  SecuritySettings,
  MFASetupResponse
} from './types';
import { HttpClient } from './http';

export class IdentityModule {
  constructor(private http: HttpClient) {}

  /** Get the current authenticated user's profile */
  async getUser(): Promise<AppKitUser> {
    return this.http.get<AppKitUser>('/api/v1/users/me');
  }

  /** Get a user by ID (requires management scope) */
  async getUserById(userId: string): Promise<AppKitUser> {
    return this.http.get<AppKitUser>(`/api/v1/users/${userId}`);
  }

  /** Update the current user's profile */
  async updateProfile(data: Partial<Pick<AppKitUser, 'firstName' | 'lastName' | 'phone' | 'avatar'>>): Promise<AppKitUser> {
    return this.http.patch<AppKitUser>('/api/v1/users/me', data);
  }

  /** Get custom attributes for the current user */
  async getAttributes(): Promise<Record<string, unknown>> {
    const user = await this.http.get<AppKitUser>('/api/v1/users/me');
    return user.attributes || {};
  }

  /** Update custom attributes for the current user */
  async updateAttributes(attributes: Record<string, unknown>): Promise<Record<string, unknown>> {
    const res = await this.http.patch<{ attributes: Record<string, unknown> }>(
      '/api/v1/users/me/attributes',
      attributes,
    );
    return res.attributes;
  }

  /** Delete the current user's account */
  async deleteAccount(): Promise<void> {
    await this.http.delete('/api/v1/users/me');
  }

  /** Verify MFA (e.g. during login or for sensitive actions) */
  async verifyMFA(options: MFAVerifyOptions): Promise<{ success: boolean }> {
    return this.http.post<{ success: boolean }>('/api/v1/identity/mfa/verify', options);
  }

  /** Get all MFA methods and their status for the current user */
  async getMFASettings(): Promise<UserMFA[]> {
    return this.http.get<UserMFA[]>('/api/v1/identity/mfa');
  }

  /** Disable an MFA method */
  async disableMFA(mfaType: string): Promise<void> {
    await this.http.post('/api/v1/identity/mfa/disable', { mfaType });
  }

  /** Step 1: Enroll/Setup a new MFA method */
  async setupMFA(mfaType: string): Promise<MFASetupResponse> {
    return this.http.post<MFASetupResponse>('/api/v1/identity/mfa/setup', { mfaType });
  }

  /** Step 2: Verify and activate the newly setup MFA method */
  async verifyMFASetup(mfaType: string, code: string, challengeId?: string): Promise<AppKitUser> {
    return this.http.post<AppKitUser>('/api/v1/identity/mfa/setup/verify', { mfaType, code, challengeId });
  }

  /** Regenerate recovery/backup codes */
  async regenerateBackupCodes(): Promise<{ backupCodes: string[] }> {
    return this.http.post<{ backupCodes: string[] }>('/api/v1/identity/mfa/backup-codes/regenerate', {});
  }

  // ─── Sessions / Devices ──────────────────────────────────────────

  /** Get all active sessions */
  async getSessions(includeExpired = false): Promise<UserSession[]> {
    return this.http.get<UserSession[]>(`/api/v1/identity/sessions?includeExpired=${includeExpired}`);
  }

  /** Revoke a specific session */
  async revokeSession(sessionId: string): Promise<void> {
    await this.http.post(`/api/v1/identity/sessions/${sessionId}/revoke`, {});
  }

  /** Revoke all sessions except the current one */
  async revokeAllSessions(): Promise<{ success: boolean; revokedCount: number }> {
    return this.http.post<{ success: boolean; revokedCount: number }>('/api/v1/identity/sessions/revoke-all', {});
  }

  /** Get all registered devices */
  async getDevices(): Promise<UserDevice[]> {
    return this.http.get<UserDevice[]>('/api/v1/identity/devices');
  }

  /** Trust a device */
  async trustDevice(deviceId: string): Promise<void> {
    await this.http.post(`/api/v1/identity/devices/${deviceId}/trust`, {});
  }

  /** Block a device */
  async blockDevice(deviceId: string): Promise<void> {
    await this.http.post(`/api/v1/identity/devices/${deviceId}/block`, {});
  }

  /** Remove/Unregister a device */
  async removeDevice(deviceId: string): Promise<void> {
    await this.http.delete(`/api/v1/identity/devices/${deviceId}`);
  }

  // ─── Security / Account ──────────────────────────────────────────

  /** Get login history */
  async getLoginHistory(options?: {
    page?: number;
    limit?: number;
    success?: boolean;
  }): Promise<{ history: LoginHistoryEntry[]; total: number; page: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.success !== undefined) params.append('success', options.success.toString());
    
    return this.http.get<{ history: LoginHistoryEntry[]; total: number; page: number; totalPages: number }>(
      `/api/v1/identity/login-history?${params.toString()}`
    );
  }

  /** Get security overview and settings */
  async getSecuritySettings(): Promise<SecuritySettings> {
    return this.http.get<SecuritySettings>('/api/v1/identity/security');
  }

  /** Change the current user's password */
  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>('/api/v1/identity/security/change-password', {
      currentPassword,
      newPassword
    });
  }

  /** Request account deletion */
  async requestAccountDeletion(password: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>('/api/v1/identity/account/delete-request', {
      password,
      reason
    });
  }

  /** Request data export (GDPR) */
  async requestDataExport(): Promise<{ success: boolean; message: string; estimatedTime?: string }> {
    return this.http.post<{ success: boolean; message: string; estimatedTime?: string }>('/api/v1/identity/account/export-data', {});
  }

  /** Check if the current user has a PIN set */
  async getPinStatus(): Promise<{ hasPin: boolean }> {
    return this.http.get<{ hasPin: boolean }>('/api/v1/identity/pin');
  }

  /** Set or update the current user's PIN */
  async setPin(pin: string): Promise<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>('/api/v1/identity/pin', { pin });
  }

  /** Verify the current user's PIN */
  async verifyPin(pin: string): Promise<{ success: boolean; verified: boolean; message: string }> {
    return this.http.post<{ success: boolean; verified: boolean; message: string }>('/api/v1/identity/pin/verify', { pin });
  }
}
