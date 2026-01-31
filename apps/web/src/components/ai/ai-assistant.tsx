/**
 * SprintLoop AI Assistant Panel System
 * 
 * Phase 1801-1850: AI assistant
 * - Chat interface
 * - Code suggestions
 * - Context awareness
 * - Inline completions
 * - Action buttons
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
    Sparkles,
    Send,
    Copy,
    Check,
    ThumbsUp,
    ThumbsDown,
    RotateCcw,
    Code,
    FileText,
    Terminal,
    Lightbulb,
    ChevronDown,
    ChevronUp,
    Settings,
    X,
    Loader2,
    User,
    Bot,
    Plus
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type MessageRole = 'user' | 'assistant' | 'system'

interface ChatMessage {
    id: string
    role: MessageRole
    content: string
    timestamp: Date
    codeBlocks?: CodeBlock[]
    isStreaming?: boolean
}

interface CodeBlock {
    language: string
    code: string
    fileName?: string
}

interface QuickAction {
    id: string
    label: string
    icon: React.ReactNode
    prompt: string
}

// ============================================================================
// CODE BLOCK DISPLAY
// ============================================================================

interface CodeBlockDisplayProps {
    block: CodeBlock
    onCopy: () => void
    onInsert?: () => void
    onApply?: () => void
}

function CodeBlockDisplay({ block, onCopy, onInsert, onApply }: CodeBlockDisplayProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(block.code)
        setCopied(true)
        onCopy()
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="rounded-lg overflow-hidden border border-white/10 my-2">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800">
                <div className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-xs text-gray-400">{block.language}</span>
                    {block.fileName && (
                        <span className="text-xs text-gray-600">• {block.fileName}</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleCopy}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="Copy code"
                    >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    {onInsert && (
                        <button
                            onClick={onInsert}
                            className="px-2 py-0.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                        >
                            Insert
                        </button>
                    )}
                    {onApply && (
                        <button
                            onClick={onApply}
                            className="px-2 py-0.5 text-xs text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 rounded transition-colors"
                        >
                            Apply
                        </button>
                    )}
                </div>
            </div>

            {/* Code */}
            <pre className="p-3 bg-slate-900/50 overflow-x-auto">
                <code className="text-sm text-gray-300 font-mono">{block.code}</code>
            </pre>
        </div>
    )
}

// ============================================================================
// CHAT MESSAGE
// ============================================================================

interface ChatMessageDisplayProps {
    message: ChatMessage
    onCopy?: () => void
    onRegenerate?: () => void
    onFeedback?: (positive: boolean) => void
}

