/**
 * SprintLoop Diff Viewer System
 * 
 * Phase 1401-1450: Advanced diff visualization
 * - Side-by-side diff
 * - Inline diff
 * - Syntax highlighting
 * - Change navigation
 * - Collapse unchanged
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
    ChevronDown,
    ChevronRight,
    Plus,
    Minus,
    Equal,
    ArrowUp,
    ArrowDown,
    Copy,
    Check,
    Eye,
    Columns,
    FileText,
    GitCompare
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type DiffLineType = 'added' | 'removed' | 'unchanged' | 'header'

interface DiffLine {
    type: DiffLineType
    content: string
    oldLineNumber?: number
    newLineNumber?: number
}

interface DiffHunk {
    oldStart: number
    oldCount: number
    newStart: number
    newCount: number
    lines: DiffLine[]
    collapsed?: boolean
}

interface DiffFile {
    oldPath: string
    newPath: string
    hunks: DiffHunk[]
    additions: number
    deletions: number
    isBinary?: boolean
    isNew?: boolean
    isDeleted?: boolean
    isRenamed?: boolean
}

type DiffViewMode = 'split' | 'unified'

// ============================================================================
// DIFF STATS
// ============================================================================

interface DiffStatsProps {
    additions: number
    deletions: number
    className?: string
}

export function DiffStats({ additions, deletions, className = '' }: DiffStatsProps) {
    const total = additions + deletions
    const addPercent = total > 0 ? (additions / total) * 100 : 0

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className="text-green-400 text-sm">+{additions}</span>
            <span className="text-red-400 text-sm">-{deletions}</span>
            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-green-500 to-red-500"
                    style={{
                        background: `linear-gradient(to right, #22c55e ${addPercent}%, #ef4444 ${addPercent}%)`,
                    }}
                />
            </div>
        </div>
    )
}

// ============================================================================
// LINE NUMBER GUTTER
// ============================================================================

interface LineNumberProps {
    oldNumber?: number
    newNumber?: number
    type: DiffLineType
    mode: DiffViewMode
}

function LineNumber({ oldNumber, newNumber, type, mode }: LineNumberProps) {
    if (mode === 'split') {
        return (
            <>
                <span className="w-12 px-2 text-right text-xs text-gray-600 select-none border-r border-white/5">
                    {oldNumber || ''}
                </span>
                <span className="w-12 px-2 text-right text-xs text-gray-600 select-none border-r border-white/5">
                    {newNumber || ''}
                </span>
            </>
        )
    }

    return (
        <>
            <span className="w-10 px-1 text-right text-xs text-gray-600 select-none">
                {type === 'removed' || type === 'unchanged' ? oldNumber : ''}
            </span>
            <span className="w-10 px-1 text-right text-xs text-gray-600 select-none border-r border-white/5">
                {type === 'added' || type === 'unchanged' ? newNumber : ''}
            </span>
        </>
    )
}

// ============================================================================
// DIFF LINE
// ============================================================================

interface DiffLineDisplayProps {
    line: DiffLine
    mode: DiffViewMode
    showLineNumbers?: boolean
}

function DiffLineDisplay({ line, mode, showLineNumbers = true }: DiffLineDisplayProps) {
    const getLineStyles = () => {
        switch (line.type) {
            case 'added':
                return 'bg-green-500/10 border-l-2 border-green-500'
            case 'removed':
                return 'bg-red-500/10 border-l-2 border-red-500'
            case 'header':
                return 'bg-blue-500/10 text-blue-400'
            default:
                return 'bg-transparent border-l-2 border-transparent'
        }
    }

    const getPrefix = () => {
        switch (line.type) {
            case 'added':
                return <Plus className="w-3 h-3 text-green-400" />
            case 'removed':
                return <Minus className="w-3 h-3 text-red-400" />
            default:
                return <span className="w-3" />
        }
    }

    return (
        <div className={`flex items-stretch font-mono text-sm ${getLineStyles()}`}>
            {showLineNumbers && (
                <LineNumber
                    oldNumber={line.oldLineNumber}
                    newNumber={line.newLineNumber}
                    type={line.type}
                    mode={mode}
                />
            )}
            <span className="w-6 flex items-center justify-center flex-shrink-0">
                {getPrefix()}
            </span>
            <pre className="flex-1 px-2 py-0.5 whitespace-pre overflow-x-auto">
                {line.content}
            </pre>
        </div>
    )
}

// ============================================================================
// DIFF HUNK
// ============================================================================

interface DiffHunkDisplayProps {
    hunk: DiffHunk
    index: number
    mode: DiffViewMode
    onToggleCollapse?: (index: number) => void
}

function DiffHunkDisplay({
    hunk,
    index,
    mode,
    onToggleCollapse,
}: DiffHunkDisplayProps) {
    const unchangedCount = hunk.lines.filter(l => l.type === 'unchanged').length

    return (
        <div className="border-b border-white/5">
            {/* Hunk header */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 text-blue-400 text-xs font-mono">
                <button
                    onClick={() => onToggleCollapse?.(index)}
                    className="hover:text-white transition-colors"
                >
                    {hunk.collapsed ? (
                        <ChevronRight className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>
                <span>
                    @@ -{hunk.oldStart},{hunk.oldCount} +{hunk.newStart},{hunk.newCount} @@
                </span>
                {hunk.collapsed && (
                    <span className="text-gray-500">
                        ({unchangedCount} unchanged lines hidden)
                    </span>
                )}
            </div>

            {/* Lines */}
            {!hunk.collapsed && (
                <div>
                    {hunk.lines.map((line, lineIndex) => (
                        <DiffLineDisplay
                            key={lineIndex}
                            line={line}
                            mode={mode}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// DIFF FILE HEADER
// ============================================================================

interface DiffFileHeaderProps {
    file: DiffFile
    isExpanded: boolean
    onToggle: () => void
}

function DiffFileHeader({ file, isExpanded, onToggle }: DiffFileHeaderProps) {
    const [copied, setCopied] = useState(false)

    const handleCopyPath = () => {
        navigator.clipboard.writeText(file.newPath || file.oldPath)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-white/10">
            <button
                onClick={onToggle}
                className="text-gray-400 hover:text-white transition-colors"
            >
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                ) : (
                    <ChevronRight className="w-4 h-4" />
                )}
            </button>

            <GitCompare className="w-4 h-4 text-purple-400" />

            <div className="flex-1 min-w-0">
                {file.isRenamed ? (
                    <span className="text-sm">
                        <span className="text-red-400 line-through">{file.oldPath}</span>
                        <span className="text-gray-500 mx-2">→</span>
                        <span className="text-green-400">{file.newPath}</span>
                    </span>
                ) : (
                    <span className="text-sm text-white truncate">
                        {file.newPath || file.oldPath}
                    </span>
                )}

                {file.isNew && (
                    <span className="ml-2 px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                        NEW
                    </span>
                )}
                {file.isDeleted && (
                    <span className="ml-2 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                        DELETED
                    </span>
                )}
                {file.isBinary && (
                    <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                        BINARY
                    </span>
                )}
            </div>

            <DiffStats additions={file.additions} deletions={file.deletions} />

            <button
                onClick={handleCopyPath}
                className="p-1 text-gray-500 hover:text-white transition-colors"
                title="Copy path"
            >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
            </button>
        </div>
    )
}

// ============================================================================
// DIFF NAVIGATION
// ============================================================================

interface DiffNavigationProps {
    currentChange: number
    totalChanges: number
    onPrevious: () => void
    onNext: () => void
    className?: string
}

export function DiffNavigation({
    currentChange,
    totalChanges,
    onPrevious,
    onNext,
    className = '',
}: DiffNavigationProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <button
                onClick={onPrevious}
                disabled={currentChange <= 1}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous change"
            >
                <ArrowUp className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400">
                {currentChange} / {totalChanges}
            </span>
            <button
                onClick={onNext}
                disabled={currentChange >= totalChanges}
                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next change"
            >
                <ArrowDown className="w-4 h-4" />
            </button>
        </div>
    )
}

// ============================================================================
// DIFF VIEWER
// ============================================================================

interface DiffViewerProps {
    files: DiffFile[]
    mode?: DiffViewMode
    onModeChange?: (mode: DiffViewMode) => void
    className?: string
}

export function DiffViewer({
    files,
    mode = 'unified',
    onModeChange,
    className = '',
}: DiffViewerProps) {
    const [expandedFiles, setExpandedFiles] = useState<Set<string>>(
        new Set(files.map(f => f.newPath || f.oldPath))
    )
    const [collapsedHunks, setCollapsedHunks] = useState<Map<string, Set<number>>>(new Map())

    const toggleFile = (path: string) => {
        setExpandedFiles(prev => {
            const next = new Set(prev)
            if (next.has(path)) next.delete(path)
            else next.add(path)
            return next
        })
    }

    const toggleHunk = (filePath: string, hunkIndex: number) => {
        setCollapsedHunks(prev => {
            const next = new Map(prev)
            const fileHunks = next.get(filePath) || new Set()
            if (fileHunks.has(hunkIndex)) fileHunks.delete(hunkIndex)
            else fileHunks.add(hunkIndex)
            next.set(filePath, fileHunks)
            return next
        })
    }

    const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0)
    const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0)

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">
                        {files.length} file{files.length !== 1 ? 's' : ''} changed
                    </span>
                    <DiffStats additions={totalAdditions} deletions={totalDeletions} />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onModeChange?.('unified')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${mode === 'unified'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <FileText className="w-4 h-4" />
                        Unified
                    </button>
                    <button
                        onClick={() => onModeChange?.('split')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${mode === 'split'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        <Columns className="w-4 h-4" />
                        Split
                    </button>
                </div>
            </div>

            {/* Files */}
            <div className="flex-1 overflow-y-auto">
                {files.map(file => {
                    const filePath = file.newPath || file.oldPath
                    const isExpanded = expandedFiles.has(filePath)
                    const fileCollapsedHunks = collapsedHunks.get(filePath) || new Set()

                    return (
                        <div key={filePath} className="border-b border-white/5">
                            <DiffFileHeader
                                file={file}
                                isExpanded={isExpanded}
                                onToggle={() => toggleFile(filePath)}
                            />

                            {isExpanded && !file.isBinary && (
                                <div>
                                    {file.hunks.map((hunk, index) => (
                                        <DiffHunkDisplay
                                            key={index}
                                            hunk={{ ...hunk, collapsed: fileCollapsedHunks.has(index) }}
                                            index={index}
                                            mode={mode}
                                            onToggleCollapse={(i) => toggleHunk(filePath, i)}
                                        />
                                    ))}
                                </div>
                            )}

                            {isExpanded && file.isBinary && (
                                <div className="px-4 py-8 text-center text-gray-500">
                                    Binary file not shown
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ============================================================================
// DEMO DATA
// ============================================================================

export const demoDiffFiles: DiffFile[] = [
    {
        oldPath: 'src/App.tsx',
        newPath: 'src/App.tsx',
        additions: 15,
        deletions: 5,
        hunks: [
            {
                oldStart: 10,
                oldCount: 10,
                newStart: 10,
                newCount: 15,
                lines: [
                    { type: 'unchanged', content: 'import React from "react"', oldLineNumber: 10, newLineNumber: 10 },
                    { type: 'removed', content: 'import { OldComponent } from "./old"', oldLineNumber: 11 },
                    { type: 'added', content: 'import { NewComponent } from "./new"', newLineNumber: 11 },
                    { type: 'added', content: 'import { AnotherComponent } from "./another"', newLineNumber: 12 },
                    { type: 'unchanged', content: '', oldLineNumber: 12, newLineNumber: 13 },
                    { type: 'unchanged', content: 'function App() {', oldLineNumber: 13, newLineNumber: 14 },
                    { type: 'removed', content: '  return <OldComponent />', oldLineNumber: 14 },
                    { type: 'added', content: '  return (', newLineNumber: 15 },
                    { type: 'added', content: '    <div>', newLineNumber: 16 },
                    { type: 'added', content: '      <NewComponent />', newLineNumber: 17 },
                    { type: 'added', content: '      <AnotherComponent />', newLineNumber: 18 },
                    { type: 'added', content: '    </div>', newLineNumber: 19 },
                    { type: 'added', content: '  )', newLineNumber: 20 },
                    { type: 'unchanged', content: '}', oldLineNumber: 15, newLineNumber: 21 },
                ],
            },
        ],
    },
]
