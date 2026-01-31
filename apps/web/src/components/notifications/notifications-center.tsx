/**
 * SprintLoop Notifications Center System
 * 
 * Phase 1851-1900: Notifications
 * - Notification list
 * - Read/unread status
 * - Actions
 * - Categories
 * - Clear all
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
    Bell,
    BellOff,
    Check,
    X,
    Trash2,
    Settings,
    AlertCircle,
    AlertTriangle,
    Info,
    CheckCircle,
    GitBranch,
    Download,
    Upload,
    Zap,
    MessageSquare,
    ExternalLink,
    ChevronDown,
    Filter,
    Clock
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type NotificationType = 'info' | 'success' | 'warning' | 'error'
type NotificationCategory = 'system' | 'git' | 'extension' | 'ai' | 'task'

interface Notification {
    id: string
    type: NotificationType
    category: NotificationCategory
    title: string
    message?: string
    timestamp: Date
    read: boolean
    actions?: NotificationAction[]
    source?: string
    link?: string
}

interface NotificationAction {
    label: string
    primary?: boolean
    onClick: () => void
}

// ============================================================================
// NOTIFICATION ICON
// ============================================================================

function NotificationIcon({ type, category }: { type: NotificationType; category: NotificationCategory }) {
    // Category icons take precedence
    if (category === 'git') return <GitBranch className="w-4 h-4 text-purple-400" />
    if (category === 'extension') return <Download className="w-4 h-4 text-blue-400" />
    if (category === 'ai') return <Zap className="w-4 h-4 text-purple-400" />
    if (category === 'task') return <CheckCircle className="w-4 h-4 text-green-400" />

    // Fall back to type icons
    const icons: Record<NotificationType, React.ReactNode> = {
        info: <Info className="w-4 h-4 text-blue-400" />,
        success: <CheckCircle className="w-4 h-4 text-green-400" />,
        warning: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
        error: <AlertCircle className="w-4 h-4 text-red-400" />,
    }

    return icons[type]
}

// ============================================================================
// NOTIFICATION ITEM
// ============================================================================

interface NotificationItemProps {
    notification: Notification
    onRead?: () => void
    onDismiss?: () => void
    onAction?: (action: NotificationAction) => void
}

function NotificationItem({
    notification,
    onRead,
    onDismiss,
    onAction,
}: NotificationItemProps) {
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
            onClick={onRead}
            className={`
                group relative px-4 py-3 border-b border-white/5 cursor-pointer transition-colors
                ${notification.read ? 'bg-transparent' : 'bg-white/5'}
                hover:bg-white/5
            `}
        >
            {/* Unread indicator */}
            {!notification.read && (
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-purple-500 rounded-full" />
            )}

            <div className="flex items-start gap-3">
                <NotificationIcon type={notification.type} category={notification.category} />

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${notification.read ? 'text-gray-400' : 'text-white'}`}>
                            {notification.title}
                        </span>
                        {notification.source && (
                            <span className="text-xs text-gray-600">{notification.source}</span>
                        )}
                    </div>

                    {notification.message && (
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                            {notification.message}
                        </p>
                    )}

                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(notification.timestamp)}
                        </span>

                        {notification.actions && (
                            <div className="flex items-center gap-2">
                                {notification.actions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onAction?.(action)
                                        }}
                                        className={`text-xs px-2 py-0.5 rounded transition-colors ${action.primary
                                                ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {notification.link && (
                            <button className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
                                Open <ExternalLink className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onDismiss?.()
                    }}
                    className="p-1 text-gray-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                    title="Dismiss"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

// ============================================================================
// NOTIFICATIONS CENTER
// ============================================================================

interface NotificationsCenterProps {
    notifications?: Notification[]
    onMarkRead?: (id: string) => void
    onMarkAllRead?: () => void
    onDismiss?: (id: string) => void
    onClearAll?: () => void
    onAction?: (notification: Notification, action: NotificationAction) => void
    className?: string
}

export function NotificationsCenter({
    notifications: propNotifications,
    onMarkRead,
    onMarkAllRead,
    onDismiss,
    onClearAll,
    onAction,
    className = '',
}: NotificationsCenterProps) {
    const [filter, setFilter] = useState<NotificationCategory | 'all'>('all')
    const [showUnreadOnly, setShowUnreadOnly] = useState(false)

    // Demo data
    const defaultNotifications: Notification[] = [
        {
            id: 'n1',
            type: 'info',
            category: 'git',
            title: 'Pull request merged',
            message: 'PR #142 "Add new feature" was merged into main',
            timestamp: new Date(Date.now() - 300000),
            read: false,
            actions: [
                { label: 'View PR', primary: true, onClick: () => { } },
            ],
        },
        {
            id: 'n2',
            type: 'success',
            category: 'extension',
            title: 'Extension updated',
            message: 'Prettier - Code formatter was updated to v3.0.0',
            timestamp: new Date(Date.now() - 3600000),
            read: false,
            source: 'Extensions',
        },
        {
            id: 'n3',
            type: 'warning',
            category: 'system',
            title: 'High memory usage',
            message: 'The editor is using more than 80% of available memory',
            timestamp: new Date(Date.now() - 7200000),
            read: true,
            actions: [
                { label: 'Reload Window', primary: true, onClick: () => { } },
                { label: 'Ignore', onClick: () => { } },
            ],
        },
        {
            id: 'n4',
            type: 'info',
            category: 'ai',
            title: 'AI suggestion available',
            message: 'Generated refactoring suggestions for App.tsx',
            timestamp: new Date(Date.now() - 86400000),
            read: true,
            actions: [
                { label: 'View', primary: true, onClick: () => { } },
            ],
        },
        {
            id: 'n5',
            type: 'success',
            category: 'task',
            title: 'Build completed',
            message: 'Production build finished successfully in 32s',
            timestamp: new Date(Date.now() - 172800000),
            read: true,
        },
    ]

    const notifications = propNotifications || defaultNotifications

    // Filter notifications
    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            if (filter !== 'all' && n.category !== filter) return false
            if (showUnreadOnly && n.read) return false
            return true
        })
    }, [notifications, filter, showUnreadOnly])

    // Counts
    const unreadCount = notifications.filter(n => !n.read).length
    const categoryIcon: Record<NotificationCategory, React.ReactNode> = {
        system: <Settings className="w-4 h-4" />,
        git: <GitBranch className="w-4 h-4" />,
        extension: <Download className="w-4 h-4" />,
        ai: <Zap className="w-4 h-4" />,
        task: <CheckCircle className="w-4 h-4" />,
    }

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-white">Notifications</span>
                    {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                        <button
                            onClick={onMarkAllRead}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                            title="Mark all as read"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={onClearAll}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                            title="Clear all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as NotificationCategory | 'all')}
                    className="px-2 py-1 bg-white/5 border border-white/10 rounded text-sm text-gray-400 focus:outline-none focus:border-purple-500"
                >
                    <option value="all">All Categories</option>
                    <option value="system">System</option>
                    <option value="git">Git</option>
                    <option value="extension">Extensions</option>
                    <option value="ai">AI</option>
                    <option value="task">Tasks</option>
                </select>

                <button
                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm transition-colors ${showUnreadOnly
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'text-gray-400 hover:bg-white/5'
                        }`}
                >
                    <Filter className="w-3.5 h-3.5" />
                    Unread only
                </button>
            </div>

            {/* Notifications list */}
            <div className="flex-1 overflow-y-auto">
                {filteredNotifications.map(notification => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onRead={() => onMarkRead?.(notification.id)}
                        onDismiss={() => onDismiss?.(notification.id)}
                        onAction={(action) => onAction?.(notification, action)}
                    />
                ))}

                {filteredNotifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <BellOff className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No notifications</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// NOTIFICATION BADGE
// ============================================================================

interface NotificationBadgeProps {
    count: number
    onClick?: () => void
    className?: string
}

export function NotificationBadge({
    count,
    onClick,
    className = '',
}: NotificationBadgeProps) {
    return (
        <button
            onClick={onClick}
            className={`relative p-2 text-gray-400 hover:text-white transition-colors ${className}`}
        >
            <Bell className="w-5 h-5" />
            {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </button>
    )
}
