/**
 * @deprecated OTP logic has been migrated to AppKit's OtpService.
 * bondary-backend now proxies OTP requests to AppKit via HTTP.
 *
 * This file is kept for reference only. Do NOT import this service.
 * All OTP operations go through:
 *   - AppKit: appkit/src/server/services/OtpService.ts
 *   - Routes: authRoutes.ts and identity.ts proxy to AppKit endpoints
 */

console.warn(
  '[DEPRECATED] bondary-backend/otpService.ts is deprecated. ' +
  'OTP logic now lives in AppKit. This file should not be imported.'
);

export {};
