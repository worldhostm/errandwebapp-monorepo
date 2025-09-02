// User 타입은 shared 패키지에서 가져옴
import { User, Errand, ErrandStatus, Message as SharedMessage, ApiResponse } from '@errandwebapp/shared'

// shared 타입들을 re-export
export type { User, Errand, ErrandStatus, ApiResponse }
export type { SharedMessage }

// Errand 타입을 기반으로 한 내가 사용할 타입
export interface ErrandLocation {
  id: string
  title: string
  description: string
  lat: number
  lng: number
  reward: number
  status: ErrandStatus
  category: string
  deadline: string
  createdAt: string
  acceptedBy?: string
  distance?: number
  isUrgent?: boolean
}

// 내 메시지 타입 (내가 사용할 형태)
export interface LocalMessage {
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

// API 응답에서 올 때만 사용하는 타입들 (MongoDB _id 포함)
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
    address?: string
  }
  reward: number
  status: ErrandStatus
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

// API 응답을 프론트엔드 타입으로 변환하는 헬퍼 함수들
export const convertApiUserToUser = (apiUser: ApiUser): User => {
  return {
    id: apiUser._id,
    email: apiUser.email,
    name: apiUser.name,
    phone: undefined,
    avatar: apiUser.profileImage,
    location: undefined,
    rating: 0,
    totalErrands: 0,
    isVerified: false,
    createdAt: new Date(apiUser.createdAt),
    updatedAt: new Date(apiUser.updatedAt)
  }
}

// User를 ApiUser로 변환 (API 요청용)
export const convertUserToApiUser = (user: User): Partial<ApiUser> => {
  return {
    _id: user.id,
    name: user.name,
    email: user.email,
    profileImage: user.avatar,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }
}

// API 응답을 ErrandLocation으로 변환
export const convertApiErrandToErrandLocation = (apiErrand: ApiErrand): ErrandLocation => {
  return {
    id: apiErrand._id,
    title: apiErrand.title,
    description: apiErrand.description,
    lat: apiErrand.location.coordinates[1], // latitude
    lng: apiErrand.location.coordinates[0], // longitude
    reward: apiErrand.reward,
    status: apiErrand.status,
    category: apiErrand.category,
    deadline: apiErrand.deadline,
    createdAt: apiErrand.createdAt,
    acceptedBy: typeof apiErrand.acceptedBy === 'string' ? apiErrand.acceptedBy : apiErrand.acceptedBy?._id
  }
}

// Shared Errand 타입을 ErrandLocation으로 변환
export const convertErrandToErrandLocation = (errand: Errand): ErrandLocation => {
  return {
    id: errand.id,
    title: errand.title,
    description: errand.description,
    lat: errand.location.coordinates[1], // latitude
    lng: errand.location.coordinates[0], // longitude
    reward: errand.reward,
    status: errand.status,
    category: errand.category,
    deadline: errand.deadline ? errand.deadline.toISOString() : new Date().toISOString(),
    createdAt: errand.createdAt.toISOString(),
    acceptedBy: typeof errand.acceptedBy === 'string' ? errand.acceptedBy : (errand.acceptedBy as User)?.id
  }
}