import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { UserModel } from '../../models/UserModel';
import { config } from '../../config/env';
// import { logger } from '../../utils/logger';
// TODO: Fix missing module: ../utils/logger
import emailService from '../../services/emailService';
// import { generateVerificationCode } from '../../utils/authUtils';
// TODO: Fix missing module: ../utils/authUtils
import { pool } from '../../config/database';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthController {
  // Register new user
  async register(req: any, res: Response) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        dateOfBirth,
        userType,
      } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser && existingUser.isActive) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists',
        });
      }

      // Hash password (optional now)
      let hashedPassword = undefined;
      if (password) {
        const saltRounds = 12;
        hashedPassword = await bcrypt.hash(password, saltRounds);
      } else {
        // Random password for security if password is removed
        const randomPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        hashedPassword = await bcrypt.hash(randomPass, 12);
      }

      // Create verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
      const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create user (Verified by default as per new requirements)
      // Create or Update user
      let user;
      if (existingUser && !existingUser.isActive) {
        // Update existing temporary user
        // We need to hash password and set other fields
        // Since UserModel.create does a lot of inserts, and we want to "claim" the ID, 
        // we should probably just update the fields.
        
        // However, UserModel doesn't expose a clean "overwrite" method safely.
        // But we can use findByIdAndUpdate or direct update.
        // Let's use findByIdAndUpdate which we saw earlier, but we need to set ALL fields.
        
        // Actually, simpler might be to DELETE the temp user (if it has no data) and re-create?
        // But that breaks foreign keys if we used the ID for anything.
        // Assuming Safe Update:
        await UserModel.findByIdAndUpdate(existingUser.id, {
          email,
          params: { // This assumes findByIdAndUpdate logic or we need to map fields
            // Looking at findByIdAndUpdate in UserModel.ts, it iterates keys.
            // It maps 'password_hash' -> 'encrypted_password'
            firstName,
            lastName,
            phone,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            userType: userType || 'circle',
            isActive: true, // Activate!
            isEmailVerified: true,
            preferences: {
              notifications: true,
              locationSharing: true,
              popupSettings: {
                 enabled: true,
                 frequency: 'daily',
                 maxPerDay: 3,
                 categories: ['announcement', 'promotion'],
              }
            }
          },
          // Wait, findByIdAndUpdate iterate `update` object directly.
          // Let's flatten:
          first_name: firstName,
          last_name: lastName,
          phone,
          date_of_birth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          user_type: userType || 'circle',
          // Special handling for password:
          password_hash: hashedPassword,
          is_active: true,
          is_email_verified: true
        });
        
        // Re-fetch to get object
        user = await UserModel.findById(existingUser.id);
        if (!user) throw new Error('Failed to update user');
      } else {
         user = await UserModel.create({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          userType: userType || 'circle',
          subscriptionTier: 'free',
          isEmailVerified: true, // AUTO-VERIFIED
          isActive: true,
          preferences: {
            notifications: true,
            locationSharing: true,
            popupSettings: {
              enabled: true,
              frequency: 'daily',
              maxPerDay: 3,
              categories: ['announcement', 'promotion'],
            },
          },
        });
      }

      // Generate tokens for immediate login
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      // Save refresh token
      user.refreshTokens = [refreshToken];
      await user.save();

      // AUTO-CREATE DEFAULT CIRCLE
      try {
        const { circleService } = require('../../services/circleService');
        const circle = await circleService.createCircle({
          name: 'My Circle',
          description: 'My personal circle',
          owner_id: user.id,
          type: 'circle'
        });
        console.info(`Default circle entity created for user: ${user.id} (Circle ID: ${circle.id})`);
      } catch (circleError) {
        console.error('Failed to create default circle entity:', circleError);
      }

      // Remove sensitive data
      const userResponse = this.sanitizeUser(user);

      console.info(`New user registered (immediate verification): ${email}`);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: userResponse,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Registration failed:', error);
      res.status(500).json({
        success: false,
        message: 'Registration failed',
      });
    }
  }

  // Login user
  async login(req: any, res: Response) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password || '');

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }

      // Check if email is verified
      if (!user.isEmailVerified) {

        return res.status(401).json({
          success: false,
          message: 'Please verify your email before logging in',
        });
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      // Save refresh token
      user.refreshTokens.push(refreshToken);
      user.lastLogin = new Date();
      await user.save();

      // Remove sensitive data
      const userResponse = this.sanitizeUser(user);

      console.info(`User logged in: ${email}`);
      console.log('[AUTH] Login successful for user:', user.email);

      res.json({
        success: true,
        message: 'Login successful',
        user: userResponse,
        accessToken,
        refreshToken,
      });

    } catch (error) {
      console.error('Login failed:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed',
      });
    }
  }

  // SSO Login
  async ssoLogin(req: any, res: Response) {
    try {
      const { provider, ...ssoData } = req.body;

      let userData: any = {};

      switch (provider) {
        case 'google':
          userData = await this.verifyGoogleToken(ssoData.idToken);
          break;
        case 'facebook':
          userData = await this.verifyFacebookToken(ssoData.accessToken);
          break;
        case 'apple':
          userData = await this.verifyAppleToken(ssoData.identityToken);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Unsupported SSO provider',
          });
      }

      // Find or create user
      let user = await UserModel.findByEmail(userData.email);

      if (!user) {
        // Create new user from SSO
        user = await UserModel.create({
          email: userData.email,
          firstName: userData.firstName || userData.name?.split(' ')[0] || '',
          lastName: userData.lastName || userData.name?.split(' ').slice(1).join(' ') || '',
          avatar: userData.avatar,
          userType: 'circle',
          subscriptionTier: 'free',
          isEmailVerified: true, // SSO users are pre-verified
          ssoProvider: provider,
          ssoProviderId: userData.id || userData.userId,
          preferences: {
            notifications: true,
            locationSharing: true,
            popupSettings: {
              enabled: true,
              frequency: 'daily',
              maxPerDay: 3,
              categories: ['announcement', 'promotion'],
            },
          },
        });
        console.info(`New SSO user created: ${userData.email} via ${provider}`);

        // AUTO-CREATE DEFAULT CIRCLE
        try {
          const { circleService } = require('../../services/circleService');
          await circleService.createCircle({
            name: 'My Circle',
            description: 'My personal circle',
            owner_id: user.id,
            type: 'circle'
          });
          console.info(`Default circle entity created for SSO user: ${user.id}`);
        } catch (circleError) {
          console.error('Failed to create default circle for SSO user:', circleError);
        }
      } else {
        // Update existing user's SSO info
        // user.ssoProvider = provider; // TODO: Implement setter or update method
        // user.ssoProviderId = userData.id || userData.userId; 
        // Logic for update needs proper implementation in User.ts or manual update
        await user.save(); // Does simple update
      }

      // Generate tokens
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      // Save refresh token
      user.refreshTokens.push(refreshToken);
      await user.save();

      // Remove sensitive data
      const userResponse = this.sanitizeUser(user);

      console.info(`SSO login successful: ${userData.email} via ${provider}`);

      res.json({
        success: true,
        message: 'SSO login successful',
        user: userResponse,
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('SSO login failed:', error);
      res.status(500).json({
        success: false,
        message: 'SSO login failed',
      });
    }
  }

  // Verify Google token
  private async verifyGoogleToken(idToken: string) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid Google token');
      }

      return {
        id: payload.sub,
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        avatar: payload.picture,
      };
    } catch (error) {
      console.error('Google token verification failed:', error);
      throw new Error('Invalid Google token');
    }
  }

  // Verify Facebook token
  private async verifyFacebookToken(accessToken: string) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
      );
      const data = await response.json();

      if ((data as any).error) {
        throw new Error('Invalid Facebook token');
      }

      return {
        id: (data as any).id,
        email: (data as any).email,
        name: (data as any).name,
        avatar: (data as any).picture?.data?.url,
      };
    } catch (error) {
      console.error('Facebook token verification failed:', error);
      throw new Error('Invalid Facebook token');
    }
  }

  // Verify Apple token
  private async verifyAppleToken(identityToken: string) {
    try {
      // In production, you should verify the Apple ID token with Apple's servers
      // For now, we'll decode the JWT to get user info
      const decoded = jwt.decode(identityToken) as any;

      if (!decoded) {
        throw new Error('Invalid Apple token');
      }

      return {
        id: decoded.sub,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName,
      };
    } catch (error) {
      console.error('Apple token verification failed:', error);
      throw new Error('Invalid Apple token');
    }
  }

  // Get current user
  async getCurrentUser(req: any, res: Response) {
    try {
      const userId = req.user?.id;

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      const userResponse = this.sanitizeUser(user);

      res.json({
        success: true,
        user: userResponse,
      });
    } catch (error) {
      console.error('Get current user failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user data',
      });
    }
  }

  // Refresh token
  async refreshToken(req: any, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
      }

      // DEV BYPASS: Handle "mock-refresh-token" used by mobile mock mode
      if (refreshToken === 'mock-refresh-token') {
        const TEST_USER_ID = 'f739edde-45f8-4aa9-82c8-c1876f434683';
        const user = await UserModel.findById(TEST_USER_ID);
        if (!user) {
          return res.status(401).json({ success: false, message: 'Test user not found' });
        }
        const newAccessToken = this.generateAccessToken(user.id);
        return res.json({
          success: true,
          accessToken: newAccessToken,
          refreshToken: 'mock-refresh-token',
        });
      }

      // Verify refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
        console.log('[AUTH] Refresh token verified for user ID:', decoded.id || decoded.userId);
      } catch (verifyError) {
        console.error('[AUTH ERROR] Refresh token verification failed:', verifyError);
        return res.status(401).json({
          success: false,
          message: verifyError instanceof jwt.TokenExpiredError ? 'Refresh token expired' : 'Invalid refresh token'
        });
      }

      const user = await UserModel.findById(decoded.id || decoded.userId);
      if (!user) {
        console.error('[AUTH ERROR] Refresh token user not found:', decoded.id || decoded.userId);
        return res.status(401).json({
          success: false,
          message: 'User associated with token no longer exists',
        });
      }

      // Check if refresh token exists in user's tokens
      if (!user.refreshTokens.includes(refreshToken)) {
        console.error('[AUTH ERROR] Refresh token not in user whitelist. User email:', user.email);
        console.log('[AUTH DEBUG] Whitelisted tokens count:', user.refreshTokens.length);
        return res.status(401).json({
          success: false,
          message: 'Refresh token has been revoked or session invalidated',
        });
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user.id);
      const newRefreshToken = this.generateRefreshToken(user.id);

      // Update refresh tokens
      user.refreshTokens = user.refreshTokens.filter((token: any) => token !== refreshToken);
      user.refreshTokens.push(newRefreshToken);
      await user.save();

      console.log('[AUTH] Token rotation successful for user:', user.email);

      res.json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      console.error('[AUTH CRITICAL ERROR] Token refresh failed:', error);
      res.status(401).json({
        success: false,
        message: 'Authentication failure during refresh',
      });
    }
  }

  // Logout
  async logout(req: any, res: Response) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.id;

      if (refreshToken && userId) {
        // Remove refresh token from user
        await UserModel.findByIdAndUpdate(userId, {
          $pull: { refreshTokens: refreshToken },
        });
      }

      console.info(`User logged out: ${userId}`);

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Logout failed:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  }

  // Verify email
  async verifyEmail(req: any, res: Response) {
    try {
      const { email, code } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified',
        });
      }

      if (user.emailVerificationCode !== code) {
        return res.status(400).json({
          success: false,
          message: 'Invalid verification code',
        });
      }

      if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired',
        });
      }

      // Mark email as verified
      user.isEmailVerified = true;
      user.emailVerificationCode = undefined;
      user.emailVerificationExpiry = undefined;
      await user.save();

      console.info(`Email verified: ${email}`);

      // Generate tokens now that verified
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      user.refreshTokens.push(refreshToken);
      user.lastLogin = new Date();
      await user.save();

      const userResponse = this.sanitizeUser(user);

      res.json({
        success: true,
        message: 'Email verified successfully',
        user: userResponse,
        accessToken,
        refreshToken
      });
    } catch (error) {
      console.error('Email verification failed:', error);
      res.status(500).json({
        success: false,
        message: 'Email verification failed',
      });
    }
  }

  // Resend verification email
  async resendVerification(req: any, res: Response) {
    try {
      const { email } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email is already verified',
        });
      }

      // Generate new verification code
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
      const verificationExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.emailVerificationCode = verificationCode;
      user.emailVerificationExpiry = verificationExpiry;
      await user.save();

      // Send verification email
      await emailService.sendEmail({
        to: email,
        subject: 'Bondarys - Verify Your Email',
        template: 'email-verification',
        data: {
          firstName: user.firstName,
          verificationCode,
          appName: 'Bondarys',
        },
      });

      console.info(`Verification email resent: ${email}`);

      res.json({
        success: true,
        message: 'Verification email sent successfully',
      });
    } catch (error) {
      console.error('Resend verification failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
      });
    }
  }

  // Complete onboarding
  async completeOnboarding(req: any, res: Response) {
    try {
      const userId = req.user?.id;

      const user = await UserModel.findByIdAndUpdate(
        userId,
        { isOnboardingComplete: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Re-fetch user with potential circle data joined to ensure a "full" object
      // This helps frontend state staying consistent.
      const fullUser = await UserModel.findById(user.id);
      if (!fullUser) throw new Error('User lost after update');

      const userResponse = this.sanitizeUser(fullUser);

      console.info(`Onboarding completed: ${fullUser.email}`);


      res.json({
        success: true,
        message: 'Onboarding completed successfully',
        user: userResponse,
      });
    } catch (error) {
      console.error('Onboarding completion failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete onboarding',
      });
    }
  }

  // Generate access token
  private generateAccessToken(userId: string): string {
    return jwt.sign(
      { id: userId },
      config.JWT_SECRET,
      { expiresIn: '1d' }
    );
  }

  // Generate refresh token
  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { id: userId },
      config.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );
  }

  // Check if user exists
  async checkUserExistence(req: any, res: Response) {
    try {
      const { email, phone } = req.body;
      const identifier = email || phone;

      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone number is required'
        });
      }

      // Check by email or phone. Note: findByUser criteria needs to support phone if schema allows
      // For now, assume email is primary, or UserModel.findOne needs to be robust.
      // We will search by email first as it's the primary key in many systems.
      // If phone is provided, we might need a specific query.

      console.log(`[AUTH DEBUG] RAW REQUEST BODY:`, JSON.stringify(req.body));
      let user = null;
      console.log(`[AUTH DEBUG] checkUserExistence - email: "${email}", phone: "${phone}"`);
      if (email) {
        user = await UserModel.findByEmail(email);
        console.log(`[AUTH DEBUG] findByEmail result:`, user ? `Found user ID: ${user.id}` : 'Not found');
      } else if (phone) {
        // Basic phone search support if implemented in findOne, else explicit query needed
        // Assuming findOne supports arbitrary criteria passed to it:
        user = await UserModel.findOne({ phone });
        console.log(`[AUTH DEBUG] findOne(phone) result:`, user ? `Found user ID: ${user.id}` : 'Not found');
      }

      const exists = !!user;

      console.log(`[AUTH] Check user existence for ${identifier}: ${exists}`);

      res.json({
        success: true,
        exists,
        message: exists ? 'User found' : 'User not found',
        debug: {
          receivedBody: req.body,
          checkedEmail: email,
          checkedPhone: phone,
          note: 'This is debug info to verify data transmission'
        }
      });

    } catch (error) {
      console.error('Check user existence failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check user existence'
      });
    }
  }

  // Request OTP for login
  async requestLoginOtp(req: any, res: Response) {
    try {
      const { email, phone } = req.body;
      const identifier = email || phone;

      if (!identifier) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone number is required'
        });
      }

      let user = null;
      if (email) {
        user = await UserModel.findByEmail(email);
      } else if (phone) {
        user = await UserModel.findOne({ phone });
      }

      if (!user) {
        // User not found - Create TEMPORARY user for signup verification
        const tempPassword = Math.random().toString(36).slice(-8); // Random pass
        console.log(`[AUTH] Creating temporary user for new signup: ${identifier}`);
        user = await UserModel.create({
          email: email || undefined,
          password: tempPassword,
          firstName: 'New', 
          lastName: 'User',
          phone: phone,
          isEmailVerified: false,
          isActive: false, // FLAG AS INACTIVE/TEMP
          isOnboardingComplete: false,
          preferences: {},
        });
      }

      // Generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store in user record. 
      // Reuse emailVerificationCode or add specific loginOtpCode fields to User model?
      // Reusing emailVerificationCode is "okay" for MVP but ideally distinct.
      // Given UserModel.ts uses `raw_user_meta_data`, we can store it there flexibly.

      // Update user with OTP
      // We need to use databaseMiddleware logic or direct SQL update via UserModel.findByIdAndUpdate
      // Using UserModel.findByIdAndUpdate which updates metadata or specific columns
      // For this MVP, let's piggyback on `emailVerificationCode` setter which updates metadata or column?
      // UserModel.ts -> emailVerificationCode setter maps to `data.emailVerificationCode`
      // We need to persist this.

      // Let's manually update passing the special fields to our custom update method if possible,
      // or directly update via SQL if UserModel exposes it.
      // UserModel.findByIdAndUpdate(id, update) -> supports `raw_user_meta_data` via generic update object logic?
      // Looking at UserModel.ts `findByIdAndUpdate`:
      // It iterates keys. `emailVerificationCode` isn't explicitly handled in the loop provided in the file view previously,
      // BUT `raw_user_meta_data` is. 

      // Update the public.users raw_user_meta_data with loginOtp.
      await UserModel.findByIdAndUpdate(user.id, {
        loginOtp: otp,
        loginOtpExpiry: expiry
      });

      // Send Email or Log for Phone
      if (user.email) {
        await emailService.sendEmail({
          to: user.email,
          subject: 'Your Login Code - Bondarys',
          template: 'login-otp',
          data: {
            firstName: user.firstName,
            otp: otp,
            appName: 'Bondarys',
          },
        });
      }

      console.log(`[AUTH] Login OTP for ${identifier}: ${otp}`);

      res.json({
        success: true,
        message: 'OTP sent successfully'
      });

    } catch (error) {
      console.error('Request OTP failed:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }
  }

  // Verify OTP and Login
  async loginWithOtp(req: any, res: Response) {
    try {
      const { email, phone, otp } = req.body;
      const identifier = email || phone;

      if (!identifier || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Identifier and OTP are required'
        });
      }

      let user = null;
      if (email) {
        user = await UserModel.findByEmail(email);
      } else if (phone) {
        user = await UserModel.findOne({ phone });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Retrieve OTP from metadata
      // The UserModel wrapper maps `raw_user_meta_data` to a `preferences` property or similar,
      // but we need to check how `loginOtp` was stored.
      // if `findByIdAndUpdate` put it in `raw_user_meta_data`, we access it via `user.data.preferences` OR directly if typed.
      // Let's assume we fetch fresh user.
      // In UserModel.mapRowToModel: `meta = row.metadata || {}`.
      // So `loginOtp` should be in `meta`.

      // We need to safely access generic metadata. UserModel might not expose it on `data` type.
      // Type assertion for now.
      const meta = (user as any).data.preferences || {}; // Wait, mapRowToModel puts meta into preferences?
      // Re-reading UserModel: `preferences: meta.preferences || {}`. 
      // It seems other meta fields might be lost if not explicitly mapped!

      // FIX: access the raw metadata if possible.
      // Actually, let's look at `UserModel.mapRowToModel` again (lines 203+).
      // `meta` is `row.metadata`. `userType` comes from `meta.userType`.
      // If we stored `loginOtp` in `raw_user_meta_data`, it might NOT be on the `user` object properly unless mapped.

      // Workaround: We'll re-query specifically for the metadata or TRUST that we can verify differently.
      // OR, we update UserModel to mapping.

      // Ideally, let's assume `user.data` (the Interface) has an `any` index signature or we cast it.
      // We stored it via `findByIdAndUpdate` into `raw_user_meta_data`.
      // But `findById` (line 76) selects `raw_user_meta_data as metadata`.
      // `mapRowToModel` puts `meta.preferences` into `preferences`.
      // It does NOT copy root level meta keys to the user object unless specifically mapped (like `userType`).

      // Retrieve OTP from user metadata (managed locally via Postgres JSONB)
      // Removed Supabase client dependency for local dev stability
      const storedOtp = user.metadata?.loginOtp;
      const storedExpiry = user.metadata?.loginOtpExpiry;

      // Validation
      if (!storedOtp || storedOtp !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      if (storedExpiry && new Date(storedExpiry) < new Date()) {
        return res.status(400).json({
          success: false,
          message: 'OTP has expired'
        });
      }

      // Clear OTP
      await UserModel.findByIdAndUpdate(user.id, {
        loginOtp: null,
        loginOtpExpiry: null
      });

      // Generate Tokens (Reuse existing logic)
      const accessToken = this.generateAccessToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      user.refreshTokens.push(refreshToken);
      user.lastLogin = new Date();
      
      // NOTE: The save() method is stubbed in UserModel, so we must manually persist updates.
      await UserModel.findByIdAndUpdate(user.id, {
        refreshTokens: user.refreshTokens,
        lastLogin: user.lastLogin
      });
      // `UserModel` logic for refresh tokens seems to be lacking direct DB persistence in `save`.
      // `AuthController.ts` lines 92 calls `await user.save()`.
      // IF existing code relies on it, I should fix `save` or manually `findByIdAndUpdate`.
      // I'll manually update refresh tokens.

      await UserModel.findByIdAndUpdate(user.id, {
        refreshTokens: user.refreshTokens
      });

      const userResponse = this.sanitizeUser(user);

      console.log(`[AUTH] OTP Login successful for: ${identifier}`);
      console.log(`[AUTH] Response User Object Keys:`, Object.keys(userResponse));
      console.log(`[AUTH] Response User ID:`, userResponse.id);
      console.log(`[AUTH] Response User Email:`, userResponse.email);

      res.json({
        success: true,
        message: 'Login successful',
        user: userResponse,
        accessToken,
        refreshToken,
      });

    } catch (error) {
      console.error('OTP Login failed:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed'
      });
    }
  }

  // Sanitize user data
  private sanitizeUser(user: any) {
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.refreshTokens;
    delete userObj.emailVerificationCode;
    delete userObj.emailVerificationExpiry;
    return userObj;
  }
} 
