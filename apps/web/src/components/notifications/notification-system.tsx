/**
 * SprintLoop Notification System Pro
 * 
 * Phase 951-1000: Advanced notifications
 * - Rich notifications
 * - Action buttons
 * - Progress notifications
 * - Notification center
 * - Do Not Disturb mode
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
    Bell,
    BellOff,
    X,
    Check,
    AlertTriangle,
    Info,
    AlertCircle,
    Zap,
    ExternalLink,
    Settings,
    Trash2,
    CheckCheck,
    Clock,
    Download,
    GitBranch,
    MessageSquare,
    Users,
    Mail
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'default'

interface NotificationAction {
    label: string
    onClick: () => void
    variant?: 'default' | 'primary' | 'danger'
}

interface Notification {
    id: string
    type: NotificationType
    title: string
    message?: string
    icon?: React.ReactNode
    timestamp: Date
    read: boolean
    actions?: NotificationAction[]
    progress?: number
    category?: string
    link?: string
    dismissible?: boolean
    persistent?: boolean
}

interface NotificationContextValue {
    notifications: Notification[]
    unreadCount: number
    doNotDisturb: boolean
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string
    updateNotification: (id: string, updates: Partial<Notification>) => void
    removeNotification: (id: string) => void
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    clearAll: () => void
    toggleDoNotDisturb: () => void
}

// ============================================================================
// CONTEXT
// ============================================================================

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) throw new Error('useNotifications must be used within NotificationProvider')
    return context
}

// ============================================================================
// PROVIDER
// ============================================================================

interface NotificationProviderProps {
    children: React.ReactNode
    maxNotifications?: number
}

export function NotificationProvider({
    children,
    maxNotifications = 100,
}: NotificationProviderProps) {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [doNotDisturb, setDoNotDisturb] = useState(false)

    const unreadCount = notifications.filter(n => !n.read).length

    // Load saved state
    useEffect(() => {
        const saved = localStorage.getItem('sprintloop-notifications')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setNotifications(parsed.notifications?.map((n: Notification) => ({
                    ...n,
                    timestamp: new Date(n.timestamp),
                })) || [])
                setDoNotDisturb(parsed.doNotDisturb || false)
            } catch {
                // Use defaults
            }
        }
    }, [])

    // Save state
    useEffect(() => {
        localStorage.setItem('sprintloop-notifications', JSON.stringify({
            notifications,
            doNotDisturb,
        }))
    }, [notifications, doNotDisturb])

    const addNotification = useCallback((
        notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
    ): string => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`
        const newNotification: Notification = {
            ...notification,
            id,
            timestamp: new Date(),
            read: false,
            dismissible: notification.dismissible ?? true,
        }

        setNotifications(prev => [newNotification, ...prev].slice(0, maxNotifications))

        // Show browser notification if not in DND mode
        if (!doNotDisturb && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
            })
        }

        return id
    }, [maxNotifications, doNotDisturb])

    const updateNotification = useCallback((id: string, updates: Partial<Notification>) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, ...updates } : n)
        )
    }, [])

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }, [])

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        )
    }, [])

    const markAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }, [])

    const clearAll = useCallback(() => {
        setNotifications([])
    }, [])

    const toggleDoNotDisturb = useCallback(() => {
        setDoNotDisturb(prev => !prev)
    }, [])

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                doNotDisturb,
                addNotification,
                updateNotification,
                removeNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
                toggleDoNotDisturb,
            }}
        >
            {children}
        </NotificationContext.Provider>
    )
}

// ============================================================================
// NOTIFICATION ITEM
// ============================================================================

interface NotificationItemProps {
    notification: Notification
    onDismiss?: () => void
    onClick?: () => void
    compact?: boolean
}

export function NotificationItem({
    notification,
    onDismiss,
    onClick,
    compact = false,
}: NotificationItemProps) {
    const { markAsRead } = useNotifications()

    const typeIcons = {
        default: <Bell className="w-5 h-5 text-gray-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />,
        success: <Check className="w-5 h-5 text-green-400" />,
        warning: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
        error: <AlertCircle className="w-5 h-5 text-red-400" />,
    }

    const typeBgColors = {
        default: '',
        info: 'bg-blue-500/5',
        success: 'bg-green-500/5',
        warning: 'bg-yellow-500/5',
        error: 'bg-red-500/5',
    }

    const handleClick = () => {
        markAsRead(notification.id)
        onClick?.()
        if (notification.link) {
            window.open(notification.link, '_blank')
        }
    }

    const formatTime = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        if (days < 7) return `${days}d ago`
        return date.toLocaleDateString()
    }

    return (
        <div
            className={`
                relative flex gap-3 px-4 py-3 transition-colors cursor-pointer
                ${typeBgColors[notification.type]}
                ${!notification.read ? 'border-l-2 border-purple-500' : ''}
                hover:bg-white/5
            `}
            onClick={handleClick}
        >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
                {notification.icon || typeIcons[notification.type]}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-sm font-medium ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                        {notification.title}
                    </h4>
                    {notification.dismissible && onDismiss && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDismiss()
                            }}
                            className="flex-shrink-0 p-1 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {notification.message && !compact && (
                    <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                )}

                {/* Progress bar */}
                {notification.progress !== undefined && (
                    <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-500 transition-all duration-300"
                            style={{ width: `${notification.progress}%` }}
                        />
                    </div>
                )}

                {/* Actions */}
                {notification.actions && notification.actions.length > 0 && !compact && (
                    <div className="flex items-center gap-2 mt-2">
                        {notification.actions.map((action, i) => (
                            <button
                                key={i}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    action.onClick()
                                }}
                                className={`
                                    px-3 py-1 text-xs rounded-lg transition-colors
                                    ${action.variant === 'primary'
                                        ? 'bg-purple-500 text-white hover:bg-purple-400'
                                        : action.variant === 'danger'
                                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                            : 'bg-white/5 text-gray-400 hover:text-white'
                                    }
                                `}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-600">
                        {formatTime(notification.timestamp)}
                    </span>
                    {notification.category && (
                        <>
                            <span className="text-gray-700">•</span>
                            <span className="text-xs text-gray-600">{notification.category}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// NOTIFICATION CENTER
// ============================================================================

interface NotificationCenterProps {
    isOpen: boolean
    onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
    const {
        notifications,
        unreadCount,
        doNotDisturb,
        removeNotification,
        markAllAsRead,
        clearAll,
        toggleDoNotDisturb,
    } = useNotifications()

    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    const filteredNotifications = filter === 'unread'
        ? notifications.filter(n => !n.read)
        : notifications

    // Group by date
    const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
        const date = notification.timestamp.toDateString()
        if (!groups[date]) groups[date] = []
        groups[date].push(notification)
        return groups
    }, {} as Record<string, Notification[]>)

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-slate-900 border-l border-white/10 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-purple-400" />
                        <h2 className="font-medium text-white">Notifications</h2>
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 bg-purple-500 text-white text-xs rounded-full">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === 'all'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${filter === 'unread'
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Unread
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleDoNotDisturb}
                            className={`p-1.5 rounded transition-colors ${doNotDisturb
                                    ? 'text-yellow-400 bg-yellow-500/10'
                                    : 'text-gray-400 hover:text-white'
                                }`}
                            title={doNotDisturb ? 'Disable Do Not Disturb' : 'Enable Do Not Disturb'}
                        >
                            {doNotDisturb ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={markAllAsRead}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                            title="Mark all as read"
                        >
                            <CheckCheck className="w-4 h-4" />
                        </button>
                        <button
                            onClick={clearAll}
                            className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                            title="Clear all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Notifications list */}
                <div className="flex-1 overflow-y-auto">
                    {Object.keys(groupedNotifications).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <Bell className="w-12 h-12 mb-3 opacity-30" />
                            <p>No notifications</p>
                        </div>
                    ) : (
                        Object.entries(groupedNotifications).map(([date, items]) => (
                            <div key={date}>
                                <div className="px-4 py-2 text-xs text-gray-500 uppercase bg-slate-800/50">
                                    {new Date(date).toDateString() === new Date().toDateString()
                                        ? 'Today'
                                        : new Date(date).toDateString() === new Date(Date.now() - 86400000).toDateString()
                                            ? 'Yesterday'
                                            : date}
                                </div>
                                {items.map(notification => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onDismiss={() => removeNotification(notification.id)}
                                    />
                                ))}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// NOTIFICATION BELL
// ============================================================================

interface NotificationBellProps {
    className?: string
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
    const { unreadCount, doNotDisturb } = useNotifications()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={`relative p-2 text-gray-400 hover:text-white transition-colors ${className}`}
            >
                {doNotDisturb ? (
                    <BellOff className="w-5 h-5" />
                ) : (
                    <Bell className="w-5 h-5" />
                )}
                {unreadCount > 0 && !doNotDisturb && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
            </button>

            <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    )
}

// ============================================================================
// NOTIFICATION PRESETS
// ============================================================================

export function useNotificationPresets() {
    const { addNotification, updateNotification, removeNotification } = useNotifications()

    return {
        // Build notifications
        buildStarted: () => addNotification({
            type: 'info',
            title: 'Build Started',
            message: 'Your project is being compiled...',
            icon: <Zap className="w-5 h-5 text-yellow-400" />,
            category: 'Build',
            progress: 0,
        }),

        buildProgress: (id: string, progress: number) => updateNotification(id, { progress }),

        buildCompleted: (id: string, success: boolean) => {
            if (success) {
                updateNotification(id, {
                    type: 'success',
                    title: 'Build Completed',
                    message: 'Your project built successfully!',
                    progress: 100,
                })
            } else {
                updateNotification(id, {
                    type: 'error',
                    title: 'Build Failed',
                    message: 'There were errors during compilation.',
                    progress: undefined,
                    actions: [
                        { label: 'View Errors', onClick: () => console.log('View errors'), variant: 'primary' },
                    ],
                })
            }
        },

        // Git notifications
        gitPush: () => addNotification({
            type: 'success',
            title: 'Changes Pushed',
            message: 'Your changes have been pushed to origin/main',
            icon: <GitBranch className="w-5 h-5 text-green-400" />,
            category: 'Git',
        }),

        gitPullRequest: (prNumber: number) => addNotification({
            type: 'info',
            title: 'New Pull Request',
            message: `PR #${prNumber} needs your review`,
            icon: <GitBranch className="w-5 h-5 text-purple-400" />,
            category: 'Git',
            actions: [
                { label: 'Review', onClick: () => console.log('Review PR'), variant: 'primary' },
            ],
        }),

        // Collaboration
        userJoined: (userName: string) => addNotification({
            type: 'default',
            title: 'User Joined',
            message: `${userName} joined the session`,
            icon: <Users className="w-5 h-5 text-blue-400" />,
            category: 'Collaboration',
        }),

        messageReceived: (from: string) => addNotification({
            type: 'default',
            title: 'New Message',
            message: `${from} sent you a message`,
            icon: <MessageSquare className="w-5 h-5 text-green-400" />,
            category: 'Messages',
        }),

        // Updates
        updateAvailable: (version: string) => addNotification({
            type: 'info',
            title: 'Update Available',
            message: `SprintLoop ${version} is ready to install`,
            icon: <Download className="w-5 h-5 text-blue-400" />,
            category: 'Updates',
            persistent: true,
            actions: [
                { label: 'Install Now', onClick: () => console.log('Install update'), variant: 'primary' },
                { label: 'Later', onClick: () => console.log('Dismiss'), variant: 'default' },
            ],
        }),
    }
}
