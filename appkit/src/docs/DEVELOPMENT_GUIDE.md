# Boundary Login Module Development Guide

## Overview

The Boundary Login Module provides a comprehensive authentication solution with extensive customization options, responsive design, and multi-platform support. This guide will help you integrate and configure the login system for your application.

## Quick Start

### 1. Access the Sandbox

Navigate to `/sandbox` in your admin panel to test the login module in a controlled environment.

### 2. Configure Your Settings

Use the sandbox configuration panel to:
- Set up branding and colors
- Configure form fields
- Test redirect URLs
- Preview across different devices

### 3. Test Integration

Use the "Test in Sandbox" button to verify your login flow works correctly.

## Features

### 🔐 Authentication Methods
- **Email/Password**: Traditional login with email and password
- **Social Login**: Support for Google, Microsoft, GitHub, Apple, and more
- **Enterprise SSO**: SAML, OIDC, and custom SSO providers
- **Multi-factor Authentication**: Optional 2FA with SMS, email, or authenticator apps

### 🎨 Customization Options
- **Branding**: Logo, colors, fonts, and custom CSS
- **Layout**: Multiple layout options (centered, split, full-width)
- **Form Fields**: Configure which fields to show/hide
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Device-specific configurations for desktop, mobile, tablet

### 🛡️ Security Features
- **Rate Limiting**: Prevent brute force attacks
- **Session Management**: Secure token handling
- **Password Strength**: Configurable password requirements
- **Account Lockout**: Temporary lock after failed attempts
- **GDPR Compliance**: Privacy and data protection features

### 🌐 Multi-Platform Support
- **Web Desktop**: Full-featured desktop browser experience
- **Web Mobile**: Optimized for mobile browsers
- **Mobile App**: Native app integration support
- **Tablet**: Tablet-specific layouts and interactions

## Integration Guide

### JavaScript/TypeScript

```typescript
import { BoundaryAuth } from '@boundary/auth'

// Initialize
const auth = new BoundaryAuth({
  clientId: 'your-client-id',
  redirectUri: 'https://your-app.com/callback',
  apiUrl: 'https://api.boundary.com'
})

// Login
async function login(email: string, password: string) {
  try {
    const result = await auth.signIn(email, password)
    localStorage.setItem('boundary_token', result.token)
    localStorage.setItem('boundary_user', JSON.stringify(result.user))
    return result
  } catch (error) {
    console.error('Login failed:', error)
    throw error
  }
}

// Logout
async function logout() {
  await auth.signOut()
  localStorage.removeItem('boundary_token')
  localStorage.removeItem('boundary_user')
}

// Check authentication
function isAuthenticated(): boolean {
  const token = localStorage.getItem('boundary_token')
  return token ? !auth.isTokenExpired(token) : false
}
```

### React Hook

```typescript
import { useState, useEffect } from 'react'
import { BoundaryAuth } from '@boundary/auth'

export function useBoundaryAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const auth = new BoundaryAuth({
    clientId: process.env.NEXT_PUBLIC_BOUNDARY_CLIENT_ID,
    redirectUri: `${window.location.origin}/callback`
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('boundary_token')
      if (token && !auth.isTokenExpired(token)) {
        const userData = await auth.getUser(token)
        setUser(userData)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await auth.signIn(email, password)
      localStorage.setItem('boundary_token', result.token)
      setUser(result.user)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await auth.signOut()
    localStorage.removeItem('boundary_token')
    localStorage.removeItem('boundary_user')
    setUser(null)
  }

  return { user, loading, error, login, logout, isAuthenticated: !!user }
}
```

### Next.js App Router

```typescript
// app/auth/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BoundaryAuth } from '@boundary/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const auth = new BoundaryAuth({
    clientId: process.env.NEXT_PUBLIC_BOUNDARY_CLIENT_ID!,
    redirectUri: `${window.location.origin}/auth/callback`
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await auth.signIn(email, password)
      
      // Set HTTP-only cookie via API route
      await fetch('/api/auth/set-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: result.token })
      })
      
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-red-500">{error}</div>}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          className="w-full px-3 py-2 border rounded"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          className="w-full px-3 py-2 border rounded"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
```

### Node.js Backend

```javascript
const express = require('express')
const { BoundaryAuth } = require('@boundary/auth')
const cookieParser = require('cookie-parser')

const app = express()
app.use(express.json())
app.use(cookieParser())

const auth = new BoundaryAuth({
  clientId: process.env.BOUNDARY_CLIENT_ID,
  clientSecret: process.env.BOUNDARY_CLIENT_SECRET,
  apiUrl: 'https://api.boundary.com'
})

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    const result = await auth.signIn(email, password)
    
    // Set HTTP-only cookie
    res.cookie('boundary_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    })
    
    res.json({
      success: true,
      user: result.user
    })
    
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    })
  }
})

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.boundary_token || req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }
  
  try {
    const user = await auth.verifyToken(token)
    req.user = user
    next()
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' })
  }
}

// Protected route
app.get('/api/user/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user })
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})
```

## Configuration

### Environment Variables

```bash
# Required
BOUNDARY_CLIENT_ID=your_client_id_here
BOUNDARY_CLIENT_SECRET=your_client_secret_here
BOUNDARY_API_URL=https://api.boundary.com
BOUNDARY_REDIRECT_URI=http://localhost:3000/auth/callback

# Optional
BOUNDARY_SCOPE=read write
BOUNDARY_TOKEN_STORAGE=localStorage
BOUNDARY_SESSION_TIMEOUT=3600
```

### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `clientId` | string | ✅ | Your application's client ID |
| `clientSecret` | string | ❌ | Client secret for server-side apps |
| `redirectUri` | string | ✅ | URL to redirect after authentication |
| `apiUrl` | string | ✅ | Boundary API endpoint URL |
| `scope` | string | ❌ | Requested permissions (default: 'read') |
| `storage` | string | ❌ | Token storage method |

## Testing

### Using the Sandbox

1. **Navigate to `/sandbox`** in your admin panel
2. **Configure your settings** using the control panel
3. **Set your redirect URL** in the configuration
4. **Click "Test Login"** to simulate a login flow
5. **Verify the redirect** and token generation

### Manual Testing

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/sandbox/test-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456!","redirectUrl":"http://localhost:3000/success"}'

# Test token validation
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.boundary.com/user/me
```

### Integration Testing

```typescript
// Test your integration
describe('Boundary Auth Integration', () => {
  test('should login successfully', async () => {
    const auth = new BoundaryAuth({
      clientId: 'test-client-id',
      redirectUri: 'http://localhost:3000/callback'
    })
    
    const result = await auth.signIn('test@example.com', 'password')
    expect(result.token).toBeDefined()
    expect(result.user.email).toBe('test@example.com')
  })
  
  test('should handle invalid credentials', async () => {
    const auth = new BoundaryAuth({
      clientId: 'test-client-id',
      redirectUri: 'http://localhost:3000/callback'
    })
    
    await expect(auth.signIn('invalid@test.com', 'wrong')).rejects.toThrow()
  })
})
```

## Security Best Practices

### 1. Token Storage
- Use HTTP-only cookies for web applications
- Implement secure token storage for mobile apps
- Set appropriate cookie flags (secure, sameSite)

### 2. Environment Configuration
- Never expose client secrets in frontend code
- Use environment variables for sensitive configuration
- Implement proper CORS policies

### 3. Error Handling
- Don't expose sensitive error messages to users
- Implement proper logging for debugging
- Handle network errors gracefully

### 4. Session Management
- Implement proper token expiration
- Handle token refresh automatically
- Provide clear logout functionality

## Troubleshooting

### Common Issues

#### Login Redirects to Marketing Page
- Check you're accessing the correct URL (port 3001 for admin)
- Clear browser localStorage and cookies
- Verify your redirect URL configuration

#### Token Not Working
- Verify token is not expired
- Check token storage method
- Ensure proper API endpoint configuration

#### Social Login Not Working
- Verify OAuth provider configuration
- Check redirect URI in provider settings
- Ensure proper CORS configuration

### Debug Commands

```javascript
// Check current authentication state
console.log('Token:', localStorage.getItem('boundary_token'))
console.log('User:', localStorage.getItem('boundary_user'))
console.log('Current URL:', window.location.href)

// Clear authentication data
localStorage.clear()
sessionStorage.clear()

// Test API connectivity
fetch('/api/sandbox/test-login')
  .then(res => res.json())
  .then(data => console.log('API Response:', data))
```

## Support

### Documentation
- [Full API Reference](https://docs.boundary.com/api)
- [Configuration Guide](https://docs.boundary.com/configuration)
- [Security Guidelines](https://docs.boundary.com/security)

### Community
- [GitHub Repository](https://github.com/boundary/auth)
- [Discord Community](https://discord.gg/boundary)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/boundary-auth)

### Support Channels
- [Support Center](https://boundary.com/support)
- [Email Support](mailto:support@boundary.com)
- [Priority Support](https://boundary.com/enterprise)

## Migration Guide

### From Version 1.x to 2.x

1. **Update Dependencies**
   ```bash
   npm install @boundary/auth@latest
   ```

2. **Update Initialization**
   ```typescript
   // Old
   const auth = new BoundaryAuth('client-id')
   
   // New
   const auth = new BoundaryAuth({
     clientId: 'client-id',
     redirectUri: 'https://your-app.com/callback'
   })
   ```

3. **Update Method Calls**
   ```typescript
   // Old
   auth.login(email, password)
   
   // New
   auth.signIn(email, password)
   ```

### Custom Provider Integration

```typescript
// Add custom OAuth provider
auth.addProvider('custom-provider', {
  clientId: 'custom-client-id',
  authorizationUrl: 'https://custom.com/oauth/authorize',
  tokenUrl: 'https://custom.com/oauth/token',
  scope: 'read write'
})
```

## Performance Optimization

### 1. Bundle Size
- Use tree-shaking for unused features
- Implement code splitting for auth components
- Optimize bundle with webpack optimizations

### 2. Caching
- Cache user profile data
- Implement token refresh caching
- Use service workers for offline support

### 3. Network Optimization
- Implement request deduplication
- Use HTTP/2 for API calls
- Optimize payload sizes

## Accessibility

### WCAG 2.1 Compliance
- Proper form labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

### Testing Accessibility
```bash
# Install accessibility testing tools
npm install --save-dev axe-core jest-axe

# Run accessibility tests
npm run test:a11y
```

## Internationalization

### Supported Languages
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)
- Chinese (zh)

### Adding Custom Languages

```typescript
import { BoundaryAuth } from '@boundary/auth'

const auth = new BoundaryAuth({
  locale: 'custom-locale',
  messages: {
    'login.title': 'Custom Login Title',
    'login.email': 'Email Address',
    'login.password': 'Password'
  }
})
```

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/boundary/auth/blob/main/LICENSE) file for details.

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/boundary/auth/blob/main/CONTRIBUTING.md) for details.

---

For more information, visit [boundary.com](https://boundary.com) or contact our support team.
