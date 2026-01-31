/**
 * SprintLoop Toast Notification System
 * 
 * Phase 3201-3250: Toasts
 * - Toast container
 * - Toast variants
 * - Toast actions
 * - Auto-dismiss
 */

import React, { useState, useCallback, createContext, useContext, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
    Check,
    X,
    AlertTriangle,
    Info,
    AlertCircle,
    Loader2
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading'
type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

interface Toast {
    id: string
    title?: string
    description?: string
    variant?: ToastVariant
    duration?: number
    dismissible?: boolean
    action?: {
        label: string
        onClick: () => void
    }
    onDismiss?: () => void
}

interface ToastContextValue {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id'>) => string
    removeToast: (id: string) => void
    updateToast: (id: string, toast: Partial<Toast>) => void
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null)

interface ToastProviderProps {
    children: React.ReactNode
    position?: ToastPosition
    maxToasts?: number
}

export function ToastProvider({
    children,
    position = 'bottom-right',
    maxToasts = 5,
}: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`

        setToasts(prev => {
            const newToasts = [...prev, { id, ...toast }]
            // Limit max toasts
            if (newToasts.length > maxToasts) {
                return newToasts.slice(-maxToasts)
            }
            return newToasts
        })

        return id
    }, [maxToasts])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
        setToasts(prev => prev.map(t =>
            t.id === id ? { ...t, ...updates } : t
        ))
    }, [])

    const positionStyles: Record<ToastPosition, string> = {
        'top-left': 'top-4 left-4 items-start',
        'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
        'top-right': 'top-4 right-4 items-end',
        'bottom-left': 'bottom-4 left-4 items-start',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
        'bottom-right': 'bottom-4 right-4 items-end',
    }

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast }}>
            {children}
            {typeof document !== 'undefined' && createPortal(
                <div
                    className={`fixed z-[100] flex flex-col gap-2 pointer-events-none ${positionStyles[position]}`}
                >
                    {toasts.map(toast => (
                        <ToastItem
                            key={toast.id}
                            toast={toast}
                            onDismiss={() => {
                                toast.onDismiss?.()
                                removeToast(toast.id)
                            }}
                        />
                    ))}
                </div>,
                document.body
            )}
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within ToastProvider')
    }

    const toast = useCallback((options: Omit<Toast, 'id'> | string) => {
        if (typeof options === 'string') {
            return context.addToast({ description: options })
        }
        return context.addToast(options)
    }, [context])

    const success = useCallback((message: string, options?: Partial<Toast>) => {
        return context.addToast({ description: message, variant: 'success', ...options })
    }, [context])

    const error = useCallback((message: string, options?: Partial<Toast>) => {
        return context.addToast({ description: message, variant: 'error', ...options })
    }, [context])

    const warning = useCallback((message: string, options?: Partial<Toast>) => {
        return context.addToast({ description: message, variant: 'warning', ...options })
    }, [context])

    const info = useCallback((message: string, options?: Partial<Toast>) => {
        return context.addToast({ description: message, variant: 'info', ...options })
    }, [context])

    const loading = useCallback((message: string, options?: Partial<Toast>) => {
        return context.addToast({ description: message, variant: 'loading', duration: 0, ...options })
    }, [context])

    const dismiss = useCallback((id: string) => {
        context.removeToast(id)
    }, [context])

    const update = useCallback((id: string, options: Partial<Toast>) => {
        context.updateToast(id, options)
    }, [context])

    return {
        toast,
        success,
        error,
        warning,
        info,
        loading,
        dismiss,
        update,
    }
}

// ============================================================================
// TOAST ITEM
// ============================================================================

interface ToastItemProps {
    toast: Toast
    onDismiss: () => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
    const [isExiting, setIsExiting] = useState(false)

    const {
        title,
        description,
        variant = 'default',
        duration = 5000,
        dismissible = true,
        action,
    } = toast

    // Auto-dismiss
    useEffect(() => {
        if (duration <= 0) return

        const timer = setTimeout(() => {
            setIsExiting(true)
            setTimeout(onDismiss, 200)
        }, duration)

        return () => clearTimeout(timer)
    }, [duration, onDismiss])

    const handleDismiss = () => {
        setIsExiting(true)
        setTimeout(onDismiss, 200)
    }

    const variantStyles: Record<ToastVariant, { bg: string; icon: React.ReactNode }> = {
        default: {
            bg: 'bg-slate-800 border-white/10',
            icon: null,
        },
        success: {
            bg: 'bg-slate-800 border-green-500/30',
            icon: <Check className="w-5 h-5 text-green-400" />,
        },
        error: {
            bg: 'bg-slate-800 border-red-500/30',
            icon: <AlertCircle className="w-5 h-5 text-red-400" />,
        },
        warning: {
            bg: 'bg-slate-800 border-yellow-500/30',
            icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
        },
        info: {
            bg: 'bg-slate-800 border-blue-500/30',
            icon: <Info className="w-5 h-5 text-blue-400" />,
        },
        loading: {
            bg: 'bg-slate-800 border-purple-500/30',
            icon: <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />,
        },
    }

    const { bg, icon } = variantStyles[variant]

    return (
        <div
            className={`
                pointer-events-auto w-80 border rounded-xl shadow-xl p-4
                ${bg}
                ${isExiting ? 'animate-out fade-out-0 slide-out-to-right-full' : 'animate-in fade-in-0 slide-in-from-right-full'}
                transition-all duration-200
            `}
        >
            <div className="flex gap-3">
                {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
                <div className="flex-1 min-w-0">
                    {title && (
                        <p className="font-medium text-white">{title}</p>
                    )}
                    {description && (
                        <p className={`text-sm text-gray-400 ${title ? 'mt-1' : ''}`}>
                            {description}
                        </p>
                    )}
                    {action && (
                        <button
                            onClick={action.onClick}
                            className="mt-2 text-sm text-purple-400 hover:text-purple-300 font-medium"
                        >
                            {action.label}
                        </button>
                    )}
                </div>
                {dismissible && (
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// STANDALONE TOASTER
// ============================================================================

export function Toaster() {
    // This is a convenience component that just re-exports the ToastProvider
    // For use when you want to add toasts anywhere without context
    return null
}

// ============================================================================
// PROMISE TOAST
// ============================================================================

interface PromiseToastOptions<T> {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: Error) => string)
}

export function usePromiseToast() {
    const { loading: showLoading, update, dismiss } = useToast()

    const promise = useCallback(<T,>(
        promiseFn: Promise<T>,
        options: PromiseToastOptions<T>
    ): Promise<T> => {
        const id = showLoading(options.loading)

        return promiseFn
            .then(data => {
                update(id, {
                    description: typeof options.success === 'function'
                        ? options.success(data)
                        : options.success,
                    variant: 'success',
                    duration: 5000,
                })
                return data
            })
            .catch(error => {
                update(id, {
                    description: typeof options.error === 'function'
                        ? options.error(error)
                        : options.error,
                    variant: 'error',
                    duration: 5000,
                })
                throw error
            })
    }, [showLoading, update])

    return { promise }
}
