// Identity Management Service
import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

// =====================================================
// INTERFACES
// =====================================================

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  refreshToken?: string;
  deviceId?: string;
  deviceType?: string;
  deviceName?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  isActive: boolean;
  lastActivityAt: string;
  expiresAt: string;
  isRemembered: boolean;
  mfaVerified: boolean;
  riskScore: number;
  createdAt: string;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
}

export interface UserDevice {
  id: string;
  userId: string;
  deviceFingerprint: string;
  deviceName?: string;
  deviceType: string;
  brand?: string;
  model?: string;
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  pushToken?: string;
  pushEnabled: boolean;
  isTrusted: boolean;
  isCurrent: boolean;
  trustLevel: string;
  firstSeenAt: string;
  lastSeenAt: string;
  lastIpAddress?: string;
  lastLocationCountry?: string;
  lastLocationCity?: string;
  loginCount: number;
  failedLoginCount: number;
  isBlocked: boolean;
  blockedAt?: string;
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMFA {
  id: string;
  userId: string;
  mfaType: string;
  isEnabled: boolean;
  isPrimary: boolean;
  totpSecret?: string;
  totpVerifiedAt?: string;
  phoneNumber?: string;
  email?: string;
  backupCodesUsed: number;
  lastUsedAt?: string;
  useCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityPolicy {
  id: string;
  applicationId?: string;
  policyName: string;
  policyType: string;
  isActive: boolean;
  priority: number;
  // Password
  passwordMinLength: number;
  passwordMaxLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecial: boolean;
  passwordHistoryCount: number;
  passwordExpiryDays: number;
  // Lockout
  lockoutEnabled: boolean;
  lockoutThreshold: number;
  lockoutDurationMinutes: number;
  lockoutResetAfterMinutes: number;
  // Session
  sessionTimeoutMinutes: number;
  sessionMaxConcurrent: number;
  // MFA
  mfaRequired: boolean;
  mfaRequiredForRoles: string[];
  mfaRememberDeviceDays: number;
  mfaAllowedTypes: string[];
  // IP
  ipWhitelist: string[];
  ipBlacklist: string[];
  ipGeoWhitelist: string[];
  ipGeoBlacklist: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId?: string;
  email?: string;
  username?: string;
  loginMethod: string;
  socialProvider?: string;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  deviceId?: string;
  country?: string;
  city?: string;
  mfaRequired: boolean;
  mfaMethod?: string;
  mfaSuccess?: boolean;
  riskScore: number;
  isSuspicious: boolean;
  suspiciousReason?: string;
  sessionId?: string;
  createdAt: string;
}

export interface OAuthProvider {
  id: string;
  applicationId?: string;
  providerName: string;
  displayName: string;
  isEnabled: boolean;
  clientId: string;
  clientSecret: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userinfoUrl?: string;
  scopes: string[];
  claimsMapping: Record<string, string>;
  allowSignup: boolean;
  requireEmailVerified: boolean;
  autoLinkByEmail: boolean;
  iconUrl?: string;
  buttonColor?: string;
  buttonText?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserGroup {
  id: string;
  applicationId?: string;
  name: string;
  slug: string;
  description?: string;
  roleId?: string;
  permissions: string[];
  isSystem: boolean;
  isDefault: boolean;
  metadata: Record<string, any>;
  color?: string;
  icon?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IdentityAuditEntry {
  id: string;
  actorType: string;
  actorId?: string;
  actorEmail?: string;
  targetType: string;
  targetId?: string;
  targetEmail?: string;
  action: string;
  actionCategory?: string;
  description?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  sessionId?: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

export async function getSessions(userId: string, options?: {
  includeExpired?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ sessions: UserSession[]; total: number }> {
  const { includeExpired = false, limit = 50, offset = 0 } = options || {};
  
  try {
    // Use Prisma model for type-safe querying
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        ...(includeExpired ? {} : { expiresAt: { gt: new Date() } }),
      },
      orderBy: { lastActivityAt: 'desc' },
      take: limit,
      skip: offset,
    });
    
    const total = await prisma.userSession.count({
      where: {
        userId,
        ...(includeExpired ? {} : { expiresAt: { gt: new Date() } }),
      },
    });
    
    return {
      sessions: sessions.map(s => {
        return {
          id: s.id,
          userId: s.userId,
          sessionToken: s.sessionToken || '',
          refreshToken: undefined,
          deviceId: s.deviceId ?? undefined,
          deviceType: s.deviceType ?? undefined,
          deviceName: s.deviceName ?? undefined,
          browser: s.browser ?? undefined,
          browserVersion: s.browserVersion ?? undefined,
          os: s.os ?? undefined,
          osVersion: s.osVersion ?? undefined,
          ipAddress: s.ipAddress || undefined,
          country: undefined,
          city: undefined,
          isActive: s.expiresAt > new Date(),
          lastActivityAt: s.lastActivityAt.toISOString(),
          expiresAt: s.expiresAt.toISOString(),
          isRemembered: false,
          mfaVerified: false,
          riskScore: 0,
          createdAt: s.createdAt.toISOString(),
          revokedAt: undefined,
          revokedBy: undefined,
          revokeReason: undefined,
        };
      }),
      total,
    };
  } catch (error: any) {
    console.warn('[identityService.getSessions] Error:', error.message);
    // Return empty result if table doesn't exist or other errors
    return { sessions: [], total: 0 };
  }
}

export async function getSessionById(sessionId: string): Promise<UserSession | null> {
  const session = await prisma.userSession.findUnique({
    where: { id: sessionId }
  });
  return session ? mapSession(session) : null;
}

export async function createSession(data: {
  userId: string;
  deviceId?: string;
  deviceType?: string;
  deviceName?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
  isRemembered?: boolean;
  expiresInHours?: number;
}): Promise<UserSession> {
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (data.expiresInHours || 24));
  
  const result = await prisma.userSession.create({
    data: {
      userId: data.userId,
      sessionToken: sessionToken,
      refreshToken: refreshToken,
      deviceId: data.deviceId,
      deviceType: data.deviceType,
      deviceName: data.deviceName,
      browser: data.browser,
      os: data.os,
      ipAddress: data.ipAddress,
      country: data.country,
      city: data.city,
      isRemembered: data.isRemembered || false,
      expiresAt: expiresAt
    }
  });
  
  return mapSession(result);
}

export async function revokeSession(
  sessionId: string,
  revokedBy?: string,
  reason?: string
): Promise<void> {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: {
      isActive: false,
      revokedAt: new Date(),
      revokedBy: revokedBy,
      revokeReason: reason
    }
  });
}

