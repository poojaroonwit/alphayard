import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/server/lib/prisma';
import { config } from '@/server/config/env';
import { buildCorsHeaders } from '@/server/lib/cors';

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(req) });
}

async function linkUserToApp(userId: string, req: NextRequest) {
  const appId = req.headers.get('x-app-id');
  const appSlug = req.headers.get('x-app-slug');
  if (!appId && !appSlug) return;
  const app = await prisma.application.findFirst({
    where: appId ? { id: appId } : { slug: appSlug! },
  });
  if (!app) return;
  await prisma.userApplication.upsert({
    where: { userId_applicationId: { userId, applicationId: app.id } },
    create: { userId, applicationId: app.id },
    update: { lastActiveAt: new Date() },
  });
}

function buildTokens(user: { id: string; email: string; firstName: string; lastName: string }) {
  const payload = { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, type: 'user' };
  return {
    accessToken: jwt.sign(payload, config.JWT_SECRET, { expiresIn: '24h' }),
    refreshToken: jwt.sign({ id: user.id, type: 'refresh' }, config.JWT_SECRET, { expiresIn: '7d' }),
  };
}

export async function POST(req: NextRequest) {
  const cors = buildCorsHeaders(req);
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, phone } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, message: 'Email, password, first name, and last name are required' },
        { status: 400, headers: cors }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Valid email is required' },
        { status: 400, headers: cors }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 8 characters' },
        { status: 400, headers: cors }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // User already exists — authenticate instead of re-registering.
    // This handles the multi-app scenario where one account works across all applications.
    if (existingUser) {
      if (!existingUser.isActive) {
        return NextResponse.json(
          { success: false, message: 'Account is disabled. Please contact support.' },
          { status: 403, headers: cors }
        );
      }

      if (!existingUser.passwordHash) {
        return NextResponse.json(
          { success: false, message: 'Account uses SSO. Please sign in with your social provider.' },
          { status: 400, headers: cors }
        );
      }

      const passwordMatch = await bcrypt.compare(password, existingUser.passwordHash);
      if (!passwordMatch) {
        return NextResponse.json(
          { success: false, message: 'An account with this email already exists. Check your password and try logging in.' },
          { status: 409, headers: cors }
        );
      }

      await prisma.user.update({ where: { id: existingUser.id }, data: { lastLoginAt: new Date() } });
      await linkUserToApp(existingUser.id, req);

      const { accessToken, refreshToken } = buildTokens(existingUser);
      return NextResponse.json(
        {
          success: true,
          message: 'Welcome back! Signed in to your existing account.',
          user: {
            id: existingUser.id,
            email: existingUser.email,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName,
            phone: existingUser.phoneNumber,
            avatar: existingUser.avatarUrl,
            isActive: existingUser.isActive,
            isOnboardingComplete: existingUser.isOnboardingComplete,
            createdAt: existingUser.createdAt,
            updatedAt: existingUser.updatedAt,
          },
          accessToken,
          refreshToken,
        },
        { status: 200, headers: cors }
      );
    }

    // New user — create account
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone || null,
        isActive: true,
        isVerified: false,
        userType: 'user',
      },
    });

    await linkUserToApp(user.id, req);

    const { accessToken, refreshToken } = buildTokens(user);
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phoneNumber,
          avatar: user.avatarUrl,
          isActive: user.isActive,
          isOnboardingComplete: user.isOnboardingComplete,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
        refreshToken,
      },
      { status: 201, headers: cors }
    );
  } catch (error: any) {
    console.error('Mobile registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Registration failed. Please try again.' },
      { status: 500, headers: cors }
    );
  }
}
