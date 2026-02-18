import { prisma } from '../lib/prisma';
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
  set isEmailVerified(val: boolean) { this.data.isEmailVerified = val; }

  get emailVerificationCode() { return (this.data as any).emailVerificationCode; }
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

  private static mapPrismaToModel(row: any): UserModel {
    let meta = row.preferences || {};
    if (typeof meta === 'string') {
      try { meta = JSON.parse(meta); } catch (e) { meta = {}; }
    }
    
    const firstName = row.firstName || '';
    const lastName = row.lastName || '';
    const fullName = row.fullName || `${firstName} ${lastName}`.trim();

    const user: IUser = {
      id: row.id,
      email: row.email,
      password: row.passwordHash,
      firstName: firstName,
      lastName: lastName,
      avatarUrl: row.avatarUrl,
      avatar: row.avatarUrl, // Backwards compatibility
      phone: row.phoneNumber,
      userType: row.userType || 'circle',
      circleIds: row.circleMemberships?.map((cm: any) => cm.circleId) || row.circleIds || [],
      isEmailVerified: !!row.isVerified,
      preferences: row.preferences || {},
      metadata: meta, 
      deviceTokens: meta.deviceTokens || [],
      refreshTokens: meta.refreshTokens || [],
      isOnboardingComplete: !!row.isOnboardingComplete,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt || row.createdAt,
      isActive: !!row.isActive,
      role: row.role || meta.role
    };

    return new UserModel(user);
  }

  static async findById(id: string): Promise<UserModel | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        circleMemberships: {
          select: { circleId: true }
        }
      }
    });

    if (!user) return null;
    return UserModel.mapPrismaToModel(user);
  }

  static async findByEmail(email: string): Promise<UserModel | null> {
    return UserModel.findOne({ email });
  }

  static async findOne(criteria: any): Promise<UserModel | null> {
    const where: any = {};

    if (criteria.email) {
      where.email = criteria.email;
    }
    if (criteria.phone) {
      where.phoneNumber = criteria.phone;
    }
    if (criteria._id || criteria.id) {
      where.id = criteria._id || criteria.id;
    }

    try {
      console.log('[UserModel.findOne] Query criteria:', where);
      const user = await prisma.user.findFirst({
        where,
        include: {
          circleMemberships: {
            select: { circleId: true }
          }
        }
      });
      console.log('[UserModel.findOne] Result:', user ? 'found' : 'NOT FOUND');
      
      if (!user) return null;
      return UserModel.mapPrismaToModel(user);
    } catch (error) {
      console.error('[UserModel.findOne] Database query failed:', error);
      throw error;
    }
  }

  static async create(userData: any): Promise<UserModel> {
    const userId = userData.id || uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 12);

    // Use Prisma transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          id: userId,
          email: userData.email,
          passwordHash: hashedPassword,
          firstName: userData.firstName || 'New',
          lastName: userData.lastName || 'User',
          avatarUrl: userData.avatar || null,
          phoneNumber: userData.phone || null,
          isActive: userData.isActive !== undefined ? userData.isActive : true
        },
        include: {
          circleMemberships: {
            select: { circleId: true }
          }
        }
      });

      return newUser;
    });

    return UserModel.mapPrismaToModel(user);
  }

  static async findByIdAndUpdate(id: string, update: any, options?: any): Promise<UserModel | null> {
    const data: any = {};
    const metadataUpdates: Record<string, any> = {};

    const fieldMap: Record<string, string> = {
      email: 'email',
      firstName: 'firstName',
      lastName: 'lastName',
      firstName_lower: 'firstName',
      lastName_lower: 'lastName',
      avatarUrl: 'avatarUrl',
      avatar: 'avatarUrl',
      phone: 'phoneNumber',
      phoneNumber: 'phoneNumber',
      isActive: 'isActive',
      isActive_lower: 'isActive',
      isVerified: 'isVerified'
    };

    for (const [key, value] of Object.entries(update)) {
      if (fieldMap[key]) {
        data[fieldMap[key]] = value;
      } else if (key === 'password_hash' || key === 'password') {
        data.passwordHash = value;
      } else if (key === 'raw_user_meta_data' || key === 'metadata') {
        // Store metadata in preferences JSON field
        data.preferences = typeof value === 'object' ? value : JSON.parse(value as string);
      } else if (['loginOtp', 'loginOtpExpiry', 'emailVerificationCode', 'emailVerificationExpiry', 'refreshTokens', 'lastLogin', 'deviceTokens'].includes(key)) {
        // These are stored in preferences
        metadataUpdates[key] = value;
      }
    }

    // If we have metadata updates, merge them with existing preferences
    if (Object.keys(metadataUpdates).length > 0) {
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: { preferences: true }
      });
      
      const existingMeta = (existingUser?.preferences as any) || {};
      data.preferences = { ...existingMeta, ...metadataUpdates };
    }

    if (Object.keys(data).length === 0) return UserModel.findById(id);

    try {
      await prisma.user.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
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
    // Implement actual save using Prisma
    const updateData: any = { ...this.data };

    // Remove complex fields that map to other tables or are managed separately
    delete updateData.id;
    delete updateData._id;
    delete updateData.password;
    delete updateData.circleIds;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.metadata;

    await UserModel.findByIdAndUpdate(this.id, updateData);
    return this.data;
  }
}
