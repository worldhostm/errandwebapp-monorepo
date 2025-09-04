'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import AuthModal from './components/AuthModal'
import ErrandForm from './components/ErrandForm'
import ChatModal from './components/ChatModal'
import ProfileModal from './components/ProfileModal'
import ErrandDetailModal from './components/ErrandDetailModal'
import UserTypeTabs, { UserType } from './components/UserTypeTabs'
import MyErrandHistory from './components/MyErrandHistory'
import MyAcceptedErrands from './components/MyAcceptedErrands'
import JsonLd, { organizationSchema, serviceSchema, webApplicationSchema } from '../components/JsonLd'
import { getDefaultProfileImage } from './lib/imageUtils'
import { processErrands } from './lib/mapUtils'
import { getCategoryInfo } from './lib/categoryUtils'
import { authApi, errandApi } from './lib/api'
import { checkLocationPermission, requestLocationWithPermission } from './lib/locationUtils'
// 임시로 직접 임포트 (monorepo 설정이 완료되면 '@errandwebapp/shared'로 변경)
import type { ErrandLocation, ErrandFormData } from './lib/types'
import { convertErrandToErrandLocation, User } from './lib/types'
import { errandCache } from './lib/errandCache'

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
          setUser(response.data.user)
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
  const [showErrandDetail, setShowErrandDetail] = useState(false)
  const [selectedErrandForDetail, setSelectedErrandForDetail] = useState<ErrandLocation | null>(null)
  const [selectedErrandForChat, setSelectedErrandForChat] = useState<ErrandLocation | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapRadius, setMapRadius] = useState(10) // 기본 10km 반경
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedErrandId, setSelectedErrandId] = useState<string | null>(null)
  const [currentMapBounds, setCurrentMapBounds] = useState<{ sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } | null>(null)
  const [isLoadingErrands, setIsLoadingErrands] = useState(false)
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false)
  
  // 위도/경도 입력으로 마커 테스트용 상태
  const [testLatInput, setTestLatInput] = useState('')
  const [testLngInput, setTestLngInput] = useState('')
  const [testMarker, setTestMarker] = useState<{ lat: number; lng: number } | null>(null)
  

  // 샘플 심부름 데이터를 ErrandLocation 형태로 변환 (폴백용)
  // const convertSampleErrandToErrandLocation = (sampleErrand: {
  //   id: string;
  //   title: string;
  //   description: string;
  //   location: { coordinates: [number, number] };
  //   reward: number;
  //   status: string;
  //   category: string;
  //   deadline?: Date;
  //   createdAt?: Date;
  //   acceptedBy?: string | { id: string };
  // }): ErrandLocation => {
  //   return {
  //     id: sampleErrand.id,
  //     title: sampleErrand.title,
  //     description: sampleErrand.description,
  //     lat: sampleErrand.location.coordinates[1], // latitude
  //     lng: sampleErrand.location.coordinates[0], // longitude
  //     reward: sampleErrand.reward,
  //     status: sampleErrand.status as 'pending' | 'accepted' | 'in_progress' | 'completed',
  //     category: sampleErrand.category,
  //     deadline: sampleErrand.deadline?.toISOString() || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  //     createdAt: sampleErrand.createdAt?.toISOString() || new Date().toISOString(),
  //     acceptedBy: typeof sampleErrand.acceptedBy === 'object' ? sampleErrand.acceptedBy.id : sampleErrand.acceptedBy
  //   }
  // }

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
        console.warn('위치 가져오기 실패, 기본 위치(청계동 근처)로 설정합니다.')
        setUserLocation({ lat: 37.1982115590239, lng: 127.118473726893 })
      }
    } else if (permission === 'prompt' || permission === 'denied') {
      // 권한이 필요하면 팝업 표시
      setShowLocationPermissionModal(true)
    } else {
      // 위치 서비스 미지원
      console.warn('이 브라우저는 위치 서비스를 지원하지 않습니다. 기본 위치(청계동 근처)로 설정합니다.')
      setUserLocation({ lat: 37.1982115590239, lng: 127.118473726893 })
    }
  }

  // 사용자 위치 가져오기
  useEffect(() => {
    checkAndRequestLocation()
  }, [])


  // 통합된 심부름 조회 함수 (bounds 직접 전달 옵션 추가)
  const fetchErrandsAtLocation = useCallback(async (
    lat: number, 
    lng: number, 
    description = '위치',
    overrideBounds?: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } | null
  ) => {
    console.log(`🔍 ${description} 기준 심부름 조회 시작:`, { lat, lng })
    setIsLoadingErrands(true)
    
    try {
      const center = { lat, lng }
      // overrideBounds가 있으면 우선 사용, 없으면 currentMapBounds 사용
      const bounds = overrideBounds !== undefined ? overrideBounds : currentMapBounds
      
      console.log(`🔍 fetchErrandsAtLocation - currentMapBounds:`, currentMapBounds)
      console.log(`🔍 fetchErrandsAtLocation - overrideBounds:`, overrideBounds)
      console.log(`🔍 fetchErrandsAtLocation - 최종 bounds:`, bounds)
      
      // 캐시에서 먼저 확인 (bounds가 있을 때만)
      if (bounds) {
        const cachedData = errandCache.get(center, bounds, 100000)
        if (cachedData) {
          console.log(`🎯 캐시에서 ${cachedData.length}개 심부름 조회`)
          setFilteredErrands(cachedData)
          setIsUsingApi(true)
          setIsLoadingErrands(false)
          return
        }
      }

      // 캐시 미스 시 API 호출 - bounds 우선 사용
      let apiCall
      if (bounds) {
        console.log(`📡 Bounds API 호출 (반경 제한 없음): errandApi.getNearbyErrands with bounds`)
        // bounds가 있으면 반경을 크게 잡아서 bounds 내의 모든 심부름을 가져옴
        apiCall = errandApi.getNearbyErrands(lng, lat, 100000, 'pending', undefined, bounds)
      } else {
        console.log(`📡 반경 API 호출: errandApi.getNearbyErrands(${lng}, ${lat}, 10000, 'pending')`)
        apiCall = errandApi.getNearbyErrands(lng, lat, 10000, 'pending')
      }
      
      const response = await apiCall
      console.log(`📡 API 응답:`, response)
      
      if (response.success && response.data) {
        const apiErrands = response.data.errands.map((errand) => convertErrandToErrandLocation(errand as unknown as Record<string, unknown>))
        console.log(`📍 ${description} 조회 결과:`, apiErrands.length, '개', apiErrands)
        
        // 거리별로 정렬 (반경 제한 없이)
        const processed = processErrands(apiErrands, lat, lng, 1000) // 충분히 큰 값으로 설정
        console.log(`🔄 processErrands 결과:`, processed.length, '개', processed)
                    
        // bounds 기반 필터링 (API 서버 필터링이 실패했을 경우를 위한 이중 보안)
        let finalErrands = processed
        const usedBounds = bounds || currentMapBounds
        
        console.log(`🔍 필터링 조건 체크:`)
        console.log(`  - currentMapBounds:`, currentMapBounds)
        console.log(`  - bounds:`, bounds)
        console.log(`  - usedBounds:`, usedBounds)
        
        if (usedBounds) {
          console.log(`📍 클라이언트 bounds 필터링 시작: ${processed.length}개 심부름`)
          console.log(`📍 Bounds: SW(${usedBounds.sw.lat}, ${usedBounds.sw.lng}) - NE(${usedBounds.ne.lat}, ${usedBounds.ne.lng})`)
          
          finalErrands = processed.filter(errand => {
            const inBounds = errand.lat >= usedBounds.sw.lat && 
                           errand.lat <= usedBounds.ne.lat &&
                           errand.lng >= usedBounds.sw.lng && 
                           errand.lng <= usedBounds.ne.lng
                           
            console.log(`📍 심부름 "${errand.title}" (${errand.lat}, ${errand.lng}): ${inBounds ? '✅ 포함' : '❌ 제외'}`)
            return inBounds
          })
          console.log(`📍 클라이언트 bounds 필터링: ${processed.length}개 → ${finalErrands.length}개`)
        } else {
          console.log(`📍 bounds가 없어 필터링 건너뜀`)
        }
        
        // 캐시에 저장 (bounds가 있을 때만)
        if (currentMapBounds) {
          errandCache.set(center, currentMapBounds, 100000, finalErrands)
        }
        
        // 결과가 있든 없든 항상 설정 (빈 배열이어도 설정)
        setFilteredErrands(finalErrands)
        setIsUsingApi(true)
        console.log(`✅ ${description} 기준 총 ${finalErrands.length}개 심부름 조회 완료`)
      } else {
        console.error(`❌ API 응답 실패:`, response)
        // API 응답 실패 시에도 빈 배열로 초기화
        setFilteredErrands([])
        setIsUsingApi(false)
      }
    } catch (error) {
      console.error(`❌ ${description} 기반 API 호출 실패:`, error)
      setIsUsingApi(false)
      // API 실패 시 빈 배열로 설정
      setFilteredErrands([])
    }
    
    setIsLoadingErrands(false)
  }, [currentMapBounds])

  // 지도 이동 시 호출되는 핸들러 - 새 위치 기준으로 심부름 조회
  const handleMapMove = async (center: { lat: number; lng: number }, bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => {
    console.log('🗺️ handleMapMove 호출됨 - 중심:', center)
    console.log('🗺️ handleMapMove - bounds:', bounds)
    setCurrentMapBounds(bounds)
    
    // fetchErrandsAtLocation 함수를 재사용하여 중복 제거 (bounds 직접 전달)
    await fetchErrandsAtLocation(center.lat, center.lng, '지도 이동', bounds)
    
    console.log('🏁 handleMapMove 완료')
  }

  // 사용자 위치 기준 심부름 조회 함수
  const fetchErrandsAroundUserLocation = useCallback(() => {
    if (!userLocation) return
    fetchErrandsAtLocation(userLocation.lat, userLocation.lng, '사용자 위치')
  }, [userLocation, fetchErrandsAtLocation])

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
        setUser(response.data.user)
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
        let user = response.data.user
        if (profileImage) {
          const updateResponse = await authApi.updateProfile({ avatar: profileImage })
          if (updateResponse.success && updateResponse.data) {
            user = updateResponse.data.user
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
          setUser(response.data.user)
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
        deadline: formData.deadline ? new Date(formData.deadline) : undefined
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
        
        // 등록된 심부름 위치로 지도 이동
        const errandLocation = { lat: formData.lat!, lng: formData.lng! }
        setMapCenter(errandLocation)
        
        // 새로 등록된 심부름을 선택된 상태로 표시 (애니메이션 효과)
        if (response.data.errand && response.data.errand.id) {
          setSelectedErrandId(response.data.errand.id)
          
          // 지도로 스크롤 이동
          const mapElement = document.querySelector('#map-container')
          if (mapElement) {
            mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
          
          // 3초 후 선택 상태 해제
          setTimeout(() => {
            setSelectedErrandId(null)
          }, 3000)
        }
        
        // 새로 등록된 심부름을 보이기 위해 해당 위치 기준 조회
        // 캐시 무효화 (새 심부름 위치 주변 10km)
        errandCache.invalidateRegion(errandLocation, 10)
        
        // 등록된 위치 기준으로 심부름 조회 (사용자 위치 대신)
        fetchErrandsAtLocation(errandLocation.lat, errandLocation.lng, '새 심부름 등록 위치')
        
        console.log('새 심부름 등록 성공:', response.data.errand)
      } else {
        console.error('심부름 등록 실패 응답:', response)
        alert(response.error || '심부름 등록에 실패했습니다.')
      }
    } catch (error) {
      console.error('심부름 등록 오류:', error)
      alert('심부름 등록 중 오류가 발생했습니다: ' + (error as Error).message)
    }
  }

  const handleChatOpen = (errand: ErrandLocation) => {
    setSelectedErrandForChat(errand)
    setShowChat(true)
  }

  const handleErrandDetailOpen = (errand: ErrandLocation) => {
    console.log('handleErrandDetailOpen 호출됨:', errand.title)
    setSelectedErrandForDetail(errand)
    setShowErrandDetail(true)
    console.log('모달 상태 설정 완료')
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
        
        // 잠시 후 내 수행 심부름 탭으로 자동 이동 (백엔드 업데이트 시간 확보)
        setTimeout(() => {
          setActiveTab('performer')
        }, 500)
        
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

  const handleMoveToCurrentLocation = () => {
    if (userLocation) {
      console.log('🎯 현재 위치로 지도 이동:', userLocation)
      setMapCenter({ lat: userLocation.lat, lng: userLocation.lng })
      
      // 스크롤을 지도 위치로 이동
      const mapElement = document.querySelector('#map-container')
      if (mapElement) {
        mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    } else {
      alert('현재 위치 정보를 찾을 수 없습니다.')
    }
  }

  const handleTestLocationSubmit = () => {
    // 텍스트 입력값을 정리하고 숫자로 변환
    const latText = testLatInput.trim()
    const lngText = testLngInput.trim()
    
    // 빈 값 체크
    if (!latText || !lngText) {
      alert('위도와 경도를 모두 입력해주세요.')
      return
    }
    
    // 숫자로 변환
    const lat = parseFloat(latText)
    const lng = parseFloat(lngText)
    
    // 숫자 변환 실패 체크
    if (isNaN(lat) || isNaN(lng)) {
      alert('올바른 숫자 형식의 위도와 경도를 입력해주세요.\n예: 37.1946, 127.1013')
      return
    }
    
    // 범위 체크
    if (lat < -90 || lat > 90) {
      alert(`위도는 -90 ~ 90 사이의 값이어야 합니다.\n입력된 값: ${lat}`)
      return
    }
    
    if (lng < -180 || lng > 180) {
      alert(`경도는 -180 ~ 180 사이의 값이어야 합니다.\n입력된 값: ${lng}`)
      return
    }
    
    // 테스트 마커 설정 및 지도 이동
    const testLocation = { lat, lng }
    setTestMarker(testLocation)
    setMapCenter(testLocation)
    
    // 스크롤을 지도 위치로 이동
    const mapElement = document.querySelector('#map-container')
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    
    console.log('🎯 테스트 위치로 이동:', testLocation)
    console.log(`📍 변환된 좌표 - 위도: ${lat}, 경도: ${lng}`)
  }

  const handleClearTestMarker = () => {
    setTestMarker(null)
    setTestLatInput('')
    setTestLngInput('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <JsonLd data={organizationSchema} />
      <JsonLd data={serviceSchema} />
      <JsonLd data={webApplicationSchema} />
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">부름이</h1>
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
                          src={user.avatar || (typeof window !== 'undefined' ? getDefaultProfileImage(user.name) : '')}
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
              부름이에 오신 것을 환영합니다
            </h2>
            <p className="text-gray-600 mb-8">
              로그인하여 주변 심부름을 찾고 부수입을 얻어보세요
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
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
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
                      {!isUsingApi && filteredErrands.length > 0 && <span className="ml-2 text-orange-600 text-xs">• 샘플 데이터</span>}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 위도/경도 테스트 입력 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-3">📍 위도/경도로 마커 테스트</h3>
                
                {/* 예시 위치 버튼 */}
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setTestLatInput('37.1946071232431')
                      setTestLngInput('127.101332868277')
                    }}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                  >
                    청계동 예시
                  </button>
                  <button
                    onClick={() => {
                      setTestLatInput('37.5665')
                      setTestLngInput('126.9780')
                    }}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                  >
                    서울시청
                  </button>
                  <button
                    onClick={() => {
                      setTestLatInput('35.1796')
                      setTestLngInput('129.0756')
                    }}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded hover:bg-blue-200"
                  >
                    부산
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={testLatInput}
                      onChange={(e) => setTestLatInput(e.target.value)}
                      placeholder="위도 (예: 37.1946)"
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={testLngInput}
                      onChange={(e) => setTestLngInput(e.target.value)}
                      placeholder="경도 (예: 127.1013)"
                      className="text-black w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleTestLocationSubmit}
                    disabled={!testLatInput || !testLngInput}
                    className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    마커 표시
                  </button>
                  {testMarker && (
                    <button
                      onClick={handleClearTestMarker}
                      className="px-3 py-2 bg-gray-500 text-white text-sm rounded-md hover:bg-gray-600 whitespace-nowrap"
                    >
                      초기화
                    </button>
                  )}
                </div>
                {testMarker && (
                  <p className="mt-2 text-xs text-blue-700">
                    🎯 테스트 마커: {testMarker.lat.toFixed(6)}, {testMarker.lng.toFixed(6)}
                  </p>
                )}
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
                onErrandClick={handleErrandDetailOpen}
                onMoveToCurrentLocation={handleMoveToCurrentLocation}
                testMarker={testMarker}
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
                          {errand.requestedBy && (
                            <p className="text-xs text-gray-500 mb-2">
                              {errand.requestedBy.name}님의 심부름
                            </p>
                          )}
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
                    현재 위치 주변에 심부름이 없습니다.
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
          <MyAcceptedErrands key={`performer-${activeTab}`} user={user} />
        ) : (
          // 심부름 시키는 사람 탭 (내 심부름 이력)
          <MyErrandHistory key={`requester-${activeTab}`} user={user} />
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

      <ErrandDetailModal
        isOpen={showErrandDetail}
        onClose={() => {
          console.log('🔒 모달 닫기 클릭')
          setShowErrandDetail(false)
          setSelectedErrandForDetail(null)
        }}
        errand={selectedErrandForDetail}
        currentUser={user}
        onAcceptErrand={handleErrandAccept}
        onChatOpen={handleChatOpen}
      />
      
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
                  console.log('사용자가 위치 권한을 거부했습니다. 기본 위치(청계동 근처)로 설정합니다.')
                  setUserLocation({ lat: 37.1982115590239, lng: 127.118473726893 })
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
