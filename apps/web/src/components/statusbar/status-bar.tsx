/**
 * SprintLoop Status Bar System
 * 
 * Phase 2051-2100: Status bar
 * - Left/right sections
 * - Git status
 * - Language indicator
 * - Line/column
 * - Notifications
 */

import React, { useState } from 'react'
import {
    GitBranch,
    AlertCircle,
    AlertTriangle,
    Bell,
    Check,
    ChevronUp,
    Cloud,
    CloudOff,
    Loader2,
    Wifi,
    WifiOff,
    Zap,
    Radio,
    Play,
    Square,
    Terminal,
    Settings,
    RefreshCw
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface StatusBarItem {
    id: string
    content: React.ReactNode
    tooltip?: string
    onClick?: () => void
    priority?: number
}

interface GitStatus {
    branch: string
    ahead?: number
    behind?: number
    isDirty?: boolean
    isSyncing?: boolean
}

interface DiagnosticCounts {
    errors: number
    warnings: number
}

// ============================================================================
// STATUS BAR ITEM
// ============================================================================

interface StatusBarItemButtonProps {
    children: React.ReactNode
    tooltip?: string
    onClick?: () => void
    className?: string
}

function StatusBarItemButton({ children, tooltip, onClick, className = '' }: StatusBarItemButtonProps) {
    return (
        <button
            onClick={onClick}
            title={tooltip}
            className={`
                flex items-center gap-1.5 px-2 py-0.5 text-xs transition-colors
                ${onClick ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default'}
                ${className}
            `}
        >
            {children}
        </button>
    )
}

// ============================================================================
// GIT STATUS
// ============================================================================

interface GitStatusIndicatorProps {
    status: GitStatus
    onClick?: () => void
}

function GitStatusIndicator({ status, onClick }: GitStatusIndicatorProps) {
    return (
        <StatusBarItemButton onClick={onClick} tooltip="Source Control">
            {status.isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
                <GitBranch className="w-3.5 h-3.5" />
            )}
            <span className={status.isDirty ? 'text-yellow-400' : ''}>{status.branch}</span>
            {(status.ahead || status.behind) && (
                <span className="text-gray-500">
                    {status.behind && `↓${status.behind}`}
                    {status.ahead && `↑${status.ahead}`}
                </span>
            )}
        </StatusBarItemButton>
    )
}

// ============================================================================
// DIAGNOSTICS
// ============================================================================

interface DiagnosticsIndicatorProps {
    counts: DiagnosticCounts
    onClick?: () => void
}

