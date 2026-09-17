'use client'

import { useState } from 'react'
import Image from 'next/image'
import { handleImageUpload } from '../lib/imageUtils'
import { AUTH, NAVER_COLORS, TIMING } from '../lib/constants'
import Modal from './ui/Modal'
import Button from './ui/Button'

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
  const totalSteps = AUTH.REGISTER_STEPS

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
      }, TIMING.STEP_TRANSITION)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(prev => prev - 1)
        setIsTransitioning(false)
      }, TIMING.STEP_TRANSITION)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return formData.name.trim() !== ''
      case 2: return formData.email.trim() !== '' && formData.email.includes('@')
      case 3: return formData.password.length >= AUTH.MIN_PASSWORD_LENGTH && formData.password === formData.confirmPassword
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isLoginMode ? '로그인' : '회원가입'} size="md">
      {!isLoginMode && (
        <div className="text-sm text-base-content/60 -mt-2 mb-4">
          단계 {currentStep} / {totalSteps}
        </div>
      )}

      {!isLoginMode && (
        <div className="w-full bg-base-200 rounded-full h-2 mb-8">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      )}

      {isLoginMode ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="input input-bordered w-full"
              placeholder="이메일을 입력하세요"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="input input-bordered w-full"
              placeholder="비밀번호를 입력하세요"
              required
              minLength={AUTH.MIN_PASSWORD_LENGTH}
            />
          </div>

          <Button type="submit" variant="primary" fullWidth>로그인</Button>
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
                <h3 className="text-xl font-semibold mb-2">반가워요!</h3>
                <p className="text-base-content/60 text-sm">어떤 이름으로 불러드릴까요?</p>
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                onKeyPress={handleKeyPress}
                className="input input-bordered w-full text-lg text-center"
                placeholder="이름을 입력해주세요"
                autoFocus
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold mb-2">이메일 주소를 알려주세요</h3>
                <p className="text-base-content/60 text-sm">로그인할 때 사용할 이메일이에요</p>
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                onKeyPress={handleKeyPress}
                className="input input-bordered w-full text-lg text-center"
                placeholder="example@email.com"
                autoFocus
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold mb-2">안전한 비밀번호를 설정해주세요</h3>
                <p className="text-base-content/60 text-sm">6자 이상으로 만들어주세요</p>
              </div>
              <div className="space-y-4">
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  className="input input-bordered w-full text-lg text-center"
                  placeholder="비밀번호"
                  minLength={AUTH.MIN_PASSWORD_LENGTH}
                  autoFocus
                />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  className="input input-bordered w-full text-lg text-center"
                  placeholder="비밀번호 확인"
                  minLength={AUTH.MIN_PASSWORD_LENGTH}
                />
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-error text-sm text-center">비밀번호가 일치하지 않습니다</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold mb-2">프로필 사진을 설정해주세요</h3>
                <p className="text-base-content/60 text-sm">나중에도 언제든 변경할 수 있어요</p>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 border-2 border-base-300 rounded-full flex items-center justify-center overflow-hidden bg-base-200">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt="프로필 미리보기"
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-base-content/50 text-sm">미리보기</span>
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
                    className={`cursor-pointer px-6 py-3 border border-base-300 rounded-lg hover:bg-base-100 text-sm transition-colors ${
                      imageUploading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {imageUploading ? '업로드 중...' : '📷 사진 선택'}
                  </label>
                  <p className="text-xs text-base-content/50 mt-2">5MB 이하, JPG/PNG 권장</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-8">
            {currentStep > 1 && (
              <Button type="button" variant="ghost" onClick={prevStep} className="flex-1">이전</Button>
            )}
            {currentStep < totalSteps ? (
              <Button
                type="button"
                variant="primary"
                onClick={nextStep}
                disabled={!canProceedToNext()}
                className="flex-1"
              >
                다음
              </Button>
            ) : (
              <Button
                type="button"
                variant="success"
                onClick={handleRegisterSubmit}
                className="flex-1"
              >
                가입 완료
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="text-sm text-base-content/60">
          {isLoginMode ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}
          <button
            onClick={toggleMode}
            className="ml-1 text-primary hover:text-primary/80 font-medium"
          >
            {isLoginMode ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>

      {isLoginMode && (
        <div className="mt-4 pt-4 border-t border-base-200">
          <p className="text-xs text-base-content/50 text-center mb-3">또는 소셜 계정으로 로그인</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                window.location.href = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/naver`
              }}
              style={{ backgroundColor: NAVER_COLORS.BASE }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = NAVER_COLORS.HOVER)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = NAVER_COLORS.BASE)}
              className="w-full py-2 px-4 text-white rounded-md flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M13.527 14.152L10.34 9H7v12h3.473V15.848L13.66 21H17V9h-3.473z"/>
              </svg>
              네이버로 로그인
            </button>
            <button className="w-full py-2 px-4 border border-base-300 rounded-md hover:bg-base-100 flex items-center justify-center gap-2 transition-colors">
              <span>🟡</span>
              카카오로 로그인
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
