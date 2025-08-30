export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    avatar?: string;
    location?: {
        type: 'Point';
        coordinates: [number, number];
        address?: string;
    };
    rating: number;
    totalErrands: number;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Errand {
    id: string;
    title: string;
    description: string;
    location: {
        type: 'Point';
        coordinates: [number, number];
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
export type ErrandStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
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
export interface Coordinates {
    longitude: number;
    latitude: number;
}
export interface LocationInfo {
    coordinates: Coordinates;
    address?: string;
}
export interface MapMarker {
    id: string;
    position: Coordinates;
    title: string;
    description?: string;
    type: 'errand' | 'user';
    data?: any;
}
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
//# sourceMappingURL=index.d.ts.map