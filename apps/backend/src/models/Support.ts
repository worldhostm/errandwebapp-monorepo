import mongoose, { Document, Schema } from 'mongoose';

export interface ISupportResponse {
  content: string;
  isAdmin: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ISupport extends Document {
  type: 'inquiry' | 'report' | 'bug' | 'feature' | 'other';
  subject: string;
  description: string;
  user: mongoose.Types.ObjectId;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  attachments?: string[];
  relatedErrand?: mongoose.Types.ObjectId;
  responses: ISupportResponse[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const SupportResponseSchema = new Schema<ISupportResponse>({
  content: {
    type: String,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const SupportSchema = new Schema<ISupport>({
  type: {
    type: String,
    enum: ['inquiry', 'report', 'bug', 'feature', 'other'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'resolved', 'closed'],
    default: 'pending',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  attachments: [{
    type: String
  }],
  relatedErrand: {
    type: Schema.Types.ObjectId,
    ref: 'Errand'
  },
  responses: [SupportResponseSchema],
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// 인덱스 설정
SupportSchema.index({ user: 1, createdAt: -1 });
SupportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<ISupport>('Support', SupportSchema);
