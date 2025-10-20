'use client'

import { useState, useEffect } from 'react'
import EmailVerificationModal from './EmailVerificationModal'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  avatar?: string
  isVerified: boolean
  verification: Array<{
    type: string
    status: string
  }>
}

interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onUpdate: (data: { name?: string; phone?: string; avatar?: string }) => Promise<void>
}

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  user,
  onUpdate
}: ProfileSettingsModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'security' | 'verification'>('basic')

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    }
  }, [user])

  const isEmailVerified = user?.verification?.some(
    v => v.type === 'email' && v.status === 'verified'
  ) || false

  const handleBasicInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      await onUpdate({
        name: formData.name,
        phone: formData.phone
      })

      setSuccess('개인정보가 성공적으로 업데이트되었습니다.')
    } catch (err) {
      setError(err instanceof Error ? err.message : '업데이트에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다.')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '비밀번호 변경에 실패했습니다.')
      }

      setSuccess('비밀번호가 성공적으로 변경되었습니다.')
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailVerified = async () => {
    setShowEmailVerification(false)
    setSuccess('이메일이 성공적으로 인증되었습니다!')
    // Refresh user data
    window.location.reload()
  }

  if (!isOpen || !user) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
            <h2 className="text-2xl font-bold text-black">개인정보 설정</h2>
            <button
              onClick={onClose}
              className="text-black hover:text-black text-2xl"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex px-6">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'basic'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-black hover:text-black'
                }`}
              >
                기본 정보
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'security'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-black hover:text-black'
                }`}
              >
                보안
              </button>
              <button
                onClick={() => setActiveTab('verification')}
                className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                  activeTab === 'verification'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-black hover:text-black'
                }`}
              >
                인증
              </button>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {/* 기본 정보 탭 */}
            {activeTab === 'basic' && (
              <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    이메일
                  </label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-black"
                  />
                  <p className="text-xs text-black mt-1">이메일은 변경할 수 없습니다.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="010-1234-5678"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {isLoading ? '저장 중...' : '변경사항 저장'}
                </button>
              </form>
            )}

            {/* 보안 탭 */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    현재 비밀번호 *
                  </label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    새 비밀번호 *
                  </label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-black mt-1">최소 6자 이상 입력해주세요.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    새 비밀번호 확인 *
                  </label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {isLoading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </form>
            )}

            {/* 인증 탭 */}
            {activeTab === 'verification' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">계정 인증</h3>
                  <p className="text-sm text-black mb-6">
                    계정을 인증하여 신뢰도를 높이고 더 많은 기능을 이용하세요.
                  </p>
                </div>

                {/* 이메일 인증 */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📧</div>
                      <div>
                        <h4 className="font-medium text-black">이메일 인증</h4>
                        <p className="text-sm text-black">{user.email}</p>
                      </div>
                    </div>
                    {isEmailVerified ? (
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 text-sm font-medium">인증 완료</span>
                        <div className="text-2xl">✅</div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowEmailVerification(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                      >
                        인증하기
                      </button>
                    )}
                  </div>
                </div>

                {/* 전화번호 인증 (미구현) */}
                <div className="border rounded-lg p-4 opacity-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">📱</div>
                      <div>
                        <h4 className="font-medium text-black">전화번호 인증</h4>
                        <p className="text-sm text-black">
                          {user.phone || '전화번호가 등록되지 않았습니다'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-black">준비 중</span>
                  </div>
                </div>

                {/* 신원 인증 (미구현) */}
                <div className="border rounded-lg p-4 opacity-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🪪</div>
                      <div>
                        <h4 className="font-medium text-black">신원 인증</h4>
                        <p className="text-sm text-black">신분증으로 본인 인증</p>
                      </div>
                    </div>
                    <span className="text-sm text-black">준비 중</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <div className="text-xl">💡</div>
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">인증 혜택</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 신뢰도 향상으로 더 많은 심부름 기회</li>
                        <li>• 높은 금액의 심부름 이용 가능</li>
                        <li>• 인증 배지 표시</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 이메일 인증 모달 */}
      {showEmailVerification && user && (
        <EmailVerificationModal
          isOpen={showEmailVerification}
          onClose={() => setShowEmailVerification(false)}
          email={user.email}
          onVerified={handleEmailVerified}
        />
      )}
    </>
  )
}
