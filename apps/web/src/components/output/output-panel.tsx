/**
 * SprintLoop Output Panel System
 * 
 * Phase 1451-1500: Output and logging
 * - Output channels
 * - Log levels
 * - Search/filter
 * - Clear and export
 * - Timestamps
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
    Terminal,
    AlertCircle,
    AlertTriangle,
    Info,
    CheckCircle,
    Bug,
    Search,
    Filter,
    Trash2,
    Download,
    Copy,
    Check,
    ChevronDown,
    Pause,
    Play,
    ArrowDown
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success'

interface OutputLine {
    id: string
    timestamp: Date
    level: LogLevel
    channel: string
    message: string
    source?: string
    details?: string
}

interface OutputChannel {
    id: string
    name: string
    icon?: React.ReactNode
}

// ============================================================================
// LOG LEVEL ICON
// ============================================================================

function LogLevelIcon({ level, className = '' }: { level: LogLevel; className?: string }) {
    const icons: Record<LogLevel, { icon: React.ReactNode; color: string }> = {
        debug: { icon: <Bug className={className} />, color: 'text-gray-400' },
        info: { icon: <Info className={className} />, color: 'text-blue-400' },
        warn: { icon: <AlertTriangle className={className} />, color: 'text-yellow-400' },
        error: { icon: <AlertCircle className={className} />, color: 'text-red-400' },
        success: { icon: <CheckCircle className={className} />, color: 'text-green-400' },
    }

    const { icon, color } = icons[level]
    return <span className={color}>{icon}</span>
}

// ============================================================================
// OUTPUT LINE DISPLAY
// ============================================================================

interface OutputLineDisplayProps {
    line: OutputLine
    showTimestamp?: boolean
    showChannel?: boolean
}

function OutputLineDisplay({
    line,
    showTimestamp = true,
    showChannel = true,
}: OutputLineDisplayProps) {
    const [expanded, setExpanded] = useState(false)

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3,
        })
    }

    const getLevelStyles = () => {
        switch (line.level) {
            case 'error':
                return 'bg-red-500/5 border-l-2 border-red-500'
            case 'warn':
                return 'bg-yellow-500/5 border-l-2 border-yellow-500'
            case 'success':
                return 'bg-green-500/5 border-l-2 border-green-500'
            default:
                return 'border-l-2 border-transparent'
        }
    }

    return (
        <div className={`group ${getLevelStyles()}`}>
            <div
                className="flex items-start gap-2 px-3 py-1 hover:bg-white/5 cursor-pointer"
                onClick={() => line.details && setExpanded(!expanded)}
            >
                {/* Timestamp */}
                {showTimestamp && (
                    <span className="text-xs text-gray-600 font-mono flex-shrink-0">
                        {formatTime(line.timestamp)}
                    </span>
                )}

                {/* Level icon */}
                <LogLevelIcon level={line.level} className="w-4 h-4 flex-shrink-0 mt-0.5" />

                {/* Channel */}
                {showChannel && (
                    <span className="text-xs text-purple-400 flex-shrink-0">
                        [{line.channel}]
                    </span>
                )}

                {/* Message */}
                <span className="flex-1 text-sm text-gray-300 font-mono break-all">
                    {line.message}
                </span>

                {/* Source */}
                {line.source && (
                    <span className="text-xs text-gray-600 flex-shrink-0">
                        {line.source}
                    </span>
                )}

                {/* Expand indicator */}
                {line.details && (
                    <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                )}
            </div>

            {/* Details */}
            {expanded && line.details && (
                <pre className="px-3 py-2 ml-6 bg-black/20 text-xs text-gray-400 font-mono overflow-x-auto">
                    {line.details}
                </pre>
            )}
        </div>
    )
}

// ============================================================================
// OUTPUT PANEL
// ============================================================================

interface OutputPanelProps {
    lines?: OutputLine[]
    channels?: OutputChannel[]
    className?: string
}

