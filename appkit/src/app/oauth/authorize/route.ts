import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { config } from '@/server/config/env';
import ssoProviderService from '@/server/services/SSOProviderService';
import { auditService, AuditAction } from '@/server/services/auditService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const responseType = searchParams.get('response_type');
  const scope = searchParams.get('scope');
  const state = searchParams.get('state');
  const nonce = searchParams.get('nonce');
  const prompt = searchParams.get('prompt');
  const screenHint = searchParams.get('screen_hint');
  const codeChallenge = searchParams.get('code_challenge');
  const codeChallengeMethod = searchParams.get('code_challenge_method');
  const promptValues = (prompt || '')
    .split(' ')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  const forceLogin = promptValues.includes('login');
  const promptNone = promptValues.includes('none');
  const wantsSignup = (screenHint || '').toLowerCase() === 'signup';

  // 1. Basic validation
  if (!clientId) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'Missing client_id' }, { status: 400 });
  }
  if (!redirectUri) {
    return NextResponse.json({ error: 'invalid_request', error_description: 'Missing redirect_uri' }, { status: 400 });
  }
  if (responseType !== 'code') {
    return NextResponse.json({ error: 'unsupported_response_type', error_description: 'Only response_type=code is supported' }, { status: 400 });
  }

  // 2. Check Authentication
  const token = request.cookies.get('appkit_token')?.value;
  let userId: string | null = null;

  if (token && !forceLogin) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET) as any;
      // Support all token shapes used across auth endpoints.
      userId = decoded.userId || decoded.id || decoded.adminId || null;
    } catch (err) {
      console.warn('[oauth] Invalid session cookie:', err);
    }
  }

  if (!userId) {
    if (promptNone) {
      return NextResponse.json(
        { error: 'login_required', error_description: 'User is not authenticated' },
        { status: 401 }
      );
    }

    // Redirect to login if not authenticated
    // Extract real host from headers, or use NEXT_PUBLIC_SITE_URL fallback
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
    const host = forwardedHost || request.headers.get('host');
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    
    // Choose best base URL to construct absolute links
    const baseUrl = siteUrl || (host ? `${forwardedProto}://${host}` : request.nextUrl.origin);
    
    // Construct the external URL for the current request
    const currentUrl = new URL(request.url);
    const externalCurrentUrl = new URL(currentUrl.pathname + currentUrl.search, baseUrl);
    
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('redirect', externalCurrentUrl.toString());
    if (clientId) {
      loginUrl.searchParams.set('client_id', clientId);
    }
    if (wantsSignup) {
      // Hint the hosted auth page to open signup mode.
      loginUrl.searchParams.set('mode', 'signup');
    }
    
    return NextResponse.redirect(loginUrl);
  }

  // 3. Validate Client
  try {
    const client = await ssoProviderService.validateClient(clientId, redirectUri);
    
    // 4. Issue Authorization Code
    const code = await ssoProviderService.createAuthorizationCode(
      client.id, // Internal database ID (UUID)
      userId,
      redirectUri,
      scope || undefined,
      state || undefined,
      nonce || undefined,
      codeChallenge || undefined,
      codeChallengeMethod || undefined
    );

    // Audit the authorization code issuance
    await auditService.logAuthEvent(
      userId,
      AuditAction.ACCESS,
      'OAuth:Authorize',
      { 
        clientId, 
        redirectUri, 
        scope,
        action: 'issue_code'
      },
      request.headers.get('x-forwarded-for') || '127.0.0.1',
      request.headers.get('user-agent') || 'Unknown'
    );

    // 5. Redirect back to client
    const targetUrl = new URL(redirectUri);
    targetUrl.searchParams.set('code', code);
    if (state) targetUrl.searchParams.set('state', state);

    return NextResponse.redirect(targetUrl);

  } catch (error: any) {
    console.error('[oauth] Authorization error:', error);
    
    // Log failed authorization attempt
    await auditService.logAuthEvent(
      userId || 'anonymous',
      AuditAction.FAILED,
      'OAuth:Authorize',
      { 
        clientId, 
        error: error.message,
        action: 'authorize_failed'
      },
      request.headers.get('x-forwarded-for') || '127.0.0.1',
      request.headers.get('user-agent') || 'Unknown'
    );

    return NextResponse.json({ 
      error: 'invalid_client', 
      error_description: error.message || 'Failed to authorize' 
    }, { status: 400 });
  }
}
