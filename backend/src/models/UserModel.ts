import { query } from '../config/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface IUser {
  _id?: string; // Compatibility
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string; // Standard camelCase
  avatar?: string;    // Compatibility alias
  phone?: string;
  userType: 'circle' | 'children' | 'seniors';
  circleIds: string[];
  isEmailVerified: boolean;
  preferences: any;
  metadata?: any; // Added for generic metadata access
  deviceTokens: string[];
  refreshTokens: string[];
  isOnboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  role?: string;
  // Methods
  comparePassword?: (candidate: string) => Promise<boolean>;
  save?: () => Promise<IUser>;
}

export class UserModel {
  private data: IUser;

  constructor(data: IUser) {
    this.data = data;
    // Bind methods
    this.comparePassword = this.comparePassword.bind(this);
    this.save = this.save.bind(this);
  }

  // Getters to forward access to data properties
  get id() { return this.data.id; }
  get _id() { return this.data.id; } // Mongoose compatibility
  get email() { return this.data.email; }
  get firstName() { return this.data.firstName; }
  get lastName() { return this.data.lastName; }
  get avatarUrl() { return this.data.avatarUrl; }
  get password() { return this.data.password; }
  get circleIds() { return this.data.circleIds; }
  get isActive() { return this.data.isActive; }
  get role() { return this.data.role; }
  get metadata() { return this.data.metadata; } // Expose metadata generic getter

  // Compatibility getters
  get isEmailVerified() { return this.data.isEmailVerified; }
  set isEmailVerified(val: boolean) { this.data.isEmailVerified = val; } // Setter needed for simple assignment if used

  get emailVerificationCode() { return (this.data as any).emailVerificationCode; }

  // ... existing code ...

  private static mapRowToModel(row: any): UserModel {
    let meta = row.raw_user_meta_data || {};
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
    }
    
    const names = (row.full_name || '').split(' ');

    const user: IUser = {
      id: row.id,
      email: row.email,
      password: row.password,
      firstName: row.first_name || names[0] || '',
      lastName: row.last_name || names.slice(1).join(' ') || '',
      avatarUrl: row.avatar_url || row.avatar,
      avatar: row.avatar_url || row.avatar, // Backwards compatibility
      phone: row.phone,
      userType: row.user_type || 'circle',
      circleIds: row.circle_ids || [],
      isEmailVerified: !!row.is_email_verified || !!row.email_confirmed_at,
      preferences: row.preferences || {},
      metadata: meta, 
      deviceTokens: meta.deviceTokens || [],
      refreshTokens: meta.refreshTokens || [],
      isOnboardingComplete: !!row.is_onboarding_complete,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      isActive: !!row.is_active,
      role: row.role
    };

