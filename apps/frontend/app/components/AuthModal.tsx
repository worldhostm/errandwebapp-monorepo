'use client'

import { useState } from 'react'
import { handleImageUpload } from '../lib/imageUtils'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, password: string) => void
  onRegister: (email: string, password: string, name: string, profileImage?: string) => void
}

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoginMode) {
      onLogin(formData.email, formData.password)
    } else {
      if (formData.password !== formData.confirmPassword) {
        alert('비밀번호가 일치하지 않습니다.')
        return
      }
      onRegister(formData.email, formData.password, formData.name, profileImage || undefined)
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      name: '',
      confirmPassword: ''
    })
    setProfileImage(null)
    setImageUploading(false)
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

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {isLoginMode ? '로그인' : '회원가입'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="이름을 입력하세요"
                  required={!isLoginMode}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  프로필 사진 (선택사항)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 border border-gray-300 rounded-full flex items-center justify-center overflow-hidden bg-gray-50">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="프로필 미리보기"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">미리보기</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="profile-image"
                      disabled={imageUploading}
                    />
                    <label
                      htmlFor="profile-image"
                      className={`cursor-pointer px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm ${
                        imageUploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {imageUploading ? '업로드 중...' : '이미지 선택'}
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      5MB 이하, JPG/PNG 권장
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              이메일
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이메일을 입력하세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요"
              required
              minLength={6}
            />
          </div>

          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="비밀번호를 다시 입력하세요"
                required={!isLoginMode}
                minLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium"
          >
            {isLoginMode ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-black">
            {isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
            <button
              onClick={toggleMode}
              className="ml-1 text-blue-500 hover:text-blue-600 font-medium"
            >
              {isLoginMode ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>

        {isLoginMode && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3">
              또는 소셜 계정으로 로그인
            </p>
            <div className="space-y-2">
              <button className="w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2">
                <span>🟢</span>
                네이버로 로그인
              </button>
              <button className="w-full py-2 px-4 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2">
                <span>🟡</span>
                카카오로 로그인
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}