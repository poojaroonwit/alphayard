# @alphayard/appkit

Client-side SDK for the AppKit Identity Platform. Provides authentication (OAuth 2.0 + PKCE), user identity management, MFA, CMS, localization, and group/circle membership.

## Installation

```bash
npm install @alphayard/appkit
```

## Quick Start

```typescript
import { AppKit } from '@alphayard/appkit';

const client = new AppKit({
  clientId: 'YOUR_CLIENT_ID',
  domain: 'https://auth.your-app.com',
  redirectUri: 'https://app.com/callback',
});

// Redirect to login
await client.login();
```

## Handle Callback

```typescript
// On your callback page
const { tokens, state } = await client.handleCallback();
console.log('Logged in!', tokens.accessToken);
```

## Get User Profile

```typescript
const user = await client.getUser();
console.log(user.name, user.email);
```

## Custom Attributes

```typescript
await client.updateAttributes({ theme: 'dark', newsletter: true });
const attrs = await client.getAttributes();
```

## MFA

```typescript
// Enroll in TOTP
const { qrCodeUrl, secret } = await client.mfa.enroll('totp');

// Verify code
await client.mfa.verify({ type: 'totp', code: '123456' });
```

## CMS Content

```typescript
const page = await client.cms.getContent('welcome-page');
```

## Localization

```typescript
const strings = await client.localization.getTranslations('en-US');
console.log(strings['welcome.title']);
```

## Groups / Circles

```typescript
const circles = await client.getUserCircles();
// [{ id: 'circle_123', name: 'Engineering', role: 'admin' }]
```

## Logout

```typescript
await client.logout({
  post_logout_redirect_uri: 'https://app.com/goodbye',
});
```

## Events

```typescript
client.on('token_refreshed', () => console.log('Token refreshed'));
client.on('token_expired', () => console.log('Session expired'));
client.on('logout', () => router.push('/login'));
```

## Configuration

```typescript
const client = new AppKit({
  clientId: 'YOUR_CLIENT_ID',
  domain: 'https://auth.your-app.com',
  redirectUri: 'https://app.com/callback',
  scopes: ['openid', 'profile', 'email', 'offline_access'],
  storage: 'localStorage',   // 'localStorage' | 'sessionStorage' | 'cookie' | 'memory'
  autoRefresh: true,          // Automatically refresh tokens before expiry
});
```

## Advanced: Build Auth URL Manually

```typescript
const url = await client.buildAuthUrl({
  redirect_uri: 'https://app.com/callback',
  scope: 'openid profile email',
  usePKCE: true,
});
window.location.href = url;
```

## License

MIT
