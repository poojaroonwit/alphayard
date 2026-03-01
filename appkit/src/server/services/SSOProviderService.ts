/**
 * SSO Provider Service
 * 
 * Handles OAuth provider operations for the AppKit SSO system.
 */

import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Helper function to load RSA keys with env/file path support.
// Priority: inline env PEM -> explicit path -> default path -> mounted secrets.
const loadKey = (
  envKey?: string,
  envPath?: string,
  defaultPath: string = '',
  fallbackSecretPaths: string[] = []
): string => {
  if (envKey && envKey.trim()) return envKey.replace(/\\n/g, '\n');

  const candidatePaths = [
    envPath || defaultPath,
    ...fallbackSecretPaths
  ].filter(Boolean);

  for (const candidate of candidatePaths) {
    const keyPath = path.isAbsolute(candidate) ? candidate : path.resolve(process.cwd(), candidate);
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf8');
    }
  }

  const attempted = candidatePaths.join(', ');
  console.warn(`Warning: RSA key not found. Tried: ${attempted || 'no paths configured'}. OIDC will fail.`);
  return '';
};

const PRIVATE_KEY = loadKey(
  config.OIDC_PRIVATE_KEY,
  config.OIDC_PRIVATE_KEY_PATH,
  '/app/secrets/oidc/private.key',
  [
    '/run/secrets/oidc_private_key',
    '/run/secrets/oidc-private-key',
    '/run/secrets/private.key',
    '/app/secrets/oidc/private.key',
    '/app/secrets/private.key'
  ]
);
const PUBLIC_KEY = loadKey(
  config.OIDC_PUBLIC_KEY,
  config.OIDC_PUBLIC_KEY_PATH,
  '/app/secrets/oidc/public.key',
  [
    '/run/secrets/oidc_public_key',
    '/run/secrets/oidc-public-key',
    '/run/secrets/public.key',
    '/app/secrets/oidc/public.key',
    '/app/secrets/public.key'
  ]
);

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
  private getSigningKey(): string {
    if (!PRIVATE_KEY || !PRIVATE_KEY.trim()) {
      throw new Error(
        'OIDC_PRIVATE_KEY is not configured. Set OIDC_PRIVATE_KEY or OIDC_PRIVATE_KEY_PATH to enable OAuth token signing.'
      );
    }
    return PRIVATE_KEY;
  }

  private getVerificationKey(): string {
    if (!PUBLIC_KEY || !PUBLIC_KEY.trim()) {
      throw new Error(
        'OIDC_PUBLIC_KEY is not configured. Set OIDC_PUBLIC_KEY or OIDC_PUBLIC_KEY_PATH to enable token verification/JWKS.'
      );
    }
    return PUBLIC_KEY;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  private async resolveClientRecord(clientIdentifier: string): Promise<any | null> {
    const cleanClientId = clientIdentifier.trim();
    const isValidUuid = this.isUuid(cleanClientId);
    let result: any[] = [];

    if (isValidUuid) {
      result = await prisma.$queryRaw<any[]>`
        SELECT * FROM oauth_clients
        WHERE id = ${cleanClientId}::uuid AND is_active = true
      `;
    }

    if (result.length === 0) {
      result = await prisma.$queryRaw<any[]>`
        SELECT * FROM oauth_clients
        WHERE client_id = ${cleanClientId} AND is_active = true
      `;
    }

    if (result.length === 0 && isValidUuid) {
      result = await prisma.$queryRaw<any[]>`
        SELECT * FROM oauth_clients
        WHERE application_id = ${cleanClientId}::uuid AND is_active = true
        LIMIT 1
      `;
    }

    return result.length > 0 ? result[0] : null;
  }

  async createClient(data: CreateClientData): Promise<{ client: OAuthClient; client_secret: string }> {
    try {
      // Generate client ID and secret
      const client_id = this.generateClientId();
      const client_secret = this.generateClientSecret();
      const client_secret_hash = await this.hashSecret(client_secret);

      // Create the client in database using raw query
      const result = await prisma.$queryRaw<any[]>`
        INSERT INTO oauth_clients (
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
      return { client, client_secret };
    } catch (error) {
      console.error('Error creating OAuth client:', error);
      throw new Error('Failed to create OAuth client');
    }
  }

  async revokeUserConsent(userId: string, clientId: string): Promise<void> {
    try {
      const client = await this.resolveClientRecord(clientId);
      if (!client) {
        throw new Error('Invalid client ID');
      }

      // Delete user consent records for this client
      await prisma.$executeRaw`
        DELETE FROM oauth_user_consents 
        WHERE user_id = ${userId}::uuid AND client_id = ${client.id}::uuid
      `;

      // Revoke any active tokens for this user and client
      await prisma.$executeRaw`
        DELETE FROM oauth_access_tokens 
        WHERE user_id = ${userId}::uuid AND client_id = ${client.id}::uuid
      `;

      await prisma.$executeRaw`
        DELETE FROM oauth_refresh_tokens 
        WHERE user_id = ${userId}::uuid AND client_id = ${client.id}::uuid
      `;
    } catch (error) {
      console.error('Error revoking user consent:', error);
      throw new Error('Failed to revoke user consent');
    }
  }

  async validateClient(clientId: string, redirectUri: string): Promise<OAuthClient> {
    try {
      const client = await this.resolveClientRecord(clientId);
      if (!client) {
        console.error(`[SSOProviderService] Client not found for ID: ${clientId}`);
        throw new Error('Invalid client ID');
      }

      const redirectUris = typeof client.redirect_uris === 'string' 
        ? JSON.parse(client.redirect_uris) 
        : client.redirect_uris;

      if (!redirectUris.includes(redirectUri)) {
        throw new Error('Invalid redirect URI');
      }

      return client;
    } catch (error: any) {
      console.error('Error validating OAuth client:', error);
      throw new Error(error.message || 'Failed to validate OAuth client');
    }
  }

  async validateClientForRevocation(clientId: string, clientSecret?: string | null): Promise<any> {
    const client = await this.resolveClientRecord(clientId);
    if (!client) {
      throw new Error('Invalid client ID');
    }

    if (client.client_type === 'confidential') {
      if (!clientSecret) {
        throw new Error('Client secret required');
      }
      const isMatch = await this.verifySecret(clientSecret, client.client_secret_hash);
      if (!isMatch) {
        throw new Error('Invalid client secret');
      }
    }

    return client;
  }

  async createAuthorizationCode(
    clientId: string,
    userId: string,
    redirectUri: string,
    scope?: string,
    state?: string,
    nonce?: string,
    codeChallenge?: string,
    codeChallengeMethod?: string
  ): Promise<string> {
    try {
      const code = crypto.randomBytes(32).toString('hex');
      const code_hash = crypto.createHash('sha256').update(code).digest('hex');
      const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.$executeRaw`
        INSERT INTO oauth_authorization_codes (
          code_hash, client_id, user_id, redirect_uri, scope, state, nonce,
          code_challenge, code_challenge_method, expires_at, created_at
        )
        VALUES (
          ${code_hash}, ${clientId}::uuid, ${userId}::uuid, ${redirectUri}, 
          ${scope || null}, ${state || null}, ${nonce || null},
          ${codeChallenge || null}, ${codeChallengeMethod || null}, 
          ${expires_at}, NOW()
        )
      `;

      return code;
    } catch (error) {
      console.error('Error creating authorization code:', error);
      throw new Error('Failed to create authorization code');
    }
  }

  async exchangeCodeForToken(
    clientId: string,
    clientSecret: string | null,
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<any> {
    try {
      const code_hash = crypto.createHash('sha256').update(code).digest('hex');
      
      const codeResult = await prisma.$queryRaw<any[]>`
        SELECT * FROM oauth_authorization_codes 
        WHERE code_hash = ${code_hash} AND used_at IS NULL AND expires_at > NOW()
      `;

      if (codeResult.length === 0) {
        throw new Error('Invalid or expired authorization code');
      }

      const authCode = codeResult[0];

      // Get client for verification
      const clientResult = await prisma.$queryRaw<any[]>`
        SELECT * FROM oauth_clients WHERE id = ${authCode.client_id}::uuid AND is_active = true
      `;
      if (clientResult.length === 0) {
        throw new Error('Invalid client ID');
      }
      const client = clientResult[0];

      const providedClientId = clientId.trim();
      if (!this.isMatchingClientIdentifier(providedClientId, client)) {
        throw new Error('Client mismatch for authorization code');
      }

      if (!redirectUri || redirectUri !== authCode.redirect_uri) {
        throw new Error('Invalid redirect URI');
      }

      const hasPkceChallenge = Boolean(authCode.code_challenge);

      // Verify PKCE if required / present on the authorization code
      if (client.require_pkce || hasPkceChallenge) {
        if (!codeVerifier) throw new Error('Code verifier required for PKCE');
        
        let challenge;
        if (authCode.code_challenge_method === 'S256') {
          challenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
        } else {
          challenge = codeVerifier; // Plain
        }

        if (challenge !== authCode.code_challenge) {
          throw new Error('Invalid code verifier');
        }
      }

      // Verify client secret for confidential clients.
      // If a PKCE challenge was used for this code, allow secretless exchange
      // to support public/mobile callback handlers that cannot safely store secrets.
      if (client.client_type === 'confidential') {
        if (clientSecret) {
          const isMatch = await this.verifySecret(clientSecret, client.client_secret_hash);
          if (!isMatch) {
            throw new Error('Invalid client secret');
          }
        } else if (!hasPkceChallenge) {
          throw new Error('Client secret required');
        }
      }

      // Mark code as used only after all validations pass.
      const markUsedResult = await prisma.$executeRaw`
        UPDATE oauth_authorization_codes
        SET used_at = NOW()
        WHERE id = ${authCode.id}::uuid AND used_at IS NULL
      `;
      if (Number(markUsedResult) === 0) {
        throw new Error('Authorization code already used');
      }

      return {
        userId: authCode.user_id,
        clientId: client.id,
        clientPublicId: client.client_id,
        scope: authCode.scope
      };
    } catch (error: any) {
      console.error('Error exchanging code for token:', error);
      throw new Error(error.message || 'Failed to exchange code');
    }
  }

  async generateAccessToken(userId: string, clientId: string, scope?: string, clientPublicId?: string): Promise<string> {
    const tokenId = crypto.randomBytes(32).toString('hex');
    const tokenIdHash = crypto.createHash('sha256').update(tokenId).digest('hex');
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour
    let internalClientId = clientId;
    let resolvedClientPublicId = clientPublicId;

    // Defensive: accept either internal UUID or public client_id from callers.
    if (!this.isUuid(internalClientId)) {
      const resolved = await this.resolveClientRecord(internalClientId);
      if (!resolved) {
        throw new Error('Invalid client ID');
      }
      internalClientId = resolved.id;
      if (!resolvedClientPublicId) {
        resolvedClientPublicId = resolved.client_id;
      }
    }

    await prisma.$executeRaw`
      INSERT INTO oauth_access_tokens (
        token_id_hash, client_id, user_id, scope, expires_at, created_at
      )
      VALUES (
        ${tokenIdHash}, ${internalClientId}::uuid, ${userId}::uuid, ${scope || null}, ${expiresAt}, NOW()
      )
    `;

    const signingKey = this.getSigningKey();
    return jwt.sign(
      {
        jti: tokenId,
        sub: userId,
        client_id: resolvedClientPublicId || internalClientId,
        scope: scope,
        type: 'access_token'
      },
      signingKey,
      { algorithm: 'RS256', expiresIn: '1h' }
    );
  }

  async revokeToken(token: string, tokenTypeHint?: string): Promise<void> {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.jti) {
        // If we can't decode it, it might be a refresh token or opaque token in the future
        // For now, our tokens are JWTs with JTI
        throw new Error('Invalid token');
      }

      const tokenIdHash = crypto.createHash('sha256').update(decoded.jti).digest('hex');

      await prisma.$executeRaw`
        UPDATE oauth_access_tokens 
        SET is_revoked = true 
        WHERE token_id_hash = ${tokenIdHash}
      `;
    } catch (error) {
      console.error('Error revoking token:', error);
      throw new Error('Failed to revoke token');
    }
  }

  async getJwks(): Promise<any> {
    // In a real implementation, you'd use a library like 'pem-jwk'
    // For now, we'll provide a simplified JWK structure if possible, 
    // or just the keys for the user to see we have them.
    // Standard OIDC requires JWKS.
    
    // Extract modulus and exponent from public key (simplified)
    const verificationKey = this.getVerificationKey();
    const pubKeyObj = crypto.createPublicKey(verificationKey);
    const jwk = pubKeyObj.export({ format: 'jwk' });

    return {
      keys: [
        {
          ...jwk,
          kid: 'appkit-main-key',
          use: 'sig',
          alg: 'RS256'
        }
      ]
    };
  }

  async validateAccessToken(token: string): Promise<any> {
    try {
      const verificationKey = this.getVerificationKey();
      const decoded = jwt.verify(token, verificationKey, { algorithms: ['RS256'] }) as any;
      if (decoded.type !== 'access_token') {
        throw new Error('Invalid token type');
      }

      const tokenIdHash = crypto.createHash('sha256').update(decoded.jti).digest('hex');
      
      const tokenResult = await prisma.$queryRaw<any[]>`
        SELECT * FROM oauth_access_tokens 
        WHERE token_id_hash = ${tokenIdHash} AND is_revoked = false AND expires_at > NOW()
      `;

      if (tokenResult.length === 0) {
        throw new Error('Token is invalid or revoked');
      }

      return decoded;
    } catch (error: any) {
      console.error('Error validating access token:', error);
      throw new Error(error.message || 'Failed to validate token');
    }
  }

  async generateIdToken(userId: string, clientId: string, nonce?: string): Promise<string> {
    // Get user details
    const adminUser = await prisma.adminUser.findUnique({ where: { id: userId } });
    const user = adminUser ? null : await prisma.user.findUnique({ where: { id: userId } });

    const name = adminUser ? adminUser.name : (user ? `${user.firstName} ${user.lastName}` : '');
    const email = adminUser ? adminUser.email : (user ? user.email : '');

    const signingKey = this.getSigningKey();
    return jwt.sign(
      {
        iss: process.env.NEXT_PUBLIC_SITE_URL || 'https://appkits.up.railway.app',
        sub: userId,
        aud: clientId,
        nonce: nonce,
        name: name,
        email: email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (1 * 60 * 60) // 1 hour
      },
      signingKey,
      { algorithm: 'RS256', keyid: 'appkit-main-key' }
    );
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
    // Upgraded to bcrypt for better security
    // We check if it's already a hash or needs hashing
    return bcrypt.hash(secret, 10);
  }

  async verifySecret(secret: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(secret, hashed);
  }

  private isMatchingClientIdentifier(inputClientId: string, client: any): boolean {
    if (!inputClientId || !client) return false;

    if (inputClientId === client.client_id) return true;
    if (inputClientId === client.id) return true;
    if (client.application_id && inputClientId === client.application_id) return true;

    return false;
  }
}

export default new SSOProviderService();
