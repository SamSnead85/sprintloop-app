/**
 * SprintLoop Tab Bar System
 * 
 * Phase 2201-2250: Tab bar
 * - Tab display
 * - Close button
 * - Drag/drop reorder
 * - Modified indicator
 * - Tab context menu
 */

import React, { useState, useRef, useCallback } from 'react'
import {
    X,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    File,
    FileText,
    FileCode,
    FileJson,
    Image,
    Braces,
    Pin,
    Plus,
    MoreVertical,
    SplitSquareHorizontal,
    Copy,
    Trash2,
    FolderOpen
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface EditorTab {
    id: string
    filename: string
    path: string
    language?: string
    isDirty?: boolean
    isPinned?: boolean
    isPreview?: boolean
}

// ============================================================================
// FILE ICON
// ============================================================================

function FileIcon({ filename, language }: { filename: string; language?: string }) {
    const ext = filename.split('.').pop()?.toLowerCase()

    const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
        tsx: { icon: <FileCode className="w-4 h-4" />, color: 'text-blue-400' },
        ts: { icon: <FileCode className="w-4 h-4" />, color: 'text-blue-500' },
        jsx: { icon: <FileCode className="w-4 h-4" />, color: 'text-yellow-400' },
        js: { icon: <FileCode className="w-4 h-4" />, color: 'text-yellow-500' },
        json: { icon: <FileJson className="w-4 h-4" />, color: 'text-yellow-300' },
        css: { icon: <Braces className="w-4 h-4" />, color: 'text-blue-300' },
        scss: { icon: <Braces className="w-4 h-4" />, color: 'text-pink-400' },
        html: { icon: <FileCode className="w-4 h-4" />, color: 'text-orange-400' },
        md: { icon: <FileText className="w-4 h-4" />, color: 'text-gray-400' },
        png: { icon: <Image className="w-4 h-4" />, color: 'text-purple-400' },
        jpg: { icon: <Image className="w-4 h-4" />, color: 'text-purple-400' },
        svg: { icon: <Image className="w-4 h-4" />, color: 'text-orange-300' },
    }

    const config = iconMap[ext || ''] || { icon: <File className="w-4 h-4" />, color: 'text-gray-400' }

    return <span className={config.color}>{config.icon}</span>
}

// ============================================================================
// TAB
// ============================================================================

interface TabProps {
    tab: EditorTab
    isActive: boolean
    onSelect: () => void
    onClose: () => void
    onPin?: () => void
    onUnpin?: () => void
    onDragStart?: (e: React.DragEvent) => void
    onDragOver?: (e: React.DragEvent) => void
    onDrop?: (e: React.DragEvent) => void
}

