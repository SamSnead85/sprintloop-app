/**
 * SprintLoop Premium Editor Components
 * 
 * Advanced editor UI features:
 * - Line numbers with gutters
 * - Minimap navigation
 * - Code folding
 * - Split view
 * - Sticky scroll
 */

import React, { useRef, useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    ChevronDown,
    ChevronRight,
    Minus,
    Plus,
    X,
    Save,
    Columns
} from 'lucide-react'

// ============================================================================
// EDITOR STATE
// ============================================================================

interface EditorSettings {
    fontSize: number
    lineHeight: number
    tabSize: number
    wordWrap: boolean
    minimap: boolean
    lineNumbers: boolean
    folding: boolean
    stickyScroll: boolean
    highlightLine: boolean
    renderWhitespace: 'none' | 'boundary' | 'all'
}

interface EditorState {
    settings: EditorSettings
    activeFile: string | null
    splitView: 'none' | 'horizontal' | 'vertical'
    cursorPosition: { line: number; column: number }
    selection: { startLine: number; startCol: number; endLine: number; endCol: number } | null

    updateSettings: (updates: Partial<EditorSettings>) => void
    setActiveFile: (file: string | null) => void
    setSplitView: (view: EditorState['splitView']) => void
    setCursorPosition: (pos: { line: number; column: number }) => void
    setSelection: (sel: EditorState['selection']) => void
}

export const useEditorState = create<EditorState>()(
    persist(
        (set) => ({
            settings: {
                fontSize: 14,
                lineHeight: 1.6,
                tabSize: 4,
                wordWrap: true,
                minimap: true,
                lineNumbers: true,
                folding: true,
                stickyScroll: true,
                highlightLine: true,
                renderWhitespace: 'boundary',
            },
            activeFile: null,
            splitView: 'none',
            cursorPosition: { line: 1, column: 1 },
            selection: null,

            updateSettings: (updates) => set(state => ({
                settings: { ...state.settings, ...updates }
            })),
            setActiveFile: (file) => set({ activeFile: file }),
            setSplitView: (view) => set({ splitView: view }),
            setCursorPosition: (pos) => set({ cursorPosition: pos }),
            setSelection: (sel) => set({ selection: sel }),
        }),
        { name: 'sprintloop-editor-state' }
    )
)

// ============================================================================
// LINE NUMBERS GUTTER
// ============================================================================

interface LineNumbersProps {
    totalLines: number
    currentLine: number
    startLine?: number
    foldedLines?: Set<number>
    breakpoints?: Set<number>
    onLineClick?: (line: number) => void
    onBreakpointToggle?: (line: number) => void
}

export function LineNumbers({
    totalLines,
    currentLine,
    startLine = 1,
    foldedLines = new Set(),
    breakpoints = new Set(),
    onLineClick,
    onBreakpointToggle,
}: LineNumbersProps) {
    const { settings } = useEditorState()

    if (!settings.lineNumbers) return null

    const visibleLines = useMemo(() => {
        const lines: number[] = []
        for (let i = startLine; i <= startLine + totalLines - 1; i++) {
            if (!foldedLines.has(i)) {
                lines.push(i)
            }
        }
        return lines
    }, [startLine, totalLines, foldedLines])

    return (
        <div
            className="flex-shrink-0 select-none text-right pr-3 pt-px"
            style={{
                fontSize: settings.fontSize,
                lineHeight: settings.lineHeight,
            }}
            aria-hidden="true"
        >
            {visibleLines.map(lineNum => (
                <div
                    key={lineNum}
                    onClick={() => onLineClick?.(lineNum)}
                    className={`
                        relative group cursor-pointer
                        ${lineNum === currentLine ? 'text-white' : 'text-gray-600'}
                        hover:text-gray-400
                    `}
                    style={{ height: `${settings.fontSize * settings.lineHeight}px` }}
                >
                    {/* Breakpoint indicator */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onBreakpointToggle?.(lineNum)
                        }}
                        className={`
                            absolute -left-5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full
                            transition-all
                            ${breakpoints.has(lineNum)
                                ? 'bg-red-500 scale-100'
                                : 'bg-transparent scale-0 group-hover:scale-100 group-hover:bg-gray-600'
                            }
                        `}
                        aria-label={breakpoints.has(lineNum) ? 'Remove breakpoint' : 'Add breakpoint'}
                    />

                    {lineNum}
                </div>
            ))}
        </div>
    )
}

