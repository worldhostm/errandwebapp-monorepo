// API 엔드포인트 경로 상수
// api.ts의 apiRequest()에 전달되는 경로만 정의 (/api prefix 제외)

export const API_PATHS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    NAVER: '/auth/naver',
  },
  ERRANDS: {
    NEARBY: '/errands/nearby',
    BY_ID: (id: string) => `/errands/${id}`,
    CREATE: '/errands',
    ACCEPT: (id: string) => `/errands/${id}/accept`,
    STATUS: (id: string) => `/errands/${id}/status`,
    USER: '/errands/user',
    COMPLETE_VERIFICATION: (id: string) => `/errands/${id}/complete-verification`,
    VERIFICATION: (id: string) => `/errands/${id}/verification`,
    DISPUTE: (id: string) => `/errands/${id}/dispute`,
    CHECK_ACTIVE: '/errands/check-active',
  },
  PAYMENTS: {
    STATUS: (errandId: string) => `/payments/${errandId}/status`,
    MANUAL: (errandId: string) => `/payments/${errandId}/manual`,
    SCHEDULER_STATUS: '/payments/scheduler/status',
    SCHEDULER_TRIGGER: '/payments/scheduler/trigger',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
  },
  CHAT: {
    BY_ERRAND: (errandId: string) => `/chat/errand/${errandId}`,
    MESSAGE: (chatId: string) => `/chat/${chatId}/message`,
    MARK_READ: (chatId: string) => `/chat/${chatId}/read`,
    UNREAD_COUNTS: '/chat/unread-counts',
  },
  VERIFICATION: {
    PHONE_REQUEST: '/verification/phone/request',
    PHONE_VERIFY: '/verification/phone/verify',
    EMAIL_REQUEST: '/verification/email/request',
    IDENTITY_REQUEST: '/verification/identity/request',
    ADDRESS_REQUEST: '/verification/address/request',
    STATUS: '/verification/status',
  },
  SUPPORT: {
    LIST: '/support',
    BY_ID: (id: string) => `/support/${id}`,
    RESPONSE: (id: string) => `/support/${id}/response`,
  },
  REPORT: {
    LIST: '/report',
    BY_ID: (id: string) => `/report/${id}`,
  },
} as const
