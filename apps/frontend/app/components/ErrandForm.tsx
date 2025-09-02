'use client'

import { useState, useEffect, useCallback } from 'react'
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
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16), // 현재 시간 + 2시간
    category: categories[0],
    address: ''
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
  const [, setLocationPermissionDenied] = useState(false)
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false)
  const [detailAddress, setDetailAddress] = useState('')
  const [showDetailAddressInput, setShowDetailAddressInput] = useState(false)
  const [baseAddress, setBaseAddress] = useState('')

  // 좌표를 주소로 변환하는 함수 (카카오 지오코더 사용)
  const getAddressFromCoords = useCallback(async (lat: number, lng: number) => {
    if (typeof window === 'undefined' || !window.kakao) {
      return '주소를 가져올 수 없습니다.'
    }

    return new Promise<string>((resolve) => {
      const geocoder = new window.kakao.maps.services.Geocoder()
      
      geocoder.coord2Address(lng, lat, (result: unknown, status: unknown) => {
        if (status === (window as unknown & { kakao: { maps: { services: { Status: { OK: unknown } } } } }).kakao.maps.services.Status.OK) {
          const addr = (result as { address?: { address_name?: string } }[])[0]?.address
          if (addr) {
            const fullAddress = addr.address_name || '주소를 찾을 수 없습니다.'
            resolve(fullAddress)
          } else {
            resolve('주소를 찾을 수 없습니다.')
          }
        } else {
          resolve('주소를 가져올 수 없습니다.')
        }
      })
    })
  }, [])

  // 주소 검색 함수 (카카오 주소검색 API 사용)
  const searchAddress = async (query: string) => {
    if (!query.trim()) {
      return []
    }

    setIsSearching(true)
    
    try {
      const response = await fetch(`/api/kakao/v2/local/search/address.json?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `KakaoAK f324f55bbc6f81c5ed8c21b3e046e3fe`
        }
      })
      
      if (!response.ok) {
        throw new Error('주소 검색 실패')
      }
      
      const data = await response.json() as { documents?: Array<{ address_name?: string; road_address?: { address_name?: string }; x: string; y: string }> }
      setIsSearching(false)
      
      if (data.documents && data.documents.length > 0) {
        const searchResults = data.documents.slice(0, 5).map((place: { address_name?: string; road_address?: { address_name?: string }; x: string; y: string }) => ({
          place_name: place.address_name || place.road_address?.address_name || '주소',
          address_name: place.address_name || place.road_address?.address_name || '',
          x: place.x, // longitude
          y: place.y, // latitude
          place_url: ''
        }))
        return searchResults
      } else {
        return []
      }
    } catch (error) {
      console.error('주소 검색 API 오류:', error)
      setIsSearching(false)
      return []
    }
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
      
      // 기본 주소 저장 (검색 결과에서 가져온 주소)
      setBaseAddress(result.address_name)
      
      // 선택된 위치로 설정 (검색 결과 주소 사용)
      handleLocationSelectWithAddress(lat, lng, result.address_name)
      
      // 지도 중심을 선택된 위치로 이동
      setUserLocation({ lat, lng })
      
      // 검색 결과 숨기기
      setShowSearchResults(false)
      setSearchQuery('')
      
      // 상세주소 입력 활성화
      setShowDetailAddressInput(true)
      
      console.log('검색 결과 선택:', { place_name: result.place_name, lat, lng, address: result.address_name })
    } catch (error) {
      console.error('검색 결과 선택 중 오류:', error)
      alert('위치 선택 중 오류가 발생했습니다.')
    }
  }

  // 위치 선택 핸들러
  const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
    console.log('위치 선택됨:', { lat, lng })
    setFormData(prev => ({ ...prev, lat, lng }))
    
    // 주소 정보 가져오기
    try {
      const address = await getAddressFromCoords(lat, lng)
      setBaseAddress(address)
      const fullAddress = detailAddress ? `${address} ${detailAddress}` : address
      setSelectedAddress(fullAddress)
      setFormData(prev => ({ ...prev, address: fullAddress }))
      console.log('선택된 주소:', fullAddress)
      console.log('formData 업데이트:', { lat, lng, address: fullAddress })
    } catch (error) {
      console.error('주소 가져오기 실패:', error)
      setSelectedAddress('주소를 가져올 수 없습니다.')
      setFormData(prev => ({ ...prev, address: '주소를 가져올 수 없습니다.' }))
    }
  }, [detailAddress, getAddressFromCoords])

  // 실제 위치 요청 함수
  const getLocationWithPermission = useCallback(async (autoSelect = false) => {
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
        setShowDetailAddressInput(true)
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
  }, [handleLocationSelect, setLocationPermissionDenied])

  // 위치 권한 확인 및 요청 함수
  const checkAndRequestLocation = useCallback(async (autoSelect = false) => {
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
  }, [getLocationWithPermission])

  // 사용자 위치 가져오기 함수 (기존 함수명 유지)
  const getUserLocation = useCallback((autoSelect = false) => {
    checkAndRequestLocation(autoSelect)
  }, [checkAndRequestLocation])

  // 초기 위치 가져오기 및 자동 선택
  useEffect(() => {
    // 위치 권한 확인을 위해 먼저 시도
    getUserLocation(false) // 자동 선택은 하지 않고 위치만 가져오기
  }, [getUserLocation])

  // 상세주소 변경 시 전체 주소 업데이트
  useEffect(() => {
    if (baseAddress) {
      // 이미 저장된 기본 주소에 상세주소 추가
      const fullAddress = detailAddress ? `${baseAddress} ${detailAddress}` : baseAddress
      setSelectedAddress(fullAddress)
      setFormData(prev => ({ ...prev, address: fullAddress }))
      console.log('상세주소 업데이트:', fullAddress)
    }
  }, [detailAddress, baseAddress])

  // 주소와 함께 위치 선택 (검색 결과용)
  const handleLocationSelectWithAddress = (lat: number, lng: number, address: string) => {
    console.log('위치 선택됨:', { lat, lng, address })
    setFormData(prev => ({ ...prev, lat, lng }))
    
    const fullAddress = detailAddress ? `${address} ${detailAddress}` : address
    setSelectedAddress(fullAddress)
    setFormData(prev => ({ ...prev, address: fullAddress }))
    console.log('선택된 주소:', fullAddress)
    console.log('formData 업데이트:', { lat, lng, address: fullAddress })
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
      case 1: return formData.title.trim().length >= 5 && formData.title.trim().length <= 100
      case 2: return formData.category !== ''
      case 3: return formData.description.trim().length >= 10 && formData.description.trim().length <= 1000
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
    console.log('주소 정보:', formData.address)
    console.log('마감일:', formData.deadline)
    
    onSubmit(formData)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (currentStep < totalSteps && canProceedToNext()) {
        nextStep()
      } else if (currentStep === totalSteps && canProceedToNext()) {
        handleSubmit(e as React.FormEvent)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-black">심부름 요청하기</h2>
              <div className="text-sm text-black mt-1">
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
                  <h3 className="text-xl font-semibold mb-2 text-black">어떤 심부름인가요?</h3>
                  <p className="text-black text-sm">심부름의 제목을 간단하게 적어주세요 (5~100자)</p>
                  <p className="text-right text-xs text-gray-500 mt-1">{formData.title.length}/100</p>
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-black"
                    placeholder="예: 편의점에서 음료수 사와주세요"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h3 className="text-xl font-semibold mb-2 text-black">카테고리를 선택해주세요</h3>
                  <p className="text-black text-sm">어떤 종류의 심부름인지 선택해주세요</p>
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
                          : 'border-gray-200 hover:border-gray-300 text-black'
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
                  <h3 className="text-xl font-semibold mb-2 text-black">자세한 내용을 알려주세요</h3>
                  <p className="text-black text-sm">구체적인 요청사항을 적어주세요 (10~1000자)</p>
                  <p className="text-right text-xs text-gray-500 mt-1">{formData.description.length}/1000</p>
                </div>
                <div>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none text-black"
                    placeholder="예: 편의점에서 콜라 2병과 과자 1봉지 사와주세요. 계산은 카드로 부탁드립니다."
                    autoFocus
                  />
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2 text-black">어디서 해주시면 될까요?</h3>
                  <p className="text-black text-sm">심부름 위치를 선택해주세요</p>
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
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
                        className="w-full p-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-black"
                      >
                        <div className="font-semibold text-sm text-black">{result.place_name}</div>
                        <div className="text-xs text-black mt-1">📍 {result.address_name}</div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedAddress && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-black">
                      <span className="font-semibold">📍 선택된 위치:</span> {selectedAddress}
                    </p>
                  </div>
                )}
                
                {showDetailAddressInput && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-black mb-2">
                      상세주소 (선택사항)
                    </label>
                    <input
                      type="text"
                      value={detailAddress}
                      onChange={(e) => setDetailAddress(e.target.value)}
                      placeholder="예: 101동 203호, 2층 카페 등"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    />
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
                  <h3 className="text-xl font-semibold mb-2 text-black">마지막으로...</h3>
                  <p className="text-black text-sm">보상금과 마감시간을 설정해주세요</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      보상 금액 (원)
                    </label>
                    <input
                      type="number"
                      value={formData.reward}
                      onChange={(e) => setFormData(prev => ({ ...prev, reward: parseInt(e.target.value) || 0 }))}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-black"
                      placeholder="10000"
                      min="1000"
                      step="1000"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      마감 시간
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.deadline}
                      onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                      onKeyPress={handleKeyPress}
                      className="w-full px-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
            <h2 className="text-xl font-bold mb-4 text-black">위치 권한 요청</h2>
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