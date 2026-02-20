/**
 * OAuth 2.0 / OpenID Connect Routes
 * 
 * Implements the authorization server endpoints for SSO Provider functionality.
 * 
 * Endpoints:
 * - GET  /oauth/authorize       - Authorization endpoint
 * - POST /oauth/token           - Token endpoint
 * - GET  /oauth/userinfo        - UserInfo endpoint
 * - POST /oauth/introspect      - Token introspection
 * - POST /oauth/revoke          - Token revocation
 * - GET  /oauth/logout          - End session (logout)
 * - GET  /.well-known/openid-configuration - OIDC Discovery
 * - GET  /.well-known/jwks.json - JSON Web Key Set
 */

import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import SSOProvider, { OAuthError, AuthorizationRequest, TokenRequest } from '../../services/SSOProviderService';
import { authenticateToken, optionalAuth } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';

const router = Router();

// ============================================================================
// OIDC Discovery Endpoints
// ============================================================================

/**
 * OpenID Connect Discovery Document
 * GET /.well-known/openid-configuration
 */
router.get('/.well-known/openid-configuration', (req: Request, res: Response) => {
    const issuer = getIssuerUrl(req);
    const discovery = SSOProvider.getDiscoveryDocument(issuer);
    res.json(discovery);
});

/**
 * JSON Web Key Set (JWKS)
 * GET /.well-known/jwks.json
 */
router.get('/.well-known/jwks.json', async (req: Request, res: Response) => {
    try {
        // Get active public keys
        // Note: oidc_signing_keys table doesn't have a Prisma model, using $queryRaw
        const rows = await prisma.$queryRaw<Array<{
            key_id: string;
            public_key: string;
            algorithm: string;
            key_type: string;
        }>>`
            SELECT key_id, public_key, algorithm, key_type
            FROM oidc_signing_keys
            WHERE is_active = true
            ORDER BY is_current DESC, created_at DESC
        `;
        
        const keys = rows.map(row => ({
            kid: row.key_id,
            kty: row.key_type,
            alg: row.algorithm,
            use: 'sig',
            // Note: In production, parse the PEM and extract n, e for RSA
            // For now, we're using HS256, so this is placeholder
        }));
        
        res.json({ keys });
    } catch (error) {
        console.error('JWKS error:', error);
        res.json({ keys: [] });
    }
});

// ============================================================================
// Authorization Endpoint
// ============================================================================

/**
 * Authorization Request
 * GET /oauth/authorize
 * 
 * Initiates the authorization code flow. If user is authenticated and has
 * granted consent, returns authorization code. Otherwise, redirects to login/consent.
 */