// ============================================================================
// MINIMAP
// ============================================================================

interface MinimapProps {
    code: string
    currentLine: number
    visibleRange: { start: number; end: number }
    highlights?: Array<{ line: number; color: string }>
    onLineClick?: (line: number) => void
}

export function Minimap({
    code,
    currentLine,
    visibleRange,
    highlights = [],
    onLineClick,
}: MinimapProps) {
    const { settings } = useEditorState()
    const containerRef = useRef<HTMLDivElement>(null)

    if (!settings.minimap) return null

    const lines = code.split('\n')
    const lineHeight = 3

    const handleClick = (e: React.MouseEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const y = e.clientY - rect.top
        const line = Math.floor(y / lineHeight) + 1
        onLineClick?.(Math.min(line, lines.length))
    }

    return (
        <div
            ref={containerRef}
            className="flex-shrink-0 w-[80px] bg-slate-900/50 border-l border-white/5 overflow-hidden cursor-pointer"
            onClick={handleClick}
            role="slider"
            aria-label="Code minimap"
            aria-valuemin={1}
            aria-valuemax={lines.length}
            aria-valuenow={currentLine}
        >
            {/* Visible range indicator */}
            <div
                className="absolute right-0 w-[80px] bg-white/5 pointer-events-none"
                style={{
                    top: (visibleRange.start - 1) * lineHeight,
                    height: (visibleRange.end - visibleRange.start + 1) * lineHeight,
                }}
            />

            {/* Mini code lines */}
            {lines.map((line, i) => {
                const highlight = highlights.find(h => h.line === i + 1)
                const isCurrent = i + 1 === currentLine

                return (
                    <div
                        key={i}
                        className={`relative h-[3px] ${isCurrent ? 'bg-purple-500/30' : ''}`}
                    >
                        {highlight && (
                            <div
                                className="absolute left-0 w-1 h-[3px]"
                                style={{ backgroundColor: highlight.color }}
                            />
                        )}
                        <div
                            className="h-[2px] bg-gray-700/50"
                            style={{
                                width: `${Math.min(line.length * 0.8, 70)}px`,
                                marginLeft: `${line.search(/\S/) * 0.8}px`,
                            }}
                        />
                    </div>
                )
            })}
        </div>
    )
}

// ============================================================================
// CODE FOLDING
// ============================================================================

interface FoldingRange {
    startLine: number
    endLine: number
    isCollapsed: boolean
}

interface CodeFoldingProps {
    ranges: FoldingRange[]
    onToggle: (startLine: number) => void
}

export function CodeFolding({ ranges, onToggle }: CodeFoldingProps) {
    const { settings } = useEditorState()

    if (!settings.folding) return null

    return (
        <div
            className="flex-shrink-0 w-4"
            style={{
                fontSize: settings.fontSize,
                lineHeight: settings.lineHeight,
            }}
        >
            {ranges.map(range => (
                <button
                    key={range.startLine}
                    onClick={() => onToggle(range.startLine)}
                    className={`
                        absolute w-4 h-4 flex items-center justify-center
                        text-gray-500 hover:text-white hover:bg-white/10 rounded
                        transition-colors
                    `}
                    style={{
                        top: (range.startLine - 1) * settings.fontSize * settings.lineHeight,
                    }}
                    aria-label={range.isCollapsed ? 'Expand' : 'Collapse'}
                >
                    {range.isCollapsed ? (
                        <ChevronRight className="w-3 h-3" />
                    ) : (
                        <ChevronDown className="w-3 h-3" />
                    )}
                </button>
            ))}
        </div>
    )
}

// ============================================================================
// STICKY SCROLL
// ============================================================================

interface StickyScrollProps {
    scopes: Array<{ line: number; text: string; depth: number }>
    onScopeClick?: (line: number) => void
}

