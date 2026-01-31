/**
 * SprintLoop AI Chat Interface Pro
 * 
 * Phase 851-900: Advanced AI chat features
 * - Multi-turn conversations
 * - Code generation with streaming
 * - Context-aware suggestions
 * - Code diff preview
 * - Apply/reject changes
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
    Send,
    Sparkles,
    Code,
    FileCode,
    Copy,
    Check,
    X,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    Wand2,
    Bug,
    Zap,
    MessageSquare,
    User,
    Bot,
    Loader,
    Plus,
    Trash2
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface Message {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    isStreaming?: boolean
    codeBlocks?: CodeBlock[]
    suggestions?: string[]
}

interface CodeBlock {
    language: string
    code: string
    filename?: string
    diff?: {
        original: string
        modified: string
    }
}

interface Conversation {
    id: string
    title: string
    messages: Message[]
    createdAt: Date
    updatedAt: Date
}

interface AIChatState {
    conversations: Conversation[]
    activeConversationId: string | null
    isStreaming: boolean
    model: string
}

// ============================================================================
// CODE BLOCK COMPONENT
// ============================================================================

interface CodeBlockDisplayProps {
    codeBlock: CodeBlock
    onApply?: (code: string) => void
    onCopy?: (code: string) => void
}

function CodeBlockDisplay({ codeBlock, onApply, onCopy }: CodeBlockDisplayProps) {
    const [isCopied, setIsCopied] = useState(false)
    const [showDiff, setShowDiff] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(codeBlock.code)
        setIsCopied(true)
        onCopy?.(codeBlock.code)
        setTimeout(() => setIsCopied(false), 2000)
    }

    return (
        <div className="my-3 rounded-lg overflow-hidden bg-slate-800/50 border border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-mono text-gray-400">
                        {codeBlock.filename || codeBlock.language}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {codeBlock.diff && (
                        <button
                            onClick={() => setShowDiff(!showDiff)}
                            className="p-1.5 text-gray-500 hover:text-white transition-colors"
                            title={showDiff ? 'Show code' : 'Show diff'}
                        >
                            {showDiff ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    )}
                    <button
                        onClick={handleCopy}
                        className="p-1.5 text-gray-500 hover:text-white transition-colors"
                        title="Copy code"
                    >
                        {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {onApply && (
                        <button
                            onClick={() => onApply(codeBlock.code)}
                            className="ml-2 px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-400 transition-colors"
                        >
                            Apply
                        </button>
                    )}
                </div>
            </div>

            {/* Code content */}
            <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-gray-300">
                    {showDiff && codeBlock.diff ? (
                        <DiffView original={codeBlock.diff.original} modified={codeBlock.diff.modified} />
                    ) : (
                        <code>{codeBlock.code}</code>
                    )}
                </pre>
            </div>
        </div>
    )
}

// ============================================================================
// DIFF VIEW
// ============================================================================

interface DiffViewProps {
    original: string
    modified: string
}

