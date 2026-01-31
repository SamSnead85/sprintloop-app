/**
 * SprintLoop Search System
 * 
 * Global and contextual search components:
 * - File search (fuzzy matching)
 * - Symbol search
 * - Full-text search
 * - Recent files
 * - Search history
 */

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    Search,
    X,
    File,
    Code,
    Hash,
    Clock,
    CornerDownLeft,
    FileText,
    Terminal,
    Layers,
    Filter,
    ChevronDown
} from 'lucide-react'

// ============================================================================
// SEARCH STATE
// ============================================================================

interface SearchResult {
    id: string
    type: 'file' | 'symbol' | 'text' | 'command' | 'recent'
    title: string
    subtitle?: string
    icon?: React.ReactNode
    path?: string
    lineNumber?: number
    score?: number
    preview?: string
}

interface SearchState {
    query: string
    results: SearchResult[]
    selectedIndex: number
    isLoading: boolean
    searchHistory: string[]
    recentFiles: string[]
    filters: {
        type: 'all' | 'files' | 'symbols' | 'text'
        includeNodeModules: boolean
        caseSensitive: boolean
        regex: boolean
    }

    setQuery: (query: string) => void
    setResults: (results: SearchResult[]) => void
    setSelectedIndex: (index: number) => void
    moveSelection: (direction: 'up' | 'down') => void
    addToHistory: (query: string) => void
    addRecentFile: (path: string) => void
    setFilters: (filters: Partial<SearchState['filters']>) => void
    clearResults: () => void
}

export const useSearch = create<SearchState>()(
    persist(
        (set) => ({
            query: '',
            results: [],
            selectedIndex: 0,
            isLoading: false,
            searchHistory: [],
            recentFiles: [],
            filters: {
                type: 'all',
                includeNodeModules: false,
                caseSensitive: false,
                regex: false,
            },

            setQuery: (query) => set({ query, selectedIndex: 0 }),
            setResults: (results) => set({ results, selectedIndex: 0 }),
            setSelectedIndex: (index) => set({ selectedIndex: index }),

            moveSelection: (direction) => set(state => {
                const maxIndex = state.results.length - 1
                let newIndex = state.selectedIndex

                if (direction === 'up') {
                    newIndex = newIndex <= 0 ? maxIndex : newIndex - 1
                } else {
                    newIndex = newIndex >= maxIndex ? 0 : newIndex + 1
                }

                return { selectedIndex: newIndex }
            }),

            addToHistory: (query) => set(state => ({
                searchHistory: [query, ...state.searchHistory.filter(h => h !== query)].slice(0, 20)
            })),

            addRecentFile: (path) => set(state => ({
                recentFiles: [path, ...state.recentFiles.filter(f => f !== path)].slice(0, 10)
            })),

            setFilters: (filters) => set(state => ({
                filters: { ...state.filters, ...filters }
            })),

            clearResults: () => set({ results: [], query: '', selectedIndex: 0 }),
        }),
        { name: 'sprintloop-search' }
    )
)

// ============================================================================
// FUZZY SEARCH UTILITY
// ============================================================================

function fuzzyMatch(text: string, query: string): { match: boolean; score: number; indices: number[] } {
    if (!query) return { match: true, score: 0, indices: [] }

    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()

    let queryIndex = 0
    let score = 0
    const indices: number[] = []
    let lastMatchIndex = -1

    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
        if (textLower[i] === queryLower[queryIndex]) {
            indices.push(i)

            // Consecutive matches get bonus
            if (lastMatchIndex === i - 1) {
                score += 2
            }

            // Word boundary match gets bonus
            if (i === 0 || /[^a-zA-Z0-9]/.test(text[i - 1])) {
                score += 3
            }

            lastMatchIndex = i
            queryIndex++
            score++
        }
    }

    const match = queryIndex === query.length

    // Penalize longer texts
    if (match) {
        score -= text.length * 0.1
    }

    return { match, score, indices }
}

// ============================================================================
// HIGHLIGHTED TEXT
// ============================================================================

interface HighlightedTextProps {
    text: string
    indices: number[]
}

function HighlightedText({ text, indices }: HighlightedTextProps) {
    const indexSet = new Set(indices)

    return (
        <span>
            {text.split('').map((char, i) => (
                indexSet.has(i) ? (
                    <mark key={i} className="bg-yellow-500/30 text-yellow-200">{char}</mark>
                ) : (
                    <span key={i}>{char}</span>
                )
            ))}
        </span>
    )
}

// ============================================================================
// SEARCH RESULT ITEM
// ============================================================================

