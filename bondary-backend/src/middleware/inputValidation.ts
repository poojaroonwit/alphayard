import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format');
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');

export const uuidSchema = z.string().uuid('Invalid ID format');
export const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/, 'Invalid phone number format');

// Request body validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name too long'),
  phoneNumber: phoneSchema.optional(),
});

export const passwordResetSchema = z.object({
  email: emailSchema,
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phoneNumber: phoneSchema.optional(),
  bio: z.string().max(500).optional(),
});

// Query parameter validation
export const paginationSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('20'),
  sort: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, 'End date must be after start date');

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1),
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
});

class InputValidationMiddleware {
  /**
   * Validate request body against a schema
   */
  static validateBody(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = schema.safeParse(req.body);
        
        if (!result.success) {
          const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }));
          
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors,
          });
        }
        
        // Replace request body with validated data
        req.body = result.data;
        next();
      } catch (error) {
        console.error('Validation error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal validation error',
        });
      }
    };
  }

  /**
   * Validate query parameters
   */
  static validateQuery(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = schema.safeParse(req.query);
        
        if (!result.success) {
          const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }));
          
          return res.status(400).json({
            success: false,
            error: 'Query validation failed',
            details: errors,
          });
        }
        
        // Replace request query with validated data
        req.query = result.data;
        next();
      } catch (error) {
        console.error('Query validation error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal validation error',
        });
      }
    };
  }

  /**
   * Validate URL parameters
   */
  static validateParams(schema: z.ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = schema.safeParse(req.params);
        
        if (!result.success) {
          const errors = result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }));
          
          return res.status(400).json({
            success: false,
            error: 'Parameter validation failed',
            details: errors,
          });
        }
        
        // Replace request params with validated data
        req.params = result.data;
        next();
      } catch (error) {
        console.error('Parameter validation error:', error);
        res.status(500).json({
          success: false,
          error: 'Internal validation error',
        });
      }
    };
  }

  /**
   * Sanitize input to prevent XSS and injection attacks
   */
  static sanitizeInput(req: Request, res: Response, next: NextFunction) {
    const sanitizeString = (str: string): string => {
      return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    };

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }

      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          sanitized[key] = sanitizeString(value);
        } else if (typeof value === 'object') {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    };

    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }

    next();
  }

  /**
   * Check for common attack patterns
   */
  static detectSuspiciousContent(req: Request, res: Response, next: NextFunction) {
    const attackPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /exec\s*\(/gi,
      /union\s+select/gi,
      /drop\s+table/gi,
      /insert\s+into/gi,
      /delete\s+from/gi,
      /update\s+set/gi,
      /\.\.\//g,
      /file:\/\//gi,
      /data:text\/html/gi,
    ];

    const checkString = (str: string): boolean => {
      return attackPatterns.some(pattern => pattern.test(str));
    };

    const requestString = JSON.stringify({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (checkString(requestString)) {
      console.warn('🚨 Suspicious content detected:', {
        ip: req.ip,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
      });

      return res.status(400).json({
        success: false,
        error: 'Invalid request content detected',
      });
    }

    next();
  }
}

export default InputValidationMiddleware;
