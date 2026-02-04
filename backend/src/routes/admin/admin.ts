import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../../config/database';
import { authenticateAdmin } from '../../middleware/adminAuth';
import { authenticateToken, requireRole } from '../../middleware/auth';
import emailService from '../../services/emailService';
import { UserModel } from '../../models/UserModel';
import { ApplicationModel } from '../../models/ApplicationModel';
import { auditAdminRequests } from '../../middleware/audit';
import circleService from '../../services/circleService';
import socialMediaService from '../../services/socialMediaService';

const router = express.Router();

// Apply audit middleware to admin router
router.use(auditAdminRequests());

// POST /api/admin/impersonate
router.post('/impersonate', authenticateAdmin as any, async (req: any, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Store impersonation info in session (if using cookie sessions) or issue a special token.
    if (req.session) {
      req.session.impersonateUserId = userId;
    }
    res.json({ message: 'Impersonation started', userId });
  } catch (e) {
    console.error('Impersonate error', e);
    res.status(500).json({ error: 'Failed to impersonate' });
  }
});

// POST /api/admin/stop-impersonate
router.post('/stop-impersonate', authenticateAdmin as any, async (req: any, res: Response) => {
  try {
    if (req.session) {
      delete req.session.impersonateUserId;
    }
    res.json({ message: 'Impersonation stopped' });
  } catch (e) {
    console.error('Stop impersonate error', e);
    res.status(500).json({ error: 'Failed to stop impersonation' });
  }
});

// Admin middleware - require admin role
const requireAdmin = requireRole('admin');

