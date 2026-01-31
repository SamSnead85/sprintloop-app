/**
 * SprintLoop Toast System v2
 * 
 * Phase 121-140: Advanced toast notifications
 * - Stackable toasts
 * - Action buttons
 * - Undo support
 * - Progress toasts
 * - Custom icons
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
    Check,
    X,
    AlertTriangle,
    Info,
    AlertCircle,
    Loader2,
    Undo2,
    ExternalLink
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'promise'
type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center'

interface ToastAction {
    label: string
    onClick: () => void
    variant?: 'default' | 'primary' | 'destructive'
}

interface Toast {
    id: string
    type: ToastType
    title: string
    description?: string
    duration?: number
    dismissible?: boolean
    icon?: React.ReactNode
    action?: ToastAction
    undoAction?: () => void
    progress?: number
    createdAt: number
}

interface ToastContextValue {
    toasts: Toast[]
    addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string
    removeToast: (id: string) => void
    updateToast: (id: string, updates: Partial<Toast>) => void
    clearAll: () => void
    promise: <T>(
        promise: Promise<T>,
        messages: {
            loading: string
            success: string | ((data: T) => string)
            error: string | ((error: Error) => string)
        }
    ) => Promise<T>
}

// ============================================================================
// CONTEXT
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within ToastProvider')
    return context
}

// ============================================================================
// TOAST PROVIDER
// ============================================================================

interface ToastProviderProps {
    children: React.ReactNode
    position?: ToastPosition
    maxToasts?: number
    defaultDuration?: number
}

export function ToastProvider({
    children,
    position = 'bottom-right',
    maxToasts = 5,
    defaultDuration = 5000
}: ToastProviderProps) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((toast: Omit<Toast, 'id' | 'createdAt'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const newToast: Toast = {
            ...toast,
            id,
            createdAt: Date.now(),
            duration: toast.duration ?? (toast.type === 'loading' ? 0 : defaultDuration),
            dismissible: toast.dismissible ?? true,
        }

        setToasts(prev => {
            const updated = [newToast, ...prev]
            return updated.slice(0, maxToasts)
        })

        if (newToast.duration && newToast.duration > 0) {
            setTimeout(() => removeToast(id), newToast.duration)
        }

        return id
    }, [defaultDuration, maxToasts])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
        setToasts(prev =>
            prev.map(t => (t.id === id ? { ...t, ...updates } : t))
        )
    }, [])

    const clearAll = useCallback(() => {
        setToasts([])
    }, [])

    const promise = useCallback(async <T,>(
        promiseToResolve: Promise<T>,
        messages: {
            loading: string
            success: string | ((data: T) => string)
            error: string | ((error: Error) => string)
        }
    ): Promise<T> => {
        const id = addToast({
            type: 'loading',
            title: messages.loading,
        })

        try {
            const data = await promiseToResolve
            updateToast(id, {
                type: 'success',
                title: typeof messages.success === 'function'
                    ? messages.success(data)
                    : messages.success,
                duration: defaultDuration,
            })
            setTimeout(() => removeToast(id), defaultDuration)
            return data
        } catch (error) {
            updateToast(id, {
                type: 'error',
                title: typeof messages.error === 'function'
                    ? messages.error(error as Error)
                    : messages.error,
                duration: defaultDuration,
            })
            setTimeout(() => removeToast(id), defaultDuration)
            throw error
        }
    }, [addToast, updateToast, removeToast, defaultDuration])

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, updateToast, clearAll, promise }}>
            {children}
            <ToastContainer position={position} />
        </ToastContext.Provider>
    )
}

// ============================================================================
// TOAST CONTAINER
// ============================================================================

const positionClasses: Record<ToastPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
}

function ToastContainer({ position }: { position: ToastPosition }) {
    const { toasts, removeToast } = useToast()

    if (typeof window === 'undefined') return null

    const isTop = position.startsWith('top')

    return createPortal(
        <div
            className={`
                fixed z-[9999] flex flex-col gap-2 pointer-events-none
                ${positionClasses[position]}
                ${isTop ? '' : 'flex-col-reverse'}
            `}
            role="region"
            aria-label="Notifications"
        >
            {toasts.map((toast, index) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={() => removeToast(toast.id)}
                    index={index}
                    isTop={isTop}
                />
            ))}
        </div>,
        document.body
    )
}

// ============================================================================
// TOAST ITEM
// ============================================================================

const toastIcons: Record<ToastType, React.ReactNode> = {
    success: <Check className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
    info: <Info className="w-5 h-5 text-blue-400" />,
    loading: <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />,
    promise: <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />,
}

const toastStyles: Record<ToastType, string> = {
    success: 'border-green-500/20 bg-green-500/10',
    error: 'border-red-500/20 bg-red-500/10',
    warning: 'border-yellow-500/20 bg-yellow-500/10',
    info: 'border-blue-500/20 bg-blue-500/10',
    loading: 'border-purple-500/20 bg-purple-500/10',
    promise: 'border-purple-500/20 bg-purple-500/10',
}

interface ToastItemProps {
    toast: Toast
    onDismiss: () => void
    index: number
    isTop: boolean
}

function ToastItem({ toast, onDismiss, index, isTop }: ToastItemProps) {
    const [isExiting, setIsExiting] = useState(false)
    const [progress, setProgress] = useState(100)
    const startTimeRef = useRef(Date.now())

    // Progress bar animation
    useEffect(() => {
        if (!toast.duration || toast.duration === 0) return

        const duration = toast.duration
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
            setProgress(remaining)
        }, 50)

        return () => clearInterval(interval)
    }, [toast.duration])

    const handleDismiss = () => {
        setIsExiting(true)
        setTimeout(onDismiss, 200)
    }

    const handleUndo = () => {
        toast.undoAction?.()
        handleDismiss()
    }

    return (
        <div
            className={`
                pointer-events-auto
                flex flex-col w-[380px] rounded-xl border backdrop-blur-xl
                shadow-xl overflow-hidden
                transform transition-all duration-300 ease-out
                ${toastStyles[toast.type]}
                ${isExiting
                    ? 'opacity-0 scale-95 translate-x-4'
                    : 'opacity-100 scale-100 translate-x-0'
                }
            `}
            style={{
                animationDelay: `${index * 50}ms`,
            }}
            role="alert"
            aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
        >
            <div className="flex items-start gap-3 p-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                    {toast.icon || toastIcons[toast.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{toast.title}</p>
                    {toast.description && (
                        <p className="mt-1 text-sm text-gray-400">{toast.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                        {toast.action && (
                            <button
                                onClick={toast.action.onClick}
                                className={`
                                    text-sm font-medium px-3 py-1.5 rounded-lg transition-colors
                                    ${toast.action.variant === 'primary'
                                        ? 'bg-purple-500 text-white hover:bg-purple-400'
                                        : toast.action.variant === 'destructive'
                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                    }
                                `}
                            >
                                {toast.action.label}
                            </button>
                        )}
                        {toast.undoAction && (
                            <button
                                onClick={handleUndo}
                                className="flex items-center gap-1.5 text-sm font-medium text-purple-400 hover:text-purple-300"
                            >
                                <Undo2 className="w-3.5 h-3.5" />
                                Undo
                            </button>
                        )}
                    </div>
                </div>

                {/* Dismiss button */}
                {toast.dismissible && toast.type !== 'loading' && (
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Dismiss notification"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Progress bar */}
            {toast.duration && toast.duration > 0 && (
                <div className="h-1 bg-white/5">
                    <div
                        className="h-full bg-white/20 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    )
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export const toast = {
    success: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'createdAt'>>) => {
        // This would need access to the context, so we'll use a different pattern
        console.warn('Use useToast().addToast() instead')
    },
    error: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'createdAt'>>) => {
        console.warn('Use useToast().addToast() instead')
    },
    warning: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'createdAt'>>) => {
        console.warn('Use useToast().addToast() instead')
    },
    info: (title: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'createdAt'>>) => {
        console.warn('Use useToast().addToast() instead')
    },
}

// ============================================================================
// PRESET TOASTS
// ============================================================================

export function usePresetToasts() {
    const { addToast, promise } = useToast()

    return {
        success: (title: string, options?: Partial<Toast>) =>
            addToast({ type: 'success', title, ...options }),

        error: (title: string, options?: Partial<Toast>) =>
            addToast({ type: 'error', title, ...options }),

        warning: (title: string, options?: Partial<Toast>) =>
            addToast({ type: 'warning', title, ...options }),

        info: (title: string, options?: Partial<Toast>) =>
            addToast({ type: 'info', title, ...options }),

        loading: (title: string, options?: Partial<Toast>) =>
            addToast({ type: 'loading', title, duration: 0, ...options }),

        promise,

        // Preset patterns
        saved: () => addToast({
            type: 'success',
            title: 'Changes saved',
            duration: 2000,
        }),

        deleted: (itemName: string, undoAction?: () => void) => addToast({
            type: 'success',
            title: `${itemName} deleted`,
            undoAction,
            duration: 5000,
        }),

        copied: () => addToast({
            type: 'success',
            title: 'Copied to clipboard',
            duration: 2000,
        }),

        networkError: () => addToast({
            type: 'error',
            title: 'Network error',
            description: 'Please check your connection and try again.',
            action: {
                label: 'Retry',
                onClick: () => window.location.reload(),
            },
        }),

        permissionDenied: () => addToast({
            type: 'error',
            title: 'Permission denied',
            description: 'You don\'t have access to perform this action.',
        }),

        fileUploaded: (fileName: string) => addToast({
            type: 'success',
            title: 'File uploaded',
            description: fileName,
        }),

        updateAvailable: (onUpdate: () => void) => addToast({
            type: 'info',
            title: 'Update available',
            description: 'A new version is ready to install.',
            action: {
                label: 'Update now',
                onClick: onUpdate,
                variant: 'primary',
            },
            duration: 0,
        }),
    }
}
