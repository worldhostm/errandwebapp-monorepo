import { Coordinates } from '../types';
export declare const calculateDistance: (coord1: Coordinates, coord2: Coordinates) => number;
export declare const formatDistance: (distanceInMeters: number) => string;
export declare const formatCurrency: (amount: number, currency?: "KRW" | "USD") => string;
export declare const formatDate: (date: Date | string) => string;
export declare const formatDateTime: (date: Date | string) => string;
export declare const formatRelativeTime: (date: Date | string) => string;
export declare const isValidEmail: (email: string) => boolean;
export declare const isValidCoordinates: (coordinates: [number, number]) => boolean;
export declare const truncateText: (text: string, maxLength: number) => string;
export declare const capitalizeFirst: (text: string) => string;
export declare const buildQueryString: (params: Record<string, any>) => string;
export declare const storage: {
    get: <T>(key: string) => T | null;
    set: <T>(key: string, value: T) => void;
    remove: (key: string) => void;
    clear: () => void;
};
export declare const debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => ((...args: Parameters<T>) => void);
export declare const generateId: () => string;
//# sourceMappingURL=index.d.ts.map