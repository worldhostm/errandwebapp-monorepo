import mongoose, { Document, Schema } from 'mongoose';

export interface IVerificationCode extends Document {
  email: string;
  code: string;
  type: 'email' | 'phone';
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
  createdAt: Date;
}

const VerificationCodeSchema = new Schema<IVerificationCode>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'phone'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Max 5 attempts
  }
}, {
  timestamps: true
});

// Create TTL index to automatically delete expired codes
VerificationCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Create compound index for faster lookups
VerificationCodeSchema.index({ email: 1, type: 1, isUsed: 1 });

export default mongoose.model<IVerificationCode>('VerificationCode', VerificationCodeSchema);
