export interface ClusterMarker {
  lat: number
  lng: number
  count: number
  items: ClusterableItem[]
  id: string
}

export interface ClusterableItem {
  id: string
  lat: number
  lng: number
  [key: string]: unknown
}

// const CLUSTER_DISTANCE = 60 // 픽셀 단위 클러스터링 거리 (reserved for future use)
const MIN_ZOOM_FOR_CLUSTERING = 5 // 줌 레벨 5 이상에서만 클러스터링

export function shouldCluster(zoomLevel: number): boolean {
  return zoomLevel >= MIN_ZOOM_FOR_CLUSTERING
}

export function createClusters<T extends ClusterableItem>(
  items: T[],
  zoomLevel: number,
  mapBounds?: {
    sw: { lat: number; lng: number }
    ne: { lat: number; lng: number }
  }
): { clusters: ClusterMarker[]; unclustered: T[] } {
  if (!shouldCluster(zoomLevel) || items.length === 0) {
    return { clusters: [], unclustered: items }
  }

  // 화면 영역 내의 아이템만 필터링
  const visibleItems = mapBounds 
    ? items.filter(item => 
        item.lat >= mapBounds.sw.lat && 
        item.lat <= mapBounds.ne.lat &&
        item.lng >= mapBounds.sw.lng && 
        item.lng <= mapBounds.ne.lng
      )
    : items

  const clusters: ClusterMarker[] = []
  const clustered = new Set<string>()
  const unclustered: T[] = []

  // 거리 계산 함수 (하버사인 공식)
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000 // 지구 반지름 (미터)
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // 줌 레벨에 따른 클러스터링 거리 조정
  const clusterDistance = getClusterDistanceByZoom(zoomLevel)

  for (let i = 0; i < visibleItems.length; i++) {
    const item = visibleItems[i]
    
    if (clustered.has(item.id)) continue

    const cluster: ClusterMarker = {
      lat: item.lat,
      lng: item.lng,
      count: 1,
      items: [item],
      id: `cluster-${item.id}-${Date.now()}`
    }

    clustered.add(item.id)

    // 다른 아이템들과 거리 비교
    for (let j = i + 1; j < visibleItems.length; j++) {
      const otherItem = visibleItems[j]
      
      if (clustered.has(otherItem.id)) continue

      const distance = calculateDistance(item.lat, item.lng, otherItem.lat, otherItem.lng)
      
      if (distance <= clusterDistance) {
        // 클러스터에 추가
        cluster.items.push(otherItem)
        cluster.count++
        clustered.add(otherItem.id)
        
        // 클러스터 중심점 재계산 (평균)
        cluster.lat = cluster.items.reduce((sum, item) => sum + item.lat, 0) / cluster.items.length
        cluster.lng = cluster.items.reduce((sum, item) => sum + item.lng, 0) / cluster.items.length
      }
    }

    if (cluster.count > 1) {
      clusters.push(cluster)
    } else {
      unclustered.push(item)
    }
  }

  // 화면 밖의 아이템들도 unclustered에 추가
  if (mapBounds) {
    const outsideItems = items.filter(item => 
      item.lat < mapBounds.sw.lat || 
      item.lat > mapBounds.ne.lat ||
      item.lng < mapBounds.sw.lng || 
      item.lng > mapBounds.ne.lng
    )
    unclustered.push(...outsideItems)
  }

  return { clusters, unclustered }
}

function getClusterDistanceByZoom(zoomLevel: number): number {
  // 줌 레벨이 높을수록 (가까이 볼수록) 클러스터링 거리를 줄임
  const baseDistance = 1000 // 1km
  const zoomFactor = Math.pow(2, 8 - zoomLevel) // 줌 레벨에 따른 배율
  return baseDistance * zoomFactor
}

export function createClusterMarkerImage(count: number): string {
  if (typeof window === 'undefined') return ''

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const size = count > 99 ? 50 : count > 9 ? 45 : 40
  canvas.width = size
  canvas.height = size

  // 배경 원
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI)
  ctx.fillStyle = count > 99 ? '#DC2626' : count > 9 ? '#EA580C' : '#2563EB'
  ctx.fill()
  
  // 테두리
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 3
  ctx.stroke()

  // 숫자 텍스트
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold ${count > 99 ? '12px' : count > 9 ? '14px' : '16px'} Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(count.toString(), size / 2, size / 2)

  return canvas.toDataURL()
}