function ChatMessageDisplay({
    message,
    onCopy,
    onRegenerate,
    onFeedback,
}: ChatMessageDisplayProps) {
    const [expanded, setExpanded] = useState(true)
    const isAssistant = message.role === 'assistant'

    // Parse code blocks from content
    const parseContent = (content: string) => {
        const parts: (string | CodeBlock)[] = []
        const regex = /```(\w+)?\n([\s\S]*?)```/g
        let lastIndex = 0
        let match

        while ((match = regex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push(content.slice(lastIndex, match.index))
            }
            parts.push({
                language: match[1] || 'plaintext',
                code: match[2].trim(),
            })
            lastIndex = match.index + match[0].length
        }

        if (lastIndex < content.length) {
            parts.push(content.slice(lastIndex))
        }

        return parts
    }

    const contentParts = parseContent(message.content)

    return (
        <div className={`group py-4 ${isAssistant ? 'bg-slate-800/30' : ''}`}>
            <div className="px-4 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isAssistant ? 'bg-purple-500/20' : 'bg-blue-500/20'
                        }`}>
                        {isAssistant ? (
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                            <User className="w-3.5 h-3.5 text-blue-400" />
                        )}
                    </div>
                    <span className="text-sm font-medium text-white">
                        {isAssistant ? 'Assistant' : 'You'}
                    </span>
                    <span className="text-xs text-gray-600">
                        {message.timestamp.toLocaleTimeString()}
                    </span>

                    {message.isStreaming && (
                        <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                    )}
                </div>

                {/* Content */}
                <div className="pl-8 space-y-2">
                    {contentParts.map((part, i) => (
                        typeof part === 'string' ? (
                            <p key={i} className="text-sm text-gray-300 whitespace-pre-wrap">
                                {part}
                            </p>
                        ) : (
                            <CodeBlockDisplay
                                key={i}
                                block={part}
                                onCopy={() => onCopy?.()}
                            />
                        )
                    ))}
                </div>

                {/* Actions */}
                {isAssistant && !message.isStreaming && (
                    <div className="flex items-center gap-2 pl-8 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onFeedback?.(true)}
                            className="p-1.5 text-gray-500 hover:text-green-400 hover:bg-white/5 rounded transition-colors"
                            title="Helpful"
                        >
                            <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onFeedback?.(false)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors"
                            title="Not helpful"
                        >
                            <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={onRegenerate}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Regenerate"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={onCopy}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Copy"
                        >
                            <Copy className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

const defaultQuickActions: QuickAction[] = [
    { id: 'explain', label: 'Explain', icon: <Lightbulb className="w-4 h-4" />, prompt: 'Explain this code:' },
    { id: 'refactor', label: 'Refactor', icon: <Code className="w-4 h-4" />, prompt: 'Refactor this code:' },
    { id: 'tests', label: 'Write tests', icon: <FileText className="w-4 h-4" />, prompt: 'Write tests for:' },
    { id: 'fix', label: 'Fix bugs', icon: <Terminal className="w-4 h-4" />, prompt: 'Fix the bugs in:' },
]

// ============================================================================
// AI ASSISTANT PANEL
// ============================================================================

interface AIAssistantPanelProps {
    messages?: ChatMessage[]
    onSendMessage?: (message: string) => void
    onRegenerate?: (messageId: string) => void
    onFeedback?: (messageId: string, positive: boolean) => void
    onClear?: () => void
    isLoading?: boolean
    className?: string
}

export function AIAssistantPanel({
    messages: propMessages,
    onSendMessage,
    onRegenerate,
    onFeedback,
    onClear,
    isLoading = false,
    className = '',
}: AIAssistantPanelProps) {
    const [input, setInput] = useState('')
    const [showQuickActions, setShowQuickActions] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Demo messages
    const defaultMessages: ChatMessage[] = [
        {
            id: 'm1',
            role: 'assistant',
            content: "Hi! I'm your AI coding assistant. I can help you with:\n\n• Explaining code\n• Writing new features\n• Debugging issues\n• Generating tests\n• Refactoring\n\nSelect some code and ask me a question, or just type below!",
            timestamp: new Date(),
        },
    ]

    const messages = propMessages || defaultMessages

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Handle send
    const handleSend = useCallback(() => {
        if (input.trim() && !isLoading) {
            onSendMessage?.(input.trim())
            setInput('')
            setShowQuickActions(false)
        }
    }, [input, isLoading, onSendMessage])

    // Handle keyboard
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Handle quick action
    const handleQuickAction = (action: QuickAction) => {
        setInput(action.prompt + ' ')
        inputRef.current?.focus()
    }

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-medium text-white">AI Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => { }}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                    {messages.length > 1 && (
                        <button
                            onClick={onClear}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                            title="New chat"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto">
                {messages.map(message => (
                    <ChatMessageDisplay
                        key={message.id}
                        message={message}
                        onRegenerate={() => onRegenerate?.(message.id)}
                        onFeedback={(positive) => onFeedback?.(message.id, positive)}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            {showQuickActions && messages.length <= 1 && (
                <div className="px-4 py-2 border-t border-white/5">
                    <div className="flex flex-wrap gap-2">
                        {defaultQuickActions.map(action => (
                            <button
                                key={action.id}
                                onClick={() => handleQuickAction(action)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                {action.icon}
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="px-4 py-3 border-t border-white/5">
                <div className="relative">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything about your code..."
                        rows={1}
                        className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500 transition-colors"
                        style={{ minHeight: '46px', maxHeight: '120px' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <p className="mt-2 text-xs text-center text-gray-600">
                    AI can make mistakes. Verify important information.
                </p>
            </div>
        </div>
    )
}

// ============================================================================
// INLINE COMPLETION
// ============================================================================

interface InlineCompletionProps {
    suggestion: string
    onAccept: () => void
    onDismiss: () => void
    className?: string
}

export function InlineCompletion({
    suggestion,
    onAccept,
    onDismiss,
    className = '',
}: InlineCompletionProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                e.preventDefault()
                onAccept()
            } else if (e.key === 'Escape') {
                onDismiss()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [onAccept, onDismiss])

    return (
        <div className={`inline-flex items-center ${className}`}>
            <span className="text-gray-500/60 italic">{suggestion}</span>
            <span className="ml-2 px-1 py-0.5 bg-gray-800 text-gray-500 text-xs rounded">
                Tab to accept
            </span>
        </div>
    )
}
