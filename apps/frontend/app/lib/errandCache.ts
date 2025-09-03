import type { ErrandLocation } from './types'

// 캐시 엔트리 타입
interface CacheEntry {
  data: ErrandLocation[]
  timestamp: number
  bounds: {
    sw: { lat: number; lng: number }
    ne: { lat: number; lng: number }
  }
  center: { lat: number; lng: number }
  radius: number
}

// 캐시 설정
const CACHE_DURATION = 5 * 60 * 1000 // 5분
const MAX_CACHE_SIZE = 20 // 최대 20개 지역 캐시
const OVERLAP_THRESHOLD = 0.7 // 70% 이상 겹치면 캐시 재사용

class ErrandCacheManager {
  private cache = new Map<string, CacheEntry>()

  // 캐시 키 생성
  private generateCacheKey(center: { lat: number; lng: number }, radius: number): string {
    return `${center.lat.toFixed(4)}_${center.lng.toFixed(4)}_${radius}`
  }

  // 두 지역 간 겹치는 비율 계산
  private calculateOverlap(
    bounds1: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } },
    bounds2: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }
  ): number {
    // 교집합 영역 계산
    const intersectSW = {
      lat: Math.max(bounds1.sw.lat, bounds2.sw.lat),
      lng: Math.max(bounds1.sw.lng, bounds2.sw.lng)
    }
    const intersectNE = {
      lat: Math.min(bounds1.ne.lat, bounds2.ne.lat),
      lng: Math.min(bounds1.ne.lng, bounds2.ne.lng)
    }

    // 교집합이 없는 경우
    if (intersectSW.lat >= intersectNE.lat || intersectSW.lng >= intersectNE.lng) {
      return 0
    }

    // 교집합 면적
    const intersectArea = (intersectNE.lat - intersectSW.lat) * (intersectNE.lng - intersectSW.lng)
    
    // bounds2 면적 (요청된 영역)
    const bounds2Area = (bounds2.ne.lat - bounds2.sw.lat) * (bounds2.ne.lng - bounds2.sw.lng)

    return intersectArea / bounds2Area
  }

  // 캐시에서 데이터 조회
  get(
    center: { lat: number; lng: number },
    bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } },
    radius: number
  ): ErrandLocation[] | null {
    // 만료된 캐시 정리
    this.cleanExpiredEntries()

    // 정확한 매치 확인
    const exactKey = this.generateCacheKey(center, radius)
    const exactEntry = this.cache.get(exactKey)
    if (exactEntry && this.isValidEntry(exactEntry)) {
      console.log('🎯 정확한 캐시 히트:', exactKey)
      return exactEntry.data
    }

    // 겹치는 영역이 있는 캐시 찾기
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValidEntry(entry)) continue

      const overlap = this.calculateOverlap(entry.bounds, bounds)
      if (overlap >= OVERLAP_THRESHOLD) {
        console.log(`🎯 부분 캐시 히트 (${(overlap * 100).toFixed(1)}% 겹침):`, key)
        // 요청된 bounds 내의 심부름만 필터링해서 반환
        return this.filterErrandsByBounds(entry.data, bounds)
      }
    }

    console.log('❌ 캐시 미스:', exactKey)
    return null
  }

  // 캐시에 데이터 저장
  set(
    center: { lat: number; lng: number },
    bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } },
    radius: number,
    data: ErrandLocation[]
  ): void {
    // 캐시 크기 제한
    if (this.cache.size >= MAX_CACHE_SIZE) {
      this.evictOldestEntry()
    }

    const key = this.generateCacheKey(center, radius)
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      bounds,
      center,
      radius
    }

    this.cache.set(key, entry)
    console.log('💾 캐시 저장:', key, `(${data.length}개 심부름)`)
  }

  // bounds 내 심부름 필터링
  private filterErrandsByBounds(
    errands: ErrandLocation[],
    bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }
  ): ErrandLocation[] {
    return errands.filter(errand => 
      errand.lat >= bounds.sw.lat &&
      errand.lat <= bounds.ne.lat &&
      errand.lng >= bounds.sw.lng &&
      errand.lng <= bounds.ne.lng
    )
  }

  // 캐시 엔트리 유효성 확인
  private isValidEntry(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < CACHE_DURATION
  }

  // 만료된 캐시 정리
  private cleanExpiredEntries(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= CACHE_DURATION) {
        this.cache.delete(key)
        console.log('🧹 만료된 캐시 제거:', key)
      }
    }
  }

  // 가장 오래된 캐시 제거
  private evictOldestEntry(): void {
    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      console.log('🧹 오래된 캐시 제거:', oldestKey)
    }
  }

  // 캐시 상태 정보
  getStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  // 캐시 초기화
  clear(): void {
    this.cache.clear()
    console.log('🧹 캐시 전체 초기화')
  }

  // 특정 지역 캐시 무효화 (심부름 등록/수정 시 사용)
  invalidateRegion(center: { lat: number; lng: number }, radiusKm: number = 10): void {
    const keysToRemove: string[] = []
    
    for (const [key, entry] of this.cache.entries()) {
      // 중심점 간 거리 계산
      const distance = this.calculateDistance(center, entry.center)
      if (distance <= radiusKm) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => {
      this.cache.delete(key)
      console.log('🧹 지역 캐시 무효화:', key)
    })
  }

  // 거리 계산 (Haversine formula)
  private calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371 // 지구 반지름 (km)
    const dLat = (point2.lat - point1.lat) * Math.PI / 180
    const dLng = (point2.lng - point1.lng) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }
}

// 싱글톤 인스턴스
export const errandCache = new ErrandCacheManager()