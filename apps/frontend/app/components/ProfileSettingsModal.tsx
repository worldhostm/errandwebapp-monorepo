'use client'

import { useState, useEffect } from 'react'
import EmailVerificationModal from './EmailVerificationModal'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Alert from './ui/Alert'

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

  if (!user) return null

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="개인정보 설정" size="xl">
        {/* 탭 메뉴 */}
        <div className="flex mb-6 border-b border-base-200">
          <button
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'border-primary text-primary'
                : 'border-transparent hover:text-base-content/70'
            }`}
          >
            기본 정보
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent hover:text-base-content/70'
            }`}
          >
            보안
          </button>
          <button
            onClick={() => setActiveTab('verification')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'verification'
                ? 'border-primary text-primary'
                : 'border-transparent hover:text-base-content/70'
            }`}
          >
            인증
          </button>
        </div>

        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        {success && <Alert variant="success" className="mb-4">{success}</Alert>}

        {/* 기본 정보 탭 */}
        {activeTab === 'basic' && (
          <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">이메일</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input input-bordered w-full"
              />
              <p className="text-xs text-base-content/50 mt-1">이메일은 변경할 수 없습니다.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">이름 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">전화번호</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="010-1234-5678"
                className="input input-bordered w-full"
              />
            </div>

            <Button type="submit" variant="primary" fullWidth loading={isLoading}>
              변경사항 저장
            </Button>
          </form>
        )}

        {/* 보안 탭 */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">현재 비밀번호 *</label>
              <input
                type="password"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="input input-bordered w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">새 비밀번호 *</label>
              <input
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="input input-bordered w-full"
                minLength={6}
                required
              />
              <p className="text-xs text-base-content/50 mt-1">최소 6자 이상 입력해주세요.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">새 비밀번호 확인 *</label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="input input-bordered w-full"
                required
              />
            </div>

            <Button type="submit" variant="primary" fullWidth loading={isLoading}>
              비밀번호 변경
            </Button>
          </form>
        )}

        {/* 인증 탭 */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">계정 인증</h3>
              <p className="text-sm text-base-content/60 mb-6">
                계정을 인증하여 신뢰도를 높이고 더 많은 기능을 이용하세요.
              </p>
            </div>

            {/* 이메일 인증 */}
            <div className="border border-base-300 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📧</div>
                  <div>
                    <h4 className="font-medium">이메일 인증</h4>
                    <p className="text-sm text-base-content/60">{user.email}</p>
                  </div>
                </div>
                {isEmailVerified ? (
                  <div className="flex items-center gap-2">
                    <span className="text-success text-sm font-medium">인증 완료</span>
                    <div className="text-2xl">✅</div>
                  </div>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => setShowEmailVerification(true)}>
                    인증하기
                  </Button>
                )}
              </div>
            </div>

            {/* 전화번호 인증 (미구현) */}
            <div className="border border-base-300 rounded-lg p-4 opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📱</div>
                  <div>
                    <h4 className="font-medium">전화번호 인증</h4>
                    <p className="text-sm text-base-content/60">
                      {user.phone || '전화번호가 등록되지 않았습니다'}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-base-content/60">준비 중</span>
              </div>
            </div>

            {/* 신원 인증 (미구현) */}
            <div className="border border-base-300 rounded-lg p-4 opacity-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🪪</div>
                  <div>
                    <h4 className="font-medium">신원 인증</h4>
                    <p className="text-sm text-base-content/60">신분증으로 본인 인증</p>
                  </div>
                </div>
                <span className="text-sm text-base-content/60">준비 중</span>
              </div>
            </div>

            <div className="alert alert-info">
              <span>💡</span>
              <div>
                <h4 className="font-bold">인증 혜택</h4>
                <ul className="text-sm space-y-1 mt-1">
                  <li>• 신뢰도 향상으로 더 많은 심부름 기회</li>
                  <li>• 높은 금액의 심부름 이용 가능</li>
                  <li>• 인증 배지 표시</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </Modal>

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
