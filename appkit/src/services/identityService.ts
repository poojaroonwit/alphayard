// Identity Management Service for Admin
import { API_BASE_URL } from './apiConfig';

// =====================================================
// INTERFACES
// =====================================================

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
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
  location?: string;
  isExpired: boolean;
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
  osName?: string;
  browserName?: string;
  appVersion?: string;
  createdAt: string;
}

export interface UserMFA {
  id: string;
  userId: string;
  mfaType: string;
  isEnabled: boolean;
  isPrimary: boolean;
  totpVerifiedAt?: string;
  phoneNumber?: string;
  email?: string;
  backupCodesUsed: number;
  backupCodesRemaining: number;
  lastUsedAt?: string;
  useCount: number;
  createdAt: string;
}

export interface SecurityPolicy {
  id: string;
  applicationId?: string;
  policyName: string;
  policyType: string;
  isActive: boolean;
  priority: number;
  passwordMinLength: number;
  passwordMaxLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumber: boolean;
  passwordRequireSpecial: boolean;
  passwordHistoryCount: number;
  passwordExpiryDays: number;
  lockoutEnabled: boolean;
  lockoutThreshold: number;
  lockoutDurationMinutes: number;
  lockoutResetAfterMinutes: number;
  sessionTimeoutMinutes: number;
  sessionMaxConcurrent: number;
  mfaRequired: boolean;
  mfaRequiredForRoles: string[];
  mfaRememberDeviceDays: number;
  mfaAllowedTypes: string[];
  ipWhitelist: string[];
  ipBlacklist: string[];
  ipGeoWhitelist: string[];
  ipGeoBlacklist: string[];
}

export interface LoginHistoryEntry {
  id: string;
  userId?: string;
  email?: string;
  loginMethod: string;
  socialProvider?: string;
  success: boolean;
  failureReason?: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  country?: string;
  city?: string;
  mfaRequired: boolean;
  mfaMethod?: string;
  mfaSuccess?: boolean;
  riskScore: number;
  isSuspicious: boolean;
  suspiciousReason?: string;
  createdAt: string;
}

export interface OAuthProvider {
  id: string;
  applicationId?: string;
  providerName: string;
  displayName: string;
  isEnabled: boolean;
  clientId: string;
  clientSecret?: string;
  authUrl?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  userinfoUrl?: string;
  jwksUrl?: string;
  scopes: string[];
  claimsMapping?: Record<string, string>;
  attributeMapping?: Record<string, string>;
  allowSignup?: boolean;
  autoCreateUsers?: boolean;
  requireEmailVerified?: boolean;
  autoLinkByEmail?: boolean;
  allowedDomains?: string[];
  defaultRole?: string;
  iconUrl?: string;
  buttonColor?: string;
  buttonText?: string;
  displayOrder: number;
}

export interface UserGroup {
  id: string;
  applicationId?: string;
  name: string;
  groupName?: string; // Compatibility with both name and groupName
  slug: string;
  description?: string;
  groupType?: string;
  isActive?: boolean;
  roleId?: string;
  permissions: string[];
  isSystem: boolean;
  isDefault: boolean;
  metadata: Record<string, any>;
  color?: string;
  icon?: string;
  memberCount: number;
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
  status: string;
  errorMessage?: string;
  createdAt: string;
}

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  registrationsCount: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  verifiedUsers: number;
  usersWithMFA: number;
  mfaEnabledCount: number;
  activeSessions: number;
  totalDevices: number;
  failedLogins: number;
  suspiciousLogins: number;
  loginStats: {
    totalAttempts: number;
    successful: number;
    failed: number;
    byMethod?: Record<string, number>;
  };
  loginsByMethod: Record<string, number>;
  loginsByDay: { date: string; count: number }[];
  topLocations?: { city: string; country: string; count: number }[];
  topDevices?: { deviceType: string; count: number }[];
  usersByStatus?: {
    active: number;
    pending: number;
    suspended: number;
    inactive: number;
  };
}

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// =====================================================
// USER MANAGEMENT
// =====================================================

export async function createUser(data: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: string;
  status?: string;
  emailVerified?: boolean;
  sendWelcomeEmail?: boolean;
}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create user');
  }
  
  return response.json();
}

export async function bulkUserOperation(action: string, userIds: string[], data?: any): Promise<{ affected: number }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/users/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ action, userIds, data }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to perform bulk operation');
  }
  
  return response.json();
}

export async function exportUsers(options?: {
  format?: 'json' | 'csv';
  status?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
}): Promise<any> {
  const params = new URLSearchParams();
  if (options?.format) params.append('format', options.format);
  if (options?.status) params.append('status', options.status);
  if (options?.role) params.append('role', options.role);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  
  const response = await fetch(`${API_BASE_URL}/admin/identity/users/export?${params}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to export users');
  }
  
  if (options?.format === 'csv') {
    return response.text();
  }
  
  return response.json();
}

export async function assignUserRole(userId: string, roleId?: string, roleName?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/users/${userId}/role`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ roleId, roleName }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to assign role');
  }
}

