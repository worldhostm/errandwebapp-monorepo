'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import AuthModal from './components/AuthModal'
import ErrandForm from './components/ErrandForm'
import ChatModal from './components/ChatModal'
import ProfileModal from './components/ProfileModal'
import UserTypeTabs, { UserType } from './components/UserTypeTabs'
import MyErrandHistory from './components/MyErrandHistory'
import MyAcceptedErrands from './components/MyAcceptedErrands'
import { getDefaultProfileImage } from './lib/imageUtils'
import { processErrands } from './lib/mapUtils'
import { getCategoryInfo } from './lib/categoryUtils'
import { authApi, errandApi } from './lib/api'
import { checkLocationPermission, requestLocationWithPermission } from './lib/locationUtils'
// 임시로 직접 임포트 (monorepo 설정이 완료되면 '@errandwebapp/shared'로 변경)
import { SAMPLE_ERRANDS } from '../../../packages/shared/src/data/sampleData'
import type { User, ErrandLocation, ErrandFormData } from './lib/types'
import { convertApiUserToUser } from './lib/types'

const MapComponent = dynamic(() => import('./components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-200 animate-pulse"></div>
})

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<UserType>('receiver')
  
  // 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      // JWT 토큰이 있으면 프로필 정보 가져오기
      authApi.getProfile().then(response => {
        if (response.success && response.data) {
          setUser(convertApiUserToUser(response.data.user))
        } else {
          // 토큰이 유효하지 않으면 제거
          localStorage.removeItem('authToken')
        }
      })
    }
    
    // 테스트 사용자도 확인 (개발용)
    const testUser = localStorage.getItem('testUser')
    if (testUser && !token) {
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
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false)
  
  // 백엔드 심부름 데이터를 ErrandLocation 형태로 변환
  const convertApiErrandToErrandLocation = (apiErrand: {
    _id?: string;
    id?: string;
    title: string;
    description: string;
    location: { coordinates: [number, number] };
    reward: number;
    status: string;
    category: string;
    deadline: string;
    createdAt: string;
    acceptedBy?: { _id: string } | string;
  }): ErrandLocation => {
    return {
      id: apiErrand._id || apiErrand.id || '',
      title: apiErrand.title,
      description: apiErrand.description,
      lat: apiErrand.location.coordinates[1], // latitude
      lng: apiErrand.location.coordinates[0], // longitude
      reward: apiErrand.reward,
      status: apiErrand.status as 'pending' | 'accepted' | 'in_progress' | 'completed',
      category: apiErrand.category,
      deadline: apiErrand.deadline,
      createdAt: apiErrand.createdAt,
      acceptedBy: typeof apiErrand.acceptedBy === 'object' && apiErrand.acceptedBy ? apiErrand.acceptedBy._id : apiErrand.acceptedBy as string | undefined
    }
  }

  // 샘플 심부름 데이터를 ErrandLocation 형태로 변환 (폴백용)
  const convertSampleErrandToErrandLocation = (sampleErrand: {
    id: string;
    title: string;
    description: string;
    location: { coordinates: [number, number] };
    reward: number;
    status: string;
    category: string;
    deadline?: Date;
    createdAt?: Date;
    acceptedBy?: string | { id: string };
  }): ErrandLocation => {
    return {
      id: sampleErrand.id,
      title: sampleErrand.title,
      description: sampleErrand.description,
      lat: sampleErrand.location.coordinates[1], // latitude
      lng: sampleErrand.location.coordinates[0], // longitude
      reward: sampleErrand.reward,
      status: sampleErrand.status as 'pending' | 'accepted' | 'in_progress' | 'completed',
      category: sampleErrand.category,
      deadline: sampleErrand.deadline?.toISOString() || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: sampleErrand.createdAt?.toISOString() || new Date().toISOString(),
      acceptedBy: typeof sampleErrand.acceptedBy === 'object' ? sampleErrand.acceptedBy.id : sampleErrand.acceptedBy
    }
  }

  const [allErrands, setAllErrands] = useState<ErrandLocation[]>([])
  const [isUsingApi, setIsUsingApi] = useState(false)
  const [filteredErrands, setFilteredErrands] = useState<ErrandLocation[]>([])

  // 위치 권한 확인 및 요청 함수
  const checkAndRequestLocation = async () => {
    const permission = await checkLocationPermission()
    
    if (permission === 'granted') {
      // 이미 권한이 허용되어 있으면 바로 위치 요청
      const result = await requestLocationWithPermission()
      if (result.success && result.location) {
        setUserLocation(result.location)
      } else {
        console.warn('위치 가져오기 실패, 기본 위치(서울시청)로 설정합니다.')
        setUserLocation({ lat: 37.5665, lng: 126.9780 })
      }
    } else if (permission === 'prompt' || permission === 'denied') {
      // 권한이 필요하면 팝업 표시
      setShowLocationPermissionModal(true)
    } else {
      // 위치 서비스 미지원
      console.warn('이 브라우저는 위치 서비스를 지원하지 않습니다. 기본 위치(서울시청)로 설정합니다.')
      setUserLocation({ lat: 37.5665, lng: 126.9780 })
    }
  }

  // 사용자 위치 가져오기
  useEffect(() => {
    checkAndRequestLocation()
  }, [])


  // 현재 위치 기반 심부름 조회 함수
  const fetchErrandsAroundUserLocation = useCallback(async () => {
    if (!userLocation) return
    
    setIsLoadingErrands(true)
    
    try {
      // 현재 위치 중심으로 10km 범위에서 조회
      const response = await errandApi.getNearbyErrands(userLocation.lng, userLocation.lat, 10000, 'pending')
      
      if (response.success && response.data) {
        let apiErrands = response.data.errands.map(convertApiErrandToErrandLocation)
        
        // 10km 내에 심부름이 없으면 30km로 확장하여 재시도
        if (apiErrands.length === 0) {
          console.log('현재 위치 10km 내에 심부름이 없어 30km로 확장하여 재조회합니다.')
          const expandedResponse = await errandApi.getNearbyErrands(userLocation.lng, userLocation.lat, 30000, 'pending')
          
          if (expandedResponse.success && expandedResponse.data) {
            apiErrands = expandedResponse.data.errands.map(convertApiErrandToErrandLocation)
            console.log(`현재 위치 30km 확장 조회에서 ${apiErrands.length}개 심부름 발견`)
          }
        }
        
        // 거리별로 정렬
        const processed = processErrands(apiErrands, userLocation.lat, userLocation.lng, 30)
        setFilteredErrands(processed)
        
        setIsUsingApi(true)
        console.log(`현재 위치 기준 API에서 총 ${apiErrands.length}개 심부름 조회됨`)
      } else {
        throw new Error(response.error || 'API 호출 실패')
      }
    } catch (error) {
      console.warn('현재 위치 기반 API 호출 실패, 샘플 데이터 사용:', error)
      
      // API 호출 실패시 샘플 데이터 사용
      if (allErrands.length === 0) {
        const sampleErrands = SAMPLE_ERRANDS.map(convertSampleErrandToErrandLocation)
        setAllErrands(sampleErrands)
      }
      
      // 사용자 위치 기준으로 샘플 데이터 필터링
      const processed = processErrands(allErrands, userLocation.lat, userLocation.lng, 30)
      setFilteredErrands(processed)
      
      setIsUsingApi(false)
      console.log(`현재 위치 기준 샘플 데이터에서 ${processed.length}개 심부름 조회됨`)
    }
    
    setIsLoadingErrands(false)
  }, [userLocation, allErrands])

  // 지도 이동 시 호출되는 핸들러 (현재 위치 기준으로만 조회하므로 지도 이동으로는 심부름 조회하지 않음)
  const handleMapMove = (center: { lat: number; lng: number }, bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => {
    setCurrentMapBounds(bounds)
    // 지도 이동으로는 심부름을 새로 조회하지 않음
  }

  // 사용자 위치 변경 시 심부름 조회
  useEffect(() => {
    if (userLocation) {
      fetchErrandsAroundUserLocation()
    }
  }, [userLocation, fetchErrandsAroundUserLocation])

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password)
      
      if (response.success && response.data) {
        // JWT 토큰 저장
        localStorage.setItem('authToken', response.data.token)
        setUser(convertApiUserToUser(response.data.user))
        setShowAuthModal(false)
        console.log('로그인 성공:', response.data.user)
      } else {
        alert(response.error || '로그인에 실패했습니다.')
      }
    } catch (error) {
      console.error('로그인 오류:', error)
      alert('로그인 중 오류가 발생했습니다.')
    }
  }

  const handleRegister = async (email: string, password: string, name: string, profileImage?: string) => {
    try {
      const response = await authApi.register(email, password, name)
      
      if (response.success && response.data) {
        // JWT 토큰 저장
        localStorage.setItem('authToken', response.data.token)
        
        // 프로필 이미지가 있으면 업데이트
        let user = convertApiUserToUser(response.data.user)
        if (profileImage) {
          const updateResponse = await authApi.updateProfile({ profileImage })
          if (updateResponse.success && updateResponse.data) {
            user = convertApiUserToUser(updateResponse.data.user)
          }
        }
        
        setUser(user)
        setShowAuthModal(false)
        console.log('회원가입 성공:', user)
      } else {
        alert(response.error || '회원가입에 실패했습니다.')
      }
    } catch (error) {
      console.error('회원가입 오류:', error)
      alert('회원가입 중 오류가 발생했습니다.')
    }
  }

  const handleUpdateProfile = async (updatedUser: User) => {
    try {
      const token = localStorage.getItem('authToken')
      
      if (token) {
        // JWT 토큰이 있으면 서버에 업데이트
        const response = await authApi.updateProfile(updatedUser)
        
        if (response.success && response.data) {
          setUser(convertApiUserToUser(response.data.user))
          console.log('프로필 업데이트 성공:', response.data.user)
        } else {
          alert(response.error || '프로필 업데이트에 실패했습니다.')
          return
        }
      } else {
        // 테스트 사용자인 경우 로컬에만 저장
        setUser(updatedUser)
        const testUser = localStorage.getItem('testUser')
        if (testUser) {
          localStorage.setItem('testUser', JSON.stringify(updatedUser))
        }
      }
    } catch (error) {
      console.error('프로필 업데이트 오류:', error)
      alert('프로필 업데이트 중 오류가 발생했습니다.')
    }
  }

  const handleLogout = () => {
    setUser(null)
    // JWT 토큰과 테스트 사용자 데이터 삭제
    localStorage.removeItem('authToken')
    localStorage.removeItem('testUser')
  }

  const handleErrandSubmit = async (formData: ErrandFormData) => {
    if (!formData.lat || !formData.lng) {
      alert('위치를 선택해주세요.')
      return
    }
    
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
    
    try {
      const errandData = {
        title: formData.title,
        description: formData.description,
        location: {
          type: 'Point' as const,
          coordinates: [formData.lng as number, formData.lat as number] as [number, number], // [longitude, latitude]
          address: formData.address || '주소 정보 없음' // 주소 정보 추가
        },
        reward: formData.reward,
        category: formData.category,
        deadline: formData.deadline
      }
      
      console.log('API 전송할 errandData:', errandData)
      console.log('실제 좌표값:', {
        latitude: formData.lat,
        longitude: formData.lng,
        coordinates: [formData.lng as number, formData.lat as number]
      })
      
      const response = await errandApi.createErrand(errandData);
      
      if (response.success && response.data) {
        setShowErrandForm(false)
        alert('심부름이 성공적으로 등록되었습니다!')
        
        // 새로 등록된 심부름을 보이기 위해 현재 위치 기준 조회 새로고침
        fetchErrandsAroundUserLocation()
        
        console.log('새 심부름 등록 성공:', response.data.errand)
      } else {
        alert(response.error || '심부름 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('심부름 등록 오류:', error)
      alert('심부름 등록 중 오류가 발생했습니다.')
    }
  }

  const handleChatOpen = (errand: ErrandLocation) => {
    setSelectedErrandForChat(errand)
    setShowChat(true)
  }

  const handleErrandAccept = async (errandId: string) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }
    
    try {
      const response = await errandApi.acceptErrand(errandId)
      
      if (response.success && response.data) {
        alert('심부름을 수락했습니다!')
        
        // 심부름 리스트 새로고침
        fetchErrandsAroundUserLocation()
        
        // 내 수행 심부름 탭으로 자동 이동
        setActiveTab('performer')
        
        console.log(`심부름 ${errandId} 수락 성공:`, response.data.errand)
      } else {
        alert(response.error || '심부름 수락에 실패했습니다.')
      }
    } catch (error) {
      console.error('심부름 수락 오류:', error)
      alert('심부름 수락 중 오류가 발생했습니다.')
    }
  }

  const handleErrandComplete = async (errandId: string) => {
    if (!user) return
    
    try {
      const response = await errandApi.updateErrandStatus(errandId, 'completed')
      
      if (response.success && response.data) {
        alert('심부름이 완료되었습니다!')
        
        // 심부름 리스트 새로고침
        fetchErrandsAroundUserLocation()
        
        console.log(`심부름 ${errandId} 완료 성공:`, response.data.errand)
      } else {
        alert(response.error || '심부름 완료 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('심부름 완료 오류:', error)
      alert('심부름 완료 처리 중 오류가 발생했습니다.')
    }
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
                      <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-300 relative">
                        <Image
                          src={user.profileImage || (typeof window !== 'undefined' ? getDefaultProfileImage(user.name) : '')}
                          alt={`${user.name} 프로필`}
                          fill
                          className="object-cover"
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

      {user && (
        <UserTypeTabs 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          // 로그인하지 않은 사용자용 기본 콘텐츠
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              심부름 플랫폼에 오신 것을 환영합니다
            </h2>
            <p className="text-gray-600 mb-8">
              로그인하여 주변 심부름을 찾거나 새로운 심부름을 등록해보세요
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 text-lg"
            >
              시작하기
            </button>
          </div>
        ) : activeTab === 'receiver' ? (
          // 심부름 받는 사람 탭 (기존 메인 콘텐츠)
          <>
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
                    {isUsingApi && <span className="ml-2 text-green-600 text-xs">• API 연동</span>}
                    {!isUsingApi && allErrands.length > 0 && <span className="ml-2 text-orange-600 text-xs">• 샘플 데이터</span>}
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  현재 위치 주변 심부름 목록
                  <span className="text-sm font-normal text-gray-500">
                    (거리순 정렬)
                  </span>
                  {isLoadingErrands && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </h3>
                <button
                  onClick={fetchErrandsAroundUserLocation}
                  disabled={isLoadingErrands}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:cursor-not-allowed"
                >
                  <span>🔄</span>
                  새로고침
                </button>
              </div>
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
                    현재 위치 주변 30km 내에 심부름이 없습니다.
                  </p>
                  <p className="text-sm mt-1">잠시 후 다시 확인해보시거나 심부름을 새로 등록해보세요.</p>
                </div>
              )}
              
              {isLoadingErrands && filteredErrands.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">심부름을 조회하고 있습니다...</p>
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'performer' ? (
          // 내가 수행하는 심부름 탭
          <MyAcceptedErrands user={user} />
        ) : (
          // 심부름 시키는 사람 탭 (내 심부름 이력)
          <MyErrandHistory user={user} />
        )}
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

      {/* 위치 권한 확인 모달 */}
      {showLocationPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">위치 권한 요청</h2>
            <p className="text-gray-600 mb-4">
              근처 심부름을 찾기 위해 현재 위치가 필요합니다.
              위치 권한을 허용하시겠습니까?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  setShowLocationPermissionModal(false)
                  const result = await requestLocationWithPermission()
                  if (result.success && result.location) {
                    setUserLocation(result.location)
                  } else {
                    console.warn('위치 가져오기 실패, 기본 위치(서울시청)로 설정합니다.')
                    setUserLocation({ lat: 37.5665, lng: 126.9780 })
                  }
                }}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                허용
              </button>
              <button
                onClick={() => {
                  setShowLocationPermissionModal(false)
                  console.log('사용자가 위치 권한을 거부했습니다. 기본 위치(서울시청)로 설정합니다.')
                  setUserLocation({ lat: 37.5665, lng: 126.9780 })
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                거부
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
