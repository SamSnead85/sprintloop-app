/**
 * SprintLoop Outline View System
 * 
 * Phase 1551-1600: Code outline
 * - Symbol tree
 * - Go to symbol
 * - Symbol types
 * - Sorting options
 * - Icon badges
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
    ChevronRight,
    ChevronDown,
    Search,
    SortAsc,
    SortDesc,
    Filter,
    Box,
    Braces,
    Type,
    Hash,
    AtSign,
    Circle,
    Layers,
    Code,
    FileText,
    Variable,
    Puzzle
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type SymbolKind =
    | 'file'
    | 'module'
    | 'namespace'
    | 'package'
    | 'class'
    | 'method'
    | 'property'
    | 'field'
    | 'constructor'
    | 'enum'
    | 'interface'
    | 'function'
    | 'variable'
    | 'constant'
    | 'string'
    | 'number'
    | 'boolean'
    | 'array'
    | 'object'
    | 'key'
    | 'null'
    | 'enumMember'
    | 'struct'
    | 'event'
    | 'operator'
    | 'typeParameter'

interface OutlineSymbol {
    id: string
    name: string
    kind: SymbolKind
    detail?: string
    range: {
        startLine: number
        endLine: number
    }
    children?: OutlineSymbol[]
    deprecated?: boolean
}

type SortMode = 'position' | 'name' | 'kind'

// ============================================================================
// SYMBOL ICON
// ============================================================================

interface SymbolIconProps {
    kind: SymbolKind
    className?: string
}

export function SymbolIcon({ kind, className = 'w-4 h-4' }: SymbolIconProps) {
    const iconMap: Record<SymbolKind, { icon: React.ReactNode; color: string }> = {
        file: { icon: <FileText className={className} />, color: '#9ca3af' },
        module: { icon: <Puzzle className={className} />, color: '#f59e0b' },
        namespace: { icon: <Layers className={className} />, color: '#8b5cf6' },
        package: { icon: <Puzzle className={className} />, color: '#f59e0b' },
        class: { icon: <Box className={className} />, color: '#f59e0b' },
        method: { icon: <Braces className={className} />, color: '#a855f7' },
        property: { icon: <AtSign className={className} />, color: '#3b82f6' },
        field: { icon: <Variable className={className} />, color: '#3b82f6' },
        constructor: { icon: <Braces className={className} />, color: '#f59e0b' },
        enum: { icon: <Hash className={className} />, color: '#f59e0b' },
        interface: { icon: <Type className={className} />, color: '#22c55e' },
        function: { icon: <Braces className={className} />, color: '#a855f7' },
        variable: { icon: <Variable className={className} />, color: '#3b82f6' },
        constant: { icon: <Hash className={className} />, color: '#3b82f6' },
        string: { icon: <Code className={className} />, color: '#22c55e' },
        number: { icon: <Hash className={className} />, color: '#22c55e' },
        boolean: { icon: <Circle className={className} />, color: '#3b82f6' },
        array: { icon: <Layers className={className} />, color: '#f59e0b' },
        object: { icon: <Box className={className} />, color: '#f59e0b' },
        key: { icon: <AtSign className={className} />, color: '#3b82f6' },
        null: { icon: <Circle className={className} />, color: '#9ca3af' },
        enumMember: { icon: <Circle className={className} />, color: '#3b82f6' },
        struct: { icon: <Box className={className} />, color: '#f59e0b' },
        event: { icon: <Circle className={className} />, color: '#ef4444' },
        operator: { icon: <Code className={className} />, color: '#9ca3af' },
        typeParameter: { icon: <Type className={className} />, color: '#22c55e' },
    }

    const { icon, color } = iconMap[kind] || { icon: <Circle className={className} />, color: '#9ca3af' }
    return <span style={{ color }}>{icon}</span>
}

// ============================================================================
// OUTLINE SYMBOL NODE
// ============================================================================

interface OutlineSymbolNodeProps {
    symbol: OutlineSymbol
    depth: number
    selectedId?: string
    expandedIds: Set<string>
    onSelect: (symbol: OutlineSymbol) => void
    onToggle: (id: string) => void
}

function OutlineSymbolNode({
    symbol,
    depth,
    selectedId,
    expandedIds,
    onSelect,
    onToggle,
}: OutlineSymbolNodeProps) {
    const isExpanded = expandedIds.has(symbol.id)
    const isSelected = selectedId === symbol.id
    const hasChildren = symbol.children && symbol.children.length > 0

    return (
        <div>
            <div
                onClick={() => onSelect(symbol)}
                className={`
                    group flex items-center gap-1 px-2 py-1 cursor-pointer transition-colors
                    ${isSelected ? 'bg-purple-500/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                    ${symbol.deprecated ? 'line-through opacity-60' : ''}
                `}
                style={{ paddingLeft: `${8 + depth * 16}px` }}
            >
                {/* Expand/collapse */}
                {hasChildren ? (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggle(symbol.id)
                        }}
                        className="w-4 flex-shrink-0"
                    >
                        {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                        )}
                    </button>
                ) : (
                    <span className="w-4" />
                )}

                {/* Icon */}
                <SymbolIcon kind={symbol.kind} className="w-4 h-4 flex-shrink-0" />

                {/* Name */}
                <span className="flex-1 text-sm truncate">{symbol.name}</span>

                {/* Detail */}
                {symbol.detail && (
                    <span className="text-xs text-gray-600 truncate">{symbol.detail}</span>
                )}

                {/* Line number */}
                <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    :{symbol.range.startLine}
                </span>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div>
                    {symbol.children!.map(child => (
                        <OutlineSymbolNode
                            key={child.id}
                            symbol={child}
                            depth={depth + 1}
                            selectedId={selectedId}
                            expandedIds={expandedIds}
                            onSelect={onSelect}
                            onToggle={onToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// OUTLINE VIEW
// ============================================================================

interface OutlineViewProps {
    symbols: OutlineSymbol[]
    onSymbolSelect?: (symbol: OutlineSymbol) => void
    className?: string
}

export function OutlineView({
    symbols,
    onSymbolSelect,
    className = '',
}: OutlineViewProps) {
    const [search, setSearch] = useState('')
    const [sortMode, setSortMode] = useState<SortMode>('position')
    const [sortAsc, setSortAsc] = useState(true)
    const [selectedId, setSelectedId] = useState<string>()
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const [kindFilter, setKindFilter] = useState<SymbolKind | 'all'>('all')

    // Toggle expand
    const toggleExpand = useCallback((id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    // Select symbol
    const handleSelect = useCallback((symbol: OutlineSymbol) => {
        setSelectedId(symbol.id)
        onSymbolSelect?.(symbol)
    }, [onSymbolSelect])

    // Expand all
    const expandAll = useCallback(() => {
        const getAllIds = (syms: OutlineSymbol[]): string[] => {
            return syms.flatMap(s => [s.id, ...(s.children ? getAllIds(s.children) : [])])
        }
        setExpandedIds(new Set(getAllIds(symbols)))
    }, [symbols])

    // Collapse all
    const collapseAll = useCallback(() => {
        setExpandedIds(new Set())
    }, [])

    // Filter and sort symbols
    const processedSymbols = useMemo(() => {
        const filterSymbols = (syms: OutlineSymbol[]): OutlineSymbol[] => {
            return syms
                .filter(s => {
                    if (kindFilter !== 'all' && s.kind !== kindFilter) return false
                    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) {
                        // Check children
                        if (s.children) {
                            const filteredChildren = filterSymbols(s.children)
                            if (filteredChildren.length === 0) return false
                        } else {
                            return false
                        }
                    }
                    return true
                })
                .map(s => ({
                    ...s,
                    children: s.children ? filterSymbols(s.children) : undefined,
                }))
        }

        const sortSymbols = (syms: OutlineSymbol[]): OutlineSymbol[] => {
            const sorted = [...syms].sort((a, b) => {
                let cmp = 0
                switch (sortMode) {
                    case 'name':
                        cmp = a.name.localeCompare(b.name)
                        break
                    case 'kind':
                        cmp = a.kind.localeCompare(b.kind)
                        break
                    case 'position':
                    default:
                        cmp = a.range.startLine - b.range.startLine
                }
                return sortAsc ? cmp : -cmp
            })

            return sorted.map(s => ({
                ...s,
                children: s.children ? sortSymbols(s.children) : undefined,
            }))
        }

        return sortSymbols(filterSymbols(symbols))
    }, [symbols, search, sortMode, sortAsc, kindFilter])

    // Unique kinds for filter
    const uniqueKinds = useMemo(() => {
        const kinds = new Set<SymbolKind>()
        const collectKinds = (syms: OutlineSymbol[]) => {
            syms.forEach(s => {
                kinds.add(s.kind)
                if (s.children) collectKinds(s.children)
            })
        }
        collectKinds(symbols)
        return Array.from(kinds)
    }, [symbols])

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <span className="text-xs font-medium text-gray-400 uppercase">Outline</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={expandAll}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="Expand All"
                    >
                        <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                        onClick={collapseAll}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="Collapse All"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Search and filters */}
            <div className="px-2 py-2 border-b border-white/5 space-y-2">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter symbols..."
                        className="w-full pl-7 pr-2 py-1 bg-white/5 border border-white/5 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* Sort */}
                    <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value as SortMode)}
                        className="flex-1 px-2 py-1 bg-white/5 border border-white/5 rounded text-xs text-gray-400 focus:outline-none focus:border-purple-500"
                    >
                        <option value="position">By Position</option>
                        <option value="name">By Name</option>
                        <option value="kind">By Kind</option>
                    </select>

                    <button
                        onClick={() => setSortAsc(!sortAsc)}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title={sortAsc ? 'Ascending' : 'Descending'}
                    >
                        {sortAsc ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                    </button>

                    {/* Kind filter */}
                    <select
                        value={kindFilter}
                        onChange={(e) => setKindFilter(e.target.value as SymbolKind | 'all')}
                        className="flex-1 px-2 py-1 bg-white/5 border border-white/5 rounded text-xs text-gray-400 focus:outline-none focus:border-purple-500"
                    >
                        <option value="all">All Types</option>
                        {uniqueKinds.map(kind => (
                            <option key={kind} value={kind}>{kind}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Symbol tree */}
            <div className="flex-1 overflow-y-auto">
                {processedSymbols.map(symbol => (
                    <OutlineSymbolNode
                        key={symbol.id}
                        symbol={symbol}
                        depth={0}
                        selectedId={selectedId}
                        expandedIds={expandedIds}
                        onSelect={handleSelect}
                        onToggle={toggleExpand}
                    />
                ))}

                {processedSymbols.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Layers className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No symbols found</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// DEMO DATA
// ============================================================================

export const demoOutlineSymbols: OutlineSymbol[] = [
    {
        id: 'app',
        name: 'App',
        kind: 'function',
        range: { startLine: 10, endLine: 50 },
        children: [
            { id: 'state', name: 'state', kind: 'variable', range: { startLine: 12, endLine: 12 } },
            { id: 'effect', name: 'useEffect', kind: 'function', range: { startLine: 15, endLine: 20 } },
            { id: 'handleClick', name: 'handleClick', kind: 'function', range: { startLine: 22, endLine: 28 } },
        ],
    },
    {
        id: 'User',
        name: 'User',
        kind: 'interface',
        detail: 'interface',
        range: { startLine: 55, endLine: 65 },
        children: [
            { id: 'User.id', name: 'id', kind: 'property', detail: 'number', range: { startLine: 56, endLine: 56 } },
            { id: 'User.name', name: 'name', kind: 'property', detail: 'string', range: { startLine: 57, endLine: 57 } },
            { id: 'User.email', name: 'email', kind: 'property', detail: 'string', range: { startLine: 58, endLine: 58 } },
        ],
    },
    {
        id: 'API_URL',
        name: 'API_URL',
        kind: 'constant',
        detail: 'string',
        range: { startLine: 70, endLine: 70 },
    },
    {
        id: 'fetchUser',
        name: 'fetchUser',
        kind: 'function',
        detail: 'async',
        range: { startLine: 75, endLine: 90 },
    },
]
