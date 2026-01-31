/**
 * SprintLoop Advanced Terminal System
 * 
 * Phase 1051-1100: Professional terminal
 * - Multi-tab terminal
 * - Split views
 * - Command history
 * - Auto-complete
 * - Links detection
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import {
    Terminal,
    Plus,
    X,
    ChevronRight,
    Search,
    Settings,
    Maximize2,
    Minimize2,
    LayoutGrid,
    SplitSquareHorizontal,
    Trash2,
    Copy,
    Download,
    Clock
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface TerminalTab {
    id: string
    title: string
    cwd: string
    isActive: boolean
    output: OutputLine[]
    history: string[]
    historyIndex: number
}

interface OutputLine {
    id: string
    type: 'input' | 'output' | 'error' | 'info' | 'success'
    content: string
    timestamp: Date
}

interface TerminalTheme {
    background: string
    foreground: string
    cursor: string
    black: string
    red: string
    green: string
    yellow: string
    blue: string
    magenta: string
    cyan: string
    white: string
}

// ============================================================================
// DEFAULT THEME
// ============================================================================

const defaultTheme: TerminalTheme = {
    background: '#0d1117',
    foreground: '#c9d1d9',
    cursor: '#58a6ff',
    black: '#484f58',
    red: '#ff7b72',
    green: '#3fb950',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#39c5cf',
    white: '#b1bac4',
}

// ============================================================================
// OUTPUT LINE COMPONENT
// ============================================================================

interface OutputLineDisplayProps {
    line: OutputLine
    theme: TerminalTheme
}

function OutputLineDisplay({ line, theme }: OutputLineDisplayProps) {
    // Simple ANSI code parsing (basic colors)
    const parseAnsi = (text: string): React.ReactNode[] => {
        const parts: React.ReactNode[] = []
        let currentIndex = 0
        const ansiRegex = /\x1b\[([0-9;]+)m/g
        let match
        let currentColor = theme.foreground

        while ((match = ansiRegex.exec(text)) !== null) {
            if (match.index > currentIndex) {
                parts.push(
                    <span key={currentIndex} style={{ color: currentColor }}>
                        {text.slice(currentIndex, match.index)}
                    </span>
                )
            }

            const code = match[1]
            if (code === '0') currentColor = theme.foreground
            else if (code === '31') currentColor = theme.red
            else if (code === '32') currentColor = theme.green
            else if (code === '33') currentColor = theme.yellow
            else if (code === '34') currentColor = theme.blue
            else if (code === '35') currentColor = theme.magenta
            else if (code === '36') currentColor = theme.cyan

            currentIndex = match.index + match[0].length
        }

        if (currentIndex < text.length) {
            parts.push(
                <span key={currentIndex} style={{ color: currentColor }}>
                    {text.slice(currentIndex)}
                </span>
            )
        }

        return parts.length > 0 ? parts : [text]
    }

    // Detect and linkify URLs
    const linkify = (content: React.ReactNode): React.ReactNode => {
        if (typeof content !== 'string') return content

        const urlRegex = /(https?:\/\/[^\s]+)/g
        const parts = content.split(urlRegex)

        return parts.map((part, i) =>
            urlRegex.test(part) ? (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline hover:text-blue-300"
                >
                    {part}
                </a>
            ) : (
                part
            )
        )
    }

    const getLineStyle = () => {
        switch (line.type) {
            case 'input':
                return { color: theme.cyan }
            case 'error':
                return { color: theme.red }
            case 'success':
                return { color: theme.green }
            case 'info':
                return { color: theme.blue }
            default:
                return { color: theme.foreground }
        }
    }

    return (
        <div className="flex items-start gap-2 px-3 py-0.5 font-mono text-sm hover:bg-white/5">
            {line.type === 'input' && (
                <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: theme.green }} />
            )}
            <pre className="whitespace-pre-wrap break-all flex-1" style={getLineStyle()}>
                {line.type === 'output' || line.type === 'error'
                    ? parseAnsi(line.content).map((part, i) =>
                        typeof part === 'string' ? linkify(part) : part
                    )
                    : linkify(line.content)}
            </pre>
        </div>
    )
}

// ============================================================================
// COMMAND INPUT
// ============================================================================

interface CommandInputProps {
    cwd: string
    onSubmit: (command: string) => void
    history: string[]
    historyIndex: number
    onHistoryNavigate: (direction: 'up' | 'down') => void
    theme: TerminalTheme
}

function CommandInput({
    cwd,
    onSubmit,
    history,
    historyIndex,
    onHistoryNavigate,
    theme,
}: CommandInputProps) {
    const [value, setValue] = useState('')
    const [suggestions, setSuggestions] = useState<string[]>([])
    const [selectedSuggestion, setSelectedSuggestion] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    // Common commands for autocomplete
    const commands = useMemo(() => [
        'npm', 'npm run', 'npm install', 'npm start', 'npm test', 'npm build',
        'yarn', 'yarn add', 'yarn dev', 'yarn build', 'yarn test',
        'pnpm', 'pnpm add', 'pnpm dev', 'pnpm build',
        'git', 'git status', 'git add', 'git commit', 'git push', 'git pull',
        'cd', 'ls', 'mkdir', 'rm', 'mv', 'cp', 'cat', 'grep', 'find',
        'node', 'npx', 'tsx', 'tsc', 'eslint', 'prettier',
    ], [])

    useEffect(() => {
        if (value) {
            const matches = commands.filter(cmd =>
                cmd.toLowerCase().startsWith(value.toLowerCase())
            )
            setSuggestions(matches.slice(0, 5))
            setSelectedSuggestion(0)
        } else {
            setSuggestions([])
        }
    }, [value, commands])

    // Update from history navigation
    useEffect(() => {
        if (historyIndex >= 0 && historyIndex < history.length) {
            setValue(history[history.length - 1 - historyIndex])
        } else if (historyIndex === -1) {
            setValue('')
        }
    }, [historyIndex, history])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (suggestions.length > 0 && value !== suggestions[selectedSuggestion]) {
                setValue(suggestions[selectedSuggestion])
            } else {
                onSubmit(value)
                setValue('')
                setSuggestions([])
            }
        } else if (e.key === 'Tab') {
            e.preventDefault()
            if (suggestions.length > 0) {
                setValue(suggestions[selectedSuggestion])
                setSuggestions([])
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (suggestions.length > 0) {
                setSelectedSuggestion(prev => Math.max(0, prev - 1))
            } else {
                onHistoryNavigate('up')
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (suggestions.length > 0) {
                setSelectedSuggestion(prev => Math.min(suggestions.length - 1, prev + 1))
            } else {
                onHistoryNavigate('down')
            }
        } else if (e.key === 'Escape') {
            setSuggestions([])
        }
    }

    return (
        <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2">
                <span className="text-green-400 font-mono text-sm">
                    {cwd.split('/').pop()} $
                </span>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent text-white font-mono text-sm outline-none"
                    placeholder="Enter command..."
                    autoFocus
                />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <div className="absolute bottom-full left-0 w-64 mb-1 ml-3 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden">
                    {suggestions.map((suggestion, i) => (
                        <button
                            key={suggestion}
                            onClick={() => {
                                setValue(suggestion)
                                setSuggestions([])
                                inputRef.current?.focus()
                            }}
                            className={`
                                w-full px-3 py-1.5 text-left font-mono text-sm transition-colors
                                ${i === selectedSuggestion ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:bg-white/5'}
                            `}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// TERMINAL INSTANCE
// ============================================================================

interface TerminalInstanceProps {
    tab: TerminalTab
    onCommand: (command: string) => void
    onHistoryNavigate: (direction: 'up' | 'down') => void
    theme: TerminalTheme
    className?: string
}

function TerminalInstance({
    tab,
    onCommand,
    onHistoryNavigate,
    theme,
    className = '',
}: TerminalInstanceProps) {
    const outputRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight
        }
    }, [tab.output])

    return (
        <div
            className={`flex flex-col h-full ${className}`}
            style={{ backgroundColor: theme.background }}
        >
            {/* Output */}
            <div ref={outputRef} className="flex-1 overflow-y-auto py-2">
                {tab.output.map(line => (
                    <OutputLineDisplay key={line.id} line={line} theme={theme} />
                ))}
            </div>

            {/* Input */}
            <CommandInput
                cwd={tab.cwd}
                onSubmit={onCommand}
                history={tab.history}
                historyIndex={tab.historyIndex}
                onHistoryNavigate={onHistoryNavigate}
                theme={theme}
            />
        </div>
    )
}

