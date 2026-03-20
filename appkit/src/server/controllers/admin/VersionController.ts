
import { Request, Response } from 'express';
import { prisma } from '@/server/lib/prisma';

export class VersionController {
  private getApplicationId(req: Request) {
    return req.headers['x-application-id'] as string;
  }

  async getVersionHistory(req: Request, res: Response) {
    try {
      const { pageId } = req.query;
      if (!pageId) return res.status(400).json({ error: 'pageId is required' });
      
      const versions = await prisma.pageVersion.findMany({
        where: { pageId: String(pageId) },
        orderBy: { versionNumber: 'desc' }
      });
      return res.json({ versions });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getVersion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const version = await prisma.pageVersion.findUnique({
        where: { id },
        include: { page: true }
      });
      if (!version) return res.status(404).json({ error: 'Version not found' });
      return res.json({ version });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getVersionByNumber(req: Request, res: Response) {
    try {
      const { pageId, versionNumber } = req.params;
      const version = await prisma.pageVersion.findFirst({
        where: { 
          pageId, 
          versionNumber: parseInt(versionNumber, 10) 
        }
      });
      if (!version) return res.status(404).json({ error: 'Version not found' });
      return res.json({ version });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async previewVersion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const version = await prisma.pageVersion.findUnique({ where: { id } });
      if (!version) return res.status(404).json({ error: 'Version not found' });
      return res.json({ preview: version.components });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async restoreVersion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const version = await prisma.pageVersion.findUnique({ where: { id } });
      if (!version) return res.status(404).json({ error: 'Version not found' });
      
      const page = await prisma.page.update({
        where: { id: version.pageId },
        data: { 
          components: version.components as any,
          versionNumber: { increment: 1 }
        }
      });
      
      // Create a new version entry for the restoration
      const applicationId = this.getApplicationId(req);
      await prisma.pageVersion.create({
        data: {
          pageId: page.id,
          applicationId,
          versionNumber: page.versionNumber,
          components: page.components as any,
          commitMessage: `Restored to version ${version.versionNumber}`
        } as any
      });
      
      return res.json({ message: 'Version restored successfully', page });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async compareVersions(req: Request, res: Response) {
    try {
      const { v1Id, v2Id } = req.body;
      const [v1, v2] = await Promise.all([
        prisma.pageVersion.findUnique({ where: { id: v1Id } }),
        prisma.pageVersion.findUnique({ where: { id: v2Id } })
      ]);
      return res.json({ v1, v2 });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async deleteVersion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.pageVersion.delete({ where: { id } });
      return res.json({ message: 'Version deleted successfully' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
