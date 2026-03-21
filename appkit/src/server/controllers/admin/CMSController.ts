
import { Request, Response } from 'express';
import { prisma } from '@/server/lib/prisma';

export class CMSController {
  private getApplicationId(req: Request): string | null {
    return (req.headers['x-application-id'] as string) || (req.query.applicationId as string) || null;
  }

  async getContent(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const { status, search, type } = req.query;
      const page = Math.max(1, parseInt(String(req.query.page || '1')));
      const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.page_size || '20'))));

      const where: any = { applicationId };
      if (status && status !== 'all') where.status = String(status);
      if (type && type !== 'all') where.type = String(type);
      if (search) where.title = { contains: String(search), mode: 'insensitive' };

      const [total, pages] = await Promise.all([
        prisma.page.count({ where }),
        prisma.page.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      return res.json({ pages, total, page, pageSize });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getContentById(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const { id } = req.params;
      const content = await prisma.page.findFirst({
        where: { id, applicationId } as any,
        include: { versions: { take: 1, orderBy: { createdAt: 'desc' } } }
      });
      if (!content) return res.status(404).json({ error: 'Content not found' });
      return res.json({ page: content });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async createContent(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const { title, slug, status, components, authorId, type, scheduledTime } = req.body;
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'title is required' });
      }
      if (!slug || typeof slug !== 'string' || !/^[a-z0-9-_/]+$/.test(slug)) {
        return res.status(400).json({ error: 'slug is required and must contain only lowercase letters, numbers, hyphens, underscores, or slashes' });
      }

      const content = await prisma.page.create({
        data: {
          applicationId,
          title: title.trim(),
          slug,
          status: status || 'draft',
          type: type || 'marketing',
          components: components || [],
          ...(authorId && { authorId }),
          ...(scheduledTime && { scheduledTime: new Date(scheduledTime) }),
        },
      });
      return res.status(201).json({ page: content });
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'A page with this slug already exists' });
      }
      return res.status(400).json({ error: error.message });
    }
  }

  async updateContent(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const { id } = req.params;
      const data = req.body;
      const content = await prisma.page.update({
        where: { id, applicationId } as any,
        data
      });
      if (!content) return res.status(404).json({ error: 'Content not found' });
      return res.json({ page: content });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async deleteContent(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const { id } = req.params;
      const result = await prisma.page.deleteMany({ where: { id, applicationId } as any });
      if (result.count === 0) return res.status(404).json({ error: 'Content not found' });
      return res.json({ message: 'Content deleted successfully' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Templates
  async getContentTemplates(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const templates = await prisma.cmsTemplate.findMany({
        where: { applicationId, isActive: true } as any
      });
      return res.json({ templates });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async createContentFromTemplate(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const { id: templateId } = req.params;
      const template = await prisma.cmsTemplate.findUnique({ where: { id: templateId } });
      if (!template) return res.status(404).json({ error: 'Template not found' });

      const pageData = {
        applicationId,
        title: req.body.title || `New Page from ${template.name}`,
        slug: req.body.slug || `page-${Date.now()}`,
        components: template.components || [],
        status: 'draft',
        ...req.body
      };

      const page = await prisma.page.create({ data: pageData });
      return res.status(201).json({ page });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Versions
  async getContentVersions(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const { id: pageId } = req.params;
      const versions = await prisma.pageVersion.findMany({
        where: { pageId, applicationId } as any,
        orderBy: { versionNumber: 'desc' }
      });
      return res.json({ versions });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getContentVersion(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const { versionId } = req.params;
      const version = await prisma.pageVersion.findFirst({
        where: { id: versionId, applicationId } as any
      });
      return res.json({ version });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async createContentVersion(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const { id: pageId } = req.params;
      const lastVersion = await prisma.pageVersion.findFirst({
        where: { pageId },
        orderBy: { versionNumber: 'desc' }
      });
      const versionNumber = (lastVersion?.versionNumber || 0) + 1;

      const version = await prisma.pageVersion.create({
        data: {
          ...req.body,
          pageId,
          applicationId,
          versionNumber
        }
      });
      return res.status(201).json({ version });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async restoreContentVersion(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const { id: pageId, versionId } = req.params;
      const version = await prisma.pageVersion.findFirst({
        where: { id: versionId, pageId, applicationId } as any
      });
      if (!version) return res.status(404).json({ error: 'Version not found' });

      const page = await prisma.page.update({
        where: { id: pageId },
        data: { components: version.components as any }
      });
      return res.json({ page });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async deleteContentVersion(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const { versionId } = req.params;
      await prisma.pageVersion.deleteMany({ where: { id: versionId, applicationId } as any });
      return res.json({ message: 'Version deleted' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async autoSaveContent(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const { id: pageId } = req.params;
      await prisma.page.update({
        where: { id: pageId, applicationId } as any,
        data: { components: req.body.content }
      });
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Content Analytics
  async getContentAnalytics(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const analytics = await prisma.contentAnalytics.findMany({
        where: { applicationId } as any,
        take: 100,
        orderBy: { createdAt: 'desc' }
      });
      return res.json({ analytics });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // Localization
  async getLanguages(req: Request, res: Response) {
    try {
      const languages = await prisma.language.findMany({ where: { isActive: true } });
      return res.json({ languages });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getTranslationKeys(req: Request, res: Response) {
    try {
      const keys = await prisma.translationKey.findMany({ where: { isActive: true } });
      return res.json({ keys });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const categories = await prisma.cmsCategory.findMany({
        where: { applicationId } as any,
        orderBy: { name: 'asc' }
      });
      return res.json({ categories });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      if (!applicationId) return res.status(400).json({ error: 'Application ID is required' });

      const data = { ...req.body, applicationId };
      const category = await prisma.cmsCategory.create({ data });
      return res.status(201).json({ category });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

const cmsController = new CMSController();
export default cmsController;
