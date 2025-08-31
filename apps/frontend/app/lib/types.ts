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
}