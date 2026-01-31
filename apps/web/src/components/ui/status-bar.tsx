/**
 * SprintLoop Status Bar
 * 
 * VS Code-style status bar with:
 * - Language mode
 * - Git branch
 * - Cursor position
 * - Problems count
 * - Encoding
 * - Notifications
 */

import React from 'react'
import { create } from 'zustand'
import {
    GitBranch,
    AlertTriangle,
    AlertCircle,
    Bell,
    Wifi,
    WifiOff,
    Zap,
    Check,
    X,
    Loader2,
    Cloud,
    Terminal,
    Braces,
    FileCode
} from 'lucide-react'

// ============================================================================
// STATUS BAR STATE
// ============================================================================

interface StatusBarState {
    // Editor info
    cursorLine: number
    cursorColumn: number
    selectionCount: number
    language: string
    encoding: string
    eol: 'LF' | 'CRLF'
    indentSize: number
    indentType: 'spaces' | 'tabs'

    // Git
    gitBranch: string | null
    gitChanges: { staged: number; unstaged: number }

    // Problems
    errors: number
    warnings: number

    // Status
    isOnline: boolean
    isSyncing: boolean
    notifications: number

    // Background tasks
    backgroundTasks: Array<{
        id: string
        label: string
        progress?: number
    }>

    // Actions
    setCursorPosition: (line: number, column: number) => void
    setLanguage: (language: string) => void
    setGitInfo: (branch: string | null, changes?: { staged: number; unstaged: number }) => void
    setProblems: (errors: number, warnings: number) => void
    setOnlineStatus: (isOnline: boolean) => void
    addBackgroundTask: (task: { id: string; label: string; progress?: number }) => void
    removeBackgroundTask: (id: string) => void
    updateBackgroundTask: (id: string, progress: number) => void
}

export const useStatusBar = create<StatusBarState>()((set) => ({
    cursorLine: 1,
    cursorColumn: 1,
    selectionCount: 0,
    language: 'TypeScript',
    encoding: 'UTF-8',
    eol: 'LF',
    indentSize: 4,
    indentType: 'spaces',

    gitBranch: 'main',
    gitChanges: { staged: 0, unstaged: 0 },

    errors: 0,
    warnings: 0,

    isOnline: true,
    isSyncing: false,
    notifications: 0,

    backgroundTasks: [],

    setCursorPosition: (line, column) => set({ cursorLine: line, cursorColumn: column }),
    setLanguage: (language) => set({ language }),
    setGitInfo: (branch, changes) => set({
        gitBranch: branch,
        gitChanges: changes || { staged: 0, unstaged: 0 }
    }),
    setProblems: (errors, warnings) => set({ errors, warnings }),
    setOnlineStatus: (isOnline) => set({ isOnline }),
    addBackgroundTask: (task) => set(state => ({
        backgroundTasks: [...state.backgroundTasks, task]
    })),
    removeBackgroundTask: (id) => set(state => ({
        backgroundTasks: state.backgroundTasks.filter(t => t.id !== id)
    })),
    updateBackgroundTask: (id, progress) => set(state => ({
        backgroundTasks: state.backgroundTasks.map(t =>
            t.id === id ? { ...t, progress } : t
        )
    })),
}))

// ============================================================================
// STATUS BAR ITEM
// ============================================================================

interface StatusBarItemProps {
    children: React.ReactNode
    onClick?: () => void
    tooltip?: string
    className?: string
    side?: 'left' | 'right'
}

function StatusBarItem({ children, onClick, tooltip, className }: StatusBarItemProps) {
    return (
        <button
            onClick={onClick}
            title={tooltip}
            className={`
                flex items-center gap-1.5 px-2 py-0.5 text-xs
                transition-colors whitespace-nowrap
                ${onClick ? 'hover:bg-white/5 cursor-pointer' : 'cursor-default'}
                ${className || ''}
            `}
        >
            {children}
        </button>
    )
}

// ============================================================================
// STATUS BAR COMPONENT
// ============================================================================

interface StatusBarProps {
    onLanguageClick?: () => void
    onEncodingClick?: () => void
    onLineEndingClick?: () => void
    onIndentClick?: () => void
    onProblemsClick?: () => void
    onNotificationsClick?: () => void
    onGitClick?: () => void
    className?: string
}

