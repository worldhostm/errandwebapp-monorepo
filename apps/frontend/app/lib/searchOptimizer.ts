// 검색 요청 큐 관리 및 최적화
class SearchOptimizer {
  private requestQueue: Map<string, AbortController> = new Map()
  private lastSuccessfulSearch: {
    center: { lat: number; lng: number }
    timestamp: number
    bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }
  } | null = null

  // 요청 키 생성
  private generateRequestKey(center: { lat: number; lng: number }, bounds?: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }): string {
    if (bounds) {
      return `bounds_${bounds.sw.lat}_${bounds.sw.lng}_${bounds.ne.lat}_${bounds.ne.lng}`
    }
    return `center_${center.lat.toFixed(4)}_${center.lng.toFixed(4)}`
  }

  // 중복 요청 체크 및 관리
  async optimizedRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      center: { lat: number; lng: number }
      bounds?: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } }
      minInterval?: number
    }
  ): Promise<T | null> {
    const { center, bounds, minInterval = 500 } = options

    // 최소 간격 체크
    if (this.lastSuccessfulSearch && minInterval > 0) {
      const timeSinceLastSearch = Date.now() - this.lastSuccessfulSearch.timestamp
      if (timeSinceLastSearch < minInterval) {
        console.log(`⏰ 최소 검색 간격 미충족 (${timeSinceLastSearch}ms < ${minInterval}ms)`)
        return null
      }

      // 동일 위치 재검색 방지
      if (this.isSameLocation(center, this.lastSuccessfulSearch.center, 0.001)) {
        console.log('🚫 동일 위치 재검색 방지')
        return null
      }
    }

    // 기존 요청 취소
    const existingController = this.requestQueue.get(key)
    if (existingController) {
      existingController.abort()
      console.log('🚫 기존 요청 취소:', key)
    }

    // 새 요청 생성
    const controller = new AbortController()
    this.requestQueue.set(key, controller)

    try {
      console.log('🚀 최적화된 요청 시작:', key)
      const result = await requestFn()
      
      // 성공한 검색 기록
      this.lastSuccessfulSearch = {
        center,
        bounds: bounds || this.lastSuccessfulSearch?.bounds || { sw: center, ne: center },
        timestamp: Date.now()
      }

      console.log('✅ 최적화된 요청 완료:', key)
      return result
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🚫 요청 취소됨:', key)
        return null
      }
      throw error
    } finally {
      this.requestQueue.delete(key)
    }
  }

  // 위치 동일성 체크
  private isSameLocation(
    pos1: { lat: number; lng: number },
    pos2: { lat: number; lng: number },
    threshold: number = 0.001
  ): boolean {
    return Math.abs(pos1.lat - pos2.lat) < threshold && 
           Math.abs(pos1.lng - pos2.lng) < threshold
  }

  // 모든 진행 중인 요청 취소
  cancelAll(): void {
    for (const [key, controller] of this.requestQueue.entries()) {
      controller.abort()
      console.log('🚫 진행 중인 요청 취소:', key)
    }
    this.requestQueue.clear()
  }

  // 상태 정보
  getStatus(): { activeRequests: number; lastSearch: { timestamp: number; center: { lat: number; lng: number }; bounds: { sw: { lat: number; lng: number }; ne: { lat: number; lng: number } } } | null } {
    return {
      activeRequests: this.requestQueue.size,
      lastSearch: this.lastSuccessfulSearch
    }
  }
}

export const searchOptimizer = new SearchOptimizer()

// 스마트 디바운스 함수
export function createSmartDebounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number,
  options?: {
    leading?: boolean
    maxWait?: number
  }
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: NodeJS.Timeout | null = null
  let maxTimeoutId: NodeJS.Timeout | null = null
  let lastArgs: Parameters<T>
  let result: ReturnType<T>

  const { leading = false, maxWait } = options || {}

  function invokeFunc() {
    const args = lastArgs
    timeoutId = null
    maxTimeoutId = null
    result = func(...args) as ReturnType<T>
    return result
  }

  function startTimer(pendingFunc: () => void, wait: number) {
    return setTimeout(pendingFunc, wait)
  }

  function cancel() {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    if (maxTimeoutId) {
      clearTimeout(maxTimeoutId)
      maxTimeoutId = null
    }
  }

  function flush() {
    return timeoutId ? invokeFunc() : result
  }

  function debounced(...args: Parameters<T>): ReturnType<T> | undefined {
    lastArgs = args

    const shouldCallNow = leading && !timeoutId

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (maxWait && !maxTimeoutId && !shouldCallNow) {
      maxTimeoutId = startTimer(invokeFunc, maxWait)
    }

    timeoutId = startTimer(invokeFunc, delay)

    if (shouldCallNow) {
      return invokeFunc()
    }
    return undefined
  }

  debounced.cancel = cancel
  debounced.flush = flush

  return debounced as unknown as T & { cancel: () => void; flush: () => void }
}

// 지능형 배치 요청 처리
export class BatchRequestManager {
  private batches = new Map<string, {
    requests: Array<{
      key: string
      resolve: (value: unknown) => void
      reject: (error: unknown) => void
    }>
    timer: NodeJS.Timeout
  }>()

  private readonly batchDelay = 100 // 100ms 내 요청들을 배치 처리
  private readonly maxBatchSize = 10

  async addRequest<T>(
    batchKey: string,
    requestKey: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _requestFn: () => Promise<T>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let batch = this.batches.get(batchKey)

      if (!batch) {
        batch = {
          requests: [],
          timer: setTimeout(() => this.processBatch(batchKey), this.batchDelay)
        }
        this.batches.set(batchKey, batch)
      }

      batch.requests.push({ key: requestKey, resolve: resolve as (value: unknown) => void, reject })

      // 배치 크기 제한
      if (batch.requests.length >= this.maxBatchSize) {
        clearTimeout(batch.timer)
        this.processBatch(batchKey)
      }
    })
  }

  private async processBatch(batchKey: string) {
    const batch = this.batches.get(batchKey)
    if (!batch) return

    this.batches.delete(batchKey)

    console.log(`📦 배치 처리 시작: ${batchKey} (${batch.requests.length}개 요청)`)

    // 모든 요청을 병렬로 처리
    const results = await Promise.allSettled(
      batch.requests.map(async ({ key }) => {
        // 실제 구현에서는 여기서 개별 요청을 처리
        // 현재는 placeholder
        return { key, data: null }
      })
    )

    // 결과를 각 요청의 resolve/reject로 전달
    results.forEach((result, index) => {
      const request = batch.requests[index]
      if (result.status === 'fulfilled') {
        request.resolve(result.value)
      } else {
        request.reject(result.reason)
      }
    })

    console.log(`✅ 배치 처리 완료: ${batchKey}`)
  }
}

export const batchRequestManager = new BatchRequestManager()