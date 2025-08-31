'use client'

import { useEffect, useState } from 'react'
import { Map, MapMarker, Circle } from 'react-kakao-maps-sdk'
import type { ErrandLocation, User } from '../lib/types'
import { getDefaultProfileImage } from '../lib/imageUtils'
import { createProfileMarkerImage } from '../lib/profileMarker'
import { getRadiusFromZoomLevel } from '../lib/mapUtils'
import { getDefaultMarkerImages } from '../lib/categoryUtils'
import KakaoMapWrapper from './KakaoMapWrapper'

interface MapComponentProps {
  onLocationSelect?: (lat: number, lng: number) => void
  errands?: ErrandLocation[]
  currentUser?: User | null
  onRadiusChange?: (radius: number) => void
  userLocation?: { lat: number; lng: number } | null
  centerLocation?: { lat: number; lng: number } | null
  selectedErrandId?: string | null
}

export default function MapComponent({ 
  onLocationSelect, 
  errands = [], 
  currentUser, 
  onRadiusChange,
  userLocation: propUserLocation,
  centerLocation,
  selectedErrandId
}: MapComponentProps) {
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(propUserLocation || null)
  const [selectedErrand, setSelectedErrand] = useState<ErrandLocation | null>(null)
  const [userMarkerImage, setUserMarkerImage] = useState<string | null>(null)
  const [currentZoom, setCurrentZoom] = useState(3)
  const [defaultMarkers, setDefaultMarkers] = useState<Record<string, string>>({})
  const [animatingMarker, setAnimatingMarker] = useState<string | null>(null)
  const [animationRadius, setAnimationRadius] = useState(0)

  // centerLocation이 변경되면 지도 중심 이동
  useEffect(() => {
    if (centerLocation) {
      setMapCenter(centerLocation)
    } else if (propUserLocation) {
      setMapCenter(propUserLocation)
    } else if (errands.length > 0) {
      // 심부름이 있으면 첫 번째 심부름 위치로
      setMapCenter({
        lat: errands[0].lat,
        lng: errands[0].lng,
      })
    }
  }, [centerLocation, propUserLocation, errands])

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
      const profileImageSrc = currentUser.profileImage || getDefaultProfileImage(currentUser.name)
      createProfileMarkerImage(profileImageSrc)
        .then(markerImage => setUserMarkerImage(markerImage))
        .catch(error => {
          console.error('프로필 마커 생성 실패:', error)
          setUserMarkerImage(null)
        })
    }
  }, [currentUser])

  // 외부에서 선택된 심부름에 대한 반복 파동 애니메이션 효과
  useEffect(() => {
    if (selectedErrandId && errands.length > 0) {
      const errand = errands.find(e => e.id === selectedErrandId)
      if (errand) {
        setSelectedErrand(errand)
        setAnimatingMarker(errand.id)
        
        // 무한 반복 파동 애니메이션
        let intervalId: NodeJS.Timeout
        
        const createContinuousRipple = () => {
          intervalId = setInterval(() => {
            if (selectedErrandId === errand.id) {
              let startTime: number | null = null
              const duration = 800 // 0.8초 동안 퍼짐
              const maxRadius = 500 // 더 크게 퍼지도록
              
              const animate = (timestamp: number) => {
                if (!startTime) startTime = timestamp
                const elapsed = timestamp - startTime
                const progress = Math.min(elapsed / duration, 1)
                
                // 부드러운 확장
                const currentRadius = 8 + (maxRadius - 8) * progress
                setAnimationRadius(currentRadius)
                
                if (progress < 1 && selectedErrandId === errand.id) {
                  requestAnimationFrame(animate)
                }
              }
              
              requestAnimationFrame(animate)
            }
          }, 1000)
        }
        
        // 즉시 첫 파동 시작하고 무한 반복 설정
        createContinuousRipple()
        
        // 정리 함수
        return () => {
          if (intervalId) {
            clearInterval(intervalId)
          }
        }
      }
    } else {
      setAnimatingMarker(null)
      setAnimationRadius(0)
    }
  }, [selectedErrandId, errands])

  const handleMapClick = (_target: unknown, mouseEvent: { latLng: { getLat: () => number; getLng: () => number } }) => {
    if (onLocationSelect) {
      const latlng = mouseEvent.latLng
      onLocationSelect(latlng.getLat(), latlng.getLng())
    }
  }

  const handleZoomChanged = (map: { getLevel: () => number }) => {
    const newZoom = map.getLevel()
    setCurrentZoom(newZoom)
    
    if (onRadiusChange) {
      const newRadius = getRadiusFromZoomLevel(newZoom)
      onRadiusChange(newRadius)
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
        >
          {errands.map((errand) => (
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
              }}
            />
          ))}
          
          {currentUser && userMarkerImage && propUserLocation && (
            <MapMarker
              position={propUserLocation}
              image={{
                src: userMarkerImage,
                size: { width: 40, height: 40 },
              }}
            />
          )}
          
          {/* 목록에서 선택된 심부름 파동 애니메이션 서클 */}
          {selectedErrand && animatingMarker === selectedErrand.id && animationRadius > 0 && (
            <Circle
              center={{ lat: selectedErrand.lat, lng: selectedErrand.lng }}
              radius={animationRadius}
              strokeWeight={3}
              strokeColor="#3B82F6"
              strokeOpacity={Math.max(0.9 - (animationRadius / 500) * 0.85, 0.05)}
              fillColor="#3B82F6"
              fillOpacity={Math.max(0.2 - (animationRadius / 500) * 0.195, 0.005)}
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
              <button className="w-full mt-3 bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                심부름 수락하기
              </button>
            )}
          </div>
        )}
      </div>
    </KakaoMapWrapper>
  )
}