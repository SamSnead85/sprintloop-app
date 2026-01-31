/**
 * SprintLoop Code Editor Components
 * 
 * Phase 3101-3150: Code Editor
 * - Code block with syntax highlighting
 * - Line numbers
 * - Copy button
 * - Diff view
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
    Copy,
    Check,
    ChevronDown,
    ChevronRight,
    Minus,
    Plus,
    FileCode
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type Language =
    | 'javascript' | 'typescript' | 'python' | 'rust' | 'go'
    | 'java' | 'cpp' | 'c' | 'html' | 'css' | 'json' | 'yaml'
    | 'markdown' | 'bash' | 'sql' | 'plaintext'

interface CodeBlockProps {
    code: string
    language?: Language
    filename?: string
    showLineNumbers?: boolean
    highlightLines?: number[]
    startLine?: number
    maxHeight?: number | string
    copyable?: boolean
    collapsible?: boolean
    defaultCollapsed?: boolean
    className?: string
}

interface DiffViewProps {
    oldCode: string
    newCode: string
    language?: Language
    filename?: string
    showLineNumbers?: boolean
    unified?: boolean
    className?: string
}

// ============================================================================
// SYNTAX HIGHLIGHTING (Simple Token-based)
// ============================================================================

const tokenPatterns: Record<string, { pattern: RegExp; className: string }[]> = {
    javascript: [
        { pattern: /(\/\/.*$)/gm, className: 'text-gray-500' }, // Comments
        { pattern: /(\/\*[\s\S]*?\*\/)/g, className: 'text-gray-500' }, // Multi-line comments
        { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, className: 'text-green-400' }, // Strings
        { pattern: /\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|default|async|await|try|catch|throw|new|this|super|typeof|instanceof|in|of)\b/g, className: 'text-purple-400' }, // Keywords
        { pattern: /\b(true|false|null|undefined|NaN|Infinity)\b/g, className: 'text-orange-400' }, // Literals
        { pattern: /\b(\d+\.?\d*)\b/g, className: 'text-cyan-400' }, // Numbers
        { pattern: /\b([A-Z][a-zA-Z0-9]*)\b/g, className: 'text-yellow-400' }, // Classes
        { pattern: /\b([a-z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, className: 'text-blue-400' }, // Functions
    ],
    typescript: [
        { pattern: /(\/\/.*$)/gm, className: 'text-gray-500' },
        { pattern: /(\/\*[\s\S]*?\*\/)/g, className: 'text-gray-500' },
        { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, className: 'text-green-400' },
        { pattern: /\b(const|let|var|function|return|if|else|for|while|class|extends|import|export|from|default|async|await|try|catch|throw|new|this|super|typeof|instanceof|in|of|type|interface|enum|namespace|readonly|private|public|protected|static|abstract|implements|declare)\b/g, className: 'text-purple-400' },
        { pattern: /\b(true|false|null|undefined|NaN|Infinity|void|never|any|unknown|string|number|boolean|object|symbol|bigint)\b/g, className: 'text-orange-400' },
        { pattern: /\b(\d+\.?\d*)\b/g, className: 'text-cyan-400' },
        { pattern: /\b([A-Z][a-zA-Z0-9]*)\b/g, className: 'text-yellow-400' },
        { pattern: /\b([a-z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, className: 'text-blue-400' },
    ],
    python: [
        { pattern: /(#.*$)/gm, className: 'text-gray-500' },
        { pattern: /("""[\s\S]*?"""|'''[\s\S]*?''')/g, className: 'text-gray-500' },
        { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, className: 'text-green-400' },
        { pattern: /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|lambda|yield|pass|break|continue|and|or|not|in|is|global|nonlocal|async|await)\b/g, className: 'text-purple-400' },
        { pattern: /\b(True|False|None)\b/g, className: 'text-orange-400' },
        { pattern: /\b(\d+\.?\d*)\b/g, className: 'text-cyan-400' },
        { pattern: /\b([A-Z][a-zA-Z0-9]*)\b/g, className: 'text-yellow-400' },
        { pattern: /\b([a-z_][a-zA-Z0-9_]*)\s*(?=\()/g, className: 'text-blue-400' },
        { pattern: /(@\w+)/g, className: 'text-yellow-400' }, // Decorators
    ],
    json: [
        { pattern: /("(?:[^"\\]|\\.)*")\s*:/g, className: 'text-purple-400' }, // Keys
        { pattern: /:\s*("(?:[^"\\]|\\.)*")/g, className: 'text-green-400' }, // String values
        { pattern: /\b(true|false|null)\b/g, className: 'text-orange-400' },
        { pattern: /\b(-?\d+\.?\d*)\b/g, className: 'text-cyan-400' },
    ],
    html: [
        { pattern: /(<!--[\s\S]*?-->)/g, className: 'text-gray-500' },
        { pattern: /(<\/?[\w-]+)/g, className: 'text-purple-400' }, // Tags
        { pattern: /([\w-]+)=/g, className: 'text-yellow-400' }, // Attributes
        { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, className: 'text-green-400' },
    ],
    css: [
        { pattern: /(\/\*[\s\S]*?\*\/)/g, className: 'text-gray-500' },
        { pattern: /([.#][\w-]+)/g, className: 'text-yellow-400' }, // Selectors
        { pattern: /([\w-]+)(?=\s*:)/g, className: 'text-cyan-400' }, // Properties
        { pattern: /:\s*([^;{}]+)/g, className: 'text-green-400' }, // Values
    ],
    bash: [
        { pattern: /(#.*$)/gm, className: 'text-gray-500' },
        { pattern: /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, className: 'text-green-400' },
        { pattern: /\b(if|then|else|elif|fi|for|while|do|done|case|esac|function|return|exit|break|continue|in)\b/g, className: 'text-purple-400' },
        { pattern: /(\$\w+|\$\{[^}]+\})/g, className: 'text-cyan-400' }, // Variables
        { pattern: /^(\w+)(?=\s|$)/gm, className: 'text-blue-400' }, // Commands
    ],
    sql: [
        { pattern: /(--.*$)/gm, className: 'text-gray-500' },
        { pattern: /('(?:[^'\\]|\\.)*')/g, className: 'text-green-400' },
        { pattern: /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|EXISTS|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|DROP|ALTER|ADD|COLUMN|PRIMARY|KEY|FOREIGN|REFERENCES|NULL|DEFAULT|UNIQUE|CHECK|CONSTRAINT|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|AS|DISTINCT|COUNT|SUM|AVG|MIN|MAX|UNION|EXCEPT|INTERSECT)\b/gi, className: 'text-purple-400' },
        { pattern: /\b(\d+\.?\d*)\b/g, className: 'text-cyan-400' },
    ],
    plaintext: [],
}

// Copy patterns for similar languages
tokenPatterns.rust = tokenPatterns.javascript
tokenPatterns.go = tokenPatterns.javascript
tokenPatterns.java = tokenPatterns.javascript
tokenPatterns.cpp = tokenPatterns.javascript
tokenPatterns.c = tokenPatterns.javascript
tokenPatterns.yaml = tokenPatterns.json
tokenPatterns.markdown = []

function highlightCode(code: string, language: Language): string {
    const patterns = tokenPatterns[language] || tokenPatterns.plaintext

    let highlighted = code

    // Escape HTML
    highlighted = highlighted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    // Apply patterns
    for (const { pattern, className } of patterns) {
        highlighted = highlighted.replace(pattern, (match) => {
            return `<span class="${className}">${match}</span>`
        })
    }

    return highlighted
}

// ============================================================================
// CODE BLOCK
// ============================================================================

export function CodeBlock({
    code,
    language = 'plaintext',
    filename,
    showLineNumbers = true,
    highlightLines = [],
    startLine = 1,
    maxHeight,
    copyable = true,
    collapsible = false,
    defaultCollapsed = false,
    className = '',
}: CodeBlockProps) {
    const [copied, setCopied] = useState(false)
    const [collapsed, setCollapsed] = useState(defaultCollapsed)

    const lines = code.split('\n')
    const highlightedCode = highlightCode(code, language)
    const highlightedLines = highlightedCode.split('\n')

    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }, [code])

    if (collapsed) {
        return (
            <div className={`rounded-lg border border-white/10 bg-slate-900 ${className}`}>
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        {collapsible && (
                            <button
                                onClick={() => setCollapsed(false)}
                                className="text-gray-500 hover:text-white"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                        {filename && (
                            <span className="text-sm text-gray-400 flex items-center gap-1.5">
                                <FileCode className="w-4 h-4" />
                                {filename}
                            </span>
                        )}
                        <span className="text-xs text-gray-600">{lines.length} lines</span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={`rounded-lg border border-white/10 bg-slate-900 overflow-hidden ${className}`}>
            {/* Header */}
            {(filename || copyable || collapsible) && (
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        {collapsible && (
                            <button
                                onClick={() => setCollapsed(true)}
                                className="text-gray-500 hover:text-white"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        )}
                        {filename && (
                            <span className="text-sm text-gray-400 flex items-center gap-1.5">
                                <FileCode className="w-4 h-4" />
                                {filename}
                            </span>
                        )}
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-gray-500">
                            {language}
                        </span>
                    </div>
                    {copyable && (
                        <button
                            onClick={handleCopy}
                            className="text-gray-500 hover:text-white transition-colors"
                            title="Copy code"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-400" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            )}

            {/* Code content */}
            <div
                className="overflow-auto font-mono text-sm"
                style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight }}
            >
                <table className="border-collapse">
                    <tbody>
                        {highlightedLines.map((line, index) => {
                            const lineNumber = startLine + index
                            const isHighlighted = highlightLines.includes(lineNumber)

                            return (
                                <tr
                                    key={index}
                                    className={isHighlighted ? 'bg-yellow-500/10' : ''}
                                >
                                    {showLineNumbers && (
                                        <td className="px-3 py-0.5 text-right text-gray-600 select-none border-r border-white/5 min-w-[3rem]">
                                            {lineNumber}
                                        </td>
                                    )}
                                    <td className="px-4 py-0.5 whitespace-pre text-gray-300">
                                        <span dangerouslySetInnerHTML={{ __html: line || ' ' }} />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ============================================================================
// INLINE CODE
// ============================================================================

interface InlineCodeProps {
    children: string
    className?: string
}

export function InlineCode({ children, className = '' }: InlineCodeProps) {
    return (
        <code
            className={`
                px-1.5 py-0.5 rounded bg-white/5 text-purple-400 font-mono text-sm
                ${className}
            `}
        >
            {children}
        </code>
    )
}

// ============================================================================
// DIFF VIEW
// ============================================================================

interface DiffLine {
    type: 'unchanged' | 'added' | 'removed'
    content: string
    oldLineNumber?: number
    newLineNumber?: number
}

function computeDiff(oldCode: string, newCode: string): DiffLine[] {
    const oldLines = oldCode.split('\n')
    const newLines = newCode.split('\n')
    const result: DiffLine[] = []

    // Simple line-by-line diff (for production, use a proper diff library)
    let oldIndex = 0
    let newIndex = 0

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
        if (oldIndex >= oldLines.length) {
            // Remaining new lines are additions
            result.push({
                type: 'added',
                content: newLines[newIndex],
                newLineNumber: newIndex + 1,
            })
            newIndex++
        } else if (newIndex >= newLines.length) {
            // Remaining old lines are removals
            result.push({
                type: 'removed',
                content: oldLines[oldIndex],
                oldLineNumber: oldIndex + 1,
            })
            oldIndex++
        } else if (oldLines[oldIndex] === newLines[newIndex]) {
            // Lines match
            result.push({
                type: 'unchanged',
                content: oldLines[oldIndex],
                oldLineNumber: oldIndex + 1,
                newLineNumber: newIndex + 1,
            })
            oldIndex++
            newIndex++
        } else {
            // Lines differ - check if it's a modification, addition, or removal
            const oldInNew = newLines.indexOf(oldLines[oldIndex], newIndex)
            const newInOld = oldLines.indexOf(newLines[newIndex], oldIndex)

            if (oldInNew === -1 && newInOld === -1) {
                // Both lines are unique - treat as removal then addition
                result.push({
                    type: 'removed',
                    content: oldLines[oldIndex],
                    oldLineNumber: oldIndex + 1,
                })
                result.push({
                    type: 'added',
                    content: newLines[newIndex],
                    newLineNumber: newIndex + 1,
                })
                oldIndex++
                newIndex++
            } else if (oldInNew === -1) {
                // Old line doesn't exist in new - removal
                result.push({
                    type: 'removed',
                    content: oldLines[oldIndex],
                    oldLineNumber: oldIndex + 1,
                })
                oldIndex++
            } else {
                // New line doesn't exist in old - addition
                result.push({
                    type: 'added',
                    content: newLines[newIndex],
                    newLineNumber: newIndex + 1,
                })
                newIndex++
            }
        }
    }

    return result
}

export function DiffView({
    oldCode,
    newCode,
    language = 'plaintext',
    filename,
    showLineNumbers = true,
    unified = true,
    className = '',
}: DiffViewProps) {
    const diffLines = computeDiff(oldCode, newCode)

    const getLineStyle = (type: DiffLine['type']) => {
        switch (type) {
            case 'added':
                return 'bg-green-500/10 text-green-400'
            case 'removed':
                return 'bg-red-500/10 text-red-400'
            default:
                return 'text-gray-300'
        }
    }

    const getLinePrefix = (type: DiffLine['type']) => {
        switch (type) {
            case 'added':
                return <Plus className="w-3 h-3 text-green-400" />
            case 'removed':
                return <Minus className="w-3 h-3 text-red-400" />
            default:
                return <span className="w-3 h-3" />
        }
    }

    return (
        <div className={`rounded-lg border border-white/10 bg-slate-900 overflow-hidden ${className}`}>
            {filename && (
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-slate-800/50">
                    <FileCode className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-400">{filename}</span>
                </div>
            )}

            <div className="overflow-auto font-mono text-sm">
                <table className="border-collapse w-full">
                    <tbody>
                        {diffLines.map((line, index) => (
                            <tr key={index} className={getLineStyle(line.type)}>
                                {showLineNumbers && (
                                    <>
                                        <td className="px-2 py-0.5 text-right text-gray-600 select-none border-r border-white/5 w-12">
                                            {line.oldLineNumber || ''}
                                        </td>
                                        <td className="px-2 py-0.5 text-right text-gray-600 select-none border-r border-white/5 w-12">
                                            {line.newLineNumber || ''}
                                        </td>
                                    </>
                                )}
                                <td className="px-2 py-0.5 w-6">
                                    {getLinePrefix(line.type)}
                                </td>
                                <td className="px-2 py-0.5 whitespace-pre">
                                    {line.content || ' '}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