interface SearchResultItemProps {
    result: SearchResult
    isSelected: boolean
    onClick: () => void
    highlightIndices?: number[]
}

const typeIcons: Record<SearchResult['type'], React.ReactNode> = {
    file: <File className="w-4 h-4 text-blue-400" />,
    symbol: <Hash className="w-4 h-4 text-purple-400" />,
    text: <FileText className="w-4 h-4 text-gray-400" />,
    command: <Terminal className="w-4 h-4 text-green-400" />,
    recent: <Clock className="w-4 h-4 text-yellow-400" />,
}

function SearchResultItem({ result, isSelected, onClick, highlightIndices = [] }: SearchResultItemProps) {
    return (
        <button
            onClick={onClick}
            className={`
                w-full flex items-center gap-3 px-4 py-2.5 text-left
                transition-colors
                ${isSelected
                    ? 'bg-purple-500/20 text-white'
                    : 'text-gray-300 hover:bg-white/5'
                }
            `}
        >
            <span className="flex-shrink-0">
                {result.icon || typeIcons[result.type]}
            </span>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                        <HighlightedText text={result.title} indices={highlightIndices} />
                    </span>
                    {result.lineNumber && (
                        <span className="text-xs text-gray-500">:{result.lineNumber}</span>
                    )}
                </div>
                {result.subtitle && (
                    <p className="text-sm text-gray-500 truncate">{result.subtitle}</p>
                )}
                {result.preview && (
                    <p className="text-sm text-gray-600 truncate mt-0.5 font-mono text-xs">
                        {result.preview}
                    </p>
                )}
            </div>

            {isSelected && (
                <span className="flex-shrink-0 text-gray-500">
                    <CornerDownLeft className="w-4 h-4" />
                </span>
            )}
        </button>
    )
}

// ============================================================================
// QUICK OPEN (Cmd+P)
// ============================================================================

interface QuickOpenProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (result: SearchResult) => void
    files?: Array<{ path: string; name: string }>
}

