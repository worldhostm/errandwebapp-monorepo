'use client'

import { useState } from 'react'
import Image from 'next/image'
import { handleImageUpload } from '../lib/imageUtils'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, password: string) => void
  onRegister: (email: string, password: string, name: string, profileImage?: string) => void
}

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const totalSteps = 4
  
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

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(prev => prev - 1)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return formData.name.trim() !== ''
      case 2: return formData.email.trim() !== '' && formData.email.includes('@')
      case 3: return formData.password.length >= 6 && formData.password === formData.confirmPassword
      case 4: return true // 프로필 사진은 선택사항
      default: return false
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
    setCurrentStep(1)
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

  const handleRegisterSubmit = () => {
    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }
    onRegister(formData.email, formData.password, formData.name, profileImage || undefined)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoginMode) {
      e.preventDefault()
      if (currentStep < totalSteps && canProceedToNext()) {
        nextStep()
      } else if (currentStep === totalSteps && canProceedToNext()) {
        handleRegisterSubmit()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-black">
              {isLoginMode ? '로그인' : '회원가입'}
            </h2>
            {!isLoginMode && (
              <div className="text-sm text-black mt-1">
                단계 {currentStep} / {totalSteps}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-black hover:text-black text-xl"
          >
            ✕
          </button>
        </div>

        {!isLoginMode && (
          <div className="w-full bg-gray rounded-ful l h-2 mb-8">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        )}

{isLoginMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="이메일을 입력하세요"
                required
                autoFocus
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
                className="w-full px-3 py-2 border border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="비밀번호를 입력하세요"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium"
            >
              로그인
            </button>
          </form>
        ) : (
          <div 
            className={`transition-all duration-300 ${
              isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
            }`}
          >
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2 text-black">반가워요!</h3>
                  <p className="text-black text-sm">어떤 이름으로 불러드릴까요?</p>
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-4 text-lg border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-black"
                    placeholder="이름을 입력해주세요"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2 text-black">이메일 주소를 알려주세요</h3>
                  <p className="text-black text-sm">로그인할 때 사용할 이메일이에요</p>
                </div>
                <div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-4 text-lg border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-black"
                    placeholder="example@email.com"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2 text-black">안전한 비밀번호를 설정해주세요</h3>
                  <p className="text-black text-sm">6자 이상으로 만들어주세요</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-4 text-lg border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-black"
                      placeholder="비밀번호"
                      minLength={6}
                      autoFocus
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-4 text-lg border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-black"
                      placeholder="비밀번호 확인"
                      minLength={6}
                    />
                  </div>
                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-500 text-sm text-center">비밀번호가 일치하지 않습니다</p>
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2 text-black">프로필 사진을 설정해주세요</h3>
                  <p className="text-black text-sm">나중에도 언제든 변경할 수 있어요</p>
                </div>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-24 h-24 border-2 border-black rounded-full flex items-center justify-center overflow-hidden bg-gray">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt="프로필 미리보기"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-black text-sm">미리보기</span>
                    )}
                  </div>
                  <div className="text-center">
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
                      className={`cursor-pointer px-6 py-3 border border-black rounded-lg hover:bg-black hover:text-white text-sm text-black transition-colors ${
                        imageUploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {imageUploading ? '업로드 중...' : '📷 사진 선택'}
                    </label>
                    <p className="text-xs text-black mt-2">
                      5MB 이하, JPG/PNG 권장
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-8">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 py-3 px-6 border border-black text-black rounded-lg hover:bg-black hover:text-white transition-colors"
                >
                  이전
                </button>
              )}
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedToNext()}
                  className={`flex-1 py-3 px-6 rounded-lg transition-colors ${
                    canProceedToNext()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-black cursor-not-allowed'
                  }`}
                >
                  다음
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRegisterSubmit}
                  className="flex-1 py-3 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  가입 완료
                </button>
              )}
            </div>
          </div>
        )}

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
          <div className="mt-4 pt-4 border-t border-black">
            <p className="text-xs text-black text-center mb-3">
              또는 소셜 계정으로 로그인
            </p>
            <div className="space-y-2">
              <button className="w-full py-2 px-4 border border-black rounded-md hover:bg-black hover:text-white flex items-center justify-center gap-2 text-black transition-colors">
                <span>🟢</span>
                네이버로 로그인
              </button>
              <button className="w-full py-2 px-4 border border-black rounded-md hover:bg-black hover:text-white flex items-center justify-center gap-2 text-black transition-colors">
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