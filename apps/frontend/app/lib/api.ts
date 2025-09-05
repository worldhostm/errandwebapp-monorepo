import { ApiResponse, User, Errand, ErrandStatus } from '@errandwebapp/shared'

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
  const token = localStorage.getItem('authToken')
  
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
      console.error(`API 요청 실패: ${response.status} ${response.statusText}`)
      console.error('에러 데이터:', data)
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
    return apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async register(email: string, password: string, name: string) {
    return apiRequest<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  },

  async getProfile() {
    return apiRequest<{ user: User }>('/auth/profile')
  },

  async updateProfile(userData: Partial<User>) {
    return apiRequest<{ user: User }>('/auth/profile', {
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
    
    return apiRequest<{ errands: Errand[] }>(`/errands/nearby?${params}`, {
      signal
    })
  },

  async getErrandById(id: string) {
    return apiRequest<{ errand: Errand }>(`/errands/${id}`)
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
    return apiRequest<{ errand: Errand }>('/errands', {
      method: 'POST',
      body: JSON.stringify(errandData),
    })
  },

  async acceptErrand(id: string) {
    return apiRequest<{ errand: Errand }>(`/errands/${id}/accept`, {
      method: 'POST',
    })
  },

  async updateErrandStatus(id: string, status: ErrandStatus) {
    return apiRequest<{ errand: Errand }>(`/errands/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  },

  async getUserErrands(type?: 'requested' | 'accepted', status?: ErrandStatus) {
    const params = new URLSearchParams({
      ...(type && { type }),
      ...(status && { status }),
    })
    
    return apiRequest<{ errands: Errand[] }>(`/errands/user?${params}`)
  },

  async cancelErrand(id: string) {
    return apiRequest<{ message: string }>(`/errands/${id}`, {
      method: 'DELETE',
    })
  },

  // 내가 등록한 심부름 목록 조회
  async getMyErrands() {
    return apiRequest<{ errands: Errand[] }>('/errands/user?type=requested')
  },

  // 심부름 삭제
  async deleteErrand(id: string) {
    return apiRequest<{ message: string }>(`/errands/${id}`, {
      method: 'DELETE',
    })
  },

  // 완료 인증과 함께 심부름 완료
  async completeErrandWithVerification(id: string, image: string, message: string) {
    return apiRequest<{ errand: Errand }>(`/errands/${id}/complete-verification`, {
      method: 'POST',
      body: JSON.stringify({ image, message }),
    })
  },

  // 완료 인증 정보를 포함한 심부름 조회
  async getErrandWithVerification(id: string) {
    return apiRequest<{ errand: Errand }>(`/errands/${id}/verification`)
  },

  // 이의제기 제출
  async reportDispute(id: string, reason: string, description: string) {
    return apiRequest<{ errand: Errand }>(`/errands/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ reason, description }),
    })
  },

  // 사용자의 활성 심부름 상태 확인
  async checkActiveErrand() {
    return apiRequest<{ hasActiveErrand: boolean; activeErrand?: any }>('/errands/check-active')
  },
}

// 알림 관련 API
export const notificationApi = {
  // 사용자 알림 목록 조회
  async getNotifications(unreadOnly?: boolean) {
    const params = unreadOnly ? '?unreadOnly=true' : ''
    return apiRequest<{ 
      notifications: any[]
      unreadCount: number
      pagination: any
    }>(`/notifications${params}`)
  },

  // 읽지 않은 알림 개수 조회
  async getUnreadCount() {
    return apiRequest<{ unreadCount: number }>('/notifications/unread-count')
  },

  // 알림을 읽음 처리
  async markAsRead(notificationId: string) {
    return apiRequest<{ notification: any }>(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    })
  },

  // 모든 알림을 읽음 처리
  async markAllAsRead() {
    return apiRequest<{ message: string }>('/notifications/read-all', {
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
    }>(`/chat/errand/${errandId}`)
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
    }>(`/chat/${chatId}/message`, {
      method: 'POST',
      body: JSON.stringify({ content })
    })
  },

  // 메시지 읽음 처리
  async markMessagesAsRead(chatId: string) {
    return apiRequest<{ message: string }>(`/chat/${chatId}/read`, {
      method: 'PUT'
    })
  }
}