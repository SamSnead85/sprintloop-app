import { clsx } from 'clsx'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150',
        {
          // Size
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-sm': size === 'md',
          'px-5 py-2.5 text-base': size === 'lg',

          // Variant
          'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800': variant === 'primary',
          'bg-white/10 text-white hover:bg-white/15 active:bg-white/20': variant === 'secondary',
          'bg-transparent text-gray-300 hover:bg-white/5 hover:text-white': variant === 'ghost',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
