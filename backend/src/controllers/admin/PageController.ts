
import { Request, Response } from 'express';
import pageService from '../../services/pageService';

export class PageController {
  
  async getPages(req: Request, res: Response) {
    try {
      const { limit, offset, status, search } = req.query;
      const result = await pageService.getAllPages({
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
        status: status as string,
        search: search as string
      });
      res.json(result);
    } catch (error) {
      console.error('Error fetching pages:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getPage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const page = await pageService.getPageById(id);
      
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      
      res.json({ page });
    } catch (error) {
      console.error('Error fetching page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async createPage(req: any, res: Response) {
    try {
      const userId = req.user?.id; // Assuming auth middleware populates user
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const page = await pageService.createPage(req.body, userId);
      res.status(201).json({ page });
    } catch (error: any) {
      console.error('Error creating page:', error);
      if (error.code === '23505') { // Unique violation
        return res.status(409).json({ error: 'Page with this slug already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updatePage(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const page = await pageService.updatePage(id, req.body, userId);
      
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      
      res.json({ page });
    } catch (error) {
      console.error('Error updating page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deletePage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await pageService.deletePage(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Page not found' });
      }
      
      res.json({ message: 'Page deleted successfully' });
    } catch (error) {
      console.error('Error deleting page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async saveComponents(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { components } = req.body;
      
      await pageService.updatePageComponents(id, components);
      res.json({ message: 'Components saved successfully' });
    } catch (error) {
      console.error('Error saving components:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async publishPage(req: any, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const page = await pageService.publishPage(id, userId);
      
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      
      res.json({ page });
    } catch (error) {
      console.error('Error publishing page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new PageController();
