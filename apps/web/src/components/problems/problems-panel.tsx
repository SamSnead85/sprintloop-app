/**
 * SprintLoop Problems Panel System
 * 
 * Phase 1601-1650: Diagnostics view
 * - Error/warning list
 * - Filter by severity
 * - Group by file
 * - Quick fixes
 * - Navigation
 */

import React, { useState, useMemo } from 'react'
import {
    AlertCircle,
    AlertTriangle,
    Info,
    CheckCircle,
    ChevronRight,
    ChevronDown,
    Filter,
    Search,
    File,
    Lightbulb,
    ExternalLink,
    Copy,
    X
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint'

interface DiagnosticLocation {
    file: string
    line: number
    column: number
    endLine?: number
    endColumn?: number
}

interface DiagnosticFix {
    title: string
    isPreferred?: boolean
}

interface Diagnostic {
    id: string
    severity: DiagnosticSeverity
    message: string
    source?: string
    code?: string | number
    location: DiagnosticLocation
    fixes?: DiagnosticFix[]
    relatedInfo?: {
        message: string
        location: DiagnosticLocation
    }[]
}

type GroupBy = 'file' | 'severity' | 'source'

// ============================================================================
// SEVERITY ICON
// ============================================================================

interface SeverityIconProps {
    severity: DiagnosticSeverity
    className?: string
}

function SeverityIcon({ severity, className = 'w-4 h-4' }: SeverityIconProps) {
    const icons: Record<DiagnosticSeverity, { icon: React.ReactNode; color: string }> = {
        error: { icon: <AlertCircle className={className} />, color: 'text-red-400' },
        warning: { icon: <AlertTriangle className={className} />, color: 'text-yellow-400' },
        info: { icon: <Info className={className} />, color: 'text-blue-400' },
        hint: { icon: <Lightbulb className={className} />, color: 'text-green-400' },
    }

    const { icon, color } = icons[severity]
    return <span className={color}>{icon}</span>
}

// ============================================================================
// DIAGNOSTIC ITEM
// ============================================================================

interface DiagnosticItemProps {
    diagnostic: Diagnostic
    showFile?: boolean
    onNavigate?: (location: DiagnosticLocation) => void
    onApplyFix?: (diagnostic: Diagnostic, fix: DiagnosticFix) => void
}

function DiagnosticItem({
    diagnostic,
    showFile = true,
    onNavigate,
    onApplyFix,
}: DiagnosticItemProps) {
    const [expanded, setExpanded] = useState(false)
    const hasDetails = diagnostic.fixes || diagnostic.relatedInfo

    return (
        <div className="border-b border-white/5 last:border-0">
            <div
                onClick={() => onNavigate?.(diagnostic.location)}
                className="flex items-start gap-2 px-3 py-2 hover:bg-white/5 cursor-pointer"
            >
                <SeverityIcon severity={diagnostic.severity} className="w-4 h-4 mt-0.5 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                        <span className="text-sm text-gray-300 break-words">{diagnostic.message}</span>
                        {diagnostic.code && (
                            <span className="text-xs text-gray-600 flex-shrink-0">
                                [{diagnostic.source || 'ts'}({diagnostic.code})]
                            </span>
                        )}
                    </div>

                    {showFile && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <File className="w-3 h-3" />
                            <span>{diagnostic.location.file}</span>
                            <span>({diagnostic.location.line}, {diagnostic.location.column})</span>
                        </div>
                    )}
                </div>

                {hasDetails && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setExpanded(!expanded)
                        }}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                    >
                        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                )}
            </div>

            {/* Expanded details */}
            {expanded && hasDetails && (
                <div className="px-3 pb-2 ml-6 space-y-2">
                    {/* Quick fixes */}
                    {diagnostic.fixes && diagnostic.fixes.length > 0 && (
                        <div className="space-y-1">
                            <span className="text-xs text-gray-500">Quick Fixes:</span>
                            {diagnostic.fixes.map((fix, i) => (
                                <button
                                    key={i}
                                    onClick={() => onApplyFix?.(diagnostic, fix)}
                                    className={`
                                        flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors
                                        ${fix.isPreferred
                                            ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                        }
                                    `}
                                >
                                    <Lightbulb className="w-3 h-3" />
                                    {fix.title}
                                    {fix.isPreferred && (
                                        <span className="text-[10px] bg-purple-500/30 px-1 rounded">Preferred</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Related info */}
                    {diagnostic.relatedInfo && diagnostic.relatedInfo.length > 0 && (
                        <div className="space-y-1">
                            <span className="text-xs text-gray-500">Related:</span>
                            {diagnostic.relatedInfo.map((info, i) => (
                                <button
                                    key={i}
                                    onClick={() => onNavigate?.(info.location)}
                                    className="flex items-start gap-2 px-2 py-1 rounded text-xs text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
                                >
                                    <ExternalLink className="w-3 h-3 mt-0.5" />
                                    <div>
                                        <div>{info.message}</div>
                                        <div className="text-gray-600">
                                            {info.location.file}:{info.location.line}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// PROBLEMS PANEL
// ============================================================================

interface ProblemsPanelProps {
    diagnostics?: Diagnostic[]
    onNavigate?: (location: DiagnosticLocation) => void
    onApplyFix?: (diagnostic: Diagnostic, fix: DiagnosticFix) => void
    className?: string
}

export function ProblemsPanel({
    diagnostics = [],
    onNavigate,
    onApplyFix,
    className = '',
}: ProblemsPanelProps) {
    const [search, setSearch] = useState('')
    const [severityFilter, setSeverityFilter] = useState<DiagnosticSeverity | 'all'>('all')
    const [groupBy, setGroupBy] = useState<GroupBy>('file')
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

    // Demo data if none provided
    const data = diagnostics.length > 0 ? diagnostics : [
        {
            id: '1',
            severity: 'error' as const,
            message: "Cannot find name 'foo'.",
            source: 'ts',
            code: 2304,
            location: { file: 'src/App.tsx', line: 42, column: 15 },
            fixes: [
                { title: "Add missing import from './utils'", isPreferred: true },
                { title: 'Declare variable foo' },
            ],
        },
        {
            id: '2',
            severity: 'error' as const,
            message: "Property 'bar' does not exist on type 'User'.",
            source: 'ts',
            code: 2339,
            location: { file: 'src/App.tsx', line: 58, column: 10 },
        },
        {
            id: '3',
            severity: 'warning' as const,
            message: "'React' is defined but never used.",
            source: 'ts',
            code: 6133,
            location: { file: 'src/utils/helpers.ts', line: 1, column: 8 },
            fixes: [
                { title: 'Remove unused import', isPreferred: true },
            ],
        },
        {
            id: '4',
            severity: 'warning' as const,
            message: "Unexpected any. Specify a different type.",
            source: 'eslint',
            code: '@typescript-eslint/no-explicit-any',
            location: { file: 'src/types/index.ts', line: 15, column: 20 },
        },
        {
            id: '5',
            severity: 'info' as const,
            message: 'This can be converted to an ES2015 class',
            source: 'ts',
            code: 80002,
            location: { file: 'src/legacy.js', line: 5, column: 1 },
        },
    ]

    // Filter diagnostics
    const filteredDiagnostics = useMemo(() => {
        return data.filter(d => {
            if (severityFilter !== 'all' && d.severity !== severityFilter) return false
            if (search && !d.message.toLowerCase().includes(search.toLowerCase())) return false
            return true
        })
    }, [data, severityFilter, search])

    // Group diagnostics
    const groupedDiagnostics = useMemo(() => {
        const groups: Record<string, Diagnostic[]> = {}

        filteredDiagnostics.forEach(d => {
            let key: string
            switch (groupBy) {
                case 'file':
                    key = d.location.file
                    break
                case 'severity':
                    key = d.severity
                    break
                case 'source':
                    key = d.source || 'unknown'
                    break
            }

            if (!groups[key]) groups[key] = []
            groups[key].push(d)
        })

        return groups
    }, [filteredDiagnostics, groupBy])

    // Toggle group
    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    // Expand all
    const expandAll = () => {
        setExpandedGroups(new Set(Object.keys(groupedDiagnostics)))
    }

    // Count by severity
    const counts = useMemo(() => ({
        error: data.filter(d => d.severity === 'error').length,
        warning: data.filter(d => d.severity === 'warning').length,
        info: data.filter(d => d.severity === 'info').length,
        hint: data.filter(d => d.severity === 'hint').length,
    }), [data])

    // Initialize expanded groups
    if (expandedGroups.size === 0 && Object.keys(groupedDiagnostics).length > 0) {
        expandAll()
    }

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header with counts */}
            <div className="flex items-center gap-4 px-3 py-2 border-b border-white/5">
                <span className="text-xs font-medium text-gray-400 uppercase">Problems</span>
                <div className="flex items-center gap-3 text-xs">
                    {counts.error > 0 && (
                        <span className="flex items-center gap-1 text-red-400">
                            <AlertCircle className="w-3 h-3" /> {counts.error}
                        </span>
                    )}
                    {counts.warning > 0 && (
                        <span className="flex items-center gap-1 text-yellow-400">
                            <AlertTriangle className="w-3 h-3" /> {counts.warning}
                        </span>
                    )}
                    {counts.info > 0 && (
                        <span className="flex items-center gap-1 text-blue-400">
                            <Info className="w-3 h-3" /> {counts.info}
                        </span>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter problems..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>

                <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value as DiagnosticSeverity | 'all')}
                    className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 focus:outline-none focus:border-purple-500"
                >
                    <option value="all">All</option>
                    <option value="error">Errors</option>
                    <option value="warning">Warnings</option>
                    <option value="info">Info</option>
                </select>

                <select
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                    className="px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400 focus:outline-none focus:border-purple-500"
                >
                    <option value="file">Group by File</option>
                    <option value="severity">Group by Severity</option>
                    <option value="source">Group by Source</option>
                </select>
            </div>

            {/* Problems list */}
            <div className="flex-1 overflow-y-auto">
                {Object.entries(groupedDiagnostics).map(([key, items]) => {
                    const isExpanded = expandedGroups.has(key)

                    return (
                        <div key={key} className="border-b border-white/5">
                            {/* Group header */}
                            <button
                                onClick={() => toggleGroup(key)}
                                className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 transition-colors"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}

                                {groupBy === 'file' && <File className="w-4 h-4 text-gray-400" />}
                                {groupBy === 'severity' && <SeverityIcon severity={key as DiagnosticSeverity} />}

                                <span className="flex-1 text-left text-sm text-white truncate">
                                    {key}
                                </span>
                                <span className="text-xs text-gray-500">{items.length}</span>
                            </button>

                            {/* Group items */}
                            {isExpanded && (
                                <div>
                                    {items.map(diagnostic => (
                                        <DiagnosticItem
                                            key={diagnostic.id}
                                            diagnostic={diagnostic}
                                            showFile={groupBy !== 'file'}
                                            onNavigate={onNavigate}
                                            onApplyFix={onApplyFix}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}

                {filteredDiagnostics.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <CheckCircle className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No problems found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
