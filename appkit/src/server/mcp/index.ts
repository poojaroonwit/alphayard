/**
 * MCP Server Implementation
 * Model Context Protocol server for AI-assisted mobile app development
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import entityService from '../services/EntityService';

// Store active transports for session management
const activeTransports = new Map<string, SSEServerTransport>();

// Define schemas separately to avoid TS2589 (excessive type instantiation depth)
const ListUsersSchema = {
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional()
};

const GetUserSchema = {
  userId: z.string()
};

const SearchUsersSchema = {
  query: z.string(),
  limit: z.number().optional()
};

const PaginationSchema = {
  page: z.number().optional(),
  limit: z.number().optional()
};

const CircleIdSchema = {
  circleId: z.string()
};

const AppConfigSchema = {};

const CircleTypesSchema = {};

const ListConversationsSchema = {
  userId: z.string().optional(),
  limit: z.number().optional()
};

const GetMessagesSchema = {
  conversationId: z.string(),
  limit: z.number().optional()
};

// --- Dynamic Collection Schemas ---

const ListCollectionsSchema = {
  applicationId: z.string().optional()
};

const GetCollectionSchemaDetails = {
  typeName: z.string()
};

const ListCollectionItemsSchema = {
  typeName: z.string(),
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
  orderBy: z.string().optional(),
  orderDir: z.enum(['asc', 'desc']).optional(),
  applicationId: z.string().optional()
};

const GetCollectionItemSchema = {
  typeName: z.string(), // Included for API consistency, though ID is unique
  id: z.string()
};

const CreateCollectionItemSchema = {
  typeName: z.string(),
  applicationId: z.string().optional(),
  attributes: z.record(z.any()), // Dynamic attributes
  metadata: z.record(z.any()).optional()
};

const UpdateCollectionItemSchema = {
  id: z.string(),
  attributes: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  status: z.string().optional()
};

const DeleteCollectionItemSchema = {
  id: z.string(),
  hard: z.boolean().optional()
};

/**
 * Create and configure the MCP server with all tools and resources
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'boundary-admin-mcp',
    version: '1.0.0'
  });

  // Helper to create tool result
  const success = (data: any) => ({
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }]
  });
  
  const error = (msg: string) => ({
    content: [{ type: 'text' as const, text: `Error: ${msg}` }],
    isError: true
  });

  // ====== USER MANAGEMENT TOOLS ======
  
  server.tool(
    'list_users',
    'List users with optional pagination and filters',
    ListUsersSchema as any,
    async (args: any) => {
      try {
        const { page = 1, limit = 20, search } = args;
        const offset = (page - 1) * limit;

        const where = search ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } }
          ]
        } : {};

        const users = await prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: Math.min(limit, 100),
          skip: offset
        });

        return success({ users, pagination: { page, limit } });
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  server.tool(
    'get_user',
    'Get a user by their ID',
    GetUserSchema as any,
    async (args: any) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: args.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            createdAt: true
          }
        });
        if (!user) return error(`User not found: ${args.userId}`);
        return success(user);
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  server.tool(
    'search_users',
    'Search for users by name or email',
    SearchUsersSchema as any,
    async (args: any) => {
      try {
        const users = await prisma.user.findMany({
          where: {
            OR: [
              { email: { contains: args.query, mode: 'insensitive' as const } },
              { firstName: { contains: args.query, mode: 'insensitive' as const } },
              { lastName: { contains: args.query, mode: 'insensitive' as const } }
            ]
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          },
          orderBy: {
            firstName: 'asc'
          },
          take: Math.min(args.limit || 20, 50)
        });
        return success({ users, count: users.length });
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  // ====== CIRCLE TOOLS ======

  server.tool(
    'list_circles',
    'List circles/groups',
    PaginationSchema as any,
    async (args: any) => {
      try {
        const { page = 1, limit = 20 } = args;
        const offset = (page - 1) * limit;
        const circles = await prisma.circle.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            _count: {
              select: {
                members: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: Math.min(limit, 100),
          skip: offset
        });

        const circlesWithCount = circles.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
          createdAt: c.createdAt,
          memberCount: c._count.members
        }));

        return success({ circles: circlesWithCount, pagination: { page, limit } });
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  server.tool(
    'get_circle',
    'Get a circle by ID',
    CircleIdSchema as any,
    async (args: any) => {
      try {
        const circle = await prisma.circle.findUnique({
          where: { id: args.circleId },
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true
          }
        });
        if (!circle) return error(`Circle not found: ${args.circleId}`);
        return success(circle);
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  // ====== CONFIG TOOLS ======

  server.tool(
    'get_app_config',
    'Get application configuration',
    AppConfigSchema as any,
    async () => {
      try {
        const application = await prisma.application.findFirst({
          select: {
            id: true,
            name: true,
            branding: true,
            settings: true
          }
        });
        if (!application) return error('No app config found');
        return success({
          id: application.id,
          name: application.name,
          displayName: application.name,
          description: null,
          features: application.settings,
          settings: application.settings
        });
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  server.tool(
    'get_circle_types',
    'Get available circle types',
    CircleTypesSchema as any,
    async () => {
      try {
        const circleTypes = await prisma.circleType.findMany({
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            icon: true,
            color: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        });
        return success({ circleTypes });
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  // ====== CHAT TOOLS ======

  server.tool(
    'list_conversations',
    'List chat conversations',
    ListConversationsSchema as any,
    async (args: any) => {
      try {
        const { userId, limit = 20 } = args;
        const where = userId ? {
          participants: {
            some: {
              userId
            }
          }
        } : {};

        const conversations = await prisma.chatRoom.findMany({
          where,
          select: {
            id: true,
            type: true,
            name: true,
            updatedAt: true
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: Math.min(limit, 50)
        });

        return success({ conversations });
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  server.tool(
    'get_messages',
    'Get messages in a conversation',
    GetMessagesSchema as any,
    async (args: any) => {
      try {
        const messages = await prisma.chatMessage.findMany({
          where: {
            roomId: args.conversationId
          },
          select: {
            id: true,
            senderId: true,
            content: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: Math.min(args.limit || 50, 100)
        });
        return success({ messages: messages.reverse() });
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  // ====== DYNAMIC COLLECTION TOOLS ======

  server.tool(
    'list_collections',
    'List all available dynamic collections (entity types)',
    ListCollectionsSchema as any,
    async (args: any) => {
      try {
        const { applicationId } = args;
        const types = await entityService.listEntityTypes(applicationId);
        return success({ 
          collections: types.map(t => ({
            id: t.id,
            name: t.name,
            displayName: t.displayName,
            description: t.description,
            isSystem: t.isSystem,
            icon: t.icon
          })) 
        });
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  server.tool(
    'get_collection_schema',
    'Get the schema definition for a specific collection',
    GetCollectionSchemaDetails as any,
    async (args: any) => {
      try {
        const { typeName } = args;
        const entityType = await entityService.getEntityType(typeName);
        if (!entityType) return error(`Collection '${typeName}' not found`);
        return success({ schema: entityType });
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  server.tool(
    'list_collection_items',
    'List items in a collection with filtering',
    ListCollectionItemsSchema as any,
    async (args: any) => {
      try {
        const { typeName, page, limit, search, orderBy, orderDir, applicationId } = args;
        
        let result;
        if (search) {
          const items = await entityService.searchEntities(typeName, search, {
            applicationId,
            limit
          });
          result = { items, total: items.length };
        } else {
          result = await entityService.queryEntities(typeName, {
            applicationId,
            page,
            limit,
            orderBy,
            orderDir
          });
        }
        
        return success(result);
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  server.tool(
    'get_collection_item',
    'Get a specific item from a collection',
    GetCollectionItemSchema as any,
    async (args: any) => {
      try {
        const { id } = args;
        const item = await entityService.getEntity(id);
        if (!item) return error(`Item not found: ${id}`);
        return success(item);
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  server.tool(
    'create_collection_item',
    'Create a new item in a collection',
    CreateCollectionItemSchema as any,
    async (args: any) => {
      try {
        const item = await entityService.createEntity(args);
        return success(item);
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  server.tool(
    'update_collection_item',
    'Update an existing item in a collection',
    UpdateCollectionItemSchema as any,
    async (args: any) => {
      try {
        const { id, ...updates } = args;
        const item = await entityService.updateEntity(id, updates);
        return success(item);
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  server.tool(
    'delete_collection_item',
    'Delete an item from a collection',
    DeleteCollectionItemSchema as any,
    async (args: any) => {
      try {
        const result = await entityService.deleteEntity(args.id, args.hard);
        return success({ success: result });
      } catch (e) {
        return error((e as Error).message);
      }
    }
  );

  console.log('[MCP] Server created with 16 tools');
  return server;
}

/**
 * Create Express router for MCP endpoints
 */
