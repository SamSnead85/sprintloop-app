/**
 * SprintLoop DevTools System
 * 
 * Phase 901-950: Advanced developer tools
 * - Performance profiler
 * - Network inspector
 * - Component inspector
 * - Console with filtering
 * - State debugger
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
    Activity,
    Network,
    Box,
    Terminal,
    Database,
    Clock,
    AlertTriangle,
    AlertCircle,
    Info,
    ChevronDown,
    ChevronRight,
    Search,
    Trash2,
    Download,
    Pause,
    Play,
    Filter,
    Layers,
    Cpu,
    Zap
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
    id: string
    level: LogLevel
    message: string
    timestamp: Date
    source?: string
    stack?: string
    data?: unknown
}

interface NetworkRequest {
    id: string
    method: string
    url: string
    status: number
    statusText: string
    duration: number
    size: number
    timestamp: Date
    requestHeaders?: Record<string, string>
    responseHeaders?: Record<string, string>
    requestBody?: unknown
    responseBody?: unknown
}

interface PerformanceMetric {
    name: string
    value: number
    unit: string
    timestamp: Date
}

interface ComponentInfo {
    name: string
    renderCount: number
    lastRenderTime: number
    props: Record<string, unknown>
    state: Record<string, unknown>
}

// ============================================================================
// DEVTOOLS CONTEXT
// ============================================================================

interface DevToolsContextValue {
    logs: LogEntry[]
    networkRequests: NetworkRequest[]
    performanceMetrics: PerformanceMetric[]
    addLog: (level: LogLevel, message: string, data?: unknown) => void
    addNetworkRequest: (request: NetworkRequest) => void
    addPerformanceMetric: (metric: PerformanceMetric) => void
    clearLogs: () => void
    clearNetwork: () => void
    isRecording: boolean
    toggleRecording: () => void
}

const DevToolsContext = createContext<DevToolsContextValue | null>(null)

export function useDevTools() {
    const context = useContext(DevToolsContext)
    if (!context) throw new Error('useDevTools must be used within DevToolsProvider')
    return context
}

// ============================================================================
// DEVTOOLS PROVIDER
// ============================================================================

interface DevToolsProviderProps {
    children: React.ReactNode
    maxLogs?: number
    maxRequests?: number
}

export function DevToolsProvider({
    children,
    maxLogs = 500,
    maxRequests = 200,
}: DevToolsProviderProps) {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [networkRequests, setNetworkRequests] = useState<NetworkRequest[]>([])
    const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([])
    const [isRecording, setIsRecording] = useState(true)

    const addLog = useCallback((level: LogLevel, message: string, data?: unknown) => {
        if (!isRecording) return

        const entry: LogEntry = {
            id: `log-${Date.now()}-${Math.random()}`,
            level,
            message,
            timestamp: new Date(),
            data,
        }

        setLogs(prev => [entry, ...prev].slice(0, maxLogs))
    }, [isRecording, maxLogs])

    const addNetworkRequest = useCallback((request: NetworkRequest) => {
        if (!isRecording) return

        setNetworkRequests(prev => [request, ...prev].slice(0, maxRequests))
    }, [isRecording, maxRequests])

    const addPerformanceMetric = useCallback((metric: PerformanceMetric) => {
        setPerformanceMetrics(prev => [...prev.slice(-99), metric])
    }, [])

    const clearLogs = useCallback(() => setLogs([]), [])
    const clearNetwork = useCallback(() => setNetworkRequests([]), [])
    const toggleRecording = useCallback(() => setIsRecording(prev => !prev), [])

    // Intercept console methods
    useEffect(() => {
        const originalConsole = {
            log: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error,
            debug: console.debug,
        }

        console.log = (...args) => {
            originalConsole.log(...args)
            addLog('log', args.map(a => String(a)).join(' '))
        }

        console.info = (...args) => {
            originalConsole.info(...args)
            addLog('info', args.map(a => String(a)).join(' '))
        }

        console.warn = (...args) => {
            originalConsole.warn(...args)
            addLog('warn', args.map(a => String(a)).join(' '))
        }

        console.error = (...args) => {
            originalConsole.error(...args)
            addLog('error', args.map(a => String(a)).join(' '))
        }

        console.debug = (...args) => {
            originalConsole.debug(...args)
            addLog('debug', args.map(a => String(a)).join(' '))
        }

        return () => {
            Object.assign(console, originalConsole)
        }
    }, [addLog])

    return (
        <DevToolsContext.Provider
            value={{
                logs,
                networkRequests,
                performanceMetrics,
                addLog,
                addNetworkRequest,
                addPerformanceMetric,
                clearLogs,
                clearNetwork,
                isRecording,
                toggleRecording,
            }}
        >
            {children}
        </DevToolsContext.Provider>
    )
}

// ============================================================================
// CONSOLE PANEL
// ============================================================================

interface ConsolePanelProps {
    className?: string
}

export function ConsolePanel({ className = '' }: ConsolePanelProps) {
    const { logs, clearLogs, isRecording, toggleRecording } = useDevTools()
    const [filter, setFilter] = useState('')
    const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all')
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())

    const filteredLogs = logs.filter(log => {
        if (levelFilter !== 'all' && log.level !== levelFilter) return false
        if (filter && !log.message.toLowerCase().includes(filter.toLowerCase())) return false
        return true
    })

    const levelIcons = {
        log: <Terminal className="w-4 h-4 text-gray-400" />,
        info: <Info className="w-4 h-4 text-blue-400" />,
        warn: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
        error: <AlertCircle className="w-4 h-4 text-red-400" />,
        debug: <Cpu className="w-4 h-4 text-purple-400" />,
    }

    const levelColors = {
        log: 'text-gray-300',
        info: 'text-blue-300',
        warn: 'text-yellow-300',
        error: 'text-red-300',
        debug: 'text-purple-300',
    }

    const toggleExpand = (id: string) => {
        setExpandedLogs(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                <button
                    onClick={toggleRecording}
                    className={`p-1.5 rounded transition-colors ${isRecording ? 'text-red-400' : 'text-gray-400 hover:text-white'}`}
                    title={isRecording ? 'Pause recording' : 'Resume recording'}
                >
                    {isRecording ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                    onClick={clearLogs}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors"
                    title="Clear console"
                >
                    <Trash2 className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-white/10" />

                {/* Level filter */}
                <div className="flex items-center gap-1">
                    {(['all', 'log', 'info', 'warn', 'error'] as const).map(level => (
                        <button
                            key={level}
                            onClick={() => setLevelFilter(level)}
                            className={`
                                px-2 py-1 text-xs rounded transition-colors
                                ${levelFilter === level ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-white'}
                            `}
                        >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="h-4 w-px bg-white/10" />

                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Filter logs..."
                        className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>

                <span className="text-xs text-gray-500">
                    {filteredLogs.length} logs
                </span>
            </div>

            {/* Log entries */}
            <div className="flex-1 overflow-y-auto font-mono text-sm">
                {filteredLogs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <Terminal className="w-8 h-8 mr-3 opacity-30" />
                        <span>No logs to display</span>
                    </div>
                ) : (
                    filteredLogs.map(log => (
                        <div
                            key={log.id}
                            className={`
                                flex items-start gap-2 px-3 py-2 border-b border-white/5 hover:bg-white/5
                                ${log.level === 'error' ? 'bg-red-500/5' : ''}
                                ${log.level === 'warn' ? 'bg-yellow-500/5' : ''}
                            `}
                        >
                            {log.data && (
                                <button
                                    onClick={() => toggleExpand(log.id)}
                                    className="flex-shrink-0 mt-0.5"
                                >
                                    {expandedLogs.has(log.id) ? (
                                        <ChevronDown className="w-3 h-3 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-3 h-3 text-gray-500" />
                                    )}
                                </button>
                            )}
                            <div className="flex-shrink-0 mt-0.5">
                                {levelIcons[log.level]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={`whitespace-pre-wrap ${levelColors[log.level]}`}>
                                    {log.message}
                                </div>
                                {expandedLogs.has(log.id) && log.data && (
                                    <pre className="mt-2 p-2 bg-black/30 rounded text-xs text-gray-400 overflow-x-auto">
                                        {JSON.stringify(log.data, null, 2)}
                                    </pre>
                                )}
                            </div>
                            <div className="flex-shrink-0 text-xs text-gray-600">
                                {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

// ============================================================================
// NETWORK PANEL
// ============================================================================

interface NetworkPanelProps {
    className?: string
}

export function NetworkPanel({ className = '' }: NetworkPanelProps) {
    const { networkRequests, clearNetwork } = useDevTools()
    const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null)
    const [filter, setFilter] = useState('')

    const filteredRequests = networkRequests.filter(req =>
        !filter || req.url.toLowerCase().includes(filter.toLowerCase())
    )

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-green-400'
        if (status >= 300 && status < 400) return 'text-blue-400'
        if (status >= 400 && status < 500) return 'text-yellow-400'
        if (status >= 500) return 'text-red-400'
        return 'text-gray-400'
    }

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }

    return (
        <div className={`grid grid-cols-[1fr,300px] h-full bg-slate-900 ${className}`}>
            {/* Request list */}
            <div className="flex flex-col border-r border-white/5">
                {/* Toolbar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
                    <button
                        onClick={clearNetwork}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="Clear network"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex-1 relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder="Filter URLs..."
                            className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                {/* Headers */}
                <div className="grid grid-cols-[60px,1fr,60px,80px,80px] gap-2 px-3 py-2 border-b border-white/5 text-xs text-gray-500 font-medium">
                    <div>Method</div>
                    <div>URL</div>
                    <div>Status</div>
                    <div>Size</div>
                    <div>Time</div>
                </div>

                {/* Requests */}
                <div className="flex-1 overflow-y-auto">
                    {filteredRequests.map(req => (
                        <button
                            key={req.id}
                            onClick={() => setSelectedRequest(req)}
                            className={`
                                w-full grid grid-cols-[60px,1fr,60px,80px,80px] gap-2 px-3 py-2
                                text-left text-sm hover:bg-white/5 transition-colors
                                ${selectedRequest?.id === req.id ? 'bg-purple-500/10' : ''}
                                ${req.status >= 400 ? 'bg-red-500/5' : ''}
                            `}
                        >
                            <div className="font-mono text-purple-400">{req.method}</div>
                            <div className="text-gray-300 truncate">{req.url}</div>
                            <div className={`font-mono ${getStatusColor(req.status)}`}>{req.status}</div>
                            <div className="text-gray-500">{formatSize(req.size)}</div>
                            <div className="text-gray-500">{req.duration}ms</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Request details */}
            <div className="flex flex-col overflow-hidden">
                {selectedRequest ? (
                    <>
                        <div className="px-4 py-3 border-b border-white/5">
                            <div className="text-sm font-medium text-white mb-1">
                                {selectedRequest.method} {selectedRequest.url}
                            </div>
                            <div className={`text-sm ${getStatusColor(selectedRequest.status)}`}>
                                {selectedRequest.status} {selectedRequest.statusText}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
                            {/* Headers */}
                            <div>
                                <h3 className="text-gray-500 font-medium mb-2">Response Headers</h3>
                                {selectedRequest.responseHeaders && (
                                    <div className="space-y-1">
                                        {Object.entries(selectedRequest.responseHeaders).map(([key, value]) => (
                                            <div key={key} className="flex gap-2">
                                                <span className="text-purple-400">{key}:</span>
                                                <span className="text-gray-300">{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Response body */}
                            {selectedRequest.responseBody && (
                                <div>
                                    <h3 className="text-gray-500 font-medium mb-2">Response Body</h3>
                                    <pre className="p-3 bg-black/30 rounded text-xs text-gray-300 overflow-x-auto">
                                        {typeof selectedRequest.responseBody === 'string'
                                            ? selectedRequest.responseBody
                                            : JSON.stringify(selectedRequest.responseBody, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Select a request to view details
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// PERFORMANCE PANEL
// ============================================================================

interface PerformancePanelProps {
    className?: string
}

export function PerformancePanel({ className = '' }: PerformancePanelProps) {
    const { performanceMetrics, addPerformanceMetric } = useDevTools()
    const [fps, setFps] = useState(0)
    const [memory, setMemory] = useState({ used: 0, total: 0 })

    // Monitor FPS
    useEffect(() => {
        let frameCount = 0
        let lastTime = performance.now()
        let animationId: number

        const measureFPS = () => {
            frameCount++
            const currentTime = performance.now()

            if (currentTime - lastTime >= 1000) {
                setFps(Math.round(frameCount * 1000 / (currentTime - lastTime)))
                frameCount = 0
                lastTime = currentTime
            }

            animationId = requestAnimationFrame(measureFPS)
        }

        animationId = requestAnimationFrame(measureFPS)
        return () => cancelAnimationFrame(animationId)
    }, [])

    // Monitor memory (if available)
    useEffect(() => {
        const updateMemory = () => {
            // @ts-expect-error memory API is not standard
            if (performance.memory) {
                // @ts-expect-error memory API
                setMemory({
                    // @ts-expect-error memory API
                    used: performance.memory.usedJSHeapSize,
                    // @ts-expect-error memory API
                    total: performance.memory.totalJSHeapSize,
                })
            }
        }

        const interval = setInterval(updateMemory, 1000)
        return () => clearInterval(interval)
    }, [])

    const formatBytes = (bytes: number) => {
        const mb = bytes / (1024 * 1024)
        return `${mb.toFixed(1)} MB`
    }

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Metrics grid */}
            <div className="grid grid-cols-3 gap-4 p-4 border-b border-white/5">
                {/* FPS */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className={`w-4 h-4 ${fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`} />
                        <span className="text-xs text-gray-500">FPS</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{fps}</div>
                    <div className={`text-xs ${fps >= 55 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {fps >= 55 ? 'Smooth' : fps >= 30 ? 'Moderate' : 'Low'}
                    </div>
                </div>

                {/* Memory */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-gray-500">Memory</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{formatBytes(memory.used)}</div>
                    <div className="text-xs text-gray-500">
                        of {formatBytes(memory.total)}
                    </div>
                </div>

                {/* DOM Nodes */}
                <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-500">DOM Nodes</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {document.querySelectorAll('*').length}
                    </div>
                    <div className="text-xs text-gray-500">elements</div>
                </div>
            </div>

            {/* Core Web Vitals */}
            <div className="p-4 border-b border-white/5">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Core Web Vitals</h3>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { name: 'LCP', value: '1.2s', status: 'good' },
                        { name: 'FID', value: '45ms', status: 'good' },
                        { name: 'CLS', value: '0.02', status: 'good' },
                    ].map(vital => (
                        <div key={vital.name} className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${vital.status === 'good' ? 'bg-green-500' : vital.status === 'warn' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                            <div>
                                <div className="text-xs text-gray-500">{vital.name}</div>
                                <div className="text-sm font-medium text-white">{vital.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 p-4 overflow-y-auto">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Performance Timeline</h3>
                <div className="space-y-2">
                    {performanceMetrics.slice(-20).map((metric, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-purple-400" />
                            <span className="text-gray-400">{metric.name}</span>
                            <span className="text-white font-mono">{metric.value}{metric.unit}</span>
                            <span className="text-gray-600 text-xs ml-auto">
                                {metric.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// DEVTOOLS PANEL
// ============================================================================

interface DevToolsPanelProps {
    className?: string
}

type DevToolTab = 'console' | 'network' | 'performance' | 'components'

export function DevToolsPanel({ className = '' }: DevToolsPanelProps) {
    const [activeTab, setActiveTab] = useState<DevToolTab>('console')

    const tabs: { id: DevToolTab; label: string; icon: React.ReactNode }[] = [
        { id: 'console', label: 'Console', icon: <Terminal className="w-4 h-4" /> },
        { id: 'network', label: 'Network', icon: <Network className="w-4 h-4" /> },
        { id: 'performance', label: 'Performance', icon: <Activity className="w-4 h-4" /> },
        { id: 'components', label: 'Components', icon: <Box className="w-4 h-4" /> },
    ]

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-2 py-1 border-b border-white/5">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                            ${activeTab === tab.id
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'console' && <ConsolePanel />}
                {activeTab === 'network' && <NetworkPanel />}
                {activeTab === 'performance' && <PerformancePanel />}
                {activeTab === 'components' && (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <Box className="w-8 h-8 mr-3 opacity-30" />
                        <span>Component inspector coming soon</span>
                    </div>
                )}
            </div>
        </div>
    )
}