export async function revokeAllSessions(
  userId: string,
  exceptSessionId?: string,
  revokedBy?: string
): Promise<number> {
  let query = `
    UPDATE public.user_sessions SET
      is_active = false,
      revoked_at = NOW(),
      revoked_by = ${revokedBy ? `'${revokedBy}'::uuid` : 'NULL'},
      revoke_reason = 'Revoked all sessions'
    WHERE user_id = '${userId}'::uuid AND is_active = true
  `;
  
  if (exceptSessionId) {
    query += ` AND id != '${exceptSessionId}'::uuid`;
  }
  
  const result = await prisma.$executeRawUnsafe(query);
  return result;
}

export async function updateSessionActivity(sessionId: string): Promise<void> {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { lastActivityAt: new Date() }
  });
}

// =====================================================
// DEVICE MANAGEMENT
// =====================================================

export async function getDevices(userId: string): Promise<UserDevice[]> {
  try {
    const devices = await prisma.userDevice.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
    
    return devices.map(d => ({
      id: d.id,
      userId: d.userId,
      deviceFingerprint: d.deviceFingerprint ?? '',
      deviceName: d.deviceName || undefined,
      deviceType: d.deviceType || 'unknown',
      brand: undefined,
      model: undefined,
      os: d.os || undefined,
      osVersion: d.osVersion || undefined,
      browser: undefined,
      browserVersion: undefined,
      pushToken: d.pushToken || undefined,
      pushEnabled: !!d.pushToken,
      isTrusted: d.isActive,
      isCurrent: false,
      trustLevel: d.isActive ? 'trusted' : 'unknown',
      firstSeenAt: d.createdAt.toISOString(),
      lastSeenAt: (d.lastSeenAt || d.createdAt).toISOString(),
      lastIpAddress: undefined,
      lastLocationCountry: undefined,
      lastLocationCity: undefined,
      loginCount: 0,
      failedLoginCount: 0,
      isBlocked: !d.isActive,
      blockedAt: undefined,
      blockedReason: undefined,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    }));
  } catch (error: any) {
    console.warn('[identityService.getDevices] Error:', error.message);
    return [];
  }
}

export async function getDeviceById(deviceId: string): Promise<UserDevice | null> {
  const device = await prisma.userDevice.findUnique({
    where: { id: deviceId }
  });
  return device ? mapDevice(device) : null;
}

export async function registerDevice(data: {
  userId: string;
  deviceFingerprint: string;
  deviceName?: string;
  deviceType: string;
  brand?: string;
  model?: string;
  os?: string;
  osVersion?: string;
  browser?: string;
  browserVersion?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
}): Promise<UserDevice> {
  // Check if device already exists
  const existing = await prisma.userDevice.findFirst({
    where: {
      userId: data.userId,
      deviceFingerprint: data.deviceFingerprint
    }
  });
  
  if (existing) {
    // Update existing device
    const deviceName = data.deviceName || null;
    const os = data.os || null;
    const osVersion = data.osVersion || null;
    const browser = data.browser || null;
  }
  
  const result = await prisma.$queryRaw<any[]>`
    INSERT INTO public.user_devices (
      user_id, device_fingerprint, device_name, device_type, brand, model,
      os, os_version, browser, browser_version, last_ip_address,
      last_location_country, last_location_city
    ) VALUES (
      ${data.userId}::uuid, ${data.deviceFingerprint}, ${data.deviceName || null}, 
      ${data.deviceType}, ${data.brand || null}, ${data.model || null},
      ${data.os || null}, ${data.osVersion || null}, ${data.browser || null},
      ${data.browserVersion || null}, ${data.ipAddress || null}, 
      ${data.country || null}, ${data.city || null}
    )
    RETURNING *
  `;
  
  return mapDevice(result[0]);
}

export async function trustDevice(deviceId: string, trusted: boolean): Promise<void> {
  const trustLevel = trusted ? 1 : 0; // Convert to number for database
  await prisma.userDevice.update({
    where: { id: deviceId },
    data: {
      isTrusted: trusted,
      trustLevel: trustLevel,
      updatedAt: new Date()
    }
  });
}

export async function blockDevice(deviceId: string, reason?: string): Promise<void> {
  await prisma.userDevice.update({
    where: { id: deviceId },
    data: {
      isBlocked: true,
      blockedAt: new Date(),
      blockedReason: reason || null,
      updatedAt: new Date()
    }
  });
}

export async function unblockDevice(deviceId: string): Promise<void> {
  await prisma.userDevice.update({
    where: { id: deviceId },
    data: {
      isBlocked: false,
      blockedAt: null,
      blockedReason: null,
      updatedAt: new Date()
    }
  });
}

