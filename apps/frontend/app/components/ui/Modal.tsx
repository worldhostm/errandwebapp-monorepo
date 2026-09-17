'use client'

import type { ReactNode } from 'react'

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: ModalSize
  closeOnBackdrop?: boolean
}

const sizeClass: Record<ModalSize, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-xl',
  full: 'max-w-full',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="modal modal-open"
      role="dialog"
      aria-modal="true"
      onClick={closeOnBackdrop ? (e) => { if (e.target === e.currentTarget) onClose() } : undefined}
    >
      <div className={`modal-box w-full ${sizeClass[size]}`}>
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">{title}</h3>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose} aria-label="닫기">
              ✕
            </button>
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="modal-action">{footer}</div>}
      </div>
    </div>
  )
}
