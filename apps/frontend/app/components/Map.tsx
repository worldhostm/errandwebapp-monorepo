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
import ClusterModal from './ClusterModal'

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
  onErrandClick?: (errand: ErrandLocation) => void
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
  onErrandUpdate,
  onErrandClick
}: MapComponentProps) {
  
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(propUserLocation || null)
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
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [isAutoSearching, setIsAutoSearching] = useState(false)
  const [userHasDragged, setUserHasDragged] = useState(false)
  const [lastSearchCenter, setLastSearchCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [searchAbortController, setSearchAbortController] = useState<AbortController | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastCallTimeRef = useRef<number>(0)
  const isSearchingRef = useRef<boolean>(false)
  const [showClusterModal, setShowClusterModal] = useState(false)
  const [selectedCluster, setSelectedCluster] = useState<ClusterMarker | null>(null)

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
      
      // 부모 컴포넌트의 handleMapMove 바로 호출 (API는 부모에서 처리)
      if (onMapMove) {
        console.log('🚀 부모 onMapMove 호출')
        onMapMove(center, bounds)
        setLastSearchCenter(center)
      } else {
        console.log('❌ onMapMove가 없음')
      }
    } catch (error: any) {
      console.error('❌ 지도 이동 처리 오류:', error)
    } finally {
      // 검색 완료 후 상태 정리
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
    }, 800) // 0.8초 디바운스로 변경
    
    console.log('⏳ 쓰로틀링+디바운스 타이머 시작 (0.8초)')
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
        .then(markerImage => {
          setUserMarkerImage(markerImage)
        })
        .catch(error => {
          console.error('프로필 마커 생성 실패:', error)
          setUserMarkerImage(null)
        })
    }
  }, [currentUser, propUserLocation])

  // 클러스터링 처리
  useEffect(() => {
    // 클러스터링 조건: 심부름이 2개 이상이고, 브라우저 환경일 때만
    if (typeof window !== 'undefined' && errands.length >= 2) {
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
                // 클러스터를 클릭하면 모달로 심부름 목록 표시
                setSelectedCluster(cluster)
                setShowClusterModal(true)
              }}
            />
          ))}

          {/* 클러스터되지 않은 심부름 마커들 - 다양한 색상으로 표시 */}
          {unclusteredErrands.map((errand, index) => {
            const colors = ['/marker-red.svg', '/marker-blue.svg', '/marker-green.svg', '/marker-orange.svg', '/marker-purple.svg']
            const markerColor = colors[index % colors.length]
            
            return (
              <MapMarker
                key={errand.id}
                position={{ lat: errand.lat, lng: errand.lng }}
                image={{
                  src: markerColor,
                  size: { width: 24, height: 35 },
                }}
                clickable={true}
                title={errand.title}
                onClick={() => {
                  console.log('🎯 마커 클릭됨:', errand.title)
                  if (onErrandClick) {
                    console.log('🚀 onErrandClick 호출 시작')
                    onErrandClick(errand)
                    console.log('✅ onErrandClick 호출 완료')
                  } else {
                    console.log('❌ onErrandClick이 없음')
                  }
                  setPulsingErrandId(errand.id)
                  setMapCenter({ lat: errand.lat, lng: errand.lng })
                  setUserHasDragged(false)
                }}
              />
            )
          })}
          
          {/* 테스트 마커 - 청계동 위치 */}
          <MapMarker
            position={{ lat: 37.1982115590239, lng: 127.118473726893 }}
            title="테스트 마커 - 청계동"
          />
          
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
      
      {/* 클러스터 모달 */}
      <ClusterModal
        isOpen={showClusterModal}
        onClose={() => {
          setShowClusterModal(false)
          setSelectedCluster(null)
        }}
        errands={selectedCluster?.items || []}
        position={selectedCluster ? { lat: selectedCluster.lat, lng: selectedCluster.lng } : null}
        onErrandSelect={(errand) => {
          if (onErrandClick) {
            onErrandClick(errand)
          }
          setPulsingErrandId(errand.id)
          setMapCenter({ lat: errand.lat, lng: errand.lng })
          setUserHasDragged(false)
        }}
      />
    </KakaoMapWrapper>
  )
}