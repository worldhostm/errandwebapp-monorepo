'use client'

import type { InputHTMLAttributes, ReactNode } from 'react'

type InputSize = 'xs' | 'sm' | 'md' | 'lg'
type InputVariant = 'default' | 'bordered' | 'ghost'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  inputSize?: InputSize
  variant?: InputVariant
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const sizeClass: Record<InputSize, string> = {
  xs: 'input-xs',
  sm: 'input-sm',
  md: '',
  lg: 'input-lg',
}

const variantClass: Record<InputVariant, string> = {
  default:  '',
  bordered: 'input-bordered',
  ghost:    'input-ghost',
}

export default function Input({
  label,
  helperText,
  error,
  inputSize = 'md',
  variant = 'bordered',
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...rest
}: InputProps) {
  const inputId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined)

  return (
    <fieldset className="fieldset w-full">
      {label && (
        <legend className="fieldset-legend">
          {label}
        </legend>
      )}
      <label className={['input', variantClass[variant], sizeClass[inputSize], error ? 'input-error' : '', 'w-full flex items-center gap-2', className].filter(Boolean).join(' ')}>
        {leftIcon && <span className="opacity-60">{leftIcon}</span>}
        <input id={inputId} className="grow" {...rest} />
        {rightIcon && <span className="opacity-60">{rightIcon}</span>}
      </label>
      {(helperText || error) && (
        <p className={['fieldset-label text-xs mt-1', error ? 'text-error' : 'text-base-content/60'].join(' ')}>
          {error || helperText}
        </p>
      )}
    </fieldset>
  )
}