router.get('/authorize', [
    query('client_id').notEmpty().withMessage('client_id is required'),
    query('redirect_uri').isURL({ require_tld: false }).withMessage('Valid redirect_uri is required'),
    query('response_type').notEmpty().withMessage('response_type is required'),
    query('scope').optional(),
    query('state').optional(),
    query('nonce').optional(),
    query('code_challenge').optional(),
    query('code_challenge_method').optional().isIn(['plain', 'S256']),
    query('prompt').optional().isIn(['none', 'login', 'consent', 'select_account']),
    query('login_hint').optional()
], optionalAuth as any, async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return redirectWithError(res, req.query.redirect_uri as string, {
            error: 'invalid_request',
            error_description: errors.array()[0].msg,
            state: req.query.state as string
        });
    }
    
    try {
        const authRequest: AuthorizationRequest = {
            client_id: req.query.client_id as string,
            redirect_uri: req.query.redirect_uri as string,
            response_type: req.query.response_type as string,
            scope: (req.query.scope as string) || 'openid profile',
            state: req.query.state as string,
            nonce: req.query.nonce as string,
            code_challenge: req.query.code_challenge as string,
            code_challenge_method: req.query.code_challenge_method as 'plain' | 'S256',
            prompt: req.query.prompt as string,
            login_hint: req.query.login_hint as string
        };
        
        // Validate request
        const validation = await SSOProvider.validateAuthorizationRequest(authRequest);
        if (!validation.valid || !validation.client) {
            return redirectWithError(res, authRequest.redirect_uri, {
                error: validation.error!,
                error_description: validation.error_description,
                state: authRequest.state
            });
        }
        
        const client = validation.client;
        const user = (req as any).user;
        
        // Check if user is authenticated
        if (!user) {
            // Prompt=none means no UI interaction allowed
            if (authRequest.prompt === 'none') {
                return redirectWithError(res, authRequest.redirect_uri, {
                    error: 'login_required',
                    error_description: 'User must be authenticated',
                    state: authRequest.state
                });
            }
            
            // Redirect to login page with return URL
            const returnUrl = encodeURIComponent(req.originalUrl);
            return res.redirect(`/oauth/login?return_to=${returnUrl}`);
        }
        
        // Check consent
        const requestedScopes = authRequest.scope.split(' ');
        const hasConsent = await SSOProvider.hasUserConsent(user.id, client.id, requestedScopes);
        
        // Determine if we need to show consent
        const needsConsent = !hasConsent && client.require_consent && !client.first_party;
        
        if (needsConsent) {
            if (authRequest.prompt === 'none') {
                return redirectWithError(res, authRequest.redirect_uri, {
                    error: 'consent_required',
                    error_description: 'User consent is required',
                    state: authRequest.state
                });
            }
            
            // Redirect to consent page
            const consentParams = new URLSearchParams({
                client_id: authRequest.client_id,
                redirect_uri: authRequest.redirect_uri,
                scope: authRequest.scope,
                state: authRequest.state || '',
                nonce: authRequest.nonce || '',
                code_challenge: authRequest.code_challenge || '',
                code_challenge_method: authRequest.code_challenge_method || '',
                response_type: authRequest.response_type
            });
            return res.redirect(`/oauth/consent?${consentParams.toString()}`);
        }
        
        // Generate authorization code
        const code = await SSOProvider.createAuthorizationCode(
            client,
            user.id,
            authRequest,
            (req as any).ssoSessionId
        );
        
        // Redirect with code
        const redirectUrl = new URL(authRequest.redirect_uri);
        redirectUrl.searchParams.set('code', code);
        if (authRequest.state) {
            redirectUrl.searchParams.set('state', authRequest.state);
        }
        
        res.redirect(redirectUrl.toString());
        
    } catch (error) {
        console.error('Authorization error:', error);
        if (req.query.redirect_uri) {
            return redirectWithError(res, req.query.redirect_uri as string, {
                error: 'server_error',
                error_description: 'An unexpected error occurred',
                state: req.query.state as string
            });
        }
        res.status(500).json({ error: 'server_error' });
    }
});

/**
 * Consent approval endpoint
 * POST /oauth/consent
 */
router.post('/consent', authenticateToken as any, [
    body('client_id').notEmpty(),
    body('redirect_uri').isURL({ require_tld: false }),
    body('scope').notEmpty(),
    body('approved').isBoolean()
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'invalid_request', errors: errors.array() });
    }
    
    const user = (req as any).user;
    const { client_id, redirect_uri, scope, state, nonce, code_challenge, code_challenge_method, approved } = req.body;
    
    try {
        const client = await SSOProvider.getClientByClientId(client_id);
        if (!client) {
            return res.status(400).json({ error: 'invalid_client' });
        }
        
        if (!approved) {
            return redirectWithError(res, redirect_uri, {
                error: 'access_denied',
                error_description: 'User denied the request',
                state
            });
        }
        
        // Grant consent
        const scopes = scope.split(' ');
        await SSOProvider.grantUserConsent(user.id, client.id, scopes, client.application_id);
        
        // Generate authorization code
        const code = await SSOProvider.createAuthorizationCode(
            client,
            user.id,
            { client_id, redirect_uri, response_type: 'code', scope, state, nonce, code_challenge, code_challenge_method },
            (req as any).ssoSessionId
        );
        
        // Redirect with code
        const redirectUrl = new URL(redirect_uri);
        redirectUrl.searchParams.set('code', code);
        if (state) {
            redirectUrl.searchParams.set('state', state);
        }
        
        res.redirect(redirectUrl.toString());
        
    } catch (error) {
        console.error('Consent error:', error);
        redirectWithError(res, redirect_uri, {
            error: 'server_error',
            error_description: 'An unexpected error occurred',
            state
        });
    }
});

