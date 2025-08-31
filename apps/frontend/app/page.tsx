'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import AuthModal from './components/AuthModal'
import ErrandForm from './components/ErrandForm'
import ChatModal from './components/ChatModal'
import ProfileModal from './components/ProfileModal'
import { getDefaultProfileImage } from './lib/imageUtils'
import { processErrands, calculateDistance } from './lib/mapUtils'
import { getCategoryInfo } from './lib/categoryUtils'
// 임시로 직접 임포트 (monorepo 설정이 완료되면 '@errandwebapp/shared'로 변경)
import { SAMPLE_ERRANDS, SAMPLE_USERS, SEOUL_LOCATIONS, DONGTAN2_LOCATIONS } from '../../../packages/shared/src/data/sampleData'
import type { User, ErrandLocation, ErrandFormData } from './lib/types'

const MapComponent = dynamic(() => import('./components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-200 animate-pulse"></div>
})

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  
  // 테스트 사용자 로그인 상태 확인
  useEffect(() => {
    const testUser = localStorage.getItem('testUser')
    if (testUser) {
      setUser(JSON.parse(testUser))
    }
  }, [])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showErrandForm, setShowErrandForm] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedErrandForChat, setSelectedErrandForChat] = useState<ErrandLocation | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapRadius, setMapRadius] = useState(10) // 기본 10km 반경
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedErrandId, setSelectedErrandId] = useState<string | null>(null)
  const [currentMapBounds, setCurrentMapBounds] = useState<{ sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } | null>(null)
  const [isLoadingErrands, setIsLoadingErrands] = useState(false)
  
  // 샘플 심부름 데이터를 ErrandLocation 형태로 변환
  const convertSampleErrandToErrandLocation = (sampleErrand: any): ErrandLocation => {
    return {
      id: sampleErrand.id,
      title: sampleErrand.title,
      description: sampleErrand.description,
      lat: sampleErrand.location.coordinates[1], // latitude
      lng: sampleErrand.location.coordinates[0], // longitude
      reward: sampleErrand.reward,
      status: sampleErrand.status,
      category: sampleErrand.category,
      deadline: sampleErrand.deadline?.toISOString() || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: sampleErrand.createdAt?.toISOString() || new Date().toISOString(),
      acceptedBy: sampleErrand.acceptedBy
    }
  }

  const [allErrands] = useState<ErrandLocation[]>(
    SAMPLE_ERRANDS.map(convertSampleErrandToErrandLocation)
  )
  const [filteredErrands, setFilteredErrands] = useState<ErrandLocation[]>([])

  // 사용자 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          setUserLocation({ lat: 37.5665, lng: 126.9780 }) // 기본값: 서울시청
        }
      )
    } else {
      setUserLocation({ lat: 37.5665, lng: 126.9780 })
    }
  }, [])

  // 위치 기반 심부름 조회 함수
  const fetchErrandsInBounds = (bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => {
    setIsLoadingErrands(true)
    
    // 실제 환경에서는 서버 API 호출
    // const response = await fetch(`/api/errands?swLat=${bounds.sw.lat}&swLng=${bounds.sw.lng}&neLat=${bounds.ne.lat}&neLng=${bounds.ne.lng}`)
    
    // 지금은 샘플 데이터에서 영역 내 심부름 필터링
    setTimeout(() => {
      const errandsInBounds = allErrands.filter(errand => 
        errand.lat >= bounds.sw.lat && 
        errand.lat <= bounds.ne.lat &&
        errand.lng >= bounds.sw.lng && 
        errand.lng <= bounds.ne.lng
      )

      // 사용자 위치가 있으면 거리별로 정렬
      if (userLocation) {
        const processed = processErrands(errandsInBounds, userLocation.lat, userLocation.lng, mapRadius)
        setFilteredErrands(processed)
      } else {
        setFilteredErrands(errandsInBounds)
      }
      
      setIsLoadingErrands(false)
      console.log(`지도 영역 내 ${errandsInBounds.length}개 심부름 조회됨`)
    }, 300) // 로딩 효과를 위한 지연
  }

  // 지도 이동 시 호출되는 핸들러
  const handleMapMove = (center: { lat: number; lng: number }, bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => {
    setCurrentMapBounds(bounds)
    fetchErrandsInBounds(bounds)
  }

  // 초기 로딩: 사용자 위치 기반 심부름 필터링
  useEffect(() => {
    if (userLocation && !currentMapBounds) {
      // 사용자 위치 중심으로 초기 필터링
      const processed = processErrands(allErrands, userLocation.lat, userLocation.lng, mapRadius)
      setFilteredErrands(processed)
    }
  }, [allErrands, userLocation, mapRadius, currentMapBounds])

  const handleLogin = (email: string, password: string) => {
    setUser({ id: '1', name: '홍길동', email })
    setShowAuthModal(false)
    console.log('로그인:', { email, password })
  }

  const handleRegister = (email: string, password: string, name: string, profileImage?: string) => {
    const newUser: User = { 
      id: '1', 
      name, 
      email,
      profileImage 
    }
    setUser(newUser)
    setShowAuthModal(false)
    console.log('회원가입:', { email, password, name, profileImage })
  }

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser)
    // localStorage에도 업데이트 (테스트 사용자인 경우)
    const testUser = localStorage.getItem('testUser')
    if (testUser) {
      localStorage.setItem('testUser', JSON.stringify(updatedUser))
    }
    console.log('프로필 업데이트:', updatedUser)
  }

  const handleLogout = () => {
    setUser(null)
    // 테스트 사용자 데이터도 삭제
    localStorage.removeItem('testUser')
  }

  const handleErrandSubmit = (formData: ErrandFormData) => {
    if (!formData.lat || !formData.lng) {
      alert('위치를 선택해주세요.')
      return
    }
    const newErrand: ErrandLocation = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      lat: formData.lat,
      lng: formData.lng,
      reward: formData.reward,
      status: 'pending',
      category: formData.category,
      deadline: formData.deadline,
      createdAt: new Date().toISOString()
    }
    // 실제로는 서버 API 호출하여 등록
    setShowErrandForm(false)
    console.log('새 심부름 등록:', newErrand)
  }

  const handleChatOpen = (errand: ErrandLocation) => {
    setSelectedErrandForChat(errand)
    setShowChat(true)
  }

  const handleErrandAccept = (errandId: string) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
    // 실제로는 서버 API 호출
    console.log(`심부름 ${errandId} 수락됨 by ${user.id}`)
    alert('심부름을 수락했습니다!')
  }

  const handleErrandComplete = (errandId: string) => {
    if (!user) return
    // 실제로는 서버 API 호출
    console.log(`심부름 ${errandId} 완료됨 by ${user.id}`)
    alert('심부름이 완료되었습니다!')
  }

  const handleMapRadiusChange = (newRadius: number) => {
    setMapRadius(newRadius)
  }

  const handleErrandCardClick = (errand: ErrandLocation) => {
    // 지도 중심을 심부름 위치로 이동
    setMapCenter({ lat: errand.lat, lng: errand.lng })
    
    // 선택된 심부름 ID 설정 (애니메이션을 위해)
    setSelectedErrandId(errand.id)
    
    // 스크롤을 지도 위치로 이동
    const mapElement = document.querySelector('#map-container')
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    
    // 애니메이션이 끝나면 선택 상태 초기화
    setTimeout(() => {
      setSelectedErrandId(null)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">심부름</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <button
                    onClick={() => setShowErrandForm(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    심부름 등록
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowProfile(true)}
                      className="flex items-center gap-2 hover:bg-gray-50 px-2 py-1 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300">
                        <img
                          src={user.profileImage || (typeof window !== 'undefined' ? getDefaultProfileImage(user.name) : '')}
                          alt={`${user.name} 프로필`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-gray-700">{user.name}님</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      로그아웃
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    로그인
                  </button>
                  <a
                    href="/test"
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
                  >
                    테스트 로그인
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              주변 심부름 찾기
            </h2>
            <p className="text-gray-600">
              지도를 움직여서 다른 지역의 심부름을 확인해보세요
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              {isLoadingErrands && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              <p className="text-sm text-gray-500">
                {currentMapBounds ? '지도 영역 내' : `반경 ${mapRadius.toFixed(1)}km 내`} 
                <span className="ml-1 font-semibold text-blue-600">{filteredErrands.length}개</span> 심부름
              </p>
            </div>
          </div>
        </div>

        <div id="map-container" className="bg-white rounded-lg shadow-sm overflow-hidden relative">
          {isLoadingErrands && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg z-20 flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600">심부름 조회 중...</span>
            </div>
          )}
          <MapComponent 
            errands={filteredErrands} 
            currentUser={user} 
            onRadiusChange={handleMapRadiusChange}
            userLocation={userLocation}
            centerLocation={mapCenter}
            selectedErrandId={selectedErrandId}
            onMapMove={handleMapMove}
          />
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            {currentMapBounds ? '지도 영역 내' : '주변'} 심부름 목록 
            <span className="text-sm font-normal text-gray-500">
              {userLocation && !currentMapBounds ? '(거리순 정렬)' : ''}
            </span>
            {isLoadingErrands && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredErrands.map((errand) => {
              const categoryInfo = getCategoryInfo(errand.category)
              return (
                <div 
                  key={errand.id} 
                  className={`bg-white p-4 rounded-lg shadow-sm border-2 cursor-pointer hover:shadow-md transition-shadow ${
                    errand.isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleErrandCardClick(errand)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{categoryInfo.emoji}</span>
                        <h4 className="font-medium text-gray-900">{errand.title}</h4>
                      </div>
                      {errand.isUrgent && (
                        <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                          🚨 마감임박
                        </span>
                      )}
                    </div>
                  <span className={`px-2 py-1 rounded text-xs ml-2 ${
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
                
                <p className="text-gray-600 text-sm mb-3">{errand.description}</p>
                
                <div className="space-y-2 text-xs text-gray-500 mb-3">
                  <div className="flex justify-between">
                    <span>거리: {errand.distance?.toFixed(1)}km</span>
                    <span className={`px-2 py-1 rounded ${categoryInfo.color}`}>
                      {categoryInfo.emoji} {errand.category}
                    </span>
                  </div>
                  <div className={`${errand.isUrgent ? 'text-red-600 font-medium' : ''}`}>
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

                {/* 버튼 영역 */}
                {errand.status === 'pending' && user && (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleErrandAccept(errand.id)}
                      className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 text-sm"
                    >
                      수락하기
                    </button>
                    <button 
                      onClick={() => handleChatOpen(errand)}
                      className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 text-sm"
                    >
                      채팅하기
                    </button>
                  </div>
                )}

                {errand.status === 'accepted' && user && errand.acceptedBy === user.id && (
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleErrandComplete(errand.id)}
                      className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 text-sm"
                    >
                      완료하기
                    </button>
                    <button 
                      onClick={() => handleChatOpen(errand)}
                      className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600 text-sm"
                    >
                      채팅하기
                    </button>
                  </div>
                )}

                {(errand.status === 'in_progress' || errand.status === 'completed') && (
                  <div className="text-center py-2 text-sm text-gray-500">
                    {errand.status === 'in_progress' ? '진행 중인 심부름입니다' : '완료된 심부름입니다'}
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  클릭하면 지도에서 위치를 확인할 수 있습니다 📍
                </div>
              </div>
            )})}
          </div>
          
          {filteredErrands.length === 0 && !isLoadingErrands && (
            <div className="text-center py-12 text-gray-500">
              <p>
                {currentMapBounds ? '현재 지도 영역' : `주변 ${mapRadius.toFixed(1)}km 내`}에 심부름이 없습니다.
              </p>
              <p className="text-sm mt-1">지도를 이동하거나 확대/축소하여 다른 지역을 확인해보세요.</p>
            </div>
          )}
          
          {isLoadingErrands && filteredErrands.length === 0 && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">심부름을 조회하고 있습니다...</p>
            </div>
          )}
        </div>
      </main>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      {showErrandForm && (
        <ErrandForm
          onSubmit={handleErrandSubmit}
          onCancel={() => setShowErrandForm(false)}
        />
      )}

      {showChat && selectedErrandForChat && user && (
        <ChatModal
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          errandTitle={selectedErrandForChat.title}
          otherUser={{ id: 'other-user', name: '김사용자' }}
          currentUserId={user.id}
        />
      )}

      {showProfile && user && (
        <ProfileModal
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
          user={user}
          onUpdateProfile={handleUpdateProfile}
        />
      )}
    </div>
  )
}
