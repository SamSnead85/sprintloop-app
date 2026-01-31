/**
 * SprintLoop Optimistic UI System
 * 
 * Phase 161-180: Optimistic updates and instant feedback
 * - Optimistic state management
 * - Rollback on error
 * - Pending indicators
 * - Conflict resolution
 */

import React, { useState, useCallback, useRef, createContext, useContext } from 'react'
import { Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type OptimisticStatus = 'idle' | 'pending' | 'success' | 'error' | 'conflict'

interface OptimisticAction<T> {
    id: string
    type: string
    optimisticValue: T
    previousValue: T
    status: OptimisticStatus
    timestamp: number
    error?: Error
}

interface OptimisticState<T> {
    value: T
    pendingActions: OptimisticAction<T>[]
    lastSyncedValue: T
    status: OptimisticStatus
}

// ============================================================================
// USE OPTIMISTIC STATE HOOK
// ============================================================================

interface UseOptimisticOptions<T> {
    initialValue: T
    onSync?: (value: T) => Promise<T>
    onError?: (error: Error, action: OptimisticAction<T>) => void
    conflictResolution?: 'local' | 'remote' | 'merge'
}

export function useOptimistic<T>({
    initialValue,
    onSync,
    onError,
    conflictResolution = 'remote',
}: UseOptimisticOptions<T>) {
    const [state, setState] = useState<OptimisticState<T>>({
        value: initialValue,
        pendingActions: [],
        lastSyncedValue: initialValue,
        status: 'idle',
    })

    const pendingRef = useRef<Map<string, Promise<T>>>(new Map())

    const update = useCallback(async (
        newValue: T | ((prev: T) => T),
        actionType: string = 'update'
    ) => {
        const actionId = `action-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const previousValue = state.value
        const optimisticValue = typeof newValue === 'function'
            ? (newValue as (prev: T) => T)(previousValue)
            : newValue

        // Apply optimistic update immediately
        const action: OptimisticAction<T> = {
            id: actionId,
            type: actionType,
            optimisticValue,
            previousValue,
            status: 'pending',
            timestamp: Date.now(),
        }

        setState(prev => ({
            ...prev,
            value: optimisticValue,
            pendingActions: [...prev.pendingActions, action],
            status: 'pending',
        }))

        // If no sync function, just mark as success
        if (!onSync) {
            setState(prev => ({
                ...prev,
                pendingActions: prev.pendingActions.filter(a => a.id !== actionId),
                lastSyncedValue: optimisticValue,
                status: prev.pendingActions.length === 1 ? 'idle' : 'pending',
            }))
            return
        }

        // Sync with server
        const syncPromise = onSync(optimisticValue)
        pendingRef.current.set(actionId, syncPromise)

        try {
            const serverValue = await syncPromise

            // Handle potential conflicts
            const currentState = state
            const hasConflict = currentState.lastSyncedValue !== previousValue

            if (hasConflict) {
                switch (conflictResolution) {
                    case 'local':
                        // Keep our value
                        setState(prev => ({
                            ...prev,
                            pendingActions: prev.pendingActions.filter(a => a.id !== actionId),
                            lastSyncedValue: optimisticValue,
                            status: prev.pendingActions.length === 1 ? 'success' : 'pending',
                        }))
                        break
                    case 'remote':
                        // Use server value
                        setState(prev => ({
                            ...prev,
                            value: serverValue,
                            pendingActions: prev.pendingActions.filter(a => a.id !== actionId),
                            lastSyncedValue: serverValue,
                            status: prev.pendingActions.length === 1 ? 'success' : 'pending',
                        }))
                        break
                    case 'merge':
                        // Mark as conflict for manual resolution
                        setState(prev => ({
                            ...prev,
                            pendingActions: prev.pendingActions.map(a =>
                                a.id === actionId ? { ...a, status: 'conflict' as const } : a
                            ),
                            status: 'conflict',
                        }))
                        break
                }
            } else {
                setState(prev => ({
                    ...prev,
                    value: serverValue,
                    pendingActions: prev.pendingActions.filter(a => a.id !== actionId),
                    lastSyncedValue: serverValue,
                    status: prev.pendingActions.length === 1 ? 'success' : 'pending',
                }))
            }

            // Brief success state before idle
            setTimeout(() => {
                setState(prev => ({
                    ...prev,
                    status: prev.pendingActions.length === 0 ? 'idle' : prev.status,
                }))
            }, 1000)

        } catch (error) {
            // Rollback on error
            setState(prev => {
                const failedAction = prev.pendingActions.find(a => a.id === actionId)
                const rolledBackValue = failedAction?.previousValue ?? prev.lastSyncedValue

                return {
                    ...prev,
                    value: rolledBackValue,
                    pendingActions: prev.pendingActions.filter(a => a.id !== actionId),
                    status: 'error',
                }
            })

            onError?.(error as Error, action)
        } finally {
            pendingRef.current.delete(actionId)
        }
    }, [state, onSync, onError, conflictResolution])

    const retry = useCallback(async (actionId: string) => {
        const action = state.pendingActions.find(a => a.id === actionId)
        if (!action) return

        await update(action.optimisticValue, action.type)
    }, [state.pendingActions, update])

    const resolve = useCallback((resolution: 'local' | 'remote', actionId?: string) => {
        setState(prev => ({
            ...prev,
            value: resolution === 'local' ? prev.value : prev.lastSyncedValue,
            pendingActions: actionId
                ? prev.pendingActions.filter(a => a.id !== actionId)
                : [],
            status: 'idle',
        }))
    }, [])

    return {
        value: state.value,
        status: state.status,
        isPending: state.status === 'pending',
        hasError: state.status === 'error',
        hasConflict: state.status === 'conflict',
        pendingCount: state.pendingActions.length,
        update,
        retry,
        resolve,
    }
}

// ============================================================================
// OPTIMISTIC LIST HOOK
// ============================================================================

interface UseOptimisticListOptions<T> {
    initialItems: T[]
    getId: (item: T) => string
    onAdd?: (item: T) => Promise<T>
    onUpdate?: (item: T) => Promise<T>
    onRemove?: (id: string) => Promise<void>
}

export function useOptimisticList<T>({
    initialItems,
    getId,
    onAdd,
    onUpdate,
    onRemove,
}: UseOptimisticListOptions<T>) {
    const [items, setItems] = useState<T[]>(initialItems)
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())
    const [errorIds, setErrorIds] = useState<Set<string>>(new Set())

    const add = useCallback(async (item: T) => {
        const id = getId(item)

        // Optimistic add
        setItems(prev => [...prev, item])
        setPendingIds(prev => new Set([...prev, id]))

        if (onAdd) {
            try {
                const serverItem = await onAdd(item)
                setItems(prev => prev.map(i => getId(i) === id ? serverItem : i))
            } catch {
                // Rollback
                setItems(prev => prev.filter(i => getId(i) !== id))
                setErrorIds(prev => new Set([...prev, id]))
            } finally {
                setPendingIds(prev => {
                    const next = new Set(prev)
                    next.delete(id)
                    return next
                })
            }
        }
    }, [getId, onAdd])

    const update = useCallback(async (item: T) => {
        const id = getId(item)
        const originalItem = items.find(i => getId(i) === id)

        // Optimistic update
        setItems(prev => prev.map(i => getId(i) === id ? item : i))
        setPendingIds(prev => new Set([...prev, id]))

        if (onUpdate) {
            try {
                const serverItem = await onUpdate(item)
                setItems(prev => prev.map(i => getId(i) === id ? serverItem : i))
            } catch {
                // Rollback
                if (originalItem) {
                    setItems(prev => prev.map(i => getId(i) === id ? originalItem : i))
                }
                setErrorIds(prev => new Set([...prev, id]))
            } finally {
                setPendingIds(prev => {
                    const next = new Set(prev)
                    next.delete(id)
                    return next
                })
            }
        }
    }, [items, getId, onUpdate])

    const remove = useCallback(async (id: string) => {
        const originalItem = items.find(i => getId(i) === id)
        const originalIndex = items.findIndex(i => getId(i) === id)

        // Optimistic remove
        setItems(prev => prev.filter(i => getId(i) !== id))
        setPendingIds(prev => new Set([...prev, id]))

        if (onRemove) {
            try {
                await onRemove(id)
            } catch {
                // Rollback
                if (originalItem) {
                    setItems(prev => {
                        const next = [...prev]
                        next.splice(originalIndex, 0, originalItem)
                        return next
                    })
                }
                setErrorIds(prev => new Set([...prev, id]))
            } finally {
                setPendingIds(prev => {
                    const next = new Set(prev)
                    next.delete(id)
                    return next
                })
            }
        }
    }, [items, getId, onRemove])

    const isPending = useCallback((id: string) => pendingIds.has(id), [pendingIds])
    const hasError = useCallback((id: string) => errorIds.has(id), [errorIds])

    const clearError = useCallback((id: string) => {
        setErrorIds(prev => {
            const next = new Set(prev)
            next.delete(id)
            return next
        })
    }, [])

    return {
        items,
        add,
        update,
        remove,
        isPending,
        hasError,
        clearError,
        pendingCount: pendingIds.size,
    }
}

// ============================================================================
// STATUS INDICATOR COMPONENT
// ============================================================================

interface OptimisticStatusProps {
    status: OptimisticStatus
    pendingText?: string
    successText?: string
    errorText?: string
    conflictText?: string
    onRetry?: () => void
    className?: string
}

export function OptimisticStatus({
    status,
    pendingText = 'Saving...',
    successText = 'Saved',
    errorText = 'Failed to save',
    conflictText = 'Conflict detected',
    onRetry,
    className = '',
}: OptimisticStatusProps) {
    if (status === 'idle') return null

    const configs: Record<OptimisticStatus, { icon: React.ReactNode; text: string; color: string }> = {
        idle: { icon: null, text: '', color: '' },
        pending: {
            icon: <Loader2 className="w-4 h-4 animate-spin" />,
            text: pendingText,
            color: 'text-purple-400',
        },
        success: {
            icon: <Check className="w-4 h-4" />,
            text: successText,
            color: 'text-green-400',
        },
        error: {
            icon: <AlertCircle className="w-4 h-4" />,
            text: errorText,
            color: 'text-red-400',
        },
        conflict: {
            icon: <AlertCircle className="w-4 h-4" />,
            text: conflictText,
            color: 'text-yellow-400',
        },
    }

    const config = configs[status]

    return (
        <div className={`flex items-center gap-2 text-sm ${config.color} ${className}`}>
            {config.icon}
            <span>{config.text}</span>
            {status === 'error' && onRetry && (
                <button
                    onClick={onRetry}
                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                </button>
            )}
        </div>
    )
}

// ============================================================================
// PENDING OVERLAY
// ============================================================================

interface PendingOverlayProps {
    isPending: boolean
    children: React.ReactNode
    className?: string
}

export function PendingOverlay({ isPending, children, className = '' }: PendingOverlayProps) {
    return (
        <div className={`relative ${className}`}>
            {children}
            {isPending && (
                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-lg">
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                </div>
            )}
        </div>
    )
}

// ============================================================================
// OPTIMISTIC BUTTON
// ============================================================================

interface OptimisticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    status: OptimisticStatus
    loadingText?: string
    successText?: string
    children: React.ReactNode
}

export function OptimisticButton({
    status,
    loadingText,
    successText,
    children,
    disabled,
    className = '',
    ...props
}: OptimisticButtonProps) {
    const isLoading = status === 'pending'
    const isSuccess = status === 'success'

    return (
        <button
            {...props}
            disabled={disabled || isLoading}
            className={`
                inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                font-medium transition-all duration-200
                ${isSuccess
                    ? 'bg-green-500 text-white'
                    : 'bg-purple-500 hover:bg-purple-400 text-white'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
            `}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSuccess && <Check className="w-4 h-4" />}
            {isLoading ? (loadingText || children) : isSuccess ? (successText || 'Done') : children}
        </button>
    )
}

// ============================================================================
// CONFLICT RESOLUTION DIALOG
// ============================================================================

interface ConflictDialogProps {
    isOpen: boolean
    localValue: string
    remoteValue: string
    onResolve: (resolution: 'local' | 'remote') => void
    onClose: () => void
}

export function ConflictDialog({
    isOpen,
    localValue,
    remoteValue,
    onResolve,
    onClose,
}: ConflictDialogProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-lg w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">Conflict Detected</h3>
                </div>

                <p className="text-gray-400 mb-6">
                    Someone else made changes while you were editing. Choose which version to keep:
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <p className="text-sm text-purple-400 font-medium mb-2">Your changes</p>
                        <p className="text-white text-sm">{localValue}</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-sm text-blue-400 font-medium mb-2">Their changes</p>
                        <p className="text-white text-sm">{remoteValue}</p>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onResolve('remote')}
                        className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                    >
                        Use theirs
                    </button>
                    <button
                        onClick={() => onResolve('local')}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400"
                    >
                        Use mine
                    </button>
                </div>
            </div>
        </div>
    )
}
