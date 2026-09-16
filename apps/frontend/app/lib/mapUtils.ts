import type { ErrandLocation } from './types'

// 지도 핀 색상 정의 (Map.tsx 마커 SVG와 카드 UI 색상 동기화)
export const PIN_COLORS = [
  { svg: '/marker-red.svg',    css: '#EF4444' },
  { svg: '/marker-blue.svg',   css: '#3B82F6' },
  { svg: '/marker-green.svg',  css: '#22C55E' },
  { svg: '/marker-orange.svg', css: '#F97316' },
  { svg: '/marker-purple.svg', css: '#A855F7' },
] as const

// 전체 심부름 배열에서 해당 심부름의 핀 색상 인덱스 반환
export const getPinColorIndex = (errandId: string, allErrands: { id: string }[]): number => {
  const index = allErrands.findIndex(e => e.id === errandId)
  return (index === -1 ? 0 : index) % PIN_COLORS.length
}

// 두 지점 간 거리 계산 (Haversine formula)
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// 지도 줌 레벨에 따른 반경 계산
export const getRadiusFromZoomLevel = (zoomLevel: number): number => {
  // 줌 레벨에 따른 대략적인 반경 (km)
  const radiusMap: { [key: number]: number } = {
    1: 100,
    2: 50,
    3: 25,
    4: 12,
    5: 6,
    6: 3,
    7: 1.5,
    8: 0.8,
    9: 0.4,
    10: 0.2,
    11: 0.1,
    12: 0.05,
    13: 0.025,
    14: 0.01
  }
  return radiusMap[zoomLevel] || 10
}

// 반경 내 심부름 필터링
export const filterErrandsByRadius = (
  errands: ErrandLocation[],
  userLat: number,
  userLng: number,
  radiusKm: number
): ErrandLocation[] => {
  return errands
    .map(errand => ({
      ...errand,
      distance: calculateDistance(userLat, userLng, errand.lat, errand.lng)
    }))
    .filter(errand => errand.distance! <= radiusKm)
    .sort((a, b) => a.distance! - b.distance!)
}

// 마감 시간 임박 여부 확인 (6시간 이내)
export const isDeadlineUrgent = (deadline: string): boolean => {
  const deadlineTime = new Date(deadline).getTime()
  const now = new Date().getTime()
  const sixHoursInMs = 6 * 60 * 60 * 1000
  return deadlineTime - now <= sixHoursInMs && deadlineTime > now
}

// 심부름 데이터 가공 (거리, 긴급도 추가)
export const processErrands = (
  errands: ErrandLocation[],
  userLat: number,
  userLng: number,
  radiusKm: number = 10
): ErrandLocation[] => {
  return filterErrandsByRadius(errands, userLat, userLng, radiusKm)
    .map(errand => ({
      ...errand,
      isUrgent: isDeadlineUrgent(errand.deadline)
    }))
}