/**
 * SprintLoop Design System - Core UI Components
 * 
 * Premium, accessible, lovable UI components following best practices:
 * - WCAG 2.1 AA compliance
 * - Consistent animations and transitions
 * - Keyboard navigation support
 * - Focus management
 * - Responsive design
 */

import React, { forwardRef, useState, useRef, useEffect, createContext, useContext } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, AlertCircle, Info, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'

// ============================================================================
// DESIGN TOKENS
// ============================================================================

export const tokens = {
    // Spacing scale (4px base)
    space: {
        0: '0',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
    },

    // Border radius
    radius: {
        none: '0',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        full: '9999px',
    },

    // Font sizes with line heights
    fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '28px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
        '4xl': ['36px', '40px'],
    },

    // Font weights
    fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },

    // Transitions
    transition: {
        fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
        normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
        slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
        spring: '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
    },

    // Z-index scale
    zIndex: {
        dropdown: 50,
        sticky: 100,
        modal: 200,
        popover: 300,
        tooltip: 400,
        toast: 500,
    },

    // Shadows
    shadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        glow: '0 0 20px rgb(147 51 234 / 0.3)',
    },
}

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant
    size?: ButtonSize
    isLoading?: boolean
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    fullWidth?: boolean
}

const buttonStyles: Record<ButtonVariant, string> = {
    primary: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/25',
    secondary: 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
}

const buttonSizes: Record<ButtonSize, string> = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({
        variant = 'primary',
        size = 'md',
        isLoading,
        leftIcon,
        rightIcon,
        fullWidth,
        disabled,
        className,
        children,
        ...props
    }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={`
                    inline-flex items-center justify-center font-medium rounded-lg
                    transition-all duration-200 ease-out
                    focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900
                    disabled:opacity-50 disabled:cursor-not-allowed
                    active:scale-[0.98]
                    ${buttonStyles[variant]}
                    ${buttonSizes[size]}
                    ${fullWidth ? 'w-full' : ''}
                    ${className || ''}
                `}
                {...props}
            >
                {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : leftIcon}
                {children}
                {!isLoading && rightIcon}
            </button>
        )
    }
)
Button.displayName = 'Button'

// ============================================================================
// INPUT COMPONENT
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    hint?: string
    leftElement?: React.ReactNode
    rightElement?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, hint, leftElement, rightElement, className, id, ...props }, ref) => {
        const inputId = id || `input-${Math.random().toString(36).slice(2)}`

        return (
            <div className="w-full">
                {label && (
                    <label
                        htmlFor={inputId}
                        className="block text-sm font-medium text-gray-300 mb-1.5"
                    >
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftElement && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            {leftElement}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                        className={`
                            w-full bg-white/5 border rounded-lg px-4 py-2.5
                            text-white placeholder-gray-500
                            transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                            disabled:opacity-50 disabled:cursor-not-allowed
                            ${leftElement ? 'pl-10' : ''}
                            ${rightElement ? 'pr-10' : ''}
                            ${error ? 'border-red-500' : 'border-white/10 hover:border-white/20'}
                            ${className || ''}
                        `}
                        {...props}
                    />
                    {rightElement && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                            {rightElement}
                        </div>
                    )}
                </div>
                {error && (
                    <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </p>
                )}
                {hint && !error && (
                    <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-gray-500">
                        {hint}
                    </p>
                )}
            </div>
        )
    }
)
Input.displayName = 'Input'

// ============================================================================
// TOAST NOTIFICATION SYSTEM
// ============================================================================

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    title: string
    description?: string
    duration?: number
    action?: {
        label: string
        onClick: () => void
    }
}

interface ToastContextValue {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => string
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within ToastProvider')
    return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = (toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
        setToasts(prev => [...prev, { ...toast, id }])

        if (toast.duration !== 0) {
            setTimeout(() => removeToast(id), toast.duration || 5000)
        }

        return id
    }

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer />
        </ToastContext.Provider>
    )
}

const toastIcons: Record<ToastType, React.ReactNode> = {
    success: <Check className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
}

const toastStyles: Record<ToastType, string> = {
    success: 'border-green-500/20 bg-green-500/10',
    error: 'border-red-500/20 bg-red-500/10',
    warning: 'border-yellow-500/20 bg-yellow-500/10',
    info: 'border-blue-500/20 bg-blue-500/10',
}

