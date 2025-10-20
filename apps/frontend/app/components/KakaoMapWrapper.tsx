'use client'

import { useEffect, useState } from 'react'

// 카카오 타입은 이미 kakao.d.ts에서 정의됨

interface KakaoMapWrapperProps {
  children: React.ReactNode
}

export default function KakaoMapWrapper({ children }: KakaoMapWrapperProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const initKakaoMaps = () => {
      if (typeof window !== 'undefined' && window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          setIsLoaded(true)
        })
      } else {
        // Kakao Maps가 로드될 때까지 대기
        setTimeout(initKakaoMaps, 100)
      }
    }

    initKakaoMaps()
  }, [])

  if (!isLoaded) {
    return (
      <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-black">카카오 지도를 로딩 중...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}