function DiagnosticsIndicator({ counts, onClick }: DiagnosticsIndicatorProps) {
    const hasIssues = counts.errors > 0 || counts.warnings > 0

    return (
        <StatusBarItemButton onClick={onClick} tooltip="Problems">
            <div className="flex items-center gap-2">
                <span className={`flex items-center gap-0.5 ${counts.errors > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    {counts.errors}
                </span>
                <span className={`flex items-center gap-0.5 ${counts.warnings > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {counts.warnings}
                </span>
            </div>
        </StatusBarItemButton>
    )
}

// ============================================================================
// SYNC STATUS
// ============================================================================

interface SyncStatusProps {
    isSynced: boolean
    isSyncing?: boolean
    onClick?: () => void
}

function SyncStatus({ isSynced, isSyncing, onClick }: SyncStatusProps) {
    return (
        <StatusBarItemButton onClick={onClick} tooltip={isSynced ? 'Synced' : 'Not synced'}>
            {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
            ) : isSynced ? (
                <Cloud className="w-3.5 h-3.5 text-green-400" />
            ) : (
                <CloudOff className="w-3.5 h-3.5 text-gray-500" />
            )}
        </StatusBarItemButton>
    )
}

// ============================================================================
// LANGUAGE INDICATOR
// ============================================================================

interface LanguageIndicatorProps {
    language: string
    onClick?: () => void
}

function LanguageIndicator({ language, onClick }: LanguageIndicatorProps) {
    return (
        <StatusBarItemButton onClick={onClick} tooltip="Select Language Mode">
            {language}
        </StatusBarItemButton>
    )
}

// ============================================================================
// CURSOR POSITION
// ============================================================================

interface CursorPositionProps {
    line: number
    column: number
    selected?: number
    onClick?: () => void
}

function CursorPosition({ line, column, selected, onClick }: CursorPositionProps) {
    return (
        <StatusBarItemButton onClick={onClick} tooltip="Go to Line">
            Ln {line}, Col {column}
            {selected && selected > 0 && (
                <span className="text-gray-500">({selected} selected)</span>
            )}
        </StatusBarItemButton>
    )
}

// ============================================================================
// ENCODING
// ============================================================================

interface EncodingIndicatorProps {
    encoding: string
    onClick?: () => void
}

function EncodingIndicator({ encoding, onClick }: EncodingIndicatorProps) {
    return (
        <StatusBarItemButton onClick={onClick} tooltip="Select Encoding">
            {encoding}
        </StatusBarItemButton>
    )
}

// ============================================================================
// END OF LINE
// ============================================================================

interface EOLIndicatorProps {
    eol: 'LF' | 'CRLF'
    onClick?: () => void
}

function EOLIndicator({ eol, onClick }: EOLIndicatorProps) {
    return (
        <StatusBarItemButton onClick={onClick} tooltip="Select End of Line Sequence">
            {eol}
        </StatusBarItemButton>
    )
}

// ============================================================================
// INDENTATION
// ============================================================================

interface IndentationIndicatorProps {
    type: 'spaces' | 'tabs'
    size: number
    onClick?: () => void
}

function IndentationIndicator({ type, size, onClick }: IndentationIndicatorProps) {
    return (
        <StatusBarItemButton onClick={onClick} tooltip="Select Indentation">
            {type === 'spaces' ? 'Spaces' : 'Tab Size'}: {size}
        </StatusBarItemButton>
    )
}

// ============================================================================
// NOTIFICATION BELL
// ============================================================================

interface NotificationBellProps {
    count: number
    onClick?: () => void
}

function NotificationBell({ count, onClick }: NotificationBellProps) {
    return (
        <StatusBarItemButton onClick={onClick} tooltip="Notifications">
            <div className="relative">
                <Bell className="w-3.5 h-3.5" />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 text-white text-[8px] rounded-full flex items-center justify-center">
                        {count > 9 ? '9+' : count}
                    </span>
                )}
            </div>
        </StatusBarItemButton>
    )
}

// ============================================================================
// RUNNING TASK
// ============================================================================

interface RunningTaskProps {
    task: string
    onClick?: () => void
    onStop?: () => void
}

function RunningTask({ task, onClick, onStop }: RunningTaskProps) {
    return (
        <div className="flex items-center">
            <StatusBarItemButton onClick={onClick} tooltip={task}>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                <span className="max-w-32 truncate">{task}</span>
            </StatusBarItemButton>
            {onStop && (
                <button
                    onClick={onStop}
                    className="p-0.5 hover:bg-white/10 rounded transition-colors"
                    title="Stop task"
                >
                    <Square className="w-3 h-3 text-red-400" />
                </button>
            )}
        </div>
    )
}

// ============================================================================
// AI STATUS
// ============================================================================

interface AIStatusProps {
    isActive: boolean
    onClick?: () => void
}

function AIStatus({ isActive, onClick }: AIStatusProps) {
    return (
        <StatusBarItemButton onClick={onClick} tooltip={isActive ? 'AI Active' : 'AI Inactive'}>
            <Zap className={`w-3.5 h-3.5 ${isActive ? 'text-purple-400' : 'text-gray-500'}`} />
            {isActive && <span className="text-purple-400">AI</span>}
        </StatusBarItemButton>
    )
}

// ============================================================================
// STATUS BAR
// ============================================================================

