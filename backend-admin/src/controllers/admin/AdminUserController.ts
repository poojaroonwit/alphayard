
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { config } from '../../config/env';
import { AdminRequest } from '../../middleware/adminAuth';

export class AdminUserController {
  
  /**
   * Admin Login
   */
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find admin user
      const adminUser = await prisma.adminUser.findUnique({
        where: { email },
        include: {
            role: true,
            adminUserApplications: {
                include: { application: true }
            }
        }
      });

      if (!adminUser || !adminUser.isActive) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, adminUser.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Create permissions array
      let permissions: string[] = [];
      if (adminUser.isSuperAdmin) {
        permissions = ['*'];
      } else if (adminUser.role) {
         // Fetch permissions for the role
         const rolePermissions = await prisma.adminRolePermission.findMany({
             where: { roleId: adminUser.roleId! },
             include: { permission: true }
         });
         permissions = rolePermissions.map(rp => `${rp.permission.module}:${rp.permission.action}`);
      }

      // Generate JWT
      const token = jwt.sign(
        {
          id: adminUser.id, // admin_users.id
          adminId: adminUser.id,
          email: adminUser.email,
          firstName: adminUser.name.split(' ')[0] || '',
          lastName: adminUser.name.split(' ').slice(1).join(' ') || '',
          role: adminUser.role?.name || 'admin',
          type: 'admin',
          isSuperAdmin: adminUser.isSuperAdmin,
          permissions
        },
        config.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Update last login
      await prisma.adminUser.update({
        where: { id: adminUser.id },
        data: { lastLoginAt: new Date() }
      });

      return res.json({
        token,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role?.name,
          isSuperAdmin: adminUser.isSuperAdmin,
          avatarUrl: adminUser.avatarUrl
        }
      });

    } catch (error) {
      console.error('Admin login error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get Current User
   */
  async getCurrentUser(req: AdminRequest, res: Response) {
    try {
        if (!req.admin) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const adminUser = await prisma.adminUser.findUnique({
            where: { id: req.admin.adminId },
            include: { role: true }
        });

        if (!adminUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.name,
            role: adminUser.role?.name,
            isSuperAdmin: adminUser.isSuperAdmin,
            avatarUrl: adminUser.avatarUrl,
            permissions: req.admin.permissions
        });

    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Change Password
   */
  async changePassword(req: AdminRequest, res: Response) {
      try {
          const { currentPassword, newPassword } = req.body;
          const adminId = req.admin?.adminId;

          if (!adminId) return res.status(401).json({ error: 'Not authenticated' });
          if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });

          const adminUser = await prisma.adminUser.findUnique({ where: { id: adminId } });
          if (!adminUser) return res.status(404).json({ error: 'User not found' });

          const isValid = await bcrypt.compare(currentPassword, adminUser.passwordHash);
          if (!isValid) return res.status(400).json({ error: 'Invalid current password' });

          const passwordHash = await bcrypt.hash(newPassword, 12);
          await prisma.adminUser.update({
              where: { id: adminId },
              data: { passwordHash }
          });

          return res.json({ success: true, message: 'Password updated' });

      } catch (error) {
          console.error('Change password error:', error);
          return res.status(500).json({ error: 'Internal server error' });
      }
  }

  /**
   * List Users
   */
  async listUsers(req: Request, res: Response) {
      try {
          const page = Number(req.query.page) || 1;
          const limit = Number(req.query.limit) || 10;
          const search = req.query.search as string;
          const skip = (page - 1) * limit;

          const where: any = {};
          if (search) {
              where.OR = [
                  { email: { contains: search, mode: 'insensitive' } },
                  { name: { contains: search, mode: 'insensitive' } }
              ];
          }

          const [users, total] = await Promise.all([
              prisma.adminUser.findMany({
                  where,
                  skip,
                  take: limit,
                  include: { role: true },
                  orderBy: { createdAt: 'desc' }
              }),
              prisma.adminUser.count({ where })
          ]);

          return res.json({
              users,
              pagination: {
                  page,
                  limit,
                  total,
                  pages: Math.ceil(total / limit)
              }
          });

      } catch (error) {
          console.error('List users error:', error);
          return res.status(500).json({ error: 'Internal server error' });
      }
  }

  /**
   * Create User
   */
  async createUser(req: Request, res: Response) {
      try {
          const { email, password, name, roleId, isSuperAdmin } = req.body;

          if (!email || !password || !name) {
              return res.status(400).json({ error: 'Missing required fields' });
          }

          const existing = await prisma.adminUser.findUnique({ where: { email } });
          if (existing) {
              return res.status(400).json({ error: 'Email already exists' });
          }

          const passwordHash = await bcrypt.hash(password, 12);

          const newUser = await prisma.adminUser.create({
              data: {
                  email,
                  passwordHash,
                  name,
                  roleId: roleId || null,
                  isSuperAdmin: !!isSuperAdmin,
                  isActive: true
              }
          });

          // Remove password hash from response
          const { passwordHash: _, ...userWithoutPassword } = newUser;

          return res.status(201).json(userWithoutPassword);

      } catch (error) {
          console.error('Create user error:', error);
          return res.status(500).json({ error: 'Internal server error' });
      }
  }

  /**
   * Update User
   */
  async updateUser(req: Request, res: Response) {
      try {
          const { id } = req.params;
          const { name, email, roleId, isSuperAdmin, isActive, password } = req.body;

          const updateData: any = { name, email, roleId, isSuperAdmin, isActive };
          
          if (password) {
              updateData.passwordHash = await bcrypt.hash(password, 12);
          }

          const updatedUser = await prisma.adminUser.update({
              where: { id },
              data: updateData
          });

          return res.json(updatedUser);

      } catch (error) {
           console.error('Update user error:', error);
           return res.status(500).json({ error: 'Internal server error' });
      }
  }

  /**
   * Delete User
   */
  async deleteUser(req: Request, res: Response) {
      try {
          const { id } = req.params;
          await prisma.adminUser.delete({ where: { id } });
          return res.json({ success: true, message: 'User deleted' });
      } catch (error) {
          console.error('Delete user error:', error);
          return res.status(500).json({ error: 'Internal server error' });
      }
  }

  /**
   * List Roles
   */
  async listRoles(req: Request, res: Response) {
      try {
          const roles = await prisma.adminRole.findMany({
              orderBy: { name: 'asc' }
          });
          return res.json(roles);
      } catch (error) {
          console.error('List roles error:', error);
          return res.status(500).json({ error: 'Internal server error' });
      }
  }
}

export const adminUserController = new AdminUserController();
