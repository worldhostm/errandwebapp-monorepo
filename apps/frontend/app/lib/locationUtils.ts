// 위치 권한 상태 확인
export const checkLocationPermission = async (): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> => {
  if (!navigator.geolocation) {
    return 'unsupported'
  }

  if (!navigator.permissions) {
    // permissions API가 없으면 직접 확인 불가, prompt로 처리
    return 'prompt'
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' })
    return permission.state as 'granted' | 'denied' | 'prompt'
  } catch (error) {
    console.warn('위치 권한 확인 실패:', error)
    return 'prompt'
  }
}

// 위치 권한 요청 및 현재 위치 가져오기
export const requestLocationWithPermission = (): Promise<{
  success: boolean
  location?: { lat: number; lng: number }
  error?: string
}> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: '이 브라우저는 위치 서비스를 지원하지 않습니다.'
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        console.log('위치 정보 취득 성공:', location)
        console.log('위치 정확도:', position.coords.accuracy, 'meters')
        
        resolve({
          success: true,
          location
        })
      },
      (error) => {
        let errorMessage = '위치 정보를 가져올 수 없습니다.'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 권한이 거부되었습니다.'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.'
            break
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청 시간이 초과되었습니다.'
            break
        }
        
        console.warn(errorMessage, error)
        resolve({
          success: false,
          error: errorMessage
        })
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    )
  })
}