export function OutputPanel({
    lines: initialLines = [],
    channels = [
        { id: 'output', name: 'Output', icon: <Terminal className="w-4 h-4" /> },
        { id: 'debug', name: 'Debug Console', icon: <Bug className="w-4 h-4" /> },
        { id: 'problems', name: 'Problems', icon: <AlertCircle className="w-4 h-4" /> },
    ],
    className = '',
}: OutputPanelProps) {
    const [lines, setLines] = useState<OutputLine[]>(initialLines.length > 0 ? initialLines : [
        { id: '1', timestamp: new Date(), level: 'info', channel: 'output', message: 'Build started...' },
        { id: '2', timestamp: new Date(), level: 'info', channel: 'output', message: 'Compiling TypeScript files...' },
        { id: '3', timestamp: new Date(), level: 'success', channel: 'output', message: 'Build completed in 2.3s' },
        { id: '4', timestamp: new Date(), level: 'warn', channel: 'output', message: 'Warning: Unused import in App.tsx', source: 'src/App.tsx:5' },
        { id: '5', timestamp: new Date(), level: 'error', channel: 'problems', message: 'Type error: Property does not exist', source: 'src/utils.ts:42', details: "Property 'foo' does not exist on type 'Bar'.\n\n42 |   const x = bar.foo;\n   |                 ~~~" },
        { id: '6', timestamp: new Date(), level: 'debug', channel: 'debug', message: 'Component mounted: App' },
        { id: '7', timestamp: new Date(), level: 'debug', channel: 'debug', message: 'State updated: { count: 1 }' },
    ])

    const [activeChannel, setActiveChannel] = useState(channels[0]?.id || 'output')
    const [filter, setFilter] = useState('')
    const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all')
    const [isPaused, setIsPaused] = useState(false)
    const [autoScroll, setAutoScroll] = useState(true)
    const [copied, setCopied] = useState(false)

    const outputRef = useRef<HTMLDivElement>(null)

    // Filter lines
    const filteredLines = useMemo(() => {
        return lines.filter(line => {
            if (line.channel !== activeChannel) return false
            if (levelFilter !== 'all' && line.level !== levelFilter) return false
            if (filter && !line.message.toLowerCase().includes(filter.toLowerCase())) return false
            return true
        })
    }, [lines, activeChannel, levelFilter, filter])

    // Auto-scroll
    useEffect(() => {
        if (autoScroll && outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
    }, [filteredLines, autoScroll])

    // Clear output
    const handleClear = () => {
        setLines(prev => prev.filter(l => l.channel !== activeChannel))
    }

    // Copy all
    const handleCopy = () => {
        const text = filteredLines.map(l => `[${l.level.toUpperCase()}] ${l.message}`).join('\n')
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Export
    const handleExport = () => {
        const text = filteredLines.map(l =>
            `[${l.timestamp.toISOString()}] [${l.level.toUpperCase()}] ${l.message}`
        ).join('\n')
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${activeChannel}-output.log`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Count by level
    const levelCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        lines.filter(l => l.channel === activeChannel).forEach(l => {
            counts[l.level] = (counts[l.level] || 0) + 1
        })
        return counts
    }, [lines, activeChannel])

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Channel tabs */}
            <div className="flex items-center gap-1 px-2 py-1 border-b border-white/5">
                {channels.map(channel => (
                    <button
                        key={channel.id}
                        onClick={() => setActiveChannel(channel.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${activeChannel === channel.id
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {channel.icon}
                        {channel.name}
                        {lines.filter(l => l.channel === channel.id && l.level === 'error').length > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                                {lines.filter(l => l.channel === channel.id && l.level === 'error').length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Filter output..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>

                {/* Level filter */}
                <select
                    value={levelFilter}
                    onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'all')}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="all">All Levels</option>
                    <option value="debug">Debug ({levelCounts.debug || 0})</option>
                    <option value="info">Info ({levelCounts.info || 0})</option>
                    <option value="warn">Warning ({levelCounts.warn || 0})</option>
                    <option value="error">Error ({levelCounts.error || 0})</option>
                    <option value="success">Success ({levelCounts.success || 0})</option>
                </select>

                <div className="w-px h-4 bg-white/10" />

                {/* Actions */}
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`p-1.5 rounded transition-colors ${isPaused ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}
                    title={isPaused ? 'Resume' : 'Pause'}
                >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                </button>

                <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`p-1.5 rounded transition-colors ${autoScroll ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                    title={autoScroll ? 'Auto-scroll on' : 'Auto-scroll off'}
                >
                    <ArrowDown className="w-4 h-4" />
                </button>

                <button
                    onClick={handleCopy}
                    className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
                    title="Copy all"
                >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                    onClick={handleExport}
                    className="p-1.5 text-gray-400 hover:text-white rounded transition-colors"
                    title="Export"
                >
                    <Download className="w-4 h-4" />
                </button>

                <button
                    onClick={handleClear}
                    className="p-1.5 text-gray-400 hover:text-red-400 rounded transition-colors"
                    title="Clear"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Output lines */}
            <div ref={outputRef} className="flex-1 overflow-y-auto">
                {filteredLines.map(line => (
                    <OutputLineDisplay key={line.id} line={line} />
                ))}

                {filteredLines.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Terminal className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No output</p>
                    </div>
                )}
            </div>

            {/* Status bar */}
            <div className="flex items-center justify-between px-3 py-1 border-t border-white/5 text-xs text-gray-600">
                <span>{filteredLines.length} lines</span>
                {isPaused && <span className="text-yellow-400">Paused</span>}
            </div>
        </div>
    )
}