    return new UserModel(user);
  }
  set emailVerificationCode(val: string | undefined) { (this.data as any).emailVerificationCode = val; }

  get emailVerificationExpiry() { return (this.data as any).emailVerificationExpiry; }
  set emailVerificationExpiry(val: Date | undefined) { (this.data as any).emailVerificationExpiry = val; }

  get refreshTokens() { return this.data.refreshTokens; }
  set refreshTokens(val: string[]) { this.data.refreshTokens = val; }

  get lastLogin() { return (this.data as any).lastLogin; }
  set lastLogin(val: Date | undefined) { (this.data as any).lastLogin = val; }

  get isOnboardingComplete() { return this.data.isOnboardingComplete; }
  set isOnboardingComplete(val: boolean) { this.data.isOnboardingComplete = val; }

  get popupSettings() { return this.data.preferences?.popupSettings; }
  set popupSettings(val: any) {
    if (!this.data.preferences) this.data.preferences = {};
    this.data.preferences.popupSettings = val;
  }

  // Helper method for toObject
  toObject() {
    return { ...this.data };
  }

  static async findById(id: string): Promise<UserModel | null> {
    const res = await query(`
      SELECT u.id, u.email, u.password_hash as password, u.created_at, u.updated_at,
             u.first_name, u.last_name, u.avatar_url, u.phone,
             (SELECT json_agg(target_id) FROM entity_relations WHERE source_id = u.id AND relation_type = 'member_of') as circle_ids,
             u.is_active, u.is_onboarding_complete,
             u.is_email_verified, u.role, u.raw_user_meta_data
      FROM public.users u
      WHERE u.id = $1
    `, [id]);

    if (res.rows.length === 0) return null;
    return UserModel.mapRowToModel(res.rows[0]);
  }

  static async findByEmail(email: string): Promise<UserModel | null> {
    return UserModel.findOne({ email });
  }

  static async findOne(criteria: any): Promise<UserModel | null> {
    // Basic support for finding by email or id
    let sql = `
      SELECT u.id, u.email, u.password_hash as password, u.created_at, u.updated_at,
             u.first_name, u.last_name, u.avatar_url, u.phone,
             (SELECT json_agg(target_id) FROM entity_relations WHERE source_id = u.id AND relation_type = 'member_of') as circle_ids,
             u.is_active, u.is_onboarding_complete,
             u.is_email_verified, u.role, u.raw_user_meta_data
      FROM public.users u
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIdx = 1;

    if (criteria.email) {
      sql += ` AND u.email = $${paramIdx++}`;
      params.push(criteria.email);
    }
    if (criteria.phone) {
      sql += ` AND u.phone = $${paramIdx++}`;
      params.push(criteria.phone);
    }
    if (criteria._id || criteria.id) {
      sql += ` AND u.id = $${paramIdx++}`;
      params.push(criteria._id || criteria.id);
    }
    // Add other fields as needed

    try {
      console.log('[UserModel.findOne] Executing SQL:', sql.replace(/\s+/g, ' ').trim());
      console.log('[UserModel.findOne] With params:', params);
      const res = await query(sql, params);
      console.log('[UserModel.findOne] Result rows:', res.rows.length);
      if (res.rows.length === 0) return null;
      return UserModel.mapRowToModel(res.rows[0]);
    } catch (error) {
      console.error('[UserModel.findOne] Database query failed:', error);
      throw error;
    }
  }

  static async create(userData: any): Promise<UserModel> {
    const client = await import('../config/database').then(m => m.pool.connect());
    try {
      await client.query('BEGIN');

      const userId = userData.id || uuidv4();
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Insert into public.users (native PostgreSQL)
      await client.query(`
         INSERT INTO public.users (id, email, password_hash, first_name, last_name, avatar_url, phone, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        userId,
        userData.email,
        hashedPassword,
        userData.firstName || 'New',
        userData.lastName || 'User',
        userData.avatar || null,
        userData.phone || null,
        userData.isActive !== undefined ? userData.isActive : true
      ]);

      await client.query('COMMIT');
      return UserModel.findById(userId) as Promise<UserModel>;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async findByIdAndUpdate(id: string, update: any, options?: any): Promise<UserModel | null> {
    const sets: string[] = [];
    const params: any[] = [id];
    let idx = 2;

    const columnMap: Record<string, string> = {
      email: 'email',
      firstName: 'first_name',
      lastName: 'last_name',
      firstName_lower: 'first_name',
      lastName_lower: 'last_name',
      avatarUrl: 'avatar_url',
      avatar: 'avatar_url',
      phone: 'phone',
      phoneNumber: 'phone',
      isActive: 'is_active',
      isActive_lower: 'is_active',
      isEmailVerified: 'is_email_verified',
      isEmailVerified_lower: 'is_email_verified',
      isOnboardingComplete: 'is_onboarding_complete',
      isOnboardingComplete_lower: 'is_onboarding_complete',
      userType: 'user_type',
      role: 'role'
    };

    // Generic metadata fields to be updated in JSONB
    const metadataUpdates: Record<string, any> = {};

    for (const [key, value] of Object.entries(update)) {
      if (columnMap[key]) {
        sets.push(`${columnMap[key]} = $${idx++}`);
        params.push(value);
      } else if (key === 'password_hash' || key === 'password') {
        sets.push(`password_hash = $${idx++}`);
        params.push(value);
      } else if (key === 'raw_user_meta_data' || key === 'metadata') {
        sets.push(`raw_user_meta_data = $${idx++}`);
        params.push(typeof value === 'object' ? JSON.stringify(value) : value);
      } else if (key === 'loginOtp' || key === 'loginOtpExpiry' || key === 'emailVerificationCode' || key === 'emailVerificationExpiry' || key === 'refreshTokens' || key === 'lastLogin' || key === 'deviceTokens' || key === 'isEmailVerified') {
        // These are typically stored in metadata in our current setup
        metadataUpdates[key] = value;
      }
    }

    // If we have metadata updates, handle them
    if (Object.keys(metadataUpdates).length > 0) {
      sets.push(`raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || $${idx++}`);
      params.push(JSON.stringify(metadataUpdates));
    }

    if (sets.length === 0) return UserModel.findById(id);

    const sql = `UPDATE public.users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1`;
    try {
      await query(sql, params);
      return UserModel.findById(id);
    } catch (error) {
      console.error('[UserModel.findByIdAndUpdate] Update failed:', error);
      throw error;
    }
  }

  // Instance methods
  async comparePassword(candidate: string): Promise<boolean> {
    if (!this.data.password) return false;
    return bcrypt.compare(candidate, this.data.password);
  }

  async save(): Promise<IUser> {
    // Implement actual save for native PG
    const updateData: any = { ...this.data };

    // Remove complex fields that map to other tables or are managed separately
    delete updateData.id;
    delete updateData._id;
    delete updateData.password;
    delete updateData.circleIds;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.metadata; // Remove redundant metadata object to prevent nesting

    await UserModel.findByIdAndUpdate(this.id, updateData);
    return this.data;
  }

  // Helper
}
