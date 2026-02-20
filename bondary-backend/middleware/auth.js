// Authentication Middleware
const jwt = require('jsonwebtoken');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Access token required' 
      });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'bondarys-dev-secret-key';
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn('Invalid token attempt:', { error: err.message });
        return res.status(403).json({ 
          success: false,
          message: 'Invalid or expired token' 
        });
      }

      // Set user info from token
      req.user = {
        id: decoded.id || decoded.userId, // Support both token formats
        email: decoded.email,
        type: decoded.type
      };

      next();
    });
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Authentication error' 
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'bondarys-dev-secret-key';
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        req.user = null;
      } else {
        req.user = {
          id: decoded.id || decoded.userId, // Support both token formats
          email: decoded.email,
          type: decoded.type
        };
      }
      next();
    });
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
}; 

// Role-based access control middleware (CommonJS)
module.exports.requireRole = function(requiredRole) {
  return function(req, res, next) {
    try {
      // Prefer role injected upstream (e.g., API gateway) or attached to req.user by auth layer
      const roleFromRequest = req.userRole || (req.user && req.user.role);

      if (!roleFromRequest) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: role not present on request'
        });
      }

      if (roleFromRequest !== requiredRole && roleFromRequest !== 'super_admin') {
        return res.status(403).json({
          success: false,
          message: `Access denied: requires role ${requiredRole}`
        });
      }

      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Role verification failed'
      });
    }
  };
};