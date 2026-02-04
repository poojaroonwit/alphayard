import { Response } from 'express';
import { PopupModel } from '../../models/PopupModel';
// import { PopupAnalyticsModel } from '../../models/PopupAnalyticsModel';
 // TODO: Fix missing module: ../models/PopupAnalyticsModel
import { UserModel } from '../../models/UserModel';
// import { logger } from '../../utils/logger';
 // TODO: Fix missing module: ../utils/logger
// import { uploadToS3 } from '../../services/s3Service';
 // TODO: Fix missing module: ../services/s3Service

export class PopupController {
  // Get active popups for user
  async getActivePopups(req: any, res: Response) {
    try {
      const { userType } = req.query;
      
      const now = new Date();
      const activePopups = await PopupModel.find({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
        $or: [
          { targetAudience: 'all' },
          { targetAudience: userType }
        ]
      }).sort({ priority: -1, createdAt: -1 });

      res.json({
        success: true,
        popups: activePopups
      });
    } catch (error) {
      console.error('Error fetching active popups:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active popups'
      });
    }
  }

  // Record popup analytics
  async recordAnalytics(req: any, res: Response) {
    try {
      const { popupId, action } = req.body;

      // TODO: Implement PopupAnalyticsModel - stubbed for now
      // const analytics = new PopupAnalyticsModel({...});
      // await analytics.save();
      
      // Update popup show count if action is 'view'

      // Update popup show count if action is 'view'
      if (action === 'view') {
        await PopupModel.findByIdAndUpdate(popupId, {
          $inc: { showCount: 1 }
        });
      }

      res.json({
        success: true,
        message: 'Analytics recorded successfully'
      });
    } catch (error) {
      console.error('Error recording analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record analytics'
      });
    }
  }

  // Get user popup settings
  async getUserSettings(req: any, res: Response) {
    try {
      const { userId } = req.params;
      
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const settings = user.popupSettings || {
        enabled: true,
        frequency: 'daily',
        maxPerDay: 3,
        categories: ['announcement', 'promotion']
      };

      res.json({
        success: true,
        settings
      });
    } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user settings'
      });
    }
  }

  // Update user popup settings
  async updateUserSettings(req: any, res: Response) {
    try {
      const { userId } = req.params;
      const settings = req.body;

      const user = await UserModel.findByIdAndUpdate(
        userId,
        { popupSettings: settings },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        settings: user.popupSettings
      });
    } catch (error) {
      console.error('Error updating user settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user settings'
      });
    }
  }

  // Mark popup as shown
  async markAsShown(req: any, res: Response) {
    try {
      const { popupId } = req.params;
      // const { userId } = req.body; // Not used currently

      await PopupModel.findByIdAndUpdate(popupId, {
        $inc: { showCount: 1 }
      });

      res.json({
        success: true,
        message: 'Popup marked as shown'
      });
    } catch (error) {
      console.error('Error marking popup as shown:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark popup as shown'
      });
    }
  }

  // Admin: Get all popups
  async getAllPopups(req: any, res: Response) {
    try {
      const { page = 1, limit = 20, type, status } = req.query;
      
      const filter: any = {};
      if (type) filter.type = type;
      if (status !== undefined) filter.isActive = status === 'active';

      const popups = await PopupModel.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await PopupModel.countDocuments(filter);

      res.json({
        success: true,
        popups,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      console.error('Error fetching all popups:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popups'
      });
    }
  }

  // Admin: Get popup by ID
  async getPopupById(req: any, res: Response) {
    try {
      const { id } = req.params;
      
      const popup = await PopupModel.findById(id);
      if (!popup) {
        return res.status(404).json({
          success: false,
          message: 'Popup not found'
        });
      }

      res.json({
        success: true,
        popup
      });
    } catch (error) {
      console.error('Error fetching popup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popup'
      });
    }
  }

  // Admin: Create new popup
  async createPopup(req: any, res: Response) {
    try {
      const popupData = req.body;

      // Handle image upload if present
      if (req.file) {
        // TODO: Implement S3 upload
        const imageUrl = `uploads/popups/${req.file.filename || 'temp'}`;
        popupData.imageUrl = imageUrl;
      }

      const popup = new PopupModel(popupData);
      await popup.save();

      console.info(`Popup created: ${popup.id} by admin: ${req.user?.id}`);

      res.status(201).json({
        success: true,
        popup
      });
    } catch (error) {
      console.error('Error creating popup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create popup'
      });
    }
  }

  // Admin: Update popup
  async updatePopup(req: any, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Handle image upload if present
      if (req.file) {
        // TODO: Implement S3 upload
        const imageUrl = `uploads/popups/${req.file.filename || 'temp'}`;
        updateData.imageUrl = imageUrl;
      }

      const popup = await PopupModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      );

      if (!popup) {
        return res.status(404).json({
          success: false,
          message: 'Popup not found'
        });
      }

      console.info(`Popup updated: ${popup.id} by admin: ${req.user?.id}`);

      res.json({
        success: true,
        popup
      });
    } catch (error) {
      console.error('Error updating popup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update popup'
      });
    }
  }

  // Admin: Delete popup
  async deletePopup(req: any, res: Response) {
    try {
      const { id } = req.params;
      
      const popup = await PopupModel.findByIdAndDelete(id);
      if (!popup) {
        return res.status(404).json({
          success: false,
          message: 'Popup not found'
        });
      }

      console.info(`Popup deleted: ${popup.id} by admin: ${req.user?.id}`);

      res.json({
        success: true,
        message: 'Popup deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting popup:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete popup'
      });
    }
  }

  // Admin: Get analytics overview
  async getAnalyticsOverview(req: any, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      const filter: any = {};
      if (startDate && endDate) {
        filter.timestamp = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      // TODO: Implement PopupAnalyticsModel
      const analytics: any[] = []; 
      /* await PopupAnalyticsModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: {
              popupId: '$popupId',
              action: '$action'
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: '$_id.popupId',
            actions: {
              $push: {
                action: '$_id.action',
                count: '$count'
              }
            },
            totalInteractions: { $sum: '$count' }
          }
        }
      ]); */

      const popupIds = analytics.map(a => a._id);
      const popups = await PopupModel.find({ _id: { $in: popupIds } });

      const overview = analytics.map(analytic => {
        const popup = popups.find((p: any) => p._id.toString() === analytic._id);
        return {
          popupId: analytic._id,
          popupTitle: popup?.title || 'Unknown',
          popupType: popup?.type || 'unknown',
          actions: analytic.actions,
          totalInteractions: analytic.totalInteractions,
          showCount: popup?.showCount || 0
        };
      });

      res.json({
        success: true,
        overview
      });
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics overview'
      });
    }
  }

  // Admin: Get popup analytics
  async getPopupAnalytics(req: any, res: Response) {
    try {
      const { popupId } = req.params;
      const { startDate, endDate } = req.query;

      const filter: any = { popupId };
      if (startDate && endDate) {
        filter.timestamp = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      // TODO: Implement PopupAnalyticsModel
      const analytics: any[] = []; 
      /* await PopupAnalyticsModel.find(filter)
        .sort({ timestamp: -1 })
        .populate('userId', 'firstName lastName email'); */

      // TODO: Implement PopupAnalyticsModel
      const summary: any[] = []; 
      /* await PopupAnalyticsModel.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        }
      ]); */

      res.json({
        success: true,
        analytics,
        summary
      });
    } catch (error) {
      console.error('Error fetching popup analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch popup analytics'
      });
    }
  }

  // Admin: Export analytics
  async exportAnalytics(req: any, res: Response) {
    try {
      const { startDate, endDate, format = 'csv' } = req.query;

      const filter: any = {};
      if (startDate && endDate) {
        filter.timestamp = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string)
        };
      }

      // TODO: Implement PopupAnalyticsModel
      const analytics: any[] = []; 
      /* await PopupAnalyticsModel.find(filter)
        .populate('popupId', 'title type')
        .populate('userId', 'firstName lastName email')
        .sort({ timestamp: -1 }); */

      if (format === 'csv') {
        const csvData = analytics.map(analytic => ({
          Date: analytic.timestamp.toISOString(),
          'Popup Title': analytic.popupId?.title || 'Unknown',
          'Popup Type': analytic.popupId?.type || 'unknown',
          Action: analytic.action,
          'User Name': `${analytic.userId?.firstName || ''} ${analytic.userId?.lastName || ''}`,
          'User Email': analytic.userId?.email || '',
          'Session ID': analytic.sessionId,
          'IP Address': analytic.ipAddress
        }));

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=popup-analytics.csv');
        
        // Convert to CSV
        const csv = this.convertToCSV(csvData);
        res.send(csv);
      } else {
        res.json({
          success: true,
          analytics
        });
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics'
      });
    }
  }

  // Helper: Convert data to CSV
  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
} 
