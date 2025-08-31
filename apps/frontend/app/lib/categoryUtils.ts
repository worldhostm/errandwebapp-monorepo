export interface CategoryInfo {
  emoji: string
  name: string
  color: string
}

export const categoryMap: { [key: string]: CategoryInfo } = {
  '배달/픽업': {
    emoji: '🚚',
    name: '배달/픽업',
    color: 'bg-blue-100 text-blue-800'
  },
  '쇼핑/구매': {
    emoji: '🛒',
    name: '쇼핑/구매',
    color: 'bg-green-100 text-green-800'
  },
  '청소/정리': {
    emoji: '🧹',
    name: '청소/정리',
    color: 'bg-purple-100 text-purple-800'
  },
  '이사/운반': {
    emoji: '📦',
    name: '이사/운반',
    color: 'bg-orange-100 text-orange-800'
  },
  '기타': {
    emoji: '💼',
    name: '기타',
    color: 'bg-gray-100 text-gray-800'
  }
}

export const getCategoryInfo = (category: string): CategoryInfo => {
  return categoryMap[category] || categoryMap['기타']
}

export const getDefaultMarkerImages = () => {
  // 기본 마커 이미지들을 data URL로 생성
  const createMarkerDataUrl = (color: string, emoji?: string) => {
    const canvas = document.createElement('canvas')
    canvas.width = 35
    canvas.height = 35
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return ''
    
    // 원형 배경
    ctx.beginPath()
    ctx.arc(17.5, 17.5, 15, 0, 2 * Math.PI)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 2
    ctx.stroke()
    
    // 이모지 또는 점
    if (emoji) {
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(emoji, 17.5, 17.5)
    } else {
      ctx.beginPath()
      ctx.arc(17.5, 17.5, 3, 0, 2 * Math.PI)
      ctx.fillStyle = 'white'
      ctx.fill()
    }
    
    return canvas.toDataURL()
  }

  return {
    pending: createMarkerDataUrl('#FCD34D', '⏳'),
    urgent: createMarkerDataUrl('#EF4444', '🚨'),
    accepted: createMarkerDataUrl('#F97316', '✅'),
    inProgress: createMarkerDataUrl('#3B82F6', '🔄'),
    completed: createMarkerDataUrl('#10B981', '✅')
  }
}