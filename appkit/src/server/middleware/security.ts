import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
// @ts-ignore
import hpp from 'hpp';
import { Request, Response, NextFunction, Application } from 'express';

class SecurityMiddleware {
  private getCorsOrigins() {
    const origins = process.env.CORS_ORIGINS?.split(',') || [];
    
    if (process.env.NODE_ENV === 'development') {
      origins.push(
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
        'http://localhost:8081',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:3002'
      );
    }
    
    if (process.env.NODE_ENV === 'production') {
      if (process.env.FRONTEND_URL) origins.push(process.env.FRONTEND_URL);
      if (process.env.ADMIN_URL) origins.push(process.env.ADMIN_URL);
    }
    
    return origins.length > 0 ? origins : true;
  }

  applySecurityMiddleware(app: Application) {
    // Basic security headers
    app.use(helmet());
    
    // CORS configuration
    app.use(cors({
      origin: this.getCorsOrigins(),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    }));
    
    // Rate limiting
    app.use(rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
    }));
    
    // Parameter pollution protection
    app.use(hpp());
    
    // Additional security headers
    app.use(this.additionalSecurityHeaders);
    
    // Request validation
    app.use(this.validateRequest);
    
    console.log('âœ… Security middleware applied successfully');
  }

  private additionalSecurityHeaders(req: Request, res: Response, next: NextFunction) {
    // Remove server signature
    res.removeHeader('X-Powered-By');
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.appkit.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    // HSTS in production
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    next();
  }

  private validateRequest(req: Request, res: Response, next: NextFunction) {
    const suspiciousPatterns = [
      /\.\.\//,
      /<script/i,
      /union\s+select/i,
      /eval\s*\(/i,
    ];

    const requestString = `${req.method} ${req.url} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)}`;
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(requestString)) {
        console.warn('ðŸš¨ Suspicious request detected:', {
          ip: req.ip,
          method: req.method,
          url: req.url,
        });
        
        return res.status(400).json({
          error: 'Invalid request detected',
        });
      }
    }

    next();
  }
}

export const securityMiddleware = new SecurityMiddleware();
export default securityMiddleware;
