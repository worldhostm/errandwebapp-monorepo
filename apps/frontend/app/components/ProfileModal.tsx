'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { handleImageUpload, getDefaultProfileImage } from '../lib/imageUtils'
import type { User } from '../lib/types'
import VerificationSection from './VerificationSection'
import Modal from './ui/Modal'
import Button from './ui/Button'

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프로필 설정" size="xl">
      {/* 탭 메뉴 */}
      <div className="flex mb-6 border-b border-base-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-2 px-4 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'text-primary border-primary'
              : 'border-transparent hover:text-base-content/70'
          }`}
        >
          👤 기본 정보
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`flex-1 py-2 px-4 text-center font-medium border-b-2 transition-colors ${
            activeTab === 'verification'
              ? 'text-primary border-primary'
              : 'border-transparent hover:text-base-content/70'
          }`}
        >
          🔐 사용자 인증
        </button>
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">프로필 사진</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 border border-base-300 rounded-full flex items-center justify-center overflow-hidden bg-base-200">
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
                    className={`cursor-pointer px-3 py-2 border border-base-300 rounded-md hover:bg-base-100 text-sm ${
                      imageUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {imageUploading ? '업로드 중...' : '변경'}
                  </label>
                  {profileImage && (
                    <Button type="button" variant="error" size="sm" onClick={removeProfileImage}>
                      삭제
                    </Button>
                  )}
                </div>
                <p className="text-xs text-base-content/50">5MB 이하, JPG/PNG 권장</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">이름</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="input input-bordered w-full"
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="input input-bordered w-full"
              placeholder="이메일을 입력하세요"
              required
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">취소</Button>
            <Button type="submit" variant="primary" disabled={imageUploading} className="flex-1">저장</Button>
          </div>
        </form>
      )}

      {activeTab === 'verification' && (
        <VerificationSection
          onVerificationChange={() => {
            // 인증 상태 변경 시 필요한 로직
          }}
        />
      )}
    </Modal>
  )
}
