
import { Request, Response } from 'express';

export class PageController {
  async getPages(req: Request, res: Response) {
    return res.json({ message: 'PageController.getPages stub' });
  }

  async createPage(req: Request, res: Response) {
    return res.json({ message: 'PageController.createPage stub' });
  }

  async getPage(req: Request, res: Response) {
    return res.json({ message: 'PageController.getPage stub' });
  }

  async updatePage(req: Request, res: Response) {
    return res.json({ message: 'PageController.updatePage stub' });
  }

  async deletePage(req: Request, res: Response) {
    return res.json({ message: 'PageController.deletePage stub' });
  }

  async publishPage(req: Request, res: Response) {
    return res.json({ message: 'PageController.publishPage stub' });
  }

  async saveComponents(req: Request, res: Response) {
    return res.json({ message: 'PageController.saveComponents stub' });
  }
}

const pageController = new PageController();
export default pageController;