export function createMcpRouter(): Router {
  const router = Router();
  const mcpApiKey = process.env.MCP_API_KEY || 'default-mcp-key-change-in-production';

  // API Key authentication
  const auth = (req: Request, res: Response, next: Function) => {
    const key = req.headers['x-mcp-api-key'] || req.query.apiKey;
    if (!key || key !== mcpApiKey) {
      return res.status(401).json({ error: 'Invalid MCP API key' });
    }
    next();
  };

  // SSE endpoint
  router.get('/sse', auth, async (req: Request, res: Response) => {
    console.log('[MCP] SSE connection requested');

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sessionId = `s-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const transport = new SSEServerTransport('/api/mcp/messages', res);
    activeTransports.set(sessionId, transport);

    const server = createMcpServer();
    
    try {
      await transport.start();
      await server.connect(transport);
      console.log(`[MCP] Connected: ${sessionId}`);
    } catch (e) {
      console.error('[MCP] Connection error:', e);
    }

    req.on('close', () => {
      activeTransports.delete(sessionId);
      server.close();
    });
  });

  // Message endpoint
  router.post('/messages', auth, async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    const transport = activeTransports.get(sessionId);
    if (!transport) return res.status(404).json({ error: 'Session not found' });

    try {
      await transport.handlePostMessage(req, res);
    } catch (e) {
      res.status(500).json({ error: 'Internal error' });
    }
  });

  // Health check
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', server: 'boundary-mcp', sessions: activeTransports.size });
  });

  // List tools
  router.get('/tools', auth, (_req, res) => {
    res.json({
      tools: [
        'list_users', 'get_user', 'search_users',
        'list_circles', 'get_circle',
        'get_app_config', 'get_circle_types',
        'list_conversations', 'get_messages',
        'list_collections', 'get_collection_schema', 'list_collection_items',
        'get_collection_item', 'create_collection_item', 'update_collection_item', 'delete_collection_item'
      ]
    });
  });

  console.log('[MCP] Router ready');
  return router;
}

export { McpServer };
