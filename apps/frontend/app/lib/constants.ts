// localStorage / sessionStorage 키
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  TEST_USER: 'testUser',
  LOCATION_PERMISSION_GRANTED_AT: 'location_permission_granted_at',
} as const

// 기본 위치 좌표
export const LOCATIONS = {
  DEFAULT: { lat: 37.1982115590239, lng: 127.118473726893 }, // 청계동 (앱 기본값)
  SEOUL_CITY_HALL: { lat: 37.5665, lng: 126.9780 },         // 서울시청 (위치 실패 시 fallback)
} as const

// 시간(ms) 관련 상수
export const TIMING = {
  LOCATION_CONSENT_TTL: 24 * 60 * 60 * 1000, // 위치 권한 동의 유효기간 (24시간)
  NOTIFICATION_POLL_INTERVAL: 5 * 60 * 1000,  // 읽지 않은 알림 폴링 주기 (5분)
  ERRAND_SELECTION_HIGHLIGHT: 3000,            // 심부름 선택 하이라이트 유지 시간
  ERRAND_CARD_ANIMATION: 2000,                 // 심부름 카드 애니메이션 시간
  STEP_TRANSITION: 300,                        // 폼 단계 전환 애니메이션
  TAB_SWITCH_DELAY: 500,                       // 탭 전환 지연
  TAB_SWITCH_DELAY_ERROR: 1000,               // 오류 시 탭 전환 지연
} as const

// 지도 / 검색 관련 상수
export const MAP = {
  DEFAULT_SEARCH_RADIUS: 10000,  // 기본 검색 반경 (m)
  CACHE_BOUNDS_RADIUS: 100000,   // 캐시 무효화 반경 (m)
} as const

// 인증 관련 상수
export const AUTH = {
  MIN_PASSWORD_LENGTH: 6,
  REGISTER_STEPS: 4,
} as const

// 네이버 브랜드 색상
export const NAVER_COLORS = {
  BASE: '#03C75A',
  HOVER: '#02b350',
} as const
