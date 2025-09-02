'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Map, MapMarker, Circle } from 'react-kakao-maps-sdk'
import type { ErrandLocation, User } from '../lib/types'
import { getDefaultProfileImage } from '../lib/imageUtils'
import { createProfileMarkerImage } from '../lib/profileMarker'
import { getRadiusFromZoomLevel } from '../lib/mapUtils'
import { getDefaultMarkerImages } from '../lib/categoryUtils'
import { createClusters, createClusterMarkerImage, type ClusterMarker } from '../lib/clustering'
import { debounceLocationQuery } from '../lib/throttle'
import { errandApi } from '../lib/api'
import KakaoMapWrapper from './KakaoMapWrapper'

interface MapComponentProps {
  onLocationSelect?: (lat: number, lng: number) => void
  errands?: ErrandLocation[]
  currentUser?: User | null
  onRadiusChange?: (radius: number) => void
  userLocation?: { lat: number; lng: number } | null
  centerLocation?: { lat: number; lng: number } | null
  selectedErrandId?: string | null
  onMapMove?: (center: { lat: number; lng: number }, bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => void
  onErrandUpdate?: () => void
}

export default function MapComponent({ 
  onLocationSelect, 
  errands = [], 
  currentUser, 
  onRadiusChange,
  userLocation: propUserLocation,
  centerLocation,
  selectedErrandId,
  onMapMove,
  onErrandUpdate
}: MapComponentProps) {
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(propUserLocation || null)
  const [selectedErrand, setSelectedErrand] = useState<ErrandLocation | null>(null)
  const [userMarkerImage, setUserMarkerImage] = useState<string | null>(null)
  const [currentZoom, setCurrentZoom] = useState(3)
  const [defaultMarkers, setDefaultMarkers] = useState<Record<string, string>>({})
  const [clusters, setClusters] = useState<ClusterMarker[]>([])
  const [unclusteredErrands, setUnclusteredErrands] = useState<ErrandLocation[]>([])
  const [clusterImages, setClusterImages] = useState<Record<string, string>>({})
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [currentLocationPulse, setCurrentLocationPulse] = useState(0)
  const [errandLocationPulse, setErrandLocationPulse] = useState(0)
  const [pulsingErrandId, setPulsingErrandId] = useState<string | null>(null)
  const [acceptingErrand, setAcceptingErrand] = useState<string | null>(null)
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [isAutoSearching, setIsAutoSearching] = useState(false)
  const [userHasDragged, setUserHasDragged] = useState(false)
  const [lastSearchCenter, setLastSearchCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [searchAbortController, setSearchAbortController] = useState<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastCallTimeRef = useRef<number>(0)
  const isSearchingRef = useRef<boolean>(false)

  // 두 지점 간의 거리 계산 (km)
  const getDistance = (pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }) => {
    const R = 6371 // 지구 반지름 (km)
    const dLat = deg2rad(pos2.lat - pos1.lat)
    const dLon = deg2rad(pos2.lng - pos1.lng)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(pos1.lat)) * Math.cos(deg2rad(pos2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const deg2rad = (deg: number) => {
    return deg * (Math.PI/180)
  }

  // 실제 검색을 수행하는 함수
  const performSearch = useCallback(async (center: { lat: number; lng: number }, bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => {
    // 1. 최소 이동 거리 체크 (200m 미만 이동 시 무시)
    if (lastSearchCenter) {
      const distance = getDistance(lastSearchCenter, center)
      if (distance < 0.2) { // 0.2km = 200m
        console.log(`📍 이동 거리가 ${(distance * 1000).toFixed(0)}m로 너무 짧아 검색을 건너뜁니다.`)
        return
      }
    }
    
    // 2. 이미 진행 중인 검색이 있으면 취소
    if (searchAbortController) {
      searchAbortController.abort()
      console.log('🚫 이전 검색 요청을 취소했습니다.')
    }
    
    // 3. 새로운 검색을 위한 AbortController 생성
    const controller = new AbortController()
    setSearchAbortController(controller)
    
    // 지도 중심 좌표 업데이트
    setCurrentMapCenter(center)
    setIsAutoSearching(true)
    
    try {
      console.log(`🔍 지도 중심 변경: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)} - 자동 검색 시작`)
      
      // 4. API 호출 (AbortController와 함께)
      const response = await errandApi.getNearbyErrands(center.lng, center.lat, 10000, 'pending', controller.signal)
      
      // 5. 요청이 취소되지 않았다면 결과 처리
      if (!controller.signal.aborted) {
        if (response.success && response.data && onMapMove) {
          // 마지막 검색 좌표 업데이트
          setLastSearchCenter(center)
          
          // 부모 컴포넌트에 새로운 심부름 데이터 전달
          onMapMove(center, bounds)
          console.log(`✅ ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)} 위치에서 ${response.data.errands.length}개의 심부름을 찾았습니다.`)
        }
      } else {
        console.log('🚫 검색 요청이 취소되었습니다.')
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🚫 검색 요청이 취소되었습니다.')
      } else {
        console.error('❌ 자동 검색 오류:', error)
        // 에러 발생 시에도 기존 방식으로 폴백 (요청이 취소되지 않은 경우에만)
        if (!controller.signal.aborted && onMapMove) {
          onMapMove(center, bounds)
        }
      }
    } finally {
      // 6. 검색 완료 후 상태 정리
      if (!controller.signal.aborted) {
        setIsAutoSearching(false)
        setSearchAbortController(null)
      }
    }
  }, [lastSearchCenter, searchAbortController, onMapMove, getDistance])

  // 강력한 쓰로틀링+디바운스 검색 함수
  const debouncedOnMapMove = useCallback((center: { lat: number; lng: number }, bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallTimeRef.current
    
    // 1. 너무 빈번한 호출 차단 (500ms 이내 호출 무시)
    if (timeSinceLastCall < 500) {
      console.log(`🚫 너무 빈번한 호출 차단 (${timeSinceLastCall}ms 전에 호출됨)`)
      return
    }
    
    // 2. 이미 검색 중이면 무시
    if (isSearchingRef.current) {
      console.log('🚫 이미 검색 중이므로 호출 무시')
      return
    }
    
    // 3. 이전 타이머가 있으면 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      console.log('⏰ 이전 디바운스 타이머를 취소했습니다.')
    }
    
    lastCallTimeRef.current = now
    
    // 4. 새로운 타이머 설정
    debounceTimerRef.current = setTimeout(() => {
      if (isSearchingRef.current) {
        console.log('🚫 검색 중이므로 디바운스 타이머 무시')
        return
      }
      
      console.log('🚀 디바운스 타이머 완료 - 검색 실행')
      isSearchingRef.current = true
      
      performSearch(center, bounds).finally(() => {
        isSearchingRef.current = false
      })
      
      debounceTimerRef.current = null
    }, 2000) // 2초 디바운스로 강화
    
    console.log('⏳ 쓰로틀링+디바운스 타이머 시작 (2초)')
  }, [performSearch])

  // 컴포넌트 언마운트 시 진행 중인 검색 요청 및 타이머 취소
  useEffect(() => {
    return () => {
      if (searchAbortController) {
        searchAbortController.abort()
        console.log('🧹 컴포넌트 언마운트로 검색 요청을 취소했습니다.')
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        console.log('🧹 컴포넌트 언마운트로 디바운스 타이머를 취소했습니다.')
      }
    }
  }, [searchAbortController])

  // centerLocation이 변경되면 지도 중심 이동 (사용자가 드래그하지 않은 경우에만)
  useEffect(() => {
    // 사용자가 드래그한 경우 centerLocation 변경을 무시
    if (userHasDragged) return
    
    let newCenter = null
    if (centerLocation) {
      newCenter = centerLocation
    } else if (propUserLocation) {
      newCenter = propUserLocation
    } else if (errands.length > 0) {
      // 심부름이 있으면 첫 번째 심부름 위치로
      newCenter = {
        lat: errands[0].lat,
        lng: errands[0].lng,
      }
    }
    
    if (newCenter) {
      setMapCenter(newCenter)
      // 초기 지도 중심 설정 (재탐색 기준점)
      if (!currentMapCenter) {
        setCurrentMapCenter(newCenter)
      }
    }
  }, [centerLocation, propUserLocation, errands, currentMapCenter, userHasDragged])


  // 기본 마커 이미지 생성
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const markers = getDefaultMarkerImages()
      setDefaultMarkers(markers)
    }
  }, [])

