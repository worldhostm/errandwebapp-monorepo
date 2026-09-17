'use client'

import Image from 'next/image'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src?: string
  name?: string
  size?: AvatarSize
  online?: boolean
  offline?: boolean
  className?: string
}

const sizePx: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
}

const sizeClass: Record<AvatarSize, string> = {
  xs: 'w-6',
  sm: 'w-8',
  md: 'w-12',
  lg: 'w-16',
  xl: 'w-24',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Avatar({
  src,
  name,
  size = 'md',
  online,
  offline,
  className = '',
}: AvatarProps) {
  const px = sizePx[size]

  return (
    <div
      className={[
        'avatar',
        online ? 'avatar-online' : '',
        offline ? 'avatar-offline' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={`${sizeClass[size]} rounded-full`}>
        {src ? (
          <Image src={src} alt={name || '사용자'} width={px} height={px} className="rounded-full object-cover" />
        ) : (
          <div className={`${sizeClass[size]} rounded-full bg-neutral text-neutral-content flex items-center justify-center text-sm font-bold`}>
            {name ? getInitials(name) : '?'}
          </div>
        )}
      </div>
    </div>
  )
}