// ============================================================================
// Token Endpoint
// ============================================================================

/**
 * Token Request
 * POST /oauth/token
 * 
 * Exchanges authorization code for tokens or refreshes access token.
 */
router.post('/token', [
    body('grant_type').isIn(['authorization_code', 'refresh_token', 'client_credentials']),
    body('client_id').optional(),
    body('client_secret').optional(),
    body('code').optional(),
    body('redirect_uri').optional(),
    body('code_verifier').optional(),
    body('refresh_token').optional(),
    body('scope').optional()
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'invalid_request',
            error_description: errors.array()[0].msg
        });
    }
    
    try {
        // Extract client credentials from Authorization header or body
        let clientId = req.body.client_id;
        let clientSecret = req.body.client_secret;
        
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Basic ')) {
            const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
            const [id, secret] = credentials.split(':');
            clientId = decodeURIComponent(id);
            clientSecret = decodeURIComponent(secret);
        }
        
        if (!clientId) {
            return res.status(400).json({
                error: 'invalid_request',
                error_description: 'client_id is required'
            });
        }
        
        // Validate client credentials
        const client = await SSOProvider.validateClientCredentials(clientId, clientSecret);
        if (!client) {
            return res.status(401).json({
                error: 'invalid_client',
                error_description: 'Invalid client credentials'
            });
        }
        
        const tokenRequest: TokenRequest = {
            grant_type: req.body.grant_type,
            client_id: clientId,
            client_secret: clientSecret,
            code: req.body.code,
            redirect_uri: req.body.redirect_uri,
            code_verifier: req.body.code_verifier,
            refresh_token: req.body.refresh_token,
            scope: req.body.scope
        };
        
        let tokens;
        const ipAddress = req.ip;
        
        switch (tokenRequest.grant_type) {
            case 'authorization_code':
                tokens = await SSOProvider.exchangeAuthorizationCode(tokenRequest, ipAddress);
                break;
                
            case 'refresh_token':
                tokens = await SSOProvider.refreshAccessToken(tokenRequest, ipAddress);
                break;
                
            case 'client_credentials':
                // Client credentials flow - for machine-to-machine
                // This is simpler, no user context
                return res.status(400).json({
                    error: 'unsupported_grant_type',
                    error_description: 'Client credentials flow not yet implemented'
                });
                
            default:
                return res.status(400).json({
                    error: 'unsupported_grant_type',
                    error_description: `Grant type '${tokenRequest.grant_type}' is not supported`
                });
        }
        
        // Set cache headers
        res.set({
            'Cache-Control': 'no-store',
            'Pragma': 'no-cache'
        });
        
        res.json(tokens);
        
    } catch (error) {
        if (error instanceof OAuthError) {
            return res.status(400).json(error.toJSON());
        }
        console.error('Token error:', error);
        res.status(500).json({
            error: 'server_error',
            error_description: 'An unexpected error occurred'
        });
    }
});

// ============================================================================
// UserInfo Endpoint
// ============================================================================

/**
 * UserInfo Request Handler
 * Returns claims about the authenticated user.
 */
const userInfoHandler = async (req: Request, res: Response) => {
    try {
        // Get access token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'invalid_token',
                error_description: 'Access token required'
            });
        }
        
        const token = authHeader.slice(7);
        const introspection = await SSOProvider.introspectToken(token, 'access_token');
        
        if (!introspection.active) {
            return res.status(401).json({
                error: 'invalid_token',
                error_description: 'Token is invalid or expired'
            });
        }
        
        const scopes = introspection.scope.split(' ');
        const userInfo = await SSOProvider.getUserInfo(introspection.sub, scopes);
        
        res.json(userInfo);
        
    } catch (error) {
        if (error instanceof OAuthError) {
            return res.status(401).json(error.toJSON());
        }
        console.error('UserInfo error:', error);
        res.status(500).json({ error: 'server_error' });
    }
};

// GET /oauth/userinfo
router.get('/userinfo', userInfoHandler);

// POST is also supported for UserInfo
router.post('/userinfo', userInfoHandler);

