'use client'

import { useState } from 'react'
import { errandApi } from '../lib/api'
import type { ErrandLocation, User } from '../lib/types'

interface ErrandDetailModalProps {
  isOpen: boolean
  onClose: () => void
  errand: ErrandLocation | null
  currentUser: User | null
  onAcceptErrand: (errandId: string) => Promise<void>
  onChatOpen?: (errand: ErrandLocation) => void
}

export default function ErrandDetailModal({ 
  isOpen, 
  onClose, 
  errand, 
  currentUser,
  onAcceptErrand,
  onChatOpen 
}: ErrandDetailModalProps) {
  const [isAccepting, setIsAccepting] = useState(false)

  if (!isOpen) {
    return null
  }
  
  if (!errand) {
    return null
  }
  
  console.log('✅ 모달 렌더링 진행!')

  const handleAccept = async () => {
    if (!currentUser) return
    
    setIsAccepting(true)
    try {
      // 먼저 활성 심부름이 있는지 확인
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
    if (onChatOpen) {
      onChatOpen(errand)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-black">{errand.title}</h2>
              {errand.requestedBy && (
                <p className="text-sm text-black mt-1">
                  {errand.requestedBy.name}님의 심부름
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-black hover:text-black text-2xl"
            >
              ✕
            </button>
          </div>

          {/* 심부름 설명 */}
          <div className="mb-6">
            <p className="text-black leading-relaxed mb-4">{errand.description}</p>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-black">카테고리</span>
                <span className="font-medium text-black">{errand.category}</span>
              </div>
              
              {errand.deadline && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-black">마감일</span>
                  <span className="font-medium text-black">
                    {new Date(errand.deadline).toLocaleString('ko-KR', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
              
              {errand.distance && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-black">거리</span>
                  <span className="font-medium text-black">{errand.distance.toFixed(1)}km</span>
                </div>
              )}
            </div>
          </div>

          {/* 보상금 및 상태 */}
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-green-600">보상금</span>
                <p className="text-2xl font-bold text-green-700">
                  ₩{errand.reward.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  errand.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  errand.status === 'accepted' ? 'bg-orange-100 text-orange-800' :
                  errand.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {errand.status === 'pending' ? '🕐 대기중' :
                   errand.status === 'accepted' ? '✅ 수락됨' :
                   errand.status === 'in_progress' ? '🔄 진행중' : '✅ 완료'}
                </span>
              </div>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            {errand.status === 'pending' && currentUser && (
              <>
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                    isAccepting
                      ? 'bg-gray-400 cursor-not-allowed text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isAccepting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      수락 처리중...
                    </div>
                  ) : (
                    '🚀 심부름 수락하기'
                  )}
                </button>
                
                <button
                  onClick={handleChatClick}
                  className="w-full py-3 px-4 rounded-lg border-2 border-gray-300 text-black font-semibold hover:bg-gray-50 transition-colors"
                >
                  💬 채팅으로 문의하기
                </button>
              </>
            )}

            {!currentUser && (
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <p className="text-black">로그인하면 심부름을 수락할 수 있습니다</p>
              </div>
            )}

            {errand.status !== 'pending' && (
              <div className={`w-full py-3 text-center rounded-lg font-medium ${
                errand.status === 'accepted' ? 'bg-orange-100 text-orange-800' :
                errand.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {errand.status === 'accepted' ? '🎯 이미 수락된 심부름입니다' :
                 errand.status === 'in_progress' ? '🔄 현재 진행 중인 심부름입니다' :
                 '✅ 완료된 심부름입니다'}
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-lg text-black hover:text-black transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}