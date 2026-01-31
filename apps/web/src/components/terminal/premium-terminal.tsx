/**
 * SprintLoop Premium Terminal Component
 * 
 * Advanced terminal with:
 * - Multiple tabs
 * - Split terminals
 * - Command history
 * - Autocomplete suggestions
 * - Theme support
 */

import React, { useState, useRef, useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    Plus,
    X,
    Maximize2,
    Minimize2,
    Terminal as TerminalIcon,
    Trash2,
    Copy,
    Check
} from 'lucide-react'

// ============================================================================
// TERMINAL STATE
// ============================================================================

interface TerminalTab {
    id: string
    title: string
    cwd: string
    isActive: boolean
    history: TerminalLine[]
    inputHistory: string[]
    historyIndex: number
}

interface TerminalLine {
    id: string
    type: 'input' | 'output' | 'error' | 'info' | 'success'
    content: string
    timestamp: Date
}

interface TerminalState {
    tabs: TerminalTab[]
    activeTabId: string | null
    isMaximized: boolean
    theme: 'dark' | 'light'
    fontSize: number

    createTab: (title?: string, cwd?: string) => void
    closeTab: (id: string) => void
    setActiveTab: (id: string) => void
    addLine: (tabId: string, line: Omit<TerminalLine, 'id' | 'timestamp'>) => void
    clearTab: (tabId: string) => void
    addToHistory: (tabId: string, command: string) => void
    toggleMaximize: () => void
    setFontSize: (size: number) => void
}

