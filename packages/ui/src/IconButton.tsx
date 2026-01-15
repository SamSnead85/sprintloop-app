import { clsx } from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ElementType
    active?: boolean
    size?: 'sm' | 'md' | 'lg'
}

export function IconButton({
    icon: Icon,
    active = false,
    size = 'md',
    className,
    ...props
}: IconButtonProps) {
    return (
        <button
            className={clsx(
                'rounded-lg flex items-center justify-center transition-all duration-150',
                {
                    // Size
                    'w-8 h-8': size === 'sm',
                    'w-10 h-10': size === 'md',
                    'w-12 h-12': size === 'lg',

                    // State
                    'bg-white/10 text-white': active,
                    'text-gray-500 hover:bg-white/5 hover:text-gray-300': !active,
                },
                className
            )}
            {...props}
        >
            <Icon className={clsx({
                'w-4 h-4': size === 'sm',
                'w-5 h-5': size === 'md',
                'w-6 h-6': size === 'lg',
            })} />
        </button>
    )
}
