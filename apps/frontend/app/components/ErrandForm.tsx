'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { checkLocationPermission, requestLocationWithPermission } from '../lib/locationUtils'

const MapComponent = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-200 animate-pulse"></div>
})

import type { ErrandFormData } from '../lib/types'

interface ErrandFormProps {
  onSubmit: (data: ErrandFormData) => void
  onCancel: () => void
}

const categories = [
  '배달/픽업',
  '쇼핑/구매',
  '청소/정리',
  '이사/운반',
  '기타'
]

export default function ErrandForm({ onSubmit, onCancel }: ErrandFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const totalSteps = 5

  const [formData, setFormData] = useState<ErrandFormData>({
    title: '',
    description: '',
    reward: 0,
    lat: null,
    lng: null,
    deadline: '',
    category: categories[0]
  })
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<Array<{
    place_name: string
    address_name: string
    x: string
    y: string
    place_url?: string
  }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false)
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false)

  // 좌표를 주소로 변환하는 함수 (카카오 지오코더 사용)
  const getAddressFromCoords = async (lat: number, lng: number) => {
    if (typeof window === 'undefined' || !(window as any).kakao) {
      return '주소를 가져올 수 없습니다.'
    }

    return new Promise<string>((resolve) => {
      const geocoder = new (window as any).kakao.maps.services.Geocoder()
      
      geocoder.coord2Address(lng, lat, (result: any, status: any) => {
        if (status === (window as any).kakao.maps.services.Status.OK) {
          const addr = result[0]?.address
          if (addr) {
            const fullAddress = addr.address_name
            resolve(fullAddress)
          } else {
            resolve('주소를 찾을 수 없습니다.')
          }
        } else {
          resolve('주소를 가져올 수 없습니다.')
        }
      })
    })
  }

  // 주소 검색 함수 (카카오 Places API 사용)
  const searchAddress = async (query: string) => {
    if (typeof window === 'undefined' || !(window as any).kakao || !query.trim()) {
      return []
    }

    setIsSearching(true)
    
    return new Promise<Array<{
      place_name: string
      address_name: string
      x: string
      y: string
      place_url?: string
    }>>((resolve) => {
      const places = new (window as any).kakao.maps.services.Places()
      
      places.keywordSearch(query, (result: any, status: any) => {
        setIsSearching(false)
        
        if (status === (window as any).kakao.maps.services.Status.OK) {
          const searchResults = result.slice(0, 5).map((place: any) => ({
            place_name: place.place_name,
            address_name: place.address_name,
            x: place.x, // longitude
            y: place.y, // latitude
            place_url: place.place_url
          }))
          resolve(searchResults)
        } else {
          resolve([])
        }
      }, {
        size: 5, // 최대 5개 결과
        sort: (window as any).kakao.maps.services.SortBy.DISTANCE
      })
    })
  }

  // 주소 검색 실행
  const handleAddressSearch = async () => {
    if (!searchQuery.trim()) return
    
    try {
      const results = await searchAddress(searchQuery)
      setSearchResults(results)
      setShowSearchResults(true)
      
      if (results.length === 0) {
        alert('검색 결과가 없습니다. 다른 키워드로 검색해보세요.')
      }
    } catch (error) {
      console.error('주소 검색 실패:', error)
      alert('주소 검색 중 오류가 발생했습니다.')
    }
  }

  // 검색 결과 선택
  const handleSearchResultSelect = (result: {
    place_name: string
    address_name: string
    x: string
    y: string
  }) => {
    try {
      const lat = parseFloat(result.y)
      const lng = parseFloat(result.x)
      
      // 좌표 유효성 검증
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        alert('잘못된 좌표 정보입니다. 다른 장소를 선택해주세요.')
        return
      }
      
      // 선택된 위치로 설정
      handleLocationSelect(lat, lng)
      
      // 지도 중심을 선택된 위치로 이동
      setUserLocation({ lat, lng })
      
      // 검색 결과 숨기기
      setShowSearchResults(false)
      setSearchQuery('')
      
      console.log('검색 결과 선택:', { place_name: result.place_name, lat, lng })
    } catch (error) {
      console.error('검색 결과 선택 중 오류:', error)
      alert('위치 선택 중 오류가 발생했습니다.')
    }
  }

  // 위치 권한 확인 및 요청 함수
  const checkAndRequestLocation = async (autoSelect = false) => {
    const permission = await checkLocationPermission()
    
    if (permission === 'granted') {
      // 이미 권한이 허용되어 있으면 바로 위치 요청
      await getLocationWithPermission(autoSelect)
    } else if (permission === 'prompt' || permission === 'denied') {
      // 권한이 필요하면 팝업 표시
      setShowLocationPermissionModal(true)
    } else {
      // 위치 서비스 미지원
      alert('이 브라우저는 위치 서비스를 지원하지 않습니다.')
      setUserLocation({ lat: 37.5665, lng: 126.9780 })
    }
  }

  // 실제 위치 요청 함수
  const getLocationWithPermission = async (autoSelect = false) => {
    setIsGettingLocation(true)
    
    const result = await requestLocationWithPermission()
    setIsGettingLocation(false)
    
    if (result.success && result.location) {
      const { lat, lng } = result.location
      setUserLocation({ lat, lng })
      console.log('현재 위치:', { lat, lng })
      
      // autoSelect가 true이면 자동으로 현재 위치를 심부름 위치로 설정
      if (autoSelect) {
        handleLocationSelect(lat, lng)
      }
      
      // 권한 거부 상태 해제
      setLocationPermissionDenied(false)
    } else {
      if (result.error?.includes('권한이 거부')) {
        setLocationPermissionDenied(true)
      }
      console.warn(result.error || '위치를 가져올 수 없습니다.')
      setUserLocation({ lat: 37.5665, lng: 126.9780 })
    }
  }

  // 사용자 위치 가져오기 함수 (기존 함수명 유지)
  const getUserLocation = (autoSelect = false) => {
    checkAndRequestLocation(autoSelect)
  }

  // 초기 위치 가져오기 및 자동 선택
  useEffect(() => {
    // 위치 권한 확인을 위해 먼저 시도
    getUserLocation(false) // 자동 선택은 하지 않고 위치만 가져오기
  }, [])

  const handleLocationSelect = async (lat: number, lng: number) => {
    console.log('위치 선택됨:', { lat, lng })
    setFormData(prev => ({ ...prev, lat, lng }))
    
    // 주소 정보 가져오기
    try {
      const address = await getAddressFromCoords(lat, lng)
      setSelectedAddress(address)
      setFormData(prev => ({ ...prev, address })) // formData에도 주소 정보 추가
      console.log('선택된 주소:', address)
    } catch (error) {
      console.error('주소 가져오기 실패:', error)
      setSelectedAddress('주소를 가져올 수 없습니다.')
      setFormData(prev => ({ ...prev, address: '주소를 가져올 수 없습니다.' }))
    }
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(prev => prev + 1)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(prev => prev - 1)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return formData.title.trim() !== ''
      case 2: return formData.category !== ''
      case 3: return formData.description.trim() !== ''
      case 4: return formData.lat !== null && formData.lng !== null
      case 5: return formData.reward > 0 && formData.deadline !== ''
      default: return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.lat || !formData.lng) {
      alert('지도에서 위치를 선택해주세요.')
      return
    }
    
    console.log('심부름 데이터 전송:', formData)
    console.log('선택된 위도경도:', { lat: formData.lat, lng: formData.lng })
    
    onSubmit(formData)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (currentStep < totalSteps && canProceedToNext()) {
        nextStep()
      } else if (currentStep === totalSteps && canProceedToNext()) {
        handleSubmit(e as any)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">심부름 요청하기</h2>
              <div className="text-sm text-gray-500 mt-1">
                단계 {currentStep} / {totalSteps}
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>

          <div 
            className={`transition-all duration-300 ${
              isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
            }`}
          >
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2">어떤 심부름인가요?</h3>
                  <p className="text-gray-500 text-sm">심부름의 제목을 간단하게 적어주세요</p>
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                    placeholder="예: 편의점에서 음료수 사와주세요"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2">카테고리를 선택해주세요</h3>
                  <p className="text-gray-500 text-sm">어떤 종류의 심부름인지 선택해주세요</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {categories.map(category => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category }))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.category === category
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg">{category}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2">자세한 내용을 알려주세요</h3>
                  <p className="text-gray-500 text-sm">구체적인 요청사항을 적어주세요</p>
                </div>
                <div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                    placeholder="예: 편의점에서 콜라 2병과 과자 1봉지 사와주세요. 계산은 카드로 부탁드립니다."
                    autoFocus
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">어디서 해주시면 될까요?</h3>
                  <p className="text-gray-500 text-sm">심부름 위치를 선택해주세요</p>
                </div>
                
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => getUserLocation(true)}
                    disabled={isGettingLocation}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    {isGettingLocation ? (
                      <>
                        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                        위치 가져오는 중...
                      </>
                    ) : (
                      <>
                        📍 현재 위치로 설정
                      </>
                    )}
                  </button>
                </div>

                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddressSearch()
                      }
                    }}
                    placeholder="주소나 장소명 검색"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
                  >
                    {isSearching ? '검색중' : '🔍'}
                  </button>
                </div>

                {showSearchResults && searchResults.length > 0 && (
                  <div className="mb-4 border border-gray-200 rounded-lg bg-white shadow-sm max-h-48 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSearchResultSelect(result)}
                        className="w-full p-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-semibold text-sm">{result.place_name}</div>
                        <div className="text-xs text-gray-600 mt-1">📍 {result.address_name}</div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedAddress && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <span className="font-semibold">📍 선택된 위치:</span> {selectedAddress}
                    </p>
                  </div>
                )}

                <MapComponent 
                  onLocationSelect={handleLocationSelect} 
                  userLocation={userLocation}
                  centerLocation={userLocation}
                  errands={[]}
                />
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2">마지막으로...</h3>
                  <p className="text-gray-500 text-sm">보상금과 마감시간을 설정해주세요</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      보상 금액 (원)
                    </label>
                    <input
                      type="number"
                      value={formData.reward}
                      onChange={(e) => setFormData(prev => ({ ...prev, reward: parseInt(e.target.value) || 0 }))}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                      placeholder="10000"
                      min="1000"
                      step="1000"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      마감 시간
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                이전
              </button>
            )}
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceedToNext()}
                className={`flex-1 py-3 px-6 rounded-lg transition-colors ${
                  canProceedToNext()
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceedToNext()}
                className={`flex-1 py-3 px-6 rounded-lg transition-colors ${
                  canProceedToNext()
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                심부름 등록하기
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 위치 권한 확인 모달 */}
      {showLocationPermissionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">위치 권한 요청</h2>
            <p className="text-black mb-4">
              정확한 심부름 위치 선택을 위해 현재 위치가 필요합니다.
              위치 권한을 허용하시겠습니까?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={async () => {
                  setShowLocationPermissionModal(false)
                  await getLocationWithPermission(false)
                }}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                허용
              </button>
              <button
                onClick={() => {
                  setShowLocationPermissionModal(false)
                  console.log('사용자가 위치 권한을 거부했습니다. 주소 검색을 이용해주세요.')
                  setLocationPermissionDenied(true)
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