
import { Request, Response } from 'express';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PageBuilderController {
  private getApplicationId(req: Request) {
    return req.headers['x-application-id'] as string;
  }

  async getPages(req: Request, res: Response) {
    try {
      const { status } = req.query;
      const applicationId = this.getApplicationId(req);
      const filter: any = {};
      if (status) filter.status = String(status);
      if (applicationId) filter.applicationId = applicationId;
      
      const pages = await prisma.page.findMany({
        where: filter,
        orderBy: { updatedAt: 'desc' }
      });
      return res.json({ pages });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getPageById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = await prisma.page.findUnique({
        where: { id },
        include: { versions: true }
      });
      if (!page) return res.status(404).json({ error: 'Page not found' });
      return res.json({ page });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getPageBySlug(req: Request, res: Response) {
    try {
      const { slug } = req.params;
      const page = await prisma.page.findFirst({
        where: { slug }
      });
      if (!page) return res.status(404).json({ error: 'Page not found' });
      return res.json({ page });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async createPage(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      const data = { ...req.body, applicationId };
      const page = await prisma.page.create({ data: data as any });
      return res.status(201).json({ page });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updatePage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const page = await prisma.page.update({
        where: { id },
        data
      });
      
      // Auto-create version block
      if (data.components) {
        const applicationId = this.getApplicationId(req);
        await prisma.pageVersion.create({
          data: {
            pageId: id,
            applicationId,
            versionNumber: page.versionNumber + 1,
            components: data.components,
            authorId: page.authorId,
            commitMessage: 'Auto-saved version'
          } as any
        });
        await prisma.page.update({
          where: { id },
          data: { versionNumber: { increment: 1 } }
        });
      }
      
      return res.json({ page });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async deletePage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.page.delete({ where: { id } });
      return res.json({ message: 'Page deleted successfully' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async duplicatePage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const original = await prisma.page.findUnique({ where: { id } }) as any;
      if (!original) return res.status(404).json({ error: 'Page not found' });
      
      const applicationId = this.getApplicationId(req);
      const data = {
        ...original,
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        applicationId: applicationId || original.applicationId,
        slug: `${original.slug}-copy-${Date.now()}`,
        title: `${original.title} (Copy)`,
        status: 'draft',
        versionNumber: 1
      };
      const newPage = await prisma.page.create({ data: data as any });
      return res.status(201).json({ page: newPage });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async previewPage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = await prisma.page.findUnique({ where: { id } });
      if (!page) return res.status(404).json({ error: 'Page not found' });
      return res.json({ preview: page });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async publishPage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = await prisma.page.update({
        where: { id },
        data: { status: 'published' }
      });
      return res.json({ page });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async unpublishPage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = await prisma.page.update({
        where: { id },
        data: { status: 'draft' }
      });
      return res.json({ page });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async schedulePage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { scheduledTime } = req.body;
      const page = await prisma.page.update({
        where: { id },
        data: { status: 'pending', scheduledTime: new Date(scheduledTime) }
      });
      return res.json({ page });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async processScheduledPages(req: Request, res: Response) {
    try {
      const now = new Date();
      const countData = await prisma.page.updateMany({
        where: {
          status: 'pending',
          scheduledTime: { lte: now }
        },
        data: {
          status: 'published',
          scheduledTime: null
        }
      });
      return res.json({ message: `Successfully published ${countData.count} scheduled pages.` });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}

const pageBuilderController = new PageBuilderController();
export default pageBuilderController;