export function QuickOpen({ isOpen, onClose, onSelect, files = [] }: QuickOpenProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const {
        query,
        setQuery,
        selectedIndex,
        moveSelection,
        recentFiles,
        addRecentFile,
        clearResults
    } = useSearch()

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus()
            setQuery('')
        }
    }, [isOpen, setQuery])

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                moveSelection('down')
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                moveSelection('up')
            } else if (e.key === 'Enter') {
                e.preventDefault()
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex])
                }
            } else if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, selectedIndex, moveSelection, onClose])

    // Filter and sort files
    const results = useMemo<SearchResult[]>(() => {
        if (!query) {
            // Show recent files when no query
            return recentFiles.slice(0, 5).map(path => ({
                id: path,
                type: 'recent' as const,
                title: path.split('/').pop() || path,
                subtitle: path,
                path,
            }))
        }

        return files
            .map(file => {
                const { match, score, indices } = fuzzyMatch(file.name, query)
                return {
                    id: file.path,
                    type: 'file' as const,
                    title: file.name,
                    subtitle: file.path,
                    path: file.path,
                    score,
                    match,
                    indices,
                }
            })
            .filter(r => r.match)
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 20)
    }, [query, files, recentFiles])

    const handleSelect = (result: SearchResult) => {
        if (result.path) {
            addRecentFile(result.path)
        }
        onSelect(result)
        onClose()
        clearResults()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Search panel */}
            <div className="relative w-full max-w-xl mx-4">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-xl blur-xl" />

                <div className="relative bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    {/* Input */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                        <Search className="w-5 h-5 text-gray-500" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search files by name..."
                            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="p-1 text-gray-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Results */}
                    <div className="max-h-[50vh] overflow-y-auto">
                        {results.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">
                                {query ? 'No files found' : 'Start typing to search files'}
                            </div>
                        ) : (
                            <div className="py-2">
                                {!query && (
                                    <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                                        Recent Files
                                    </div>
                                )}
                                {results.map((result, index) => (
                                    <SearchResultItem
                                        key={result.id}
                                        result={result}
                                        isSelected={index === selectedIndex}
                                        onClick={() => handleSelect(result)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-xs text-gray-500">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white/5 rounded">↑↓</kbd>
                                Navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white/5 rounded">↵</kbd>
                                Open
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 bg-white/5 rounded">esc</kbd>
                                Close
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// GLOBAL SEARCH (Cmd+Shift+F)
// ============================================================================

interface GlobalSearchProps {
    isOpen: boolean
    onClose: () => void
    onResultClick: (result: SearchResult) => void
}

export function GlobalSearch({ isOpen, onClose, onResultClick }: GlobalSearchProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const { filters, setFilters } = useSearch()

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus()
        }
    }, [isOpen])

    const handleSearch = async () => {
        if (!query.trim()) return

        setIsSearching(true)

        // Simulate search - in real implementation, this would call the backend
        await new Promise(r => setTimeout(r, 500))

        // Mock results
        setResults([
            {
                id: '1',
                type: 'text',
                title: 'Found match in App.tsx',
                subtitle: 'src/App.tsx',
                lineNumber: 42,
                preview: `const ${query} = useMemo(() => {...`,
                path: 'src/App.tsx',
            },
            {
                id: '2',
                type: 'text',
                title: 'Found match in utils.ts',
                subtitle: 'src/lib/utils.ts',
                lineNumber: 15,
                preview: `export function ${query}(input: string) {`,
                path: 'src/lib/utils.ts',
            },
        ])

        setIsSearching(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-2xl mx-4 bg-slate-900 border border-white/10 rounded-xl shadow-2xl">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                    <Search className="w-5 h-5 text-gray-500" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search in files..."
                        className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                    />

                    {/* Filter dropdown */}
                    <button className="flex items-center gap-1 px-2 py-1 text-sm text-gray-500 hover:text-white border border-white/10 rounded-lg">
                        <Filter className="w-3.5 h-3.5" />
                        <span>Filters</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Filter options */}
                <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 text-sm">
                    <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.caseSensitive}
                            onChange={(e) => setFilters({ caseSensitive: e.target.checked })}
                            className="accent-purple-500"
                        />
                        <span>Match Case</span>
                    </label>
                    <label className="flex items-center gap-2 text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.regex}
                            onChange={(e) => setFilters({ regex: e.target.checked })}
                            className="accent-purple-500"
                        />
                        <span>Regex</span>
                    </label>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {isSearching ? (
                        <div className="py-8 text-center text-gray-500">
                            <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
                            <p>Searching...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">
                            {query ? 'No results found' : 'Enter a search term'}
                        </div>
                    ) : (
                        <div className="py-2">
                            <div className="px-4 py-1 text-xs font-semibold text-gray-500">
                                {results.length} results
                            </div>
                            {results.map((result) => (
                                <SearchResultItem
                                    key={result.id}
                                    result={result}
                                    isSelected={false}
                                    onClick={() => onResultClick(result)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// SYMBOL SEARCH (Cmd+T / Cmd+Shift+O)
// ============================================================================

interface Symbol {
    name: string
    kind: 'function' | 'class' | 'interface' | 'variable' | 'type'
    path: string
    line: number
}

interface SymbolSearchProps {
    isOpen: boolean
    onClose: () => void
    symbols: Symbol[]
    onSelect: (symbol: Symbol) => void
}

export function SymbolSearch({ isOpen, onClose, symbols, onSelect }: SymbolSearchProps) {
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus()
            setQuery('')
            setSelectedIndex(0)
        }
    }, [isOpen])

    const filteredSymbols = useMemo(() => {
        if (!query) return symbols.slice(0, 20)

        return symbols
            .map(symbol => {
                const { match, score } = fuzzyMatch(symbol.name, query)
                return { ...symbol, match, score }
            })
            .filter(s => s.match)
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 20)
    }, [query, symbols])

    const kindIcons: Record<Symbol['kind'], React.ReactNode> = {
        function: <Code className="w-4 h-4 text-purple-400" />,
        class: <Layers className="w-4 h-4 text-yellow-400" />,
        interface: <Hash className="w-4 h-4 text-blue-400" />,
        variable: <span className="text-green-400 font-bold text-xs">V</span>,
        type: <span className="text-cyan-400 font-bold text-xs">T</span>,
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative w-full max-w-xl mx-4 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                    <Hash className="w-5 h-5 text-gray-500" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Go to symbol..."
                        className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                    />
                </div>

                <div className="max-h-[50vh] overflow-y-auto py-2">
                    {filteredSymbols.map((symbol, index) => (
                        <button
                            key={`${symbol.path}:${symbol.line}`}
                            onClick={() => {
                                onSelect(symbol)
                                onClose()
                            }}
                            className={`
                                w-full flex items-center gap-3 px-4 py-2 text-left
                                ${index === selectedIndex
                                    ? 'bg-purple-500/20 text-white'
                                    : 'text-gray-300 hover:bg-white/5'
                                }
                            `}
                        >
                            <span className="w-5 h-5 flex items-center justify-center">
                                {kindIcons[symbol.kind]}
                            </span>
                            <span className="flex-1 font-medium">{symbol.name}</span>
                            <span className="text-xs text-gray-500">
                                {symbol.path.split('/').pop()}:{symbol.line}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
