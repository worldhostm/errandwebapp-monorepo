'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { handleImageUpload, getDefaultProfileImage } from '../lib/imageUtils'
import type { User } from '../lib/types'
import VerificationSection from './VerificationSection'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onUpdateProfile: (updatedUser: User) => void
}

export default function ProfileModal({ isOpen, onClose, user, onUpdateProfile }: ProfileModalProps) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  })
  const [profileImage, setProfileImage] = useState<string | null>(user.avatar || null)
  const [imageUploading, setImageUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'verification'>('profile')

  useEffect(() => {
    setFormData({ name: user.name, email: user.email })
    setProfileImage(user.avatar || null)
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const updatedUser: User = {
      ...user,
      name: formData.name,
      email: formData.email,
      avatar: profileImage || undefined
    }
    onUpdateProfile(updatedUser)
    onClose()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageUploading(true)
    try {
      const imageDataUrl = await handleImageUpload(file)
      setProfileImage(imageDataUrl)
    } catch (error) {
      alert(error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setImageUploading(false)
    }
  }

  const removeProfileImage = () => {
    setProfileImage(null)
  }

  const getCurrentProfileImage = () => {
    if (profileImage) return profileImage
    if (typeof window !== 'undefined') {
      return getDefaultProfileImage(user.name)
    }
    return ''
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-black">프로필 설정</h2>
            <button
              onClick={onClose}
              className="text-black hover:text-black text-xl"
            >
              ✕
            </button>
          </div>
          
          {/* 탭 메뉴 */}
          <div className="flex mt-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 px-4 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-blue-500'
                  : 'text-black border-transparent hover:text-black'
              }`}
            >
              👤 기본 정보
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`text-black flex-1 py-2 px-4 text-center font-medium border-b-2 transition-colors ${
                activeTab === 'verification'
                  ? 'text-blue-600 border-blue-500'
                  : 'text-black border-transparent hover:text-black'
              }`}
            >
              🔐 사용자 인증
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  프로필 사진
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 border border-gray-300 rounded-full flex items-center justify-center overflow-hidden bg-gray-50">
                    <Image
                      src={getCurrentProfileImage()}
                      alt="현재 프로필"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="profile-image-edit"
                        disabled={imageUploading}
                      />
                      <label
                        htmlFor="profile-image-edit"
                        className={`cursor-pointer px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm text-black ${
                          imageUploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {imageUploading ? '업로드 중...' : '변경'}
                      </label>
                      {profileImage && (
                        <button
                          type="button"
                          onClick={removeProfileImage}
                          className="px-3 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 text-sm"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-black">
                      5MB 이하, JPG/PNG 권장
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2 px-4 border border-gray-300 text-black rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  disabled={imageUploading}
                >
                  저장
                </button>
              </div>
            </form>
          )}

          {activeTab === 'verification' && (
            <VerificationSection 
              onVerificationChange={() => {
                // 인증 상태 변경 시 필요한 로직
                // 예: 사용자 정보 다시 불러오기
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}