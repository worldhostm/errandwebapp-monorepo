"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = exports.debounce = exports.storage = exports.buildQueryString = exports.capitalizeFirst = exports.truncateText = exports.isValidCoordinates = exports.isValidEmail = exports.formatRelativeTime = exports.formatDateTime = exports.formatDate = exports.formatCurrency = exports.formatDistance = exports.calculateDistance = void 0;
// Distance calculation utilities
const calculateDistance = (coord1, coord2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
};
exports.calculateDistance = calculateDistance;
// Format distance for display
const formatDistance = (distanceInMeters) => {
    if (distanceInMeters < 1000) {
        return `${Math.round(distanceInMeters)}m`;
    }
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
};
exports.formatDistance = formatDistance;
// Currency formatting
const formatCurrency = (amount, currency = 'KRW') => {
    const formatters = {
        KRW: new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }),
        USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    };
    return formatters[currency].format(amount);
};
exports.formatCurrency = formatCurrency;
// Date formatting utilities
const formatDate = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};
exports.formatDate = formatDate;
const formatDateTime = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
exports.formatDateTime = formatDateTime;
const formatRelativeTime = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffInSeconds < 60) {
        return '방금 전';
    }
    else if (diffInSeconds < 3600) {
        return `${Math.floor(diffInSeconds / 60)}분 전`;
    }
    else if (diffInSeconds < 86400) {
        return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    }
    else if (diffInSeconds < 604800) {
        return `${Math.floor(diffInSeconds / 86400)}일 전`;
    }
    else {
        return (0, exports.formatDate)(d);
    }
};
exports.formatRelativeTime = formatRelativeTime;
// Validation utilities
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
exports.isValidEmail = isValidEmail;
const isValidCoordinates = (coordinates) => {
    const [lng, lat] = coordinates;
    return (typeof lng === 'number' &&
        typeof lat === 'number' &&
        lng >= -180 &&
        lng <= 180 &&
        lat >= -90 &&
        lat <= 90);
};
exports.isValidCoordinates = isValidCoordinates;
// Text utilities
const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength - 3) + '...';
};
exports.truncateText = truncateText;
const capitalizeFirst = (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1);
};
exports.capitalizeFirst = capitalizeFirst;
// URL utilities
const buildQueryString = (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            if (Array.isArray(value)) {
                value.forEach(item => searchParams.append(key, item.toString()));
            }
            else {
                searchParams.append(key, value.toString());
            }
        }
    });
    return searchParams.toString();
};
exports.buildQueryString = buildQueryString;
// Local storage utilities (for client-side only)
exports.storage = {
    get: (key) => {
        if (typeof window === 'undefined')
            return null;
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        }
        catch {
            return null;
        }
    },
    set: (key, value) => {
        if (typeof window === 'undefined')
            return;
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
        catch {
            console.error('Failed to save to localStorage');
        }
    },
    remove: (key) => {
        if (typeof window === 'undefined')
            return;
        try {
            window.localStorage.removeItem(key);
        }
        catch {
            console.error('Failed to remove from localStorage');
        }
    },
    clear: () => {
        if (typeof window === 'undefined')
            return;
        try {
            window.localStorage.clear();
        }
        catch {
            console.error('Failed to clear localStorage');
        }
    }
};
// Debounce utility
const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(null, args), wait);
    };
};
exports.debounce = debounce;
// Generate unique ID
const generateId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};
exports.generateId = generateId;
