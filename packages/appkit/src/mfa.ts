import type { MFAType, MFAEnrollResponse, MFAVerifyOptions, MFAStatus } from './types';
import { HttpClient } from './http';

export class MFAModule {
  constructor(private http: HttpClient) {}

  /** Get current MFA status for the authenticated user */
  async getStatus(): Promise<MFAStatus> {
    return this.http.get<MFAStatus>('/api/v1/users/me/mfa');
  }

  /** Enroll in a new MFA method */
  async enroll(type: MFAType): Promise<MFAEnrollResponse> {
    return this.http.post<MFAEnrollResponse>('/api/v1/users/me/mfa/enroll', { type });
  }

  /** Verify an MFA code to complete enrollment or challenge */
  async verify(options: MFAVerifyOptions): Promise<{ success: boolean }> {
    return this.http.post<{ success: boolean }>('/api/v1/users/me/mfa/verify', options);
  }

  /** Disable a specific MFA method */
  async disable(type: MFAType): Promise<void> {
    await this.http.delete(`/api/v1/users/me/mfa/${type}`);
  }

  /** Generate backup recovery codes */
  async generateRecoveryCodes(): Promise<{ codes: string[] }> {
    return this.http.post<{ codes: string[] }>('/api/v1/users/me/mfa/recovery-codes');
  }
}