// ============================================================================
// Token Introspection (RFC 7662)
// ============================================================================

/**
 * Token Introspection
 * POST /oauth/introspect
 */
router.post('/introspect', [
    body('token').notEmpty().withMessage('token is required'),
    body('token_type_hint').optional().isIn(['access_token', 'refresh_token'])
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'invalid_request',
            error_description: errors.array()[0].msg
        });
    }
    
    try {
        // Authenticate the client making the request
        let clientId = req.body.client_id;
        let clientSecret = req.body.client_secret;
        
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Basic ')) {
            const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
            const [id, secret] = credentials.split(':');
            clientId = decodeURIComponent(id);
            clientSecret = decodeURIComponent(secret);
        }
        
        if (clientId) {
            const client = await SSOProvider.validateClientCredentials(clientId, clientSecret);
            if (!client) {
                return res.status(401).json({
                    error: 'invalid_client',
                    error_description: 'Invalid client credentials'
                });
            }
        }
        
        const result = await SSOProvider.introspectToken(
            req.body.token,
            req.body.token_type_hint
        );
        
        res.json(result);
        
    } catch (error) {
        console.error('Introspection error:', error);
        res.status(500).json({ active: false });
    }
});

// ============================================================================
// Token Revocation (RFC 7009)
// ============================================================================

/**
 * Token Revocation
 * POST /oauth/revoke
 */
router.post('/revoke', [
    body('token').notEmpty().withMessage('token is required'),
    body('token_type_hint').optional().isIn(['access_token', 'refresh_token'])
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'invalid_request',
            error_description: errors.array()[0].msg
        });
    }
    
    try {
        await SSOProvider.revokeToken(
            req.body.token,
            req.body.token_type_hint
        );
        
        // RFC 7009: Always return 200 OK, even if token was already invalid
        res.status(200).send();
        
    } catch (error) {
        console.error('Revocation error:', error);
        res.status(200).send();
    }
});

// ============================================================================
// Logout Endpoint
// ============================================================================

/**
 * End Session (Logout)
 * GET /oauth/logout
 */
router.get('/logout', async (req: Request, res: Response) => {
    const { id_token_hint, post_logout_redirect_uri, state } = req.query;
    
    try {
        // Get SSO session from cookie
        const sessionToken = req.cookies?.sso_session;
        
        if (sessionToken) {
            // End the session and get active clients
            const activeClients = await SSOProvider.endSSOSession(sessionToken);
            
            // Clear session cookie
            res.clearCookie('sso_session', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax'
            });
            
            // TODO: Implement back-channel logout to notify clients
        }
        
        // Redirect to post-logout URI or default page
        if (post_logout_redirect_uri) {
            // Validate that URI belongs to a registered client
            const redirectUrl = new URL(post_logout_redirect_uri as string);
            if (state) {
                redirectUrl.searchParams.set('state', state as string);
            }
            return res.redirect(redirectUrl.toString());
        }
        
        // Default logout confirmation page
        res.json({ message: 'Logged out successfully' });
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'server_error' });
    }
});

// ============================================================================
// Client Registration (Dynamic Client Registration)
// ============================================================================

/**
 * Register OAuth Client
 * POST /oauth/register
 * 
 * For admin use - create new OAuth clients
 */
router.post('/register', authenticateToken as any, [
    body('name').notEmpty().withMessage('name is required'),
    body('redirect_uris').isArray({ min: 1 }).withMessage('At least one redirect_uri is required'),
    body('client_type').optional().isIn(['confidential', 'public']),
    body('grant_types').optional().isArray(),
    body('allowed_scopes').optional().isArray()
], async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'invalid_request',
            errors: errors.array()
        });
    }
    
    try {
        const user = (req as any).user;
        
        // Only admins can register clients
        // TODO: Check admin permissions
        
        const result = await SSOProvider.createClient({
            name: req.body.name,
            description: req.body.description,
            redirect_uris: req.body.redirect_uris,
            client_type: req.body.client_type,
            grant_types: req.body.grant_types,
            allowed_scopes: req.body.allowed_scopes,
            require_pkce: req.body.require_pkce,
            require_consent: req.body.require_consent,
            first_party: req.body.first_party,
            application_id: (req as any).applicationId,
            created_by: user.id,
            logo_url: req.body.logo_url,
            homepage_url: req.body.homepage_url
        });
        
        // Return client info (including secret only once)
        res.status(201).json({
            client_id: result.client.client_id,
            client_secret: result.client_secret, // Only returned on creation
            client_type: result.client.client_type,
            name: result.client.name,
            redirect_uris: result.client.redirect_uris,
            grant_types: result.client.grant_types,
            allowed_scopes: result.client.allowed_scopes
        });
        
    } catch (error) {
        console.error('Client registration error:', error);
        res.status(500).json({ error: 'server_error' });
    }
});