function ToastContainer() {
    const { toasts, removeToast } = useToast()

    if (typeof window === 'undefined') return null

    return createPortal(
        <div
            className="fixed bottom-4 right-4 flex flex-col gap-2 z-[500] pointer-events-none"
            aria-live="polite"
            aria-label="Notifications"
        >
            {toasts.map((toast, index) => (
                <div
                    key={toast.id}
                    className={`
                        pointer-events-auto
                        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl
                        shadow-xl max-w-sm min-w-[320px]
                        animate-in slide-in-from-right-full fade-in duration-300
                        ${toastStyles[toast.type]}
                    `}
                    style={{
                        animationDelay: `${index * 50}ms`,
                    }}
                    role="alert"
                >
                    <div className="flex-shrink-0 mt-0.5">
                        {toastIcons[toast.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{toast.title}</p>
                        {toast.description && (
                            <p className="mt-1 text-sm text-gray-400">{toast.description}</p>
                        )}
                        {toast.action && (
                            <button
                                onClick={toast.action.onClick}
                                className="mt-2 text-sm font-medium text-purple-400 hover:text-purple-300"
                            >
                                {toast.action.label}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="flex-shrink-0 p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Dismiss notification"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>,
        document.body
    )
}

// ============================================================================
// TOOLTIP COMPONENT
// ============================================================================

interface TooltipProps {
    content: React.ReactNode
    children: React.ReactNode
    side?: 'top' | 'right' | 'bottom' | 'left'
    delay?: number
}

export function Tooltip({ content, children, side = 'top', delay = 200 }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

    const showTooltip = () => {
        timeoutRef.current = setTimeout(() => {
            if (triggerRef.current) {
                const rect = triggerRef.current.getBoundingClientRect()
                const positions = {
                    top: { x: rect.left + rect.width / 2, y: rect.top - 8 },
                    bottom: { x: rect.left + rect.width / 2, y: rect.bottom + 8 },
                    left: { x: rect.left - 8, y: rect.top + rect.height / 2 },
                    right: { x: rect.right + 8, y: rect.top + rect.height / 2 },
                }
                setPosition(positions[side])
                setIsVisible(true)
            }
        }, delay)
    }

    const hideTooltip = () => {
        clearTimeout(timeoutRef.current)
        setIsVisible(false)
    }

    useEffect(() => {
        return () => clearTimeout(timeoutRef.current)
    }, [])

    const transformStyles = {
        top: 'translate(-50%, -100%)',
        bottom: 'translate(-50%, 0)',
        left: 'translate(-100%, -50%)',
        right: 'translate(0, -50%)',
    }

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={showTooltip}
                onMouseLeave={hideTooltip}
                onFocus={showTooltip}
                onBlur={hideTooltip}
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    role="tooltip"
                    className={`
                        fixed z-[400] px-3 py-1.5 rounded-lg
                        bg-slate-800 border border-white/10
                        text-sm text-white shadow-xl
                        animate-in fade-in zoom-in-95 duration-150
                    `}
                    style={{
                        left: position.x,
                        top: position.y,
                        transform: transformStyles[side],
                    }}
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    )
}

// ============================================================================
// SKELETON LOADING
// ============================================================================

interface SkeletonProps {
    width?: string | number
    height?: string | number
    className?: string
    variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({
    width,
    height,
    className,
    variant = 'rectangular'
}: SkeletonProps) {
    const variantStyles = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    }

    return (
        <div
            className={`
                bg-white/5 animate-pulse
                ${variantStyles[variant]}
                ${className || ''}
            `}
            style={{ width, height }}
            aria-hidden="true"
        />
    )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    height={16}
                    width={i === lines - 1 ? '60%' : '100%'}
                    variant="text"
                />
            ))}
        </div>
    )
}

// ============================================================================
// BREADCRUMB NAVIGATION
// ============================================================================

interface BreadcrumbItem {
    label: string
    href?: string
    onClick?: () => void
    icon?: React.ReactNode
}

interface BreadcrumbProps {
    items: BreadcrumbItem[]
    maxItems?: number
    separator?: React.ReactNode
}

export function Breadcrumb({
    items,
    maxItems = 4,
    separator = <ChevronRight className="w-4 h-4 text-gray-600" />
}: BreadcrumbProps) {
    // Smart truncation for long paths
    const displayItems = items.length > maxItems
        ? [
            items[0],
            { label: '...', onClick: undefined },
            ...items.slice(-2)
        ]
        : items

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1">
            <ol className="flex items-center gap-1">
                {displayItems.map((item, index) => (
                    <li key={index} className="flex items-center gap-1">
                        {index > 0 && (
                            <span className="mx-1" aria-hidden="true">
                                {separator}
                            </span>
                        )}
                        {item.href || item.onClick ? (
                            <button
                                onClick={item.onClick}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                {item.icon}
                                <span className="max-w-[120px] truncate">{item.label}</span>
                            </button>
                        ) : (
                            <span
                                className="flex items-center gap-1.5 px-2 py-1 text-sm text-white font-medium"
                                aria-current="page"
                            >
                                {item.icon}
                                <span className="max-w-[120px] truncate">{item.label}</span>
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    )
}

// ============================================================================
// BADGE COMPONENT
// ============================================================================

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'

interface BadgeProps {
    children: React.ReactNode
    variant?: BadgeVariant
    size?: 'sm' | 'md'
    dot?: boolean
}

const badgeStyles: Record<BadgeVariant, string> = {
    default: 'bg-white/10 text-gray-300',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    error: 'bg-red-500/20 text-red-400',
    info: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
}

export function Badge({ children, variant = 'default', size = 'sm', dot }: BadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center gap-1.5 rounded-full font-medium
                ${badgeStyles[variant]}
                ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
            `}
        >
            {dot && (
                <span className={`w-1.5 h-1.5 rounded-full ${variant === 'success' ? 'bg-green-400' :
                    variant === 'warning' ? 'bg-yellow-400' :
                        variant === 'error' ? 'bg-red-400' :
                            variant === 'info' ? 'bg-blue-400' :
                                variant === 'purple' ? 'bg-purple-400' :
                                    'bg-gray-400'
                    }`} />
            )}
            {children}
        </span>
    )
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

interface ProgressProps {
    value: number
    max?: number
    size?: 'sm' | 'md' | 'lg'
    variant?: 'default' | 'success' | 'warning' | 'error'
    showLabel?: boolean
    animated?: boolean
}

export function Progress({
    value,
    max = 100,
    size = 'md',
    variant = 'default',
    showLabel = false,
    animated = false
}: ProgressProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const sizeStyles = {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
    }

    const variantStyles = {
        default: 'bg-gradient-to-r from-purple-500 to-blue-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        error: 'bg-red-500',
    }

    return (
        <div className="w-full">
            <div
                className={`w-full bg-white/10 rounded-full overflow-hidden ${sizeStyles[size]}`}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
            >
                <div
                    className={`
                        h-full rounded-full transition-all duration-500 ease-out
                        ${variantStyles[variant]}
                        ${animated ? 'animate-pulse' : ''}
                    `}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            {showLabel && (
                <div className="mt-1 text-sm text-gray-400 text-right">
                    {Math.round(percentage)}%
                </div>
            )}
        </div>
    )
}

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

interface AvatarProps {
    src?: string
    alt?: string
    fallback?: string
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    status?: 'online' | 'away' | 'busy' | 'offline'
}

const avatarSizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
}

const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-500',
}

export function Avatar({ src, alt, fallback, size = 'md', status }: AvatarProps) {
    const [hasError, setHasError] = useState(false)

    const initials = fallback || alt?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

    return (
        <div className="relative inline-block">
            {src && !hasError ? (
                <img
                    src={src}
                    alt={alt || 'Avatar'}
                    onError={() => setHasError(true)}
                    className={`
                        rounded-full object-cover
                        ${avatarSizes[size]}
                    `}
                />
            ) : (
                <div
                    className={`
                        rounded-full bg-gradient-to-br from-purple-500 to-blue-500
                        flex items-center justify-center font-semibold text-white
                        ${avatarSizes[size]}
                    `}
                >
                    {initials}
                </div>
            )}
            {status && (
                <span
                    className={`
                        absolute bottom-0 right-0 block rounded-full ring-2 ring-slate-900
                        ${size === 'xs' || size === 'sm' ? 'w-2 h-2' : 'w-3 h-3'}
                        ${statusColors[status]}
                    `}
                />
            )}
        </div>
    )
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: {
        label: string
        onClick: () => void
    }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {icon && (
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-4">
                    {icon}
                </div>
            )}
            <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
            {description && (
                <p className="text-gray-500 max-w-sm mb-6">{description}</p>
            )}
            {action && (
                <Button onClick={action.onClick}>{action.label}</Button>
            )}
        </div>
    )
}

// ============================================================================
// KEYBOARD SHORTCUT HINT
// ============================================================================

interface KbdProps {
    children: string
    className?: string
}

export function Kbd({ children, className }: KbdProps) {
    return (
        <kbd
            className={`
                inline-flex items-center justify-center
                px-1.5 py-0.5 rounded-md
                bg-white/5 border border-white/10
                text-xs font-mono text-gray-400
                ${className || ''}
            `}
        >
            {children}
        </kbd>
    )
}

export function KeyboardShortcut({ keys }: { keys: string[] }) {
    return (
        <span className="inline-flex items-center gap-0.5">
            {keys.map((key, i) => (
                <React.Fragment key={i}>
                    <Kbd>{key}</Kbd>
                    {i < keys.length - 1 && <span className="text-gray-600">+</span>}
                </React.Fragment>
            ))}
        </span>
    )
}