export async function deleteDevice(deviceId: string): Promise<void> {
  // Revoke all sessions for this device first
  await prisma.userSession.updateMany({
    where: { deviceId: deviceId },
    data: {
      isActive: false,
      revokeReason: 'Device removed'
    }
  });
  
  await prisma.userDevice.delete({
    where: { id: deviceId }
  });
}

// =====================================================
// MFA MANAGEMENT
// =====================================================

export async function getMFASettings(userId: string): Promise<UserMFA[]> {
  const result = await prisma.userMFA.findMany({
    where: { userId: userId },
    orderBy: [
      { isPrimary: 'desc' },
      { mfaType: 'asc' }
    ]
  });
  return result.map(mapMFA);
}

export async function enableMFA(userId: string, mfaType: string, data: {
  totpSecret?: string;
  phoneNumber?: string;
  email?: string;
  isPrimary?: boolean;
}): Promise<UserMFA> {
  const result = await prisma.userMFA.upsert({
    where: {
      userId_mfaType: {
        userId: userId,
        mfaType: mfaType
      }
    },
    update: {
      isEnabled: true,
      isPrimary: data.isPrimary || false,
      totpSecret: data.totpSecret,
      phoneNumber: data.phoneNumber,
      email: data.email,
      updatedAt: new Date()
    },
    create: {
      userId: userId,
      mfaType: mfaType,
      isEnabled: true,
      isPrimary: data.isPrimary || false,
      totpSecret: data.totpSecret,
      phoneNumber: data.phoneNumber,
      email: data.email
    }
  });
  
  return mapMFA(result);
}

export async function disableMFA(userId: string, mfaType: string): Promise<void> {
  await prisma.userMFA.updateMany({
    where: {
      userId: userId,
      mfaType: mfaType
    },
    data: {
      isEnabled: false,
      updatedAt: new Date()
    }
  });
}

export async function generateBackupCodes(userId: string): Promise<string[]> {
  const codes: string[] = [];
  const hashedCodes: string[] = [];
  
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
    hashedCodes.push(await bcrypt.hash(code, 10));
  }
  
  await prisma.userMFA.upsert({
    where: {
      userId_mfaType: {
        userId: userId,
        mfaType: 'backup_codes'
      }
    },
    update: {
      isEnabled: true,
      backupCodes: hashedCodes,
      backupCodesGeneratedAt: new Date(),
      backupCodesUsed: 0,
      updatedAt: new Date()
    },
    create: {
      userId: userId,
      mfaType: 'backup_codes',
      isEnabled: true,
      backupCodes: hashedCodes,
      backupCodesGeneratedAt: new Date(),
      backupCodesUsed: 0
    }
  });
  
  return codes;
}

export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const mfa = await prisma.userMFA.findFirst({
    where: {
      userId: userId,
      mfaType: 'backup_codes',
      isEnabled: true
    }
  });
  
  if (!mfa?.backupCodes) return false;
  
  const hashedCodes: string[] = mfa.backupCodes as string[];
  
  for (let i = 0; i < hashedCodes.length; i++) {
    if (await bcrypt.compare(code.toUpperCase(), hashedCodes[i])) {
      // Remove used code
      hashedCodes.splice(i, 1);
      await prisma.userMFA.update({
        where: { id: mfa.id },
        data: {
          backupCodes: hashedCodes,
          backupCodesUsed: (mfa.backupCodesUsed || 0) + 1,
          lastUsedAt: new Date(),
          updatedAt: new Date()
        }
      });
      return true;
    }
  }
  
  return false;
}

// =====================================================
// SECURITY POLICIES
// =====================================================

export async function getSecurityPolicies(applicationId?: string): Promise<SecurityPolicy[]> {
  let query = 'SELECT * FROM public.security_policies WHERE is_active = true';
  const params: any[] = [];
  
  if (applicationId) {
    query += ` AND (application_id = '${applicationId}'::uuid OR application_id IS NULL)`;
  } else {
    query += ' AND application_id IS NULL';
  }
  
  query += ' ORDER BY priority DESC';
  
  const result = await prisma.$queryRawUnsafe<any[]>(query);
  return result.map(mapSecurityPolicy);
}

export async function getSecurityPolicy(policyId: string): Promise<SecurityPolicy | null> {
  const result = await prisma.$queryRaw<any[]>`
    SELECT * FROM public.security_policies WHERE id = ${policyId}::uuid
  `;
  return result[0] ? mapSecurityPolicy(result[0]) : null;
}

export async function createSecurityPolicy(data: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
  const result = await prisma.$queryRaw<any[]>`
    INSERT INTO public.security_policies (
      application_id, policy_name, policy_type, is_active, priority,
      password_min_length, password_max_length, password_require_uppercase,
      password_require_lowercase, password_require_number, password_require_special,
      password_history_count, password_expiry_days,
      lockout_enabled, lockout_threshold, lockout_duration_minutes, lockout_reset_after_minutes,
      session_timeout_minutes, session_max_concurrent,
      mfa_required, mfa_required_for_roles, mfa_remember_device_days, mfa_allowed_types,
      ip_whitelist, ip_blacklist, ip_geo_whitelist, ip_geo_blacklist
    ) VALUES (
      ${data.applicationId || null}::uuid, ${data.policyName}, ${data.policyType || 'global'}, 
      ${data.isActive ?? true}, ${data.priority || 0},
      ${data.passwordMinLength || 8}, ${data.passwordMaxLength || 128}, 
      ${data.passwordRequireUppercase ?? true}, ${data.passwordRequireLowercase ?? true}, 
      ${data.passwordRequireNumber ?? true}, ${data.passwordRequireSpecial ?? false},
      ${data.passwordHistoryCount || 5}, ${data.passwordExpiryDays || 0},
      ${data.lockoutEnabled ?? true}, ${data.lockoutThreshold || 5}, 
      ${data.lockoutDurationMinutes || 30}, ${data.lockoutResetAfterMinutes || 60},
      ${data.sessionTimeoutMinutes || 60}, ${data.sessionMaxConcurrent || 5},
      ${data.mfaRequired ?? false}, ${JSON.stringify(data.mfaRequiredForRoles || [])}::jsonb, 
      ${data.mfaRememberDeviceDays || 30}, ${JSON.stringify(data.mfaAllowedTypes || ['totp', 'sms', 'email'])}::jsonb,
      ${JSON.stringify(data.ipWhitelist || [])}::jsonb, ${JSON.stringify(data.ipBlacklist || [])}::jsonb, 
      ${JSON.stringify(data.ipGeoWhitelist || [])}::jsonb, ${JSON.stringify(data.ipGeoBlacklist || [])}::jsonb
    )
    RETURNING *
  `;
  
  return mapSecurityPolicy(result[0]);
}

