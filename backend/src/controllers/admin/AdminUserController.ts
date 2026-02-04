import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../config/database';
import { AdminRequest } from '../../middleware/adminAuth';
import { config } from '../../config/env';
import { logger } from '../../middleware/logger';

export class AdminUserController {

    /**
     * Admin login with database-backed authentication
     */
    async login(req: any, res: Response) {
        try {
            const { email, password } = req.body;
            logger.info(`[AdminLogin] Attempt for email: ${email}, password length: ${password ? password.length : 0}`);

            if (!email || !password) {
                logger.warn('[AdminLogin] Missing email or password');
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // Try to find admin user directly in admin_users table first (migration 011 style)
            let adminUser: any;
            let queryResult = await pool.query(`
                SELECT au.*, ar.name as role_name, ar.permissions
                FROM admin_users au
                LEFT JOIN admin_roles ar ON au.role_id = ar.id
                WHERE au.email = $1 AND au.is_active = true
            `, [email.toLowerCase()]);

            if (queryResult.rows.length > 0) {
                adminUser = queryResult.rows[0];
                logger.info(`[AdminLogin] Found admin user directly in admin_users: ${adminUser.email}`);
            } else {
                // Fall back to users table JOIN (legacy approach)
                queryResult = await pool.query(`
                    SELECT au.*, u.email, u.password_hash, 
                           u.first_name as "firstName", u.last_name as "lastName",
                           ar.name as role_name, ar.permissions
                    FROM admin_users au
                    JOIN users u ON au.user_id = u.id
                    LEFT JOIN admin_roles ar ON au.admin_role_id = ar.id
                    WHERE u.email = $1 AND au.is_active = true
                `, [email.toLowerCase()]);
                
                if (queryResult.rows.length > 0) {
                    adminUser = queryResult.rows[0];
                    logger.info(`[AdminLogin] Found admin user via users table JOIN: ${adminUser.email}`);
                }
            }

            if (!adminUser) {
                logger.warn(`[AdminLogin] No active admin user found for: ${email}`);
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            logger.info(`[AdminLogin] Found user: ${adminUser.email}, hashing comparison...`);

            // Verify password
            const isValidPassword = await bcrypt.compare(password, adminUser.password_hash);
            if (!isValidPassword) {
                logger.warn(`[AdminLogin] Password mismatch for: ${email}`);
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            logger.info(`[AdminLogin] Success for: ${email}`);

            // Update last login
            await pool.query(`UPDATE admin_users SET last_login = NOW() WHERE id = $1`, [adminUser.id]);

            // Parse permissions from JSONB
            let permissions: string[] = [];
            try {
                permissions = typeof adminUser.permissions === 'string'
                    ? JSON.parse(adminUser.permissions)
                    : (adminUser.permissions || []);
            } catch {
                permissions = [];
            }

            // Generate JWT token
            const token = jwt.sign(
                {
                    id: adminUser.user_id || adminUser.id, // Use user_id if exists, otherwise admin_users.id
                    adminId: adminUser.id,   // Keep admin_users.id as administrative identifier
                    email: adminUser.email,
                    firstName: adminUser.first_name || adminUser.firstName,
                    lastName: adminUser.last_name || adminUser.lastName,
                    role: adminUser.role_name,
                    permissions,
                    type: 'admin'
                },
                this.getJwtSecret(),
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                token,
                user: {
                    id: adminUser.id,
                    email: adminUser.email,
                    firstName: adminUser.first_name || adminUser.firstName,
                    lastName: adminUser.last_name || adminUser.lastName,
                    role: adminUser.role_name,
                    permissions
                }
            });
        } catch (error: any) {
            console.error('Admin login error:', error);
            res.status(500).json({ error: 'Login failed', details: error.message });
        }
    }

    /**
     * Get current admin user info
     */
    async getCurrentUser(req: AdminRequest, res: Response) {
        try {
            if (!req.admin) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const query = `
        SELECT au.id, u.email, 
               u.first_name as "firstName", 
               u.last_name as "lastName",
               au.is_active as "isActive", au.last_login as "lastLogin",
               ar.name as role_name, ar.permissions
        FROM admin_users au
        JOIN users u ON au.user_id = u.id
        LEFT JOIN admin_roles ar ON au.admin_role_id = ar.id
        WHERE au.user_id = $1
      `;
            const { rows } = await pool.query(query, [req.admin?.id]);
            const adminUser = rows[0];

            if (!adminUser) {
                return res.status(404).json({ error: 'Admin user not found' });
            }

            let permissions: string[] = [];
            try {
                permissions = typeof adminUser.permissions === 'string'
                    ? JSON.parse(adminUser.permissions)
                    : (adminUser.permissions || []);
            } catch {
                permissions = [];
            }

            res.json({
                user: {
                    id: adminUser.id,
                    email: adminUser.email,
                    firstName: adminUser.firstName,
                    lastName: adminUser.lastName,
                    role: adminUser.role_name,
                    permissions,
                    isActive: adminUser.isActive,
                    lastLogin: adminUser.lastLogin
                }
            });
        } catch (error: any) {
            console.error('Get current user error:', error);
            res.status(500).json({ error: 'Failed to get user info' });
        }
    }

    /**
     * Change admin password
     */
    /**
     * Change admin password
     */
    async changePassword(req: AdminRequest, res: Response) {
        try {
            if (!req.admin) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({ error: 'Current and new passwords are required' });
            }

            if (newPassword.length < 8) {
                return res.status(400).json({ error: 'New password must be at least 8 characters' });
            }

            // Get current password hash and user_id from users table
            const { rows } = await pool.query(`
                SELECT u.password_hash, u.id as user_id 
                FROM admin_users au 
                JOIN users u ON au.user_id = u.id 
                WHERE au.user_id = $1
            `, [req.admin?.id]);
            
            if (rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Verify current password
            const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Current password is incorrect' });
            }

            // Hash new password
            const newHash = await bcrypt.hash(newPassword, 10);
            
            // Update password in users table
            await pool.query(`UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`, [newHash, rows[0].user_id]);

            res.json({ success: true, message: 'Password changed successfully' });
        } catch (error: any) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Failed to change password' });
        }
    }

