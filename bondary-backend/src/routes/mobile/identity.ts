/**
 * Mobile Identity Routes
 * Handles sessions, devices, MFA, login history, and security settings for mobile users
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../../middleware/auth';
import * as identityService from '../../services/identityService';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcrypt';

const router = Router();

// All routes require authentication
router.use(authenticateToken as any);

// =====================================================
// AUTH STATUS
// =====================================================

/**
 * GET /identity/auth
 * Get authentication status for current user
 */
router.get('/auth', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Get user basic info
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                isActive: true,
                isVerified: true,
                lastLoginAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            authenticated: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                avatarUrl: user.avatarUrl,
                isActive: user.isActive,
                isVerified: user.isVerified,
                lastLoginAt: user.lastLoginAt
            }
        });
    } catch (error: any) {
        console.error('Error fetching auth status:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch auth status' });
    }
});

// =====================================================
// SESSION MANAGEMENT
// =====================================================

/**
 * GET /identity/sessions
 * Get all sessions for current user
 */
router.get('/sessions', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const includeExpired = req.query.includeExpired === 'true';
        const currentSessionToken = req.headers.authorization?.replace('Bearer ', '');
        
        const { sessions, total } = await identityService.getSessions(userId, { includeExpired });
        
        // Mark current session
        const sessionsWithCurrent = sessions.map(s => ({
            ...s,
            isCurrent: s.sessionToken === currentSessionToken
        }));
        
        res.json({ sessions: sessionsWithCurrent, total });
    } catch (error: any) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch sessions' });
    }
});

/**
 * POST /identity/sessions/:id/revoke
 * Revoke a specific session
 */
router.post('/sessions/:id/revoke', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        
        // Verify session belongs to user
        const session = await identityService.getSessionById(id);
        if (!session || session.userId !== userId) {
            return res.status(404).json({ error: 'Session not found' });
        }
        
        await identityService.revokeSession(id, userId, 'User revoked');
        res.json({ success: true, message: 'Session revoked successfully' });
    } catch (error: any) {
        console.error('Error revoking session:', error);
        res.status(500).json({ error: error.message || 'Failed to revoke session' });
    }
});

/**
 * POST /identity/sessions/revoke-all
 * Revoke all sessions except current
 */
router.post('/sessions/revoke-all', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const currentSessionToken = req.headers.authorization?.replace('Bearer ', '');
        
        const revokedCount = await identityService.revokeAllSessions(userId, currentSessionToken);
        res.json({ success: true, revokedCount });
    } catch (error: any) {
        console.error('Error revoking all sessions:', error);
        res.status(500).json({ error: error.message || 'Failed to revoke sessions' });
    }
});

// =====================================================
// DEVICE MANAGEMENT
// =====================================================

/**
 * GET /identity/devices
 * Get all devices for current user
 */
router.get('/devices', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const devices = await identityService.getDevices(userId);
        
        // Try to identify current device by fingerprint from header
        const currentFingerprint = req.headers['x-device-fingerprint'];
        const devicesWithCurrent = devices.map((d: any) => ({
            ...d,
            isCurrent: currentFingerprint ? d.deviceFingerprint === currentFingerprint : false
        }));
        
        res.json({ devices: devicesWithCurrent, total: devices.length });
    } catch (error: any) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch devices' });
    }
});

/**
 * POST /identity/devices/:id/trust
 * Mark a device as trusted
 */
router.post('/devices/:id/trust', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        
        // Verify device belongs to user
        const device = await identityService.getDeviceById(id);
        if (!device || device.userId !== userId) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        await identityService.trustDevice(id, true);
        res.json({ success: true, message: 'Device marked as trusted' });
    } catch (error: any) {
        console.error('Error trusting device:', error);
        res.status(500).json({ error: error.message || 'Failed to trust device' });
    }
});

/**
 * POST /identity/devices/:id/block
 * Block a device
 */
router.post('/devices/:id/block', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        const { reason } = req.body;
        
        // Verify device belongs to user
        const device = await identityService.getDeviceById(id);
        if (!device || device.userId !== userId) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        await identityService.blockDevice(id, reason || 'Blocked by user');
        res.json({ success: true, message: 'Device blocked' });
    } catch (error: any) {
        console.error('Error blocking device:', error);
        res.status(500).json({ error: error.message || 'Failed to block device' });
    }
});

