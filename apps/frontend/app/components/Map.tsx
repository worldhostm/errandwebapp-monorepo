'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { Map, MapMarker, Circle } from 'react-kakao-maps-sdk'
import type { ErrandLocation, User } from '../lib/types'
import { getDefaultProfileImage } from '../lib/imageUtils'
import { createProfileMarkerImage } from '../lib/profileMarker'
import { getRadiusFromZoomLevel } from '../lib/mapUtils'
import { getDefaultMarkerImages } from '../lib/categoryUtils'
import { createClusters, createClusterMarkerImage, type ClusterMarker } from '../lib/clustering'
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
  onErrandClick?: (errand: ErrandLocation) => void
  onMoveToCurrentLocation?: () => void
  testMarker?: { lat: number; lng: number } | null
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
  onErrandClick,
  onMoveToCurrentLocation,
  testMarker
}: MapComponentProps) {
  
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(propUserLocation || null)
  const [userMarkerImage, setUserMarkerImage] = useState<string | null>(null)
  const [currentZoom, setCurrentZoom] = useState(3)
  const [, setDefaultMarkers] = useState<Record<string, string>>({})
  const [clusters, setClusters] = useState<ClusterMarker[]>([])
  const [unclusteredErrands, setUnclusteredErrands] = useState<ErrandLocation[]>([])
  const [clusterImages, setClusterImages] = useState<Record<string, string>>({})
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [currentLocationPulse, setCurrentLocationPulse] = useState(0)
  const [errandLocationPulse, setErrandLocationPulse] = useState(0)
  const [pulsingErrandId, setPulsingErrandId] = useState<string | null>(null)
  const [userHasDragged, setUserHasDragged] = useState(false)
  const [showClusterModal, setShowClusterModal] = useState(false)
  const [selectedCluster, setSelectedCluster] = useState<ClusterMarker | null>(null)
  const [showSearchButton, setShowSearchButton] = useState(false)
  const [pendingSearchLocation, setPendingSearchLocation] = useState<{ center: { lat: number; lng: number }, bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } } | null>(null)

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


  // 단순한 수동 검색 핸들러
  const handleManualSearch = useCallback((center: { lat: number; lng: number }, bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }) => {
    if (onMapMove) {
      onMapMove(center, bounds)
      console.log('🔍 수동 검색 실행')
    }
  }, [onMapMove])

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      console.log('🧹 Map 컴포넌트 언마운트 정리 완료')
    }
  }, [])

  // centerLocation이 변경되면 지도 중심 이동
  useEffect(() => {
    if (centerLocation) {
      // 지도에서 드래그하면 다시 중앙으로 돌아가는 현상 방지 주석
      // setMapCenter(centerLocation)
      // 프로그래밍적 이동이므로 드래그 상태 초기화
      // setUserHasDragged(false)
      console.log('🎯 프로그래밍적 이동 - 드래그 상태 초기화')
    } else if (propUserLocation && !mapCenter) {
      setMapCenter(propUserLocation)
    } else if (errands.length > 0 && !mapCenter) {
      setMapCenter({ lat: errands[0].lat, lng: errands[0].lng })
    }
  }, [centerLocation, propUserLocation, errands, mapCenter])


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
        setUnclusteredErrands(unclustered as ErrandLocation[])

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
  }, [errands, currentZoom])

  // 외부에서 선택된 심부름 처리 (맥동 애니메이션 적용)
  useEffect(() => {
    if (selectedErrandId && errands.length > 0) {
      const errand = errands.find(e => e.id === selectedErrandId)
      if (errand) {
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

  const handleMapMove = (map: { getCenter: () => { getLat: () => number; getLng: () => number }; getBounds: () => { getSouthWest: () => { getLat: () => number; getLng: () => number }; getNorthEast: () => { getLat: () => number; getLng: () => number } } }, isDrag = false) => {
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
      
      // 단순화된 처리 방식
      if (isDrag) {
        // 사용자 드래그: 수동 검색 버튼만 표시
        setPendingSearchLocation({ center: mapCenter, bounds: mapBounds })
        setShowSearchButton(true)
        setUserHasDragged(true)
        console.log('📍 드래그: 수동 검색 버튼 활성화')
      } 
      // else {
      //   // 프로그래밍적 이동: 자동 검색
      //   if (onMapMove) {
      //     onMapMove(mapCenter, mapBounds)
      //     console.log('🚀 프로그래밍적 이동: 자동 검색')
      //   }
      // }
    } catch (error) {
      console.error('지도 이동 처리 중 오류:', error)
    }
  }

  const handleMapDrag = (map: { getCenter: () => { getLat: () => number; getLng: () => number }; getBounds: () => { getSouthWest: () => { getLat: () => number; getLng: () => number }; getNorthEast: () => { getLat: () => number; getLng: () => number } } }) => {
    handleMapMove(map, true) // isDrag = true
  }

  if (!mapCenter) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
        위치 정보 로딩 중...
      </div>
    )
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
          onDragEnd={handleMapDrag}
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
                  
                  // 마커 클릭으로 인한 지도 중심 이동은 드래그가 아님
                  // 단, userHasDragged는 건드리지 않아 드래그 기능에 영향을 주지 않음
                  setMapCenter({ lat: errand.lat, lng: errand.lng })
                  
                  // 마커 클릭 후에는 검색 버튼 숨기기 (새 위치로 이동했으므로)
                  setShowSearchButton(false)
                }}
              />
            )
          })}
          
          
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
          
          {/* 테스트 마커 (위도/경도 입력용) */}
          {testMarker && (
            <MapMarker
              position={testMarker}
              title={`테스트 마커 (${testMarker.lat.toFixed(6)}, ${testMarker.lng.toFixed(6)})`}
              image={{
                src: '/marker-purple.svg',
                size: { width: 32, height: 42 },
              }}
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
        


        {/* 수동 검색 버튼 */}
        {showSearchButton && pendingSearchLocation && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
            <button
              onClick={() => {
                if (pendingSearchLocation) {
                  console.log('🔍 수동 검색 실행:', pendingSearchLocation.center)
                  handleManualSearch(pendingSearchLocation.center, pendingSearchLocation.bounds)
                  setShowSearchButton(false)
                  setPendingSearchLocation(null)
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
            >
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
              </svg>
              현재 위치에서 검색
            </button>
          </div>
        )}

        {/* 현재위치 이동 버튼 */}
        {propUserLocation && onMoveToCurrentLocation && (
          <div className="absolute bottom-4 right-4 z-10">
            <button
              onClick={() => {
                onMoveToCurrentLocation()
                // 현재 위치로 이동 시 검색 버튼 숨기기
                setShowSearchButton(false)
                setPendingSearchLocation(null)
              }}
              className="bg-white hover:bg-gray-50 border border-gray-200 rounded-full p-3 shadow-lg transition-colors duration-200 flex items-center justify-center"
              title="현재 위치로 이동"
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-700"
              >
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="currentColor"/>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
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
          
          // 클러스터에서 심부름 선택으로 인한 지도 중심 이동은 드래그가 아님
          // userHasDragged 상태는 건드리지 않아 드래그 기능에 영향을 주지 않음
          setMapCenter({ lat: errand.lat, lng: errand.lng })
          
          // 모달 닫기 및 검색 버튼 숨기기
          setShowClusterModal(false)
          setSelectedCluster(null)
          setShowSearchButton(false)
          setPendingSearchLocation(null)
        }}
      />
    </KakaoMapWrapper>
  )
}