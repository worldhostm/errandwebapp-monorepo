import { ApiResponse, User, Errand, ErrandStatus, VerificationStatus } from '@errandwebapp/shared'
import { API_PATHS } from './apiPaths'
import { STORAGE_KEYS } from './constants'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

// 파일을 base64로 변환하는 헬퍼 함수
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// API 요청 공통 함수
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  }

  try {
    
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, config)
    const data = await response.json()

    if (!response.ok) {
      console.log(`API 요청 실패: ${response.status} ${response.statusText}`)
      console.log('에러 데이터:', data)
      return {
        success: false,
        error: data.error || data.errors || 'API 요청에 실패했습니다.'
      }
    }

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.'
    }
  }
}

// 인증 관련 API
export const authApi = {
  async login(email: string, password: string) {
    return apiRequest<{ token: string; user: User }>(API_PATHS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async register(email: string, password: string, name: string) {
    return apiRequest<{ token: string; user: User }>(API_PATHS.AUTH.REGISTER, {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  },

  async getProfile() {
    return apiRequest<{ user: User }>(API_PATHS.AUTH.PROFILE)
  },

  async updateProfile(userData: Partial<User>) {
    return apiRequest<{ user: User }>(API_PATHS.AUTH.PROFILE, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  },
}

// 심부름 관련 API
export const errandApi = {
  async getNearbyErrands(
    lng: number, 
    lat: number, 
    radius?: number, 
    status?: ErrandStatus, 
    signal?: AbortSignal,
    bounds?: {
      sw: { lat: number; lng: number };
      ne: { lat: number; lng: number };
    }
  ) {
    const params = new URLSearchParams({
      lng: lng.toString(),
      lat: lat.toString(),
      ...(radius && { radius: radius.toString() }),
      ...(status && { status }),
      // bounds 파라미터 추가
      ...(bounds && {
        swLat: bounds.sw.lat.toString(),
        swLng: bounds.sw.lng.toString(),
        neLat: bounds.ne.lat.toString(),
        neLng: bounds.ne.lng.toString(),
      }),
    })
    
    return apiRequest<{ errands: Errand[] }>(`${API_PATHS.ERRANDS.NEARBY}?${params}`, {
      signal
    })
  },

  async getErrandById(id: string) {
    return apiRequest<{ errand: Errand }>(API_PATHS.ERRANDS.BY_ID(id))
  },

  async createErrand(errandData: {
    title: string
    description: string
    location: {
      type: 'Point'
      coordinates: [number, number]
      address: string
    }
    reward: number
    category: string
    deadline?: Date | string
  }) {
    return apiRequest<{ errand: Errand }>(API_PATHS.ERRANDS.CREATE, {
      method: 'POST',
      body: JSON.stringify(errandData),
    })
  },

  async acceptErrand(id: string) {
    return apiRequest<{ errand: Errand }>(API_PATHS.ERRANDS.ACCEPT(id), {
      method: 'POST',
    })
  },

  async updateErrandStatus(id: string, status: ErrandStatus) {
    return apiRequest<{ errand: Errand }>(API_PATHS.ERRANDS.STATUS(id), {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  },

  async getUserErrands(type?: 'requested' | 'accepted', status?: ErrandStatus) {
    const params = new URLSearchParams({
      ...(type && { type }),
      ...(status && { status }),
    })

    return apiRequest<{ errands: Errand[] }>(`${API_PATHS.ERRANDS.USER}?${params}`)
  },

  async cancelErrand(id: string) {
    return apiRequest<{ message: string }>(API_PATHS.ERRANDS.BY_ID(id), {
      method: 'DELETE',
    })
  },

  // 내가 등록한 심부름 목록 조회
  async getMyErrands() {
    return apiRequest<{ errands: Errand[] }>(`${API_PATHS.ERRANDS.USER}?type=requested`)
  },

  // 심부름 삭제
  async deleteErrand(id: string) {
    return apiRequest<{ message: string }>(API_PATHS.ERRANDS.BY_ID(id), {
      method: 'DELETE',
    })
  },

  // 완료 인증과 함께 심부름 완료
  async completeErrandWithVerification(id: string, image: string, message: string) {
    return apiRequest<{ errand: Errand }>(API_PATHS.ERRANDS.COMPLETE_VERIFICATION(id), {
      method: 'POST',
      body: JSON.stringify({ image, message }),
    })
  },

  // 완료 인증 정보를 포함한 심부름 조회
  async getErrandWithVerification(id: string) {
    return apiRequest<{ errand: Errand }>(API_PATHS.ERRANDS.VERIFICATION(id))
  },

  // 이의제기 제출
  async reportDispute(id: string, reason: string, description: string) {
    return apiRequest<{ errand: Errand }>(API_PATHS.ERRANDS.DISPUTE(id), {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    })
  },

  // 사용자의 활성 심부름 상태 확인
  async checkActiveErrand() {
    return apiRequest<{
      hasActiveErrand: boolean;
      activeErrand?: {
        id: string;
        title: string;
        status: string;
        requestedBy: { name: string; email: string; }
      }
    }>(API_PATHS.ERRANDS.CHECK_ACTIVE)
  },
}

// 결제 관련 API
export const paymentApi = {
  // 결제 상태 확인
  async checkPaymentStatus(errandId: string) {
    return apiRequest<{
      canProcess: boolean
      currentStatus: string
      hasDispute: boolean
      hoursUntilPayment: number | null
      lastUpdated: string
    }>(API_PATHS.PAYMENTS.STATUS(errandId))
  },

  // 수동 결제 처리
  async manualPayment(errandId: string) {
    return apiRequest<{ message: string }>(API_PATHS.PAYMENTS.MANUAL(errandId), {
      method: 'POST'
    })
  },

  // 스케줄러 상태 확인
  async getSchedulerStatus() {
    return apiRequest<{
      scheduler: {
        isRunning: boolean
        activeJobs: number
        paymentJobRunning: boolean
      }
    }>(API_PATHS.PAYMENTS.SCHEDULER_STATUS)
  },

  // 수동 결제 체크 트리거
  async triggerPaymentCheck() {
    return apiRequest<{ message: string }>(API_PATHS.PAYMENTS.SCHEDULER_TRIGGER, {
      method: 'POST'
    })
  }
}

// 알림 관련 API
export const notificationApi = {
  // 사용자 알림 목록 조회
  async getNotifications(unreadOnly?: boolean) {
    const params = unreadOnly ? '?unreadOnly=true' : ''
    return apiRequest<{
      notifications: import('@errandwebapp/shared').Notification[]
      unreadCount: number
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      }
    }>(`${API_PATHS.NOTIFICATIONS.LIST}${params}`)
  },

  // 읽지 않은 알림 개수 조회
  async getUnreadCount() {
    return apiRequest<{ unreadCount: number }>(API_PATHS.NOTIFICATIONS.UNREAD_COUNT)
  },

  // 알림을 읽음 처리
  async markAsRead(notificationId: string) {
    return apiRequest<{
      notification: {
        id: string;
        title: string;
        message: string;
        isRead: boolean;
      }
    }>(API_PATHS.NOTIFICATIONS.MARK_READ(notificationId), {
      method: 'PUT',
    })
  },

  // 모든 알림을 읽음 처리
  async markAllAsRead() {
    return apiRequest<{ message: string }>(API_PATHS.NOTIFICATIONS.READ_ALL, {
      method: 'PUT',
    })
  },
}

// 채팅 관련 API (향후 구현)
export const chatApi = {
  // 심부름별 채팅방 가져오기
  async getChatByErrand(errandId: string) {
    return apiRequest<{
      chat: {
        id: string;
        errandId: string;
        participantIds: string[];
        participants: User[];
        messages: {
          id: string;
          content: string;
          senderId: string;
          sender: User;
          createdAt: string;
          isRead: boolean;
        }[];
      }
    }>(API_PATHS.CHAT.BY_ERRAND(errandId))
  },

  // 메시지 전송
  async sendMessage(chatId: string, content: string) {
    return apiRequest<{
      message: {
        id: string;
        content: string;
        senderId: string;
        sender: User;
        createdAt: string;
        isRead: boolean;
      }
    }>(API_PATHS.CHAT.MESSAGE(chatId), {
      method: 'POST',
      body: JSON.stringify({ content })
    })
  },

  // 메시지 읽음 처리
  async markMessagesAsRead(chatId: string) {
    return apiRequest<{ message: string }>(API_PATHS.CHAT.MARK_READ(chatId), {
      method: 'PUT'
    })
  }
}

// 인증 관련 API
export const verificationApi = {
  // 전화번호 인증 요청
  async requestPhoneVerification(phone: string) {
    return apiRequest<{ verificationId: string }>(API_PATHS.VERIFICATION.PHONE_REQUEST, {
      method: 'POST',
      body: JSON.stringify({ phone })
    })
  },

  // 전화번호 인증 확인
  async verifyPhoneCode(verificationId: string, code: string) {
    return apiRequest<{
      success: true;
      message: string;
    }>(API_PATHS.VERIFICATION.PHONE_VERIFY, {
      method: 'POST',
      body: JSON.stringify({ verificationId, code })
    })
  },

  // 이메일 인증 요청
  async requestEmailVerification() {
    return apiRequest<{
      success: true;
      message: string;
      data: { verificationToken: string };
    }>(API_PATHS.VERIFICATION.EMAIL_REQUEST, {
      method: 'POST'
    })
  },

  // 신분증 인증 요청
  async requestIdentityVerification(documents: string[]) {
    return apiRequest<{
      success: true;
      message: string;
    }>(API_PATHS.VERIFICATION.IDENTITY_REQUEST, {
      method: 'POST',
      body: JSON.stringify({ documents })
    })
  },

  // 주소 인증 요청
  async requestAddressVerification(address: string, documents: string[]) {
    return apiRequest<{
      success: true;
      message: string;
    }>(API_PATHS.VERIFICATION.ADDRESS_REQUEST, {
      method: 'POST',
      body: JSON.stringify({ address, documents })
    })
  },

  // 인증 상태 조회
  async getVerificationStatus() {
    return apiRequest<{
      success: true;
      data: VerificationStatus;
    }>(API_PATHS.VERIFICATION.STATUS)
  }
}

// 고객센터 관련 API
export const supportApi = {
  // 문의 생성
  async createSupport(supportData: {
    type: 'inquiry' | 'report' | 'bug' | 'feature' | 'other'
    subject: string
    description: string
    attachments?: string[]
    relatedErrand?: string
  }) {
    return apiRequest<{
      support: {
        id: string
        type: string
        subject: string
        description: string
        status: string
        createdAt: string
      }
    }>(API_PATHS.SUPPORT.LIST, {
      method: 'POST',
      body: JSON.stringify(supportData)
    })
  },

  // 내 문의 목록 조회
  async getMySupportTickets(status?: string, page?: number, limit?: number) {
    const params = new URLSearchParams({
      ...(status && { status }),
      ...(page && { page: page.toString() }),
      ...(limit && { limit: limit.toString() })
    })
    return apiRequest<{
      supports: Array<{
        id: string
        type: string
        subject: string
        description: string
        status: string
        priority: string
        createdAt: string
        relatedErrand?: { id: string; title: string; status: string }
        responses: Array<{
          content: string
          isAdmin: boolean
          createdAt: string
        }>
      }>
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }>(`${API_PATHS.SUPPORT.LIST}?${params}`)
  },

  // 특정 문의 조회
  async getSupportById(id: string) {
    return apiRequest<{
      support: {
        id: string
        type: string
        subject: string
        description: string
        status: string
        priority: string
        createdAt: string
        relatedErrand?: { id: string; title: string; status: string }
        responses: Array<{
          id: string
          content: string
          isAdmin: boolean
          createdBy: { name: string; email: string }
          createdAt: string
        }>
      }
    }>(API_PATHS.SUPPORT.BY_ID(id))
  },

  // 문의에 답변 추가
  async addSupportResponse(id: string, content: string) {
    return apiRequest<{
      support: {
        id: string
        responses: Array<{
          content: string
          isAdmin: boolean
          createdAt: string
        }>
      }
    }>(API_PATHS.SUPPORT.RESPONSE(id), {
      method: 'POST',
      body: JSON.stringify({ content })
    })
  },

  // 문의 삭제
  async deleteSupport(id: string) {
    return apiRequest<{ message: string }>(API_PATHS.SUPPORT.BY_ID(id), {
      method: 'DELETE'
    })
  }
}

// 신고 관련 API
export const reportApi = {
  // 신고 생성
  async createReport(reportData: {
    reason: 'inappropriate' | 'scam' | 'spam' | 'harassment' | 'other'
    description: string
    reportedUser?: string
    reportedErrand?: string
    evidence?: string[]
  }) {
    return apiRequest<{
      report: {
        id: string
        reason: string
        description: string
        status: string
        createdAt: string
      }
    }>(API_PATHS.REPORT.LIST, {
      method: 'POST',
      body: JSON.stringify(reportData)
    })
  },

  // 내 신고 목록 조회
  async getMyReports(status?: string, page?: number, limit?: number) {
    const params = new URLSearchParams({
      ...(status && { status }),
      ...(page && { page: page.toString() }),
      ...(limit && { limit: limit.toString() })
    })
    return apiRequest<{
      reports: Array<{
        id: string
        reason: string
        description: string
        status: string
        createdAt: string
        reportedUser?: { id: string; name: string }
        reportedErrand?: { id: string; title: string }
      }>
      pagination: {
        page: number
        limit: number
        total: number
        pages: number
      }
    }>(`${API_PATHS.REPORT.LIST}?${params}`)
  },

  // 특정 신고 조회
  async getReportById(id: string) {
    return apiRequest<{
      report: {
        id: string
        reason: string
        description: string
        status: string
        evidence?: string[]
        adminNotes?: string
        createdAt: string
        reportedUser?: { id: string; name: string }
        reportedErrand?: { id: string; title: string }
      }
    }>(API_PATHS.REPORT.BY_ID(id))
  },

  // 신고 취소
  async deleteReport(id: string) {
    return apiRequest<{ message: string }>(API_PATHS.REPORT.BY_ID(id), {
      method: 'DELETE'
    })
  }
}