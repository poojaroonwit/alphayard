
import type { Request, Response } from 'express';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PageController {
  private getApplicationId(req: Request) {
    return req.headers['x-application-id'] as string;
  }

  async getPages(req: Request, res: Response) {
    try {
      const pages = await prisma.page.findMany({
        orderBy: { updatedAt: 'desc' }
      });
      return res.json({ pages });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async createPage(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      const { title, slug, type, components, mobileDisplay } = req.body;
      const page = await prisma.page.create({
        data: {
          title,
          slug,
          applicationId,
          status: 'draft',
          components: components || []
        } as any
      });
      return res.status(201).json({ page });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getPage(req: Request, res: Response) {
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

  async updatePage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const page = await prisma.page.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
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

  async publishPage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = await prisma.page.update({
        where: { id },
        data: { 
          status: 'published',
          updatedAt: new Date()
        }
      });
      return res.json({ page });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async saveComponents(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { components } = req.body;
      const page = await prisma.page.update({
        where: { id },
        data: { 
          components,
          updatedAt: new Date()
        }
      });
      return res.json({ page });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}

const pageController = new PageController();
export default pageController;
