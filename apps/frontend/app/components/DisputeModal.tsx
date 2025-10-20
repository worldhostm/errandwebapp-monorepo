'use client'

import { useState } from 'react'
import Image from 'next/image'

interface DisputeModalProps {
  isOpen: boolean
  onClose: () => void
  errand: {
    id: string
    title: string
    completionVerification?: {
      image: string
      message: string
      submittedAt: string
    }
  }
  onSubmit: (reason: string, description: string) => Promise<void>
}

const disputeReasons = [
  { value: 'fake_completion', label: '가짜 완료 (실제로 완료되지 않음)' },
  { value: 'poor_quality', label: '품질이 기준에 미달' },
  { value: 'not_completed', label: '요구사항이 완전히 이행되지 않음' },
  { value: 'other', label: '기타 문제' }
]

export default function DisputeModal({
  isOpen,
  onClose,
  errand,
  onSubmit
}: DisputeModalProps) {
  const [selectedReason, setSelectedReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!selectedReason || !description.trim()) {
      alert('이의제기 사유와 상세 설명을 모두 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(selectedReason, description.trim())
      handleClose()
    } catch (error) {
      console.error('이의제기 제출 오류:', error)
      alert('이의제기 제출에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSelectedReason('')
    setDescription('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-black">
              완료 인증 이의제기
            </h3>
            <button
              onClick={handleClose}
              className="text-black hover:text-black"
            >
              ✕
            </button>
          </div>

          {/* 심부름 정보 */}
          <div className="mb-6">
            <h4 className="font-medium text-black mb-2">심부름 제목</h4>
            <p className="text-black bg-gray-50 p-3 rounded-md">{errand.title}</p>
          </div>

          {/* 완료 인증 정보 */}
          {errand.completionVerification && (
            <div className="mb-6">
              <h4 className="font-medium text-black mb-3">제출된 완료 인증</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-3">
                  <Image
                    src={errand.completionVerification.image}
                    alt="완료 인증 사진"
                    width={400}
                    height={300}
                    className="rounded-lg object-contain bg-white max-h-60 mx-auto border"
                  />
                </div>
                <div className="mb-2">
                  <span className="text-sm font-medium text-black">완료 메시지:</span>
                </div>
                <p className="text-black bg-white p-3 rounded border">
                  {errand.completionVerification.message}
                </p>
                <div className="mt-2 text-sm text-black">
                  제출일: {new Date(errand.completionVerification.submittedAt).toLocaleString('ko-KR')}
                </div>
              </div>
            </div>
          )}

          {/* 이의제기 사유 선택 */}
          <div className="mb-6">
            <label className="block font-medium text-black mb-3">
              이의제기 사유 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {disputeReasons.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="disputeReason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mr-3 text-red-500"
                  />
                  <span className="text-black">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 상세 설명 */}
          <div className="mb-6">
            <label className="block font-medium text-black mb-2">
              상세 설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="왜 이 완료 인증에 문제가 있다고 생각하시는지 구체적으로 설명해주세요..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              rows={6}
              maxLength={1000}
            />
            <div className="text-right text-sm text-black mt-1">
              {description.length}/1000
            </div>
          </div>

          {/* 주의사항 */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <span className="text-yellow-600 text-xl mr-2">⚠️</span>
              <div>
                <h5 className="font-medium text-yellow-800 mb-1">주의사항</h5>
                <p className="text-sm text-yellow-700">
                  • 이의제기는 신중히 제출해주세요. 허위 신고는 제재를 받을 수 있습니다.<br/>
                  • 제출된 이의제기는 관리자가 검토한 후 처리됩니다.<br/>
                  • 검토 결과에 따라 심부름 상태가 변경될 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedReason || !description.trim() || isSubmitting}
              className="flex-1 py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '제출 중...' : '이의제기 제출'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}