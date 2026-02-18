export interface DevGuideSection {
  title: string;
  description: string;
  code: string;
  language: string;
}

export interface DevGuideCategory {
  id: string;
  title: string;
  icon: string;
  sections: DevGuideSection[];
}

export const DEV_GUIDE_CONTENT: DevGuideCategory[] = [
  {
    id: 'web-app',
    title: 'Web Application',
    icon: 'Globe',
    sections: [
      {
        title: 'Authorization Flow',
        description: 'Standard OIDC Authorization Code flow for server-side applications.',
        language: 'javascript',
        code: `// 1. Redirect to Authorization Endpoint
const authUrl = \`\${ISSUER}/oauth/authorize?\` +
  \`client_id=\${CLIENT_ID}&\` +
  \`redirect_uri=\${REDIRECT_URI}&\` +
  \`response_type=code&\` +
  \`scope=openid profile email&\` +
  \`state=\${STATE}\`;

window.location.href = authUrl;

// 2. Exchange Code for Tokens
const response = await fetch('\${ISSUER}/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: AUTH_CODE,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI
  })
});`
      },
      {
        title: 'Token Usage',
        description: 'Access the UserInfo endpoint using the Bearer token.',
        language: 'javascript',
        code: `const userResponse = await fetch('\${ISSUER}/oauth/userinfo', {
  headers: {
    'Authorization': \`Bearer \${ACCESS_TOKEN}\`
  }
});

const user = await userResponse.json();`
      }
    ]
  },
  {
    id: 'backend',
    title: 'Backend Integration',
    icon: 'Server',
    sections: [
      {
        title: 'Node.js (Express)',
        description: 'Complete backend integration with Express.js middleware.',
        language: 'javascript',
        code: `const express = require('express');
const { expressjwt: jwt } = require('express-jwt');
const jwksClient = require('jwks-rsa');

const app = express();

// JWT Verification Middleware
const jwtCheck = jwt({
  secret: jwksClient.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksUri: 'https://auth.boundary.com/.well-known/jwks.json'
  }),
  audience: 'https://api.yourapp.com',
  issuer: 'https://auth.boundary.com/',
  algorithms: ['RS256']
});

// Protected routes
app.use('/api', jwtCheck);

// User profile endpoint
app.get('/api/profile', (req, res) => {
  res.json(req.user);
});

app.listen(3000);`
      },
      {
        title: 'Python (FastAPI)',
        description: 'FastAPI integration with JWT verification.',
        language: 'python',
        code: `from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import requests

app = FastAPI()
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Verify JWT token
        jwks_url = "https://auth.boundary.com/.well-known/jwks.json"
        jwks_response = requests.get(jwks_url)
        jwks = jwks_response.json()
        
        # Decode and verify token
        decoded = jwt.decode(
            credentials.credentials, 
            jwks, 
            algorithms=["RS256"],
            audience="https://api.yourapp.com",
            issuer="https://auth.boundary.com"
        )
        return decoded
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/api/profile")
async def profile(current_user: dict = Depends(get_current_user)):
    return current_user`
      },
      {
        title: 'Java (Spring Boot)',
        description: 'Spring Security integration with OAuth2 Resource Server.',
        language: 'java',
        code: `@Configuration
@EnableWebSecurity
public class SecurityConfig extends WebSecurityConfigurerAdapter {
    
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/public").permitAll()
                .requestMatchers("/api/**").authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwkSetUri("https://auth.boundary.com/.well-known/jwks.json")
                    .issuer("https://auth.boundary.com")
                    .audience("https://api.yourapp.com")
                )
            );
    }
}

@RestController
@RequestMapping("/api")
public class ApiController {
    
    @GetMapping("/profile")
    public Map<String, Object> getProfile(@AuthenticationPrincipal Jwt jwt) {
        return jwt.getClaims();
    }
}`
      }
    ]
  },
  {
    id: 'mobile-web',
    title: 'Mobile Web / PWA',
    icon: 'Smartphone',
    sections: [
      {
        title: 'PKCE Authorization',
        description: 'Secure authorization for public clients using Proof Key for Code Exchange (PKCE).',
        language: 'javascript',
        code: `// 1. Generate Verifier and Challenge
const verifier = generateRandomString();
const challenge = await generateCodeChallenge(verifier);

// 2. Redirect with Challenge
const authUrl = \`\${ISSUER}/oauth/authorize?\` +
  \`client_id=\${CLIENT_ID}&\` +
  \`redirect_uri=\${REDIRECT_URI}&\` +
  \`response_type=code&\` +
  \`code_challenge=\${challenge}&\` +
  \`code_challenge_method=S256\`;`
      }
    ]
  },
  {
    id: 'mobile-app',
    title: 'Native Mobile App',
    icon: 'AppWindow',
    sections: [
      {
        title: 'React Native Integration',
        description: 'Using react-native-app-auth for secure native integration.',
        language: 'javascript',
        code: `import { authorize } from 'react-native-app-auth';

const config = {
  issuer: 'https://auth.boundary.com/oauth',
  clientId: 'YOUR_CLIENT_ID',
  redirectUrl: 'com.boundary.app:/oauth',
  scopes: ['openid', 'profile', 'email', 'offline_access'],
  usePKCE: true,
};

const result = await authorize(config);`
      },
      {
        title: 'Deep Link Configuration',
        description: 'Register your custom URL scheme in iOS (Info.plist) or Android (AndroidManifest.xml).',
        language: 'xml',
        code: `<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="com.boundary.app" android:path="/oauth" />
</intent-filter>`
      }
    ]
  },
  {
    id: 'mfa',
    title: 'Multi-Factor Authentication',
    icon: 'ShieldCheck',
    sections: [
      {
        title: 'Enable MFA for Users',
        description: 'Configure time-based OTP (TOTP) for enhanced security.',
        language: 'javascript',
        code: `// Enable MFA for a user
const enableMFA = async (userId) => {
  const response = await fetch('/api/auth/mfa/enable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  
  const { secret, qrCode } = await response.json();
  
  // Show QR code to user for scanning with authenticator app
  return { secret, qrCode };
};

// Verify MFA setup
const verifyMFA = async (userId, token) => {
  const response = await fetch('/api/auth/mfa/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, token })
  });
  
  return response.json();
};`
      },
      {
        title: 'MFA Login Flow',
        description: 'Handle MFA verification during authentication.',
        language: 'javascript',
        code: `const loginWithMFA = async (email, password, mfaToken) => {
  try {
    // Step 1: Normal login
    const loginResponse = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const { requiresMFA, tempToken } = await loginResponse.json();
    
    if (requiresMFA) {
      // Step 2: Verify MFA token
      const mfaResponse = await fetch('/api/auth/mfa/verify-login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${tempToken}\`
        },
        body: JSON.stringify({ token: mfaToken })
      });
      
      const { accessToken, refreshToken } = await mfaResponse.json();
      return { accessToken, refreshToken };
    }
    
    return loginResponse.json();
  } catch (error) {
    console.error('MFA login failed:', error);
  }
};`
      }
    ]
  },
  {
    id: 'saml',
    title: 'SAML SSO',
    icon: 'Building2',
    sections: [
      {
        title: 'SAML Service Provider Setup',
        description: 'Configure your application as a SAML Service Provider.',
        language: 'xml',
        code: `<!-- SAML Metadata Configuration -->
<EntityDescriptor entityID="https://yourapp.com/saml">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService 
      Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
      Location="https://yourapp.com/saml/acs"
      index="1" />
  </SPSSODescriptor>
</EntityDescriptor>`
      },
      {
        title: 'SAML Authentication Flow',
        description: 'Implement SAML authentication in your application.',
        language: 'javascript',
        code: `const express = require('express');
const { SamlStrategy } = require('passport-saml');
const passport = require('passport');

const samlStrategy = new SamlStrategy({
  entryPoint: 'https://auth.boundary.com/saml/login',
  issuer: 'https://yourapp.com/saml',
  callbackUrl: 'https://yourapp.com/saml/acs',
  cert: '-----BEGIN CERTIFICATE-----\n...SAML_CERT...\n-----END CERTIFICATE-----'
}, (profile, done) => {
  return done(null, profile);
});

passport.use(samlStrategy);

// SAML login route
app.get('/auth/saml', passport.authenticate('saml'));

// SAML callback route
app.post('/saml/acs', 
  passport.authenticate('saml', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);`
      }
    ]
  }
];
