import { query } from '../config/database';
import bcrypt from 'bcryptjs';

export interface IUser {
  _id?: string; // Compatibility
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  userType: 'hourse' | 'children' | 'seniors';
  familyIds: string[];
  isEmailVerified: boolean;
  preferences: any;
  metadata?: any; // Added for generic metadata access
  deviceTokens: string[];
  refreshTokens: string[];
  isOnboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
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
  get password() { return this.data.password; }
  get familyIds() { return this.data.familyIds; }
  get isActive() { return this.data.isActive; }
  get metadata() { return this.data.metadata; } // Expose metadata generic getter

  // Compatibility getters
  get isEmailVerified() { return this.data.isEmailVerified; }
  set isEmailVerified(val: boolean) { this.data.isEmailVerified = val; } // Setter needed for simple assignment if used

  get emailVerificationCode() { return (this.data as any).emailVerificationCode; }

  // ... existing code ...

  private static mapRowToModel(row: any): UserModel {
    const meta = row.metadata || {};
    const names = (row.full_name || '').split(' ');

    const user: IUser = {
      id: row.id,
      email: row.email,
      password: row.password,
      firstName: names[0] || meta.firstName || '',
      lastName: names.slice(1).join(' ') || meta.lastName || '',
      avatar: row.avatar_url,
      phone: row.phone,
      userType: meta.userType || 'hourse',
      familyIds: row.family_ids || [],
      isEmailVerified: !!row.email_confirmed_at,
      preferences: meta.preferences || {},
      metadata: meta, // Store raw metadata
      deviceTokens: meta.deviceTokens || [],
      refreshTokens: meta.refreshTokens || [],
      isOnboardingComplete: !!meta.isOnboardingComplete,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      isActive: true
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
      SELECT u.id, u.email, u.encrypted_password as password, u.created_at, u.email_confirmed_at,
             p.full_name, p.avatar_url, p.phone,
             (SELECT json_agg(family_id) FROM family_members WHERE user_id = u.id) as family_ids,
             u.raw_user_meta_data as metadata
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
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
      SELECT u.id, u.email, u.encrypted_password as password, u.created_at, u.email_confirmed_at,
             p.full_name, p.avatar_url, p.phone,
             (SELECT json_agg(family_id) FROM family_members WHERE user_id = u.id) as family_ids,
             u.raw_user_meta_data as metadata
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIdx = 1;

    if (criteria.email) {
      sql += ` AND u.email = $${paramIdx++}`;
      params.push(criteria.email);
    }
    if (criteria.phone) {
      sql += ` AND p.phone = $${paramIdx++}`;
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
    // Simplified creation
    const client = await import('../config/database').then(m => m.pool.connect());
    try {
      await client.query('BEGIN');

      // 1. Insert into auth.users (simulated)
      const userId = userData.id || crypto.randomUUID(); // Requires node 19+ or polyfill for crypto global
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      await client.query(`
         INSERT INTO auth.users (id, email, encrypted_password, created_at, updated_at, raw_user_meta_data)
         VALUES ($1, $2, $3, NOW(), NOW(), $4)
       `, [userId, userData.email, hashedPassword, userData]);

      // 2. Insert into profiles
      await client.query(`
         INSERT INTO public.profiles (id, full_name, avatar_url, phone)
         VALUES ($1, $2, $3, $4)
       `, [userId, `${userData.firstName} ${userData.lastName}`, userData.avatar, userData.phone]);

      // 3. Insert into public.users (Required for social FK constraints)
      await client.query(`
         INSERT INTO public.users (id, email, password_hash, first_name, last_name, avatar_url, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
      `, [
        userId,
        userData.email,
        hashedPassword,
        userData.firstName,
        userData.lastName,
        userData.avatar
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
    const metadataUpdates: any = {};

    for (const [key, value] of Object.entries(update)) {
      if (key === 'lastSeen' || key === 'lastLogin') {
        sets.push(`last_sign_in_at = $${idx++}`);
        params.push(value);
      } else if (key === 'email' || key === 'encrypted_password') {
        sets.push(`${key} = $${idx++}`);
        params.push(value);
      } else if (key === 'password_hash') {
        sets.push(`encrypted_password = $${idx++}`);
        params.push(value);
      } else if (key === '$pull') {
        // Special handling for Mongoose-style $pull (specifically for refreshTokens)
        const pullData = value as any;
        if (pullData.refreshTokens) {
          sets.push(`raw_user_meta_data = (COALESCE(raw_user_meta_data, '{}'::jsonb) - 'refreshTokens') || jsonb_build_object('refreshTokens', (COALESCE(raw_user_meta_data->'refreshTokens', '[]'::jsonb) - $${idx++}))`);
          params.push(pullData.refreshTokens);
        }
      } else if (key === '$push') {
        // Special handling for Mongoose-style $push
        const pushData = value as any;
        if (pushData.refreshTokens) {
          sets.push(`raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('refreshTokens', COALESCE(raw_user_meta_data->'refreshTokens', '[]'::jsonb) || jsonb_build_array($${idx++}))`);
          params.push(pushData.refreshTokens);
        }
      } else {
        // Collect metadata updates to merge efficiently
        metadataUpdates[key] = value;
      }
    }

    if (Object.keys(metadataUpdates).length > 0) {
      // Use Postgres JSONB merge operator || to update multiple keys at once
      sets.push(`raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || $${idx++}::jsonb`);
      params.push(JSON.stringify(metadataUpdates));
    }

    if (sets.length === 0) return UserModel.findById(id);

    await query(`UPDATE auth.users SET ${sets.join(', ')} WHERE id = $1`, params);
    return UserModel.findById(id);
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
    delete updateData.familyIds;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.metadata; // Remove redundant metadata object to prevent nesting

    await UserModel.findByIdAndUpdate(this.id, updateData);
    return this.data;
  }

  // Helper
}