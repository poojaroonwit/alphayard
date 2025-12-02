// Jimp Error Handler - Suppress non-critical Jimp errors
// These errors occur when Jimp tries to process null/invalid image buffers
// They don't affect app functionality but clutter the console

(function setupJimpErrorHandler() {
  if (typeof global === 'undefined') return;

  // Suppress in console.error
  if (typeof console !== 'undefined' && console.error) {
    const originalError = console.error;
    console.error = function(...args: any[]) {
      const message = args[0]?.toString() || '';
      const errorObj = args[0];
      
      // Filter out Jimp MIME errors (non-critical)
      if (
        message.includes('Could not find MIME for Buffer') ||
        message.includes('jimp-compact') ||
        message.includes('parseBitmap') ||
        (args[1] && args[1].toString().includes('jimp'))
      ) {
        // Suppress this specific error - it's non-critical
        return;
      }
      
      // Filter out expected API errors (404, 401) - these are handled gracefully
      if (
        (errorObj && typeof errorObj === 'object' && (
          errorObj.code === 'NOT_FOUND' ||
          errorObj.code === 'UNAUTHORIZED' ||
          (errorObj.response && (errorObj.response.status === 404 || errorObj.response.status === 401))
        )) ||
        message.includes('Resource not found') ||
        message.includes('NOT_FOUND') ||
        message.includes('UNAUTHORIZED')
      ) {
        // Suppress expected API errors - they're handled gracefully in the app
        return;
      }
      
      // Pass through all other errors
      originalError.apply(console, args);
    };
  }

  // Also catch unhandled promise rejections
  if (typeof process !== 'undefined' && process.on) {
    const originalUnhandledRejection = process.listeners('unhandledRejection')[0];
    process.removeAllListeners('unhandledRejection');
    process.on('unhandledRejection', (reason: any) => {
      if (reason && typeof reason === 'object' && reason.message) {
        const msg = reason.message.toString();
        if (msg.includes('Could not find MIME for Buffer') || msg.includes('jimp')) {
          return; // Suppress
        }
      }
      if (originalUnhandledRejection) {
        originalUnhandledRejection(reason);
      }
    });
  }

  // Patch Jimp module if it exists (try to catch it early)
  try {
    const Module = require('module');
    const originalRequire = Module.prototype.require;
    Module.prototype.require = function(id: string) {
      const module = originalRequire.apply(this, arguments);
      if (id.includes('jimp-compact') && module && module.parseBitmap) {
        const originalParseBitmap = module.parseBitmap;
        module.parseBitmap = function(...args: any[]) {
          try {
            return originalParseBitmap.apply(this, args);
          } catch (error: any) {
            if (error && error.message && error.message.includes('Could not find MIME for Buffer')) {
              // Return a resolved promise to prevent error propagation
              return Promise.resolve();
            }
            throw error;
          }
        };
      }
      return module;
    };
  } catch {
    // Module patching not available
  }
})();

export {};
