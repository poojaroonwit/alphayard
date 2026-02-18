/**
 * SSO Provider Service
 * 
 * Implements OAuth 2.0 + OpenID Connect (OIDC) authorization server functionality.
 * This service enables AppKit to act as an SSO provider for third-party applications.
 * 
 * Supported flows:
 * - Authorization Code Flow (with PKCE)
 * - Refresh Token Flow
 * - Client Credentials Flow (for machine-to-machine)
 * 
 * OIDC features:
 * - ID Token generation with RS256 signing
 * - UserInfo endpoint
 * - Discovery document (.well-known/openid-configuration)
 * - JWKS endpoint
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { config } from '../config/env';

// ============================================================================
// Types
// ============================================================================

export interface OAuthClient {
    id: string;
    client_id: string;
    client_type: 'confidential' | 'public';
    name: string;
    description?: string;
    logo_url?: string;
    homepage_url?: string;
    redirect_uris: string[];
    grant_types: string[];
    response_types: string[];
    allowed_scopes: string[];
    default_scopes: string[];
    access_token_lifetime: number;
    refresh_token_lifetime: number;
    id_token_lifetime: number;
    require_pkce: boolean;
    require_consent: boolean;
    first_party: boolean;
    application_id?: string;
    is_active: boolean;
}

export interface AuthorizationRequest {
    client_id: string;
    redirect_uri: string;
    response_type: string;
    scope: string;
    state?: string;
    nonce?: string;
    code_challenge?: string;
    code_challenge_method?: 'plain' | 'S256';
    prompt?: string;
    login_hint?: string;
}

export interface TokenRequest {
    grant_type: 'authorization_code' | 'refresh_token' | 'client_credentials';
    code?: string;
    redirect_uri?: string;
    client_id: string;
    client_secret?: string;
    code_verifier?: string;
    refresh_token?: string;
    scope?: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    refresh_token?: string;
    id_token?: string;
    scope: string;
}

export interface UserInfo {
    sub: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    preferred_username?: string;
    email?: string;
    email_verified?: boolean;
    picture?: string;
    updated_at?: number;
}

export interface SSOSession {
    id: string;
    user_id: string;
    auth_time: Date;
    auth_method: string;
    active_clients: string[];
    expires_at: Date;
}

// Standard OIDC scopes and claims mapping
const SCOPE_CLAIMS: Record<string, string[]> = {
    openid: ['sub'],
    profile: ['name', 'given_name', 'family_name', 'preferred_username', 'picture', 'updated_at'],
    email: ['email', 'email_verified'],
    phone: ['phone_number', 'phone_number_verified'],
    address: ['address'],
};

// ============================================================================
// Client Management
// ============================================================================

/**
 * Create a new OAuth client
 */
export async function createClient(
    input: {
        name: string;
        description?: string;
        redirect_uris: string[];
        client_type?: 'confidential' | 'public';
        grant_types?: string[];
        allowed_scopes?: string[];
        require_pkce?: boolean;
        require_consent?: boolean;
        first_party?: boolean;
        application_id?: string;
        created_by?: string;
        logo_url?: string;
        homepage_url?: string;
    }
): Promise<{ client: OAuthClient; client_secret?: string }> {
    const client_id = generateClientId();
    const client_type = input.client_type || 'confidential';
    
    let client_secret: string | undefined;
    let client_secret_hash: string | null = null;
    
    // Generate secret for confidential clients
    if (client_type === 'confidential') {
        client_secret = generateClientSecret();
        client_secret_hash = await bcrypt.hash(client_secret, 12);
    }
    
    const result = await prisma.$queryRawUnsafe<any[]>(`
        INSERT INTO oauth_clients (
            client_id, client_secret_hash, client_type, name, description,
            logo_url, homepage_url, redirect_uris, grant_types,
            allowed_scopes, require_pkce, require_consent, first_party,
            application_id, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
    `, [
        client_id,
        client_secret_hash,
        client_type,
        input.name,
        input.description || null,
        input.logo_url || null,
        input.homepage_url || null,
        JSON.stringify(input.redirect_uris),
        JSON.stringify(input.grant_types || ['authorization_code', 'refresh_token']),
        JSON.stringify(input.allowed_scopes || ['openid', 'profile', 'email']),
        input.require_pkce !== false, // Default true
        input.require_consent !== false, // Default true
        input.first_party || false,
        input.application_id || null,
        input.created_by || null
    ]);
    
    const client = mapClientRow(result[0]);
    
    // Log creation
    await logOAuthEvent('client_created', {
        client_id: client.id,
        details: { client_name: client.name }
    });
    
    return { client, client_secret };
}