    /**
     * List all admin users (requires users:read permission)
     */
    /**
     * List all admin users (requires users:read permission)
     */
    async listUsers(req: AdminRequest, res: Response) {
        try {
            const query = `
        SELECT au.id, u.email, 
               u.first_name as "firstName", 
               u.last_name as "lastName",
               au.is_active as "isActive", au.last_login as "lastLogin", au.created_at as "createdAt",
               ar.name as "roleName"
        FROM admin_users au
        JOIN users u ON au.user_id = u.id
        LEFT JOIN admin_roles ar ON au.admin_role_id = ar.id
        ORDER BY au.created_at DESC
      `;
            const { rows } = await pool.query(query);

            res.json({ users: rows });
        } catch (error: any) {
            console.error('List users error:', error);
            res.status(500).json({ error: 'Failed to list users' });
        }
    }

    /**
     * Create new admin user (requires users:write permission)
     */
    /**
     * Create new admin user (requires users:write permission)
     */
    async createUser(req: AdminRequest, res: Response) {
        try {
            const { email, password, firstName, lastName, roleId } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // Check if email already exists in users table
            const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email.toLowerCase()]);
            let userId = existing.rows.length > 0 ? existing.rows[0].id : null;

            // If user doesn't exist, create them
            if (!userId) {
                const passwordHash = await bcrypt.hash(password, 10);
                const metadata = { first_name: firstName, last_name: lastName, role: 'admin' };
                
                const newUser = await pool.query(`
                    INSERT INTO users (email, password_hash, first_name, last_name, is_active)
                    VALUES ($1, $2, $3, $4, true)
                    RETURNING id
                `, [email.toLowerCase(), passwordHash, firstName, lastName]);
                userId = newUser.rows[0].id;
            }