interface StatusBarProps {
    gitStatus?: GitStatus
    diagnostics?: DiagnosticCounts
    language?: string
    cursorPosition?: { line: number; column: number; selected?: number }
    encoding?: string
    eol?: 'LF' | 'CRLF'
    indentation?: { type: 'spaces' | 'tabs'; size: number }
    isSynced?: boolean
    isSyncing?: boolean
    notificationCount?: number
    runningTask?: string
    isAIActive?: boolean
    onGitClick?: () => void
    onDiagnosticsClick?: () => void
    onLanguageClick?: () => void
    onCursorClick?: () => void
    onEncodingClick?: () => void
    onEOLClick?: () => void
    onIndentationClick?: () => void
    onSyncClick?: () => void
    onNotificationsClick?: () => void
    onTaskClick?: () => void
    onTaskStop?: () => void
    onAIClick?: () => void
    leftItems?: StatusBarItem[]
    rightItems?: StatusBarItem[]
    className?: string
}

export function StatusBar({
    gitStatus = { branch: 'main', isDirty: false },
    diagnostics = { errors: 0, warnings: 0 },
    language = 'TypeScript',
    cursorPosition = { line: 1, column: 1 },
    encoding = 'UTF-8',
    eol = 'LF',
    indentation = { type: 'spaces', size: 2 },
    isSynced = true,
    isSyncing = false,
    notificationCount = 0,
    runningTask,
    isAIActive = true,
    onGitClick,
    onDiagnosticsClick,
    onLanguageClick,
    onCursorClick,
    onEncodingClick,
    onEOLClick,
    onIndentationClick,
    onSyncClick,
    onNotificationsClick,
    onTaskClick,
    onTaskStop,
    onAIClick,
    leftItems = [],
    rightItems = [],
    className = '',
}: StatusBarProps) {
    return (
        <div className={`flex items-center justify-between h-6 bg-purple-900/50 text-gray-400 border-t border-white/5 ${className}`}>
            {/* Left section */}
            <div className="flex items-center h-full overflow-x-auto">
                {/* Git status */}
                <GitStatusIndicator status={gitStatus} onClick={onGitClick} />

                {/* Diagnostics */}
                <DiagnosticsIndicator counts={diagnostics} onClick={onDiagnosticsClick} />

                {/* Running task */}
                {runningTask && (
                    <RunningTask task={runningTask} onClick={onTaskClick} onStop={onTaskStop} />
                )}

                {/* Custom left items */}
                {leftItems.map(item => (
                    <StatusBarItemButton key={item.id} onClick={item.onClick} tooltip={item.tooltip}>
                        {item.content}
                    </StatusBarItemButton>
                ))}
            </div>

            {/* Right section */}
            <div className="flex items-center h-full overflow-x-auto">
                {/* Custom right items */}
                {rightItems.map(item => (
                    <StatusBarItemButton key={item.id} onClick={item.onClick} tooltip={item.tooltip}>
                        {item.content}
                    </StatusBarItemButton>
                ))}

                {/* AI status */}
                <AIStatus isActive={isAIActive} onClick={onAIClick} />

                {/* Cursor position */}
                <CursorPosition {...cursorPosition} onClick={onCursorClick} />

                {/* Indentation */}
                <IndentationIndicator {...indentation} onClick={onIndentationClick} />

                {/* Encoding */}
                <EncodingIndicator encoding={encoding} onClick={onEncodingClick} />

                {/* EOL */}
                <EOLIndicator eol={eol} onClick={onEOLClick} />

                {/* Language */}
                <LanguageIndicator language={language} onClick={onLanguageClick} />

                {/* Sync status */}
                <SyncStatus isSynced={isSynced} isSyncing={isSyncing} onClick={onSyncClick} />

                {/* Notifications */}
                <NotificationBell count={notificationCount} onClick={onNotificationsClick} />
            </div>
        </div>
    )
}
