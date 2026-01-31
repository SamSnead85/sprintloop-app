/**
 * SprintLoop Panel System
 * 
 * Phase 2301-2350: Panel system
 * - Resizable panels
 * - Collapsible sections
 * - Panel tabs
 * - Drag to dock
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
    X,
    Maximize2,
    Minimize2,
    ChevronDown,
    ChevronRight,
    GripHorizontal,
    MoreHorizontal,
    Pin,
    ExternalLink
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type PanelPosition = 'bottom' | 'left' | 'right'

interface PanelTab {
    id: string
    label: string
    icon?: React.ReactNode
    badge?: number
    content?: React.ReactNode
}

interface CollapsibleSection {
    id: string
    title: string
    content: React.ReactNode
    defaultOpen?: boolean
}

// ============================================================================
// RESIZE HANDLE
// ============================================================================

interface ResizeHandleProps {
    direction: 'horizontal' | 'vertical'
    onResize: (delta: number) => void
    minSize?: number
    maxSize?: number
}

function ResizeHandle({ direction, onResize, minSize = 100, maxSize = 600 }: ResizeHandleProps) {
    const [isDragging, setIsDragging] = useState(false)

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)

        const startPos = direction === 'horizontal' ? e.clientX : e.clientY

        const handleMouseMove = (e: MouseEvent) => {
            const currentPos = direction === 'horizontal' ? e.clientX : e.clientY
            onResize(startPos - currentPos)
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [direction, onResize])

    return (
        <div
            onMouseDown={handleMouseDown}
            className={`
                flex items-center justify-center transition-colors
                ${direction === 'horizontal'
                    ? 'h-1 cursor-row-resize hover:bg-purple-500/50'
                    : 'w-1 cursor-col-resize hover:bg-purple-500/50'
                }
                ${isDragging ? 'bg-purple-500' : 'bg-transparent'}
            `}
        >
            {direction === 'horizontal' && isDragging && (
                <GripHorizontal className="w-4 h-4 text-purple-400" />
            )}
        </div>
    )
}

// ============================================================================
// COLLAPSIBLE SECTION
// ============================================================================

interface CollapsibleSectionComponentProps {
    title: string
    defaultOpen?: boolean
    children: React.ReactNode
    actions?: React.ReactNode
}

export function CollapsibleSection({
    title,
    defaultOpen = true,
    children,
    actions,
}: CollapsibleSectionComponentProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    return (
        <div className="border-b border-white/5 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
            >
                {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-xs font-medium text-gray-400 uppercase">{title}</span>
                {actions && (
                    <div className="ml-auto flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {actions}
                    </div>
                )}
            </button>

            {isOpen && (
                <div className="pb-2">
                    {children}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// PANEL HEADER
// ============================================================================

interface PanelHeaderProps {
    title: string
    onClose?: () => void
    onMaximize?: () => void
    onMinimize?: () => void
    onPin?: () => void
    onPopOut?: () => void
    isMaximized?: boolean
    isPinned?: boolean
    actions?: React.ReactNode
}

function PanelHeader({
    title,
    onClose,
    onMaximize,
    onMinimize,
    onPin,
    onPopOut,
    isMaximized,
    isPinned,
    actions,
}: PanelHeaderProps) {
    return (
        <div className="flex items-center h-8 px-2 bg-slate-800/50 border-b border-white/5">
            <span className="text-xs font-medium text-gray-400 uppercase">{title}</span>

            <div className="ml-auto flex items-center gap-0.5">
                {actions}
                {onPin && (
                    <button
                        onClick={onPin}
                        className={`p-1 transition-colors ${isPinned ? 'text-purple-400' : 'text-gray-500 hover:text-white'}`}
                        title={isPinned ? 'Unpin' : 'Pin'}
                    >
                        <Pin className="w-3.5 h-3.5" />
                    </button>
                )}
                {onPopOut && (
                    <button
                        onClick={onPopOut}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="Pop Out"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                )}
                {(onMaximize || onMinimize) && (
                    <button
                        onClick={isMaximized ? onMinimize : onMaximize}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title={isMaximized ? 'Restore' : 'Maximize'}
                    >
                        {isMaximized ? (
                            <Minimize2 className="w-3.5 h-3.5" />
                        ) : (
                            <Maximize2 className="w-3.5 h-3.5" />
                        )}
                    </button>
                )}
                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="Close"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// PANEL TABS
// ============================================================================

interface PanelTabsProps {
    tabs: PanelTab[]
    activeTabId: string
    onSelectTab: (tabId: string) => void
    onCloseTab?: (tabId: string) => void
}

function PanelTabs({ tabs, activeTabId, onSelectTab, onCloseTab }: PanelTabsProps) {
    return (
        <div className="flex items-center h-8 bg-slate-800/50 border-b border-white/5 overflow-x-auto">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onSelectTab(tab.id)}
                    className={`
                        group flex items-center gap-1.5 h-full px-3 text-xs transition-colors border-b-2
                        ${activeTabId === tab.id
                            ? 'text-white border-purple-500 bg-slate-900'
                            : 'text-gray-400 border-transparent hover:text-white hover:bg-slate-900/50'
                        }
                    `}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                            {tab.badge}
                        </span>
                    )}
                    {onCloseTab && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onCloseTab(tab.id)
                            }}
                            className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </button>
            ))}
        </div>
    )
}

// ============================================================================
// BOTTOM PANEL
// ============================================================================

interface BottomPanelProps {
    tabs?: PanelTab[]
    activeTabId?: string
    defaultHeight?: number
    minHeight?: number
    maxHeight?: number
    isOpen?: boolean
    onToggle?: () => void
    onClose?: () => void
    className?: string
}

export function BottomPanel({
    tabs: propTabs,
    activeTabId: propActiveTabId,
    defaultHeight = 200,
    minHeight = 100,
    maxHeight = 500,
    isOpen = true,
    onToggle,
    onClose,
    className = '',
}: BottomPanelProps) {
    const [height, setHeight] = useState(defaultHeight)
    const [isMaximized, setIsMaximized] = useState(false)

    // Demo tabs
    const defaultTabs: PanelTab[] = [
        { id: 'problems', label: 'Problems', badge: 3 },
        { id: 'output', label: 'Output' },
        { id: 'terminal', label: 'Terminal' },
        { id: 'debug', label: 'Debug Console' },
    ]

    const tabs = propTabs || defaultTabs
    const [activeTabId, setActiveTabId] = useState(propActiveTabId || tabs[0]?.id)

    const activeTab = tabs.find(t => t.id === activeTabId)

    const handleResize = useCallback((delta: number) => {
        setHeight(prev => Math.max(minHeight, Math.min(maxHeight, prev + delta)))
    }, [minHeight, maxHeight])

    if (!isOpen) return null

    const displayHeight = isMaximized ? '100vh' : `${height}px`

    return (
        <div
            className={`flex flex-col bg-slate-900 border-t border-white/5 ${className}`}
            style={{ height: displayHeight }}
        >
            {/* Resize handle */}
            <ResizeHandle direction="horizontal" onResize={handleResize} />

            {/* Tabs */}
            <div className="flex items-center">
                <PanelTabs
                    tabs={tabs}
                    activeTabId={activeTabId}
                    onSelectTab={setActiveTabId}
                />
                <div className="ml-auto flex items-center gap-0.5 px-2">
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                    >
                        {isMaximized ? (
                            <Minimize2 className="w-3.5 h-3.5" />
                        ) : (
                            <Maximize2 className="w-3.5 h-3.5" />
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {activeTab?.content || (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p className="text-sm">No content</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// SIDE PANEL
// ============================================================================

interface SidePanelProps {
    position: 'left' | 'right'
    title?: string
    defaultWidth?: number
    minWidth?: number
    maxWidth?: number
    isOpen?: boolean
    onClose?: () => void
    children?: React.ReactNode
    sections?: CollapsibleSection[]
    className?: string
}

export function SidePanel({
    position,
    title = 'Panel',
    defaultWidth = 300,
    minWidth = 200,
    maxWidth = 500,
    isOpen = true,
    onClose,
    children,
    sections,
    className = '',
}: SidePanelProps) {
    const [width, setWidth] = useState(defaultWidth)
    const [isMaximized, setIsMaximized] = useState(false)

    const handleResize = useCallback((delta: number) => {
        const adjustedDelta = position === 'right' ? delta : -delta
        setWidth(prev => Math.max(minWidth, Math.min(maxWidth, prev + adjustedDelta)))
    }, [position, minWidth, maxWidth])

    if (!isOpen) return null

    const borderClass = position === 'right' ? 'border-l' : 'border-r'

    return (
        <div
            className={`flex ${position === 'right' ? 'flex-row-reverse' : 'flex-row'} bg-slate-900 ${borderClass} border-white/5 ${className}`}
            style={{ width: isMaximized ? '100%' : `${width}px` }}
        >
            {/* Resize handle */}
            <ResizeHandle direction="vertical" onResize={handleResize} />

            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <PanelHeader
                    title={title}
                    onClose={onClose}
                    onMaximize={() => setIsMaximized(true)}
                    onMinimize={() => setIsMaximized(false)}
                    isMaximized={isMaximized}
                />

                {/* Content */}
                <div className="flex-1 overflow-auto">
                    {sections ? (
                        sections.map(section => (
                            <CollapsibleSection
                                key={section.id}
                                title={section.title}
                                defaultOpen={section.defaultOpen}
                            >
                                {section.content}
                            </CollapsibleSection>
                        ))
                    ) : (
                        children
                    )}
                </div>
            </div>
        </div>
    )
}
