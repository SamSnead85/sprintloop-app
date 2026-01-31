/**
 * SprintLoop Search Panel System
 * 
 * Phase 1901-1950: Global search
 * - Search in files
 * - Replace in files
 * - Regex support
 * - Case sensitivity
 * - File filters
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
    Search,
    Replace,
    ChevronDown,
    ChevronRight,
    File,
    Folder,
    X,
    RefreshCw,
    Filter,
    MoreHorizontal,
    CaseSensitive,
    Regex,
    WholeWord,
    FolderOpen,
    FileText,
    Check,
    AlertCircle
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface SearchResult {
    id: string
    file: string
    line: number
    column: number
    preview: string
    matchStart: number
    matchEnd: number
}

interface FileSearchResults {
    file: string
    matches: SearchResult[]
    collapsed?: boolean
}

interface SearchOptions {
    caseSensitive: boolean
    wholeWord: boolean
    regex: boolean
    includePattern: string
    excludePattern: string
}

// ============================================================================
// SEARCH MATCH HIGHLIGHT
// ============================================================================

interface HighlightedPreviewProps {
    text: string
    matchStart: number
    matchEnd: number
}

function HighlightedPreview({ text, matchStart, matchEnd }: HighlightedPreviewProps) {
    const before = text.slice(0, matchStart)
    const match = text.slice(matchStart, matchEnd)
    const after = text.slice(matchEnd)

    return (
        <span className="font-mono text-xs">
            <span className="text-gray-500">{before}</span>
            <span className="bg-yellow-500/30 text-yellow-200 px-0.5 rounded">{match}</span>
            <span className="text-gray-500">{after}</span>
        </span>
    )
}

// ============================================================================
// SEARCH RESULT ITEM
// ============================================================================

interface SearchResultItemProps {
    result: SearchResult
    onSelect: () => void
    isSelected?: boolean
}

function SearchResultItem({ result, onSelect, isSelected }: SearchResultItemProps) {
    return (
        <button
            onClick={onSelect}
            className={`
                w-full flex items-start gap-2 px-4 py-1.5 text-left transition-colors
                ${isSelected ? 'bg-purple-500/20' : 'hover:bg-white/5'}
            `}
        >
            <span className="text-xs text-gray-600 w-8 text-right flex-shrink-0 pt-0.5">
                {result.line}
            </span>
            <div className="flex-1 min-w-0 overflow-hidden">
                <HighlightedPreview
                    text={result.preview}
                    matchStart={result.matchStart}
                    matchEnd={result.matchEnd}
                />
            </div>
        </button>
    )
}

// ============================================================================
// FILE RESULTS GROUP
// ============================================================================

interface FileResultsGroupProps {
    fileResults: FileSearchResults
    onToggle: () => void
    onSelectResult: (result: SearchResult) => void
    selectedResultId?: string
}

function FileResultsGroup({
    fileResults,
    onToggle,
    onSelectResult,
    selectedResultId,
}: FileResultsGroupProps) {
    const fileName = fileResults.file.split('/').pop() || fileResults.file
    const directory = fileResults.file.split('/').slice(0, -1).join('/')

    return (
        <div className="border-b border-white/5 last:border-0">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
            >
                {fileResults.collapsed ? (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-300 truncate">{fileName}</span>
                {directory && (
                    <span className="text-xs text-gray-600 truncate">{directory}</span>
                )}
                <span className="ml-auto px-1.5 py-0.5 bg-white/5 text-gray-500 text-xs rounded">
                    {fileResults.matches.length}
                </span>
            </button>

            {!fileResults.collapsed && (
                <div className="pb-1">
                    {fileResults.matches.map(result => (
                        <SearchResultItem
                            key={result.id}
                            result={result}
                            onSelect={() => onSelectResult(result)}
                            isSelected={result.id === selectedResultId}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// SEARCH INPUT
// ============================================================================

interface SearchInputProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    icon?: React.ReactNode
    onClear?: () => void
}

function SearchInput({ value, onChange, placeholder, icon, onClear }: SearchInputProps) {
    return (
        <div className="relative flex items-center">
            {icon && (
                <span className="absolute left-3 text-gray-500">{icon}</span>
            )}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`
                    w-full py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500
                    focus:outline-none focus:border-purple-500 transition-colors
                    ${icon ? 'pl-9 pr-8' : 'px-3'}
                `}
            />
            {value && onClear && (
                <button
                    onClick={onClear}
                    className="absolute right-2 p-1 text-gray-500 hover:text-white transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    )
}

// ============================================================================
// SEARCH PANEL
// ============================================================================

interface SearchPanelProps {
    results?: FileSearchResults[]
    onSearch?: (query: string, options: SearchOptions) => void
    onReplace?: (query: string, replacement: string, options: SearchOptions) => void
    onReplaceAll?: (query: string, replacement: string, options: SearchOptions) => void
    onSelectResult?: (result: SearchResult) => void
    isSearching?: boolean
    className?: string
}

export function SearchPanel({
    results: propResults,
    onSearch,
    onReplace,
    onReplaceAll,
    onSelectResult,
    isSearching = false,
    className = '',
}: SearchPanelProps) {
    const [query, setQuery] = useState('')
    const [replacement, setReplacement] = useState('')
    const [showReplace, setShowReplace] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [selectedResultId, setSelectedResultId] = useState<string>()
    const [options, setOptions] = useState<SearchOptions>({
        caseSensitive: false,
        wholeWord: false,
        regex: false,
        includePattern: '',
        excludePattern: 'node_modules, .git',
    })

    // Demo results
    const defaultResults: FileSearchResults[] = [
        {
            file: 'src/components/App.tsx',
            matches: [
                { id: 'r1', file: 'src/components/App.tsx', line: 12, column: 8, preview: '  const [count, setCount] = useState(0)', matchStart: 16, matchEnd: 21 },
                { id: 'r2', file: 'src/components/App.tsx', line: 24, column: 4, preview: '  const counter = useCounter()', matchStart: 8, matchEnd: 15 },
            ],
        },
        {
            file: 'src/hooks/useCounter.ts',
            matches: [
                { id: 'r3', file: 'src/hooks/useCounter.ts', line: 5, column: 11, preview: 'export function useCounter() {', matchStart: 16, matchEnd: 26 },
                { id: 'r4', file: 'src/hooks/useCounter.ts', line: 8, column: 4, preview: '  const counter = ref(0)', matchStart: 8, matchEnd: 15 },
            ],
        },
        {
            file: 'src/utils/counterHelpers.ts',
            matches: [
                { id: 'r5', file: 'src/utils/counterHelpers.ts', line: 1, column: 14, preview: 'export const counterUtils = {', matchStart: 14, matchEnd: 21 },
            ],
        },
    ]

    const [results, setResults] = useState<FileSearchResults[]>(propResults || defaultResults)

    // Total match count
    const totalMatches = useMemo(() => {
        return results.reduce((sum, fr) => sum + fr.matches.length, 0)
    }, [results])

    // Toggle file collapse
    const toggleFileCollapse = useCallback((file: string) => {
        setResults(prev => prev.map(fr =>
            fr.file === file ? { ...fr, collapsed: !fr.collapsed } : fr
        ))
    }, [])

    // Handle search
    const handleSearch = useCallback(() => {
        if (query.trim()) {
            onSearch?.(query, options)
        }
    }, [query, options, onSearch])

    // Handle replace
    const handleReplace = useCallback(() => {
        if (query.trim() && selectedResultId) {
            onReplace?.(query, replacement, options)
        }
    }, [query, replacement, options, selectedResultId, onReplace])

    // Handle replace all
    const handleReplaceAll = useCallback(() => {
        if (query.trim()) {
            onReplaceAll?.(query, replacement, options)
        }
    }, [query, replacement, options, onReplaceAll])

    // Update option
    const toggleOption = (key: keyof SearchOptions) => {
        if (typeof options[key] === 'boolean') {
            setOptions(prev => ({ ...prev, [key]: !prev[key] }))
        }
    }

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-white">Search</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowReplace(!showReplace)}
                        className={`p-1.5 rounded transition-colors ${showReplace ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'
                            }`}
                        title="Toggle Replace"
                    >
                        <Replace className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-1.5 rounded transition-colors ${showFilters ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'
                            }`}
                        title="Toggle Filters"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleSearch}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Search inputs */}
            <div className="px-3 py-2 space-y-2 border-b border-white/5">
                {/* Search query */}
                <div className="flex items-center gap-1">
                    <div className="flex-1">
                        <SearchInput
                            value={query}
                            onChange={setQuery}
                            placeholder="Search"
                            icon={<Search className="w-4 h-4" />}
                            onClear={() => setQuery('')}
                        />
                    </div>
                </div>

                {/* Options */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => toggleOption('caseSensitive')}
                        className={`p-1.5 rounded transition-colors ${options.caseSensitive ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-white'
                            }`}
                        title="Case Sensitive"
                    >
                        <CaseSensitive className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => toggleOption('wholeWord')}
                        className={`p-1.5 rounded transition-colors ${options.wholeWord ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-white'
                            }`}
                        title="Whole Word"
                    >
                        <WholeWord className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => toggleOption('regex')}
                        className={`p-1.5 rounded transition-colors ${options.regex ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-white'
                            }`}
                        title="Use Regex"
                    >
                        <Regex className="w-4 h-4" />
                    </button>
                </div>

                {/* Replace input */}
                {showReplace && (
                    <div className="flex items-center gap-1">
                        <div className="flex-1">
                            <SearchInput
                                value={replacement}
                                onChange={setReplacement}
                                placeholder="Replace"
                                icon={<Replace className="w-4 h-4" />}
                                onClear={() => setReplacement('')}
                            />
                        </div>
                        <button
                            onClick={handleReplace}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Replace"
                        >
                            <Check className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleReplaceAll}
                            className="px-2 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Replace All"
                        >
                            All
                        </button>
                    </div>
                )}

                {/* File filters */}
                {showFilters && (
                    <div className="space-y-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={options.includePattern}
                                onChange={(e) => setOptions(prev => ({ ...prev, includePattern: e.target.value }))}
                                placeholder="Files to include (e.g. *.ts, src/)"
                                className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={options.excludePattern}
                                onChange={(e) => setOptions(prev => ({ ...prev, excludePattern: e.target.value }))}
                                placeholder="Files to exclude"
                                className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Results summary */}
            {query && (
                <div className="px-3 py-2 text-xs text-gray-500 border-b border-white/5">
                    {totalMatches} results in {results.length} files
                </div>
            )}

            {/* Results list */}
            <div className="flex-1 overflow-y-auto">
                {results.length > 0 ? (
                    results.map(fileResults => (
                        <FileResultsGroup
                            key={fileResults.file}
                            fileResults={fileResults}
                            onToggle={() => toggleFileCollapse(fileResults.file)}
                            onSelectResult={(result) => {
                                setSelectedResultId(result.id)
                                onSelectResult?.(result)
                            }}
                            selectedResultId={selectedResultId}
                        />
                    ))
                ) : query ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <AlertCircle className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No results found</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Search className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">Enter a search term</p>
                    </div>
                )}
            </div>
        </div>
    )
}