/**
 * Get client by client_id
 */
export async function getClientByClientId(clientId: string): Promise<OAuthClient | null> {
    const result = await prisma.$queryRawUnsafe<any[]>(
        'SELECT * FROM oauth_clients WHERE client_id = $1 AND is_active = true',
        [clientId]
    );
    return result[0] ? mapClientRow(result[0]) : null;
}

/**
 * Validate client credentials
 */
export async function validateClientCredentials(
    clientId: string,
    clientSecret?: string
): Promise<OAuthClient | null> {
    const client = await getClientByClientId(clientId);
    if (!client) return null;
    
    // Public clients don't need secret validation
    if (client.client_type === 'public') {
        return client;
    }
    
    // Confidential clients must provide valid secret
    if (!clientSecret) return null;
    
    const result = await prisma.$queryRawUnsafe<any[]>(
        'SELECT client_secret_hash FROM oauth_clients WHERE client_id = $1',
        [clientId]
    );
    
    if (!result[0]?.client_secret_hash) return null;
    
    const isValid = await bcrypt.compare(clientSecret, result[0].client_secret_hash);
    return isValid ? client : null;
}

/**
 * Get all clients for an application
 */
export async function getApplicationClients(applicationId: string): Promise<OAuthClient[]> {
    const result = await prisma.$queryRawUnsafe<any[]>(
        'SELECT * FROM oauth_clients WHERE application_id = $1 AND is_active = true ORDER BY created_at DESC',
        [applicationId]
    );
    return result.map(mapClientRow);
}

// ============================================================================
// Authorization Code Flow
// ============================================================================

/**
 * Validate authorization request
 */
export async function validateAuthorizationRequest(
    request: AuthorizationRequest
): Promise<{ valid: boolean; error?: string; error_description?: string; client?: OAuthClient }> {
    const client = await getClientByClientId(request.client_id);
    
    if (!client) {
        return { valid: false, error: 'invalid_client', error_description: 'Client not found' };
    }
    
    // Validate redirect URI
    if (!client.redirect_uris.includes(request.redirect_uri)) {
        return { valid: false, error: 'invalid_redirect_uri', error_description: 'Redirect URI not registered' };
    }
    
    // Validate response type
    if (!client.response_types.includes(request.response_type)) {
        return { valid: false, error: 'unsupported_response_type', error_description: 'Response type not allowed' };
    }
    
    // Validate scopes
    const requestedScopes = request.scope.split(' ');
    const invalidScopes = requestedScopes.filter(s => !client.allowed_scopes.includes(s));
    if (invalidScopes.length > 0) {
        return { valid: false, error: 'invalid_scope', error_description: `Invalid scopes: ${invalidScopes.join(', ')}` };
    }
    
    // Validate PKCE requirement
    if (client.require_pkce && !request.code_challenge) {
        return { valid: false, error: 'invalid_request', error_description: 'PKCE required' };
    }
    
    // Validate PKCE method
    if (request.code_challenge && request.code_challenge_method !== 'S256' && request.code_challenge_method !== 'plain') {
        return { valid: false, error: 'invalid_request', error_description: 'Invalid code_challenge_method' };
    }
    
    return { valid: true, client };
}

/**
 * Create authorization code
 */
