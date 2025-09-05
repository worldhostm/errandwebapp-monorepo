import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IVerification {
  type: 'phone' | 'email' | 'identity' | 'address';
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  rejectionReason?: string;
  documents?: string[]; // URLs to uploaded verification documents
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address?: string;
  };
  rating: number;
  totalErrands: number;
  isVerified: boolean;
  verification: IVerification[];
  verificationLevel: number; // 0: 미인증, 1: 기본인증, 2: 고급인증, 3: 완전인증
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  getVerificationStatus(): { level: number; badges: string[]; isPhoneVerified: boolean; isEmailVerified: boolean; isIdentityVerified: boolean; isAddressVerified: boolean; };
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    },
    address: String
  },
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  totalErrands: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verification: [{
    type: {
      type: String,
      enum: ['phone', 'email', 'identity', 'address'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verifiedAt: Date,
    rejectionReason: String,
    documents: [String]
  }],
  verificationLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get verification status method
UserSchema.methods.getVerificationStatus = function() {
  const phoneVerified = this.verification.some((v: IVerification) => v.type === 'phone' && v.status === 'verified');
  const emailVerified = this.verification.some((v: IVerification) => v.type === 'email' && v.status === 'verified');
  const identityVerified = this.verification.some((v: IVerification) => v.type === 'identity' && v.status === 'verified');
  const addressVerified = this.verification.some((v: IVerification) => v.type === 'address' && v.status === 'verified');

  let level = 0;
  const badges = [];

  if (phoneVerified) {
    level = Math.max(level, 1);
    badges.push('phone');
  }
  if (emailVerified) {
    level = Math.max(level, 1);
    badges.push('email');
  }
  if (identityVerified) {
    level = Math.max(level, 2);
    badges.push('identity');
  }
  if (addressVerified) {
    level = Math.max(level, 2);
    badges.push('address');
  }
  if (phoneVerified && emailVerified && identityVerified) {
    level = 3;
    badges.push('premium');
  }

  // Update verification level
  this.verificationLevel = level;
  this.isVerified = level > 0;

  return {
    level,
    badges,
    isPhoneVerified: phoneVerified,
    isEmailVerified: emailVerified,
    isIdentityVerified: identityVerified,
    isAddressVerified: addressVerified
  };
};

// Create sparse geospatial index for location-based queries (only when location exists)
UserSchema.index({ 'location': '2dsphere' }, { sparse: true });

export default mongoose.model<IUser>('User', UserSchema);