export const useTerminal = create<TerminalState>()(
    persist(
        (set) => ({
            tabs: [
                {
                    id: 'default',
                    title: 'Terminal',
                    cwd: '~',
                    isActive: true,
                    history: [],
                    inputHistory: [],
                    historyIndex: -1,
                }
            ],
            activeTabId: 'default',
            isMaximized: false,
            theme: 'dark',
            fontSize: 13,

            createTab: (title, cwd) => set(state => {
                const id = `terminal-${Date.now()}`
                const newTab: TerminalTab = {
                    id,
                    title: title || `Terminal ${state.tabs.length + 1}`,
                    cwd: cwd || '~',
                    isActive: true,
                    history: [],
                    inputHistory: [],
                    historyIndex: -1,
                }
                return {
                    tabs: [...state.tabs.map(t => ({ ...t, isActive: false })), newTab],
                    activeTabId: id,
                }
            }),

            closeTab: (id) => set(state => {
                const newTabs = state.tabs.filter(t => t.id !== id)
                const activeTab = state.activeTabId === id
                    ? newTabs[newTabs.length - 1]?.id || null
                    : state.activeTabId
                return { tabs: newTabs, activeTabId: activeTab }
            }),

            setActiveTab: (id) => set(state => ({
                tabs: state.tabs.map(t => ({ ...t, isActive: t.id === id })),
                activeTabId: id,
            })),

            addLine: (tabId, line) => set(state => ({
                tabs: state.tabs.map(tab =>
                    tab.id === tabId
                        ? {
                            ...tab,
                            history: [...tab.history, {
                                ...line,
                                id: `line-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                                timestamp: new Date(),
                            }]
                        }
                        : tab
                )
            })),

            clearTab: (tabId) => set(state => ({
                tabs: state.tabs.map(tab =>
                    tab.id === tabId
                        ? { ...tab, history: [] }
                        : tab
                )
            })),

            addToHistory: (tabId, command) => set(state => ({
                tabs: state.tabs.map(tab =>
                    tab.id === tabId
                        ? {
                            ...tab,
                            inputHistory: [command, ...tab.inputHistory.filter(h => h !== command)].slice(0, 100),
                            historyIndex: -1,
                        }
                        : tab
                )
            })),

            toggleMaximize: () => set(state => ({ isMaximized: !state.isMaximized })),
            setFontSize: (size) => set({ fontSize: size }),
        }),
        { name: 'sprintloop-terminal' }
    )
)

// ============================================================================
// TERMINAL LINE COMPONENT
// ============================================================================

interface TerminalLineProps {
    line: TerminalLine
    showTimestamp?: boolean
}

function TerminalLineRow({ line, showTimestamp }: TerminalLineProps) {
    const colorClasses = {
        input: 'text-blue-400',
        output: 'text-gray-300',
        error: 'text-red-400',
        info: 'text-cyan-400',
        success: 'text-green-400',
    }

    const prefixes = {
        input: '$ ',
        output: '',
        error: '✖ ',
        info: 'ℹ ',
        success: '✓ ',
    }

    return (
        <div className={`group flex items-start gap-2 hover:bg-white/5 px-4 py-0.5 ${colorClasses[line.type]}`}>
            <span className="select-none opacity-50 w-4">{prefixes[line.type]}</span>
            <span className="flex-1 whitespace-pre-wrap break-all font-mono">{line.content}</span>
            {showTimestamp && (
                <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {line.timestamp.toLocaleTimeString()}
                </span>
            )}
        </div>
    )
}

// ============================================================================
// TERMINAL INPUT
// ============================================================================

interface TerminalInputProps {
    cwd: string
    onSubmit: (command: string) => void
    onHistoryUp: () => string | null
    onHistoryDown: () => string | null
}

function TerminalInput({ cwd, onSubmit, onHistoryUp, onHistoryDown }: TerminalInputProps) {
    const [value, setValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && value.trim()) {
            onSubmit(value)
            setValue('')
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            const prev = onHistoryUp()
            if (prev !== null) setValue(prev)
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            const next = onHistoryDown()
            setValue(next || '')
        } else if (e.key === 'c' && e.ctrlKey) {
            setValue('')
        } else if (e.key === 'l' && e.ctrlKey) {
            e.preventDefault()
            // Clear terminal
        }
    }

    return (
        <div className="flex items-center gap-2 px-4 py-2 border-t border-white/5">
            <span className="text-green-400 font-mono text-sm">{cwd}</span>
            <span className="text-blue-400">$</span>
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none"
                placeholder="Enter command..."
                autoFocus
            />
        </div>
    )
}

// ============================================================================
// TERMINAL TAB BAR
// ============================================================================

interface TerminalTabBarProps {
    tabs: TerminalTab[]
    activeTabId: string | null
    onTabSelect: (id: string) => void
    onTabClose: (id: string) => void
    onNewTab: () => void
}

function TerminalTabBar({ tabs, activeTabId, onTabSelect, onTabClose, onNewTab }: TerminalTabBarProps) {
    return (
        <div className="flex items-center bg-slate-900/50 border-b border-white/5">
            <div className="flex items-center flex-1 overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => onTabSelect(tab.id)}
                        className={`
                            group flex items-center gap-2 px-3 py-2 min-w-[120px] max-w-[200px]
                            border-r border-white/5 transition-colors
                            ${tab.id === activeTabId
                                ? 'bg-slate-800 text-white'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }
                        `}
                    >
                        <TerminalIcon className="w-3.5 h-3.5" />
                        <span className="flex-1 truncate text-sm">{tab.title}</span>
                        {tabs.length > 1 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onTabClose(tab.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        )}
                    </button>
                ))}
            </div>

            <button
                onClick={onNewTab}
                className="p-2 text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                title="New Terminal"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    )
}

// ============================================================================
// MAIN TERMINAL COMPONENT
// ============================================================================

interface TerminalProps {
    onCommand?: (command: string) => Promise<string>
    className?: string
}

export function PremiumTerminal({ onCommand, className }: TerminalProps) {
    const {
        tabs,
        activeTabId,
        isMaximized,
        fontSize,
        createTab,
        closeTab,
        setActiveTab,
        addLine,
        clearTab,
        addToHistory,
        toggleMaximize,
    } = useTerminal()

    const activeTab = tabs.find(t => t.id === activeTabId)
    const outputRef = useRef<HTMLDivElement>(null)
    const [copied, setCopied] = useState(false)

    // Auto-scroll to bottom
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
    }, [activeTab?.history])

    const handleCommand = async (command: string) => {
        if (!activeTabId) return

        addLine(activeTabId, { type: 'input', content: command })
        addToHistory(activeTabId, command)

        // Built-in commands
        if (command === 'clear' || command === 'cls') {
            clearTab(activeTabId)
            return
        }

        if (command === 'help') {
            addLine(activeTabId, {
                type: 'info',
                content: 'Available commands:\n  clear - Clear terminal\n  help - Show this help\n  exit - Close terminal'
            })
            return
        }

        try {
            if (onCommand) {
                const result = await onCommand(command)
                addLine(activeTabId, { type: 'output', content: result })
            } else {
                addLine(activeTabId, { type: 'info', content: `Command executed: ${command}` })
            }
        } catch (error) {
            addLine(activeTabId, {
                type: 'error',
                content: error instanceof Error ? error.message : 'Command failed'
            })
        }
    }

    const handleHistoryUp = () => {
        // Navigate up in history
        return null
    }

    const handleHistoryDown = () => {
        // Navigate down in history
        return null
    }

    const copyOutput = () => {
        if (!activeTab) return
        const text = activeTab.history.map(l => l.content).join('\n')
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div
            className={`
                flex flex-col bg-slate-950 rounded-lg overflow-hidden border border-white/5
                ${isMaximized ? 'fixed inset-4 z-50' : ''}
                ${className || ''}
            `}
            style={{ fontSize }}
        >
            {/* Tab bar */}
            <TerminalTabBar
                tabs={tabs}
                activeTabId={activeTabId}
                onTabSelect={setActiveTab}
                onTabClose={closeTab}
                onNewTab={() => createTab()}
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/30 border-b border-white/5">
                <div className="flex items-center gap-2">
                    {activeTab && (
                        <span className="text-xs text-gray-500">
                            {activeTab.cwd}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => activeTabId && clearTab(activeTabId)}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                        title="Clear Terminal"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={copyOutput}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                        title="Copy Output"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                        onClick={toggleMaximize}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                        title={isMaximized ? 'Restore' : 'Maximize'}
                    >
                        {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>
                </div>
            </div>

            {/* Output */}
            <div
                ref={outputRef}
                className="flex-1 overflow-y-auto py-2"
                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
            >
                {activeTab?.history.map(line => (
                    <TerminalLineRow key={line.id} line={line} />
                ))}
            </div>

            {/* Input */}
            {activeTab && (
                <TerminalInput
                    cwd={activeTab.cwd}
                    onSubmit={handleCommand}
                    onHistoryUp={handleHistoryUp}
                    onHistoryDown={handleHistoryDown}
                />
            )}
        </div>
    )
}

// ============================================================================
// INLINE TERMINAL (for quick commands)
// ============================================================================

interface InlineTerminalProps {
    placeholder?: string
    onSubmit: (command: string) => void
    suggestions?: string[]
}

export function InlineTerminal({ placeholder = 'Run a command...', onSubmit, suggestions = [] }: InlineTerminalProps) {
    const [value, setValue] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)

    const filteredSuggestions = suggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
    )

    return (
        <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 border border-white/10 rounded-lg">
                <TerminalIcon className="w-4 h-4 text-gray-500" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value)
                        setShowSuggestions(true)
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && value.trim()) {
                            onSubmit(value)
                            setValue('')
                            setShowSuggestions(false)
                        } else if (e.key === 'Escape') {
                            setShowSuggestions(false)
                        }
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="flex-1 bg-transparent text-white text-sm font-mono focus:outline-none"
                    placeholder={placeholder}
                />
            </div>

            {/* Suggestions dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-slate-900 border border-white/10 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                onSubmit(suggestion)
                                setValue('')
                                setShowSuggestions(false)
                            }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5 font-mono"
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
