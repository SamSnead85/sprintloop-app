/**
 * SprintLoop Button System
 * 
 * Phase 2601-2650: Button variants
 * - Primary, secondary, ghost, outline
 * - Icon buttons
 * - Button groups
 * - Loading states
 */

import React, { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    fullWidth?: boolean
}

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    'aria-label': string
    children: React.ReactNode
}

// ============================================================================
// STYLES
// ============================================================================

const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700 focus:ring-purple-500',
    secondary: 'bg-white/10 text-white hover:bg-white/20 active:bg-white/25 focus:ring-white/50',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 focus:ring-white/50',
    outline: 'bg-transparent text-gray-400 border border-white/20 hover:text-white hover:border-white/40 active:bg-white/5 focus:ring-white/50',
    danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 active:bg-red-500/40 focus:ring-red-500',
    success: 'bg-green-500/20 text-green-400 hover:bg-green-500/30 active:bg-green-500/40 focus:ring-green-500',
}

const sizeStyles: Record<ButtonSize, string> = {
    xs: 'h-6 px-2 text-xs gap-1 rounded',
    sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
    md: 'h-10 px-4 text-sm gap-2 rounded-lg',
    lg: 'h-12 px-6 text-base gap-2 rounded-lg',
}

const iconSizeStyles: Record<ButtonSize, string> = {
    xs: 'w-6 h-6 rounded',
    sm: 'w-8 h-8 rounded-md',
    md: 'w-10 h-10 rounded-lg',
    lg: 'w-12 h-12 rounded-lg',
}

const iconInnerStyles: Record<ButtonSize, string> = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
}

// ============================================================================
// BUTTON
// ============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    disabled,
    className = '',
    children,
    ...props
}, ref) => {
    const isDisabled = disabled || loading

    return (
        <button
            ref={ref}
            disabled={isDisabled}
            className={`
                relative inline-flex items-center justify-center font-medium transition-colors
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${fullWidth ? 'w-full' : ''}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `}
            {...props}
        >
            {loading && (
                <Loader2 className={`${iconInnerStyles[size]} animate-spin`} />
            )}
            {!loading && leftIcon && (
                <span className={iconInnerStyles[size]}>{leftIcon}</span>
            )}
            {children && <span className={loading ? 'opacity-0' : ''}>{children}</span>}
            {!loading && rightIcon && (
                <span className={iconInnerStyles[size]}>{rightIcon}</span>
            )}
        </button>
    )
})

Button.displayName = 'Button'

// ============================================================================
// ICON BUTTON
// ============================================================================

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
    variant = 'ghost',
    size = 'md',
    loading = false,
    disabled,
    className = '',
    children,
    ...props
}, ref) => {
    const isDisabled = disabled || loading

    return (
        <button
            ref={ref}
            disabled={isDisabled}
            className={`
                inline-flex items-center justify-center transition-colors
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
                ${variantStyles[variant]}
                ${iconSizeStyles[size]}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `}
            {...props}
        >
            {loading ? (
                <Loader2 className={`${iconInnerStyles[size]} animate-spin`} />
            ) : (
                <span className={`flex items-center justify-center ${iconInnerStyles[size]}`}>
                    {children}
                </span>
            )}
        </button>
    )
})

IconButton.displayName = 'IconButton'

// ============================================================================
// BUTTON GROUP
// ============================================================================

interface ButtonGroupProps {
    children: React.ReactNode
    attached?: boolean
    orientation?: 'horizontal' | 'vertical'
    className?: string
}

export function ButtonGroup({
    children,
    attached = false,
    orientation = 'horizontal',
    className = '',
}: ButtonGroupProps) {
    if (!attached) {
        return (
            <div className={`inline-flex ${orientation === 'vertical' ? 'flex-col' : ''} gap-2 ${className}`}>
                {children}
            </div>
        )
    }

    return (
        <div
            className={`
                inline-flex ${orientation === 'vertical' ? 'flex-col' : ''}
                [&>*]:rounded-none
                ${orientation === 'horizontal' ? `
                    [&>*:first-child]:rounded-l-lg
                    [&>*:last-child]:rounded-r-lg
                    [&>*:not(:first-child)]:-ml-px
                ` : `
                    [&>*:first-child]:rounded-t-lg
                    [&>*:last-child]:rounded-b-lg
                    [&>*:not(:first-child)]:-mt-px
                `}
                ${className}
            `}
        >
            {children}
        </div>
    )
}

// ============================================================================
// LINK BUTTON
// ============================================================================

interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(({
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    className = '',
    children,
    ...props
}, ref) => {
    return (
        <a
            ref={ref}
            className={`
                inline-flex items-center justify-center font-medium transition-colors no-underline
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
            `}
            {...props}
        >
            {leftIcon && <span className={iconInnerStyles[size]}>{leftIcon}</span>}
            {children}
            {rightIcon && <span className={iconInnerStyles[size]}>{rightIcon}</span>}
        </a>
    )
})

LinkButton.displayName = 'LinkButton'

// ============================================================================
// SPLIT BUTTON
// ============================================================================

interface SplitButtonProps {
    children: React.ReactNode
    options: { label: string; onClick: () => void }[]
    variant?: ButtonVariant
    size?: ButtonSize
    disabled?: boolean
    className?: string
}

export function SplitButton({
    children,
    options,
    variant = 'primary',
    size = 'md',
    disabled = false,
    className = '',
}: SplitButtonProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={containerRef} className={`relative inline-flex ${className}`}>
            <ButtonGroup attached>
                <Button variant={variant} size={size} disabled={disabled}>
                    {children}
                </Button>
                <Button
                    variant={variant}
                    size={size}
                    disabled={disabled}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    className="px-2"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </Button>
            </ButtonGroup>

            {isOpen && (
                <div className="absolute top-full right-0 mt-1 py-1 min-w-32 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-10">
                    {options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => {
                                option.onClick()
                                setIsOpen(false)
                            }}
                            className="w-full px-3 py-1.5 text-sm text-left text-gray-300 hover:bg-white/5 transition-colors"
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
