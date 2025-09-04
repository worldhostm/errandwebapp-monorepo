'use client'

import type { ErrandLocation } from '../lib/types'
import { getCategoryInfo } from '../lib/categoryUtils'

interface ClusterModalProps {
  isOpen: boolean
  onClose: () => void
  errands: ErrandLocation[]
  position: { lat: number; lng: number } | null
  onErrandSelect: (errand: ErrandLocation) => void
}

export default function ClusterModal({ 
  isOpen, 
  onClose, 
  errands, 
  position,
  onErrandSelect 
}: ClusterModalProps) {
  if (!isOpen || !position || !errands || errands.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto shadow-lg">
        <div className="p-4">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              이 지역의 심부름 ({errands.length}개)
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ✕
            </button>
          </div>

          {/* 심부름 목록 */}
          <div className="space-y-3">
            {errands.map((errand) => {
              const categoryInfo = getCategoryInfo(errand.category)
              return (
                <div
                  key={errand.id}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
                  onClick={() => {
                    onErrandSelect(errand)
                    onClose()
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{categoryInfo.emoji}</span>
                        <h4 className="font-medium text-gray-900 text-sm">{errand.title}</h4>
                      </div>
                      {errand.isUrgent && (
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          🚨 마감임박
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      errand.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      errand.status === 'accepted' ? 'bg-orange-100 text-orange-800' :
                      errand.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {errand.status === 'pending' ? '대기중' :
                       errand.status === 'accepted' ? '수락됨' :
                       errand.status === 'in_progress' ? '진행중' : '완료'}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{errand.description}</p>
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>💰 ₩{errand.reward.toLocaleString()}</span>
                    {errand.distance && (
                      <span>📍 {errand.distance.toFixed(1)}km</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}