import { pool } from '../config/database';

// Helper to enrich ChatRoom object with methods expected by Controller
const enrichChatRoom = (row: any) => {
  if (!row) return null;
  return {
    ...row,
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    type: row.type || 'hourse',
    description: '', // Schema doesn't have description
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    settings: {}, // Schema doesn't have settings

    // Methods expected by Controller
    toJSON: function () {
      return {
        id: this.id,
        familyId: this.familyId,
        name: this.name,
        type: this.type,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt
      };
    },

    isParticipant: async (userId: string) => {
      // In this schema, all family members are participants
      const res = await pool.query(
        'SELECT 1 FROM family_members WHERE family_id = $1 AND user_id = $2',
        [row.family_id, userId]
      );
      return res.rows.length > 0;
    },

    isAdmin: async (userId: string) => {
      const res = await pool.query(
        "SELECT 1 FROM family_members WHERE family_id = $1 AND user_id = $2 AND role = 'admin'",
        [row.family_id, userId]
      );
      return res.rows.length > 0;
    },

    getParticipants: async () => {
      const res = await pool.query(
        `SELECT u.id as user_id, u.first_name, u.last_name, u.avatar_url, fm.role, fm.joined_at 
             FROM family_members fm
             JOIN users u ON u.id = fm.user_id
             WHERE fm.family_id = $1`,
        [row.family_id]
      );
      return res.rows.map((p: any) => ({
        user_id: p.user_id,
        role: p.role,
        joined_at: p.joined_at,
        users: {
          id: p.user_id,
          firstName: p.first_name,
          lastName: p.last_name,
          avatarUrl: p.avatar_url,
          email: 'hidden'
        }
      }));
    },

    update: async (updates: any) => {
      const { name } = updates;
      // Only name is updateable in this simple schema
      if (name) {
        await pool.query('UPDATE chat_rooms SET name = $1, updated_at = NOW() WHERE id = $2', [name, row.id]);
      }
    },

    delete: async () => {
      await pool.query('DELETE FROM chat_rooms WHERE id = $1', [row.id]);
    }
  };
};

const enrichMessage = (row: any) => {
  if (!row) return null;
  return {
    ...row,
    id: row.id,
    chatRoomId: row.room_id,
    senderId: row.sender_id,
    content: row.content,
    type: row.type,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sender: row.sender ? {
      id: row.sender.id,
      firstName: row.sender.first_name,
      lastName: row.sender.last_name,
      avatarUrl: row.sender.avatar_url
    } : null,

    toJSON: function () {
      return {
        id: this.id,
        chatRoomId: this.chatRoomId,
        senderId: this.senderId,
        content: this.content,
        type: this.type,
        metadata: this.metadata,
        createdAt: this.createdAt,
        sender: this.sender,
        reactions: this.reactions || [],
        attachments: [] // Not implementing attachments in DB yet
      };
    },

    update: async (updates: any) => {
      if (updates.content) {
        await pool.query('UPDATE chat_messages SET content = $1, updated_at = NOW() WHERE id = $2', [updates.content, row.id]);
      }
    },

    delete: async () => {
      await pool.query('DELETE FROM chat_messages WHERE id = $1', [row.id]);
    },

    addReaction: async (userId: string, emoji: string) => {
      await pool.query(
        'INSERT INTO chat_message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [row.id, userId, emoji]
      );
    },

    removeReaction: async (userId: string, emoji: string) => {
      await pool.query(
        'DELETE FROM chat_message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
        [row.id, userId, emoji]
      );
    }
  }
}

export const Chat = {
  async findByFamilyId(familyId: string) {
    const res = await pool.query('SELECT * FROM chat_rooms WHERE family_id = $1', [familyId]);
    return res.rows.map(enrichChatRoom);
  },

  async findById(id: string) {
    const res = await pool.query('SELECT * FROM chat_rooms WHERE id = $1', [id]);
    return enrichChatRoom(res.rows[0]);
  },

  async create(data: any) {
    const { familyId, name, type } = data;
    const res = await pool.query(
      'INSERT INTO chat_rooms (family_id, name, type) VALUES ($1, $2, $3) RETURNING *',
      [familyId, name, type || 'hourse']
    );
    return enrichChatRoom(res.rows[0]);
  },

  // Participants managed via Family in this schema
  async addParticipant(...args: any[]) { return { success: true }; },
  async removeParticipant(...args: any[]) { return { success: true }; }
};