export function StickyScroll({ scopes, onScopeClick }: StickyScrollProps) {
    const { settings } = useEditorState()

    if (!settings.stickyScroll || scopes.length === 0) return null

    return (
        <div className="sticky top-0 z-10 bg-slate-900/95 border-b border-white/5 backdrop-blur">
            {scopes.slice(0, 3).map((scope) => (
                <button
                    key={scope.line}
                    onClick={() => onScopeClick?.(scope.line)}
                    className="block w-full text-left px-4 py-0.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                    style={{
                        paddingLeft: `${16 + scope.depth * 16}px`,
                        fontSize: settings.fontSize * 0.9,
                    }}
                >
                    {scope.text}
                </button>
            ))}
        </div>
    )
}

// ============================================================================
// EDITOR TOOLBAR
// ============================================================================

interface EditorToolbarProps {
    filename: string
    isModified?: boolean
    language?: string
    encoding?: string
    lineEnding?: 'LF' | 'CRLF'
    onSave?: () => void
    onClose?: () => void
    onSplit?: (direction: 'horizontal' | 'vertical') => void
}

export function EditorToolbar({
    filename,
    isModified,
    language = 'TypeScript',
    encoding = 'UTF-8',
    lineEnding = 'LF',
    onSave,
    onClose,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onSplit: _onSplit,
}: EditorToolbarProps) {
    const { cursorPosition, splitView, setSplitView } = useEditorState()

    return (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/50 border-b border-white/5">
            {/* Left section */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-white font-medium">
                        {filename}
                    </span>
                    {isModified && (
                        <span className="w-2 h-2 rounded-full bg-yellow-400" title="Unsaved changes" />
                    )}
                </div>
            </div>

            {/* Right section */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
                {/* Cursor position */}
                <span>
                    Ln {cursorPosition.line}, Col {cursorPosition.column}
                </span>

                {/* Language */}
                <button className="hover:text-white transition-colors">
                    {language}
                </button>

                {/* Encoding */}
                <button className="hover:text-white transition-colors">
                    {encoding}
                </button>

                {/* Line ending */}
                <button className="hover:text-white transition-colors">
                    {lineEnding}
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                    <button
                        onClick={() => setSplitView(splitView === 'none' ? 'vertical' : 'none')}
                        className={`p-1 rounded hover:bg-white/5 transition-colors ${splitView !== 'none' ? 'text-purple-400' : ''
                            }`}
                        title="Split Editor"
                    >
                        <Columns className="w-4 h-4" />
                    </button>

                    {onSave && (
                        <button
                            onClick={onSave}
                            className="p-1 rounded hover:bg-white/5 transition-colors"
                            title="Save (⌘S)"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    )}

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1 rounded hover:bg-white/5 transition-colors"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// ZOOM CONTROLS
// ============================================================================

export function ZoomControls() {
    const { settings, updateSettings } = useEditorState()

    const zoomIn = () => updateSettings({ fontSize: Math.min(settings.fontSize + 1, 32) })
    const zoomOut = () => updateSettings({ fontSize: Math.max(settings.fontSize - 1, 8) })
    const reset = () => updateSettings({ fontSize: 14 })

    return (
        <div className="flex items-center gap-1 bg-slate-900/80 rounded-lg border border-white/10 p-1">
            <button
                onClick={zoomOut}
                className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Zoom Out (⌘-)"
            >
                <Minus className="w-4 h-4" />
            </button>

            <button
                onClick={reset}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                title="Reset Zoom"
            >
                {Math.round(settings.fontSize / 14 * 100)}%
            </button>

            <button
                onClick={zoomIn}
                className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Zoom In (⌘+)"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    )
}

// ============================================================================
// EDITOR SETTINGS PANEL
// ============================================================================

export function EditorSettingsPanel({ onClose }: { onClose: () => void }) {
    const { settings, updateSettings } = useEditorState()

    const settingsConfig = [
        { key: 'wordWrap', label: 'Word Wrap', type: 'toggle' },
        { key: 'minimap', label: 'Minimap', type: 'toggle' },
        { key: 'lineNumbers', label: 'Line Numbers', type: 'toggle' },
        { key: 'folding', label: 'Code Folding', type: 'toggle' },
        { key: 'stickyScroll', label: 'Sticky Scroll', type: 'toggle' },
        { key: 'highlightLine', label: 'Highlight Active Line', type: 'toggle' },
    ] as const

    return (
        <div className="w-72 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="font-semibold text-white">Editor Settings</h3>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Font size slider */}
                <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                        Font Size: {settings.fontSize}px
                    </label>
                    <input
                        type="range"
                        min={8}
                        max={32}
                        value={settings.fontSize}
                        onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                        className="w-full accent-purple-500"
                    />
                </div>

                {/* Tab size */}
                <div>
                    <label className="text-sm text-gray-400 mb-2 block">Tab Size</label>
                    <div className="flex gap-2">
                        {[2, 4, 8].map(size => (
                            <button
                                key={size}
                                onClick={() => updateSettings({ tabSize: size })}
                                className={`
                                    px-3 py-1.5 rounded-lg text-sm transition-colors
                                    ${settings.tabSize === size
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }
                                `}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toggle settings */}
                <div className="space-y-2">
                    {settingsConfig.map(setting => (
                        <label
                            key={setting.key}
                            className="flex items-center justify-between cursor-pointer group"
                        >
                            <span className="text-sm text-gray-300">{setting.label}</span>
                            <button
                                role="switch"
                                aria-checked={settings[setting.key]}
                                onClick={() => updateSettings({
                                    [setting.key]: !settings[setting.key]
                                })}
                                className={`
                                    relative w-10 h-5 rounded-full transition-colors
                                    ${settings[setting.key] ? 'bg-purple-500' : 'bg-white/10'}
                                `}
                            >
                                <span
                                    className={`
                                        absolute top-0.5 w-4 h-4 rounded-full bg-white
                                        transition-transform
                                        ${settings[setting.key] ? 'left-5' : 'left-0.5'}
                                    `}
                                />
                            </button>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// DIFF VIEW
// ============================================================================

interface DiffLine {
    type: 'added' | 'removed' | 'unchanged' | 'modified'
    oldLineNum?: number
    newLineNum?: number
    content: string
}

interface DiffViewProps {
    lines: DiffLine[]
    mode?: 'unified' | 'split'
}

export function DiffView({ lines, mode: _mode = 'unified' }: DiffViewProps) {
    const { settings } = useEditorState()

    const getLineStyle = (type: DiffLine['type']) => {
        switch (type) {
            case 'added':
                return 'bg-green-500/20 border-l-2 border-green-500'
            case 'removed':
                return 'bg-red-500/20 border-l-2 border-red-500'
            case 'modified':
                return 'bg-yellow-500/20 border-l-2 border-yellow-500'
            default:
                return ''
        }
    }

    const getLinePrefix = (type: DiffLine['type']) => {
        switch (type) {
            case 'added': return '+'
            case 'removed': return '-'
            default: return ' '
        }
    }

    return (
        <div
            className="font-mono overflow-auto"
            style={{
                fontSize: settings.fontSize,
                lineHeight: settings.lineHeight,
            }}
        >
            {lines.map((line, i) => (
                <div
                    key={i}
                    className={`flex ${getLineStyle(line.type)}`}
                >
                    {/* Line numbers */}
                    <div className="flex-shrink-0 w-20 flex text-gray-600 text-right pr-2">
                        <span className="w-10">{line.oldLineNum || ''}</span>
                        <span className="w-10">{line.newLineNum || ''}</span>
                    </div>

                    {/* Prefix */}
                    <span className={`flex-shrink-0 w-4 ${line.type === 'added' ? 'text-green-400' :
                        line.type === 'removed' ? 'text-red-400' :
                            'text-gray-600'
                        }`}>
                        {getLinePrefix(line.type)}
                    </span>

                    {/* Content */}
                    <span className={`flex-1 ${line.type === 'added' ? 'text-green-300' :
                        line.type === 'removed' ? 'text-red-300' :
                            'text-gray-300'
                        }`}>
                        {line.content}
                    </span>
                </div>
            ))}
        </div>
    )
}
