/**
 * SprintLoop Editor Layout System
 * 
 * Phase 2251-2300: Editor layout
 * - Split view support
 * - Editor groups
 * - Drag-drop editors
 * - Focus management
 */

import React, { useState, useCallback, useRef } from 'react'
import {
    MoreHorizontal,
    X,
    Columns2,
    Rows2,
    Maximize2,
    Minimize2,
    Plus,
    GripVertical
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type SplitDirection = 'horizontal' | 'vertical'

interface EditorGroup {
    id: string
    tabs: EditorPane[]
    activeTabId?: string
}

interface EditorPane {
    id: string
    title: string
    content?: React.ReactNode
}

interface EditorLayoutNode {
    id: string
    type: 'group' | 'split'
    direction?: SplitDirection
    ratio?: number
    children?: EditorLayoutNode[]
    group?: EditorGroup
}

// ============================================================================
// SPLIT HANDLE
// ============================================================================

interface SplitHandleProps {
    direction: SplitDirection
    onDrag: (delta: number) => void
}

function SplitHandle({ direction, onDrag }: SplitHandleProps) {
    const [isDragging, setIsDragging] = useState(false)

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)

        const startPos = direction === 'horizontal' ? e.clientX : e.clientY

        const handleMouseMove = (e: MouseEvent) => {
            const currentPos = direction === 'horizontal' ? e.clientX : e.clientY
            onDrag(currentPos - startPos)
        }

        const handleMouseUp = () => {
            setIsDragging(false)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [direction, onDrag])

    return (
        <div
            onMouseDown={handleMouseDown}
            className={`
                flex-shrink-0 transition-colors z-10
                ${direction === 'horizontal'
                    ? 'w-1 cursor-col-resize'
                    : 'h-1 cursor-row-resize'
                }
                ${isDragging ? 'bg-purple-500' : 'bg-transparent hover:bg-purple-500/50'}
            `}
        >
            <div className={`
                flex items-center justify-center
                ${direction === 'horizontal' ? 'h-full' : 'w-full'}
            `}>
                <GripVertical className={`
                    w-3 h-3 text-transparent hover:text-gray-500
                    ${direction === 'horizontal' ? '' : 'rotate-90'}
                `} />
            </div>
        </div>
    )
}

// ============================================================================
// EDITOR PANE HEADER
// ============================================================================

interface EditorPaneHeaderProps {
    title: string
    isActive: boolean
    onClose?: () => void
    onSplitHorizontal?: () => void
    onSplitVertical?: () => void
    onMaximize?: () => void
}

