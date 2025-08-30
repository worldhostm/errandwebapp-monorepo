export declare const API_ENDPOINTS: {
    readonly AUTH: {
        readonly REGISTER: "/api/auth/register";
        readonly LOGIN: "/api/auth/login";
        readonly PROFILE: "/api/auth/profile";
    };
    readonly ERRANDS: {
        readonly BASE: "/api/errands";
        readonly NEARBY: "/api/errands/nearby";
        readonly USER: "/api/errands/user";
        readonly ACCEPT: (id: string) => string;
        readonly STATUS: (id: string) => string;
        readonly BY_ID: (id: string) => string;
    };
    readonly USERS: {
        readonly BY_ID: (id: string) => string;
        readonly LOCATION: "/api/users/location";
        readonly RATINGS: (id: string) => string;
    };
    readonly CHAT: {
        readonly BY_ERRAND: (errandId: string) => string;
        readonly MESSAGE: (chatId: string) => string;
        readonly READ: (chatId: string) => string;
    };
};
export declare const ERRAND_CATEGORIES: readonly ["delivery", "shopping", "transportation", "cleaning", "repair", "pet_care", "tutoring", "photography", "event_help", "other"];
export declare const ERRAND_CATEGORY_LABELS: {
    readonly delivery: "Delivery";
    readonly shopping: "Shopping";
    readonly transportation: "Transportation";
    readonly cleaning: "Cleaning";
    readonly repair: "Repair & Maintenance";
    readonly pet_care: "Pet Care";
    readonly tutoring: "Tutoring";
    readonly photography: "Photography";
    readonly event_help: "Event Help";
    readonly other: "Other";
};
export declare const ERRAND_STATUS_LABELS: {
    readonly pending: "Pending";
    readonly accepted: "Accepted";
    readonly in_progress: "In Progress";
    readonly completed: "Completed";
    readonly cancelled: "Cancelled";
};
export declare const DEFAULT_VALUES: {
    readonly SEARCH_RADIUS: 5000;
    readonly PAGINATION_LIMIT: 20;
    readonly MAP_ZOOM_LEVEL: 13;
    readonly MAX_IMAGES_PER_ERRAND: 5;
    readonly MIN_REWARD: 1000;
    readonly MAX_REWARD: 100000;
    readonly CURRENCY: "KRW";
};
export declare const SOCKET_EVENTS: {
    readonly CONNECTION: "connection";
    readonly DISCONNECT: "disconnect";
    readonly JOIN_CHAT: "join_chat";
    readonly LEAVE_CHAT: "leave_chat";
    readonly SEND_MESSAGE: "send_message";
    readonly NEW_MESSAGE: "new_message";
    readonly ERRAND_STATUS_UPDATE: "errand_status_update";
    readonly ERRAND_UPDATED: "errand_updated";
    readonly UPDATE_LOCATION: "update_location";
    readonly USER_LOCATION_UPDATED: "user_location_updated";
    readonly TYPING_START: "typing_start";
    readonly TYPING_STOP: "typing_stop";
    readonly USER_TYPING: "user_typing";
};
export declare const ERROR_MESSAGES: {
    readonly VALIDATION: {
        readonly REQUIRED_FIELD: (field: string) => string;
        readonly INVALID_EMAIL: "Please provide a valid email";
        readonly PASSWORD_TOO_SHORT: "Password must be at least 6 characters long";
        readonly INVALID_COORDINATES: "Invalid coordinates provided";
    };
    readonly AUTH: {
        readonly INVALID_CREDENTIALS: "Invalid email or password";
        readonly TOKEN_EXPIRED: "Token has expired";
        readonly UNAUTHORIZED: "You are not authorized to access this resource";
        readonly USER_NOT_FOUND: "User not found";
    };
    readonly ERRAND: {
        readonly NOT_FOUND: "Errand not found";
        readonly ALREADY_ACCEPTED: "This errand has already been accepted";
        readonly CANNOT_ACCEPT_OWN: "You cannot accept your own errand";
        readonly NOT_AUTHORIZED: "You are not authorized to perform this action";
    };
    readonly CHAT: {
        readonly NOT_FOUND: "Chat not found";
        readonly NOT_PARTICIPANT: "You are not a participant in this chat";
    };
    readonly GENERAL: {
        readonly SERVER_ERROR: "An internal server error occurred";
        readonly NETWORK_ERROR: "Network error occurred";
    };
};
export declare const SUCCESS_MESSAGES: {
    readonly AUTH: {
        readonly REGISTRATION_SUCCESS: "Registration successful";
        readonly LOGIN_SUCCESS: "Login successful";
        readonly PROFILE_UPDATED: "Profile updated successfully";
    };
    readonly ERRAND: {
        readonly CREATED: "Errand created successfully";
        readonly ACCEPTED: "Errand accepted successfully";
        readonly STATUS_UPDATED: "Errand status updated successfully";
        readonly CANCELLED: "Errand cancelled successfully";
    };
    readonly CHAT: {
        readonly MESSAGE_SENT: "Message sent successfully";
        readonly MESSAGES_READ: "Messages marked as read";
    };
};
//# sourceMappingURL=index.d.ts.map