  // 사용자 프로필 마커 이미지 생성
  useEffect(() => {
    if (currentUser && typeof window !== 'undefined') {
      const profileImageSrc = currentUser.avatar || getDefaultProfileImage(currentUser.name)
      createProfileMarkerImage(profileImageSrc)
        .then(markerImage => setUserMarkerImage(markerImage))
        .catch(error => {
          console.error('프로필 마커 생성 실패:', error)
          setUserMarkerImage(null)
        })
    }
  }, [currentUser])

  // 클러스터링 처리
  useEffect(() => {
    // 클러스터링 조건: 심부름이 5개 이상이고, 브라우저 환경일 때만
    if (typeof window !== 'undefined' && errands.length >= 5) {
      try {
        const { clusters: newClusters, unclustered } = createClusters(errands, currentZoom)
        setClusters(newClusters)
        setUnclusteredErrands(unclustered)

        // 클러스터 마커 이미지 생성
        const newClusterImages: Record<string, string> = {}
        newClusters.forEach(cluster => {
          if (!clusterImages[cluster.count.toString()]) {
            newClusterImages[cluster.count.toString()] = createClusterMarkerImage(cluster.count)
          }
        })
        
        if (Object.keys(newClusterImages).length > 0) {
          setClusterImages(prev => ({ ...prev, ...newClusterImages }))
        }
      } catch (error) {
        console.error('클러스터링 처리 중 오류:', error)
        setClusters([])
        setUnclusteredErrands(errands)
      }
    } else {
      setClusters([])
      setUnclusteredErrands(errands)
    }
  }, [errands, currentZoom, clusterImages])

