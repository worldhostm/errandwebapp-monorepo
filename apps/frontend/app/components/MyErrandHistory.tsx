'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { errandApi } from '../lib/api'
import { getCategoryInfo } from '../lib/categoryUtils'
import { getDefaultProfileImage } from '../lib/imageUtils'
import type { User, ErrandLocation, ErrandStatus, Errand } from '../lib/types'
import ChatModal from './ChatModal'
import CompletedErrandView from './CompletedErrandView'

interface MyErrandHistoryProps {
  user: User
}

interface MyErrand extends ErrandLocation {
  createdBy?: string
  acceptedByUser?: {
    id: string
    name: string
    profileImage?: string
  } | null
}

export default function MyErrandHistory({ user }: MyErrandHistoryProps) {
  const [myErrands, setMyErrands] = useState<MyErrand[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'disputed'>('all')
  const [showChat, setShowChat] = useState(false)
  const [selectedErrandForChat, setSelectedErrandForChat] = useState<MyErrand | null>(null)
  const [showCompletedErrandView, setShowCompletedErrandView] = useState(false)
  const [selectedCompletedErrandId, setSelectedCompletedErrandId] = useState<string>('')

  // API 응답 데이터를 MyErrand로 변환
  const convertErrandToMyErrand = useCallback((errand: Errand): MyErrand => {
    console.log('🔄 변환할 심부름 데이터:', errand)

    // deadline 변환: Date | undefined -> string
    const deadlineStr = errand.deadline
      ? (errand.deadline instanceof Date ? errand.deadline.toISOString() : String(errand.deadline))
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 기본값: 24시간 후

    // createdAt 변환: Date -> string
    const createdAtStr = errand.createdAt instanceof Date
      ? errand.createdAt.toISOString()
      : String(errand.createdAt)

    // requestedBy 변환: string | User -> string
    const createdByStr = typeof errand.requestedBy === 'string'
      ? errand.requestedBy
      : errand.requestedBy.id

    // Errand 타입을 MyErrand로 변환
    const result: MyErrand = {
      id: errand.id,
      title: errand.title,
      description: errand.description,
      lat: errand.location.coordinates[1], // latitude
      lng: errand.location.coordinates[0], // longitude
      reward: errand.reward,
      status: errand.status,
      category: errand.category,
      deadline: deadlineStr,
      createdAt: createdAtStr,
      createdBy: createdByStr,
      acceptedBy: typeof errand.acceptedBy === 'string' ? errand.acceptedBy : errand.acceptedBy?.id,
      acceptedByUser: errand.acceptedBy && typeof errand.acceptedBy === 'object' ? {
        id: errand.acceptedBy.id,
        name: errand.acceptedBy.name,
        profileImage: errand.acceptedBy.avatar
      } : null
    }

    console.log('✅ 변환된 심부름:', result)
    return result
  }, [])

  // 내가 등록한 심부름 목록 조회
  const fetchMyErrands = useCallback(async () => {
    console.log('🔍 내가 등록한 심부름 조회 시작')
    setIsLoading(true)
    
    try {
      const response = await errandApi.getMyErrands()
      console.log('📡 API 응답:', response)
      
      if (response.success && response.data) {
        console.log('📦 원시 API 데이터:', response.data.errands)
        
        const convertedErrands = response.data.errands.map((errand: Errand) => convertErrandToMyErrand(errand))
        setMyErrands(convertedErrands)
        console.log(`✅ 내가 등록한 심부름 ${convertedErrands.length}개 조회됨:`, convertedErrands)
      } else {
        console.error('❌ 내 심부름 조회 실패:', response.error)
        setMyErrands([])
      }
    } catch (error) {
      console.error('❌ 내 심부름 조회 오류:', error)
      setMyErrands([])
    }
    
    setIsLoading(false)
  }, [convertErrandToMyErrand])

  useEffect(() => {
    if (user) {
      fetchMyErrands()
    }
  }, [user, fetchMyErrands])

  // 상태별 필터링
  const filteredErrands = myErrands.filter(errand => {
    if (selectedStatus === 'all') return true
    return errand.status === selectedStatus
  })

  // 심부름 삭제
  const handleDeleteErrand = async (errandId: string) => {
    if (!confirm('이 심부름을 삭제하시겠습니까?')) return
    
    try {
      const response = await errandApi.deleteErrand(errandId)
      
      if (response.success) {
        alert('심부름이 삭제되었습니다.')
        fetchMyErrands() // 목록 새로고침
      } else {
        alert(response.error || '심부름 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('심부름 삭제 오류:', error)
      alert('심부름 삭제 중 오류가 발생했습니다.')
    }
  }

  // 심부름 상태 업데이트
  const handleStatusUpdate = async (errandId: string, newStatus: string) => {
    try {
      const response = await errandApi.updateErrandStatus(errandId, newStatus as ErrandStatus)
      
      if (response.success) {
        alert(`심부름 상태가 ${newStatus === 'completed' ? '완료' : newStatus}로 변경되었습니다.`)
        fetchMyErrands() // 목록 새로고침
      } else {
        alert(response.error || '상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('상태 변경 오류:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    }
  }

  // 채팅 열기
  const handleChatOpen = (errand: MyErrand) => {
    setSelectedErrandForChat(errand)
    setShowChat(true)
  }

  // 완료된 심부름 상세보기 열기
  const handleViewCompletedErrand = (errandId: string) => {
    setSelectedCompletedErrandId(errandId)
    setShowCompletedErrandView(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'accepted': return 'bg-orange-100 text-orange-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'disputed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-black'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중'
      case 'accepted': return '수락됨'
      case 'in_progress': return '진행중'
      case 'completed': return '완료'
      case 'disputed': return '이의제기됨'
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-black mb-2">
            내가 등록한 심부름
          </h2>
          <p className="text-black">
            등록한 심부름의 진행 상황을 확인하고 관리하세요
          </p>
        </div>
        <button
          onClick={fetchMyErrands}
          disabled={isLoading}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-black rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* 필터 탭 */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'all', label: '전체' },
          { key: 'pending', label: '대기중' },
          { key: 'accepted', label: '수락됨' },
          { key: 'in_progress', label: '진행중' },
          { key: 'completed', label: '완료' },
          { key: 'disputed', label: '이의제기됨' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelectedStatus(key as typeof selectedStatus)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedStatus === key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-black hover:text-black'
            }`}
          >
            {label}
            <span className="ml-1 text-xs">
              ({key === 'all' ? myErrands.length : myErrands.filter(e => e.status === key).length})
            </span>
          </button>
        ))}
      </div>

      {/* 심부름 목록 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black">심부름을 조회하고 있습니다...</p>
        </div>
      ) : filteredErrands.length === 0 ? (
        <div className="text-center py-12 text-black">
          <p className="text-black">
            {selectedStatus === 'all' 
              ? '등록한 심부름이 없습니다.' 
              : `${getStatusText(selectedStatus)} 상태의 심부름이 없습니다.`}
          </p>
          <p className="text-sm mt-1">새로운 심부름을 등록해보세요.</p>
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
                      <h4 className="font-medium text-black">{errand.title}</h4>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ml-2 ${getStatusColor(errand.status)}`}>
                    {getStatusText(errand.status)}
                  </span>
                </div>
                
                <p className="text-black text-sm mb-3">{errand.description}</p>
                
                {/* 수행자 정보 */}
                {errand.acceptedByUser && (
                  <div className="flex items-center gap-2 mb-3 p-2 bg-gray-50 rounded-md">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-300 relative">
                      <Image
                        src={errand.acceptedByUser.profileImage || getDefaultProfileImage(errand.acceptedByUser.name)}
                        alt={`${errand.acceptedByUser.name} 프로필`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm text-black">
                      수행자: {errand.acceptedByUser.name}
                    </span>
                  </div>
                )}
                
                <div className="space-y-2 text-xs text-black mb-3">
                  <div className="flex justify-between">
                    <span className={`px-2 py-1 rounded ${categoryInfo.color}`}>
                      {categoryInfo.emoji} {errand.category}
                    </span>
                    <span className="text-black">등록: {new Date(errand.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                  <div className="text-black">
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
                  {errand.status === 'accepted' && errand.acceptedByUser && (
                    <button 
                      onClick={() => handleChatOpen(errand)}
                      className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm"
                    >
                      채팅하기
                    </button>
                  )}
                  
                  {errand.status === 'in_progress' && (
                    <>
                      <button 
                        onClick={() => handleChatOpen(errand)}
                        className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm"
                      >
                        채팅하기
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(errand.id, 'completed')}
                        className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 text-sm"
                      >
                        완료 확인
                      </button>
                    </>
                  )}
                  
                  {errand.status === 'pending' && (
                    <button 
                      onClick={() => handleDeleteErrand(errand.id)}
                      className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600 text-sm"
                    >
                      삭제하기
                    </button>
                  )}
                  
                  {(errand.status === 'completed' || errand.status === 'disputed') && (
                    <button 
                      onClick={() => handleViewCompletedErrand(errand.id)}
                      className={`flex-1 text-white py-2 rounded text-sm ${
                        errand.status === 'completed' 
                          ? 'bg-green-500 hover:bg-green-600' 
                          : 'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      {errand.status === 'completed' ? '완료 확인하기' : '이의제기 확인하기'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 채팅 모달 */}
      {showChat && selectedErrandForChat && (
        <ChatModal
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          errandTitle={selectedErrandForChat.title}
          errandId={selectedErrandForChat.id}
          currentUserId={user.id}
        />
      )}

      {/* 완료된 심부름 상세보기 모달 */}
      {showCompletedErrandView && selectedCompletedErrandId && (
        <CompletedErrandView
          errandId={selectedCompletedErrandId}
          user={user}
          onClose={() => {
            setShowCompletedErrandView(false)
            setSelectedCompletedErrandId('')
            fetchMyErrands() // 목록 새로고침 (이의제기 상태 반영)
          }}
        />
      )}
    </div>
  )
}