function DiffView({ original, modified }: DiffViewProps) {
    const originalLines = original.split('\n')
    const modifiedLines = modified.split('\n')

    // Simple line-by-line diff (for demo - use real diff algorithm in production)
    const lines: { type: 'add' | 'remove' | 'same'; content: string }[] = []

    const maxLines = Math.max(originalLines.length, modifiedLines.length)

    for (let i = 0; i < maxLines; i++) {
        const origLine = originalLines[i]
        const modLine = modifiedLines[i]

        if (origLine === modLine) {
            lines.push({ type: 'same', content: origLine || '' })
        } else {
            if (origLine !== undefined) {
                lines.push({ type: 'remove', content: origLine })
            }
            if (modLine !== undefined) {
                lines.push({ type: 'add', content: modLine })
            }
        }
    }

    return (
        <div className="space-y-0.5">
            {lines.map((line, i) => (
                <div
                    key={i}
                    className={`
                        px-2 -mx-2
                        ${line.type === 'add' ? 'bg-green-500/20 text-green-400' : ''}
                        ${line.type === 'remove' ? 'bg-red-500/20 text-red-400' : ''}
                        ${line.type === 'same' ? 'text-gray-400' : ''}
                    `}
                >
                    <span className="mr-2 text-gray-600">
                        {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                    </span>
                    {line.content || ' '}
                </div>
            ))}
        </div>
    )
}

// ============================================================================
// MESSAGE COMPONENT
// ============================================================================

interface MessageDisplayProps {
    message: Message
    onApplyCode?: (code: string) => void
    onRetry?: () => void
}

function MessageDisplay({ message, onApplyCode, onRetry }: MessageDisplayProps) {
    const isAssistant = message.role === 'assistant'

    return (
        <div className={`flex gap-3 ${isAssistant ? '' : 'flex-row-reverse'}`}>
            {/* Avatar */}
            <div
                className={`
                    flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                    ${isAssistant ? 'bg-purple-500/20' : 'bg-slate-700'}
                `}
            >
                {isAssistant ? (
                    <Sparkles className="w-4 h-4 text-purple-400" />
                ) : (
                    <User className="w-4 h-4 text-gray-400" />
                )}
            </div>

            {/* Content */}
            <div className={`flex-1 space-y-2 ${isAssistant ? '' : 'text-right'}`}>
                <div
                    className={`
                        inline-block px-4 py-2.5 rounded-xl max-w-[85%]
                        ${isAssistant
                            ? 'bg-slate-800/50 text-gray-200'
                            : 'bg-purple-500 text-white'
                        }
                    `}
                >
                    <div className="text-sm whitespace-pre-wrap">{message.content}</div>

                    {message.isStreaming && (
                        <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse ml-1" />
                    )}
                </div>

                {/* Code blocks */}
                {message.codeBlocks?.map((block, i) => (
                    <CodeBlockDisplay
                        key={i}
                        codeBlock={block}
                        onApply={onApplyCode}
                    />
                ))}

                {/* Suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {message.suggestions.map((suggestion, i) => (
                            <button
                                key={i}
                                className="px-3 py-1.5 bg-slate-800/50 text-gray-400 text-sm rounded-lg hover:bg-white/10 hover:text-white transition-colors border border-white/5"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {/* Actions */}
                {isAssistant && !message.isStreaming && (
                    <div className="flex items-center gap-2 mt-2">
                        <button
                            onClick={onRetry}
                            className="p-1.5 text-gray-500 hover:text-white transition-colors"
                            title="Regenerate"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => navigator.clipboard.writeText(message.content)}
                            className="p-1.5 text-gray-500 hover:text-white transition-colors"
                            title="Copy"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}

                {/* Timestamp */}
                <div className="text-xs text-gray-600">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

interface QuickAction {
    id: string
    label: string
    icon: React.ReactNode
    prompt: string
}

const quickActions: QuickAction[] = [
    { id: 'explain', label: 'Explain code', icon: <Lightbulb className="w-4 h-4" />, prompt: 'Explain this code:' },
    { id: 'refactor', label: 'Refactor', icon: <Wand2 className="w-4 h-4" />, prompt: 'Refactor this code to improve quality:' },
    { id: 'debug', label: 'Find bugs', icon: <Bug className="w-4 h-4" />, prompt: 'Find potential bugs in this code:' },
    { id: 'optimize', label: 'Optimize', icon: <Zap className="w-4 h-4" />, prompt: 'Optimize this code for performance:' },
    { id: 'test', label: 'Write tests', icon: <Code className="w-4 h-4" />, prompt: 'Write unit tests for this code:' },
    { id: 'docs', label: 'Add docs', icon: <FileCode className="w-4 h-4" />, prompt: 'Add JSDoc documentation to this code:' },
]

// ============================================================================
// AI CHAT COMPONENT
// ============================================================================

interface AIChatProps {
    selectedCode?: string
    onApplyCode?: (code: string) => void
    className?: string
}

export function AIChat({ selectedCode, onApplyCode, className = '' }: AIChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)
    const [showQuickActions, setShowQuickActions] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Handle send message
    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || isStreaming) return

        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        }

        setMessages(prev => [...prev, userMessage])
        setInput('')
        setShowQuickActions(false)
        setIsStreaming(true)

        // Simulate AI response with streaming
        const assistantMessage: Message = {
            id: `msg-${Date.now() + 1}`,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isStreaming: true,
        }

        setMessages(prev => [...prev, assistantMessage])

        // Simulate streaming
        const mockResponse = "I'll help you with that. Here's an improved version of the code:\n\nThe key changes include:\n1. Added proper TypeScript types\n2. Implemented error handling\n3. Optimized the algorithm for better performance"

        let currentIndex = 0
        const streamInterval = setInterval(() => {
            if (currentIndex < mockResponse.length) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessage.id
                            ? { ...msg, content: mockResponse.slice(0, currentIndex + 1) }
                            : msg
                    )
                )
                currentIndex++
            } else {
                clearInterval(streamInterval)
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === assistantMessage.id
                            ? {
                                ...msg,
                                isStreaming: false,
                                codeBlocks: [{
                                    language: 'typescript',
                                    code: `function optimizedFunction(data: Data[]): Result {\n  // Optimized implementation\n  return data.reduce((acc, item) => {\n    return { ...acc, [item.id]: processItem(item) };\n  }, {});\n}`,
                                    filename: 'utils.ts',
                                }],
                                suggestions: ['Explain in more detail', 'Add error handling', 'Write tests'],
                            }
                            : msg
                    )
                )
                setIsStreaming(false)
            }
        }, 20)
    }, [isStreaming])

    // Handle quick action
    const handleQuickAction = (action: QuickAction) => {
        const prompt = selectedCode
            ? `${action.prompt}\n\n\`\`\`\n${selectedCode}\n\`\`\``
            : action.prompt
        sendMessage(prompt)
    }

    // Handle keyboard submit
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(input)
        }
    }

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-white">AI Assistant</span>
                </div>
                <button
                    onClick={() => setMessages([])}
                    className="p-1.5 text-gray-500 hover:text-white transition-colors"
                    title="Clear chat"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 && showQuickActions && (
                    <div className="text-center py-8">
                        <Sparkles className="w-12 h-12 text-purple-500/50 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">How can I help?</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Ask me anything about your code or select an action below.
                        </p>

                        {/* Quick actions grid */}
                        <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                            {quickActions.map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => handleQuickAction(action)}
                                    className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border border-white/5 rounded-xl text-left hover:bg-white/5 transition-colors group"
                                >
                                    <span className="text-gray-500 group-hover:text-purple-400 transition-colors">
                                        {action.icon}
                                    </span>
                                    <span className="text-sm text-gray-300">{action.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map(message => (
                    <MessageDisplay
                        key={message.id}
                        message={message}
                        onApplyCode={onApplyCode}
                        onRetry={() => {
                            const userMessage = messages.find(
                                (m, i, arr) => m.role === 'user' && arr[i + 1]?.id === message.id
                            )
                            if (userMessage) {
                                setMessages(prev => prev.slice(0, -1))
                                sendMessage(userMessage.content)
                            }
                        }}
                    />
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* Selected code preview */}
            {selectedCode && (
                <div className="mx-4 mb-2 p-2 bg-slate-800/50 border border-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Selected code</span>
                        <button className="text-gray-500 hover:text-white">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <pre className="text-xs text-gray-400 truncate font-mono">
                        {selectedCode.slice(0, 100)}...
                    </pre>
                </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/5">
                <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything about your code..."
                            rows={1}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500 transition-colors"
                            style={{ minHeight: '48px', maxHeight: '200px' }}
                        />
                    </div>
                    <button
                        onClick={() => sendMessage(input)}
                        disabled={!input.trim() || isStreaming}
                        className="p-3 bg-purple-500 text-white rounded-xl hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isStreaming ? (
                            <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                        Press Enter to send, Shift+Enter for new line
                    </span>
                    <span className="text-xs text-gray-600">
                        Powered by AI
                    </span>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// INLINE AI SUGGESTION
// ============================================================================

interface InlineAISuggestionProps {
    suggestion: string
    position: { x: number; y: number }
    onAccept: () => void
    onReject: () => void
}

export function InlineAISuggestion({
    suggestion,
    position,
    onAccept,
    onReject,
}: InlineAISuggestionProps) {
    return (
        <div
            className="absolute z-50 max-w-md bg-slate-800 border border-purple-500/30 rounded-lg shadow-xl overflow-hidden"
            style={{ left: position.x, top: position.y }}
        >
            <div className="flex items-center justify-between px-3 py-2 bg-purple-500/10 border-b border-purple-500/20">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-300">AI Suggestion</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onReject}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="p-3">
                <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                    {suggestion}
                </pre>
            </div>
            <div className="flex justify-end gap-2 px-3 py-2 border-t border-white/5">
                <button
                    onClick={onReject}
                    className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    Reject
                </button>
                <button
                    onClick={onAccept}
                    className="px-3 py-1.5 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-400 transition-colors"
                >
                    Accept
                </button>
            </div>
        </div>
    )
}
