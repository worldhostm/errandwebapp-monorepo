export const handleImageUpload = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('올바른 이미지 파일을 선택해주세요.'))
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB 제한
      reject(new Error('이미지 크기는 5MB 이하여야 합니다.'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // 정사각형으로 자르기 위한 크기 계산
        const size = Math.min(img.width, img.height)
        const x = (img.width - size) / 2
        const y = (img.height - size) / 2
        
        canvas.width = 200
        canvas.height = 200
        
        if (ctx) {
          ctx.drawImage(img, x, y, size, size, 0, 0, 200, 200)
          resolve(canvas.toDataURL('image/jpeg', 0.8))
        } else {
          reject(new Error('이미지 처리 중 오류가 발생했습니다.'))
        }
      }
      img.onerror = () => reject(new Error('이미지 로드 중 오류가 발생했습니다.'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('파일 읽기 중 오류가 발생했습니다.'))
    reader.readAsDataURL(file)
  })
}

export const getDefaultProfileImage = (name: string): string => {
  // 이름의 첫 글자로 기본 프로필 이미지 생성
  const canvas = document.createElement('canvas')
  canvas.width = 40
  canvas.height = 40
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    // 배경색 (이름 기반 해시)
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
    ]
    const colorIndex = name.charCodeAt(0) % colors.length
    
    ctx.fillStyle = colors[colorIndex]
    ctx.fillRect(0, 0, 40, 40)
    
    // 텍스트
    ctx.fillStyle = 'white'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(name.charAt(0).toUpperCase(), 20, 20)
  }
  
  return canvas.toDataURL()
}