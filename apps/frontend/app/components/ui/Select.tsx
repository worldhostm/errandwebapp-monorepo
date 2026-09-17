'use client'

import type { SelectHTMLAttributes } from 'react'

type SelectSize = 'xs' | 'sm' | 'md' | 'lg'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  placeholder?: string
  helperText?: string
  error?: string
  selectSize?: SelectSize
}

const sizeClass: Record<SelectSize, string> = {
  xs: 'select-xs',
  sm: 'select-sm',
  md: '',
  lg: 'select-lg',
}

export default function Select({
  label,
  options,
  placeholder,
  helperText,
  error,
  selectSize = 'md',
  className = '',
  id,
  ...rest
}: SelectProps) {
  const selectId = id || (label ? label.replace(/\s+/g, '-').toLowerCase() : undefined)

  return (
    <fieldset className="fieldset w-full">
      {label && (
        <legend className="fieldset-legend">{label}</legend>
      )}
      <select
        id={selectId}
        className={['select select-bordered w-full', sizeClass[selectSize], error ? 'select-error' : '', className]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      {(helperText || error) && (
        <p className={['fieldset-label text-xs mt-1', error ? 'text-error' : 'text-base-content/60'].join(' ')}>
          {error || helperText}
        </p>
      )}
    </fieldset>
  )
}
