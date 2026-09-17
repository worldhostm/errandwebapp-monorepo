'use client'

import { useState } from 'react'
import { errandApi } from '../lib/api'
import type { ErrandLocation, User } from '../lib/types'
import Modal from './ui/Modal'
import Button from './ui/Button'
import Badge from './ui/Badge'

interface ErrandDetailModalProps {
  isOpen: boolean
  onClose: () => void
  errand: ErrandLocation | null
  currentUser: User | null
  onAcceptErrand: (errandId: string) => Promise<void>
  onChatOpen?: (errand: ErrandLocation) => void
}

const statusLabel: Record<string, string> = {
  pending: '🕐 대기중',
  accepted: '✅ 수락됨',
  in_progress: '🔄 진행중',
  completed: '✅ 완료',
}

const statusVariant: Record<string, 'warning' | 'secondary' | 'info' | 'success'> = {
  pending: 'warning',
  accepted: 'secondary',
  in_progress: 'info',
  completed: 'success',
}

export default function ErrandDetailModal({
  isOpen,
  onClose,
  errand,
  currentUser,
  onAcceptErrand,
  onChatOpen,
}: ErrandDetailModalProps) {
  const [isAccepting, setIsAccepting] = useState(false)

  if (!errand) return null

  console.log('✅ 모달 렌더링 진행!')

  const handleAccept = async () => {
    if (!currentUser) return

    setIsAccepting(true)
    try {
      const checkResponse = await errandApi.checkActiveErrand()

      if (checkResponse.success && checkResponse.data?.hasActiveErrand) {
        const activeErrand = checkResponse.data.activeErrand
        const confirmMessage = `이미 수행 중인 심부름이 있습니다.\n\n현재 심부름: "${activeErrand?.title}" (${activeErrand?.status === 'accepted' ? '수락됨' : '진행중'})\n\n그래도 이 심부름을 수락하시겠습니까? (기존 심부름은 취소됩니다)`

        if (!confirm(confirmMessage)) {
          setIsAccepting(false)
          return
        }
      }

      await onAcceptErrand(errand.id)
      onClose()
    } catch (error) {
      console.error('심부름 수락 실패:', error)
    } finally {
      setIsAccepting(false)
    }
  }

  const handleChatClick = () => {
    if (onChatOpen) onChatOpen(errand)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={errand.title} size="md">
      {errand.requestedBy && (
        <p className="text-sm text-base-content/60 -mt-2 mb-4">{errand.requestedBy.name}님의 심부름</p>
      )}

      {/* 심부름 설명 */}
      <p className="text-base-content leading-relaxed mb-4">{errand.description}</p>

      <div className="space-y-0 text-sm mb-6">
        <div className="flex justify-between items-center py-2 border-b border-base-200">
          <span className="text-base-content/60">카테고리</span>
          <span className="font-medium">{errand.category}</span>
        </div>
        {errand.deadline && (
          <div className="flex justify-between items-center py-2 border-b border-base-200">
            <span className="text-base-content/60">마감일</span>
            <span className="font-medium">
              {new Date(errand.deadline).toLocaleString('ko-KR', {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>
        )}
        {errand.distance && (
          <div className="flex justify-between items-center py-2 border-b border-base-200">
            <span className="text-base-content/60">거리</span>
            <span className="font-medium">{errand.distance.toFixed(1)}km</span>
          </div>
        )}
      </div>

      {/* 보상금 및 상태 */}
      <div className="mb-6 p-4 bg-success/10 rounded-lg flex justify-between items-center">
        <div>
          <span className="text-sm text-success">보상금</span>
          <p className="text-2xl font-bold text-success">₩{errand.reward.toLocaleString()}</p>
        </div>
        <Badge variant={statusVariant[errand.status] ?? 'ghost'}>
          {statusLabel[errand.status] ?? errand.status}
        </Badge>
      </div>

      {/* 액션 버튼 */}
      <div className="space-y-3">
        {errand.status === 'pending' && currentUser && (
          <>
            <Button fullWidth loading={isAccepting} onClick={handleAccept}>
              🚀 심부름 수락하기
            </Button>
            <Button fullWidth variant="outline" onClick={handleChatClick}>
              💬 채팅으로 문의하기
            </Button>
          </>
        )}

        {!currentUser && (
          <div className="text-center p-4 bg-base-200 rounded-lg">
            <p className="text-base-content/60">로그인하면 심부름을 수락할 수 있습니다</p>
          </div>
        )}

        {errand.status !== 'pending' && (
          <div className={`w-full py-3 text-center rounded-lg font-medium ${
            errand.status === 'accepted' ? 'bg-secondary/20 text-secondary-content' :
            errand.status === 'in_progress' ? 'bg-info/20 text-info-content' :
            'bg-success/20 text-success-content'
          }`}>
            {errand.status === 'accepted' ? '🎯 이미 수락된 심부름입니다' :
             errand.status === 'in_progress' ? '🔄 현재 진행 중인 심부름입니다' :
             '✅ 완료된 심부름입니다'}
          </div>
        )}

        <Button fullWidth variant="ghost" onClick={onClose}>닫기</Button>
      </div>
    </Modal>
  )
}
