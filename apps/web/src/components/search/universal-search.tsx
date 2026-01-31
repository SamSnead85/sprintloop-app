/**
 * SprintLoop Universal Search System
 * 
 * Phase 501-600: Advanced search and discovery
 * - Universal search (files, symbols, commands)
 * - Fuzzy matching
 * - Recent & favorites
 * - AI-powered semantic search
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
    Search,
    File,
    Hash,
    Command,
    Clock,
    Star,
    Folder,
    Code,
    Terminal,
    Settings,
    Users,
    GitBranch,
    MessageSquare,
    Zap,
    ExternalLink,
    X
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type SearchCategory = 'all' | 'files' | 'symbols' | 'commands' | 'recent' | 'favorites'

interface SearchResult {
    id: string
    type: 'file' | 'symbol' | 'command' | 'snippet' | 'setting' | 'git' | 'ai'
    title: string
    subtitle?: string
    icon?: React.ReactNode
    path?: string
    shortcut?: string
    score: number
    metadata?: Record<string, unknown>
    action?: () => void
}

interface SearchState {
    query: string
    category: SearchCategory
    results: SearchResult[]
    selectedIndex: number
    isLoading: boolean
    recentSearches: string[]
    favorites: string[]
}

// ============================================================================
// FUZZY MATCHING
// ============================================================================

function fuzzyMatch(query: string, target: string): { matches: boolean; score: number; indices: number[] } {
    query = query.toLowerCase()
    target = target.toLowerCase()

    let queryIndex = 0
    let targetIndex = 0
    const indices: number[] = []
    let score = 0
    let consecutiveBonus = 0

    while (queryIndex < query.length && targetIndex < target.length) {
        if (query[queryIndex] === target[targetIndex]) {
            indices.push(targetIndex)

            // Score bonuses
            if (targetIndex === 0) score += 10 // Start of string
            if (target[targetIndex - 1] === '/' || target[targetIndex - 1] === '.') score += 8 // After separator
            if (consecutiveBonus > 0) score += consecutiveBonus * 2 // Consecutive matches

            consecutiveBonus++
            queryIndex++
        } else {
            consecutiveBonus = 0
        }
        targetIndex++
    }

    const matches = queryIndex === query.length

    if (matches) {
        // Penalize for length difference
        score -= (target.length - query.length) * 0.5
        // Bonus for shorter matches
        score += Math.max(0, 20 - target.length)
    }

    return { matches, score, indices }
}

// ============================================================================
// HIGHLIGHT MATCHES
// ============================================================================

function HighlightedText({ text, indices }: { text: string; indices: number[] }) {
    const parts: React.ReactNode[] = []
    let lastIndex = 0

    indices.forEach((index, i) => {
        if (index > lastIndex) {
            parts.push(
                <span key={`text-${i}`} className="text-gray-400">
                    {text.slice(lastIndex, index)}
                </span>
            )
        }
        parts.push(
            <span key={`match-${i}`} className="text-white font-semibold">
                {text[index]}
            </span>
        )
        lastIndex = index + 1
    })

    if (lastIndex < text.length) {
        parts.push(
            <span key="text-end" className="text-gray-400">
                {text.slice(lastIndex)}
            </span>
        )
    }

    return <>{parts}</>
}

// ============================================================================
// MOCK DATA (replace with real data sources)
// ============================================================================

const mockFiles: SearchResult[] = [
    { id: 'f1', type: 'file', title: 'App.tsx', subtitle: 'src/App.tsx', icon: <File className="w-4 h-4 text-blue-400" />, score: 0 },
    { id: 'f2', type: 'file', title: 'index.ts', subtitle: 'src/index.ts', icon: <File className="w-4 h-4 text-yellow-400" />, score: 0 },
    { id: 'f3', type: 'file', title: 'theme-engine.tsx', subtitle: 'src/components/ui/theme-engine.tsx', icon: <File className="w-4 h-4 text-purple-400" />, score: 0 },
    { id: 'f4', type: 'file', title: 'package.json', subtitle: 'package.json', icon: <File className="w-4 h-4 text-green-400" />, score: 0 },
]

const mockSymbols: SearchResult[] = [
    { id: 's1', type: 'symbol', title: 'useTheme', subtitle: 'Hook', icon: <Hash className="w-4 h-4 text-purple-400" />, path: 'src/hooks/useTheme.ts', score: 0 },
    { id: 's2', type: 'symbol', title: 'ThemeProvider', subtitle: 'Component', icon: <Hash className="w-4 h-4 text-blue-400" />, path: 'src/components/ThemeProvider.tsx', score: 0 },
    { id: 's3', type: 'symbol', title: 'searchFiles', subtitle: 'Function', icon: <Hash className="w-4 h-4 text-green-400" />, path: 'src/lib/search.ts', score: 0 },
]

const mockCommands: SearchResult[] = [
    { id: 'c1', type: 'command', title: 'New File', subtitle: 'Create a new file', icon: <File className="w-4 h-4 text-blue-400" />, shortcut: '⌘N', score: 0 },
    { id: 'c2', type: 'command', title: 'Open Folder', subtitle: 'Open a folder', icon: <Folder className="w-4 h-4 text-yellow-400" />, shortcut: '⌘O', score: 0 },
    { id: 'c3', type: 'command', title: 'Toggle Terminal', subtitle: 'Show/hide terminal', icon: <Terminal className="w-4 h-4 text-green-400" />, shortcut: '⌘`', score: 0 },
    { id: 'c4', type: 'command', title: 'Git: Commit', subtitle: 'Commit staged changes', icon: <GitBranch className="w-4 h-4 text-orange-400" />, shortcut: '⌘⇧G', score: 0 },
    { id: 'c5', type: 'command', title: 'Settings', subtitle: 'Open settings', icon: <Settings className="w-4 h-4 text-gray-400" />, shortcut: '⌘,', score: 0 },
]

// ============================================================================
// SEARCH HOOK
// ============================================================================

interface UseUniversalSearchOptions {
    onSelect?: (result: SearchResult) => void
    onClose?: () => void
}

export function useUniversalSearch({ onSelect, onClose }: UseUniversalSearchOptions = {}) {
    const [state, setState] = useState<SearchState>({
        query: '',
        category: 'all',
        results: [],
        selectedIndex: 0,
        isLoading: false,
        recentSearches: [],
        favorites: [],
    })

    const inputRef = useRef<HTMLInputElement>(null)
    const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

    // Load recent searches and favorites
    useEffect(() => {
        const recent = localStorage.getItem('sprintloop-recent-searches')
        const favs = localStorage.getItem('sprintloop-favorites')

        setState(prev => ({
            ...prev,
            recentSearches: recent ? JSON.parse(recent) : [],
            favorites: favs ? JSON.parse(favs) : [],
        }))
    }, [])

    // Search function
    const search = useCallback((query: string, category: SearchCategory) => {
        if (!query.trim()) {
            setState(prev => ({ ...prev, results: [], isLoading: false }))
            return
        }

        setState(prev => ({ ...prev, isLoading: true }))

        // Simulate async search
        setTimeout(() => {
            let allResults: SearchResult[] = []

            if (category === 'all' || category === 'files') {
                allResults = [...allResults, ...mockFiles]
            }
            if (category === 'all' || category === 'symbols') {
                allResults = [...allResults, ...mockSymbols]
            }
            if (category === 'all' || category === 'commands') {
                allResults = [...allResults, ...mockCommands]
            }

            // Apply fuzzy matching
            const scored = allResults
                .map(result => {
                    const searchString = `${result.title} ${result.subtitle || ''}`
                    const match = fuzzyMatch(query, searchString)
                    return { ...result, score: match.score, matches: match.matches }
                })
                .filter(r => r.matches)
                .sort((a, b) => b.score - a.score)
                .slice(0, 20)

            setState(prev => ({
                ...prev,
                results: scored,
                isLoading: false,
                selectedIndex: 0,
            }))
        }, 50)
    }, [])

    // Debounced search
    const debouncedSearch = useCallback((query: string, category: SearchCategory) => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => search(query, category), 100)
    }, [search])

    const setQuery = useCallback((query: string) => {
        setState(prev => ({ ...prev, query }))
        debouncedSearch(query, state.category)
    }, [debouncedSearch, state.category])

    const setCategory = useCallback((category: SearchCategory) => {
        setState(prev => ({ ...prev, category }))
        debouncedSearch(state.query, category)
    }, [debouncedSearch, state.query])

    const selectResult = useCallback((result: SearchResult) => {
        // Add to recent
        const recent = [
            state.query,
            ...state.recentSearches.filter(r => r !== state.query),
        ].slice(0, 10)

        localStorage.setItem('sprintloop-recent-searches', JSON.stringify(recent))

        setState(prev => ({ ...prev, recentSearches: recent }))

        result.action?.()
        onSelect?.(result)
    }, [state.query, state.recentSearches, onSelect])

    const toggleFavorite = useCallback((resultId: string) => {
        const newFavorites = state.favorites.includes(resultId)
            ? state.favorites.filter(f => f !== resultId)
            : [...state.favorites, resultId]

        localStorage.setItem('sprintloop-favorites', JSON.stringify(newFavorites))
        setState(prev => ({ ...prev, favorites: newFavorites }))
    }, [state.favorites])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setState(prev => ({
                    ...prev,
                    selectedIndex: Math.min(prev.selectedIndex + 1, prev.results.length - 1),
                }))
                break
            case 'ArrowUp':
                e.preventDefault()
                setState(prev => ({
                    ...prev,
                    selectedIndex: Math.max(prev.selectedIndex - 1, 0),
                }))
                break
            case 'Enter':
                e.preventDefault()
                if (state.results[state.selectedIndex]) {
                    selectResult(state.results[state.selectedIndex])
                }
                break
            case 'Escape':
                e.preventDefault()
                onClose?.()
                break
        }
    }, [state.results, state.selectedIndex, selectResult, onClose])

    return {
        ...state,
        inputRef,
        setQuery,
        setCategory,
        selectResult,
        toggleFavorite,
        handleKeyDown,
        clear: () => setState(prev => ({ ...prev, query: '', results: [] })),
    }
}

// ============================================================================
// SEARCH DIALOG
// ============================================================================

interface UniversalSearchProps {
    isOpen: boolean
    onClose: () => void
    onSelect?: (result: SearchResult) => void
}

export function UniversalSearch({ isOpen, onClose, onSelect }: UniversalSearchProps) {
    const search = useUniversalSearch({ onSelect, onClose })

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => search.inputRef.current?.focus(), 50)
        }
    }, [isOpen, search.inputRef])

    if (!isOpen) return null

    const categories: { id: SearchCategory; label: string; icon: React.ReactNode }[] = [
        { id: 'all', label: 'All', icon: <Search className="w-4 h-4" /> },
        { id: 'files', label: 'Files', icon: <File className="w-4 h-4" /> },
        { id: 'symbols', label: 'Symbols', icon: <Hash className="w-4 h-4" /> },
        { id: 'commands', label: 'Commands', icon: <Command className="w-4 h-4" /> },
        { id: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" /> },
    ]

    const typeIcons: Record<SearchResult['type'], React.ReactNode> = {
        file: <File className="w-4 h-4 text-blue-400" />,
        symbol: <Hash className="w-4 h-4 text-purple-400" />,
        command: <Command className="w-4 h-4 text-green-400" />,
        snippet: <Code className="w-4 h-4 text-yellow-400" />,
        setting: <Settings className="w-4 h-4 text-gray-400" />,
        git: <GitBranch className="w-4 h-4 text-orange-400" />,
        ai: <Zap className="w-4 h-4 text-purple-400" />,
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div
                className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
                onKeyDown={search.handleKeyDown}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                    <Search className="w-5 h-5 text-gray-500" />
                    <input
                        ref={search.inputRef}
                        type="text"
                        value={search.query}
                        onChange={(e) => search.setQuery(e.target.value)}
                        placeholder="Search files, symbols, commands..."
                        className="flex-1 bg-transparent text-white text-lg placeholder-gray-500 outline-none"
                    />
                    {search.query && (
                        <button
                            onClick={() => search.clear()}
                            className="p-1 text-gray-500 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                    <kbd className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-gray-400">
                        ESC
                    </kbd>
                </div>

                {/* Category tabs */}
                <div className="flex gap-1 px-4 py-2 border-b border-white/5">
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => search.setCategory(cat.id)}
                            className={`
                                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                                ${search.category === cat.id
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }
                            `}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                    {search.isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : search.results.length > 0 ? (
                        <div className="p-2">
                            {search.results.map((result, i) => (
                                <button
                                    key={result.id}
                                    onClick={() => search.selectResult(result)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
                                        ${i === search.selectedIndex
                                            ? 'bg-purple-500/20'
                                            : 'hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {result.icon || typeIcons[result.type]}
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate">
                                            {result.title}
                                        </div>
                                        {result.subtitle && (
                                            <div className="text-sm text-gray-500 truncate">
                                                {result.subtitle}
                                            </div>
                                        )}
                                    </div>
                                    {result.shortcut && (
                                        <kbd className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-gray-400">
                                            {result.shortcut}
                                        </kbd>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            search.toggleFavorite(result.id)
                                        }}
                                        className={`
                                            p-1 rounded transition-colors
                                            ${search.favorites.includes(result.id)
                                                ? 'text-yellow-400'
                                                : 'text-gray-600 hover:text-yellow-400'
                                            }
                                        `}
                                    >
                                        <Star className="w-4 h-4" fill={search.favorites.includes(result.id) ? 'currentColor' : 'none'} />
                                    </button>
                                </button>
                            ))}
                        </div>
                    ) : search.query ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Search className="w-12 h-12 mb-3 opacity-30" />
                            <p>No results found for "{search.query}"</p>
                        </div>
                    ) : (
                        <div className="p-4">
                            {/* Recent searches */}
                            {search.recentSearches.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-xs font-medium text-gray-500 mb-2">Recent Searches</h3>
                                    <div className="space-y-1">
                                        {search.recentSearches.slice(0, 5).map((query, i) => (
                                            <button
                                                key={i}
                                                onClick={() => search.setQuery(query)}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-left text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                            >
                                                <Clock className="w-4 h-4" />
                                                {query}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick actions */}
                            <div>
                                <h3 className="text-xs font-medium text-gray-500 mb-2">Quick Actions</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {mockCommands.slice(0, 4).map(cmd => (
                                        <button
                                            key={cmd.id}
                                            onClick={() => search.selectResult(cmd)}
                                            className="flex items-center gap-2 px-3 py-2 text-left text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                                        >
                                            {cmd.icon}
                                            <span className="flex-1">{cmd.title}</span>
                                            {cmd.shortcut && (
                                                <span className="text-xs text-gray-600">{cmd.shortcut}</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-xs text-gray-500">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 bg-slate-800 rounded">↑↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1 bg-slate-800 rounded">↵</kbd>
                            Select
                        </span>
                    </div>
                    <span>
                        {search.results.length} results
                    </span>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// QUICK OPEN HOOK
// ============================================================================

export function useQuickOpen() {
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
    }
}