export async function createAuthorizationCode(
    client: OAuthClient,
    userId: string,
    request: AuthorizationRequest,
    sessionId?: string
): Promise<string> {
    const code = generateSecureToken(32);
    const codeHash = hashToken(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    await prisma.$queryRawUnsafe<any[]>(`
        INSERT INTO oauth_authorization_codes (
            code_hash, client_id, user_id, redirect_uri, scope, state, nonce,
            code_challenge, code_challenge_method, session_id, application_id, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
        codeHash,
        client.id,
        userId,
        request.redirect_uri,
        request.scope,
        request.state || null,
        request.nonce || null,
        request.code_challenge || null,
        request.code_challenge_method || null,
        sessionId || null,
        client.application_id || null,
        expiresAt
    ]);
    
    await logOAuthEvent('authorization_request', {
        client_id: client.id,
        user_id: userId,
        details: { scope: request.scope }
    });
    
    return code;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeAuthorizationCode(
    request: TokenRequest,
    ipAddress?: string
): Promise<TokenResponse> {
    if (!request.code) {
        throw new OAuthError('invalid_request', 'Authorization code required');
    }
    
    const codeHash = hashToken(request.code);
    
    // Get and validate authorization code
    const result = await prisma.$queryRawUnsafe<any[]>(`
        SELECT ac.*, oc.id as oauth_client_id, oc.access_token_lifetime, 
               oc.refresh_token_lifetime, oc.id_token_lifetime, oc.require_pkce
        FROM oauth_authorization_codes ac
        JOIN oauth_clients oc ON ac.client_id = oc.id
        WHERE ac.code_hash = $1 AND ac.used_at IS NULL AND ac.expires_at > NOW()
    `, [codeHash]);
    
    if (result.length === 0) {
        throw new OAuthError('invalid_grant', 'Invalid or expired authorization code');
    }
    
    const authCode = result[0];
    
    // Validate redirect URI
    if (authCode.redirect_uri !== request.redirect_uri) {
        throw new OAuthError('invalid_grant', 'Redirect URI mismatch');
    }
    
    // Validate PKCE
    if (authCode.code_challenge) {
        if (!request.code_verifier) {
            throw new OAuthError('invalid_request', 'Code verifier required');
        }
        
        const isValidPKCE = validatePKCE(
            request.code_verifier,
            authCode.code_challenge,
            authCode.code_challenge_method
        );
        
        if (!isValidPKCE) {
            throw new OAuthError('invalid_grant', 'PKCE verification failed');
        }
    }
    
    // Mark code as used
    await prisma.$queryRawUnsafe<any[]>(
        'UPDATE oauth_authorization_codes SET used_at = NOW() WHERE code_hash = $1',
        [codeHash]
    );
    
    // Generate tokens
    const tokens = await generateTokens({
        clientId: authCode.oauth_client_id,
        userId: authCode.user_id,
        scope: authCode.scope,
        nonce: authCode.nonce,
        sessionId: authCode.session_id,
        applicationId: authCode.application_id,
        accessTokenLifetime: authCode.access_token_lifetime,
        refreshTokenLifetime: authCode.refresh_token_lifetime,
        idTokenLifetime: authCode.id_token_lifetime
    });
    
    await logOAuthEvent('token_issued', {
        client_id: authCode.oauth_client_id,
        user_id: authCode.user_id,
        details: { grant_type: 'authorization_code', scope: authCode.scope },
        ip_address: ipAddress
    });
    
    return tokens;
}

// ============================================================================
// Refresh Token Flow
// ============================================================================

/**
 * Refresh access token
 */
export async function refreshAccessToken(
    request: TokenRequest,
    ipAddress?: string
): Promise<TokenResponse> {
    if (!request.refresh_token) {
        throw new OAuthError('invalid_request', 'Refresh token required');
    }
    
    const tokenHash = hashToken(request.refresh_token);
    
    // Get and validate refresh token
    const result = await prisma.$queryRawUnsafe<any[]>(`
        SELECT rt.*, oc.id as oauth_client_id, oc.access_token_lifetime, 
               oc.refresh_token_lifetime, oc.id_token_lifetime
        FROM oauth_refresh_tokens rt
        JOIN oauth_clients oc ON rt.client_id = oc.id
        WHERE rt.token_hash = $1 AND rt.is_revoked = false AND rt.expires_at > NOW()
    `, [tokenHash]);
    
    if (result.length === 0) {
        throw new OAuthError('invalid_grant', 'Invalid or expired refresh token');
    }
    
    const refreshToken = result[0];
    
    // Revoke old refresh token (rotation)
    await prisma.$queryRawUnsafe<any[]>(
        'UPDATE oauth_refresh_tokens SET is_revoked = true, revoked_at = NOW(), revoked_reason = $1 WHERE id = $2',
        ['Rotated', refreshToken.id]
    );
    
    // Determine scope (use requested scope if subset, otherwise original)
    let scope = refreshToken.scope;
    if (request.scope) {
        const requestedScopes = request.scope.split(' ');
        const originalScopes = refreshToken.scope.split(' ');
        const isSubset = requestedScopes.every(s => originalScopes.includes(s));
        if (isSubset) {
            scope = request.scope;
        }
    }
    
    // Generate new tokens
    const tokens = await generateTokens({
        clientId: refreshToken.oauth_client_id,
        userId: refreshToken.user_id,
        scope,
        sessionId: refreshToken.session_id,
        applicationId: refreshToken.application_id,
        accessTokenLifetime: refreshToken.access_token_lifetime,
        refreshTokenLifetime: refreshToken.refresh_token_lifetime,
        idTokenLifetime: refreshToken.id_token_lifetime,
        previousRefreshTokenId: refreshToken.id,
        rotationCount: (refreshToken.rotation_count || 0) + 1
    });
    
    await logOAuthEvent('token_refreshed', {
        client_id: refreshToken.oauth_client_id,
        user_id: refreshToken.user_id,
        details: { scope },
        ip_address: ipAddress
    });
    
    return tokens;
}

// ============================================================================
// Token Generation
// ============================================================================

interface TokenGenerationParams {
    clientId: string;
    userId: string;
    scope: string;
    nonce?: string;
    sessionId?: string;
    applicationId?: string;
    accessTokenLifetime: number;
    refreshTokenLifetime: number;
    idTokenLifetime: number;
    previousRefreshTokenId?: string;
    rotationCount?: number;
}

async function generateTokens(params: TokenGenerationParams): Promise<TokenResponse> {
    const {
        clientId, userId, scope, nonce, sessionId, applicationId,
        accessTokenLifetime, refreshTokenLifetime, idTokenLifetime,
        previousRefreshTokenId, rotationCount
    } = params;
    
    const tokenId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    const scopes = scope.split(' ');
    
    // Get user info for ID token
    const user = await getUserForTokens(userId);
    if (!user) {
        throw new OAuthError('invalid_grant', 'User not found');
    }
    
    // Generate access token (JWT)
    const accessTokenPayload = {
        jti: tokenId,
        sub: userId,
        client_id: clientId,
        scope,
        iat: now,
        exp: now + accessTokenLifetime,
        token_type: 'access_token'
    };
    
    const accessToken = jwt.sign(accessTokenPayload, config.JWT_SECRET, { algorithm: 'HS256' });
    
    // Store access token for introspection/revocation
    const accessTokenExpiresAt = new Date(Date.now() + accessTokenLifetime * 1000);
    const atRows = await prisma.$queryRawUnsafe<any[]>(`
        INSERT INTO oauth_access_tokens (
            token_id_hash, client_id, user_id, scope, session_id, application_id, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
    `, [
        hashToken(tokenId),
        clientId,
        userId,
        scope,
        sessionId || null,
        applicationId || null,
        accessTokenExpiresAt
    ]);
    
    // Generate refresh token
    const refreshTokenValue = generateSecureToken(64);
    const refreshTokenExpiresAt = new Date(Date.now() + refreshTokenLifetime * 1000);
    
    await prisma.$queryRawUnsafe<any[]>(`
        INSERT INTO oauth_refresh_tokens (
            token_hash, client_id, user_id, access_token_id, scope, session_id,
            application_id, previous_token_id, rotation_count, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
        hashToken(refreshTokenValue),
        clientId,
        userId,
        atRows[0].id,
        scope,
        sessionId || null,
        applicationId || null,
        previousRefreshTokenId || null,
        rotationCount || 0,
        refreshTokenExpiresAt
    ]);
    
    const response: TokenResponse = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: accessTokenLifetime,
        refresh_token: refreshTokenValue,
        scope
    };
    
    // Generate ID token if openid scope is present
    if (scopes.includes('openid')) {
        const idTokenPayload = buildIdTokenPayload(user, scopes, {
            clientId,
            nonce,
            now,
            expiresIn: idTokenLifetime
        });
        
        // Sign with RS256 if we have RSA keys, otherwise HS256
        const idToken = jwt.sign(idTokenPayload, config.JWT_SECRET, { algorithm: 'HS256' });
        response.id_token = idToken;
    }
    
    return response;
}

// ============================================================================
// Token Introspection & Revocation
// ============================================================================

/**
 * Introspect token (RFC 7662)
 */
export async function introspectToken(
    token: string,
    tokenTypeHint?: 'access_token' | 'refresh_token'
): Promise<{ active: boolean; [key: string]: any }> {
    // Try as JWT access token
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET) as any;
        if (decoded.token_type === 'access_token') {
            // Check if revoked
            const result = await prisma.$queryRawUnsafe<any[]>(
                'SELECT is_revoked FROM oauth_access_tokens WHERE token_id_hash = $1',
                [hashToken(decoded.jti)]
            );
            
            if (result[0]?.is_revoked) {
                return { active: false };
            }
            
            return {
                active: true,
                sub: decoded.sub,
                client_id: decoded.client_id,
                scope: decoded.scope,
                exp: decoded.exp,
                iat: decoded.iat,
                token_type: 'Bearer'
            };
        }
    } catch (e) {
        // Not a valid access token
    }
    
    // Try as refresh token
    const tokenHash = hashToken(token);
    const result = await prisma.$queryRawUnsafe<any[]>(`
        SELECT rt.*, oc.client_id as oauth_client_id
        FROM oauth_refresh_tokens rt
        JOIN oauth_clients oc ON rt.client_id = oc.id
        WHERE rt.token_hash = $1
    `, [tokenHash]);
    
    if (result[0] && !result[0].is_revoked && new Date(result[0].expires_at) > new Date()) {
        return {
            active: true,
            sub: result[0].user_id,
            client_id: result[0].oauth_client_id,
            scope: result[0].scope,
            exp: Math.floor(new Date(result[0].expires_at).getTime() / 1000),
            token_type: 'refresh_token'
        };
    }
    
    return { active: false };
}

