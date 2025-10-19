// Verification Types
export interface Verification {
  type: 'phone' | 'email' | 'identity' | 'address';
  status: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  rejectionReason?: string;
  documents?: string[];
}

export interface VerificationStatus {
  level: number;
  badges: string[];
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isIdentityVerified: boolean;
  isAddressVerified: boolean;
  verifications: Verification[];
}

// User Types
export interface User {
  id: string;
  email: string;
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
  verification?: Verification[];
  verificationLevel?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Errand Types
export interface Errand {
  id: string;
  title: string;
  description: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    address: string;
  };
  reward: number;
  currency: 'KRW' | 'USD';
  requestedBy: string | User;
  acceptedBy?: string | User;
  status: ErrandStatus;
  category: string;
  deadline?: Date;
  images?: string[];
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type ErrandStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed' | 'paid';

// Notification Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'errand_completed' | 'errand_accepted' | 'errand_disputed' | 'system' | 'payment_completed' | 'errand_finalized';
  isRead: boolean;
  createdAt: string;
  relatedErrand?: {
    id: string;
    title: string;
    status: string;
  };
}

// Chat Types
export interface Message {
  id: string;
  sender: string | User;
  content: string;
  timestamp: Date;
  messageType: MessageType;
  isRead: boolean;
}

export type MessageType = 'text' | 'image' | 'location';

export interface Chat {
  id: string;
  errand: string | Errand;
  participants: (string | User)[];
  messages: Message[];
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

// Location Types
export interface Coordinates {
  longitude: number;
  latitude: number;
}

export interface LocationInfo {
  coordinates: Coordinates;
  address?: string;
}

// Map Types
export interface MapMarker {
  id: string;
  position: Coordinates;
  title: string;
  description?: string;
  type: 'errand' | 'user';
  data?: any;
}

// Search & Filter Types
export interface ErrandFilters {
  category?: string;
  status?: ErrandStatus;
  minReward?: number;
  maxReward?: number;
  radius?: number;
  location?: Coordinates;
}

export interface SearchParams {
  query?: string;
  filters?: ErrandFilters;
  pagination?: {
    page: number;
    limit: number;
  };
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

// Support Types (고객센터)
export type SupportType = 'inquiry' | 'report' | 'bug' | 'feature' | 'other';
export type SupportStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';
export type ReportReason = 'inappropriate' | 'scam' | 'spam' | 'harassment' | 'other';

export interface Support {
  id: string;
  type: SupportType;
  subject: string;
  description: string;
  user: string | User;
  status: SupportStatus;
  priority: 'low' | 'medium' | 'high';
  attachments?: string[];
  relatedErrand?: string | Errand;
  responses?: SupportResponse[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface SupportResponse {
  id: string;
  content: string;
  isAdmin: boolean;
  createdBy: string | User;
  createdAt: Date;
}

export interface Report {
  id: string;
  reason: ReportReason;
  description: string;
  reportedUser?: string | User;
  reportedErrand?: string | Errand;
  reportedBy: string | User;
  status: SupportStatus;
  evidence?: string[];
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}