// =====================================================
// SESSION MANAGEMENT
// =====================================================

export async function getUserSessions(userId: string, includeExpired = false): Promise<{ sessions: UserSession[]; total: number }> {
  const params = new URLSearchParams();
  if (includeExpired) params.append('includeExpired', 'true');
  
  const response = await fetch(`${API_BASE_URL}/admin/identity/users/${userId}/sessions?${params}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get sessions');
  }
  
  return response.json();
}

export async function revokeSession(sessionId: string, reason?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/sessions/${sessionId}/revoke`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to revoke session');
  }
}

export async function revokeAllUserSessions(userId: string): Promise<{ revokedCount: number }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/users/${userId}/sessions/revoke-all`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to revoke sessions');
  }
  
  return response.json();
}

// =====================================================
// DEVICE MANAGEMENT
// =====================================================

export async function getUserDevices(userId: string): Promise<{ devices: UserDevice[] }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/users/${userId}/devices`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get devices');
  }
  
  return response.json();
}

export async function trustDevice(deviceId: string, trusted: boolean): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/devices/${deviceId}/trust`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ trusted }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update device trust');
  }
}

export async function blockDevice(deviceId: string, reason?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/devices/${deviceId}/block`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to block device');
  }
}

export async function unblockDevice(deviceId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/devices/${deviceId}/unblock`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to unblock device');
  }
}

export async function deleteDevice(deviceId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/devices/${deviceId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete device');
  }
}

// =====================================================
// MFA MANAGEMENT
// =====================================================

export async function getUserMFA(userId: string): Promise<{ mfaSettings: UserMFA[] }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/users/${userId}/mfa`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get MFA settings');
  }
  
  return response.json();
}

export async function disableUserMFA(userId: string, mfaType?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/users/${userId}/mfa/disable`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ mfaType }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to disable MFA');
  }
}

export async function generateBackupCodes(userId: string): Promise<{ codes: string[] }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/users/${userId}/mfa/backup-codes`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate backup codes');
  }
  
  return response.json();
}

// =====================================================
// SECURITY POLICIES
// =====================================================

export async function getSecurityPolicies(applicationId?: string): Promise<{ policies: SecurityPolicy[] }> {
  const params = new URLSearchParams();
  if (applicationId) params.append('applicationId', applicationId);
  
  const response = await fetch(`${API_BASE_URL}/admin/identity/security-policies?${params}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get security policies');
  }
  
  return response.json();
}

export async function getSecurityPolicy(policyId: string): Promise<{ policy: SecurityPolicy }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/security-policies/${policyId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get security policy');
  }
  
  return response.json();
}

export async function createSecurityPolicy(data: Partial<SecurityPolicy>): Promise<{ policy: SecurityPolicy }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/security-policies`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create security policy');
  }
  
  return response.json();
}

export async function updateSecurityPolicy(policyId: string, data: Partial<SecurityPolicy>): Promise<{ policy: SecurityPolicy }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/security-policies/${policyId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update security policy');
  }
  
  return response.json();
}

export async function deleteSecurityPolicy(policyId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/security-policies/${policyId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete security policy');
  }
}

// =====================================================
// LOGIN HISTORY
// =====================================================