export const Message = {
  async findById(id: string) {
    const res = await pool.query(
      `SELECT cm.*, 
            json_build_object(
                'id', u.id,
                'first_name', u.first_name,
                'last_name', u.last_name,
                'avatar_url', u.avatar_url
            ) as sender,
            COALESCE((
              SELECT json_agg(json_build_object('id', cmr.id, 'emoji', cmr.emoji, 'userId', cmr.user_id))
              FROM chat_message_reactions cmr
              WHERE cmr.message_id = cm.id
            ), '[]') as reactions
           FROM chat_messages cm
           LEFT JOIN users u ON u.id = cm.sender_id
           WHERE cm.id = $1`,
      [id]
    );
    return enrichMessage(res.rows[0]);
  },

  async findByChatRoomId(chatId: string, options: any) {
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const res = await pool.query(
      `SELECT cm.*, 
            json_build_object(
                'id', u.id,
                'first_name', u.first_name,
                'last_name', u.last_name,
                'avatar_url', u.avatar_url
            ) as sender,
            COALESCE((
              SELECT json_agg(json_build_object('id', cmr.id, 'emoji', cmr.emoji, 'userId', cmr.user_id))
              FROM chat_message_reactions cmr
              WHERE cmr.message_id = cm.id
            ), '[]') as reactions
           FROM chat_messages cm
           LEFT JOIN users u ON u.id = cm.sender_id
           WHERE cm.room_id = $1 
           ORDER BY cm.created_at DESC
           LIMIT $2 OFFSET $3`,
      [chatId, limit, offset]
    );
    return res.rows.map(enrichMessage);
  },

  async create(data: any) {
    const { chatRoomId, senderId, content, type, metadata } = data;
    const res = await pool.query(
      'INSERT INTO chat_messages (room_id, sender_id, content, type, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [chatRoomId, senderId, content, type || 'text', metadata || {}]
    );
    // re-fetch to get sender details
    return this.findById(res.rows[0].id);
  }
};

export const ChatDatabaseService = {
  Chat,
  Message,

  // Legacy Adapter Methods for Socket support
  findChatRoomById: Chat.findById,
  findByFamilyId: Chat.findByFamilyId,
  createChatRoom: Chat.create,

  isParticipant: async (chatId: string, userId: string) => {
    const chat = await Chat.findById(chatId);
    return chat ? chat.isParticipant(userId) : false;
  },

  isAdmin: async (chatId: string, userId: string) => {
    const chat = await Chat.findById(chatId);
    return chat ? chat.isAdmin(userId) : false;
  },

  getParticipants: async (chatId: string) => {
    const chat = await Chat.findById(chatId);
    return chat ? chat.getParticipants() : [];
  },

  updateChatRoom: async (id: string, updates: any) => {
    const chat = await Chat.findById(id);
    if (chat) {
      await chat.update(updates);
      return Chat.findById(id);
    }
    return null;
  },

  deleteChatRoom: async (id: string) => {
    const chat = await Chat.findById(id);
    if (chat) {
      await chat.delete();
      return true;
    }
    return false;
  },

  // Participants stubs or implementations
  addParticipant: Chat.addParticipant,
  removeParticipant: Chat.removeParticipant,

  createMessage: Message.create,
  findMessageById: Message.findById,
  findMessagesByChatRoomId: Message.findByChatRoomId,

  updateMessage: async (id: string, updates: any) => {
    const msg = await Message.findById(id);
    if (msg) {
      await msg.update(updates);
      return Message.findById(id);
    }
    return null;
  },

  deleteMessage: async (id: string) => {
    const msg = await Message.findById(id);
    if (msg) {
      await msg.delete();
      return true;
    }
    return false;
  },

  addReaction: async (msgId: string, userId: string, emoji: string) => {
    const msg = await Message.findById(msgId);
    if (msg) {
      await msg.addReaction(userId, emoji);
      return true;
    }
    return false;
  },

  removeReaction: async (msgId: string, userId: string, emoji: string) => {
    const msg = await Message.findById(msgId);
    if (msg) {
      await msg.removeReaction(userId, emoji);
      return true;
    }
    return false;
  },

  getMessageReactions: async (msgId: string) => {
    const msg = await Message.findById(msgId);
    return msg ? (msg as any).toJSON().reactions : [];
  },

  markMessagesRead: async (roomId: string, userId: string) => {
    await pool.query(
      `INSERT INTO chat_message_reads (room_id, user_id, read_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (room_id, user_id) DO UPDATE SET read_at = NOW()`,
      [roomId, userId]
    );
    return true;
  }
};
