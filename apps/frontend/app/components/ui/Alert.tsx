'use client'

import type { ReactNode } from 'react'

type AlertVariant = 'info' | 'success' | 'warning' | 'error'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: ReactNode
  onClose?: () => void
  className?: string
}

const variantClass: Record<AlertVariant, string> = {
  info:    'alert-info',
  success: 'alert-success',
  warning: 'alert-warning',
  error:   'alert-error',
}

const icon: Record<AlertVariant, string> = {
  info:    'ℹ️',
  success: '✅',
  warning: '⚠️',
  error:   '❌',
}

export default function Alert({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}: AlertProps) {
  return (
    <div className={['alert', variantClass[variant], className].filter(Boolean).join(' ')} role="alert">
      <span>{icon[variant]}</span>
      <div>
        {title && <h3 className="font-bold">{title}</h3>}
        <span>{children}</span>
      </div>
      {onClose && (
        <button className="btn btn-sm btn-circle btn-ghost ml-auto" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      )}
    </div>
  )
}
