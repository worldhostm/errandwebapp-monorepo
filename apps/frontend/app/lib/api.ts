import { ApiResponse, User, Errand, ErrandStatus } from '@errandwebapp/shared'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

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
    return apiRequest<{ errands: Errand[] }>('/errands/my')
  },

  // 심부름 삭제
  async deleteErrand(id: string) {
    return apiRequest<{ message: string }>(`/errands/${id}`, {
      method: 'DELETE',
    })
  },
}

// 채팅 관련 API (향후 구현)
export const chatApi = {
  // 채팅 관련 API 함수들을 여기에 추가할 예정
}