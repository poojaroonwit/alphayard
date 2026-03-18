# OTP Migration Implementation Plan

Relocate the robust OTP logic from `bondary-backend` (application-specific) to `appkit` (platform-core) to centralize identity management and reuse existing communication infrastructure.

## Proposed Changes

### AppKit Platform (Identity Provider)

#### [NEW] [OtpService](file:///c:/Users/Zenbook/Desktop/Hobbie/alphayard/appkit/src/server/services/OtpService.ts)
- Create a platform-level [OtpService](file:///c:/Users/Zenbook/Desktop/Hobbie/alphayard/bondary-backend/src/services/otpService.ts#6-73) in `appkit`.
- Use `appkit`'s [RedisService](file:///c:/Users/Zenbook/Desktop/Hobbie/alphayard/appkit/src/server/services/redisService.ts#10-122) for 10-minute expiry and one-time use.
- Use `crypto.randomInt` for secure 6-digit codes.

#### [MODIFY] [request/route.ts](file:///c:/Users/Zenbook/Desktop/Hobbie/alphayard/appkit/src/app/api/v1/auth/otp/request/route.ts)
- Replace mock logic with `OtpService.requestOtp`.
- Remove `user.preferences` pollution.

#### [MODIFY] [login/route.ts](file:///c:/Users/Zenbook/Desktop/Hobbie/alphayard/appkit/src/app/api/v1/identity/otp/login/route.ts)
- Replace mock logic with `OtpService.verifyOtp`.
- Issue standard AppKit JWTs.

---

### Bondary Backend (Application Gateway)

#### [MODIFY] [authRoutes.ts](file:///c:/Users/Zenbook/Desktop/Hobbie/alphayard/bondary-backend/src/routes/mobile/authRoutes.ts)
- Refactor `POST /auth/otp/request` to proxy to `http://localhost:3002/api/v1/auth/otp/request`.

#### [MODIFY] [identity.ts](file:///c:/Users/Zenbook/Desktop/Hobbie/alphayard/bondary-backend/src/routes/mobile/identity.ts)
- Refactor `POST /identity/otp/login` to proxy to `http://localhost:3002/api/v1/identity/otp/login`.

## Verification Plan

### Automated Tests
- `curl -X POST http://localhost:4000/api/v1/auth/otp/request -d '{"phone": "..."}'`
- Verify OTP is sent (via logs/Twilio).
- `curl -X POST http://localhost:4000/api/v1/identity/otp/login -d '{"phone": "...", "otp": "..."}'`
- Verify successful login and JWT return.
