export interface User {
  id: string
  name: string
  email: string
  profileImage?: string
}

export interface ErrandLocation {
  id: string
  title: string
  description: string
  lat: number
  lng: number
  reward: number
  status: 'pending' | 'accepted' | 'in_progress' | 'completed'
  category: string
  deadline: string
  createdAt: string
  acceptedBy?: string
  distance?: number
  isUrgent?: boolean
}

export interface Message {
  id: string
  senderId: string
  senderName: string
  content: string
  timestamp: Date
  type: 'text' | 'image'
}

export interface ErrandFormData {
  title: string
  description: string
  reward: number
  lat: number | null
  lng: number | null
  deadline: string
  category: string
  address?: string
}

// API 응답 타입들
export interface ApiUser {
  _id: string
  name: string
  email: string
  profileImage?: string
  createdAt: string
  updatedAt: string
}

export interface ApiErrand {
  _id: string
  title: string
  description: string
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  reward: number
  status: 'pending' | 'accepted' | 'in_progress' | 'completed'
  category: string
  deadline: string
  createdAt: string
  createdBy: string
  acceptedBy?: {
    _id: string
    name: string
    profileImage?: string
  } | string
}

export interface AuthResponse {
  token: string
  user: ApiUser
}

export interface ErrandsResponse {
  errands: ApiErrand[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}