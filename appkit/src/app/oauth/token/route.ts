import { NextRequest, NextResponse } from 'next/server';
import ssoProviderService from '@/server/services/SSOProviderService';
import { auditService, AuditAction } from '@/server/services/auditService';

export async function POST(request: NextRequest) {
  let clientIdForLog = 'unknown';
  try {
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        body[key] = value;
      });
    } else {
      body = await request.json();
    }

    const { grant_type, code, redirect_uri, client_id, client_secret, code_verifier } = body;
    clientIdForLog = client_id || 'unknown';

    if (grant_type !== 'authorization_code') {
      return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
    }

    if (!code || !client_id || !redirect_uri) {
      return NextResponse.json({ error: 'invalid_request', error_description: 'Missing code, client_id, or redirect_uri' }, { status: 400 });
    }

    // Exchange code for token info
    const session = await ssoProviderService.exchangeCodeForToken(client_id, client_secret, code, redirect_uri, code_verifier);

    // Generate tokens
    const accessToken = await ssoProviderService.generateAccessToken(session.userId, session.clientId, session.scope);
    const idToken = await ssoProviderService.generateIdToken(session.userId, session.clientId);
    
    // Audit the token exchange
    await auditService.logAuthEvent(
      session.userId,
      AuditAction.LOGIN,
      'OAuth:Token',
      { 
        clientId: client_id, 
        grantType: grant_type,
        scope: session.scope,
        action: 'token_exchange_success'
      },
      request.headers.get('x-forwarded-for') || '127.0.0.1',
      request.headers.get('user-agent') || 'Unknown'
    );

    // For now, we'll return a simple response. Refresh token can be added later if needed.
    return NextResponse.json({
      access_token: accessToken,
      id_token: idToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: session.scope
    });

  } catch (error: any) {
    console.error('[oauth] Token error:', error);

    // Log failed token exchange
    await auditService.logAuthEvent(
      'anonymous',
      AuditAction.FAILED,
      'OAuth:Token',
      { 
        clientId: clientIdForLog, 
        error: error.message,
        action: 'token_exchange_failed'
      },
      request.headers.get('x-forwarded-for') || '127.0.0.1',
      request.headers.get('user-agent') || 'Unknown'
    );

    return NextResponse.json({ 
      error: 'invalid_grant', 
      error_description: error.message || 'Failed to exchange token' 
    }, { status: 400 });
  }
}