function EditorPaneHeader({
    title,
    isActive,
    onClose,
    onSplitHorizontal,
    onSplitVertical,
    onMaximize,
}: EditorPaneHeaderProps) {
    const [showMenu, setShowMenu] = useState(false)

    return (
        <div className={`
            flex items-center justify-between h-8 px-2 border-b transition-colors
            ${isActive ? 'border-purple-500 bg-slate-800/50' : 'border-white/5 bg-slate-900'}
        `}>
            <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-gray-400'}`}>
                {title}
            </span>

            <div className="flex items-center gap-0.5">
                <button
                    onClick={onSplitHorizontal}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                    title="Split Right"
                >
                    <Columns2 className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={onSplitVertical}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                    title="Split Down"
                >
                    <Rows2 className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={onMaximize}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                    title="Maximize"
                >
                    <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={onClose}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                    title="Close"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}

// ============================================================================
// SINGLE EDITOR PANE
// ============================================================================

interface SingleEditorPaneProps {
    group: EditorGroup
    isActive: boolean
    onFocus: () => void
    onClose?: () => void
    onSplit?: (direction: SplitDirection) => void
    children?: React.ReactNode
}

function SingleEditorPane({
    group,
    isActive,
    onFocus,
    onClose,
    onSplit,
    children,
}: SingleEditorPaneProps) {
    const activeTab = group.tabs.find(t => t.id === group.activeTabId) || group.tabs[0]

    return (
        <div
            onClick={onFocus}
            className={`
                flex flex-col flex-1 min-w-0 min-h-0 bg-slate-900 transition-shadow
                ${isActive ? 'ring-1 ring-purple-500/50' : ''}
            `}
        >
            <EditorPaneHeader
                title={activeTab?.title || 'Untitled'}
                isActive={isActive}
                onClose={onClose}
                onSplitHorizontal={() => onSplit?.('horizontal')}
                onSplitVertical={() => onSplit?.('vertical')}
            />

            <div className="flex-1 overflow-auto bg-slate-900">
                {children || activeTab?.content || (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p className="text-sm">No content</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// SPLIT EDITOR LAYOUT
// ============================================================================

interface SplitEditorLayoutProps {
    direction: SplitDirection
    ratio?: number
    onRatioChange?: (ratio: number) => void
    children: [React.ReactNode, React.ReactNode]
}

export function SplitEditorLayout({
    direction,
    ratio = 50,
    onRatioChange,
    children,
}: SplitEditorLayoutProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [, setDragOffset] = useState(0)

    const handleDrag = useCallback((delta: number) => {
        if (!containerRef.current) return

        const containerSize = direction === 'horizontal'
            ? containerRef.current.offsetWidth
            : containerRef.current.offsetHeight

        const deltaPct = (delta / containerSize) * 100
        const newRatio = Math.max(20, Math.min(80, ratio + deltaPct))
        onRatioChange?.(newRatio)
    }, [direction, ratio, onRatioChange])

    return (
        <div
            ref={containerRef}
            className={`
                flex flex-1 min-w-0 min-h-0
                ${direction === 'horizontal' ? 'flex-row' : 'flex-col'}
            `}
        >
            <div
                className="flex-shrink-0 min-w-0 min-h-0"
                style={{
                    [direction === 'horizontal' ? 'width' : 'height']: `${ratio}%`,
                }}
            >
                {children[0]}
            </div>

            <SplitHandle direction={direction} onDrag={handleDrag} />

            <div
                className="flex-1 min-w-0 min-h-0"
                style={{
                    [direction === 'horizontal' ? 'width' : 'height']: `${100 - ratio}%`,
                }}
            >
                {children[1]}
            </div>
        </div>
    )
}

// ============================================================================
// EDITOR LAYOUT
// ============================================================================

interface EditorLayoutProps {
    groups?: EditorGroup[]
    activeGroupId?: string
    onFocusGroup?: (groupId: string) => void
    onCloseGroup?: (groupId: string) => void
    onSplitGroup?: (groupId: string, direction: SplitDirection) => void
    className?: string
}

export function EditorLayout({
    groups: propGroups,
    activeGroupId: propActiveGroupId,
    onFocusGroup,
    onCloseGroup,
    onSplitGroup,
    className = '',
}: EditorLayoutProps) {
    // Demo groups
    const defaultGroups: EditorGroup[] = [
        {
            id: 'g1',
            tabs: [
                { id: 'p1', title: 'App.tsx' },
                { id: 'p2', title: 'index.tsx' },
            ],
            activeTabId: 'p1',
        },
    ]

    const [groups, setGroups] = useState(propGroups || defaultGroups)
    const [activeGroupId, setActiveGroupId] = useState(propActiveGroupId || 'g1')
    const [splitRatio, setSplitRatio] = useState(50)

    const handleFocusGroup = useCallback((groupId: string) => {
        setActiveGroupId(groupId)
        onFocusGroup?.(groupId)
    }, [onFocusGroup])

    const handleCloseGroup = useCallback((groupId: string) => {
        setGroups(prev => prev.filter(g => g.id !== groupId))
        onCloseGroup?.(groupId)
    }, [onCloseGroup])

    const handleSplitGroup = useCallback((groupId: string, direction: SplitDirection) => {
        const newGroup: EditorGroup = {
            id: `g${Date.now()}`,
            tabs: [{ id: `p${Date.now()}`, title: 'Untitled' }],
        }
        newGroup.activeTabId = newGroup.tabs[0].id
        setGroups(prev => [...prev, newGroup])
        onSplitGroup?.(groupId, direction)
    }, [onSplitGroup])

    // Simple single/split render
    if (groups.length === 0) {
        return (
            <div className={`flex items-center justify-center h-full bg-slate-900 ${className}`}>
                <div className="text-center text-gray-500">
                    <Plus className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p className="text-sm">No editors open</p>
                    <p className="text-xs mt-1">Open a file from the explorer</p>
                </div>
            </div>
        )
    }

    if (groups.length === 1) {
        return (
            <div className={`flex flex-1 min-w-0 min-h-0 ${className}`}>
                <SingleEditorPane
                    group={groups[0]}
                    isActive={true}
                    onFocus={() => handleFocusGroup(groups[0].id)}
                    onClose={() => handleCloseGroup(groups[0].id)}
                    onSplit={(dir) => handleSplitGroup(groups[0].id, dir)}
                />
            </div>
        )
    }

    // Split view for 2 groups
    return (
        <SplitEditorLayout
            direction="horizontal"
            ratio={splitRatio}
            onRatioChange={setSplitRatio}
        >
            <SingleEditorPane
                group={groups[0]}
                isActive={activeGroupId === groups[0].id}
                onFocus={() => handleFocusGroup(groups[0].id)}
                onClose={() => handleCloseGroup(groups[0].id)}
                onSplit={(dir) => handleSplitGroup(groups[0].id, dir)}
            />
            <SingleEditorPane
                group={groups[1]}
                isActive={activeGroupId === groups[1].id}
                onFocus={() => handleFocusGroup(groups[1].id)}
                onClose={() => handleCloseGroup(groups[1].id)}
                onSplit={(dir) => handleSplitGroup(groups[1].id, dir)}
            />
        </SplitEditorLayout>
    )
}
