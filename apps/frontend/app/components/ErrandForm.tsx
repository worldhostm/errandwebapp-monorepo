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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">심부름 요청하기</h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black mb-1">
                제목
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="심부름 제목을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-1">
                카테고리
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-black mb-1">
                상세 설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                placeholder="심부름 내용을 자세히 설명해주세요"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  보상 금액 (원)
                </label>
                <input
                  type="number"
                  value={formData.reward}
                  onChange={(e) => setFormData(prev => ({ ...prev, reward: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10000"
                  min="1000"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-black mb-1">
                  마감 시간
                </label>
                <input
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, deadline: e.target.value }))
                    // 날짜 선택 후 포커스 해제하여 datepicker 자동 닫기
                    e.target.blur()
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-bold text-black">
                  위치 선택
                </label>
                <button
                  type="button"
                  onClick={() => getUserLocation(true)}
                  disabled={isGettingLocation}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isGettingLocation ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      위치 가져오는 중...
                    </>
                  ) : (
                    <>
                      📍 현재 위치로 설정
                    </>
                  )}
                </button>
              </div>
              
              {/* 주소 검색 섹션 */}
              <div className="mb-3">
                <div className="flex gap-2">
                  <div className="flex-1">
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
                      placeholder="주소나 장소명을 입력하세요 (예: 강남역, 서울시 강남구)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 py-2 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    {isSearching ? (
                      <>
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        검색중
                      </>
                    ) : (
                      <>
                        🔍 검색
                      </>
                    )}
                  </button>
                </div>
                
                {locationPermissionDenied && (
                  <p className="text-xs text-orange-600 mt-1">
                    💡 위치 권한이 없어 주소 검색을 이용해주세요
                  </p>
                )}
              </div>
              
              {/* 검색 결과 */}
              {showSearchResults && (
                <div className="mb-3 border border-gray-200 rounded-md bg-white shadow-sm max-h-48 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <>
                      <div className="p-2 bg-gray-50 border-b text-xs text-gray-600">
                        검색 결과 ({searchResults.length}개)
                      </div>
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSearchResultSelect(result)}
                          className="w-full p-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-semibold text-sm text-gray-900">
                            {result.place_name}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            📍 {result.address_name}
                          </div>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setShowSearchResults(false)}
                        className="w-full p-2 text-xs text-gray-500 hover:bg-gray-50"
                      >
                        검색 결과 닫기
                      </button>
                    </>
                  ) : (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      검색 결과가 없습니다
                    </div>
                  )}
                </div>
              )}
              <p className="text-sm text-black mb-2">
                {locationPermissionDenied 
                  ? "주소를 검색하거나 지도를 클릭하여 심부름 위치를 선택하세요"
                  : "현재 위치 버튼, 주소 검색, 또는 지도 클릭으로 심부름 위치를 선택하세요"
                }
                {formData.lat && formData.lng && (
                  <span className="text-green-600 ml-2">
                    ✓ 위치 선택됨
                  </span>
                )}
              </p>
              {selectedAddress && (
                <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">📍 선택된 주소:</span> {selectedAddress}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    좌표: {formData.lat?.toFixed(6)}, {formData.lng?.toFixed(6)}
                  </p>
                </div>
              )}
              <MapComponent 
                onLocationSelect={handleLocationSelect} 
                userLocation={userLocation}
                centerLocation={userLocation}
                errands={[]} // 등록 폼에서는 빈 배열로 설정
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                심부름 등록하기
              </button>
            </div>
          </form>
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