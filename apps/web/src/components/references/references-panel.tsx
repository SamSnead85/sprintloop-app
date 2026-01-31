/**
 * SprintLoop References Panel System
 * 
 * Phase 1651-1700: Find references
 * - Reference list
 * - Peek preview
 * - Group by file
 * - Navigation
 * - Context preview
 */

import React, { useState, useMemo } from 'react'
import {
    ChevronRight,
    ChevronDown,
    File,
    Search,
    X,
    ArrowUp,
    ArrowDown,
    Eye,
    Copy,
    Check,
    MapPin,
    Layers
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface Reference {
    id: string
    file: string
    line: number
    column: number
    endColumn?: number
    preview: string
    isDefinition?: boolean
    isWrite?: boolean
}

interface ReferenceGroup {
    file: string
    references: Reference[]
}

// ============================================================================
// REFERENCE ITEM
// ============================================================================

interface ReferenceItemProps {
    reference: Reference
    isSelected?: boolean
    onSelect: (reference: Reference) => void
    showFile?: boolean
}

function ReferenceItem({
    reference,
    isSelected,
    onSelect,
    showFile = false,
}: ReferenceItemProps) {
    // Highlight the match in preview
    const highlightedPreview = useMemo(() => {
        const { preview, column, endColumn } = reference
        if (!endColumn || column <= 0) return preview

        const start = column - 1
        const end = endColumn - 1

        return (
            <span className="font-mono text-sm">
                <span className="text-gray-500">{preview.slice(0, start)}</span>
                <span className="text-yellow-400 bg-yellow-500/20 rounded px-0.5">
                    {preview.slice(start, end)}
                </span>
                <span className="text-gray-500">{preview.slice(end)}</span>
            </span>
        )
    }, [reference])

    return (
        <button
            onClick={() => onSelect(reference)}
            className={`
                w-full flex items-start gap-2 px-3 py-2 text-left transition-colors
                ${isSelected ? 'bg-purple-500/20' : 'hover:bg-white/5'}
            `}
        >
            {/* Line number */}
            <span className="text-xs text-gray-600 font-mono w-8 text-right flex-shrink-0">
                {reference.line}
            </span>

            {/* Badges */}
            <div className="flex items-center gap-1 flex-shrink-0">
                {reference.isDefinition && (
                    <span className="px-1 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded">
                        DEF
                    </span>
                )}
                {reference.isWrite && (
                    <span className="px-1 py-0.5 bg-yellow-500/20 text-yellow-400 text-[10px] rounded">
                        WRITE
                    </span>
                )}
            </div>

            {/* Preview */}
            <div className="flex-1 min-w-0 overflow-hidden">
                <div className="truncate">{highlightedPreview}</div>
                {showFile && (
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-600">
                        <File className="w-3 h-3" />
                        <span className="truncate">{reference.file}</span>
                    </div>
                )}
            </div>
        </button>
    )
}

// ============================================================================
// REFERENCE GROUP
// ============================================================================

interface ReferenceGroupDisplayProps {
    group: ReferenceGroup
    selectedId?: string
    isExpanded: boolean
    onToggle: () => void
    onSelect: (reference: Reference) => void
}

function ReferenceGroupDisplay({
    group,
    selectedId,
    isExpanded,
    onToggle,
    onSelect,
}: ReferenceGroupDisplayProps) {
    const definitionCount = group.references.filter(r => r.isDefinition).length
    const writeCount = group.references.filter(r => r.isWrite).length

    return (
        <div className="border-b border-white/5">
            {/* File header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                )}

                <File className="w-4 h-4 text-gray-400" />

                <span className="flex-1 text-left text-sm text-white truncate">
                    {group.file.split('/').pop()}
                </span>

                <span className="text-xs text-gray-600 truncate max-w-32">
                    {group.file}
                </span>

                <span className="text-xs text-gray-500">{group.references.length}</span>
            </button>

            {/* References */}
            {isExpanded && (
                <div>
                    {group.references.map(reference => (
                        <ReferenceItem
                            key={reference.id}
                            reference={reference}
                            isSelected={selectedId === reference.id}
                            onSelect={onSelect}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// PEEK PREVIEW
// ============================================================================

interface PeekPreviewProps {
    reference: Reference
    contextLines?: string[]
    onClose: () => void
    onNavigate: () => void
    className?: string
}

export function PeekPreview({
    reference,
    contextLines = [],
    onClose,
    onNavigate,
    className = '',
}: PeekPreviewProps) {
    return (
        <div className={`bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-700/50 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <File className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-white">{reference.file}</span>
                    <span className="text-xs text-gray-500">:{reference.line}</span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={onNavigate}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                        title="Go to file"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Code preview */}
            <div className="max-h-48 overflow-y-auto font-mono text-sm">
                {contextLines.length > 0 ? (
                    contextLines.map((line, i) => {
                        const lineNum = reference.line - Math.floor(contextLines.length / 2) + i
                        const isCurrent = lineNum === reference.line

                        return (
                            <div
                                key={i}
                                className={`flex ${isCurrent ? 'bg-yellow-500/10' : ''}`}
                            >
                                <span className="w-10 px-2 text-right text-xs text-gray-600 border-r border-white/5">
                                    {lineNum}
                                </span>
                                <pre className="flex-1 px-2 py-0.5 text-gray-400 whitespace-pre overflow-x-auto">
                                    {line}
                                </pre>
                            </div>
                        )
                    })
                ) : (
                    <div className="flex">
                        <span className="w-10 px-2 text-right text-xs text-gray-600 border-r border-white/5">
                            {reference.line}
                        </span>
                        <pre className="flex-1 px-2 py-0.5 text-gray-400 whitespace-pre">
                            {reference.preview}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// REFERENCES PANEL
// ============================================================================

interface ReferencesPanelProps {
    symbolName?: string
    references?: Reference[]
    onNavigate?: (reference: Reference) => void
    onClose?: () => void
    className?: string
}

export function ReferencesPanel({
    symbolName = 'handleClick',
    references: propReferences,
    onNavigate,
    onClose,
    className = '',
}: ReferencesPanelProps) {
    // Demo data
    const defaultReferences: Reference[] = [
        { id: 'r1', file: 'src/App.tsx', line: 15, column: 10, endColumn: 21, preview: '  const handleClick = () => {', isDefinition: true },
        { id: 'r2', file: 'src/App.tsx', line: 42, column: 18, endColumn: 29, preview: '  <Button onClick={handleClick}>' },
        { id: 'r3', file: 'src/App.tsx', line: 58, column: 12, endColumn: 23, preview: '    handleClick()', isWrite: false },
        { id: 'r4', file: 'src/components/Form.tsx', line: 28, column: 22, endColumn: 33, preview: '  const onSubmit = handleClick' },
        { id: 'r5', file: 'src/components/Form.tsx', line: 45, column: 8, endColumn: 19, preview: '  handleClick.bind(this)' },
        { id: 'r6', file: 'src/utils/helpers.ts', line: 12, column: 14, endColumn: 25, preview: 'export { handleClick } from "./App"' },
    ]

    const references = propReferences || defaultReferences

    const [search, setSearch] = useState('')
    const [selectedId, setSelectedId] = useState<string>()
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set())
    const [currentIndex, setCurrentIndex] = useState(0)
    const [copied, setCopied] = useState(false)

    // Group by file
    const groupedReferences = useMemo(() => {
        const groups: Record<string, Reference[]> = {}

        references.forEach(ref => {
            if (search && !ref.preview.toLowerCase().includes(search.toLowerCase())) {
                return
            }
            if (!groups[ref.file]) groups[ref.file] = []
            groups[ref.file].push(ref)
        })

        return Object.entries(groups).map(([file, refs]) => ({
            file,
            references: refs.sort((a, b) => a.line - b.line),
        } as ReferenceGroup))
    }, [references, search])

    // Flatten for navigation
    const flatReferences = useMemo(() => {
        return groupedReferences.flatMap(g => g.references)
    }, [groupedReferences])

    // Initialize expanded
    if (expandedFiles.size === 0 && groupedReferences.length > 0) {
        setExpandedFiles(new Set(groupedReferences.map(g => g.file)))
    }

    const toggleFile = (file: string) => {
        setExpandedFiles(prev => {
            const next = new Set(prev)
            if (next.has(file)) next.delete(file)
            else next.add(file)
            return next
        })
    }

    const handleSelect = (reference: Reference) => {
        setSelectedId(reference.id)
        setCurrentIndex(flatReferences.findIndex(r => r.id === reference.id))
        onNavigate?.(reference)
    }

    const handlePrev = () => {
        const newIndex = Math.max(0, currentIndex - 1)
        setCurrentIndex(newIndex)
        const ref = flatReferences[newIndex]
        if (ref) handleSelect(ref)
    }

    const handleNext = () => {
        const newIndex = Math.min(flatReferences.length - 1, currentIndex + 1)
        setCurrentIndex(newIndex)
        const ref = flatReferences[newIndex]
        if (ref) handleSelect(ref)
    }

    const handleCopy = () => {
        const text = references.map(r => `${r.file}:${r.line}`).join('\n')
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                <MapPin className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white font-medium">{symbolName}</span>
                <span className="text-xs text-gray-500">
                    {flatReferences.length} reference{flatReferences.length !== 1 ? 's' : ''}
                </span>

                <div className="flex-1" />

                {/* Navigation */}
                <button
                    onClick={handlePrev}
                    disabled={currentIndex <= 0}
                    className="p-1 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500">
                    {currentIndex + 1}/{flatReferences.length}
                </span>
                <button
                    onClick={handleNext}
                    disabled={currentIndex >= flatReferences.length - 1}
                    className="p-1 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                    <ArrowDown className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-white/10" />

                <button
                    onClick={handleCopy}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                    title="Copy all references"
                >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>

                {onClose && (
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="px-2 py-2 border-b border-white/5">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Filter references..."
                        className="w-full pl-7 pr-2 py-1 bg-white/5 border border-white/5 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            {/* References list */}
            <div className="flex-1 overflow-y-auto">
                {groupedReferences.map(group => (
                    <ReferenceGroupDisplay
                        key={group.file}
                        group={group}
                        selectedId={selectedId}
                        isExpanded={expandedFiles.has(group.file)}
                        onToggle={() => toggleFile(group.file)}
                        onSelect={handleSelect}
                    />
                ))}

                {groupedReferences.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Layers className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No references found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
