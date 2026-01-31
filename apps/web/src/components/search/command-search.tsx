/**
 * SprintLoop Command Search System
 * 
 * Phase 3251-3300: Command Search
 * - Spotlight-style search
 * - Fuzzy matching
 * - Recent searches
 * - Search categories
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
    Search,
    Command,
    File,
    Settings,
    GitBranch,
    Terminal,
    Code,
    Users,
    Clock,
    ArrowRight,
    CornerDownLeft
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type CommandCategory = 'file' | 'command' | 'settings' | 'git' | 'terminal' | 'code' | 'recent'

interface CommandItem {
    id: string
    title: string
    subtitle?: string
    category: CommandCategory
    icon?: React.ReactNode
    shortcut?: string[]
    onSelect: () => void
    keywords?: string[]
}

interface CommandSearchProps {
    isOpen: boolean
    onClose: () => void
    commands: CommandItem[]
    placeholder?: string
    recentSearches?: string[]
    onRecentSearchAdd?: (query: string) => void
    className?: string
}

// ============================================================================
// FUZZY SEARCH
// ============================================================================

function fuzzyMatch(pattern: string, text: string): { matched: boolean; score: number; indices: number[] } {
    pattern = pattern.toLowerCase()
    text = text.toLowerCase()

    if (pattern.length === 0) return { matched: true, score: 1, indices: [] }

    let patternIdx = 0
    let textIdx = 0
    const indices: number[] = []
    let consecutiveMatches = 0
    let score = 0

    while (textIdx < text.length && patternIdx < pattern.length) {
        if (text[textIdx] === pattern[patternIdx]) {
            indices.push(textIdx)
            patternIdx++

            // Bonus for consecutive matches
            consecutiveMatches++
            score += consecutiveMatches

            // Bonus for matching at start of word
            if (textIdx === 0 || text[textIdx - 1] === ' ' || text[textIdx - 1] === '/') {
                score += 5
            }
        } else {
            consecutiveMatches = 0
        }
        textIdx++
    }

    const matched = patternIdx === pattern.length
    return { matched, score, indices }
}

function searchCommands(query: string, commands: CommandItem[]): CommandItem[] {
    if (!query.trim()) return []

    const results: Array<{ item: CommandItem; score: number }> = []

    for (const item of commands) {
        const titleMatch = fuzzyMatch(query, item.title)
        const subtitleMatch = item.subtitle ? fuzzyMatch(query, item.subtitle) : { matched: false, score: 0, indices: [] }
        const keywordsMatch = item.keywords?.some(k => fuzzyMatch(query, k).matched) ? { matched: true, score: 3 } : { matched: false, score: 0 }

        const bestScore = Math.max(
            titleMatch.matched ? titleMatch.score * 2 : 0, // Title match worth 2x
            subtitleMatch.matched ? subtitleMatch.score : 0,
            keywordsMatch.matched ? keywordsMatch.score : 0
        )

        if (bestScore > 0) {
            results.push({ item, score: bestScore })
        }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score)

    return results.map(r => r.item)
}

// ============================================================================
// CATEGORY ICONS
// ============================================================================

const categoryIcons: Record<CommandCategory, React.ReactNode> = {
    file: <File className="w-4 h-4" />,
    command: <Command className="w-4 h-4" />,
    settings: <Settings className="w-4 h-4" />,
    git: <GitBranch className="w-4 h-4" />,
    terminal: <Terminal className="w-4 h-4" />,
    code: <Code className="w-4 h-4" />,
    recent: <Clock className="w-4 h-4" />,
}

const categoryLabels: Record<CommandCategory, string> = {
    file: 'Files',
    command: 'Commands',
    settings: 'Settings',
    git: 'Git',
    terminal: 'Terminal',
    code: 'Code',
    recent: 'Recent',
}

// ============================================================================
// COMMAND SEARCH
// ============================================================================

export function CommandSearch({
    isOpen,
    onClose,
    commands,
    placeholder = 'Search commands...',
    recentSearches = [],
    onRecentSearchAdd,
    className = '',
}: CommandSearchProps) {
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    // Search results
    const results = useMemo(() => {
        if (!query.trim()) {
            // Show recent items or all commands grouped by category
            const recentItems = commands.filter(c => c.category === 'recent').slice(0, 5)
            if (recentItems.length > 0) return recentItems
            return commands.slice(0, 10)
        }
        return searchCommands(query, commands)
    }, [query, commands])

    // Group results by category
    const groupedResults = useMemo(() => {
        const groups: Map<CommandCategory, CommandItem[]> = new Map()
        for (const item of results) {
            if (!groups.has(item.category)) {
                groups.set(item.category, [])
            }
            groups.get(item.category)!.push(item)
        }
        return groups
    }, [results])

    // Focus input when opening
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus()
            setQuery('')
            setSelectedIndex(0)
        }
    }, [isOpen])

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(i => Math.min(i + 1, results.length - 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(i => Math.max(i - 1, 0))
                break
            case 'Enter':
                e.preventDefault()
                if (results[selectedIndex]) {
                    if (query.trim()) {
                        onRecentSearchAdd?.(query)
                    }
                    results[selectedIndex].onSelect()
                    onClose()
                }
                break
            case 'Escape':
                e.preventDefault()
                onClose()
                break
        }
    }, [results, selectedIndex, query, onRecentSearchAdd, onClose])

    // Scroll selected item into view
    useEffect(() => {
        const selectedElement = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
        selectedElement?.scrollIntoView({ block: 'nearest' })
    }, [selectedIndex])

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0)
    }, [results])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Search dialog */}
            <div
                className={`
                    relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden
                    animate-in fade-in-0 zoom-in-95 duration-150
                    ${className}
                `}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                    <Search className="w-5 h-5 text-gray-500" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-lg"
                    />
                    <kbd className="px-1.5 py-0.5 text-xs text-gray-500 bg-white/5 rounded">
                        esc
                    </kbd>
                </div>

                {/* Results */}
                <div
                    ref={listRef}
                    className="max-h-[60vh] overflow-auto py-2"
                >
                    {results.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                            No results found for "{query}"
                        </div>
                    ) : (
                        Array.from(groupedResults.entries()).map(([category, items]) => (
                            <div key={category}>
                                <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {categoryLabels[category]}
                                </div>
                                {items.map((item) => {
                                    const globalIndex = results.indexOf(item)
                                    const isSelected = globalIndex === selectedIndex

                                    return (
                                        <button
                                            key={item.id}
                                            data-index={globalIndex}
                                            onClick={() => {
                                                if (query.trim()) {
                                                    onRecentSearchAdd?.(query)
                                                }
                                                item.onSelect()
                                                onClose()
                                            }}
                                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                                            className={`
                                                w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                                                ${isSelected ? 'bg-purple-500/10' : 'hover:bg-white/5'}
                                            `}
                                        >
                                            <span className={`${isSelected ? 'text-purple-400' : 'text-gray-500'}`}>
                                                {item.icon || categoryIcons[item.category]}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                                                    {item.title}
                                                </div>
                                                {item.subtitle && (
                                                    <div className="text-sm text-gray-500 truncate">
                                                        {item.subtitle}
                                                    </div>
                                                )}
                                            </div>
                                            {item.shortcut && (
                                                <div className="flex items-center gap-0.5">
                                                    {item.shortcut.map((key, i) => (
                                                        <kbd
                                                            key={i}
                                                            className="px-1.5 py-0.5 text-[10px] text-gray-500 bg-white/5 rounded font-mono"
                                                        >
                                                            {key}
                                                        </kbd>
                                                    ))}
                                                </div>
                                            )}
                                            {isSelected && (
                                                <CornerDownLeft className="w-4 h-4 text-gray-500" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer hints */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-white/5 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white/5 rounded">↑↓</kbd>
                        Navigate
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white/5 rounded">↵</kbd>
                        Select
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-white/5 rounded">esc</kbd>
                        Close
                    </span>
                </div>
            </div>
        </div>,
        document.body
    )
}

// ============================================================================
// QUICK SEARCH INPUT
// ============================================================================

interface QuickSearchProps {
    placeholder?: string
    onSearch: (query: string) => void
    suggestions?: string[]
    loading?: boolean
    className?: string
}

export function QuickSearch({
    placeholder = 'Search...',
    onSearch,
    suggestions = [],
    loading = false,
    className = '',
}: QuickSearchProps) {
    const [query, setQuery] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(-1)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (suggestions.length === 0) return

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(i => Math.max(i - 1, 0))
                break
            case 'Enter':
                e.preventDefault()
                if (selectedIndex >= 0) {
                    setQuery(suggestions[selectedIndex])
                    onSearch(suggestions[selectedIndex])
                } else {
                    onSearch(query)
                }
                break
        }
    }

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setSelectedIndex(-1)
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Suggestions dropdown */}
            {isFocused && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-10">
                    {suggestions.map((suggestion, index) => (
                        <button
                            key={suggestion}
                            onClick={() => {
                                setQuery(suggestion)
                                onSearch(suggestion)
                            }}
                            className={`
                                w-full px-4 py-2 text-left text-sm transition-colors
                                ${index === selectedIndex
                                    ? 'bg-purple-500/10 text-white'
                                    : 'text-gray-300 hover:bg-white/5'
                                }
                            `}
                        >
                            <ArrowRight className="inline w-3 h-3 mr-2 text-gray-500" />
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
