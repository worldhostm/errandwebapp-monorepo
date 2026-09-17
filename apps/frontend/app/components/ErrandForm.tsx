'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { checkLocationPermission, requestLocationWithPermission } from '../lib/locationUtils'

const MapComponent = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-black animate-pulse"></div>
})

import type { ErrandFormData } from '../lib/types'
import Modal from './ui/Modal'
import Button from './ui/Button'

interface ErrandFormProps {
  onSubmit: (data: ErrandFormData) => void
  onCancel: () => void
}

const categories = [
  { name: '배달/픽업', emoji: '🚚', description: '음식, 물건 배달 및 픽업' },
  { name: '쇼핑/구매', emoji: '🛒', description: '장보기, 물건 구매 대행' },
  { name: '청소/정리', emoji: '🧹', description: '집안일, 청소, 정리정돈' },
  { name: '이사/운반', emoji: '📦', description: '짐 옮기기, 이사 도움' },
  { name: '반려동물', emoji: '🐕', description: '산책, 돌봄 서비스' },
  { name: '심부름', emoji: '🏃', description: '각종 심부름 대행' },
  { name: '기타', emoji: '✨', description: '그 외 다양한 요청' }
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
    deadline: new Date(Date.now() + 9 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString().slice(0, 16), // 한국 시간(UTC+9) + 2시간
    category: categories[0].name,
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
    if (typeof window === 'undefined' || !window.kakao || !window.kakao.maps) {
      console.error('Kakao Maps API가 로드되지 않음')
      return '주소를 가져올 수 없습니다.'
    }

    // Geocoder services가 로드될 때까지 최대 5초 대기
    const waitForGeocoder = async (): Promise<boolean> => {
      const maxWaitTime = 5000 // 5초
      const checkInterval = 100 // 100ms
      let elapsedTime = 0

      while (elapsedTime < maxWaitTime) {
        if (window.kakao?.maps?.services?.Geocoder) {
          return true
        }
        await new Promise(resolve => setTimeout(resolve, checkInterval))
        elapsedTime += checkInterval
      }
      return false
    }

    const geocoderAvailable = await waitForGeocoder()
    if (!geocoderAvailable) {
      console.error('Geocoder 서비스 로딩 타임아웃')
      return '주소를 가져올 수 없습니다.'
    }

    return new Promise<string>((resolve) => {
      try {
        const geocoder = new window.kakao.maps.services.Geocoder()

        geocoder.coord2Address(lng, lat, (result: unknown, status: unknown) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const addr = (result as { address?: { address_name?: string } }[])[0]?.address
            if (addr) {
              const fullAddress = addr.address_name || '주소를 찾을 수 없습니다.'
              resolve(fullAddress)
            } else {
              resolve('주소를 찾을 수 없습니다.')
            }
          } else {
            console.error('Geocoder API 호출 실패:', status)
            resolve('주소를 가져올 수 없습니다.')
          }
        })
      } catch (error) {
        console.error('Geocoder 생성 중 오류:', error)
        resolve('주소를 가져올 수 없습니다.')
      }
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
    <>
      <Modal isOpen={true} onClose={onCancel} title="심부름 요청하기" size="xl">
        <div className="text-sm text-base-content/60 -mt-2 mb-4">
          단계 {currentStep} / {totalSteps}
        </div>

        <div className="w-full bg-base-200 rounded-full h-2 mb-8">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
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
                <p className="text-base-content/60 text-sm">심부름의 제목을 간단하게 적어주세요 (5~100자)</p>
                <p className="text-right text-xs text-base-content/50 mt-1">{formData.title.length}/100</p>
              </div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                onKeyPress={handleKeyPress}
                className="input input-bordered w-full text-lg text-center"
                placeholder="예: 편의점에서 음료수 사와주세요"
                autoFocus
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold mb-2">카테고리를 선택해주세요</h3>
                <p className="text-base-content/60 text-sm">어떤 종류의 심부름인지 선택해주세요</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map(category => (
                  <button
                    key={category.name}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: category.name }))}
                    className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                      formData.category === category.name
                        ? 'border-primary bg-primary/10 shadow-lg scale-105'
                        : 'border-base-300 hover:border-primary/50 hover:shadow-md'
                    }`}
                  >
                    <div className="text-5xl">{category.emoji}</div>
                    <div className="text-center">
                      <div className={`font-semibold text-base ${
                        formData.category === category.name ? 'text-primary' : ''
                      }`}>
                        {category.name}
                      </div>
                      <div className={`text-xs mt-1 ${
                        formData.category === category.name ? 'text-primary/80' : 'text-base-content/60'
                      }`}>
                        {category.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold mb-2">자세한 내용을 알려주세요</h3>
                <p className="text-base-content/60 text-sm">구체적인 요청사항을 적어주세요 (10~1000자)</p>
                <p className="text-right text-xs text-base-content/50 mt-1">{formData.description.length}/1000</p>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                onKeyPress={handleKeyPress}
                className="textarea textarea-bordered w-full text-lg h-32"
                placeholder="예: 편의점에서 콜라 2병과 과자 1봉지 사와주세요. 계산은 카드로 부탁드립니다."
                autoFocus
              />
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">어디서 해주시면 될까요?</h3>
                <p className="text-base-content/60 text-sm">심부름 위치를 선택해주세요</p>
              </div>

              <Button
                type="button"
                variant="primary"
                fullWidth
                disabled={isGettingLocation}
                onClick={() => getUserLocation(true)}
              >
                {isGettingLocation ? '📍 위치 가져오는 중...' : '📍 현재 위치로 설정'}
              </Button>

              <div className="flex gap-2">
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
                  className="input input-bordered flex-1"
                />
                <Button
                  type="button"
                  variant="success"
                  disabled={isSearching || !searchQuery.trim()}
                  onClick={handleAddressSearch}
                >
                  {isSearching ? '검색중' : '🔍'}
                </Button>
              </div>

              {showSearchResults && searchResults.length > 0 && (
                <div className="border border-base-300 rounded-lg bg-base-100 shadow-sm max-h-48 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSearchResultSelect(result)}
                      className="w-full p-3 text-left hover:bg-base-200 border-b border-base-200 last:border-b-0"
                    >
                      <div className="font-semibold text-sm">{result.place_name}</div>
                      <div className="text-xs text-base-content/60 mt-1">📍 {result.address_name}</div>
                    </button>
                  ))}
                </div>
              )}

              {selectedAddress && (
                <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                  <p className="text-sm">
                    <span className="font-semibold">📍 선택된 위치:</span> {selectedAddress}
                  </p>
                </div>
              )}

              {showDetailAddressInput && (
                <div>
                  <label className="block text-sm font-medium mb-2">상세주소 (선택사항)</label>
                  <input
                    type="text"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    placeholder="예: 101동 203호, 2층 카페 등"
                    className="input input-bordered w-full"
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
                <h3 className="text-xl font-semibold mb-2">마지막으로...</h3>
                <p className="text-base-content/60 text-sm">보상금과 마감시간을 설정해주세요</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">보상 금액 (원)</label>
                  <input
                    type="number"
                    value={formData.reward}
                    onChange={(e) => setFormData(prev => ({ ...prev, reward: parseInt(e.target.value) || 0 }))}
                    onKeyPress={handleKeyPress}
                    className="input input-bordered w-full text-lg text-center"
                    placeholder="10000"
                    min="1000"
                    step="1000"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">마감 시간</label>
                  <input
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    className="input input-bordered w-full text-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-8">
          {currentStep > 1 && (
            <Button type="button" variant="ghost" onClick={prevStep} className="flex-1">이전</Button>
          )}
          {currentStep < totalSteps ? (
            <Button
              type="button"
              variant="primary"
              onClick={nextStep}
              disabled={!canProceedToNext()}
              className="flex-1"
            >
              다음
            </Button>
          ) : (
            <Button
              type="button"
              variant="success"
              onClick={handleSubmit}
              disabled={!canProceedToNext()}
              className="flex-1"
            >
              심부름 등록하기
            </Button>
          )}
        </div>
      </Modal>

      {/* 위치 권한 확인 모달 */}
      <Modal
        isOpen={showLocationPermissionModal}
        onClose={() => setShowLocationPermissionModal(false)}
        title="위치 권한 요청"
        size="sm"
      >
        <p className="text-base-content/70 mb-6">
          정확한 심부름 위치 선택을 위해 현재 위치가 필요합니다.
          위치 권한을 허용하시겠습니까?
        </p>
        <div className="flex gap-3">
          <Button
            variant="primary"
            className="flex-1"
            onClick={async () => {
              setShowLocationPermissionModal(false)
              await getLocationWithPermission(false)
            }}
          >
            허용
          </Button>
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => {
              setShowLocationPermissionModal(false)
              console.log('사용자가 위치 권한을 거부했습니다. 주소 검색을 이용해주세요.')
              setLocationPermissionDenied(true)
              setUserLocation({ lat: 37.5665, lng: 126.9780 })
            }}
          >
            거부
          </Button>
        </div>
      </Modal>
    </>
  )
}
