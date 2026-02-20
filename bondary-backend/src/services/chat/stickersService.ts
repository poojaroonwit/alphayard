import { prisma } from '../../lib/prisma';

export interface StickerPack {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string;
  author?: string;
  isOfficial: boolean;
  isAnimated: boolean;
  isPremium: boolean;
  downloadCount: number;
  stickers?: Sticker[];
  createdAt: Date;
}

export interface Sticker {
  id: string;
  packId: string;
  emoji?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  isAnimated: boolean;
  displayOrder: number;
  createdAt: Date;
}

export interface UserStickerPack {
  packId: string;
  addedAt: Date;
  pack: StickerPack;
}

export class StickersService {
  // Get all available sticker packs
  async getAllPacks(includeStickers: boolean = false): Promise<StickerPack[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_sticker_packs ORDER BY is_official DESC, download_count DESC
    `;

    const packs = result.map(row => this.mapStickerPack(row));

    if (includeStickers) {
      for (const pack of packs) {
        pack.stickers = await this.getPackStickers(pack.id);
      }
    }

    return packs;
  }

  // Get user's sticker packs
  async getUserPacks(userId: string): Promise<UserStickerPack[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT usp.*, sp.*
      FROM bondarys.chat_user_sticker_packs usp
      JOIN bondarys.chat_sticker_packs sp ON usp.pack_id = sp.id
      WHERE usp.user_id = ${userId}::uuid
      ORDER BY usp.added_at DESC
    `;

    return result.map(row => ({
      packId: row.pack_id,
      addedAt: row.added_at,
      pack: this.mapStickerPack(row),
    }));
  }

  // Get stickers in a pack
  async getPackStickers(packId: string): Promise<Sticker[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_stickers WHERE pack_id = ${packId}::uuid ORDER BY display_order
    `;
    return result.map(row => this.mapSticker(row));
  }

  // Add sticker pack to user's collection
  async addPackToUser(userId: string, packId: string): Promise<boolean> {
    try {
      await prisma.$executeRaw`
        INSERT INTO bondarys.chat_user_sticker_packs (user_id, pack_id)
        VALUES (${userId}::uuid, ${packId}::uuid)
        ON CONFLICT (user_id, pack_id) DO NOTHING
      `;

      // Increment download count
      await prisma.$executeRaw`
        UPDATE bondarys.chat_sticker_packs SET download_count = download_count + 1 WHERE id = ${packId}::uuid
      `;

      return true;
    } catch (error) {
      return false;
    }
  }

  // Remove sticker pack from user's collection
  async removePackFromUser(userId: string, packId: string): Promise<boolean> {
    const result = await prisma.$executeRaw`
      DELETE FROM bondarys.chat_user_sticker_packs WHERE user_id = ${userId}::uuid AND pack_id = ${packId}::uuid
    `;
    return (result ?? 0) > 0;
  }

  // Get user's recent stickers
  async getRecentStickers(userId: string, limit: number = 30): Promise<Sticker[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT s.*, rs.used_at, rs.use_count
      FROM bondarys.chat_recent_stickers rs
      JOIN bondarys.chat_stickers s ON rs.sticker_id = s.id
      WHERE rs.user_id = ${userId}::uuid
      ORDER BY rs.used_at DESC
      LIMIT ${limit}
    `;
    return result.map(row => this.mapSticker(row));
  }

  // Track sticker usage
  async trackStickerUsage(userId: string, stickerId: string): Promise<void> {
    await prisma.$executeRaw`
      INSERT INTO bondarys.chat_recent_stickers (user_id, sticker_id)
      VALUES (${userId}::uuid, ${stickerId}::uuid)
      ON CONFLICT (user_id, sticker_id) 
      DO UPDATE SET used_at = NOW(), use_count = bondarys.chat_recent_stickers.use_count + 1
    `;
  }

  // Get sticker by ID
  async getSticker(stickerId: string): Promise<Sticker | null> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_stickers WHERE id = ${stickerId}::uuid
    `;
    return result[0] ? this.mapSticker(result[0]) : null;
  }

  // Search stickers by emoji
  async searchByEmoji(userId: string, emoji: string): Promise<Sticker[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT s.* FROM bondarys.chat_stickers s
      JOIN bondarys.chat_user_sticker_packs usp ON s.pack_id = usp.pack_id
      WHERE usp.user_id = ${userId}::uuid AND s.emoji = ${emoji}
      ORDER BY s.display_order
      LIMIT 20
    `;
    return result.map(row => this.mapSticker(row));
  }

  // Get pack details
  async getPack(packId: string): Promise<StickerPack | null> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_sticker_packs WHERE id = ${packId}::uuid
    `;

    if (result.length === 0) return null;

    const pack = this.mapStickerPack(result[0]);
    pack.stickers = await this.getPackStickers(packId);

    return pack;
  }

  // Check if user has pack
  async userHasPack(userId: string, packId: string): Promise<boolean> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 1 FROM bondarys.chat_user_sticker_packs WHERE user_id = ${userId}::uuid AND pack_id = ${packId}::uuid
    `;
    return (result.length ?? 0) > 0;
  }

  // Get featured/popular packs
  async getFeaturedPacks(limit: number = 10): Promise<StickerPack[]> {
    const result = await prisma.$queryRaw<any[]>`
      SELECT * FROM bondarys.chat_sticker_packs 
      WHERE is_official = TRUE OR download_count > 100
      ORDER BY is_official DESC, download_count DESC
      LIMIT ${limit}
    `;
    return result.map(row => this.mapStickerPack(row));
  }

  private mapStickerPack(row: any): StickerPack {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      thumbnailUrl: row.thumbnail_url,
      author: row.author,
      isOfficial: row.is_official,
      isAnimated: row.is_animated,
      isPremium: row.is_premium,
      downloadCount: row.download_count || 0,
      createdAt: row.created_at,
    };
  }

  private mapSticker(row: any): Sticker {
    return {
      id: row.id,
      packId: row.pack_id,
      emoji: row.emoji,
      fileUrl: row.file_url,
      thumbnailUrl: row.thumbnail_url,
      width: row.width,
      height: row.height,
      isAnimated: row.is_animated,
      displayOrder: row.display_order,
      createdAt: row.created_at,
    };
  }
}

export const stickersService = new StickersService();
