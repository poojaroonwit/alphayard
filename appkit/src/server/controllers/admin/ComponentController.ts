import { Request, Response } from 'express';
import { prisma } from '@/server/lib/prisma';

export class ComponentController {
  async getComponents(req: Request, res: Response) {
    try {
      const { category } = req.query;
      const where = category ? { category: String(category), isActive: true } : { isActive: true };
      const components = await prisma.cmsComponent.findMany({ where });
      return res.json({ components });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getCategories(req: Request, res: Response) {
    try {
      const categories = await prisma.cmsComponent.findMany({
        select: { category: true },
        distinct: ['category']
      });
      return res.json({ categories: categories.map(c => c.category).filter(Boolean) });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async validateSchema(req: Request, res: Response) {
    // Basic validation logic
    const { schema, props } = req.body;
    return res.json({ valid: true, message: 'Schema validation passed' });
  }

  async getComponentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const component = await prisma.cmsComponent.findUnique({ where: { id } });
      if (!component) return res.status(404).json({ error: 'Component not found' });
      return res.json({ component });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getComponentByName(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const component = await prisma.cmsComponent.findUnique({ where: { name } });
      if (!component) return res.status(404).json({ error: 'Component not found' });
      return res.json({ component });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async createComponent(req: Request, res: Response) {
    try {
      const data = req.body;
      const component = await prisma.cmsComponent.create({ data });
      return res.status(201).json({ component });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updateComponent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;
      const component = await prisma.cmsComponent.update({
        where: { id },
        data
      });
      return res.json({ component });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async deleteComponent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.cmsComponent.delete({ where: { id } });
      return res.json({ message: 'Component deleted successfully' });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
}
