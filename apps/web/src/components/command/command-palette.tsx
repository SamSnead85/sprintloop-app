/**
 * SprintLoop Command Palette System
 * 
 * Phase 1701-1750: Command palette
 * - Quick open files
 * - Run commands
 * - Go to line/symbol
 * - Recent files
 * - Keyboard navigation
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
    Search,
    File,
    Command,
    Hash,
    ArrowRight,
    Clock,
    Star,
    Settings,
    Terminal,
    GitBranch,
    Palette,
    Keyboard,
    Zap,
    ChevronRight,
    X
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type CommandType = 'file' | 'command' | 'symbol' | 'line' | 'recent' | 'setting'

interface CommandItem {
    id: string
    type: CommandType
    label: string
    description?: string
    detail?: string
    icon?: React.ReactNode
    shortcut?: string
    category?: string
    action?: () => void
}

interface CommandCategory {
    id: string
    label: string
    icon: React.ReactNode
    prefix?: string
}

// ============================================================================
// FUZZY MATCH
// ============================================================================

function fuzzyMatch(text: string, query: string): { match: boolean; score: number; ranges: [number, number][] } {
    if (!query) return { match: true, score: 0, ranges: [] }

    const lowerText = text.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const ranges: [number, number][] = []

    let queryIndex = 0
    let lastMatchEnd = -1
    let score = 0

    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
        if (lowerText[i] === lowerQuery[queryIndex]) {
            // Consecutive match bonus
            if (lastMatchEnd === i - 1) {
                score += 2
            } else {
                score += 1
            }

            // Start of word bonus
            if (i === 0 || /\W/.test(text[i - 1])) {
                score += 3
            }

            // Track range
            if (lastMatchEnd === i - 1 && ranges.length > 0) {
                ranges[ranges.length - 1][1] = i + 1
            } else {
                ranges.push([i, i + 1])
            }

            lastMatchEnd = i
            queryIndex++
        }
    }

    return {
        match: queryIndex === query.length,
        score,
        ranges,
    }
}

// ============================================================================
// HIGHLIGHT TEXT
// ============================================================================

interface HighlightTextProps {
    text: string
    ranges: [number, number][]
    className?: string
}

function HighlightText({ text, ranges, className = '' }: HighlightTextProps) {
    if (ranges.length === 0) {
        return <span className={className}>{text}</span>
    }

    const parts: React.ReactNode[] = []
    let lastEnd = 0

    ranges.forEach(([start, end], i) => {
        if (start > lastEnd) {
            parts.push(<span key={`text-${i}`}>{text.slice(lastEnd, start)}</span>)
        }
        parts.push(
            <span key={`match-${i}`} className="text-purple-400 font-medium">
                {text.slice(start, end)}
            </span>
        )
        lastEnd = end
    })

    if (lastEnd < text.length) {
        parts.push(<span key="text-end">{text.slice(lastEnd)}</span>)
    }

    return <span className={className}>{parts}</span>
}

// ============================================================================
// COMMAND ITEM DISPLAY
// ============================================================================

interface CommandItemDisplayProps {
    item: CommandItem
    isSelected: boolean
    matchRanges?: [number, number][]
    onSelect: () => void
    onHover: () => void
}

function CommandItemDisplay({
    item,
    isSelected,
    matchRanges = [],
    onSelect,
    onHover,
}: CommandItemDisplayProps) {
    const getTypeIcon = () => {
        if (item.icon) return item.icon

        switch (item.type) {
            case 'file':
                return <File className="w-4 h-4" />
            case 'command':
                return <Command className="w-4 h-4" />
            case 'symbol':
                return <Hash className="w-4 h-4" />
            case 'recent':
                return <Clock className="w-4 h-4" />
            case 'setting':
                return <Settings className="w-4 h-4" />
            default:
                return <ArrowRight className="w-4 h-4" />
        }
    }

    return (
        <button
            onClick={onSelect}
            onMouseEnter={onHover}
            className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                ${isSelected ? 'bg-purple-500/20' : 'hover:bg-white/5'}
            `}
        >
            <span className={isSelected ? 'text-purple-400' : 'text-gray-500'}>
                {getTypeIcon()}
            </span>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <HighlightText
                        text={item.label}
                        ranges={matchRanges}
                        className={`text-sm truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}
                    />
                    {item.category && (
                        <span className="text-xs text-gray-600">{item.category}</span>
                    )}
                </div>
                {item.description && (
                    <div className="text-xs text-gray-500 truncate">{item.description}</div>
                )}
            </div>

            {item.detail && (
                <span className="text-xs text-gray-600 flex-shrink-0">{item.detail}</span>
            )}

            {item.shortcut && (
                <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-gray-400">
                    {item.shortcut}
                </kbd>
            )}
        </button>
    )
}

// ============================================================================
// COMMAND PALETTE
// ============================================================================

interface CommandPaletteProps {
    isOpen: boolean
    onClose: () => void
    items?: CommandItem[]
    recentFiles?: string[]
    onSelectItem?: (item: CommandItem) => void
    onOpenFile?: (file: string) => void
    onRunCommand?: (command: string) => void
    onGoToLine?: (line: number) => void
    className?: string
}

export function CommandPalette({
    isOpen,
    onClose,
    items: propItems,
    recentFiles = [],
    onSelectItem,
    onOpenFile,
    onRunCommand,
    onGoToLine,
    className = '',
}: CommandPaletteProps) {
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [mode, setMode] = useState<'files' | 'commands' | 'symbols' | 'line'>('files')
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    // Default items
    const defaultCommands: CommandItem[] = [
        { id: 'cmd-theme', type: 'command', label: 'Preferences: Color Theme', icon: <Palette className="w-4 h-4" />, shortcut: '⌘K ⌘T' },
        { id: 'cmd-settings', type: 'command', label: 'Preferences: Open Settings', icon: <Settings className="w-4 h-4" />, shortcut: '⌘,' },
        { id: 'cmd-keyboard', type: 'command', label: 'Preferences: Keyboard Shortcuts', icon: <Keyboard className="w-4 h-4" />, shortcut: '⌘K ⌘S' },
        { id: 'cmd-terminal', type: 'command', label: 'Terminal: Create New Terminal', icon: <Terminal className="w-4 h-4" />, shortcut: '⌃`' },
        { id: 'cmd-git', type: 'command', label: 'Git: Checkout to...', icon: <GitBranch className="w-4 h-4" /> },
        { id: 'cmd-format', type: 'command', label: 'Format Document', icon: <Zap className="w-4 h-4" />, shortcut: '⇧⌥F' },
    ]

    const defaultFiles: CommandItem[] = [
        { id: 'file-1', type: 'file', label: 'App.tsx', description: 'src/App.tsx', category: 'src' },
        { id: 'file-2', type: 'file', label: 'index.tsx', description: 'src/index.tsx', category: 'src' },
        { id: 'file-3', type: 'file', label: 'package.json', description: 'package.json' },
        { id: 'file-4', type: 'file', label: 'tsconfig.json', description: 'tsconfig.json' },
        { id: 'file-5', type: 'file', label: 'helpers.ts', description: 'src/utils/helpers.ts', category: 'src/utils' },
    ]

    const items = propItems || [...defaultFiles, ...defaultCommands]

    // Detect mode from query prefix
    useEffect(() => {
        if (query.startsWith('>')) {
            setMode('commands')
        } else if (query.startsWith('@')) {
            setMode('symbols')
        } else if (query.startsWith(':')) {
            setMode('line')
        } else {
            setMode('files')
        }
    }, [query])

    // Filter and sort items
    const filteredItems = useMemo(() => {
        let searchQuery = query
        let typeFilter: CommandType | null = null

        // Remove prefix
        if (query.startsWith('>')) {
            searchQuery = query.slice(1).trim()
            typeFilter = 'command'
        } else if (query.startsWith('@')) {
            searchQuery = query.slice(1).trim()
            typeFilter = 'symbol'
        } else if (query.startsWith(':')) {
            // Go to line mode
            return []
        }

        // Filter by type
        let filtered = items
        if (typeFilter) {
            filtered = items.filter(i => i.type === typeFilter)
        }

        // Fuzzy match and sort
        const results = filtered
            .map(item => ({
                item,
                ...fuzzyMatch(item.label, searchQuery),
            }))
            .filter(r => r.match)
            .sort((a, b) => b.score - a.score)

        return results
    }, [items, query])

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0)
    }, [filteredItems.length])

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus()
            setQuery('')
            setSelectedIndex(0)
        }
    }, [isOpen])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(i => Math.min(i + 1, filteredItems.length - 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(i => Math.max(i - 1, 0))
                break
            case 'Enter':
                e.preventDefault()
                if (mode === 'line') {
                    const lineNum = parseInt(query.slice(1))
                    if (!isNaN(lineNum)) {
                        onGoToLine?.(lineNum)
                        onClose()
                    }
                } else if (filteredItems[selectedIndex]) {
                    const { item } = filteredItems[selectedIndex]
                    item.action?.()
                    onSelectItem?.(item)
                    if (item.type === 'file') {
                        onOpenFile?.(item.description || item.label)
                    } else if (item.type === 'command') {
                        onRunCommand?.(item.id)
                    }
                    onClose()
                }
                break
            case 'Escape':
                onClose()
                break
        }
    }, [filteredItems, selectedIndex, mode, query, onGoToLine, onSelectItem, onOpenFile, onRunCommand, onClose])

    // Scroll selected into view
    useEffect(() => {
        const list = listRef.current
        if (!list) return

        const selected = list.children[selectedIndex] as HTMLElement
        if (selected) {
            selected.scrollIntoView({ block: 'nearest' })
        }
    }, [selectedIndex])

    if (!isOpen) return null

    const getPlaceholder = () => {
        switch (mode) {
            case 'commands':
                return 'Type a command...'
            case 'symbols':
                return 'Go to symbol...'
            case 'line':
                return 'Go to line...'
            default:
                return 'Search files by name (prefix with > for commands)'
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Palette */}
            <div className={`relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden ${className}`}>
                {/* Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                    <Search className="w-5 h-5 text-gray-500" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={getPlaceholder()}
                        className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
                    />
                    {query && (
                        <button
                            onClick={() => setQuery('')}
                            className="p-1 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Results */}
                <div ref={listRef} className="max-h-96 overflow-y-auto">
                    {mode === 'line' ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                            <Hash className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Type a line number and press Enter</p>
                        </div>
                    ) : filteredItems.length > 0 ? (
                        filteredItems.map(({ item, ranges }, index) => (
                            <CommandItemDisplay
                                key={item.id}
                                item={item}
                                isSelected={index === selectedIndex}
                                matchRanges={ranges}
                                onSelect={() => {
                                    item.action?.()
                                    onSelectItem?.(item)
                                    onClose()
                                }}
                                onHover={() => setSelectedIndex(index)}
                            />
                        ))
                    ) : (
                        <div className="px-4 py-8 text-center text-gray-500">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">No results found</p>
                        </div>
                    )}
                </div>

                {/* Footer hints */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-white/5 text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 bg-white/5 rounded">↑↓</kbd> Navigate
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 bg-white/5 rounded">↵</kbd> Open
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 bg-white/5 rounded">esc</kbd> Close
                    </span>
                    <div className="flex-1" />
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 bg-white/5 rounded">&gt;</kbd> Commands
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 bg-white/5 rounded">@</kbd> Symbols
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 bg-white/5 rounded">:</kbd> Line
                    </span>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// HOOK
// ============================================================================

export function useCommandPalette() {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
                e.preventDefault()
                setIsOpen(true)
            }
            if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
                e.preventDefault()
                setIsOpen(true)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    return {
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen(p => !p),
    }
}
