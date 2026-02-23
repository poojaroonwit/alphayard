// Database-based Authentication Service
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface DatabaseAuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  permissions: string[]
}

export interface DatabaseAuthSession {
  id: string
  userId: string
  sessionToken: string
  refreshToken: string
  isActive: boolean
  expiresAt: Date
  user: DatabaseAuthUser
}

class DatabaseAuthService {
  // Create a new session in the database
  async createSession(userId: string, sessionToken: string, refreshToken: string, expiresAt: Date): Promise<DatabaseAuthSession> {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive')
    }

    // Create session
    const session = await prisma.userSession.create({
      data: {
        userId,
        sessionToken,
        refreshToken,
        expiresAt,
        isActive: true,
        lastActivityAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true
          }
        }
      }
    })

    // Transform to our interface
    return {
      id: session.id,
      userId: session.userId,
      sessionToken: session.sessionToken || '',
      refreshToken: session.refreshToken || '',
      isActive: session.isActive,
      expiresAt: session.expiresAt,
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: 'admin', // Default role for now
        permissions: ['read', 'write', 'admin'] // Default permissions for now
      }
    }
  }

  // Get session by token
  async getSessionByToken(token: string): Promise<DatabaseAuthSession | null> {
    const session = await prisma.userSession.findFirst({
      where: {
        sessionToken: token,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true
          }
        }
      }
    })

    if (!session || !session.user.isActive) {
      return null
    }

    // Update last activity
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() }
    })

    return {
      id: session.id,
      userId: session.userId,
      sessionToken: session.sessionToken || '',
      refreshToken: session.refreshToken || '',
      isActive: session.isActive,
      expiresAt: session.expiresAt,
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: 'admin', // Default role for now
        permissions: ['read', 'write', 'admin'] // Default permissions for now
      }
    }
  }

  // Get session by refresh token
  async getSessionByRefreshToken(refreshToken: string): Promise<DatabaseAuthSession | null> {
    const session = await prisma.userSession.findFirst({
      where: {
        refreshToken: refreshToken,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true
          }
        }
      }
    })

    if (!session || !session.user.isActive) {
      return null
    }

    return {
      id: session.id,
      userId: session.userId,
      sessionToken: session.sessionToken || '',
      refreshToken: session.refreshToken || '',
      isActive: session.isActive,
      expiresAt: session.expiresAt,
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: 'admin', // Default role for now
        permissions: ['read', 'write', 'admin'] // Default permissions for now
      }
    }
  }

  // Revoke session
  async revokeSession(sessionId: string): Promise<void> {
    await prisma.userSession.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        revokedAt: new Date()
      }
    })
  }

  // Revoke all user sessions
  async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.userSession.updateMany({
      where: {
        userId,
        isActive: true
      },
      data: {
        isActive: false,
        revokedAt: new Date()
      }
    })
  }

  // Clean up expired sessions
  async cleanupExpiredSessions(): Promise<void> {
    await prisma.userSession.updateMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        isActive: true
      },
      data: {
        isActive: false,
        revokedAt: new Date()
      }
    })
  }

  // Get active sessions for user
  async getUserActiveSessions(userId: string): Promise<DatabaseAuthSession[]> {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true
          }
        }
      },
      orderBy: {
        lastActivityAt: 'desc'
      }
    })

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      sessionToken: session.sessionToken || '',
      refreshToken: session.refreshToken || '',
      isActive: session.isActive,
      expiresAt: session.expiresAt,
      user: {
        id: session.user.id,
        email: session.user.email,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
        role: 'admin',
        permissions: ['read', 'write', 'admin']
      }
    }))
  }
}

export const databaseAuthService = new DatabaseAuthService()
