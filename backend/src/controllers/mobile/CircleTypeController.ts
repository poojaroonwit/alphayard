import { Request, Response } from 'express';
import { CircleTypeModel } from '../../models/CircleTypeModel';

export class CircleTypeController {
  static async getAll(req: Request, res: Response) {
    try {
      const types = await CircleTypeModel.findAll();
      res.json({ success: true, data: types });
    } catch (error) {
      console.error('Error fetching circle types:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch circle types' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const type = await CircleTypeModel.findById(id);
      if (!type) {
        return res.status(404).json({ success: false, message: 'Circle type not found' });
      }
      res.json({ success: true, data: type });
    } catch (error) {
      console.error('Error fetching circle type:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch circle type' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, code } = req.body;
      if (!name || !code) {
        return res.status(400).json({ success: false, message: 'Name and code are required' });
      }

      const existing = await CircleTypeModel.findByCode(code);
      if (existing) {
        return res.status(409).json({ success: false, message: 'Circle type code already exists' });
      }

      const type = await CircleTypeModel.create(req.body);
      res.status(201).json({ success: true, data: type });
    } catch (error) {
      console.error('Error creating circle type:', error);
      res.status(500).json({ success: false, message: 'Failed to create circle type' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const type = await CircleTypeModel.update(id, req.body);
      if (!type) {
        return res.status(404).json({ success: false, message: 'Circle type not found' });
      }
      res.json({ success: true, data: type });
    } catch (error) {
      console.error('Error updating circle type:', error);
      res.status(500).json({ success: false, message: 'Failed to update circle type' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await CircleTypeModel.delete(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Circle type not found' });
      }
      res.json({ success: true, message: 'Circle type deleted successfully' });
    } catch (error) {
      console.error('Error deleting circle type:', error);
      res.status(500).json({ success: false, message: 'Failed to delete circle type' });
    }
  }
}
