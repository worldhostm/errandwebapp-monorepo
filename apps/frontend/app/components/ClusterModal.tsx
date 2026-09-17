'use client'

import type { ErrandLocation } from '../lib/types'
import { getCategoryInfo } from '../lib/categoryUtils'
import Modal from './ui/Modal'
import Badge from './ui/Badge'

interface ClusterModalProps {
  isOpen: boolean
  onClose: () => void
  errands: ErrandLocation[]
  position: { lat: number; lng: number } | null
  onErrandSelect: (errand: ErrandLocation) => void
}

const statusLabel: Record<string, string> = {
  pending: '대기중',
  accepted: '수락됨',
  in_progress: '진행중',
  completed: '완료',
}

const statusVariant: Record<string, 'warning' | 'secondary' | 'info' | 'success'> = {
  pending: 'warning',
  accepted: 'secondary',
  in_progress: 'info',
  completed: 'success',
}

export default function ClusterModal({
  isOpen,
  onClose,
  errands,
  position,
  onErrandSelect,
}: ClusterModalProps) {
  if (!position || !errands || errands.length === 0) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`이 지역의 심부름 (${errands.length}개)`}
      size="md"
    >
      <div className="space-y-3">
        {errands.map((errand) => {
          const categoryInfo = getCategoryInfo(errand.category)
          return (
            <div
              key={errand.id}
              className="p-3 border border-base-200 rounded-lg cursor-pointer hover:bg-base-50 hover:border-primary/40 transition-colors"
              onClick={() => {
                onErrandSelect(errand)
                onClose()
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{categoryInfo.emoji}</span>
                    <h4 className="font-medium text-sm">{errand.title}</h4>
                  </div>
                  {errand.isUrgent && (
                    <Badge variant="error" size="xs">🚨 마감임박</Badge>
                  )}
                </div>
                <Badge variant={statusVariant[errand.status] ?? 'ghost'} size="sm">
                  {statusLabel[errand.status] ?? errand.status}
                </Badge>
              </div>

              <p className="text-base-content/60 text-sm mb-2 line-clamp-2">{errand.description}</p>

              <div className="flex justify-between items-center text-xs text-base-content/50">
                <span>💰 ₩{errand.reward.toLocaleString()}</span>
                {errand.distance && <span>📍 {errand.distance.toFixed(1)}km</span>}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