            // Check if already an admin
            const existingAdmin = await pool.query(`SELECT id FROM admin_users WHERE user_id = $1`, [userId]);
            if (existingAdmin.rows.length > 0) {
                return res.status(400).json({ error: 'User is already an admin' });
            }

            // Create admin user entry
            const query = `
        INSERT INTO admin_users (user_id, admin_role_id, is_active)
        VALUES ($1, $2, true)
        RETURNING id, created_at
      `;
            const { rows } = await pool.query(query, [userId, roleId]);

            res.status(201).json({ 
                success: true, 
                user: {
                    id: rows[0].id,
                    email: email.toLowerCase(),
                    firstName,
                    lastName,
                    createdAt: rows[0].created_at
                } 
            });
        } catch (error: any) {
            console.error('Create user error:', error);
            res.status(500).json({ error: 'Failed to create user' });
        }
    }

    /**
     * Update admin user (requires users:write permission)
     */
    async updateUser(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;
            const { firstName, lastName, roleId, isActive } = req.body;

            // Get user_id from admin_users
            const adminRes = await pool.query(`SELECT user_id FROM admin_users WHERE id = $1`, [id]);
            if (adminRes.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            const userId = adminRes.rows[0].user_id;

            // Update users table for profile info
            if (firstName !== undefined || lastName !== undefined) {
                 const updates: string[] = [];
                 const params: any[] = [];
                 let pIdx = 1;

                 if (firstName !== undefined) {
                     updates.push(`first_name = $${pIdx++}`);
                     params.push(firstName);
                 }
                 if (lastName !== undefined) {
                     updates.push(`last_name = $${pIdx++}`);
                     params.push(lastName);
                 }

                 params.push(userId);
                 await pool.query(`UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${pIdx}`, params);
            }

            // Update admin_users for role and status
            const updates: string[] = [];
            const values: any[] = [];
            let paramIndex = 1;

            if (roleId !== undefined) {
                updates.push(`admin_role_id = $${paramIndex++}`);
                values.push(roleId);
            }
            if (isActive !== undefined) {
                updates.push(`is_active = $${paramIndex++}`);
                values.push(isActive);
            }

            if (updates.length > 0) {
                updates.push(`updated_at = NOW()`);
                values.push(id); // id is the last param for WHERE clause
                const query = `UPDATE admin_users SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
                await pool.query(query, values);
            }

            // Return updated user (fetch fresh)
            // ... reuse logic from list/get or just return success
            // For now return success as constructing the full object requires joins
            res.json({ success: true, message: "User updated successfully" });

        } catch (error: any) {
            console.error('Update user error:', error);
            res.status(500).json({ error: 'Failed to update user' });
        }
    }

    /**
     * Delete admin user (soft delete, requires users:write permission)
     */
    async deleteUser(req: AdminRequest, res: Response) {
        try {
            const { id } = req.params;

            // Prevent self-deletion
            if (req.admin?.id === id) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }

            await pool.query(`UPDATE admin_users SET is_active = false, updated_at = NOW() WHERE id = $1`, [id]);

            res.json({ success: true, message: 'User deactivated successfully' });
        } catch (error: any) {
            console.error('Delete user error:', error);
            res.status(500).json({ error: 'Failed to delete user' });
        }
    }

    /**
     * List all admin roles
     */
    async listRoles(req: AdminRequest, res: Response) {
        try {
            const { rows } = await pool.query(`SELECT * FROM admin_roles ORDER BY created_at`);
            res.json({ roles: rows });
        } catch (error: any) {
            console.error('List roles error:', error);
            res.status(500).json({ error: 'Failed to list roles' });
        }
    }
    private getJwtSecret() {
        return config.JWT_SECRET;
    }
}

export const adminUserController = new AdminUserController();
