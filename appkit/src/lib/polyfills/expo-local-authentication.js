/**
 * Polyfill for expo-local-authentication in web environments.
 * Provides stub implementations that return sensible defaults.
 */

// Authentication types
export const AuthenticationType = {
  FINGERPRINT: 1,
  FACIAL_RECOGNITION: 2,
  IRIS: 3,
};

// Security levels
export const SecurityLevel = {
  NONE: 0,
  SECRET: 1,
  BIOMETRIC: 2,
};

// Check if device has biometric hardware
export async function hasHardwareAsync() {
  // Web doesn't have native biometric hardware
  return false;
}

// Check if biometric data is enrolled
export async function isEnrolledAsync() {
  return false;
}

// Get supported authentication types
export async function supportedAuthenticationTypesAsync() {
  return [];
}

// Get enrolled security level
export async function getEnrolledLevelAsync() {
  return SecurityLevel.NONE;
}

// Authenticate with biometrics
export async function authenticateAsync(options = {}) {
  console.warn('[expo-local-authentication polyfill] authenticateAsync called in web - returning failure');
  return {
    success: false,
    error: 'not_available',
    warning: 'Biometric authentication is not available in web environment',
  };
}

// Cancel authentication
export function cancelAuthenticate() {
  // No-op in web
}

export default {
  AuthenticationType,
  SecurityLevel,
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
  getEnrolledLevelAsync,
  authenticateAsync,
  cancelAuthenticate,
};
