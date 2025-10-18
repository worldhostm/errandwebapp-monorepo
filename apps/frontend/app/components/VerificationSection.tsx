'use client'

import { useState, useEffect } from 'react'
import { verificationApi } from '../lib/api'
import { VerificationStatus, Verification } from '../lib/types'

interface VerificationSectionProps {
  onVerificationChange?: () => void
}

export default function VerificationSection({ onVerificationChange }: VerificationSectionProps) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'phone' | 'email' | 'identity' | 'address'>('phone')
  const [phoneVerification, setPhoneVerification] = useState({
    phone: '',
    verificationId: '',
    code: '',
    step: 'input' // 'input' | 'verify'
  })
  const [documentFiles, setDocumentFiles] = useState<File[]>([])
  const [addressData, setAddressData] = useState({
    address: '',
    files: [] as File[]
  })

  useEffect(() => {
    loadVerificationStatus()
  }, [])

  const loadVerificationStatus = async () => {
    setLoading(true)
    try {
      const response = await verificationApi.getVerificationStatus()
      if (response.success && response.data) {
        setVerificationStatus(response.data.data)
      }
    } catch (error) {
      console.error('인증 상태 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneRequest = async () => {
    if (!phoneVerification.phone) {
      alert('전화번호를 입력해주세요.')
      return
    }

    try {
      const response = await verificationApi.requestPhoneVerification(phoneVerification.phone)
      if (response.success && response.data) {
        setPhoneVerification(prev => ({
          ...prev,
          verificationId: response.data?.verificationId || '',
          step: 'verify'
        }))
        alert(response.message || '인증번호가 발송되었습니다.')
      } else {
        alert(response.error || '인증번호 요청에 실패했습니다.')
      }
    } catch {
      alert('인증번호 요청 중 오류가 발생했습니다.')
    }
  }

  const handlePhoneVerify = async () => {
    if (!phoneVerification.code) {
      alert('인증번호를 입력해주세요.')
      return
    }

    try {
      const response = await verificationApi.verifyPhoneCode(phoneVerification.verificationId, phoneVerification.code)
      if (response.success) {
        alert(response.data?.message || '전화번호 인증이 완료되었습니다.')
        setPhoneVerification({ phone: '', verificationId: '', code: '', step: 'input' })
        await loadVerificationStatus()
        onVerificationChange?.()
      } else {
        alert(response.error || '인증번호가 올바르지 않습니다.')
      }
    } catch {
      alert('인증 확인 중 오류가 발생했습니다.')
    }
  }

  const handleEmailRequest = async () => {
    try {
      const response = await verificationApi.requestEmailVerification()
      if (response.success) {
        alert(response.data?.message || '인증 이메일이 발송되었습니다.')
        await loadVerificationStatus()
      } else {
        alert(response.error || '이메일 인증 요청에 실패했습니다.')
      }
    } catch {
      alert('이메일 인증 요청 중 오류가 발생했습니다.')
    }
  }

  const handleFileUpload = async (files: File[]) => {
    const uploadedUrls = []
    for (const file of files) {
      try {
        // 실제로는 파일 업로드 서비스를 사용해야 함
        // 여기서는 base64로 변환하여 사용
        const reader = new FileReader()
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(file)
        })
        const base64 = await base64Promise
        uploadedUrls.push(base64)
      } catch (error) {
        console.error('파일 업로드 실패:', error)
      }
    }
    return uploadedUrls
  }

  const handleIdentityRequest = async () => {
    if (documentFiles.length === 0) {
      alert('신분증 사진을 첨부해주세요.')
      return
    }

    try {
      const documents = await handleFileUpload(documentFiles)
      const response = await verificationApi.requestIdentityVerification(documents)
      if (response.success) {
        alert(response.data?.message || '신분증 인증 요청이 제출되었습니다.')
        setDocumentFiles([])
        await loadVerificationStatus()
        onVerificationChange?.()
      } else {
        alert(response.error || '신분증 인증 요청에 실패했습니다.')
      }
    } catch {
      alert('신분증 인증 요청 중 오류가 발생했습니다.')
    }
  }

  const handleAddressRequest = async () => {
    if (!addressData.address || addressData.files.length === 0) {
      alert('주소와 증빙서류를 모두 입력해주세요.')
      return
    }

    try {
      const documents = await handleFileUpload(addressData.files)
      const response = await verificationApi.requestAddressVerification(addressData.address, documents)
      if (response.success) {
        alert(response.data?.message || '주소 인증 요청이 제출되었습니다.')
        setAddressData({ address: '', files: [] })
        await loadVerificationStatus()
        onVerificationChange?.()
      } else {
        alert(response.error || '주소 인증 요청에 실패했습니다.')
      }
    } catch {
      alert('주소 인증 요청 중 오류가 발생했습니다.')
    }
  }

  const getVerificationIcon = (verification: Verification | undefined) => {
    if (!verification) return '⚪'
    
    switch (verification.status) {
      case 'verified': return '✅'
      case 'pending': return '⏳'
      case 'rejected': return '❌'
      default: return '⚪'
    }
  }

  const getVerificationBadge = (badge: string) => {
    const badges = {
      phone: { icon: '📱', label: '전화번호 인증', color: 'bg-blue-100 text-blue-800' },
      email: { icon: '📧', label: '이메일 인증', color: 'bg-green-100 text-green-800' },
      identity: { icon: '🆔', label: '신분증 인증', color: 'bg-yellow-100 text-yellow-800' },
      address: { icon: '🏠', label: '주소 인증', color: 'bg-purple-100 text-purple-800' },
      premium: { icon: '⭐', label: '프리미엄 인증', color: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' }
    }
    
    return badges[badge as keyof typeof badges] || badges.phone
  }

  if (loading) {
    return (
      <div className="p-6 border-t">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t pt-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">사용자 인증</h3>
        {verificationStatus && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">인증 레벨</span>
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < (verificationStatus.level || 0) ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium">{verificationStatus.level}/3</span>
          </div>
        )}
      </div>

      {/* 인증 배지 */}
      {verificationStatus && verificationStatus.badges.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">획득한 인증 배지</h4>
          <div className="flex flex-wrap gap-2">
            {verificationStatus.badges.map((badge) => {
              const badgeInfo = getVerificationBadge(badge)
              return (
                <div
                  key={badge}
                  className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badgeInfo.color}`}
                >
                  <span>{badgeInfo.icon}</span>
                  <span>{badgeInfo.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 탭 메뉴 */}
      <div className="flex border-b mb-4">
        {[
          { key: 'phone' as const, label: '전화번호', icon: '📱' },
          { key: 'email' as const, label: '이메일', icon: '📧' },
          { key: 'identity' as const, label: '신분증', icon: '🆔' },
          { key: 'address' as const, label: '주소', icon: '🏠' }
        ].map((tab) => {
          const verification = verificationStatus?.verifications.find(v => v.type === tab.key)
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'text-blue-600 border-blue-500'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span>{getVerificationIcon(verification)}</span>
            </button>
          )
        })}
      </div>

      {/* 탭 내용 */}
      <div className="space-y-4">
        {activeTab === 'phone' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">전화번호 인증</h4>
              {verificationStatus?.isPhoneVerified ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">인증완료</span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">미인증</span>
              )}
            </div>
            
            {!verificationStatus?.isPhoneVerified && (
              <>
                {phoneVerification.step === 'input' ? (
                  <div className="space-y-3">
                    <div>
                      <input
                        type="tel"
                        placeholder="010-1234-5678"
                        value={phoneVerification.phone}
                        onChange={(e) => setPhoneVerification(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handlePhoneRequest}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    >
                      인증번호 요청
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      {phoneVerification.phone}로 발송된 인증번호를 입력해주세요.
                    </p>
                    <input
                      type="text"
                      placeholder="인증번호 6자리"
                      value={phoneVerification.code}
                      onChange={(e) => setPhoneVerification(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={6}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPhoneVerification({ phone: '', verificationId: '', code: '', step: 'input' })}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        다시 입력
                      </button>
                      <button
                        onClick={handlePhoneVerify}
                        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        인증 확인
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            
            {verificationStatus?.isPhoneVerified && (
              <div className="p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">✅ 전화번호 인증이 완료되었습니다.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">이메일 인증</h4>
              {verificationStatus?.isEmailVerified ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">인증완료</span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">미인증</span>
              )}
            </div>
            
            {!verificationStatus?.isEmailVerified && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  가입한 이메일 주소로 인증 링크를 발송합니다.
                </p>
                <button
                  onClick={handleEmailRequest}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  인증 이메일 발송
                </button>
              </div>
            )}
            
            {verificationStatus?.isEmailVerified && (
              <div className="p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">✅ 이메일 인증이 완료되었습니다.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'identity' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">신분증 인증</h4>
              {verificationStatus?.isIdentityVerified ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">인증완료</span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">미인증</span>
              )}
            </div>
            
            {!verificationStatus?.isIdentityVerified && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  신분증 사진을 업로드해주세요. (앞면, 뒷면 모두 필요)
                </p>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setDocumentFiles(Array.from(e.target.files || []))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {documentFiles.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {documentFiles.length}개 파일 선택됨
                    </p>
                  )}
                </div>
                <button
                  onClick={handleIdentityRequest}
                  disabled={documentFiles.length === 0}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
                >
                  신분증 인증 요청
                </button>
              </div>
            )}
            
            {verificationStatus?.isIdentityVerified && (
              <div className="p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">✅ 신분증 인증이 완료되었습니다.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'address' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium">주소 인증</h4>
              {verificationStatus?.isAddressVerified ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">인증완료</span>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">미인증</span>
              )}
            </div>
            
            {!verificationStatus?.isAddressVerified && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                  <input
                    type="text"
                    placeholder="상세 주소를 입력해주세요"
                    value={addressData.address}
                    onChange={(e) => setAddressData(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">증빙서류</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setAddressData(prev => ({ ...prev, files: Array.from(e.target.files || []) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    공과금 고지서, 주민등록등본 등 주소를 확인할 수 있는 서류
                  </p>
                </div>
                <button
                  onClick={handleAddressRequest}
                  disabled={!addressData.address || addressData.files.length === 0}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300"
                >
                  주소 인증 요청
                </button>
              </div>
            )}
            
            {verificationStatus?.isAddressVerified && (
              <div className="p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">✅ 주소 인증이 완료되었습니다.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}