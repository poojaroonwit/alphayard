// import mongoose, { Schema, Document } from 'mongoose';
// TODO: Fix missing module: mongoose

// Stub mongoose types for runtime (mongoose not installed)
class Schema {
  static Types = { ObjectId: String, Mixed: Object };
  constructor(definition: any, options?: any) {
    // Stub implementation
  }
  index(fields: any) { return this; }
  virtual(name: string) { 
    return {
      get: (fn: Function) => {}
    };
  }
  pre(hook: string, fn: Function) { return this; }
  post(hook: string, fn: Function) { return this; }
  methods: any = {};
  statics: any = {};
}
const mongoose = {
  model: (name: string, schema: any) => {
    // Return a stub model
    return class StubModel {
      static find() { return { exec: () => Promise.resolve([]) }; }
      static findOne() { return { exec: () => Promise.resolve(null) }; }
      static findById() { return { exec: () => Promise.resolve(null) }; }
      static create() { return Promise.resolve({}); }
      static updateOne() { return Promise.resolve({ modifiedCount: 0 }); }
      static deleteOne() { return Promise.resolve({ deletedCount: 0 }); }
    };
  },
  Types: { ObjectId: String }
};

export interface IPopup {
  type: 'ad' | 'promotion' | 'announcement' | 'emergency';
  title: string;
  message: string;
  imageUrl?: string;
  actionText?: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: Date;
  endDate: Date;
  targetAudience: 'all' | 'premium' | 'circle' | 'children' | 'seniors';
  isActive: boolean;
  showCount: number;
  maxShows: number;
  conditions?: {
    userType?: string;
    location?: string;
    deviceType?: string;
    appVersion?: string;
    subscriptionTier?: string;
  };
  createdBy: any; // mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PopupSchema: any = new Schema({
  type: {
    type: String,
    enum: ['ad', 'promotion', 'announcement', 'emergency'],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  imageUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Image URL must be a valid HTTP/HTTPS URL',
    },
  },
  actionText: {
    type: String,
    maxlength: 50,
  },
  actionUrl: {
    type: String,
    validate: {
      validator: function(v: string) {
        return /^(https?:\/\/|bondarys:\/\/).+/.test(v);
      },
      message: 'Action URL must be a valid HTTP/HTTPS URL or AppKit deep link',
    },
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true,
  },
  startDate: {
    type: Date,
    required: true,
    index: true,
  },
  endDate: {
    type: Date,
    required: true,
    index: true,
  },
  targetAudience: {
    type: String,
    enum: ['all', 'premium', 'circle', 'children', 'seniors'],
    default: 'all',
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  showCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  maxShows: {
    type: Number,
    default: 10000,
    min: 1,
  },
  conditions: {
    userType: {
      type: String,
      enum: ['free', 'premium', 'elite', 'enterprise'],
    },
    location: {
      type: String,
      // Country code or region
    },
    deviceType: {
      type: String,
      enum: ['ios', 'android', 'web'],
    },
    appVersion: {
      type: String,
      // Minimum app version required
    },
    subscriptionTier: {
      type: String,
      enum: ['basic', 'premium', 'elite'],
    },
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for efficient querying
PopupSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
PopupSchema.index({ targetAudience: 1, priority: 1 });
PopupSchema.index({ type: 1, isActive: 1 });
PopupSchema.index({ createdBy: 1, createdAt: -1 });

// Virtual for checking if popup is currently active
PopupSchema.virtual('isCurrentlyActive').get(function(this: any) {
  const now = new Date();
  return this.isActive && now >= this.startDate && now <= this.endDate;
});

// Virtual for checking if popup has reached max shows
PopupSchema.virtual('hasReachedMaxShows').get(function(this: any) {
  return this.showCount >= this.maxShows;
});

// Pre-save middleware to validate dates
PopupSchema.pre('save', function(this: any, next: any) {
  if (this.startDate >= this.endDate) {
    next(new Error('Start date must be before end date'));
  }
  next();
});

// Static method to get active popups
PopupSchema.statics.getActivePopups = function(userType: string, conditions: any = {}) {
  const now = new Date();
  const query: any = {
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { targetAudience: 'all' },
      { targetAudience: userType }
    ]
  };

  // Add conditions if provided
  if (conditions.userType) {
    query['conditions.userType'] = conditions.userType;
  }
  if (conditions.location) {
    query['conditions.location'] = conditions.location;
  }
  if (conditions.deviceType) {
    query['conditions.deviceType'] = conditions.deviceType;
  }

  return this.find(query)
    .sort({ priority: -1, createdAt: -1 })
    .populate('createdBy', 'firstName lastName email');
};

// Static method to get popups by type
PopupSchema.statics.getPopupsByType = function(type: string, isActive: boolean = true) {
  const query: any = { type };
  if (isActive !== undefined) {
    query.isActive = isActive;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .populate('createdBy', 'firstName lastName email');
};

// Instance method to increment show count
PopupSchema.methods.incrementShowCount = function(this: any) {
  this.showCount += 1;
  return this.save();
};

// Instance method to check if popup should be shown to user
PopupSchema.methods.shouldShowToUser = function(this: any, user: any, conditions: any = {}) {
  // Check if popup is currently active
  if (!this.isCurrentlyActive) return false;

  // Check if popup has reached max shows
  if (this.hasReachedMaxShows) return false;

  // Check target audience
  if (this.targetAudience !== 'all' && this.targetAudience !== user.userType) {
    return false;
  }

  // Check conditions
  if (this.conditions) {
    if (this.conditions.userType && user.subscriptionTier !== this.conditions.userType) {
      return false;
    }
    if (this.conditions.location && conditions.location !== this.conditions.location) {
      return false;
    }
    if (this.conditions.deviceType && conditions.deviceType !== this.conditions.deviceType) {
      return false;
    }
    if (this.conditions.appVersion && conditions.appVersion < this.conditions.appVersion) {
      return false;
    }
  }

  return true;
};

// Static method to get analytics summary
PopupSchema.statics.getAnalyticsSummary = function(startDate: Date, endDate: Date) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalShows: { $sum: '$showCount' },
        avgShows: { $avg: '$showCount' }
      }
    }
  ]);
};

export const PopupModel: any = mongoose.model('Popup', PopupSchema); 
