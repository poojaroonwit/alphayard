import type { AppKitUser } from './types';
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
}
