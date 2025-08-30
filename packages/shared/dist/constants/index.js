"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUCCESS_MESSAGES = exports.ERROR_MESSAGES = exports.SOCKET_EVENTS = exports.DEFAULT_VALUES = exports.ERRAND_STATUS_LABELS = exports.ERRAND_CATEGORY_LABELS = exports.ERRAND_CATEGORIES = exports.API_ENDPOINTS = void 0;
// API Endpoints
exports.API_ENDPOINTS = {
    AUTH: {
        REGISTER: '/api/auth/register',
        LOGIN: '/api/auth/login',
        PROFILE: '/api/auth/profile',
    },
    ERRANDS: {
        BASE: '/api/errands',
        NEARBY: '/api/errands/nearby',
        USER: '/api/errands/user',
        ACCEPT: (id) => `/api/errands/${id}/accept`,
        STATUS: (id) => `/api/errands/${id}/status`,
        BY_ID: (id) => `/api/errands/${id}`,
    },
    USERS: {
        BY_ID: (id) => `/api/users/${id}`,
        LOCATION: '/api/users/location',
        RATINGS: (id) => `/api/users/${id}/ratings`,
    },
    CHAT: {
        BY_ERRAND: (errandId) => `/api/chat/errand/${errandId}`,
        MESSAGE: (chatId) => `/api/chat/${chatId}/message`,
        READ: (chatId) => `/api/chat/${chatId}/read`,
    },
};
// Errand Categories
exports.ERRAND_CATEGORIES = [
    'delivery',
    'shopping',
    'transportation',
    'cleaning',
    'repair',
    'pet_care',
    'tutoring',
    'photography',
    'event_help',
    'other'
];
exports.ERRAND_CATEGORY_LABELS = {
    delivery: 'Delivery',
    shopping: 'Shopping',
    transportation: 'Transportation',
    cleaning: 'Cleaning',
    repair: 'Repair & Maintenance',
    pet_care: 'Pet Care',
    tutoring: 'Tutoring',
    photography: 'Photography',
    event_help: 'Event Help',
    other: 'Other'
};
// Errand Status Labels
exports.ERRAND_STATUS_LABELS = {
    pending: 'Pending',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled'
};
// Default Values
exports.DEFAULT_VALUES = {
    SEARCH_RADIUS: 5000, // 5km in meters
    PAGINATION_LIMIT: 20,
    MAP_ZOOM_LEVEL: 13,
    MAX_IMAGES_PER_ERRAND: 5,
    MIN_REWARD: 1000, // in KRW
    MAX_REWARD: 100000, // in KRW
    CURRENCY: 'KRW',
};
// Socket Events
exports.SOCKET_EVENTS = {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    JOIN_CHAT: 'join_chat',
    LEAVE_CHAT: 'leave_chat',
    SEND_MESSAGE: 'send_message',
    NEW_MESSAGE: 'new_message',
    ERRAND_STATUS_UPDATE: 'errand_status_update',
    ERRAND_UPDATED: 'errand_updated',
    UPDATE_LOCATION: 'update_location',
    USER_LOCATION_UPDATED: 'user_location_updated',
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',
    USER_TYPING: 'user_typing',
};
// Error Messages
exports.ERROR_MESSAGES = {
    VALIDATION: {
        REQUIRED_FIELD: (field) => `${field} is required`,
        INVALID_EMAIL: 'Please provide a valid email',
        PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long',
        INVALID_COORDINATES: 'Invalid coordinates provided',
    },
    AUTH: {
        INVALID_CREDENTIALS: 'Invalid email or password',
        TOKEN_EXPIRED: 'Token has expired',
        UNAUTHORIZED: 'You are not authorized to access this resource',
        USER_NOT_FOUND: 'User not found',
    },
    ERRAND: {
        NOT_FOUND: 'Errand not found',
        ALREADY_ACCEPTED: 'This errand has already been accepted',
        CANNOT_ACCEPT_OWN: 'You cannot accept your own errand',
        NOT_AUTHORIZED: 'You are not authorized to perform this action',
    },
    CHAT: {
        NOT_FOUND: 'Chat not found',
        NOT_PARTICIPANT: 'You are not a participant in this chat',
    },
    GENERAL: {
        SERVER_ERROR: 'An internal server error occurred',
        NETWORK_ERROR: 'Network error occurred',
    },
};
// Success Messages
exports.SUCCESS_MESSAGES = {
    AUTH: {
        REGISTRATION_SUCCESS: 'Registration successful',
        LOGIN_SUCCESS: 'Login successful',
        PROFILE_UPDATED: 'Profile updated successfully',
    },
    ERRAND: {
        CREATED: 'Errand created successfully',
        ACCEPTED: 'Errand accepted successfully',
        STATUS_UPDATED: 'Errand status updated successfully',
        CANCELLED: 'Errand cancelled successfully',
    },
    CHAT: {
        MESSAGE_SENT: 'Message sent successfully',
        MESSAGES_READ: 'Messages marked as read',
    },
};
