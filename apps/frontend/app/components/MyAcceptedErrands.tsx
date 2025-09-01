'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { errandApi } from '../lib/api'
import { getCategoryInfo } from '../lib/categoryUtils'
import { getDefaultProfileImage } from '../lib/imageUtils'
import type { User, ErrandLocation } from '../lib/types'
import ChatModal from './ChatModal'

interface MyAcceptedErrandsProps {
  user: User
}

interface AcceptedErrand extends ErrandLocation {
  createdBy?: string
  requesterUser?: {
    _id: string
    name: string
    profileImage?: string
  } | null
}

export default function MyAcceptedErrands({ user }: MyAcceptedErrandsProps) {
  const [acceptedErrands, setAcceptedErrands] = useState<AcceptedErrand[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'accepted' | 'in_progress' | 'completed'>('all')
  const [showChat, setShowChat] = useState(false)
  const [selectedErrandForChat, setSelectedErrandForChat] = useState<AcceptedErrand | null>(null)

  // 백엔드 API 응답을 AcceptedErrand로 변환
  const convertApiErrandToAcceptedErrand = (apiErrand: {
    _id: string
    title: string
    description: string
    location: { coordinates: [number, number] }
    reward: number
    status: string
    category: string
    deadline: string
    createdAt: string
    createdBy: {
      _id: string
      name: string
      profileImage?: string
    }
    acceptedBy?: string
  }): AcceptedErrand => {
    return {
      id: apiErrand._id,
      title: apiErrand.title,
      description: apiErrand.description,
      lat: apiErrand.location.coordinates[1],
      lng: apiErrand.location.coordinates[0],
      reward: apiErrand.reward,
      status: apiErrand.status as 'pending' | 'accepted' | 'in_progress' | 'completed',
      category: apiErrand.category,
      deadline: apiErrand.deadline,
      createdAt: apiErrand.createdAt,
      createdBy: apiErrand.createdBy._id,
      acceptedBy: apiErrand.acceptedBy,
      requesterUser: apiErrand.createdBy
    }
  }

  // 내가 수락한 심부름 목록 조회
  const fetchMyAcceptedErrands = useCallback(async () => {
    setIsLoading(true)
    
    try {
      const response = await errandApi.getUserErrands('accepted')
      
      if (response.success && response.data) {
        const convertedErrands = response.data.errands.map(convertApiErrandToAcceptedErrand)
        setAcceptedErrands(convertedErrands)
        console.log(`내가 수락한 심부름 ${convertedErrands.length}개 조회됨`)
      } else {
        console.error('내가 수락한 심부름 조회 실패:', response.error)
        setAcceptedErrands([])
      }
    } catch (error) {
      console.error('내가 수락한 심부름 조회 오류:', error)
      setAcceptedErrands([])
    }
    
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (user) {
      fetchMyAcceptedErrands()
    }
  }, [user, fetchMyAcceptedErrands])

  // 상태별 필터링
  const filteredErrands = acceptedErrands.filter(errand => {
    if (selectedStatus === 'all') return true
    return errand.status === selectedStatus
  })

  // 심부름 완료 처리
  const handleCompleteErrand = async (errandId: string) => {
    try {
      const response = await errandApi.updateErrandStatus(errandId, 'completed')
      
      if (response.success) {
        alert('심부름을 완료했습니다!')
        fetchMyAcceptedErrands() // 목록 새로고침
      } else {
        alert(response.error || '완료 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('완료 처리 오류:', error)
      alert('완료 처리 중 오류가 발생했습니다.')
    }
  }

  // 심부름 시작 처리
  const handleStartErrand = async (errandId: string) => {
    try {
      const response = await errandApi.updateErrandStatus(errandId, 'in_progress')
      
      if (response.success) {
        alert('심부름을 시작했습니다!')
        fetchMyAcceptedErrands() // 목록 새로고침
      } else {
        alert(response.error || '시작 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('시작 처리 오류:', error)
      alert('시작 처리 중 오류가 발생했습니다.')
    }
  }

  // 채팅 열기
  const handleChatOpen = (errand: AcceptedErrand) => {
    setSelectedErrandForChat(errand)
    setShowChat(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-orange-100 text-orange-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted': return '수락됨'
      case 'in_progress': return '진행중'
      case 'completed': return '완료'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            내가 수행하는 심부름
          </h2>
          <p className="text-gray-600">
            수락한 심부름의 진행 상황을 확인하고 관리하세요
          </p>
        </div>
        <button
          onClick={fetchMyAcceptedErrands}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
        >
          <span>🔄</span>
          새로고침
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'all', label: '전체' },
          { key: 'accepted', label: '수락됨' },
          { key: 'in_progress', label: '진행중' },
          { key: 'completed', label: '완료' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedStatus(key as typeof selectedStatus)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedStatus === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            <span className="ml-1 text-xs">
              ({key === 'all' ? acceptedErrands.length : acceptedErrands.filter(e => e.status === key).length})
            </span>
          </button>
        ))}
      </div>

      {/* 심부름 목록 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">심부름을 조회하고 있습니다...</p>
        </div>
      ) : filteredErrands.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>
            {selectedStatus === 'all' 
              ? '수락한 심부름이 없습니다.' 
              : `${getStatusText(selectedStatus)} 상태의 심부름이 없습니다.`}
          </p>
          <p className="text-sm mt-1">주변 심부름을 찾아서 수락해보세요.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredErrands.map((errand) => {
            const categoryInfo = getCategoryInfo(errand.category)
            return (
              <div 
                key={errand.id} 
                className="bg-white p-4 rounded-lg shadow-sm border-2 border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{categoryInfo.emoji}</span>
                      <h4 className="font-medium text-gray-900">{errand.title}</h4>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ml-2 ${getStatusColor(errand.status)}`}>
                    {getStatusText(errand.status)}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{errand.description}</p>
                
                {/* 의뢰자 정보 */}
                {errand.requesterUser && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-md">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-300 relative">
                      <Image
                        src={errand.requesterUser.profileImage || getDefaultProfileImage(errand.requesterUser.name)}
                        alt={`${errand.requesterUser.name} 프로필`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      의뢰자: {errand.requesterUser.name}
                    </span>
                  </div>
                )}
                
                <div className="space-y-2 text-xs text-gray-500 mb-3">
                  <div className="flex justify-between">
                    <span className={`px-2 py-1 rounded ${categoryInfo.color}`}>
                      {categoryInfo.emoji} {errand.category}
                    </span>
                    <span>수락일: {new Date(errand.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div>
                    마감: {new Date(errand.deadline).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-green-600">
                    ₩{errand.reward.toLocaleString()}
                  </span>
                </div>

                {/* 액션 버튼들 */}
                <div className="flex gap-2">
                  {errand.status === 'accepted' && (
                    <>
                      <button 
                        onClick={() => handleStartErrand(errand.id)}
                        className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm"
                      >
                        시작하기
                      </button>
                      {errand.requesterUser && (
                        <button 
                          onClick={() => handleChatOpen(errand)}
                          className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 text-sm"
                        >
                          채팅하기
                        </button>
                      )}
                    </>
                  )}
                  
                  {errand.status === 'in_progress' && (
                    <>
                      <button 
                        onClick={() => handleCompleteErrand(errand.id)}
                        className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 text-sm"
                      >
                        완료하기
                      </button>
                      {errand.requesterUser && (
                        <button 
                          onClick={() => handleChatOpen(errand)}
                          className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 text-sm"
                        >
                          채팅하기
                        </button>
                      )}
                    </>
                  )}
                  
                  {errand.status === 'completed' && (
                    <div className="flex-1 text-center py-2 text-sm text-gray-500">
                      완료된 심부름입니다
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 채팅 모달 */}
      {showChat && selectedErrandForChat && selectedErrandForChat.requesterUser && (
        <ChatModal
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          errandTitle={selectedErrandForChat.title}
          otherUser={{
            id: selectedErrandForChat.requesterUser._id,
            name: selectedErrandForChat.requesterUser.name
          }}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}