// ============================================================================
// TERMINAL TABS
// ============================================================================

interface TerminalTabsProps {
    tabs: TerminalTab[]
    activeTab: string
    onSelect: (id: string) => void
    onClose: (id: string) => void
    onCreate: () => void
    className?: string
}

function TerminalTabs({
    tabs,
    activeTab,
    onSelect,
    onClose,
    onCreate,
    className = '',
}: TerminalTabsProps) {
    return (
        <div className={`flex items-center gap-1 px-2 py-1 bg-slate-900 border-b border-white/5 ${className}`}>
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onSelect(tab.id)}
                    className={`
                        group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                        ${activeTab === tab.id
                            ? 'bg-slate-800 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                    `}
                >
                    <Terminal className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[100px]">{tab.title}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onClose(tab.id)
                        }}
                        className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </button>
            ))}

            <button
                onClick={onCreate}
                className="p-1.5 text-gray-500 hover:text-white transition-colors"
                title="New terminal"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    )
}

// ============================================================================
// MAIN TERMINAL PRO COMPONENT
// ============================================================================

interface TerminalProProps {
    className?: string
}

export function TerminalPro({ className = '' }: TerminalProProps) {
    const [tabs, setTabs] = useState<TerminalTab[]>([
        {
            id: 'terminal-1',
            title: 'Terminal 1',
            cwd: '/Users/dev/project',
            isActive: true,
            output: [
                { id: '1', type: 'info', content: 'Welcome to SprintLoop Terminal', timestamp: new Date() },
                { id: '2', type: 'info', content: 'Type "help" for available commands', timestamp: new Date() },
            ],
            history: [],
            historyIndex: -1,
        },
    ])
    const [activeTabId, setActiveTabId] = useState('terminal-1')
    const [isMaximized, setIsMaximized] = useState(false)
    const [splitView, setSplitView] = useState(false)
    const [theme] = useState<TerminalTheme>(defaultTheme)

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

    // Create new tab
    const createTab = useCallback(() => {
        const newId = `terminal-${Date.now()}`
        const newTab: TerminalTab = {
            id: newId,
            title: `Terminal ${tabs.length + 1}`,
            cwd: '/Users/dev/project',
            isActive: false,
            output: [
                { id: `${newId}-1`, type: 'info', content: 'New terminal session', timestamp: new Date() },
            ],
            history: [],
            historyIndex: -1,
        }

        setTabs(prev => [...prev, newTab])
        setActiveTabId(newId)
    }, [tabs.length])

    // Close tab
    const closeTab = useCallback((id: string) => {
        setTabs(prev => {
            const newTabs = prev.filter(t => t.id !== id)
            if (newTabs.length === 0) {
                return prev // Don't close last tab
            }
            if (id === activeTabId) {
                setActiveTabId(newTabs[newTabs.length - 1].id)
            }
            return newTabs
        })
    }, [activeTabId])

    // Execute command
    const executeCommand = useCallback((command: string) => {
        if (!command.trim()) return

        // Add to history
        setTabs(prev =>
            prev.map(tab =>
                tab.id === activeTabId
                    ? {
                        ...tab,
                        history: [...tab.history, command],
                        historyIndex: -1,
                        output: [
                            ...tab.output,
                            {
                                id: `out-${Date.now()}`,
                                type: 'input',
                                content: command,
                                timestamp: new Date(),
                            },
                        ],
                    }
                    : tab
            )
        )

        // Simulate command execution
        setTimeout(() => {
            let outputLines: OutputLine[] = []

            if (command === 'help') {
                outputLines = [
                    { id: `o1-${Date.now()}`, type: 'output', content: 'Available commands:', timestamp: new Date() },
                    { id: `o2-${Date.now()}`, type: 'output', content: '  clear    - Clear terminal', timestamp: new Date() },
                    { id: `o3-${Date.now()}`, type: 'output', content: '  history  - Show command history', timestamp: new Date() },
                    { id: `o4-${Date.now()}`, type: 'output', content: '  pwd      - Print working directory', timestamp: new Date() },
                ]
            } else if (command === 'clear') {
                setTabs(prev =>
                    prev.map(tab =>
                        tab.id === activeTabId
                            ? { ...tab, output: [] }
                            : tab
                    )
                )
                return
            } else if (command === 'pwd') {
                outputLines = [
                    { id: `o-${Date.now()}`, type: 'output', content: activeTab.cwd, timestamp: new Date() },
                ]
            } else if (command === 'history') {
                outputLines = activeTab.history.map((cmd, i) => ({
                    id: `h-${Date.now()}-${i}`,
                    type: 'output' as const,
                    content: `  ${i + 1}  ${cmd}`,
                    timestamp: new Date(),
                }))
            } else if (command.startsWith('echo ')) {
                outputLines = [
                    { id: `o-${Date.now()}`, type: 'output', content: command.slice(5), timestamp: new Date() },
                ]
            } else if (command === 'ls') {
                outputLines = [
                    { id: `o-${Date.now()}`, type: 'output', content: '\x1b[34mnode_modules\x1b[0m  \x1b[34msrc\x1b[0m  \x1b[34mpublic\x1b[0m  package.json  tsconfig.json  README.md', timestamp: new Date() },
                ]
            } else {
                outputLines = [
                    { id: `o-${Date.now()}`, type: 'info', content: `Executing: ${command}...`, timestamp: new Date() },
                    { id: `o2-${Date.now()}`, type: 'success', content: 'Command completed successfully', timestamp: new Date() },
                ]
            }

            setTabs(prev =>
                prev.map(tab =>
                    tab.id === activeTabId
                        ? { ...tab, output: [...tab.output, ...outputLines] }
                        : tab
                )
            )
        }, 100)
    }, [activeTabId, activeTab])

    // Navigate history
    const navigateHistory = useCallback((direction: 'up' | 'down') => {
        setTabs(prev =>
            prev.map(tab => {
                if (tab.id !== activeTabId) return tab

                let newIndex = tab.historyIndex
                if (direction === 'up') {
                    newIndex = Math.min(tab.history.length - 1, newIndex + 1)
                } else {
                    newIndex = Math.max(-1, newIndex - 1)
                }

                return { ...tab, historyIndex: newIndex }
            })
        )
    }, [activeTabId])

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-white">Terminal</span>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setSplitView(!splitView)}
                        className={`p-1.5 transition-colors ${splitView ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}
                        title="Split view"
                    >
                        <SplitSquareHorizontal className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title={isMaximized ? 'Restore' : 'Maximize'}
                    >
                        {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <TerminalTabs
                tabs={tabs}
                activeTab={activeTabId}
                onSelect={setActiveTabId}
                onClose={closeTab}
                onCreate={createTab}
            />

            {/* Terminal content */}
            <div className="flex-1 overflow-hidden">
                {splitView && tabs.length >= 2 ? (
                    <div className="grid grid-cols-2 h-full divide-x divide-white/5">
                        {tabs.slice(0, 2).map(tab => (
                            <TerminalInstance
                                key={tab.id}
                                tab={tab}
                                onCommand={(cmd) => {
                                    setActiveTabId(tab.id)
                                    executeCommand(cmd)
                                }}
                                onHistoryNavigate={navigateHistory}
                                theme={theme}
                            />
                        ))}
                    </div>
                ) : (
                    activeTab && (
                        <TerminalInstance
                            tab={activeTab}
                            onCommand={executeCommand}
                            onHistoryNavigate={navigateHistory}
                            theme={theme}
                        />
                    )
                )}
            </div>
        </div>
    )
}
