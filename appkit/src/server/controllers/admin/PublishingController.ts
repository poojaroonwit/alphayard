
import { Request, Response } from 'express';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PublishingController {
  private getApplicationId(req: Request) {
    return req.headers['x-application-id'] as string;
  }

  async getWorkflow(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const workflow = await prisma.publishingWorkflow.findUnique({
        where: { id },
        include: { page: true }
      });
      if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
      return res.json({ workflow });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async createWorkflow(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      const data = { ...req.body, applicationId };
      const workflow = await prisma.publishingWorkflow.create({ data: data as any });
      return res.status(201).json({ workflow });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async requestApproval(req: Request, res: Response) {
    try {
      const applicationId = this.getApplicationId(req);
      const { pageId, requestedBy } = req.body;
      const workflow = await prisma.publishingWorkflow.create({
        data: {
          pageId,
          requestedBy,
          applicationId,
          status: 'pending'
        } as any
      });
      await prisma.page.update({
        where: { id: pageId },
        data: { status: 'pending' }
      });
      return res.status(201).json({ workflow });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async approvePage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reviewerId, reviewNotes } = req.body;
      const workflow = await prisma.publishingWorkflow.update({
        where: { id },
        data: { status: 'approved', reviewerId, reviewNotes }
      });
      await prisma.page.update({
        where: { id: workflow.pageId },
        data: { status: 'published' }
      });
      return res.json({ workflow });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async rejectPage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reviewerId, reviewNotes } = req.body;
      const workflow = await prisma.publishingWorkflow.update({
        where: { id },
        data: { status: 'rejected', reviewerId, reviewNotes }
      });
      await prisma.page.update({
        where: { id: workflow.pageId },
        data: { status: 'draft' }
      });
      return res.json({ workflow });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getPendingApprovals(req: Request, res: Response) {
    try {
      const pending = await prisma.publishingWorkflow.findMany({
        where: { status: 'pending' },
        include: { page: true },
        orderBy: { createdAt: 'asc' }
      });
      return res.json({ approvals: pending });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getScheduledPages(req: Request, res: Response) {
    try {
      const scheduled = await prisma.page.findMany({
        where: { status: 'pending', scheduledTime: { not: null } },
        orderBy: { scheduledTime: 'asc' }
      });
      return res.json({ pages: scheduled });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  async getPublishingStats(req: Request, res: Response) {
    try {
      const stats = await prisma.publishingWorkflow.groupBy({
        by: ['status'],
        _count: { id: true }
      });
      return res.json({ stats });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