export function StatusBar({
    onLanguageClick,
    onEncodingClick,
    onLineEndingClick,
    onIndentClick,
    onProblemsClick,
    onNotificationsClick,
    onGitClick,
    className,
}: StatusBarProps) {
    const {
        cursorLine,
        cursorColumn,
        selectionCount,
        language,
        encoding,
        eol,
        indentSize,
        indentType,
        gitBranch,
        gitChanges,
        errors,
        warnings,
        isOnline,
        isSyncing,
        notifications,
        backgroundTasks,
    } = useStatusBar()

    return (
        <div
            className={`
                flex items-center justify-between
                h-6 px-1 text-gray-400
                bg-slate-950 border-t border-white/5
                ${className || ''}
            `}
        >
            {/* Left side */}
            <div className="flex items-center">
                {/* Git branch */}
                {gitBranch && (
                    <StatusBarItem onClick={onGitClick} tooltip="Git branch">
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>{gitBranch}</span>
                        {(gitChanges.staged > 0 || gitChanges.unstaged > 0) && (
                            <span className="text-yellow-400">
                                {gitChanges.unstaged > 0 && `+${gitChanges.unstaged}`}
                                {gitChanges.staged > 0 && ` ●${gitChanges.staged}`}
                            </span>
                        )}
                    </StatusBarItem>
                )}

                {/* Sync status */}
                {isSyncing && (
                    <StatusBarItem tooltip="Syncing...">
                        <Cloud className="w-3.5 h-3.5 animate-pulse text-blue-400" />
                    </StatusBarItem>
                )}

                {/* Problems */}
                {(errors > 0 || warnings > 0) && (
                    <StatusBarItem onClick={onProblemsClick} tooltip="View problems">
                        {errors > 0 && (
                            <span className="flex items-center gap-1 text-red-400">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {errors}
                            </span>
                        )}
                        {warnings > 0 && (
                            <span className="flex items-center gap-1 text-yellow-400 ml-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {warnings}
                            </span>
                        )}
                    </StatusBarItem>
                )}

                {/* Background tasks */}
                {backgroundTasks.map(task => (
                    <StatusBarItem key={task.id} tooltip={task.label}>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                        <span>{task.label}</span>
                        {task.progress !== undefined && (
                            <span className="text-gray-500">{task.progress}%</span>
                        )}
                    </StatusBarItem>
                ))}
            </div>

            {/* Right side */}
            <div className="flex items-center">
                {/* Cursor position */}
                <StatusBarItem tooltip="Go to line">
                    <span>Ln {cursorLine}, Col {cursorColumn}</span>
                    {selectionCount > 0 && (
                        <span className="text-gray-500">({selectionCount} selected)</span>
                    )}
                </StatusBarItem>

                {/* Indent */}
                <StatusBarItem onClick={onIndentClick} tooltip="Select indent">
                    <span>{indentType === 'spaces' ? 'Spaces' : 'Tab Size'}: {indentSize}</span>
                </StatusBarItem>

                {/* Encoding */}
                <StatusBarItem onClick={onEncodingClick} tooltip="Select encoding">
                    {encoding}
                </StatusBarItem>

                {/* Line ending */}
                <StatusBarItem onClick={onLineEndingClick} tooltip="Select end of line sequence">
                    {eol}
                </StatusBarItem>

                {/* Language */}
                <StatusBarItem onClick={onLanguageClick} tooltip="Select language mode">
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{language}</span>
                </StatusBarItem>

                {/* Connection status */}
                <StatusBarItem tooltip={isOnline ? 'Online' : 'Offline'}>
                    {isOnline ? (
                        <Wifi className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                        <WifiOff className="w-3.5 h-3.5 text-red-400" />
                    )}
                </StatusBarItem>

                {/* Notifications */}
                <StatusBarItem onClick={onNotificationsClick} tooltip="Notifications">
                    <Bell className="w-3.5 h-3.5" />
                    {notifications > 0 && (
                        <span className="bg-purple-500 text-white px-1 rounded text-[10px]">
                            {notifications}
                        </span>
                    )}
                </StatusBarItem>
            </div>
        </div>
    )
}

// ============================================================================
// MINI STATUS INDICATOR
// ============================================================================

interface MiniStatusProps {
    status: 'idle' | 'loading' | 'success' | 'error'
    message?: string
}

export function MiniStatus({ status, message }: MiniStatusProps) {
    const icons = {
        idle: null,
        loading: <Loader2 className="w-3 h-3 animate-spin text-blue-400" />,
        success: <Check className="w-3 h-3 text-green-400" />,
        error: <X className="w-3 h-3 text-red-400" />,
    }

    if (status === 'idle' && !message) return null

    return (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
            {icons[status]}
            {message && <span>{message}</span>}
        </div>
    )
}

// ============================================================================
// BREADCRUMB STATUS
// ============================================================================

interface BreadcrumbStatusProps {
    items: Array<{
        label: string
        icon?: React.ReactNode
        onClick?: () => void
    }>
}

export function BreadcrumbStatus({ items }: BreadcrumbStatusProps) {
    return (
        <nav className="flex items-center gap-1 text-xs text-gray-500">
            {items.map((item, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <span className="text-gray-600">/</span>}
                    <button
                        onClick={item.onClick}
                        className={`
                            flex items-center gap-1 px-1 py-0.5 rounded
                            ${item.onClick ? 'hover:text-white hover:bg-white/5 cursor-pointer' : ''}
                        `}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                </React.Fragment>
            ))}
        </nav>
    )
}

// ============================================================================
// ACTIVITY INDICATOR
// ============================================================================

interface ActivityIndicatorProps {
    activities: Array<{
        id: string
        type: 'ai' | 'sync' | 'build' | 'test'
        label: string
        isActive: boolean
    }>
}

export function ActivityIndicator({ activities }: ActivityIndicatorProps) {
    const activeCount = activities.filter(a => a.isActive).length

    if (activeCount === 0) return null

    const icons = {
        ai: <Zap className="w-3.5 h-3.5 text-purple-400" />,
        sync: <Cloud className="w-3.5 h-3.5 text-blue-400" />,
        build: <Braces className="w-3.5 h-3.5 text-yellow-400" />,
        test: <Terminal className="w-3.5 h-3.5 text-green-400" />,
    }

    return (
        <div className="flex items-center gap-2">
            {activities.filter(a => a.isActive).map(activity => (
                <div
                    key={activity.id}
                    className="flex items-center gap-1.5 text-xs text-gray-400"
                    title={activity.label}
                >
                    <span className="animate-pulse">{icons[activity.type]}</span>
                    <span>{activity.label}</span>
                </div>
            ))}
        </div>
    )
}
