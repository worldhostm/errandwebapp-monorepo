'use client'

import { User } from '../lib/types'

interface VerificationBadgeProps {
  user: User
  size?: 'small' | 'medium' | 'large'
  showLabel?: boolean
}

export default function VerificationBadge({ user, size = 'medium', showLabel = false }: VerificationBadgeProps) {
  if (!user.isVerified || !user.verificationLevel || user.verificationLevel === 0) {
    return null
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-4 h-4 text-xs'
      case 'large':
        return 'w-8 h-8 text-lg'
      default:
        return 'w-6 h-6 text-sm'
    }
  }

  const getVerificationIcon = () => {
    const level = user.verificationLevel || 0
    
    if (level >= 3) {
      return '⭐' // 프리미엄 인증 (전화번호 + 이메일 + 신분증)
    } else if (level >= 2) {
      return '🔒' // 고급 인증 (신분증 또는 주소 인증 포함)
    } else if (level >= 1) {
      return '✅' // 기본 인증 (전화번호 또는 이메일)
    }
    
    return null
  }

  const getVerificationLabel = () => {
    const level = user.verificationLevel || 0
    
    if (level >= 3) {
      return '프리미엄 인증'
    } else if (level >= 2) {
      return '고급 인증'
    } else if (level >= 1) {
      return '기본 인증'
    }
    
    return '인증됨'
  }

  const getVerificationColor = () => {
    const level = user.verificationLevel || 0
    
    if (level >= 3) {
      return 'text-yellow-600 bg-yellow-100 border-yellow-300'
    } else if (level >= 2) {
      return 'text-blue-600 bg-blue-100 border-blue-300'
    } else {
      return 'text-green-600 bg-green-100 border-green-300'
    }
  }

  const icon = getVerificationIcon()
  if (!icon) return null

  if (showLabel) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium ${getVerificationColor()}`}>
        <span className={getSizeClasses().split(' ')[2]}>{icon}</span>
        <span>{getVerificationLabel()}</span>
      </div>
    )
  }

  return (
    <div 
      className={`inline-flex items-center justify-center rounded-full bg-white border shadow-sm ${getSizeClasses()}`}
      title={getVerificationLabel()}
    >
      <span>{icon}</span>
    </div>
  )
}