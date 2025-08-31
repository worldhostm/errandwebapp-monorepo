export const createProfileMarkerImage = (profileImageSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      
      const size = 40
      canvas.width = size
      canvas.height = size
      
      // 원형 클리핑 패스 생성
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI)
      ctx.clip()
      
      // 프로필 이미지 그리기
      ctx.drawImage(img, 0, 0, size, size)
      
      // 테두리 추가
      ctx.globalCompositeOperation = 'source-over'
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, 2 * Math.PI)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      
      // 외곽 테두리
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, 2 * Math.PI)
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.stroke()
      
      resolve(canvas.toDataURL())
    }
    
    img.onerror = () => reject(new Error('Failed to load profile image'))
    img.src = profileImageSrc
  })
}