function Tab({
    tab,
    isActive,
    onSelect,
    onClose,
    onPin,
    onUnpin,
    onDragStart,
    onDragOver,
    onDrop,
}: TabProps) {
    const [showMenu, setShowMenu] = useState(false)

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onClick={onSelect}
            onContextMenu={(e) => {
                e.preventDefault()
                setShowMenu(true)
            }}
            className={`
                group relative flex items-center gap-2 h-9 px-3 border-r border-white/5 cursor-pointer transition-colors
                ${isActive
                    ? 'bg-slate-900 text-white border-b-2 border-b-purple-500'
                    : 'bg-slate-950 text-gray-400 hover:text-white hover:bg-slate-900/50'
                }
                ${tab.isPreview ? 'italic' : ''}
            `}
        >
            {/* Pin indicator */}
            {tab.isPinned && (
                <Pin className="w-3 h-3 text-purple-400" />
            )}

            {/* File icon */}
            <FileIcon filename={tab.filename} language={tab.language} />

            {/* Filename */}
            <span className={`text-sm truncate max-w-32 ${tab.isPreview ? 'italic' : ''}`}>
                {tab.filename}
            </span>

            {/* Modified indicator */}
            {tab.isDirty && (
                <span className="w-2 h-2 bg-white rounded-full" />
            )}

            {/* Close button */}
            <button
                onClick={(e) => {
                    e.stopPropagation()
                    onClose()
                }}
                className={`
                    p-0.5 rounded transition-colors
                    ${isActive || tab.isDirty
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    }
                    hover:bg-white/10
                `}
            >
                {tab.isDirty ? (
                    <span className="w-3 h-3 flex items-center justify-center text-xs">●</span>
                ) : (
                    <X className="w-3 h-3" />
                )}
            </button>

            {/* Context menu */}
            {showMenu && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute left-0 top-full mt-1 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20 py-1">
                        <button
                            onClick={() => {
                                onClose()
                                setShowMenu(false)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                        >
                            <X className="w-4 h-4" />
                            Close
                        </button>
                        <button
                            onClick={() => {
                                tab.isPinned ? onUnpin?.() : onPin?.()
                                setShowMenu(false)
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                        >
                            <Pin className="w-4 h-4" />
                            {tab.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                            onClick={() => setShowMenu(false)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                        >
                            <SplitSquareHorizontal className="w-4 h-4" />
                            Split Right
                        </button>
                        <div className="h-px bg-white/5 my-1" />
                        <button
                            onClick={() => setShowMenu(false)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Path
                        </button>
                        <button
                            onClick={() => setShowMenu(false)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                        >
                            <FolderOpen className="w-4 h-4" />
                            Reveal in Explorer
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

// ============================================================================
// TAB BAR
// ============================================================================

interface TabBarProps {
    tabs?: EditorTab[]
    activeTabId?: string
    onSelectTab?: (tab: EditorTab) => void
    onCloseTab?: (tab: EditorTab) => void
    onPinTab?: (tab: EditorTab) => void
    onUnpinTab?: (tab: EditorTab) => void
    onReorderTabs?: (tabs: EditorTab[]) => void
    onNewTab?: () => void
    className?: string
}

export function TabBar({
    tabs: propTabs,
    activeTabId: propActiveId,
    onSelectTab,
    onCloseTab,
    onPinTab,
    onUnpinTab,
    onReorderTabs,
    onNewTab,
    className = '',
}: TabBarProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [draggedTabId, setDraggedTabId] = useState<string | null>(null)

    // Demo tabs
    const defaultTabs: EditorTab[] = [
        { id: 't1', filename: 'App.tsx', path: '/src/App.tsx', language: 'typescriptreact', isPinned: true },
        { id: 't2', filename: 'index.tsx', path: '/src/index.tsx', language: 'typescriptreact' },
        { id: 't3', filename: 'styles.css', path: '/src/styles.css', language: 'css', isDirty: true },
        { id: 't4', filename: 'package.json', path: '/package.json', language: 'json' },
        { id: 't5', filename: 'README.md', path: '/README.md', language: 'markdown', isPreview: true },
    ]

    const [tabs, setTabs] = useState(propTabs || defaultTabs)
    const [activeTabId, setActiveTabId] = useState(propActiveId || 't1')

    // Sort tabs: pinned first
    const sortedTabs = [...tabs].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return 0
    })

    // Scroll handlers
    const scrollLeft = () => {
        scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })
    }

    const scrollRight = () => {
        scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })
    }

    // Drag handlers
    const handleDragStart = useCallback((tabId: string) => (e: React.DragEvent) => {
        setDraggedTabId(tabId)
        e.dataTransfer.effectAllowed = 'move'
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }, [])

    const handleDrop = useCallback((targetTabId: string) => (e: React.DragEvent) => {
        e.preventDefault()
        if (!draggedTabId || draggedTabId === targetTabId) return

        const newTabs = [...tabs]
        const draggedIndex = newTabs.findIndex(t => t.id === draggedTabId)
        const targetIndex = newTabs.findIndex(t => t.id === targetTabId)

        if (draggedIndex !== -1 && targetIndex !== -1) {
            const [draggedTab] = newTabs.splice(draggedIndex, 1)
            newTabs.splice(targetIndex, 0, draggedTab)
            setTabs(newTabs)
            onReorderTabs?.(newTabs)
        }

        setDraggedTabId(null)
    }, [draggedTabId, tabs, onReorderTabs])

    const handleSelectTab = useCallback((tab: EditorTab) => {
        setActiveTabId(tab.id)
        // Convert preview to permanent on double click or explicit navigation
        if (tab.isPreview) {
            setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, isPreview: false } : t))
        }
        onSelectTab?.(tab)
    }, [onSelectTab])

    const handleCloseTab = useCallback((tab: EditorTab) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== tab.id)
            // If closing active tab, select adjacent
            if (activeTabId === tab.id && newTabs.length > 0) {
                const closedIndex = prev.findIndex(t => t.id === tab.id)
                const newActiveIndex = Math.min(closedIndex, newTabs.length - 1)
                setActiveTabId(newTabs[newActiveIndex].id)
            }
            return newTabs
        })
        onCloseTab?.(tab)
    }, [activeTabId, onCloseTab])

    return (
        <div className={`flex items-center h-9 bg-slate-950 border-b border-white/5 ${className}`}>
            {/* Scroll left */}
            <button
                onClick={scrollLeft}
                className="p-1.5 text-gray-500 hover:text-white transition-colors"
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Tabs */}
            <div
                ref={scrollRef}
                className="flex-1 flex overflow-x-auto scrollbar-hide"
            >
                {sortedTabs.map(tab => (
                    <Tab
                        key={tab.id}
                        tab={tab}
                        isActive={activeTabId === tab.id}
                        onSelect={() => handleSelectTab(tab)}
                        onClose={() => handleCloseTab(tab)}
                        onPin={() => {
                            setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, isPinned: true } : t))
                            onPinTab?.(tab)
                        }}
                        onUnpin={() => {
                            setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, isPinned: false } : t))
                            onUnpinTab?.(tab)
                        }}
                        onDragStart={handleDragStart(tab.id)}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop(tab.id)}
                    />
                ))}
            </div>

            {/* Scroll right */}
            <button
                onClick={scrollRight}
                className="p-1.5 text-gray-500 hover:text-white transition-colors"
            >
                <ChevronRight className="w-4 h-4" />
            </button>

            {/* New tab */}
            <button
                onClick={onNewTab}
                className="p-1.5 text-gray-500 hover:text-white transition-colors"
                title="New Tab"
            >
                <Plus className="w-4 h-4" />
            </button>

            {/* Tab menu */}
            <button
                className="p-1.5 text-gray-500 hover:text-white transition-colors"
                title="More Actions"
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>
        </div>
    )
}