// Validation middleware
const validateUserUpdate = [
  body('firstName').optional().notEmpty().trim(),
  body('lastName').optional().notEmpty().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(['user', 'admin', 'moderator', 'super_admin']),
  body('status').optional().isIn(['active', 'inactive', 'suspended']),
  body('is_active').optional().isBoolean(),
  body('metadata').optional().isObject(),
  body('phone').optional().trim(),
];

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard stats
// @access  Private/Admin
router.get('/dashboard', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period as string);
    
    // Get basic stats using pool.query
    const basicsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE is_active = true) as active_users,
        (SELECT COUNT(*) FROM unified_entities WHERE type = 'circle' AND status != 'deleted') as total_families,
        (SELECT COUNT(*) FROM subscriptions WHERE status IN ('active', 'trialing')) as active_subscriptions,
        (SELECT COALESCE(SUM(jsonb_array_length(COALESCE(branding->'screens', '[]'::jsonb))), 0) FROM applications WHERE is_active = true) as total_screens
    `;
    const { rows: basics } = await pool.query(basicsQuery);
    const { total_users, active_users, total_families, active_subscriptions, total_screens } = basics[0];

    // Get recent activity counts
    const recentQuery = `
      SELECT 
        (SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '1 day' * $1) as recent_users,
        (SELECT COUNT(*) FROM unified_entities WHERE type = 'circle' AND created_at >= NOW() - INTERVAL '1 day' * $1) as recent_families,
        (SELECT COUNT(*) FROM unified_entities WHERE type = 'safety_alert' AND created_at >= NOW() - INTERVAL '1 day' * $1) as recent_alerts,
        (SELECT COUNT(*) FROM chat_messages WHERE created_at >= NOW() - INTERVAL '1 day' * $1) as recent_messages
    `;
    const { rows: recent } = await pool.query(recentQuery, [days]);
    const { recent_users, recent_families, recent_alerts, recent_messages } = recent[0];

    // Get revenue stats from subscriptions
    const revenueQuery = `
      SELECT 
        COALESCE(SUM((plan->>'price')::NUMERIC), 0) as total_revenue,
        COALESCE(AVG((plan->>'price')::NUMERIC), 0) as avg_revenue,
        COUNT(*) as subscription_count
      FROM subscriptions
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
    `;
    const { rows: revenue } = await pool.query(revenueQuery, [days]);

    // Get user growth by day
    const growthQuery = `
      SELECT 
        EXTRACT(YEAR FROM created_at) as year,
        EXTRACT(MONTH FROM created_at) as month,
        EXTRACT(DAY FROM created_at) as day,
        COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '1 day' * $1
      GROUP BY year, month, day
      ORDER BY year, month, day
    `;
    const { rows: userGrowth } = await pool.query(growthQuery, [days]);

    res.json({
      stats: {
        totalUsers: parseInt(total_users),
        activeUsers: parseInt(active_users),
        totalFamilies: parseInt(total_families),
        activeSubscriptions: parseInt(active_subscriptions),
        totalScreens: parseInt(total_screens),
        recentUsers: parseInt(recent_users),
        recentFamilies: parseInt(recent_families),
        recentAlerts: parseInt(recent_alerts),
        recentMessages: parseInt(recent_messages),
        revenue: {
          totalRevenue: parseFloat(revenue[0].total_revenue),
          avgRevenue: parseFloat(revenue[0].avg_revenue),
          subscriptionCount: parseInt(revenue[0].subscription_count),
        },
      },
      userGrowth: userGrowth.map(row => ({
        _id: { year: parseInt(row.year), month: parseInt(row.month), day: parseInt(row.day) },
        count: parseInt(row.count)
      })),
    });
  } catch (error: any) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private/Admin
router.get('/users', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      role,
      status,
      circle,
      subscription,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const params: any[] = [];
    let paramIdx = 1;
    let whereClause = 'WHERE 1=1';

    if (search) {
      whereClause += ` AND (u.email ILIKE $${paramIdx} OR u.first_name ILIKE $${paramIdx} OR u.last_name ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (role) {
      whereClause += ` AND u.raw_user_meta_data->>'role' = $${paramIdx}`;
      params.push(role);
      paramIdx++;
    }

    if (status) {
      whereClause += ` AND u.is_active = $${paramIdx}`;
      params.push(status === 'active');
      paramIdx++;
    }

    if (circle === 'true') {
      whereClause += ` AND EXISTS (SELECT 1 FROM entity_relations er WHERE er.source_id = u.id AND er.relation_type = 'member_of')`;
    } else if (circle === 'false') {
      whereClause += ` AND NOT EXISTS (SELECT 1 FROM entity_relations er WHERE er.source_id = u.id AND er.relation_type = 'member_of')`;
    }

    if (subscription === 'true') {
      whereClause += ` AND EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status IN ('active', 'trialing'))`;
    } else if (subscription === 'false') {
      whereClause += ` AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id AND s.status IN ('active', 'trialing'))`;
    }

    const sortField = ['created_at', 'email', 'first_name', 'last_name'].includes(sortBy as string) ? sortBy : 'created_at';
    const direction = (sortOrder as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const usersQuery = `
      SELECT u.id, u.email, u.first_name as "firstName", u.last_name as "lastName", 
             u.avatar_url as "avatarUrl", u.phone, u.is_active as "isActive", u.created_at as "createdAt",
             u.raw_user_meta_data as metadata,
             (SELECT json_agg(json_build_object('id', c.id, 'name', c.data->>'name')) 
              FROM unified_entities c 
              JOIN entity_relations er ON c.id = er.target_id 
              WHERE er.source_id = u.id AND er.relation_type = 'member_of') as circles
      FROM users u
      ${whereClause}
      ORDER BY u.${sortField} ${direction}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const countQuery = `SELECT COUNT(*) FROM users u ${whereClause}`;

    const [usersRes, countRes] = await Promise.all([
      pool.query(usersQuery, [...params, parseInt(limit as string), offset]),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countRes.rows[0].count);

    res.json({
      users: usersRes.rows,
      totalPages: Math.ceil(total / parseInt(limit as string)),
      currentPage: parseInt(page as string),
      total,
    });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/users/:id
// @desc    Get user details
// @access  Private/Admin
router.get('/users/:id', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    
    // Get user with circles
    const userQuery = `
      SELECT u.id, u.email, u.first_name as "firstName", u.last_name as "lastName", 
             u.avatar_url as "avatarUrl", u.phone, u.is_active as "isActive", 
             u.created_at as "createdAt", u.updated_at as "updatedAt",
             u.raw_user_meta_data as metadata,
             (SELECT json_agg(json_build_object(
               'id', c.id, 
               'name', c.data->>'name',
               'members', (SELECT count(*) FROM entity_relations WHERE target_id = c.id AND relation_type = 'member_of')
             ))
              FROM unified_entities c 
              JOIN entity_relations er ON c.id = er.target_id 
              WHERE er.source_id = u.id AND er.relation_type = 'member_of') as circles
      FROM users u
      WHERE u.id = $1
    `;
    const { rows: userRows } = await pool.query(userQuery, [userId]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];

    // Get user's subscription
    const { rows: subRows } = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1 LIMIT 1',
      [userId]
    );

    // Get user's recent activity (from safety_alerts)
    const { rows: recentAlerts } = await pool.query(
      "SELECT * FROM unified_entities WHERE owner_id = $1 AND type = 'safety_alert' AND data->>'type' = 'emergency' ORDER BY created_at DESC LIMIT 5",
      [userId]
    );

    const { rows: recentSafetyChecks } = await pool.query(
      "SELECT * FROM unified_entities WHERE owner_id = $1 AND type = 'safety_alert' AND data->>'type' = 'check_in' ORDER BY created_at DESC LIMIT 5",
      [userId]
    );

    res.json({
      user,
      subscription: subRows[0] || null,
      recentActivity: {
        alerts: recentAlerts,
        safetyChecks: recentSafetyChecks,
      },
    });
  } catch (error: any) {
    console.error('Get user details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/users/:id', authenticateAdmin as any, validateUserUpdate, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, role, status, is_active, metadata, phone, notes } = req.body;

    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields using UserModel static
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone;
    
    // Support both 'status' and 'is_active'
    if (is_active !== undefined) {
      updateData.isActive = is_active;
    } else if (status !== undefined) {
      updateData.isActive = (status === 'active');
    }

    if (metadata !== undefined) updateData.metadata = metadata;
    if (notes !== undefined) updateData.adminNotes = notes;

    const updated = await UserModel.findByIdAndUpdate(req.params.id, updateData);
    if (!updated) return res.status(500).json({ error: 'Failed to update user' });

    // Fetch the updated user row to return to the frontend
    const { rows } = await pool.query('SELECT *, raw_user_meta_data as metadata FROM users WHERE id = $1', [req.params.id]);
    const userRow = rows[0];

    res.json({
      message: 'User updated successfully',
      user: userRow
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:id', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is admin
    if (user.metadata?.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin user' });
    }

    // Delete user from DB (Cascade will handle safety_alerts, messages, circle_members if configured)
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/users/:id/suspend
// @desc    Suspend user
// @access  Private/Admin
router.post('/users/:id/suspend', authenticateAdmin as any, [
  body('reason').notEmpty().trim(),
  body('duration').optional().isInt({ min: 1 }),
], async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason, duration } = req.body;

    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const suspension = {
      reason,
      suspendedAt: new Date(),
      suspendedBy: req.user.id,
      duration: duration ? duration * 24 * 60 * 60 * 1000 : null,
      expiresAt: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null,
    };

    await UserModel.findByIdAndUpdate(req.params.id, {
      status: 'suspended',
      isActive: false,
      suspension
    });

    // Send suspension email
    await emailService.sendEmail({
      to: user.email,
      subject: 'Account Suspended',
      template: 'account-suspended',
      data: {
        name: user.firstName,
        reason,
        duration: duration ? `${duration} days` : 'indefinitely',
        supportEmail: process.env.SUPPORT_EMAIL,
      },
    });

    res.json({
      message: 'User suspended successfully',
      suspension,
    });
  } catch (error: any) {
    console.error('Suspend user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/users/:id/unsuspend
// @desc    Unsuspend user
// @access  Private/Admin
router.post('/users/:id/unsuspend', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await UserModel.findByIdAndUpdate(req.params.id, {
      status: 'active',
      isActive: true,
      suspension: null
    });

    // Send unsuspension email
    await emailService.sendEmail({
      to: user.email,
      subject: 'Account Reactivated',
      template: 'account-reactivated',
      data: {
        name: user.firstName,
      },
    });

    res.json({ message: 'User unsuspended successfully' });
  } catch (error: any) {
    console.error('Unsuspend user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/families
// @desc    Get all families
// @access  Private/Admin
router.get('/families', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const offset = (parseInt(page as string)-1) * parseInt(limit as string);
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIdx = 1;

    if (search) {
      whereClause += ` AND f.name ILIKE $${paramIdx}`;
      params.push(`%${search}%`);
      paramIdx++;
    }

    const sortField = ['created_at', 'name'].includes(sortBy as string) ? sortBy : 'created_at';
    const direction = (sortOrder as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const familiesQuery = `
      SELECT f.id, f.data->>'name' as name, f.data->>'description' as description, f.status, 
             f.created_at as "createdAt", f.owner_id as "ownerId",
             (SELECT COUNT(*) FROM entity_relations er WHERE er.target_id = f.id AND er.relation_type = 'member_of') as "memberCount",
             u.email as "ownerEmail",
             u.first_name || ' ' || u.last_name as "ownerName"
      FROM unified_entities f
      LEFT JOIN users u ON f.owner_id = u.id
      ${whereClause} AND f.type = 'circle'
      ORDER BY f.${sortField} ${direction}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const countQuery = `SELECT COUNT(*) FROM unified_entities f ${whereClause} AND f.type = 'circle'`;

    const [familiesRes, countRes] = await Promise.all([
      pool.query(familiesQuery, [...params, parseInt(limit as string), offset]),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countRes.rows[0].count);

    res.json({
      families: familiesRes.rows,
      totalPages: Math.ceil(total / parseInt(limit as string)),
      currentPage: parseInt(page as string),
      total,
    });
  } catch (error: any) {
    console.error('Get families error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/families/:id
// @desc    Get family details
// @access  Private/Admin
router.get('/families/:id', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id;

    // Get family details
    const familyQuery = `
      SELECT f.id, f.data->>'name' as name, f.data->>'description' as description, f.data as attributes, f.status, 
             f.created_at as "createdAt", f.updated_at as "updatedAt", f.owner_id as "ownerId",
             u.email as "ownerEmail",
             u.first_name || ' ' || u.last_name as "ownerName"
      FROM unified_entities f
      LEFT JOIN users u ON f.owner_id = u.id
      WHERE f.id = $1 AND f.type = 'circle'
    `;
    const { rows: familyRows } = await pool.query(familyQuery, [familyId]);

    if (familyRows.length === 0) {
      return res.status(404).json({ message: 'Family not found' });
    }

    const family = familyRows[0];

    // Get members
    const { rows: members } = await pool.query(`
      SELECT er.metadata->>'role' as role, er.created_at as "joinedAt", 
             u.id as "userId", u.email, u.first_name as "firstName", u.last_name as "lastName", u.avatar_url as "avatarUrl"
      FROM entity_relations er
      JOIN users u ON er.source_id = u.id
      WHERE er.target_id = $1 AND er.relation_type = 'member_of'
    `, [familyId]);

    res.json({
      ...family,
      members
    });
  } catch (error: any) {
    console.error('Get family details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/families', authenticateAdmin as any, [
  body('name').notEmpty().trim(),
], async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, type, adminId } = req.body;
    
    // Use circleService to create the circle
    const circle = await circleService.createCircle({
      name,
      description,
      owner_id: adminId || req.user.id,
      type: type || 'Circle'
    });

    res.status(201).json({
      id: circle.id,
      name: (circle.attributes as any).name,
      description: (circle.attributes as any).description,
      status: circle.status,
      createdAt: circle.createdAt,
      ownerId: circle.ownerId
    });
  } catch (error: any) {
    console.error('Create family error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/families/:id
// @desc    Update family
// @access  Private/Admin
router.put('/families/:id', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id;
    const { name, description, type, is_active } = req.body;

    const updated = await circleService.updateCircle(familyId, {
      name,
      description,
      type,
      status: is_active === false ? 'inactive' : 'active'
    });

    if (!updated) {
      return res.status(404).json({ message: 'Family not found' });
    }

    res.json({
      message: 'Family updated successfully',
      family: {
        id: updated.id,
        name: (updated.attributes as any).name,
        description: (updated.attributes as any).description,
        status: updated.status,
        updatedAt: updated.updatedAt
      },
    });
  } catch (error: any) {
    console.error('Update family error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/families/:id
// @desc    Delete family
// @access  Private/Admin
router.delete('/families/:id', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id;
    
    // Check if family exists
    const family = await circleService.getCircleById(familyId);
    if (!family) {
      return res.status(404).json({ message: 'Family not found' });
    }

    // Delete family (soft delete via service)
    await circleService.deleteCircle(familyId);

    res.json({ message: 'Family deleted successfully' });
  } catch (error: any) {
    console.error('Delete family error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/subscriptions
// @desc    Get all subscriptions
// @access  Private/Admin
router.get('/subscriptions', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      plan,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const offset = (parseInt(page as string)-1) * parseInt(limit as string);
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIdx = 1;

    if (status) {
      whereClause += ` AND s.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    if (plan) {
      whereClause += ` AND s.plan->>'id' = $${paramIdx}`;
      params.push(plan);
      paramIdx++;
    }

    const sortField = ['created_at', 'status'].includes(sortBy as string) ? sortBy : 'created_at';
    const direction = (sortOrder as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const subsQuery = `
      SELECT s.*,
             u.email as user_email,
             u.first_name || ' ' || u.last_name as user_name,
             c.data->>'name' as circle_name
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN unified_entities c ON s.circle_id = c.id
      ${whereClause}
      ORDER BY s.${sortField} ${direction}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const countQuery = `SELECT COUNT(*) FROM subscriptions s ${whereClause}`;

    const [subsRes, countRes] = await Promise.all([
      pool.query(subsQuery, [...params, parseInt(limit as string), offset]),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countRes.rows[0].count);

    res.json({
      subscriptions: subsRes.rows,
      totalPages: Math.ceil(total / parseInt(limit as string)),
      currentPage: parseInt(page as string),
      total,
    });
  } catch (error: any) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/alerts
// @desc    Get emergency alerts
// @access  Private/Admin
router.get('/alerts', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const offset = (parseInt(page as string)-1) * parseInt(limit as string);
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIdx = 1;

    if (status) {
      whereClause += ` AND sa.is_acknowledged = $${paramIdx}`;
      params.push(status === 'resolved' || status === 'acknowledged');
      paramIdx++;
    }

    if (type) {
      whereClause += ` AND sa.type = $${paramIdx}`;
      params.push(type);
      paramIdx++;
    }

    const sortField = ['created_at'].includes(sortBy as string) ? sortBy : 'created_at';
    const direction = (sortOrder as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const alertsQuery = `
      SELECT sa.id, sa.data, sa.metadata, sa.created_at, sa.status,
             u.email as user_email,
             u.first_name || ' ' || u.last_name as user_name
      FROM unified_entities sa
      JOIN users u ON sa.owner_id = u.id
      ${whereClause} AND sa.type = 'safety_alert'
      ORDER BY sa.${sortField} ${direction}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;

    const countQuery = `SELECT COUNT(*) FROM unified_entities sa ${whereClause} AND sa.type = 'safety_alert'`;

    const [alertsRes, countRes] = await Promise.all([
      pool.query(alertsQuery, [...params, parseInt(limit as string), offset]),
      pool.query(countQuery, params)
    ]);

    const total = parseInt(countRes.rows[0].count);

    res.json({
      alerts: alertsRes.rows,
      totalPages: Math.ceil(total / parseInt(limit as string)),
      currentPage: parseInt(page as string),
      total,
    });
  } catch (error: any) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/system
// @desc    Get system information
// @access  Private/Admin
router.get('/system', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    // Check DB connection
    let dbStatus = 'disconnected';
    try {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    } catch (e) {}

    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: {
        connection: dbStatus,
      },
      redis: {
        connection: 'connected',
      },
    };

    res.json({ systemInfo });
  } catch (error: any) {
    console.error('Get system info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/broadcast
// @desc    Send broadcast message
// @access  Private/Admin
router.post('/broadcast', authenticateAdmin as any, [
  body('title').notEmpty().trim(),
  body('message').notEmpty().trim(),
  body('type').isIn(['notification', 'email', 'both']),
  body('target').optional().isIn(['all', 'active', 'premium']),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, message, type, target = 'all' } = req.body;

    let userQuery = 'SELECT id, email, first_name as "firstName" FROM users WHERE is_active = true';
    if (target === 'premium') {
      userQuery = `
        SELECT u.id, u.email, u.first_name as "firstName"
        FROM users u 
        JOIN subscriptions s ON u.id = s.user_id 
        WHERE u.is_active = true AND s.status IN ('active', 'trialing')
      `;
    }

    const { rows: users } = await pool.query(userQuery);
    const results: any[] = [];

    for (const user of users) {
      try {
        if (type === 'email' || type === 'both') {
          await emailService.sendEmail({
            to: user.email,
            subject: title,
            template: 'admin-broadcast',
            data: {
              name: user.firstName,
              message,
            },
          });
        }
        // Notification logic would go here

        results.push({
          userId: user.id,
          email: user.email,
          success: true,
        });
      } catch (error: any) {
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          error: error.message,
        });
      }
    }

    res.json({
      message: 'Broadcast sent successfully',
      results: {
        total: users.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        details: results,
      },
    });
  } catch (error: any) {
    console.error('Broadcast error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/social-posts
// @desc    Get all social posts for admin
// @access  Private/Admin
router.get('/social-posts', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const { rows: posts } = await pool.query(`
      SELECT sp.id, sp.data, sp.metadata, sp.created_at as "createdAt",
             u.first_name as "firstName", u.last_name as "lastName", u.email as "userEmail",
             f.data->>'name' as "circleName"
      FROM unified_entities sp
      LEFT JOIN users u ON sp.owner_id = u.id
      LEFT JOIN unified_entities f ON (sp.data->>'circle_id')::uuid = f.id
      WHERE sp.type = 'post' AND sp.status != 'deleted'
      ORDER BY sp.created_at DESC
    `);
    
    // Map to the format expected by the frontend
    const formattedPosts = posts.map(post => ({
      id: post.id,
      data: post.data,
      metadata: post.metadata,
      createdAt: post.createdAt,
      circleName: post.circleName,
      user: {
        firstName: post.firstName || 'Unknown',
        lastName: post.lastName || '',
        email: post.userEmail
      }
    }));

    res.json({ success: true, posts: formattedPosts });
  } catch (error: any) {
    console.error('Get admin social posts error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/social-posts/:id
// @desc    Delete a social post
// @access  Private/Admin
router.delete('/social-posts/:id', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE unified_entities SET status = 'deleted' WHERE id = $1 AND type = 'post'", [id]);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete admin social post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/applications
// @desc    Get all applications
// @access  Private/Admin
router.get('/applications', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const apps = await ApplicationModel.findAll();
    res.json({ applications: apps });
  } catch (error: any) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/applications
// @desc    Create new application
// @access  Private/Admin
router.post('/applications', authenticateAdmin as any, [
  body('name').notEmpty().trim(),
  body('slug').notEmpty().trim().isSlug(),
], async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, slug, description, branding, settings } = req.body;
    
    // Check if slug exists
    const existing = await ApplicationModel.findBySlug(slug);
    if (existing) {
      return res.status(400).json({ message: 'Application with this slug already exists' });
    }

    const app = await ApplicationModel.create({
      name,
      slug,
      description,
      branding,
      settings
    });

    // Create initial version
    await ApplicationModel.createVersion(app.id, {
        branding: app.branding,
        settings: app.settings,
        status: 'published'
    });

    res.status(201).json(app);
  } catch (error: any) {
    console.error('Create application error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/applications/:id
// @desc    Update application details
// @access  Private/Admin
router.put('/applications/:id', authenticateAdmin as any, [
  body('name').optional().notEmpty().trim(),
  body('slug').optional().notEmpty().trim().isSlug(),
], async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, slug, description, is_active } = req.body;
    
    // If slug is changing, check for uniqueness
    if (slug) {
        const existing = await ApplicationModel.findBySlug(slug);
        if (existing && existing.id !== req.params.id) {
            return res.status(400).json({ message: 'Application with this slug already exists' });
        }
    }

    const updated = await ApplicationModel.update(req.params.id, {
        name,
        slug,
        description,
        isActive: is_active
    });

    if (!updated) {
        return res.status(404).json({ message: 'Application not found' });
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Update application error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// --- Versioning Routes ---

// @route   GET /api/admin/applications/:id/versions
// @desc    Get versions for an application
router.get('/applications/:id/versions', authenticateAdmin as any, async (req: Request, res: Response) => {
    try {
        const versions = await ApplicationModel.getVersions(req.params.id);
        res.json({ versions });
    } catch (error: any) {
        console.error('Get app versions error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/applications/:id/versions
// @desc    Create a new draft version
router.post('/applications/:id/versions', authenticateAdmin as any, async (req: Request, res: Response) => {
    try {
        const { branding, settings } = req.body;
        // Optionally fetch latest published if body is empty? For now assume body provided or we clone current.
        // If body is empty, let's clone from the live app
        let initialData = { branding, settings };
        
        if (!branding && !settings) {
            const app = await ApplicationModel.findById(req.params.id);
            if (!app) return res.status(404).json({ message: 'App not found' });
            initialData = { branding: app.branding, settings: app.settings };
        }

        const version = await ApplicationModel.createVersion(req.params.id, {
            ...initialData,
            status: 'draft'
        });
        res.status(201).json(version);
    } catch (error: any) {
        console.error('Create app version error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   PUT /api/admin/applications/:id/versions/:versionId
// @desc    Update a draft version
router.put('/applications/:id/versions/:versionId', authenticateAdmin as any, async (req: Request, res: Response) => {
    try {
        const { branding, settings, status } = req.body;
        const version = await ApplicationModel.updateVersion(req.params.versionId, { branding, settings, status });
        
        if (!version) return res.status(404).json({ message: 'Version not found' });
        res.json(version);
    } catch (error: any) {
        console.error('Update app version error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST /api/admin/applications/:id/versions/:versionId/publish
// @desc    Publish a version
router.post('/applications/:id/versions/:versionId/publish', authenticateAdmin as any, async (req: Request, res: Response) => {
    try {
        await ApplicationModel.publishVersion(req.params.id, req.params.versionId);
        res.json({ message: 'Version published successfully' });
    } catch (error: any) {
        console.error('Publish app version error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   GET /api/admin/entities/types
// @desc    Get all entity types
// @access  Private/Admin
router.get('/entities/types', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        id, 
        name, 
        display_name as "displayName", 
        title,
        description, 
        icon, 
        category, 
        api_endpoint as "apiEndpoint", 
        response_key as "responseKey",
        searchable,
        columns, 
        schema, 
        is_system as "isSystem",
        search_placeholder as "searchPlaceholder",
        can_create as "canCreate",
        can_update as "canUpdate",
        can_delete as "canDelete"
      FROM entity_types 
      ORDER BY category, title ASC
    `);
    res.json({ success: true, types: rows });
  } catch (error: any) {
    console.error('Get entity types error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/entities/types/:name
// @desc    Get entity type by name
// @access  Private/Admin
router.get('/entities/types/:name', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { rows } = await pool.query(`
      SELECT 
        id, 
        name, 
        display_name as "displayName", 
        title,
        description, 
        icon, 
        category, 
        api_endpoint as "apiEndpoint", 
        response_key as "responseKey",
        searchable,
        columns, 
        schema, 
        is_system as "isSystem",
        search_placeholder as "searchPlaceholder",
        can_create as "canCreate",
        can_update as "canUpdate",
        can_delete as "canDelete"
      FROM entity_types 
      WHERE name = $1
    `, [name]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Entity type not found' });
    }
    
    res.json({ success: true, entityType: rows[0] });
  } catch (error: any) {
    console.error('Get entity type error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/admin/application-settings
// @desc    Upsert application setting
// @access  Private/Admin
router.post('/application-settings', authenticateAdmin as any, async (req: Request, res: Response) => {
  try {
    const { setting_key, setting_value, setting_type, category, description, is_public } = req.body;

    if (!setting_key) {
        return res.status(400).json({ error: 'setting_key is required' });
    }

    const valueStr = typeof setting_value === 'object' ? JSON.stringify(setting_value) : setting_value;

    const { rows } = await pool.query(
      `INSERT INTO app_settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = NOW()
       RETURNING *`,
      [setting_key, valueStr]
    );

    // Sync 'branding' key to applications table to ensure Admin UI (which reads from applications) stays in sync with Mobile (which reads from app_settings)
    if (setting_key === 'branding') {
        try {
            await pool.query(
                `UPDATE applications SET branding = $1::jsonb, updated_at = NOW() WHERE is_active = true`,
                [valueStr]
            );
            console.log('Synced global branding to applications table');
        } catch (syncError) {
            console.error('Failed to sync branding to applications table:', syncError);
            // Don't fail the request, just log
        }
    }

    res.json({ setting: rows[0] });
  } catch (error: any) {
    console.error('Upsert application setting error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
