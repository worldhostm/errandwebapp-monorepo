'use client'

import { useEffect, useState } from 'react'

// KakaoMapLoader는 kakao 객체 타입을 간단히 정의

export function useKakaoMapsLoaded() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const checkKakaoMaps = () => {
      if (typeof window !== 'undefined' && 
          window.kakao && 
          window.kakao.maps && 
          window.kakao.maps.LatLng &&
          window.kakao.maps.Map) {
        // Kakao Maps API 초기화
        window.kakao.maps.load(() => {
          setIsLoaded(true)
        })
        return true
      }
      return false
    }

    if (checkKakaoMaps()) {
      return
    }

    const interval = setInterval(() => {
      if (checkKakaoMaps()) {
        clearInterval(interval)
      }
    }, 100)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      console.error('Kakao Maps failed to load within timeout')
    }, 10000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  return isLoaded
}