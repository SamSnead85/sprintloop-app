/**
 * SprintLoop Activity Bar System
 * 
 * Phase 2151-2200: Activity bar
 * - Icon buttons
 * - Active indicator
 * - Badge counts
 * - Tooltip
 * - Account/settings
 */

import React, { useState } from 'react'
import {
    Files,
    Search,
    GitBranch,
    Bug,
    Puzzle,
    Settings,
    User,
    Bell,
    MessageSquare,
    Sparkles,
    Terminal,
    Database,
    MoreVertical,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface ActivityBarItem {
    id: string
    icon: React.ReactNode
    label: string
    badge?: number
    badgeType?: 'default' | 'error' | 'warning'
}

// ============================================================================
// ACTIVITY BAR BUTTON
// ============================================================================

interface ActivityBarButtonProps {
    item: ActivityBarItem
    isActive: boolean
    onClick: () => void
    position?: 'top' | 'bottom'
}

function ActivityBarButton({ item, isActive, onClick, position = 'top' }: ActivityBarButtonProps) {
    const [showTooltip, setShowTooltip] = useState(false)

    const getBadgeColor = () => {
        switch (item.badgeType) {
            case 'error':
                return 'bg-red-500'
            case 'warning':
                return 'bg-yellow-500'
            default:
                return 'bg-purple-500'
        }
    }

    return (
        <div className="relative">
            <button
                onClick={onClick}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className={`
                    relative w-12 h-12 flex items-center justify-center transition-colors
                    ${isActive
                        ? 'text-white before:absolute before:left-0 before:top-0 before:bottom-0 before:w-0.5 before:bg-white'
                        : 'text-gray-500 hover:text-white'
                    }
                `}
            >
                {item.icon}

                {/* Badge */}
                {item.badge !== undefined && item.badge > 0 && (
                    <span className={`
                        absolute top-1.5 right-1.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-medium text-white flex items-center justify-center
                        ${getBadgeColor()}
                    `}>
                        {item.badge > 99 ? '99+' : item.badge}
                    </span>
                )}
            </button>

            {/* Tooltip */}
            {showTooltip && (
                <div className={`
                    absolute left-full ml-2 px-2 py-1 bg-slate-800 border border-white/10 rounded text-xs text-white whitespace-nowrap z-50
                    ${position === 'bottom' ? 'bottom-0' : 'top-1/2 -translate-y-1/2'}
                `}>
                    {item.label}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// ACTIVITY BAR
// ============================================================================

interface ActivityBarProps {
    activeItemId?: string
    onItemClick?: (itemId: string) => void
    topItems?: ActivityBarItem[]
    bottomItems?: ActivityBarItem[]
    isCollapsed?: boolean
    onToggleCollapse?: () => void
    className?: string
}

export function ActivityBar({
    activeItemId: propActiveId,
    onItemClick,
    topItems: propTopItems,
    bottomItems: propBottomItems,
    isCollapsed = false,
    onToggleCollapse,
    className = '',
}: ActivityBarProps) {
    const [activeItemId, setActiveItemId] = useState(propActiveId || 'explorer')

    // Default items
    const defaultTopItems: ActivityBarItem[] = [
        { id: 'explorer', icon: <Files className="w-5 h-5" />, label: 'Explorer' },
        { id: 'search', icon: <Search className="w-5 h-5" />, label: 'Search' },
        { id: 'git', icon: <GitBranch className="w-5 h-5" />, label: 'Source Control', badge: 3 },
        { id: 'debug', icon: <Bug className="w-5 h-5" />, label: 'Run and Debug' },
        { id: 'extensions', icon: <Puzzle className="w-5 h-5" />, label: 'Extensions', badge: 2, badgeType: 'warning' },
        { id: 'ai', icon: <Sparkles className="w-5 h-5" />, label: 'AI Assistant' },
        { id: 'terminal', icon: <Terminal className="w-5 h-5" />, label: 'Terminal' },
        { id: 'database', icon: <Database className="w-5 h-5" />, label: 'Database' },
    ]

    const defaultBottomItems: ActivityBarItem[] = [
        { id: 'notifications', icon: <Bell className="w-5 h-5" />, label: 'Notifications', badge: 5 },
        { id: 'account', icon: <User className="w-5 h-5" />, label: 'Account' },
        { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
    ]

    const topItems = propTopItems || defaultTopItems
    const bottomItems = propBottomItems || defaultBottomItems

    const handleItemClick = (itemId: string) => {
        setActiveItemId(itemId)
        onItemClick?.(itemId)
    }

    return (
        <div className={`flex flex-col w-12 bg-slate-950 border-r border-white/5 ${className}`}>
            {/* Top items */}
            <div className="flex-1 flex flex-col">
                {topItems.map(item => (
                    <ActivityBarButton
                        key={item.id}
                        item={item}
                        isActive={activeItemId === item.id}
                        onClick={() => handleItemClick(item.id)}
                    />
                ))}
            </div>

            {/* Bottom items */}
            <div className="flex flex-col border-t border-white/5">
                {bottomItems.map(item => (
                    <ActivityBarButton
                        key={item.id}
                        item={item}
                        isActive={activeItemId === item.id}
                        onClick={() => handleItemClick(item.id)}
                        position="bottom"
                    />
                ))}
            </div>
        </div>
    )
}

// ============================================================================
// PRIMARY SIDEBAR
// ============================================================================

interface PrimarySidebarProps {
    activeView: string
    isOpen: boolean
    width?: number
    onResize?: (width: number) => void
    onClose?: () => void
    children?: React.ReactNode
    className?: string
}

export function PrimarySidebar({
    activeView,
    isOpen,
    width = 260,
    onResize,
    onClose,
    children,
    className = '',
}: PrimarySidebarProps) {
    const [isResizing, setIsResizing] = useState(false)

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)

        const startX = e.clientX
        const startWidth = width

        const handleMouseMove = (e: MouseEvent) => {
            const delta = e.clientX - startX
            const newWidth = Math.max(200, Math.min(600, startWidth + delta))
            onResize?.(newWidth)
        }

        const handleMouseUp = () => {
            setIsResizing(false)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    if (!isOpen) return null

    return (
        <div
            className={`relative flex flex-col bg-slate-900 border-r border-white/5 ${className}`}
            style={{ width: `${width}px` }}
        >
            {children}

            {/* Resize handle */}
            <div
                onMouseDown={handleMouseDown}
                className={`
                    absolute right-0 top-0 bottom-0 w-1 cursor-col-resize transition-colors
                    ${isResizing ? 'bg-purple-500' : 'hover:bg-purple-500/50'}
                `}
            />
        </div>
    )
}

// ============================================================================
// SIDEBAR HEADER
// ============================================================================

interface SidebarHeaderProps {
    title: string
    actions?: React.ReactNode
    onCollapse?: () => void
}

export function SidebarHeader({ title, actions, onCollapse }: SidebarHeaderProps) {
    return (
        <div className="flex items-center justify-between h-8 px-4 border-b border-white/5">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                {title}
            </span>
            <div className="flex items-center gap-1">
                {actions}
                {onCollapse && (
                    <button
                        onClick={onCollapse}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="Collapse"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )
}
