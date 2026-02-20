/**
 * SSO Provider Service
 * 
 * Handles OAuth provider operations for the AppKit SSO system.
 */

import { prisma } from '../server/lib/prisma';

export interface OAuthClient {
  id: string;
  client_id: string;
  client_secret_hash: string;
  name: string;
  description?: string;
  redirect_uris: string[];
  client_type: string;
  grant_types: string[];
  allowed_scopes: string[];
  require_pkce: boolean;
  require_consent: boolean;
  first_party: boolean;
  application_id?: string;
  created_by?: string;
  logo_url?: string;
  homepage_url?: string;
  access_token_lifetime?: number;
  refresh_token_lifetime?: number;
  privacy_policy_url?: string;
  terms_of_service_url?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateClientData {
  name: string;
  description?: string;
  redirect_uris: string[];
  client_type: string;
  grant_types: string[];
  allowed_scopes: string[];
  require_pkce: boolean;
  require_consent: boolean;
  first_party: boolean;
  application_id?: string;
  created_by?: string;
  logo_url?: string;
  homepage_url?: string;
}

class SSOProviderService {
  async createClient(data: CreateClientData): Promise<{ client: OAuthClient }> {
    try {
      // Generate client ID and secret
      const client_id = this.generateClientId();
      const client_secret = this.generateClientSecret();
      const client_secret_hash = await this.hashSecret(client_secret);

      // Create the client in database using raw query
      const result = await prisma.$queryRaw<any[]>`
        INSERT INTO admin.oauth_clients (
          client_id, client_secret_hash, name, description, redirect_uris,
          client_type, grant_types, allowed_scopes, require_pkce, require_consent,
          first_party, application_id, created_by, logo_url, homepage_url,
          created_at, updated_at
        )
        VALUES (
          ${client_id}, ${client_secret_hash}, ${data.name}, ${data.description}, 
          ${JSON.stringify(data.redirect_uris)}::jsonb, ${data.client_type}, 
          ${JSON.stringify(data.grant_types)}::jsonb, ${JSON.stringify(data.allowed_scopes)}::jsonb,
          ${data.require_pkce}, ${data.require_consent}, ${data.first_party},
          ${data.application_id || null}::uuid, ${data.created_by || null}::uuid,
          ${data.logo_url || null}, ${data.homepage_url || null}, NOW(), NOW()
        )
        RETURNING *
      `;

      const client = result[0];

      return { client: { ...client, client_secret } };
    } catch (error) {
      console.error('Error creating OAuth client:', error);
      throw new Error('Failed to create OAuth client');
    }
  }

  async revokeUserConsent(userId: string, clientId: string): Promise<void> {
    try {
      // Delete user consent records for this client
      await prisma.$executeRaw`
        DELETE FROM admin.oauth_user_consents 
        WHERE user_id = ${userId}::uuid AND client_id = ${clientId}::uuid
      `;

      // Revoke any active tokens for this user and client
      await prisma.$executeRaw`
        DELETE FROM admin.oauth_access_tokens 
        WHERE user_id = ${userId}::uuid AND client_id = ${clientId}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM admin.oauth_refresh_tokens 
        WHERE user_id = ${userId}::uuid AND client_id = ${clientId}::uuid
      `;
    } catch (error) {
      console.error('Error revoking user consent:', error);
      throw new Error('Failed to revoke user consent');
    }
  }

  private generateClientId(): string {
    // Generate a random client ID
    return 'client_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateClientSecret(): string {
    // Generate a random client secret
    return Math.random().toString(36).substring(2, 32) + Math.random().toString(36).substring(2, 32);
  }

  private async hashSecret(secret: string): Promise<string> {
    // In a real implementation, you would use a proper hashing algorithm like bcrypt
    // For now, we'll use a simple hash (in production, use bcrypt or similar)
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(secret).digest('hex');
  }
}

export default new SSOProviderService();
