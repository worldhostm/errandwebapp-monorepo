'use client'

import type { ReactNode } from 'react'

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'error' | 'warning' | 'info' | 'ghost' | 'outline'
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

interface BadgeProps {
  variant?: BadgeVariant
  size?: BadgeSize
  children: ReactNode
  className?: string
}

const variantClass: Record<BadgeVariant, string> = {
  primary:   'badge-primary',
  secondary: 'badge-secondary',
  accent:    'badge-accent',
  success:   'badge-success',
  error:     'badge-error',
  warning:   'badge-warning',
  info:      'badge-info',
  ghost:     'badge-ghost',
  outline:   'badge-outline',
}

const sizeClass: Record<BadgeSize, string> = {
  xs: 'badge-xs',
  sm: 'badge-sm',
  md: '',
  lg: 'badge-lg',
}

export default function Badge({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={['badge', variantClass[variant], sizeClass[size], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}