export async function updateSecurityPolicy(policyId: string, data: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  const fieldMappings: Record<string, string> = {
    policyName: 'policy_name',
    isActive: 'is_active',
    priority: 'priority',
    passwordMinLength: 'password_min_length',
    passwordMaxLength: 'password_max_length',
    passwordRequireUppercase: 'password_require_uppercase',
    passwordRequireLowercase: 'password_require_lowercase',
    passwordRequireNumber: 'password_require_number',
    passwordRequireSpecial: 'password_require_special',
    passwordHistoryCount: 'password_history_count',
    passwordExpiryDays: 'password_expiry_days',
    lockoutEnabled: 'lockout_enabled',
    lockoutThreshold: 'lockout_threshold',
    lockoutDurationMinutes: 'lockout_duration_minutes',
    lockoutResetAfterMinutes: 'lockout_reset_after_minutes',
    sessionTimeoutMinutes: 'session_timeout_minutes',
    sessionMaxConcurrent: 'session_max_concurrent',
    mfaRequired: 'mfa_required',
    mfaRequiredForRoles: 'mfa_required_for_roles',
    mfaRememberDeviceDays: 'mfa_remember_device_days',
    mfaAllowedTypes: 'mfa_allowed_types',
    ipWhitelist: 'ip_whitelist',
    ipBlacklist: 'ip_blacklist',
    ipGeoWhitelist: 'ip_geo_whitelist',
    ipGeoBlacklist: 'ip_geo_blacklist',
  };
  
  for (const [key, dbField] of Object.entries(fieldMappings)) {
    if (data[key as keyof SecurityPolicy] !== undefined) {
      const value = data[key as keyof SecurityPolicy];
      if (Array.isArray(value)) {
        fields.push(`${dbField} = $${paramIndex++}::jsonb`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${dbField} = $${paramIndex++}`);
        values.push(value);
      }
    }
  }
  
  if (fields.length === 0) {
    const existing = await getSecurityPolicy(policyId);
    if (!existing) throw new Error('Policy not found');
    return existing;
  }
  
  fields.push('updated_at = NOW()');
  values.push(policyId);
  
  const query = `UPDATE public.security_policies SET ${fields.join(', ')} WHERE id = $${paramIndex}::uuid RETURNING *`;
  const result = await prisma.$queryRawUnsafe<any[]>(query, ...values);
  
  return mapSecurityPolicy(result[0]);
}

export async function deleteSecurityPolicy(policyId: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM public.security_policies WHERE id = ${policyId}::uuid
  `;
}

// =====================================================
// LOGIN HISTORY
// =====================================================

export async function getLoginHistory(options: {
  userId?: string;
  email?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  suspicious?: boolean;
}): Promise<{ entries: LoginHistoryEntry[]; total: number }> {
  const { limit = 50, offset = 0 } = options;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;
  
  if (options.userId) {
    conditions.push(`user_id = $${paramIndex++}::uuid`);
    params.push(options.userId);
  }
  if (options.email) {
    conditions.push(`email = $${paramIndex++}`);
    params.push(options.email);
  }
  if (options.startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(options.startDate);
  }
  if (options.endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(options.endDate);
  }
  if (options.success !== undefined) {
    conditions.push(`success = $${paramIndex++}`);
    params.push(options.success);
  }
  if (options.suspicious !== undefined) {
    conditions.push(`is_suspicious = $${paramIndex++}`);
    params.push(options.suspicious);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const countQuery = `SELECT COUNT(*)::bigint as count FROM public.login_history ${whereClause}`;
  const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(countQuery, ...params);
  
  params.push(limit, offset);
  const resultQuery = `SELECT * FROM public.login_history ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
  const result = await prisma.$queryRawUnsafe<any[]>(resultQuery, ...params);
  
  return {
    entries: result.map(mapLoginHistory),
    total: Number(countResult[0]?.count || 0),
  };
}

export async function logLoginAttempt(data: {
  userId?: string;
  email?: string;
  username?: string;
  loginMethod: string;
  socialProvider?: string;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  deviceId?: string;
  country?: string;
  city?: string;
  mfaRequired?: boolean;
  mfaMethod?: string;
  mfaSuccess?: boolean;
  riskScore?: number;
  isSuspicious?: boolean;
  suspiciousReason?: string;
  sessionId?: string;
}): Promise<LoginHistoryEntry> {
  const result = await prisma.$queryRaw<any[]>`
    INSERT INTO public.login_history (
      user_id, email, username, login_method, social_provider, success, failure_reason,
      ip_address, user_agent, device_type, device_id, country, city,
      mfa_required, mfa_method, mfa_success, risk_score, is_suspicious, suspicious_reason, session_id
    ) VALUES (
      ${data.userId || null}::uuid, ${data.email || null}, ${data.username || null}, 
      ${data.loginMethod}, ${data.socialProvider || null}, ${data.success}, 
      ${data.failureReason || null}, ${data.ipAddress || null}, ${data.userAgent || null}, 
      ${data.deviceType || null}, ${data.deviceId || null}::uuid, ${data.country || null}, 
      ${data.city || null}, ${data.mfaRequired || false}, ${data.mfaMethod || null}, 
      ${data.mfaSuccess || null}, ${data.riskScore || 0}, ${data.isSuspicious || false}, 
      ${data.suspiciousReason || null}, ${data.sessionId || null}::uuid
    )
    RETURNING *
  `;
  
  return mapLoginHistory(result[0]);
}

// =====================================================
// OAUTH PROVIDERS
// =====================================================

export async function getOAuthProviders(applicationId?: string): Promise<OAuthProvider[]> {
  let query = 'SELECT * FROM public.oauth_providers';
  
  if (applicationId) {
    query += ` WHERE application_id = '${applicationId}'::uuid OR application_id IS NULL`;
  }
  
  query += ' ORDER BY display_order, provider_name';
  
  const result = await prisma.$queryRawUnsafe<any[]>(query);
  return result.map(mapOAuthProvider);
}

export async function getOAuthProvider(providerId: string): Promise<OAuthProvider | null> {
  const result = await prisma.$queryRaw<any[]>`
    SELECT * FROM public.oauth_providers WHERE id = ${providerId}::uuid
  `;
  return result[0] ? mapOAuthProvider(result[0]) : null;
}

export async function createOAuthProvider(data: Partial<OAuthProvider>): Promise<OAuthProvider> {
  const result = await prisma.$queryRaw<any[]>`
    INSERT INTO public.oauth_providers (
      application_id, provider_name, display_name, is_enabled, client_id, client_secret,
      authorization_url, token_url, userinfo_url, scopes, claims_mapping,
      allow_signup, require_email_verified, auto_link_by_email,
      icon_url, button_color, button_text, display_order
    ) VALUES (
      ${data.applicationId || null}::uuid, ${data.providerName}, ${data.displayName}, 
      ${data.isEnabled ?? false}, ${data.clientId}, ${data.clientSecret}, 
      ${data.authorizationUrl || null}, ${data.tokenUrl || null}, ${data.userinfoUrl || null}, 
      ${JSON.stringify(data.scopes || ['email', 'profile'])}::jsonb, 
      ${JSON.stringify(data.claimsMapping || {})}::jsonb,
      ${data.allowSignup ?? true}, ${data.requireEmailVerified ?? true}, 
      ${data.autoLinkByEmail ?? false}, ${data.iconUrl || null}, ${data.buttonColor || null}, 
      ${data.buttonText || null}, ${data.displayOrder || 0}
    )
    RETURNING *
  `;
  
  return mapOAuthProvider(result[0]);
}

export async function updateOAuthProvider(providerId: string, data: Partial<OAuthProvider>): Promise<OAuthProvider> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  const fieldMappings: Record<string, string> = {
    displayName: 'display_name',
    isEnabled: 'is_enabled',
    clientId: 'client_id',
    clientSecret: 'client_secret',
    authorizationUrl: 'authorization_url',
    tokenUrl: 'token_url',
    userinfoUrl: 'userinfo_url',
    scopes: 'scopes',
    claimsMapping: 'claims_mapping',
    allowSignup: 'allow_signup',
    requireEmailVerified: 'require_email_verified',
    autoLinkByEmail: 'auto_link_by_email',
    iconUrl: 'icon_url',
    buttonColor: 'button_color',
    buttonText: 'button_text',
    displayOrder: 'display_order',
  };
  
  for (const [key, dbField] of Object.entries(fieldMappings)) {
    if (data[key as keyof OAuthProvider] !== undefined) {
      const value = data[key as keyof OAuthProvider];
      if (typeof value === 'object' && value !== null) {
        fields.push(`${dbField} = $${paramIndex++}::jsonb`);
        values.push(JSON.stringify(value));
      } else {
        fields.push(`${dbField} = $${paramIndex++}`);
        values.push(value);
      }
    }
  }
  
  if (fields.length === 0) {
    const existing = await getOAuthProvider(providerId);
    if (!existing) throw new Error('Provider not found');
    return existing;
  }
  
  fields.push('updated_at = NOW()');
  values.push(providerId);
  
  const query = `UPDATE public.oauth_providers SET ${fields.join(', ')} WHERE id = $${paramIndex}::uuid RETURNING *`;
  const result = await prisma.$queryRawUnsafe<any[]>(query, ...values);
  
  return mapOAuthProvider(result[0]);
}

export async function deleteOAuthProvider(providerId: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM public.oauth_providers WHERE id = ${providerId}::uuid
  `;
}

// =====================================================
// USER GROUPS
// =====================================================

export async function getUserGroups(applicationId?: string): Promise<UserGroup[]> {
  let query = 'SELECT * FROM public.user_groups';
  
  if (applicationId) {
    query += ` WHERE application_id = '${applicationId}'::uuid OR application_id IS NULL`;
  }
  
  query += ' ORDER BY is_system DESC, name';
  
  const result = await prisma.$queryRawUnsafe<any[]>(query);
  return result.map(mapUserGroup);
}

export async function getUserGroup(groupId: string): Promise<UserGroup | null> {
  const result = await prisma.$queryRaw<any[]>`
    SELECT * FROM public.user_groups WHERE id = ${groupId}::uuid
  `;
  return result[0] ? mapUserGroup(result[0]) : null;
}

export async function createUserGroup(data: Partial<UserGroup>): Promise<UserGroup> {
  const slug = data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  const result = await prisma.$queryRaw<any[]>`
    INSERT INTO public.user_groups (
      application_id, name, slug, description, role_id, permissions,
      is_system, is_default, metadata, color, icon
    ) VALUES (
      ${data.applicationId || null}::uuid, ${data.name}, ${slug}, ${data.description || null}, 
      ${data.roleId || null}::uuid, ${JSON.stringify(data.permissions || [])}::jsonb, 
      ${data.isSystem ?? false}, ${data.isDefault ?? false}, 
      ${JSON.stringify(data.metadata || {})}::jsonb, ${data.color || null}, ${data.icon || null}
    )
    RETURNING *
  `;
  
  return mapUserGroup(result[0]);
}

export async function updateUserGroup(groupId: string, data: Partial<UserGroup>): Promise<UserGroup> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(data.description);
  }
  if (data.roleId !== undefined) {
    fields.push(`role_id = $${paramIndex++}::uuid`);
    values.push(data.roleId);
  }
  if (data.permissions !== undefined) {
    fields.push(`permissions = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(data.permissions));
  }
  if (data.isDefault !== undefined) {
    fields.push(`is_default = $${paramIndex++}`);
    values.push(data.isDefault);
  }
  if (data.metadata !== undefined) {
    fields.push(`metadata = $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(data.metadata));
  }
  if (data.color !== undefined) {
    fields.push(`color = $${paramIndex++}`);
    values.push(data.color);
  }
  if (data.icon !== undefined) {
    fields.push(`icon = $${paramIndex++}`);
    values.push(data.icon);
  }
  
  if (fields.length === 0) {
    const existing = await getUserGroup(groupId);
    if (!existing) throw new Error('Group not found');
    return existing;
  }
  
  fields.push('updated_at = NOW()');
  values.push(groupId);
  
  const query = `UPDATE public.user_groups SET ${fields.join(', ')} WHERE id = $${paramIndex}::uuid RETURNING *`;
  const result = await prisma.$queryRawUnsafe<any[]>(query, ...values);
  
  return mapUserGroup(result[0]);
}

export async function deleteUserGroup(groupId: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM public.user_groups WHERE id = ${groupId}::uuid AND is_system = false
  `;
}

export async function addUserToGroup(groupId: string, userId: string, role?: string, addedBy?: string): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO public.user_group_members (group_id, user_id, role, added_by)
    VALUES (${groupId}::uuid, ${userId}::uuid, ${role || 'member'}, ${addedBy || null}::uuid)
    ON CONFLICT (group_id, user_id) DO UPDATE SET role = EXCLUDED.role
  `;
}

export async function removeUserFromGroup(groupId: string, userId: string): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM public.user_group_members WHERE group_id = ${groupId}::uuid AND user_id = ${userId}::uuid
  `;
}

export async function getGroupMembers(groupId: string): Promise<any[]> {
  const result = await prisma.$queryRaw<any[]>`
    SELECT ugm.*, u.email, u.first_name, u.last_name, u.avatar_url as avatar
    FROM public.user_group_members ugm
    JOIN public.users u ON u.id = ugm.user_id
    WHERE ugm.group_id = ${groupId}::uuid
    ORDER BY ugm.created_at DESC
  `;
  return result;
}

export async function getUserGroupMemberships(userId: string): Promise<UserGroup[]> {
  const result = await prisma.$queryRaw<any[]>`
    SELECT ug.* FROM public.user_groups ug
    JOIN public.user_group_members ugm ON ugm.group_id = ug.id
    WHERE ugm.user_id = ${userId}::uuid
  `;
  return result.map(mapUserGroup);
}

// =====================================================
// AUDIT LOG
// =====================================================

export async function logIdentityAction(data: {
  actorType: string;
  actorId?: string;
  actorEmail?: string;
  targetType: string;
  targetId?: string;
  targetEmail?: string;
  action: string;
  actionCategory?: string;
  description?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  sessionId?: string;
  status?: string;
  errorMessage?: string;
}): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO public.identity_audit_log (
      actor_type, actor_id, actor_email, target_type, target_id, target_email,
      action, action_category, description, old_value, new_value, metadata,
      ip_address, user_agent, device_id, session_id, status, error_message
    ) VALUES (
      ${data.actorType}, ${data.actorId || null}::uuid, ${data.actorEmail || null}, 
      ${data.targetType}, ${data.targetId || null}::uuid, ${data.targetEmail || null},
      ${data.action}, ${data.actionCategory || null}, ${data.description || null},
      ${data.oldValue ? JSON.stringify(data.oldValue) : null}::jsonb,
      ${data.newValue ? JSON.stringify(data.newValue) : null}::jsonb,
      ${data.metadata ? JSON.stringify(data.metadata) : null}::jsonb,
      ${data.ipAddress || null}, ${data.userAgent || null}, ${data.deviceId || null}::uuid,
      ${data.sessionId || null}::uuid, ${data.status || 'success'}, ${data.errorMessage || null}
    )
  `;
}

export async function getIdentityAuditLog(options: {
  actorId?: string;
  targetId?: string;
  action?: string;
  actionCategory?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}): Promise<{ entries: IdentityAuditEntry[]; total: number }> {
  const { limit = 50, offset = 0 } = options;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;
  
  if (options.actorId) {
    conditions.push(`actor_id = $${paramIndex++}::uuid`);
    params.push(options.actorId);
  }
  if (options.targetId) {
    conditions.push(`target_id = $${paramIndex++}::uuid`);
    params.push(options.targetId);
  }
  if (options.action) {
    conditions.push(`action = $${paramIndex++}`);
    params.push(options.action);
  }
  if (options.actionCategory) {
    conditions.push(`action_category = $${paramIndex++}`);
    params.push(options.actionCategory);
  }
  if (options.startDate) {
    conditions.push(`created_at >= $${paramIndex++}`);
    params.push(options.startDate);
  }
  if (options.endDate) {
    conditions.push(`created_at <= $${paramIndex++}`);
    params.push(options.endDate);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  const countQuery = `SELECT COUNT(*)::bigint as count FROM public.identity_audit_log ${whereClause}`;
  const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(countQuery, ...params);
  
  params.push(limit, offset);
  const resultQuery = `SELECT * FROM public.identity_audit_log ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
  const result = await prisma.$queryRawUnsafe<any[]>(resultQuery, ...params);
  
  return {
    entries: result.map(mapAuditEntry),
    total: Number(countResult[0]?.count || 0),
  };
}

// =====================================================
// ANALYTICS
// =====================================================

export async function getUserAnalytics(options?: {
  startDate?: Date;
  endDate?: Date;
  applicationId?: string;
}): Promise<{
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  verifiedUsers: number;
  usersWithMFA: number;
  loginsByMethod: Record<string, number>;
  loginsByDay: { date: string; count: number }[];
  failedLogins: number;
  suspiciousLogins: number;
}> {
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Total users
  const totalResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count FROM public.users
  `;
  const totalUsers = Number(totalResult[0]?.count || 0);
  
  // Active users (logged in within last 30 days)
  const activeResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT user_id)::bigint as count FROM public.login_history 
    WHERE success = true AND created_at > ${monthAgo}
  `;
  const activeUsers = Number(activeResult[0]?.count || 0);
  
  // New users today
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const newTodayResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count FROM public.users WHERE created_at >= ${todayStart}
  `;
  const newUsersToday = Number(newTodayResult[0]?.count || 0);
  
  // New users this week
  const newWeekResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count FROM public.users WHERE created_at >= ${weekAgo}
  `;
  const newUsersThisWeek = Number(newWeekResult[0]?.count || 0);
  
  // New users this month
  const newMonthResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count FROM public.users WHERE created_at >= ${monthAgo}
  `;
  const newUsersThisMonth = Number(newMonthResult[0]?.count || 0);
  
  // Verified users
  const verifiedResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count FROM public.users WHERE is_verified = true
  `;
  const verifiedUsers = Number(verifiedResult[0]?.count || 0);
  
  // Users with MFA
  const mfaResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(DISTINCT user_id)::bigint as count FROM public.user_mfa WHERE is_enabled = true
  `;
  const usersWithMFA = Number(mfaResult[0]?.count || 0);
  
  // Logins by method
  const methodResult = await prisma.$queryRaw<any[]>`
    SELECT login_method, COUNT(*)::bigint as count FROM public.login_history
    WHERE success = true AND created_at > ${monthAgo}
    GROUP BY login_method
  `;
  const loginsByMethod: Record<string, number> = {};
  methodResult.forEach(row => {
    loginsByMethod[row.login_method] = Number(row.count);
  });
  
  // Logins by day (last 30 days)
  const dailyResult = await prisma.$queryRaw<any[]>`
    SELECT DATE(created_at) as date, COUNT(*)::bigint as count FROM public.login_history
    WHERE success = true AND created_at > ${monthAgo}
    GROUP BY DATE(created_at)
    ORDER BY date
  `;
  const loginsByDay = dailyResult.map(row => ({
    date: row.date.toISOString().split('T')[0],
    count: Number(row.count),
  }));
  
  // Failed logins (last 24 hours)
  const failedResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count FROM public.login_history
    WHERE success = false AND created_at > ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
  `;
  const failedLogins = Number(failedResult[0]?.count || 0);
  
  // Suspicious logins (last 24 hours)
  const suspiciousResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint as count FROM public.login_history
    WHERE is_suspicious = true AND created_at > ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
  `;
  const suspiciousLogins = Number(suspiciousResult[0]?.count || 0);
  
  return {
    totalUsers,
    activeUsers,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    verifiedUsers,
    usersWithMFA,
    loginsByMethod,
    loginsByDay,
    failedLogins,
    suspiciousLogins,
  };
}

// =====================================================
// MAPPER FUNCTIONS
// =====================================================

function mapSession(row: any): UserSession {
  return {
    id: row.id,
    userId: row.user_id,
    sessionToken: row.session_token,
    refreshToken: row.refresh_token,
    deviceId: row.device_id,
    deviceType: row.device_type,
    deviceName: row.device_name,
    browser: row.browser,
    browserVersion: row.browser_version,
    os: row.os,
    osVersion: row.os_version,
    ipAddress: row.ip_address,
    country: row.country,
    city: row.city,
    isActive: row.is_active,
    lastActivityAt: row.last_activity_at,
    expiresAt: row.expires_at,
    isRemembered: row.is_remembered,
    mfaVerified: row.mfa_verified,
    riskScore: row.risk_score,
    createdAt: row.created_at,
    revokedAt: row.revoked_at,
    revokedBy: row.revoked_by,
    revokeReason: row.revoke_reason,
  };
}

function mapDevice(row: any): UserDevice {
  return {
    id: row.id,
    userId: row.user_id,
    deviceFingerprint: row.device_fingerprint,
    deviceName: row.device_name,
    deviceType: row.device_type,
    brand: row.brand,
    model: row.model,
    os: row.os,
    osVersion: row.os_version,
    browser: row.browser,
    browserVersion: row.browser_version,
    pushToken: row.push_token,
    pushEnabled: row.push_enabled,
    isTrusted: row.is_trusted,
    isCurrent: row.is_current,
    trustLevel: row.trust_level,
    firstSeenAt: row.first_seen_at,
    lastSeenAt: row.last_seen_at,
    lastIpAddress: row.last_ip_address,
    lastLocationCountry: row.last_location_country,
    lastLocationCity: row.last_location_city,
    loginCount: row.login_count,
    failedLoginCount: row.failed_login_count,
    isBlocked: row.is_blocked,
    blockedAt: row.blocked_at,
    blockedReason: row.blocked_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMFA(row: any): UserMFA {
  return {
    id: row.id,
    userId: row.user_id,
    mfaType: row.mfa_type,
    isEnabled: row.is_enabled,
    isPrimary: row.is_primary,
    totpSecret: row.totp_secret,
    totpVerifiedAt: row.totp_verified_at,
    phoneNumber: row.phone_number,
    email: row.email,
    backupCodesUsed: row.backup_codes_used || 0,
    lastUsedAt: row.last_used_at,
    useCount: row.use_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapSecurityPolicy(row: any): SecurityPolicy {
  return {
    id: row.id,
    applicationId: row.application_id,
    policyName: row.policy_name,
    policyType: row.policy_type,
    isActive: row.is_active,
    priority: row.priority,
    passwordMinLength: row.password_min_length,
    passwordMaxLength: row.password_max_length,
    passwordRequireUppercase: row.password_require_uppercase,
    passwordRequireLowercase: row.password_require_lowercase,
    passwordRequireNumber: row.password_require_number,
    passwordRequireSpecial: row.password_require_special,
    passwordHistoryCount: row.password_history_count,
    passwordExpiryDays: row.password_expiry_days,
    lockoutEnabled: row.lockout_enabled,
    lockoutThreshold: row.lockout_threshold,
    lockoutDurationMinutes: row.lockout_duration_minutes,
    lockoutResetAfterMinutes: row.lockout_reset_after_minutes,
    sessionTimeoutMinutes: row.session_timeout_minutes,
    sessionMaxConcurrent: row.session_max_concurrent,
    mfaRequired: row.mfa_required,
    mfaRequiredForRoles: row.mfa_required_for_roles || [],
    mfaRememberDeviceDays: row.mfa_remember_device_days,
    mfaAllowedTypes: row.mfa_allowed_types || [],
    ipWhitelist: row.ip_whitelist || [],
    ipBlacklist: row.ip_blacklist || [],
    ipGeoWhitelist: row.ip_geo_whitelist || [],
    ipGeoBlacklist: row.ip_geo_blacklist || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLoginHistory(row: any): LoginHistoryEntry {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    username: row.username,
    loginMethod: row.login_method,
    socialProvider: row.social_provider,
    success: row.success,
    failureReason: row.failure_reason,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    deviceType: row.device_type,
    deviceId: row.device_id,
    country: row.country,
    city: row.city,
    mfaRequired: row.mfa_required,
    mfaMethod: row.mfa_method,
    mfaSuccess: row.mfa_success,
    riskScore: row.risk_score,
    isSuspicious: row.is_suspicious,
    suspiciousReason: row.suspicious_reason,
    sessionId: row.session_id,
    createdAt: row.created_at,
  };
}

function mapOAuthProvider(row: any): OAuthProvider {
  return {
    id: row.id,
    applicationId: row.application_id,
    providerName: row.provider_name,
    displayName: row.display_name,
    isEnabled: row.is_enabled,
    clientId: row.client_id,
    clientSecret: row.client_secret,
    authorizationUrl: row.authorization_url,
    tokenUrl: row.token_url,
    userinfoUrl: row.userinfo_url,
    scopes: row.scopes || [],
    claimsMapping: row.claims_mapping || {},
    allowSignup: row.allow_signup,
    requireEmailVerified: row.require_email_verified,
    autoLinkByEmail: row.auto_link_by_email,
    iconUrl: row.icon_url,
    buttonColor: row.button_color,
    buttonText: row.button_text,
    displayOrder: row.display_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUserGroup(row: any): UserGroup {
  return {
    id: row.id,
    applicationId: row.application_id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    roleId: row.role_id,
    permissions: row.permissions || [],
    isSystem: row.is_system,
    isDefault: row.is_default,
    metadata: row.metadata || {},
    color: row.color,
    icon: row.icon,
    memberCount: row.member_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditEntry(row: any): IdentityAuditEntry {
  return {
    id: row.id,
    actorType: row.actor_type,
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    targetType: row.target_type,
    targetId: row.target_id,
    targetEmail: row.target_email,
    action: row.action,
    actionCategory: row.action_category,
    description: row.description,
    oldValue: row.old_value,
    newValue: row.new_value,
    metadata: row.metadata,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    deviceId: row.device_id,
    sessionId: row.session_id,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

// Export service
export const identityService = {
  // Sessions
  getSessions,
  getSessionById,
  createSession,
  revokeSession,
  revokeAllSessions,
  updateSessionActivity,
  
  // Devices
  getDevices,
  getDeviceById,
  registerDevice,
  trustDevice,
  blockDevice,
  unblockDevice,
  deleteDevice,
  
  // MFA
  getMFASettings,
  enableMFA,
  disableMFA,
  generateBackupCodes,
  verifyBackupCode,
  
  // Security Policies
  getSecurityPolicies,
  getSecurityPolicy,
  createSecurityPolicy,
  updateSecurityPolicy,
  deleteSecurityPolicy,
  
  // Login History
  getLoginHistory,
  logLoginAttempt,
  
  // OAuth Providers
  getOAuthProviders,
  getOAuthProvider,
  createOAuthProvider,
  updateOAuthProvider,
  deleteOAuthProvider,
  
  // User Groups
  getUserGroups,
  getUserGroup,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  addUserToGroup,
  removeUserFromGroup,
  getGroupMembers,
  getUserGroupMemberships,
  
  // Audit Log
  logIdentityAction,
  getIdentityAuditLog,
  
  // Analytics
  getUserAnalytics,
};

export default identityService;