export async function getLoginHistory(options?: {
  userId?: string;
  email?: string;
  success?: boolean;
  suspicious?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{ entries: LoginHistoryEntry[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.userId) params.append('userId', options.userId);
  if (options?.email) params.append('email', options.email);
  if (options?.success !== undefined) params.append('success', String(options.success));
  if (options?.suspicious !== undefined) params.append('suspicious', String(options.suspicious));
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.offset) params.append('offset', String(options.offset));
  
  const response = await fetch(`${API_BASE_URL}/admin/identity/login-history?${params}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get login history');
  }
  
  return response.json();
}

export async function getUserLoginHistory(userId: string, limit = 50, offset = 0): Promise<{ entries: LoginHistoryEntry[]; total: number }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/users/${userId}/login-history?limit=${limit}&offset=${offset}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get login history');
  }
  
  return response.json();
}

// =====================================================
// OAUTH / SSO PROVIDERS
// =====================================================

export async function getOAuthProviders(applicationId?: string): Promise<{ providers: OAuthProvider[] }> {
  const params = new URLSearchParams();
  if (applicationId) params.append('applicationId', applicationId);
  
  const response = await fetch(`${API_BASE_URL}/admin/sso-providers?${params}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get OAuth providers');
  }
  
  const data = await response.json();
  // Map backend response to frontend interface
  return {
    providers: (data.providers || []).map((p: any) => ({
      id: p.id,
      providerName: p.name,
      displayName: p.displayName,
      isEnabled: p.enabled,
      clientId: p.clientId || '',
      clientSecret: p.clientSecret,
      authUrl: p.authorizationUrl,
      authorizationUrl: p.authorizationUrl,
      tokenUrl: p.tokenUrl,
      userInfoUrl: p.userinfoUrl,
      userinfoUrl: p.userinfoUrl,
      jwksUrl: p.jwksUrl,
      scopes: p.scopes || [],
      claimsMapping: p.claimsMapping || {},
      attributeMapping: p.claimsMapping || {},
      autoCreateUsers: p.autoCreateUsers,
      allowedDomains: p.allowedDomains || [],
      defaultRole: p.defaultRole,
      iconUrl: p.iconUrl,
      buttonColor: p.buttonColor,
      displayOrder: p.displayOrder || 0,
    }))
  };
}

export async function getOAuthProvider(providerId: string): Promise<{ provider: OAuthProvider }> {
  const response = await fetch(`${API_BASE_URL}/admin/sso-providers/${providerId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get OAuth provider');
  }
  
  const data = await response.json();
  const p = data.provider;
  return {
    provider: {
      id: p.id,
      providerName: p.name,
      displayName: p.displayName,
      isEnabled: p.enabled,
      clientId: p.clientId || '',
      clientSecret: p.clientSecret,
      authUrl: p.authorizationUrl,
      authorizationUrl: p.authorizationUrl,
      tokenUrl: p.tokenUrl,
      userInfoUrl: p.userinfoUrl,
      userinfoUrl: p.userinfoUrl,
      jwksUrl: p.jwksUrl,
      scopes: p.scopes || [],
      claimsMapping: p.claimsMapping || {},
      attributeMapping: p.claimsMapping || {},
      autoCreateUsers: p.autoCreateUsers,
      allowedDomains: p.allowedDomains || [],
      defaultRole: p.defaultRole,
      iconUrl: p.iconUrl,
      buttonColor: p.buttonColor,
      displayOrder: p.displayOrder || 0,
    }
  };
}

export async function createOAuthProvider(data: Partial<OAuthProvider>): Promise<{ provider: OAuthProvider }> {
  // Map frontend interface to backend API
  const backendData = {
    name: data.providerName,
    displayName: data.displayName,
    providerType: data.providerName, // Use provider name as type
    enabled: data.isEnabled,
    clientId: data.clientId,
    clientSecret: data.clientSecret,
    authorizationUrl: data.authUrl || data.authorizationUrl,
    tokenUrl: data.tokenUrl,
    userinfoUrl: data.userInfoUrl || data.userinfoUrl,
    scopes: data.scopes,
    claimsMapping: data.claimsMapping || data.attributeMapping,
    autoCreateUsers: data.autoCreateUsers ?? true,
    allowedDomains: data.allowedDomains,
    defaultRole: data.defaultRole,
    iconUrl: data.iconUrl,
    buttonColor: data.buttonColor,
    displayOrder: data.displayOrder,
  };

  const response = await fetch(`${API_BASE_URL}/admin/sso-providers`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(backendData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create OAuth provider');
  }
  
  return response.json();
}

export async function updateOAuthProvider(providerId: string, data: Partial<OAuthProvider>): Promise<{ provider: OAuthProvider }> {
  // Map frontend interface to backend API
  const backendData: any = {};
  
  if (data.providerName !== undefined) backendData.name = data.providerName;
  if (data.displayName !== undefined) backendData.displayName = data.displayName;
  if (data.isEnabled !== undefined) backendData.enabled = data.isEnabled;
  if (data.clientId !== undefined) backendData.clientId = data.clientId;
  if (data.clientSecret !== undefined) backendData.clientSecret = data.clientSecret;
  if (data.authUrl !== undefined || data.authorizationUrl !== undefined) {
    backendData.authorizationUrl = data.authUrl || data.authorizationUrl;
  }
  if (data.tokenUrl !== undefined) backendData.tokenUrl = data.tokenUrl;
  if (data.userInfoUrl !== undefined || data.userinfoUrl !== undefined) {
    backendData.userinfoUrl = data.userInfoUrl || data.userinfoUrl;
  }
  if (data.scopes !== undefined) backendData.scopes = data.scopes;
  if (data.claimsMapping !== undefined || data.attributeMapping !== undefined) {
    backendData.claimsMapping = data.claimsMapping || data.attributeMapping;
  }
  if (data.autoCreateUsers !== undefined) backendData.autoCreateUsers = data.autoCreateUsers;
  if (data.allowedDomains !== undefined) backendData.allowedDomains = data.allowedDomains;
  if (data.defaultRole !== undefined) backendData.defaultRole = data.defaultRole;
  if (data.iconUrl !== undefined) backendData.iconUrl = data.iconUrl;
  if (data.buttonColor !== undefined) backendData.buttonColor = data.buttonColor;
  if (data.displayOrder !== undefined) backendData.displayOrder = data.displayOrder;

  const response = await fetch(`${API_BASE_URL}/admin/sso-providers/${providerId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(backendData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update OAuth provider');
  }
  
  return response.json();
}

export async function deleteOAuthProvider(providerId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/sso-providers/${providerId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete OAuth provider');
  }
}

export async function toggleOAuthProvider(providerId: string): Promise<{ provider: any }> {
  const response = await fetch(`${API_BASE_URL}/admin/sso-providers/${providerId}/toggle`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to toggle OAuth provider');
  }
  
  return response.json();
}

// =====================================================
// USER GROUPS
// =====================================================

export async function getUserGroups(applicationId?: string): Promise<{ groups: UserGroup[] }> {
  const params = new URLSearchParams();
  if (applicationId) params.append('applicationId', applicationId);
  
  const response = await fetch(`${API_BASE_URL}/admin/identity/groups?${params}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user groups');
  }
  
  return response.json();
}

export async function getUserGroup(groupId: string): Promise<{ group: UserGroup; members: any[] }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/groups/${groupId}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user group');
  }
  
  return response.json();
}

export async function createUserGroup(data: Partial<UserGroup>): Promise<{ group: UserGroup }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/groups`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create user group');
  }
  
  return response.json();
}

export async function updateUserGroup(groupId: string, data: Partial<UserGroup>): Promise<{ group: UserGroup }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/groups/${groupId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update user group');
  }
  
  return response.json();
}

export async function deleteUserGroup(groupId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/groups/${groupId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete user group');
  }
}

export async function addUserToGroup(groupId: string, userId: string, role?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/groups/${groupId}/members`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ userId, role }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add user to group');
  }
}

export async function removeUserFromGroup(groupId: string, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove user from group');
  }
}

export async function getUserGroupMemberships(userId: string): Promise<{ groups: UserGroup[] }> {
  const response = await fetch(`${API_BASE_URL}/admin/identity/users/${userId}/groups`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user groups');
  }
  
  return response.json();
}

// =====================================================
// AUDIT LOG
// =====================================================

export async function getIdentityAuditLog(options?: {
  actorId?: string;
  targetId?: string;
  action?: string;
  actionCategory?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}): Promise<{ entries: IdentityAuditEntry[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.actorId) params.append('actorId', options.actorId);
  if (options?.targetId) params.append('targetId', options.targetId);
  if (options?.action) params.append('action', options.action);
  if (options?.actionCategory) params.append('actionCategory', options.actionCategory);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.offset) params.append('offset', String(options.offset));
  
  const response = await fetch(`${API_BASE_URL}/admin/identity/audit-log?${params}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get audit log');
  }
  
  return response.json();
}

// =====================================================
// ANALYTICS
// =====================================================

export async function getGroupMembers(groupId: string): Promise<{ members: any[] }> {
  const { members } = await getUserGroup(groupId);
  return { members };
}

export async function getUserAnalytics(options?: {
  applicationId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<UserAnalytics> {
  const params = new URLSearchParams();
  if (options?.applicationId) params.append('applicationId', options.applicationId);
  if (options?.startDate) params.append('startDate', options.startDate);
  if (options?.endDate) params.append('endDate', options.endDate);
  
  const response = await fetch(`${API_BASE_URL}/admin/identity/analytics?${params}`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to get analytics');
  }
  
  return response.json();
}

// Export all functions
export const identityService = {
  // Users
  createUser,
  bulkUserOperation,
  exportUsers,
  assignUserRole,
  
  // Sessions
  getUserSessions,
  revokeSession,
  revokeAllUserSessions,
  
  // Devices
  getUserDevices,
  trustDevice,
  blockDevice,
  unblockDevice,
  deleteDevice,
  
  // MFA
  getUserMFA,
  disableUserMFA,
  generateBackupCodes,
  
  // Security Policies
  getSecurityPolicies,
  getSecurityPolicy,
  createSecurityPolicy,
  updateSecurityPolicy,
  deleteSecurityPolicy,
  
  // Login History
  getLoginHistory,
  getUserLoginHistory,
  
  // OAuth / SSO Providers
  getOAuthProviders,
  getOAuthProvider,
  createOAuthProvider,
  updateOAuthProvider,
  deleteOAuthProvider,
  toggleOAuthProvider,
  
  // User Groups
  getUserGroups,
  getUserGroup,
  createUserGroup,
  updateUserGroup,
  deleteUserGroup,
  addUserToGroup,
  removeUserFromGroup,
  getUserGroupMemberships,
  
  // Audit
  getIdentityAuditLog,
  
  // Analytics
  getUserAnalytics,
  getGroupMembers,
};

export default identityService;