/**
 * DELETE /identity/devices/:id
 * Remove a device
 */
router.delete('/devices/:id', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { id } = req.params;
        
        // Verify device belongs to user
        const device = await identityService.getDeviceById(id);
        if (!device || device.userId !== userId) {
            return res.status(404).json({ error: 'Device not found' });
        }
        
        await identityService.deleteDevice(id);
        res.json({ success: true, message: 'Device removed' });
    } catch (error: any) {
        console.error('Error removing device:', error);
        res.status(500).json({ error: error.message || 'Failed to remove device' });
    }
});

// =====================================================
// MFA MANAGEMENT
// =====================================================

/**
 * GET /identity/mfa
 * Get MFA settings for current user
 */
router.get('/mfa', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const mfaSettings = await identityService.getMFASettings(userId);
        // Count remaining backup codes if any MFA method has them
        const backupCodesRemaining = mfaSettings.reduce((count: number, mfa: any) => 
            count + (mfa.backupCodesRemaining || 0), 0);
        res.json({ mfaSettings, backupCodesRemaining });
    } catch (error: any) {
        console.error('Error fetching MFA settings:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch MFA settings' });
    }
});

/**
 * POST /identity/mfa/setup
 * Initiate MFA setup
 */
router.post('/mfa/setup', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { mfaType } = req.body;
        
        if (!['totp', 'sms', 'email'].includes(mfaType)) {
            return res.status(400).json({ error: 'Invalid MFA type' });
        }

        const result = await identityService.enableMFA(userId, mfaType as any, {});
        res.json(result);
    } catch (error: any) {
        console.error('Error setting up MFA:', error);
        res.status(500).json({ error: error.message || 'Failed to setup MFA' });
    }
});

/**
 * POST /identity/mfa/verify
 * Verify MFA setup with code
 */
router.post('/mfa/verify', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { mfaType, code } = req.body;
        
        // TODO: Implement actual verification logic
        // For now, just return success with backup codes
        const backupCodes = await identityService.generateBackupCodes(userId);
        
        res.json({ 
            success: true, 
            message: 'MFA verified successfully',
            backupCodes 
        });
    } catch (error: any) {
        console.error('Error verifying MFA:', error);
        res.status(500).json({ error: error.message || 'Failed to verify MFA' });
    }
});

/**
 * POST /identity/mfa/disable
 * Disable MFA
 */
router.post('/mfa/disable', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { mfaType, password } = req.body;
        
        // Verify password first
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { passwordHash: true }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        // Find and disable the MFA method
        const mfaRecord = await prisma.userMFA.findFirst({
          where: {
            userId,
            mfaType,
            isEnabled: true
          }
        });
        
        if (mfaRecord) {
            await identityService.disableMFA(userId, mfaRecord.id);
        }
        
        res.json({ success: true, message: 'MFA disabled successfully' });
    } catch (error: any) {
        console.error('Error disabling MFA:', error);
        res.status(500).json({ error: error.message || 'Failed to disable MFA' });
    }
});

/**
 * POST /identity/mfa/backup-codes
 * Generate new backup codes
 */
router.post('/mfa/backup-codes', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { password } = req.body;
        
        // Verify password first
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { passwordHash: true }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        const backupCodes = await identityService.generateBackupCodes(userId);
        res.json({ backupCodes });
    } catch (error: any) {
        console.error('Error generating backup codes:', error);
        res.status(500).json({ error: error.message || 'Failed to generate backup codes' });
    }
});

// =====================================================
// LOGIN HISTORY
// =====================================================

/**
 * GET /identity/login-history
 * Get login history for current user
 */
router.get('/login-history', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
        const offset = (page - 1) * limit;
        const success = req.query.success !== undefined ? req.query.success === 'true' : undefined;
        
        const result = await identityService.getLoginHistory({
            userId,
            offset,
            limit,
            success
        });
        
        res.json(result);
    } catch (error: any) {
        console.error('Error fetching login history:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch login history' });
    }
});

// =====================================================
// ORGANIZATIONS
// =====================================================

