import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICompletionVerification {
  image: string;
  message: string;
  submittedAt: Date;
}

export interface IDispute {
  reportedBy: Types.ObjectId;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  submittedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface IErrand extends Document {
  title: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
  };
  reward: number;
  currency: 'KRW' | 'USD';
  requestedBy: Types.ObjectId;
  acceptedBy?: Types.ObjectId;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed' | 'paid';
  category: string;
  deadline?: Date;
  images?: string[];
  requirements?: string[];
  completionVerification?: ICompletionVerification;
  dispute?: IDispute;
  createdAt: Date;
  updatedAt: Date;
}

const ErrandSchema = new Schema<IErrand>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    address: {
      type: String,
      required: true,
      trim: true
    }
  },
  reward: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ['KRW', 'USD'],
    default: 'KRW'
  },
  requestedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  acceptedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'disputed', 'paid'],
    default: 'pending'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  deadline: {
    type: Date
  },
  images: [{
    type: String
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  completionVerification: {
    image: {
      type: String
    },
    message: {
      type: String,
      maxlength: 500
    },
    submittedAt: {
      type: Date
    }
  },
  dispute: {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['fake_completion', 'poor_quality', 'not_completed', 'other']
    },
    description: {
      type: String,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending'
    },
    submittedAt: {
      type: Date
    },
    resolvedAt: {
      type: Date
    },
    resolution: {
      type: String,
      maxlength: 1000
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Create geospatial index for location-based queries
ErrandSchema.index({ location: '2dsphere' });

// Index for filtering by status and date
ErrandSchema.index({ status: 1, createdAt: -1 });
ErrandSchema.index({ requestedBy: 1, status: 1 });
ErrandSchema.index({ acceptedBy: 1, status: 1 });

export default mongoose.model<IErrand>('Errand', ErrandSchema);