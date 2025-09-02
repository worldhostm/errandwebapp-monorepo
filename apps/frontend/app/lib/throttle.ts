// 쓰로틀링 유틸리티 함수
export function throttle<T extends (...args: never[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0

  return (...args: Parameters<T>) => {
    const currentTime = Date.now()

    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

// 디바운싱 유틸리티 함수 (지도 이동 완료 후 조회용)
export function debounce<T extends (...args: never[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

// 위치 기반 심부름 조회를 위한 특화된 디바운스 함수
export function debounceLocationQuery<T extends (...args: never[]) => unknown>(
  func: T,
  delay: number = 1000
): (...args: Parameters<T>) => void {
  return debounce(func, delay)
}