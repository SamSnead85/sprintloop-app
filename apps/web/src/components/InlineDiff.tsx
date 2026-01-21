/**
 * InlineDiff Component
 * Shows before/after code changes with accept/reject controls
 * Inspired by Cursor's inline diff preview
 */
import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'

interface DiffLine {
    type: 'unchanged' | 'added' | 'removed'
    content: string
    lineNumber: number
}

interface InlineDiffProps {
    originalCode: string
    modifiedCode: string
    filename: string
    onAccept: () => void
    onReject: () => void
    onPartialAccept?: (acceptedLines: number[]) => void
}

function parseDiff(original: string, modified: string): DiffLine[] {
    const originalLines = original.split('\n')
    const modifiedLines = modified.split('\n')
    const result: DiffLine[] = []

    let lineNum = 1
    const maxLen = Math.max(originalLines.length, modifiedLines.length)

    for (let i = 0; i < maxLen; i++) {
        const origLine = originalLines[i]
        const modLine = modifiedLines[i]

        if (origLine === modLine) {
            result.push({ type: 'unchanged', content: origLine || '', lineNumber: lineNum++ })
        } else {
            if (origLine !== undefined) {
                result.push({ type: 'removed', content: origLine, lineNumber: lineNum })
            }
            if (modLine !== undefined) {
                result.push({ type: 'added', content: modLine, lineNumber: lineNum++ })
            } else {
                lineNum++
            }
        }
    }

    return result
}

export function InlineDiff({
    originalCode,
    modifiedCode,
    filename,
    onAccept,
    onReject,
    onPartialAccept
}: InlineDiffProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [selectedLines, setSelectedLines] = useState<Set<number>>(new Set())

    const diffLines = parseDiff(originalCode, modifiedCode)
    const hasChanges = diffLines.some(l => l.type !== 'unchanged')
    const addedCount = diffLines.filter(l => l.type === 'added').length
    const removedCount = diffLines.filter(l => l.type === 'removed').length

    const toggleLine = (lineNum: number) => {
        const newSelected = new Set(selectedLines)
        if (newSelected.has(lineNum)) {
            newSelected.delete(lineNum)
        } else {
            newSelected.add(lineNum)
        }
        setSelectedLines(newSelected)
    }

    if (!hasChanges) {
        return null
    }

    return (
        <div className="border border-white/10 rounded-lg overflow-hidden bg-slate-900/50 my-2">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <span className="text-sm font-medium text-gray-300">{filename}</span>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-green-400">+{addedCount}</span>
                        <span className="text-red-400">-{removedCount}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onPartialAccept && selectedLines.size > 0 && (
                        <button
                            onClick={() => onPartialAccept(Array.from(selectedLines))}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                        >
                            Accept Selected ({selectedLines.size})
                        </button>
                    )}
                    <button
                        onClick={onReject}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                        <X className="w-3.5 h-3.5" />
                        Reject
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                    >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                    </button>
                </div>
            </div>

            {/* Diff Content */}
            {!isCollapsed && (
                <div className="font-mono text-xs overflow-x-auto max-h-80 overflow-y-auto">
                    {diffLines.map((line, idx) => (
                        <div
                            key={idx}
                            onClick={() => line.type !== 'unchanged' && toggleLine(line.lineNumber)}
                            className={`flex items-stretch ${line.type === 'added'
                                ? 'bg-green-500/10 hover:bg-green-500/20'
                                : line.type === 'removed'
                                    ? 'bg-red-500/10 hover:bg-red-500/20'
                                    : 'hover:bg-white/5'
                                } ${line.type !== 'unchanged' ? 'cursor-pointer' : ''} ${selectedLines.has(line.lineNumber) ? 'ring-1 ring-inset ring-blue-400' : ''
                                }`}
                        >
                            {/* Line number */}
                            <div className="w-12 flex-shrink-0 text-right pr-3 py-0.5 text-gray-500 bg-slate-900/50 select-none">
                                {line.lineNumber}
                            </div>

                            {/* Change indicator */}
                            <div className={`w-5 flex-shrink-0 text-center py-0.5 select-none ${line.type === 'added' ? 'text-green-400' : line.type === 'removed' ? 'text-red-400' : 'text-gray-600'
                                }`}>
                                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                            </div>

                            {/* Code content */}
                            <div className={`flex-1 py-0.5 pr-4 whitespace-pre ${line.type === 'added' ? 'text-green-300' : line.type === 'removed' ? 'text-red-300' : 'text-gray-400'
                                }`}>
                                {line.content || ' '}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

/**
 * Compact inline suggestion (for ghost text / autocomplete)
 */
export function InlineSuggestion({
    suggestion,
    onAccept: _onAccept,
    onReject: _onReject
}: {
    suggestion: string
    onAccept: () => void
    onReject: () => void
}) {
    return (
        <span className="relative">
            <span className="text-gray-500 italic">{suggestion}</span>
            <span className="ml-2 text-xs text-gray-600">
                Tab to accept · Esc to dismiss
            </span>
        </span>
    )
}