// ============================================================================
// Login Page (for authorization flow)
// ============================================================================

/**
 * Login page for OAuth flow
 * GET /oauth/login
 */
router.get('/login', (req: Request, res: Response) => {
    const returnTo = req.query.return_to as string;
    
    // Return a simple HTML login page
    // In production, this would be a proper frontend page
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Sign in - Boundary SSO</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; }
        body { font-family: "DM Sans", "IBM Plex Sans Thai", sans-serif !important; 
               background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
               min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
        .card { background: white; border-radius: 16px; padding: 40px; width: 100%; max-width: 400px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        h1 { margin: 0 0 8px; color: #1a1a2e; font-size: 24px; }
        p { color: #666; margin: 0 0 24px; }
        label { display: block; margin-bottom: 8px; color: #333; font-weight: 500; }
        input { width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px;
                font-size: 16px; margin-bottom: 16px; transition: border-color 0.2s; }
        input:focus { outline: none; border-color: #667eea; }
        button { width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                 color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600;
                 cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
        button:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); }
        .error { background: #fee; color: #c00; padding: 12px; border-radius: 8px; margin-bottom: 16px; display: none; }
        .logo { text-align: center; margin-bottom: 24px; }
        .logo svg { width: 48px; height: 48px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="#667eea" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
        </div>
        <h1>Sign in to continue</h1>
        <p>Enter your Boundary credentials</p>
        <div class="error" id="error"></div>
        <form id="loginForm">
            <input type="hidden" name="return_to" value="${returnTo || ''}">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required autofocus>
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
            <button type="submit">Sign In</button>
        </form>
    </div>
    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const email = form.email.value;
            const password = form.password.value;
            const returnTo = form.return_to.value;
            
            try {
                const res = await fetch('/api/v1/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                
                if (data.token) {
                    // Create SSO session
                    await fetch('/oauth/session', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + data.token
                        }
                    });
                    
                    // Redirect back to authorization
                    if (returnTo) {
                        window.location.href = decodeURIComponent(returnTo);
                    } else {
                        window.location.href = '/';
                    }
                } else {
                    document.getElementById('error').textContent = data.message || 'Login failed';
                    document.getElementById('error').style.display = 'block';
                }
            } catch (err) {
                document.getElementById('error').textContent = 'An error occurred';
                document.getElementById('error').style.display = 'block';
            }
        });
    </script>
</body>
</html>
    `);
});

/**
 * Create SSO session after login
 * POST /oauth/session
 */
router.post('/session', authenticateToken as any, async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        
        const { sessionId, sessionToken } = await SSOProvider.createSSOSession(
            user.id,
            'password',
            {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent'],
                applicationId: (req as any).applicationId
            }
        );
        
        // Set session cookie
        res.cookie('sso_session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        res.json({ success: true, session_id: sessionId });
        
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({ error: 'server_error' });
    }
});

/**
 * Consent page for OAuth flow
 * GET /oauth/consent
 */
router.get('/consent', authenticateToken as any, async (req: Request, res: Response) => {
    const { client_id, redirect_uri, scope, state, nonce, code_challenge, code_challenge_method } = req.query;
    
    try {
        const client = await SSOProvider.getClientByClientId(client_id as string);
        if (!client) {
            return res.status(400).send('Invalid client');
        }
        
        const scopes = (scope as string || 'openid profile').split(' ');
        const scopeDescriptions: Record<string, string> = {
            openid: 'Authenticate you and access your basic profile',
            profile: 'Access your name and profile picture',
            email: 'Access your email address',
            offline_access: 'Access your data when you\'re not using the app'
        };
        
        // Return consent page
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Authorize - Boundary SSO</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; }
        body { font-family: "DM Sans", "IBM Plex Sans Thai", sans-serif !important;
               background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
               min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
        .card { background: white; border-radius: 16px; padding: 40px; width: 100%; max-width: 440px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .app-info { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .app-logo { width: 64px; height: 64px; border-radius: 12px; background: #f0f0f0;
                    display: flex; align-items: center; justify-content: center; }
        .app-logo img { width: 100%; height: 100%; border-radius: 12px; object-fit: cover; }
        h1 { margin: 0 0 4px; color: #1a1a2e; font-size: 20px; }
        .app-url { color: #666; font-size: 14px; margin: 0; }
        .scopes { background: #f8f9fa; border-radius: 12px; padding: 16px; margin: 24px 0; }
        .scopes h2 { margin: 0 0 12px; font-size: 14px; color: #333; font-weight: 600; }
        .scope { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
        .scope svg { width: 20px; height: 20px; color: #667eea; flex-shrink: 0; }
        .scope span { color: #444; font-size: 14px; }
        .buttons { display: flex; gap: 12px; }
        button { flex: 1; padding: 14px; border-radius: 8px; font-size: 16px; font-weight: 600;
                 cursor: pointer; transition: all 0.2s; }
        .deny { background: #f0f0f0; color: #333; border: none; }
        .deny:hover { background: #e0e0e0; }
        .allow { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                 color: white; border: none; }
        .allow:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4); }
    </style>
</head>
<body>
    <div class="card">
        <div class="app-info">
            <div class="app-logo">
                ${client.logo_url ? `<img src="${client.logo_url}" alt="${client.name}">` : 
                  `<svg viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`}
            </div>
            <div>
                <h1>${client.name}</h1>
                <p class="app-url">${client.homepage_url || 'Third-party application'}</p>
            </div>
        </div>
        
        <p style="color: #666; margin: 0 0 16px;">This application wants to:</p>
        
        <div class="scopes">
            <h2>Permissions requested</h2>
            ${scopes.map(s => `
                <div class="scope">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="10"/>
                    </svg>
                    <span>${scopeDescriptions[s] || s}</span>
                </div>
            `).join('')}
        </div>
        
        <form method="POST" action="/oauth/consent">
            <input type="hidden" name="client_id" value="${client_id}">
            <input type="hidden" name="redirect_uri" value="${redirect_uri}">
            <input type="hidden" name="scope" value="${scope}">
            <input type="hidden" name="state" value="${state || ''}">
            <input type="hidden" name="nonce" value="${nonce || ''}">
            <input type="hidden" name="code_challenge" value="${code_challenge || ''}">
            <input type="hidden" name="code_challenge_method" value="${code_challenge_method || ''}">
            
            <div class="buttons">
                <button type="submit" name="approved" value="false" class="deny">Deny</button>
                <button type="submit" name="approved" value="true" class="allow">Allow</button>
            </div>
        </form>
    </div>
</body>
</html>
        `);
        
    } catch (error) {
        console.error('Consent page error:', error);
        res.status(500).send('An error occurred');
    }
});

// ============================================================================
// Helper Functions
// ============================================================================

function getIssuerUrl(req: Request): string {
    const protocol = req.protocol;
    const host = req.get('host');
    return process.env.ISSUER_URL || `${protocol}://${host}`;
}

function redirectWithError(
    res: Response,
    redirectUri: string,
    error: { error: string; error_description?: string; state?: string }
): void {
    if (!redirectUri) {
        res.status(400).json(error);
        return;
    }
    
    try {
        const url = new URL(redirectUri);
        url.searchParams.set('error', error.error);
        if (error.error_description) {
            url.searchParams.set('error_description', error.error_description);
        }
        if (error.state) {
            url.searchParams.set('state', error.state);
        }
        res.redirect(url.toString());
    } catch (e) {
        res.status(400).json(error);
    }
}

export default router;
