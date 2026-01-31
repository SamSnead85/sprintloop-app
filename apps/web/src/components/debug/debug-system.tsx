/**
 * SprintLoop Debug System
 * 
 * Phase 1251-1300: Advanced debugging
 * - Breakpoints management
 * - Variable inspection
 * - Call stack
 * - Watch expressions
 * - Debug console
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import {
    Bug,
    Play,
    Pause,
    StepInto,
    StepOver,
    StepOut,
    RotateCcw,
    Square,
    Circle,
    ChevronRight,
    ChevronDown,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Terminal,
    Layers,
    Variable,
    Target,
    AlertCircle
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type DebugState = 'idle' | 'running' | 'paused' | 'stopped'

interface Breakpoint {
    id: string
    file: string
    line: number
    column?: number
    enabled: boolean
    condition?: string
    hitCount?: number
    logMessage?: string
}

interface StackFrame {
    id: string
    name: string
    file: string
    line: number
    column: number
    isCurrentFrame: boolean
}

interface DebugVariable {
    name: string
    value: string
    type: string
    children?: DebugVariable[]
    evaluateName?: string
}

interface WatchExpression {
    id: string
    expression: string
    value?: string
    error?: string
}

interface DebugSession {
    id: string
    name: string
    type: string
    state: DebugState
    currentFile?: string
    currentLine?: number
}

// ============================================================================
// CONTEXT
// ============================================================================

interface DebugContextValue {
    session: DebugSession | null
    breakpoints: Breakpoint[]
    callStack: StackFrame[]
    variables: DebugVariable[]
    watchExpressions: WatchExpression[]
    consoleOutput: string[]
    startDebugging: (config?: string) => void
    stopDebugging: () => void
    pauseDebugging: () => void
    resumeDebugging: () => void
    stepOver: () => void
    stepInto: () => void
    stepOut: () => void
    restart: () => void
    addBreakpoint: (file: string, line: number) => void
    removeBreakpoint: (id: string) => void
    toggleBreakpoint: (id: string) => void
    addWatch: (expression: string) => void
    removeWatch: (id: string) => void
    evaluateExpression: (expression: string) => Promise<string>
}

const DebugContext = createContext<DebugContextValue | null>(null)

export function useDebug() {
    const context = useContext(DebugContext)
    if (!context) throw new Error('useDebug must be used within DebugProvider')
    return context
}

// ============================================================================
// PROVIDER
// ============================================================================

interface DebugProviderProps {
    children: React.ReactNode
}

export function DebugProvider({ children }: DebugProviderProps) {
    const [session, setSession] = useState<DebugSession | null>(null)
    const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([
        { id: 'bp-1', file: 'src/App.tsx', line: 42, enabled: true },
        { id: 'bp-2', file: 'src/utils/helpers.ts', line: 15, enabled: true },
        { id: 'bp-3', file: 'src/components/Editor.tsx', line: 128, enabled: false },
    ])
    const [callStack, setCallStack] = useState<StackFrame[]>([])
    const [variables, setVariables] = useState<DebugVariable[]>([])
    const [watchExpressions, setWatchExpressions] = useState<WatchExpression[]>([
        { id: 'w-1', expression: 'currentUser', value: '{ id: 1, name: "John" }' },
        { id: 'w-2', expression: 'items.length', value: '42' },
    ])
    const [consoleOutput, setConsoleOutput] = useState<string[]>([])

    const startDebugging = useCallback((config?: string) => {
        setSession({
            id: `session-${Date.now()}`,
            name: config || 'Debug Session',
            type: 'node',
            state: 'running',
        })

        // Simulate hitting a breakpoint
        setTimeout(() => {
            setSession(prev => prev ? { ...prev, state: 'paused', currentFile: 'src/App.tsx', currentLine: 42 } : null)
            setCallStack([
                { id: 'f-1', name: 'handleClick', file: 'src/App.tsx', line: 42, column: 5, isCurrentFrame: true },
                { id: 'f-2', name: 'onClick', file: 'src/components/Button.tsx', line: 28, column: 10, isCurrentFrame: false },
                { id: 'f-3', name: 'processEvent', file: 'src/utils/events.ts', line: 15, column: 3, isCurrentFrame: false },
            ])
            setVariables([
                {
                    name: 'event', value: 'MouseEvent', type: 'object', children: [
                        { name: 'target', value: '<button>', type: 'HTMLButtonElement' },
                        { name: 'clientX', value: '245', type: 'number' },
                        { name: 'clientY', value: '128', type: 'number' },
                    ]
                },
                {
                    name: 'user', value: '{ id: 1, ... }', type: 'object', children: [
                        { name: 'id', value: '1', type: 'number' },
                        { name: 'name', value: '"John"', type: 'string' },
                        { name: 'email', value: '"john@example.com"', type: 'string' },
                    ]
                },
                { name: 'count', value: '42', type: 'number' },
                { name: 'isLoading', value: 'false', type: 'boolean' },
            ])
            setConsoleOutput(prev => [...prev, 'Debugger attached', 'Breakpoint hit at src/App.tsx:42'])
        }, 500)
    }, [])

    const stopDebugging = useCallback(() => {
        setSession(null)
        setCallStack([])
        setVariables([])
        setConsoleOutput(prev => [...prev, 'Debug session ended'])
    }, [])

    const pauseDebugging = useCallback(() => {
        setSession(prev => prev ? { ...prev, state: 'paused' } : null)
    }, [])

    const resumeDebugging = useCallback(() => {
        setSession(prev => {
            if (!prev) return null
            setConsoleOutput(p => [...p, 'Continuing...'])
            return { ...prev, state: 'running' }
        })
    }, [])

    const stepOver = useCallback(() => {
        setConsoleOutput(prev => [...prev, 'Step over'])
    }, [])

    const stepInto = useCallback(() => {
        setConsoleOutput(prev => [...prev, 'Step into'])
    }, [])

    const stepOut = useCallback(() => {
        setConsoleOutput(prev => [...prev, 'Step out'])
    }, [])

    const restart = useCallback(() => {
        setConsoleOutput(prev => [...prev, 'Restarting...'])
        stopDebugging()
        setTimeout(startDebugging, 100)
    }, [stopDebugging, startDebugging])

    const addBreakpoint = useCallback((file: string, line: number) => {
        const bp: Breakpoint = {
            id: `bp-${Date.now()}`,
            file,
            line,
            enabled: true,
        }
        setBreakpoints(prev => [...prev, bp])
    }, [])

    const removeBreakpoint = useCallback((id: string) => {
        setBreakpoints(prev => prev.filter(bp => bp.id !== id))
    }, [])

    const toggleBreakpoint = useCallback((id: string) => {
        setBreakpoints(prev =>
            prev.map(bp => bp.id === id ? { ...bp, enabled: !bp.enabled } : bp)
        )
    }, [])

    const addWatch = useCallback((expression: string) => {
        const watch: WatchExpression = {
            id: `w-${Date.now()}`,
            expression,
            value: 'undefined', // Would be evaluated in real impl
        }
        setWatchExpressions(prev => [...prev, watch])
    }, [])

    const removeWatch = useCallback((id: string) => {
        setWatchExpressions(prev => prev.filter(w => w.id !== id))
    }, [])

    const evaluateExpression = useCallback(async (expression: string) => {
        return `Result of: ${expression}`
    }, [])

    return (
        <DebugContext.Provider
            value={{
                session,
                breakpoints,
                callStack,
                variables,
                watchExpressions,
                consoleOutput,
                startDebugging,
                stopDebugging,
                pauseDebugging,
                resumeDebugging,
                stepOver,
                stepInto,
                stepOut,
                restart,
                addBreakpoint,
                removeBreakpoint,
                toggleBreakpoint,
                addWatch,
                removeWatch,
                evaluateExpression,
            }}
        >
            {children}
        </DebugContext.Provider>
    )
}

// ============================================================================
// DEBUG TOOLBAR
// ============================================================================

interface DebugToolbarProps {
    className?: string
}

export function DebugToolbar({ className = '' }: DebugToolbarProps) {
    const {
        session,
        startDebugging,
        stopDebugging,
        resumeDebugging,
        stepOver,
        stepInto,
        stepOut,
        restart,
    } = useDebug()

    const isRunning = session?.state === 'running'
    const isPaused = session?.state === 'paused'
    const isActive = session !== null

    return (
        <div className={`flex items-center gap-1 px-2 py-1 bg-slate-800/50 rounded-lg ${className}`}>
            {!isActive ? (
                <button
                    onClick={() => startDebugging()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-400 transition-colors"
                >
                    <Play className="w-4 h-4" />
                    Start Debugging
                </button>
            ) : (
                <>
                    {isPaused ? (
                        <button
                            onClick={resumeDebugging}
                            className="p-2 text-green-400 hover:bg-green-500/20 rounded transition-colors"
                            title="Continue (F5)"
                        >
                            <Play className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => { }}
                            className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded transition-colors"
                            title="Pause (F6)"
                        >
                            <Pause className="w-4 h-4" />
                        </button>
                    )}

                    <button
                        onClick={stepOver}
                        disabled={!isPaused}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded disabled:opacity-50 transition-colors"
                        title="Step Over (F10)"
                    >
                        <StepOver className="w-4 h-4" />
                    </button>

                    <button
                        onClick={stepInto}
                        disabled={!isPaused}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded disabled:opacity-50 transition-colors"
                        title="Step Into (F11)"
                    >
                        <StepInto className="w-4 h-4" />
                    </button>

                    <button
                        onClick={stepOut}
                        disabled={!isPaused}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded disabled:opacity-50 transition-colors"
                        title="Step Out (Shift+F11)"
                    >
                        <StepOut className="w-4 h-4" />
                    </button>

                    <div className="w-px h-4 bg-white/10 mx-1" />

                    <button
                        onClick={restart}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                        title="Restart (Ctrl+Shift+F5)"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>

                    <button
                        onClick={stopDebugging}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                        title="Stop (Shift+F5)"
                    >
                        <Square className="w-4 h-4" />
                    </button>
                </>
            )}
        </div>
    )
}

// ============================================================================
// BREAKPOINTS PANEL
// ============================================================================

interface BreakpointsPanelProps {
    className?: string
}

export function BreakpointsPanel({ className = '' }: BreakpointsPanelProps) {
    const { breakpoints, toggleBreakpoint, removeBreakpoint } = useDebug()

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <h3 className="text-sm font-medium text-gray-400">Breakpoints</h3>
                <span className="text-xs text-gray-600">{breakpoints.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto">
                {breakpoints.map(bp => (
                    <div
                        key={bp.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
                    >
                        <button
                            onClick={() => toggleBreakpoint(bp.id)}
                            className={`flex-shrink-0 ${bp.enabled ? 'text-red-400' : 'text-gray-600'}`}
                        >
                            <Circle className={`w-3 h-3 ${bp.enabled ? 'fill-current' : ''}`} />
                        </button>

                        <div className="flex-1 min-w-0">
                            <div className="text-sm text-white truncate">
                                {bp.file.split('/').pop()}:{bp.line}
                            </div>
                            <div className="text-xs text-gray-500 truncate">{bp.file}</div>
                        </div>

                        <button
                            onClick={() => removeBreakpoint(bp.id)}
                            className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                {breakpoints.length === 0 && (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                        No breakpoints set
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// VARIABLES PANEL
// ============================================================================

interface VariablesPanelProps {
    className?: string
}

export function VariablesPanel({ className = '' }: VariablesPanelProps) {
    const { variables, session } = useDebug()
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    const toggleExpand = (name: string) => {
        setExpanded(prev => {
            const next = new Set(prev)
            if (next.has(name)) next.delete(name)
            else next.add(name)
            return next
        })
    }

    const renderVariable = (variable: DebugVariable, depth = 0) => (
        <div key={variable.name}>
            <div
                className="flex items-center gap-2 px-3 py-1 hover:bg-white/5 transition-colors"
                style={{ paddingLeft: `${12 + depth * 16}px` }}
            >
                {variable.children ? (
                    <button
                        onClick={() => toggleExpand(variable.name)}
                        className="text-gray-500"
                    >
                        {expanded.has(variable.name) ? (
                            <ChevronDown className="w-3 h-3" />
                        ) : (
                            <ChevronRight className="w-3 h-3" />
                        )}
                    </button>
                ) : (
                    <span className="w-3" />
                )}

                <span className="text-purple-400 text-sm">{variable.name}</span>
                <span className="text-gray-600">:</span>
                <span className="text-green-400 text-sm truncate">{variable.value}</span>
                <span className="text-gray-600 text-xs ml-auto">{variable.type}</span>
            </div>

            {variable.children && expanded.has(variable.name) && (
                <div>
                    {variable.children.map(child => renderVariable(child, depth + 1))}
                </div>
            )}
        </div>
    )

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <h3 className="text-sm font-medium text-gray-400">Variables</h3>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-sm">
                {session?.state === 'paused' ? (
                    variables.map(v => renderVariable(v))
                ) : (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                        {session ? 'Not paused' : 'Not debugging'}
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// CALL STACK PANEL
// ============================================================================

interface CallStackPanelProps {
    className?: string
}

export function CallStackPanel({ className = '' }: CallStackPanelProps) {
    const { callStack, session } = useDebug()

    return (
        <div className={`flex flex-col ${className}`}>
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <h3 className="text-sm font-medium text-gray-400">Call Stack</h3>
            </div>

            <div className="flex-1 overflow-y-auto">
                {session?.state === 'paused' ? (
                    callStack.map(frame => (
                        <button
                            key={frame.id}
                            className={`
                                w-full flex items-start gap-2 px-3 py-2 text-left transition-colors
                                ${frame.isCurrentFrame ? 'bg-yellow-500/10' : 'hover:bg-white/5'}
                            `}
                        >
                            {frame.isCurrentFrame && (
                                <Target className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0" style={{ marginLeft: frame.isCurrentFrame ? 0 : 24 }}>
                                <div className="text-sm text-white truncate">{frame.name}</div>
                                <div className="text-xs text-gray-500 truncate">
                                    {frame.file}:{frame.line}:{frame.column}
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="px-3 py-4 text-sm text-gray-500 text-center">
                        {session ? 'Not paused' : 'Not debugging'}
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// DEBUG PANEL
// ============================================================================

interface DebugPanelProps {
    className?: string
}

export function DebugPanel({ className = '' }: DebugPanelProps) {
    const [activeSection, setActiveSection] = useState<'variables' | 'watch' | 'callstack' | 'breakpoints'>('variables')

    const sections = [
        { id: 'variables', label: 'Variables', icon: <Variable className="w-4 h-4" /> },
        { id: 'watch', label: 'Watch', icon: <Eye className="w-4 h-4" /> },
        { id: 'callstack', label: 'Call Stack', icon: <Layers className="w-4 h-4" /> },
        { id: 'breakpoints', label: 'Breakpoints', icon: <Circle className="w-4 h-4" /> },
    ] as const

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Toolbar */}
            <div className="px-4 py-2 border-b border-white/5">
                <DebugToolbar />
            </div>

            {/* Section tabs */}
            <div className="flex items-center gap-1 px-2 py-1 border-b border-white/5">
                {sections.map(section => (
                    <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${activeSection === section.id
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {section.icon}
                        {section.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeSection === 'variables' && <VariablesPanel />}
                {activeSection === 'callstack' && <CallStackPanel />}
                {activeSection === 'breakpoints' && <BreakpointsPanel />}
                {activeSection === 'watch' && (
                    <div className="p-4 text-sm text-gray-500 text-center">
                        Watch expressions panel
                    </div>
                )}
            </div>
        </div>
    )
}
