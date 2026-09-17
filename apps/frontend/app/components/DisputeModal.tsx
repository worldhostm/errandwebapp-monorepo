'use client'

import { useState } from 'react'
import Image from 'next/image'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Alert from './ui/Alert'

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
  { value: 'other', label: '기타 문제' },
]

export default function DisputeModal({ isOpen, onClose, errand, onSubmit }: DisputeModalProps) {
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="완료 인증 이의제기" size="lg">
      {/* 심부름 정보 */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">심부름 제목</h4>
        <p className="bg-base-200 p-3 rounded-md text-sm">{errand.title}</p>
      </div>

      {/* 완료 인증 정보 */}
      {errand.completionVerification && (
        <div className="mb-6">
          <h4 className="font-medium mb-3">제출된 완료 인증</h4>
          <div className="bg-base-200 rounded-lg p-4">
            <div className="mb-3">
              <Image
                src={errand.completionVerification.image}
                alt="완료 인증 사진"
                width={400}
                height={300}
                className="rounded-lg object-contain bg-white max-h-60 mx-auto border"
              />
            </div>
            <p className="text-sm font-medium mb-1">완료 메시지:</p>
            <p className="bg-white p-3 rounded border text-sm">{errand.completionVerification.message}</p>
            <p className="mt-2 text-xs text-base-content/50">
              제출일: {new Date(errand.completionVerification.submittedAt).toLocaleString('ko-KR')}
            </p>
          </div>
        </div>
      )}

      {/* 이의제기 사유 선택 */}
      <div className="mb-6">
        <label className="block font-medium mb-3">
          이의제기 사유 <span className="text-error">*</span>
        </label>
        <div className="space-y-2">
          {disputeReasons.map((reason) => (
            <label
              key={reason.value}
              className="flex items-center p-3 border border-base-200 rounded-lg hover:bg-base-100 cursor-pointer"
            >
              <input
                type="radio"
                name="disputeReason"
                value={reason.value}
                checked={selectedReason === reason.value}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="radio radio-error mr-3"
              />
              <span className="text-sm">{reason.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 상세 설명 */}
      <div className="mb-6">
        <label className="block font-medium mb-2">
          상세 설명 <span className="text-error">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="왜 이 완료 인증에 문제가 있다고 생각하시는지 구체적으로 설명해주세요..."
          className="textarea textarea-bordered w-full resize-none"
          rows={6}
          maxLength={1000}
        />
        <div className="text-right text-xs text-base-content/50 mt-1">{description.length}/1000</div>
      </div>

      {/* 주의사항 */}
      <Alert variant="warning" title="주의사항" className="mb-6">
        <ul className="text-sm space-y-1 mt-1">
          <li>• 이의제기는 신중히 제출해주세요. 허위 신고는 제재를 받을 수 있습니다.</li>
          <li>• 제출된 이의제기는 관리자가 검토한 후 처리됩니다.</li>
          <li>• 검토 결과에 따라 심부름 상태가 변경될 수 있습니다.</li>
        </ul>
      </Alert>

      {/* 버튼 */}
      <div className="flex gap-3 pt-4 border-t border-base-200">
        <Button variant="ghost" onClick={handleClose} disabled={isSubmitting} className="flex-1">
          취소
        </Button>
        <Button
          variant="error"
          onClick={handleSubmit}
          disabled={!selectedReason || !description.trim()}
          loading={isSubmitting}
          className="flex-1"
        >
          이의제기 제출
        </Button>
      </div>
    </Modal>
  )
}