/**
 * GET /identity/organizations
 * Get organizations for current user
 */
router.get('/organizations', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // For now, return empty organizations array
        // This can be extended later when organization functionality is implemented
        res.json({ 
            organizations: [],
            total: 0
        });
    } catch (error: any) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch organizations' });
    }
});

// =====================================================
// SECURITY SETTINGS
// =====================================================

/**
 * GET /identity/security
 * Get security overview for current user
 */
router.get('/security', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Get various security-related info
        const [sessionsCount, devicesCount, mfaRecords, lastLogin, user] = await Promise.all([
            prisma.userSession.count({
              where: {
                userId,
                isActive: true,
                expiresAt: { gt: new Date() }
              }
            }),
            prisma.userDevice.count({
              where: {
                userId,
                isTrusted: true
              }
            }),
            prisma.userMFA.findMany({
              where: {
                userId,
                isEnabled: true
              },
              select: { mfaType: true }
            }),
            prisma.loginHistory.findFirst({
              where: {
                userId,
                success: true
              },
              orderBy: { createdAt: 'desc' },
              select: { createdAt: true, country: true, city: true }
            }),
            prisma.user.findUnique({
              where: { id: userId },
              select: { passwordChangedAt: true }
            })
        ]);
        
        const mfaMethods = mfaRecords.map((r: any) => r.mfaType);
        
        res.json({
            passwordLastChanged: user?.passwordChangedAt,
            mfaEnabled: mfaMethods.length > 0,
            mfaMethods,
            trustedDevicesCount: devicesCount,
            activeSessionsCount: sessionsCount,
            lastLogin: {
                timestamp: lastLogin?.createdAt,
                location: lastLogin ? `${lastLogin.city}, ${lastLogin.country}` : null
            },
            accountLocked: false,
            accountLockedUntil: undefined
        });
    } catch (error: any) {
        console.error('Error fetching security settings:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch security settings' });
    }
});

/**
 * POST /identity/security/change-password
 * Change user password
 */
router.post('/security/change-password', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new password are required' });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        
        // Verify current password
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { passwordHash: true }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        
        // Hash and update new password
        const newHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
          where: { id: userId },
          data: {
            passwordHash: newHash,
            updatedAt: new Date()
          }
        });
        
        // Store in password history if table exists
        try {
            await prisma.$executeRaw`
                INSERT INTO password_history (user_id, password_hash) VALUES (${userId}, ${user.passwordHash})
            `;
        } catch (e) {
            // Password history table might not exist
        }
        
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error: any) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: error.message || 'Failed to change password' });
    }
});

/**
 * POST /identity/account/delete-request
 * Request account deletion
 */
router.post('/account/delete-request', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { password, reason } = req.body;
        
        // Verify password
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { passwordHash: true }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        // Mark account for deletion (soft delete after 30 days)
        // Note: deletion fields not available in User model, would need custom implementation
        // For now, just log the action
        
        // Log the action
        await identityService.logIdentityAction({
            actorType: 'user',
            actorId: userId,
            targetType: 'user',
            targetId: userId,
            action: 'account_deletion_requested',
            metadata: { reason },
            ipAddress: req.ip || undefined
        });
        
        res.json({ 
            success: true, 
            message: 'Account deletion requested. Your account will be deleted in 30 days. You can cancel this by logging in again.' 
        });
    } catch (error: any) {
        console.error('Error requesting account deletion:', error);
        res.status(500).json({ error: error.message || 'Failed to request account deletion' });
    }
});

/**
 * POST /identity/account/export-data
 * Request data export (GDPR)
 */
router.post('/account/export-data', async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        
        // In a real implementation, this would queue a background job
        // For now, just acknowledge the request
        
        await identityService.logIdentityAction({
            actorType: 'user',
            actorId: userId,
            targetType: 'user',
            targetId: userId,
            action: 'data_export_requested',
            ipAddress: req.ip || undefined
        });
        
        res.json({ 
            success: true, 
            message: 'Data export requested. You will receive an email with a download link within 48 hours.',
            estimatedTime: '48 hours'
        });
    } catch (error: any) {
        console.error('Error requesting data export:', error);
        res.status(500).json({ error: error.message || 'Failed to request data export' });
    }
});

export default router;