  // 외부에서 선택된 심부름 처리 (맥동 애니메이션 적용)
  useEffect(() => {
    if (selectedErrandId && errands.length > 0) {
      const errand = errands.find(e => e.id === selectedErrandId)
      if (errand) {
        setSelectedErrand(errand)
        setPulsingErrandId(errand.id)
        
        // 선택된 심부름으로 지도 중심 이동 (프로그래밍적 이동이므로 드래그 아님)
        setMapCenter({ lat: errand.lat, lng: errand.lng })
        setUserHasDragged(false)
      }
    }
  }, [selectedErrandId, errands])

  // 현재 위치 맥동 애니메이션
  useEffect(() => {
    if (currentUser && propUserLocation) {
      let intervalId: NodeJS.Timeout
      
      const createLocationPulse = () => {
        intervalId = setInterval(() => {
          let startTime: number | null = null
          const duration = 1000 // 1초 동안 퍼짐
          const maxPulse = 21 // 42px 전체 지름에서 40px 마커 제외한 반지름
          
          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const elapsed = timestamp - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            // 부드러운 확장
            const currentPulse = maxPulse * progress
            setCurrentLocationPulse(currentPulse)
            
            if (progress < 1) {
              requestAnimationFrame(animate)
            }
          }
          
          requestAnimationFrame(animate)
        }, 1200) // 1.2초마다 새 맥동 시작
      }
      
      // 즐시 첫 맥동 시작하고 무한 반복 설정
      createLocationPulse()
      
      // 정리 함수
      return () => {
        if (intervalId) {
          clearInterval(intervalId)
        }
      }
    } else {
      setCurrentLocationPulse(0)
    }
  }, [currentUser, propUserLocation])

  // 심부름 마커 클릭 시 맥동 애니메이션
  useEffect(() => {
    if (pulsingErrandId) {
      let intervalId: NodeJS.Timeout
      
      const createErrandPulse = () => {
        intervalId = setInterval(() => {
          let startTime: number | null = null
          const duration = 1000 // 1초 동안 퍼짐
          const maxPulse = 21 // 42px 전체 지름에서 반지름
          
          const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp
            const elapsed = timestamp - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            // 부드러운 확장
            const currentPulse = maxPulse * progress
            setErrandLocationPulse(currentPulse)
            
            if (progress < 1 && pulsingErrandId) {
              requestAnimationFrame(animate)
            }
          }
          
          requestAnimationFrame(animate)
        }, 1200) // 1.2초마다 새 맥동 시작
      }
      
      // 즉시 첫 맥동 시작하고 무한 반복 설정
      createErrandPulse()
      
      // 10초 후 자동으로 맥동 중지
      const autoStopTimeout = setTimeout(() => {
        setPulsingErrandId(null)
        setErrandLocationPulse(0)
      }, 10000)
      
      // 정리 함수
      return () => {
        if (intervalId) {
          clearInterval(intervalId)
        }
        if (autoStopTimeout) {
          clearTimeout(autoStopTimeout)
        }
      }
    } else {
      setErrandLocationPulse(0)
    }
  }, [pulsingErrandId])

  // 심부름 수락 함수
  const handleAcceptErrand = async (errandId: string) => {
    if (!currentUser || acceptingErrand) return
    
    setAcceptingErrand(errandId)
    try {
      const response = await errandApi.acceptErrand(errandId)
      
      if (response.success) {
        // 성공 메시지 표시
        alert('심부름을 성공적으로 수락했습니다!')
        
        // 선택된 심부름 닫기
        setSelectedErrand(null)
        
        // 부모 컴포넌트에 업데이트 알림
        if (onErrandUpdate) {
          onErrandUpdate()
        }
      } else {
        alert(response.error || '심부름 수락에 실패했습니다.')
      }
    } catch (error) {
      console.error('심부름 수락 오류:', error)
      alert('네트워크 오류가 발생했습니다.')
    } finally {
      setAcceptingErrand(null)
    }
  }


  const handleMapClick = (_target: unknown, mouseEvent: { latLng: { getLat: () => number; getLng: () => number } }) => {
    if (onLocationSelect) {
      const latlng = mouseEvent.latLng
      const lat = latlng.getLat()
      const lng = latlng.getLng()
      
      // 선택된 위치 저장
      setSelectedLocation({ lat, lng })
      
      // 콜백 호출
      onLocationSelect(lat, lng)
    }
  }

  const handleZoomChanged = (map: { getLevel: () => number; getCenter: () => { getLat: () => number; getLng: () => number }; getBounds: () => { getSouthWest: () => { getLat: () => number; getLng: () => number }; getNorthEast: () => { getLat: () => number; getLng: () => number } } }) => {
    const newZoom = map.getLevel()
    setCurrentZoom(newZoom)
    
    if (onRadiusChange) {
      const newRadius = getRadiusFromZoomLevel(newZoom)
      onRadiusChange(newRadius)
    }

    // 줌 변경 시에도 위치 기반 조회 트리거
    handleMapMove(map)
  }

  const handleMapMove = (map: { getCenter: () => { getLat: () => number; getLng: () => number }; getBounds: () => { getSouthWest: () => { getLat: () => number; getLng: () => number }; getNorthEast: () => { getLat: () => number; getLng: () => number } } }) => {
    if (!onMapMove) return

    try {
      const center = map.getCenter()
      const bounds = map.getBounds()
      
      const mapCenter = {
        lat: center.getLat(),
        lng: center.getLng()
      }
      
      const mapBounds = {
        sw: {
          lat: bounds.getSouthWest().getLat(),
          lng: bounds.getSouthWest().getLng()
        },
        ne: {
          lat: bounds.getNorthEast().getLat(),
          lng: bounds.getNorthEast().getLng()
        }
      }

      setMapCenter(mapCenter)
      
      // 사용자가 지도를 드래그했음을 표시
      setUserHasDragged(true)
      
      // 자동으로 해당 좌표를 기준으로 검색 (디바운스됨)
      debouncedOnMapMove(mapCenter, mapBounds)
    } catch (error) {
      console.error('지도 이동 처리 중 오류:', error)
    }
  }

  if (!mapCenter) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
        위치 정보 로딩 중...
      </div>
    )
  }

  const getMarkerImage = (errand: ErrandLocation) => {
    if (errand.status === 'pending' && errand.isUrgent) {
      return defaultMarkers.urgent || '/marker-urgent.png'
    }
    
    const statusMap: { [key: string]: string } = {
      'pending': defaultMarkers.pending || '/marker-pending.png',
      'accepted': defaultMarkers.accepted || '/marker-accepted.png', 
      'in_progress': defaultMarkers.inProgress || '/marker-progress.png',
      'completed': defaultMarkers.completed || '/marker-completed.png'
    }
    
    return statusMap[errand.status] || defaultMarkers.pending || '/marker-pending.png'
  }

  return (
    <KakaoMapWrapper>
      <div className="relative w-full h-96">
        <Map
          center={mapCenter}
          style={{
            width: '100%',
            height: '100%',
          }}
          level={currentZoom}
          onClick={handleMapClick}
          onZoomChanged={handleZoomChanged}
          onCenterChanged={handleMapMove}
          onDragEnd={handleMapMove}
        >
          {/* 클러스터 마커들 */}
          {clusters.map((cluster) => (
            <MapMarker
              key={cluster.id}
              position={{ lat: cluster.lat, lng: cluster.lng }}
              image={{
                src: clusterImages[cluster.count.toString()] || createClusterMarkerImage(cluster.count),
                size: { 
                  width: cluster.count > 99 ? 50 : cluster.count > 9 ? 45 : 40,
                  height: cluster.count > 99 ? 50 : cluster.count > 9 ? 45 : 40
                },
              }}
              clickable={true}
              onClick={() => {
                // 클러스터를 클릭하면 줌인하여 개별 마커들을 보여줌
                if (currentZoom > 1) {
                  setCurrentZoom(currentZoom - 2)
                  setMapCenter({ lat: cluster.lat, lng: cluster.lng })
                  setUserHasDragged(false) // 프로그래밍적 이동이므로 드래그 아님
                }
              }}
            />
          ))}

          {/* 클러스터되지 않은 개별 심부름 마커들 */}
          {unclusteredErrands.map((errand) => (
            <MapMarker
              key={errand.id}
              position={{ lat: errand.lat, lng: errand.lng }}
              image={{
                src: getMarkerImage(errand),
                size: { width: 35, height: 35 },
              }}
              clickable={true}
              onClick={() => {
                setSelectedErrand(errand)
                setPulsingErrandId(errand.id)
                setMapCenter({ lat: errand.lat, lng: errand.lng })
                setUserHasDragged(false) // 프로그래밍적 이동이므로 드래그 아님
              }}
            />
          ))}
          
          {currentUser && userMarkerImage && propUserLocation && (
            <>
              {/* 현재 위치 맥동 애니메이션 원 */}
              <Circle
                center={{ lat: propUserLocation.lat + 0.000018, lng: propUserLocation.lng }}
                radius={21 + currentLocationPulse}
                strokeWeight={2}
                strokeColor="#10B981"
                strokeOpacity={Math.max(0.8 - (currentLocationPulse / 21) * 0.8, 0)}
                fillColor="#10B981"
                fillOpacity={Math.max(0.3 - (currentLocationPulse / 21) * 0.3, 0)}
              />
              {/* 사용자 프로필 마커 */}
              <MapMarker
                position={propUserLocation}
                image={{
                  src: userMarkerImage,
                  size: { width: 40, height: 40 },
                }}
              />
            </>
          )}
          
          {/* 선택된 위치 마커 (심부름 등록시) */}
          {selectedLocation && onLocationSelect && (
            <MapMarker
              position={selectedLocation}
              image={{
                src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
                size: { width: 24, height: 35 },
              }}
              title="선택된 위치"
            />
          )}
          
          {/* 심부름 마커 클릭 시 맥동 애니메이션 */}
          {pulsingErrandId && errands.find(e => e.id === pulsingErrandId) && errandLocationPulse > 0 && (
            <Circle
              center={{
                lat: errands.find(e => e.id === pulsingErrandId)!.lat + 0.000018,
                lng: errands.find(e => e.id === pulsingErrandId)!.lng
              }}
              radius={21 + errandLocationPulse}
              strokeWeight={2}
              strokeColor="#3B82F6"
              strokeOpacity={Math.max(0.8 - (errandLocationPulse / 21) * 0.8, 0)}
              fillColor="#3B82F6"
              fillOpacity={Math.max(0.3 - (errandLocationPulse / 21) * 0.3, 0)}
            />
          )}
          
        </Map>
        

        {selectedErrand && (
          <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg max-w-sm z-10">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{selectedErrand.title}</h3>
              <button
                onClick={() => setSelectedErrand(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <p className="text-gray-600 mb-2">{selectedErrand.description}</p>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-green-600">
                ₩{selectedErrand.reward.toLocaleString()}
              </span>
              <span className={`px-2 py-1 rounded text-xs ${
                selectedErrand.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                selectedErrand.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {selectedErrand.status === 'pending' ? '대기중' :
                 selectedErrand.status === 'in_progress' ? '진행중' : '완료'}
              </span>
            </div>
            {selectedErrand.status === 'pending' && (
              <button 
                onClick={() => handleAcceptErrand(selectedErrand.id)}
                disabled={acceptingErrand === selectedErrand.id || !currentUser}
                className={`w-full mt-3 py-2 rounded transition-colors ${
                  acceptingErrand === selectedErrand.id 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : !currentUser 
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                {acceptingErrand === selectedErrand.id ? '수락 중...' : '심부름 수락하기'}
              </button>
            )}
            {selectedErrand.status === 'accepted' && (
              <div className="w-full mt-3 py-2 text-center bg-blue-100 text-blue-800 rounded">
                수락된 심부름입니다
              </div>
            )}
            {selectedErrand.status === 'in_progress' && (
              <div className="w-full mt-3 py-2 text-center bg-orange-100 text-orange-800 rounded">
                진행 중인 심부름입니다
              </div>
            )}
            {selectedErrand.status === 'completed' && (
              <div className="w-full mt-3 py-2 text-center bg-green-100 text-green-800 rounded">
                완료된 심부름입니다
              </div>
            )}
          </div>
        )}
        
        {/* 자동 검색 로딩 표시 */}
        {isAutoSearching && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm text-gray-700">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              새로운 지역 검색중...
            </div>
          </div>
        )}
      </div>
    </KakaoMapWrapper>
  )
}