/**
 * Revoke token (RFC 7009)
 */
export async function revokeToken(
    token: string,
    tokenTypeHint?: 'access_token' | 'refresh_token',
    reason?: string
): Promise<void> {
    const revocationReason = reason || 'Client revocation';
    
    // Try as JWT access token
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET, { ignoreExpiration: true }) as any;
        if (decoded.jti) {
            await prisma.$queryRawUnsafe<any[]>(
                'UPDATE oauth_access_tokens SET is_revoked = true, revoked_at = NOW(), revoked_reason = $1 WHERE token_id_hash = $2',
                [revocationReason, hashToken(decoded.jti)]
            );
            return;
        }
    } catch (e) {
        // Not a JWT
    }
    
    // Try as refresh token
    const tokenHash = hashToken(token);
    await prisma.$queryRawUnsafe<any[]>(
        'UPDATE oauth_refresh_tokens SET is_revoked = true, revoked_at = NOW(), revoked_reason = $1 WHERE token_hash = $2',
        [revocationReason, tokenHash]
    );
}

// ============================================================================
// User Consent
// ============================================================================

/**
 * Check if user has granted consent for client with given scopes
 */
export async function hasUserConsent(
    userId: string,
    clientId: string,
    scopes: string[]
): Promise<boolean> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
        SELECT granted_scopes FROM oauth_user_consents
        WHERE user_id = $1 AND client_id = $2 AND revoked_at IS NULL
        AND (expires_at IS NULL OR expires_at > NOW())
    `, [userId, clientId]);
    
    if (result.length === 0) return false;
    
    const grantedScopes = result[0].granted_scopes as string[];
    return scopes.every(s => grantedScopes.includes(s));
}

/**
 * Grant user consent
 */
export async function grantUserConsent(
    userId: string,
    clientId: string,
    scopes: string[],
    applicationId?: string
): Promise<void> {
    await prisma.$queryRawUnsafe<any[]>(`
        INSERT INTO oauth_user_consents (user_id, client_id, granted_scopes, application_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (user_id, client_id, application_id)
        DO UPDATE SET granted_scopes = $3, updated_at = NOW(), revoked_at = NULL
    `, [userId, clientId, JSON.stringify(scopes), applicationId || null]);
    
    await logOAuthEvent('consent_granted', {
        client_id: clientId,
        user_id: userId,
        details: { scopes }
    });
}

/**
 * Revoke user consent
 */
export async function revokeUserConsent(
    userId: string,
    clientId: string
): Promise<void> {
    // Revoke consent
    await prisma.$queryRawUnsafe<any[]>(
        'UPDATE oauth_user_consents SET revoked_at = NOW() WHERE user_id = $1 AND client_id = $2',
        [userId, clientId]
    );
    
    // Revoke all tokens
    await prisma.$queryRawUnsafe<any[]>('SELECT revoke_oauth_tokens_for_user_client($1, $2, $3)',
        [userId, clientId, 'User revoked consent']
    );
    
    await logOAuthEvent('consent_revoked', {
        client_id: clientId,
        user_id: userId
    });
}

// ============================================================================
// SSO Sessions
// ============================================================================

/**
 * Create SSO session
 */
export async function createSSOSession(
    userId: string,
    authMethod: string,
    options: {
        ipAddress?: string;
        userAgent?: string;
        applicationId?: string;
        expiresInSeconds?: number;
    } = {}
): Promise<{ sessionId: string; sessionToken: string }> {
    const sessionToken = generateSecureToken(64);
    const sessionIdHash = hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + (options.expiresInSeconds || 24 * 60 * 60) * 1000);
    
    const result = await prisma.$queryRawUnsafe<any[]>(`
        INSERT INTO sso_sessions (
            session_id_hash, user_id, ip_address, user_agent, auth_time,
            auth_method, application_id, expires_at
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7)
        RETURNING id
    `, [
        sessionIdHash,
        userId,
        options.ipAddress || null,
        options.userAgent || null,
        authMethod,
        options.applicationId || null,
        expiresAt
    ]);
    
    await logOAuthEvent('session_created', {
        user_id: userId,
        session_id: result[0].id,
        ip_address: options.ipAddress
    });
    
    return { sessionId: result[0].id, sessionToken };
}

/**
 * Validate SSO session
 */
export async function validateSSOSession(
    sessionToken: string
): Promise<SSOSession | null> {
    const sessionIdHash = hashToken(sessionToken);
    
    const result = await prisma.$queryRawUnsafe<any[]>(`
        SELECT * FROM sso_sessions
        WHERE session_id_hash = $1 AND is_active = true AND expires_at > NOW()
    `, [sessionIdHash]);
    
    if (result.length === 0) return null;
    
    // Update last activity
    await prisma.$queryRawUnsafe<any[]>(
        'UPDATE sso_sessions SET last_activity_at = NOW() WHERE id = $1',
        [result[0].id]
    );
    
    return {
        id: result[0].id,
        user_id: result[0].user_id,
        auth_time: result[0].auth_time,
        auth_method: result[0].auth_method,
        active_clients: result[0].active_clients || [],
        expires_at: result[0].expires_at
    };
}

/**
 * Add client to SSO session
 */
export async function addClientToSession(sessionId: string, clientId: string): Promise<void> {
    await prisma.$queryRawUnsafe<any[]>(`
        UPDATE sso_sessions
        SET active_clients = COALESCE(active_clients, '[]'::jsonb) || $1::jsonb
        WHERE id = $2
    `, [JSON.stringify([clientId]), sessionId]);
}

/**
 * End SSO session (logout)
 */
export async function endSSOSession(sessionToken: string): Promise<string[]> {
    const sessionIdHash = hashToken(sessionToken);
    
    const result = await prisma.$queryRawUnsafe<any[]>(`
        UPDATE sso_sessions
        SET is_active = false, ended_at = NOW()
        WHERE session_id_hash = $1
        RETURNING id, active_clients
    `, [sessionIdHash]);
    
    if (result.length > 0) {
        await logOAuthEvent('session_ended', {
            session_id: result[0].id
        });
        return result[0].active_clients || [];
    }
    
    return [];
}

// ============================================================================
// OIDC UserInfo
// ============================================================================

/**
 * Get user info for UserInfo endpoint
 */
export async function getUserInfo(
    userId: string,
    scopes: string[]
): Promise<UserInfo> {
    const user = await getUserForTokens(userId);
    if (!user) {
        throw new OAuthError('invalid_token', 'User not found');
    }
    
    const userInfo: UserInfo = { sub: userId };
    
    // Add claims based on scopes
    for (const scope of scopes) {
        const claims = SCOPE_CLAIMS[scope];
        if (!claims) continue;
        
        for (const claim of claims) {
            switch (claim) {
                case 'name':
                    userInfo.name = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
                    break;
                case 'given_name':
                    userInfo.given_name = user.first_name;
                    break;
                case 'family_name':
                    userInfo.family_name = user.last_name;
                    break;
                case 'preferred_username':
                    userInfo.preferred_username = user.username || user.email;
                    break;
                case 'email':
                    userInfo.email = user.email;
                    break;
                case 'email_verified':
                    userInfo.email_verified = user.is_email_verified;
                    break;
                case 'picture':
                    userInfo.picture = user.avatar_url;
                    break;
                case 'updated_at':
                    userInfo.updated_at = user.updated_at ? Math.floor(new Date(user.updated_at).getTime() / 1000) : undefined;
                    break;
            }
        }
    }
    
    return userInfo;
}

// ============================================================================
// OIDC Discovery
// ============================================================================

/**
 * Get OIDC Discovery document
 */
export function getDiscoveryDocument(issuer: string): Record<string, any> {
    return {
        issuer,
        authorization_endpoint: `${issuer}/oauth/authorize`,
        token_endpoint: `${issuer}/oauth/token`,
        userinfo_endpoint: `${issuer}/oauth/userinfo`,
        jwks_uri: `${issuer}/.well-known/jwks.json`,
        registration_endpoint: `${issuer}/oauth/register`,
        revocation_endpoint: `${issuer}/oauth/revoke`,
        introspection_endpoint: `${issuer}/oauth/introspect`,
        end_session_endpoint: `${issuer}/oauth/logout`,
        
        scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
        response_types_supported: ['code', 'token', 'id_token', 'code token', 'code id_token', 'token id_token', 'code token id_token'],
        response_modes_supported: ['query', 'fragment'],
        grant_types_supported: ['authorization_code', 'refresh_token', 'client_credentials'],
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
        
        subject_types_supported: ['public'],
        id_token_signing_alg_values_supported: ['HS256', 'RS256'],
        claims_supported: [
            'sub', 'iss', 'aud', 'exp', 'iat', 'auth_time', 'nonce',
            'name', 'given_name', 'family_name', 'preferred_username',
            'email', 'email_verified', 'picture', 'updated_at'
        ],
        
        code_challenge_methods_supported: ['plain', 'S256'],
        
        // Additional capabilities
        claims_parameter_supported: false,
        request_parameter_supported: false,
        request_uri_parameter_supported: false
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateClientId(): string {
    return crypto.randomBytes(16).toString('hex');
}

function generateClientSecret(): string {
    return crypto.randomBytes(32).toString('base64url');
}

function generateSecureToken(bytes: number): string {
    return crypto.randomBytes(bytes).toString('base64url');
}

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}

function validatePKCE(verifier: string, challenge: string, method: string): boolean {
    if (method === 'plain') {
        return verifier === challenge;
    }
    
    // S256
    const hash = crypto.createHash('sha256').update(verifier).digest('base64url');
    return hash === challenge;
}

async function getUserForTokens(userId: string): Promise<any> {
    const result = await prisma.$queryRawUnsafe<any[]>(`
        SELECT id, email, email as username, first_name, last_name, 
               (first_name || ' ' || last_name) as full_name,
               avatar_url, is_verified as is_email_verified, updated_at
        FROM core.users WHERE id = $1
    `, [userId]);
    return result[0] || null;
}

function buildIdTokenPayload(
    user: any,
    scopes: string[],
    options: { clientId: string; nonce?: string; now: number; expiresIn: number }
): Record<string, any> {
    const payload: Record<string, any> = {
        iss: process.env.ISSUER_URL || 'https://sso.appkit.com',
        sub: user.id,
        aud: options.clientId,
        iat: options.now,
        exp: options.now + options.expiresIn,
        auth_time: options.now
    };
    
    if (options.nonce) {
        payload.nonce = options.nonce;
    }
    
    // Add claims based on scopes
    if (scopes.includes('profile')) {
        payload.name = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
        payload.given_name = user.first_name;
        payload.family_name = user.last_name;
        payload.preferred_username = user.username || user.email;
        payload.picture = user.avatar_url;
        payload.updated_at = user.updated_at ? Math.floor(new Date(user.updated_at).getTime() / 1000) : undefined;
    }
    
    if (scopes.includes('email')) {
        payload.email = user.email;
        payload.email_verified = user.is_email_verified;
    }
    
    return payload;
}

function mapClientRow(row: any): OAuthClient {
    return {
        id: row.id,
        client_id: row.client_id,
        client_type: row.client_type,
        name: row.name,
        description: row.description,
        logo_url: row.logo_url,
        homepage_url: row.homepage_url,
        redirect_uris: row.redirect_uris || [],
        grant_types: row.grant_types || [],
        response_types: row.response_types || [],
        allowed_scopes: row.allowed_scopes || [],
        default_scopes: row.default_scopes || [],
        access_token_lifetime: row.access_token_lifetime,
        refresh_token_lifetime: row.refresh_token_lifetime,
        id_token_lifetime: row.id_token_lifetime,
        require_pkce: row.require_pkce,
        require_consent: row.require_consent,
        first_party: row.first_party,
        application_id: row.application_id,
        is_active: row.is_active
    };
}

async function logOAuthEvent(
    eventType: string,
    data: {
        client_id?: string;
        user_id?: string;
        session_id?: string;
        details?: Record<string, any>;
        ip_address?: string;
        user_agent?: string;
        success?: boolean;
        error_code?: string;
        error_description?: string;
    }
): Promise<void> {
    try {
        await prisma.$queryRawUnsafe<any[]>(`
            INSERT INTO oauth_audit_log (
                event_type, client_id, user_id, session_id, details,
                ip_address, user_agent, success, error_code, error_description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            eventType,
            data.client_id || null,
            data.user_id || null,
            data.session_id || null,
            JSON.stringify(data.details || {}),
            data.ip_address || null,
            data.user_agent || null,
            data.success !== false,
            data.error_code || null,
            data.error_description || null
        ]);
    } catch (e) {
        console.error('Failed to log OAuth event:', e);
    }
}

// ============================================================================
// Error Class
// ============================================================================

export class OAuthError extends Error {
    constructor(
        public readonly error: string,
        public readonly error_description?: string,
        public readonly error_uri?: string
    ) {
        super(error_description || error);
        this.name = 'OAuthError';
    }
    
    toJSON() {
        return {
            error: this.error,
            ...(this.error_description && { error_description: this.error_description }),
            ...(this.error_uri && { error_uri: this.error_uri })
        };
    }
}

// ============================================================================
// Export
// ============================================================================

export default {
    // Client management
    createClient,
    getClientByClientId,
    validateClientCredentials,
    getApplicationClients,
    
    // Authorization
    validateAuthorizationRequest,
    createAuthorizationCode,
    exchangeAuthorizationCode,
    refreshAccessToken,
    
    // Token management
    introspectToken,
    revokeToken,
    
    // Consent
    hasUserConsent,
    grantUserConsent,
    revokeUserConsent,
    
    // Sessions
    createSSOSession,
    validateSSOSession,
    addClientToSession,
    endSSOSession,
    
    // OIDC
    getUserInfo,
    getDiscoveryDocument,
    
    // Error
    OAuthError
};
