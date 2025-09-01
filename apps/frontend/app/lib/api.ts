const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'API 요청에 실패했습니다.'
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
    return apiRequest<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async register(email: string, password: string, name: string) {
    return apiRequest<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  },

  async getProfile() {
    return apiRequest<{ user: any }>('/auth/profile')
  },

  async updateProfile(userData: any) {
    return apiRequest<{ user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  },
}

// 심부름 관련 API
export const errandApi = {
  async getNearbyErrands(lng: number, lat: number, radius?: number, status?: string) {
    const params = new URLSearchParams({
      lng: lng.toString(),
      lat: lat.toString(),
      ...(radius && { radius: radius.toString() }),
      ...(status && { status }),
    })
    
    return apiRequest<{ errands: any[]; pagination: any }>(`/errands/nearby?${params}`)
  },

  async getErrandById(id: string) {
    return apiRequest<{ errand: any }>(`/errands/${id}`)
  },

  async createErrand(errandData: {
    title: string
    description: string
    location: {
      type: 'Point'
      coordinates: [number, number]
    }
    reward: number
    category: string
    deadline: string
  }) {
    return apiRequest<{ errand: any }>('/errands', {
      method: 'POST',
      body: JSON.stringify(errandData),
    })
  },

  async acceptErrand(id: string) {
    return apiRequest<{ errand: any }>(`/errands/${id}/accept`, {
      method: 'POST',
    })
  },

  async updateErrandStatus(id: string, status: string) {
    return apiRequest<{ errand: any }>(`/errands/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  },

  async getUserErrands(type?: 'requested' | 'accepted', status?: string) {
    const params = new URLSearchParams({
      ...(type && { type }),
      ...(status && { status }),
    })
    
    return apiRequest<{ errands: any[]; pagination: any }>(`/errands/user?${params}`)
  },

  async cancelErrand(id: string) {
    return apiRequest<{ message: string }>(`/errands/${id}`, {
      method: 'DELETE',
    })
  },
}

// 채팅 관련 API (향후 구현)
export const chatApi = {
  // 채팅 관련 API 함수들을 여기에 추가할 예정
}