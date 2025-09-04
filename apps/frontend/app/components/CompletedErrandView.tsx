'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { errandApi } from '../lib/api'
import DisputeModal from './DisputeModal'

interface CompletedErrandViewProps {
  errandId: string
  user: any
  onClose: () => void
}

interface CompletedErrand {
  id: string
  title: string
  description: string
  reward: number
  status: string
  completionVerification?: {
    image: string
    message: string
    submittedAt: string
  }
  dispute?: {
    reason: string
    description: string
    status: string
    submittedAt: string
  }
  acceptedBy?: {
    name: string
    avatar?: string
  }
}

export default function CompletedErrandView({ errandId, user, onClose }: CompletedErrandViewProps) {
  const [errand, setErrand] = useState<CompletedErrand | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDisputeModal, setShowDisputeModal] = useState(false)

  useEffect(() => {
    fetchErrandDetails()
  }, [errandId])

  const fetchErrandDetails = async () => {
    try {
      const response = await errandApi.getErrandWithVerification(errandId)
      if (response.success && response.data) {
        setErrand(response.data.errand as any)
      } else {
        alert('심부름 정보를 불러올 수 없습니다.')
        onClose()
      }
    } catch (error) {
      console.error('심부름 정보 조회 오류:', error)
      alert('심부름 정보를 불러오는 중 오류가 발생했습니다.')
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisputeSubmit = async (reason: string, description: string) => {
    try {
      const response = await errandApi.reportDispute(errandId, reason, description)
      if (response.success) {
        alert('이의제기가 제출되었습니다. 검토 후 연락드리겠습니다.')
        fetchErrandDetails() // 최신 정보 다시 불러오기
      } else {
        alert(response.error || '이의제기 제출에 실패했습니다.')
      }
    } catch (error) {
      console.error('이의제기 제출 오류:', error)
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>심부름 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!errand) return null

  const getDisputeStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'reviewed': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDisputeStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '검토 대기중'
      case 'reviewed': return '검토 중'
      case 'resolved': return '해결 완료'
      default: return status
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              완료된 심부름 확인
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* 심부름 기본 정보 */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-2">{errand.title}</h4>
            <p className="text-gray-600 mb-4">{errand.description}</p>
            
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <p className="font-medium text-gray-900">
                    수행자: {errand.acceptedBy?.name || '알 수 없음'}
                  </p>
                  <p className="text-sm text-gray-500">
                    상태: <span className={`px-2 py-1 rounded text-xs ${
                      errand.status === 'completed' ? 'bg-green-100 text-green-800' :
                      errand.status === 'disputed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {errand.status === 'completed' ? '완료' :
                       errand.status === 'disputed' ? '이의제기됨' : errand.status}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600">
                  ₩{errand.reward.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* 완료 인증 정보 */}
          {errand.completionVerification && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">완료 인증</h4>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="mb-4">
                  <Image
                    src={errand.completionVerification.image}
                    alt="완료 인증 사진"
                    width={600}
                    height={400}
                    className="rounded-lg object-contain bg-white max-h-80 mx-auto border"
                  />
                </div>
                <div className="mb-3">
                  <p className="font-medium text-gray-700 mb-2">완료 메시지:</p>
                  <p className="text-gray-800 bg-white p-4 rounded border leading-relaxed">
                    {errand.completionVerification.message}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  제출일: {new Date(errand.completionVerification.submittedAt).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          )}

          {/* 이의제기 정보 (있는 경우) */}
          {errand.dispute && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">이의제기 현황</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-red-700">이의제기됨</span>
                  <span className={`px-2 py-1 rounded text-xs ${getDisputeStatusColor(errand.dispute.status)}`}>
                    {getDisputeStatusText(errand.dispute.status)}
                  </span>
                </div>
                <p className="text-sm text-red-800 mb-2">
                  사유: {errand.dispute.reason}
                </p>
                <p className="text-sm text-red-700">
                  {errand.dispute.description}
                </p>
                <p className="text-xs text-red-600 mt-2">
                  제출일: {new Date(errand.dispute.submittedAt).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              닫기
            </button>
            
            {errand.status === 'completed' && !errand.dispute && (
              <button
                onClick={() => setShowDisputeModal(true)}
                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                이의제기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 이의제기 모달 */}
      {showDisputeModal && (
        <DisputeModal
          isOpen={showDisputeModal}
          onClose={() => setShowDisputeModal(false)}
          errand={{
            id: errand.id,
            title: errand.title,
            completionVerification: errand.completionVerification
          }}
          onSubmit={handleDisputeSubmit}
        />
      )}
    </div>
  )
}