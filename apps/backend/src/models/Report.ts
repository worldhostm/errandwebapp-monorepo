import mongoose, { Document, Schema } from 'mongoose';

export interface IReport extends Document {
  reason: 'inappropriate' | 'scam' | 'spam' | 'harassment' | 'other';
  description: string;
  reportedUser?: mongoose.Types.ObjectId;
  reportedErrand?: mongoose.Types.ObjectId;
  reportedBy: mongoose.Types.ObjectId;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  evidence?: string[];
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

const ReportSchema = new Schema<IReport>({
  reason: {
    type: String,
    enum: ['inappropriate', 'scam', 'spam', 'harassment', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  reportedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  reportedErrand: {
    type: Schema.Types.ObjectId,
    ref: 'Errand',
    index: true
  },
  reportedBy: {
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
  evidence: [{
    type: String
  }],
  adminNotes: {
    type: String
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// 인덱스 설정
ReportSchema.index({ reportedBy: 1, createdAt: -1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ reportedUser: 1, status: 1 });
ReportSchema.index({ reportedErrand: 1, status: 1 });

// reportedUser와 reportedErrand 중 최소 하나는 필요
ReportSchema.pre('validate', function(next) {
  if (!this.reportedUser && !this.reportedErrand) {
    next(new Error('신고 대상(사용자 또는 심부름)이 필요합니다.'));
  } else {
    next();
  }
});

export default mongoose.model<IReport>('Report', ReportSchema);
