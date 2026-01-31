import { useEffect, useRef, useCallback, useState } from 'react'
import {
    Sparkles,
    Send,
    Loader2,
    AlertCircle,
    Trash2,
    Settings as SettingsIcon,
    FolderCode,
    FileCode2,
    Globe,
    BookOpen,
    Zap,
    ChevronDown,
    Check
} from 'lucide-react'
import { useChatStore } from '../stores/chat-store'
import { useUserStore } from '../stores/user-store'
import { ModelSelector } from './ModelSelector'
import { AI_MODELS, type AIModel } from '../config/models'
import { getApiKeyStatus } from '../lib/ai/provider'

// Context mention types
const CONTEXT_MENTIONS = [
    { id: 'codebase', label: '@codebase', icon: FolderCode, color: 'text-blue-400', bg: 'bg-blue-500/20', desc: 'Search entire codebase' },
    { id: 'file', label: '@file', icon: FileCode2, color: 'text-green-400', bg: 'bg-green-500/20', desc: 'Reference specific file' },
    { id: 'web', label: '@web', icon: Globe, color: 'text-purple-400', bg: 'bg-purple-500/20', desc: 'Search the web' },
    { id: 'docs', label: '@docs', icon: BookOpen, color: 'text-orange-400', bg: 'bg-orange-500/20', desc: 'Search documentation' },
]

// Quick action suggestions
const QUICK_ACTIONS = [
    { label: 'Explain this code', icon: '💡' },
    { label: 'Find bugs', icon: '🐛' },
    { label: 'Refactor', icon: '✨' },
    { label: 'Add tests', icon: '🧪' },
]

/**
 * AI Chat Panel with real AI integration
 * Uses Vercel AI SDK for streaming responses from Claude/GPT/Gemini
 * Enhanced with context mentions and premium glass morphism
 */
export function AIChatPanel() {
    const {
        messages,
        isStreaming,
        streamingContent,
        error,
        sendMessage,
        clearChat,
        clearError
    } = useChatStore()

    const { preferredModel, setPreferredModel } = useUserStore()

    const [input, setInput] = useState('')
    const [showMentions, setShowMentions] = useState(false)
    const [activeMentions, setActiveMentions] = useState<string[]>([])
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const apiKeyStatus = getApiKeyStatus()

    // Find the selected model object
    const selectedModel = AI_MODELS.find(m => m.id === preferredModel) || AI_MODELS[0]

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, streamingContent])

    // Handle @ trigger for mentions
    useEffect(() => {
        if (input.endsWith('@')) {
            setShowMentions(true)
        } else if (!input.includes('@') || input.endsWith(' ')) {
            setShowMentions(false)
        }
    }, [input])

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isStreaming) return

        // Prepend active mentions to the message
        const mentionPrefix = activeMentions.length > 0
            ? activeMentions.map(m => `@${m}`).join(' ') + ' '
            : ''
        const content = mentionPrefix + input.trim()

        setInput('')
        setActiveMentions([])
        await sendMessage(content)
    }, [input, isStreaming, sendMessage, activeMentions])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        } else if (e.key === 'Escape') {
            setShowMentions(false)
        }
    }

    const handleMentionClick = (mentionId: string) => {
        if (activeMentions.includes(mentionId)) {
            setActiveMentions(activeMentions.filter(m => m !== mentionId))
        } else {
            setActiveMentions([...activeMentions, mentionId])
        }
        // Remove the @ trigger from input
        if (input.endsWith('@')) {
            setInput(input.slice(0, -1))
        }
        setShowMentions(false)
        inputRef.current?.focus()
    }

    const handleQuickAction = (action: string) => {
        setInput(action)
        inputRef.current?.focus()
    }

    const handleModelChange = (model: AIModel) => {
        setPreferredModel(model.id as typeof preferredModel)
    }

    // Show API key setup if no keys configured
    if (!apiKeyStatus.anyConfigured) {
        return (
            <div className="h-full flex flex-col bg-slate-900/50">
                {/* Header */}
                <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 backdrop-blur-xl bg-slate-900/30">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                        </div>
                        <span className="text-sm font-semibold text-white">AI Assistant</span>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center max-w-sm">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
                            <SettingsIcon className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">API Keys Required</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            To use AI features, add your API keys to a <code className="text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">.env.local</code> file:
                        </p>
                        <div className="text-left backdrop-blur-xl bg-slate-800/50 rounded-xl p-4 text-xs font-mono text-gray-300 border border-white/5">
                            <div className="text-gray-500"># At least one required:</div>
                            <div className="text-blue-400">VITE_ANTHROPIC_API_KEY</div>
                            <div className="text-green-400">VITE_OPENAI_API_KEY</div>
                            <div className="text-yellow-400">VITE_GOOGLE_AI_API_KEY</div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col bg-slate-900/50">
            {/* Header - Glass morphism */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 backdrop-blur-xl bg-slate-900/30">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                        </div>
                        {/* AI status indicator */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
                    </div>
                    <span className="text-sm font-semibold text-white">AI Assistant</span>
                </div>
                <div className="flex items-center gap-2">
                    <ModelSelector
                        selectedModel={selectedModel}
                        onModelChange={handleModelChange}
                        compact
                    />
                    {messages.length > 0 && (
                        <button
                            onClick={clearChat}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                            title="Clear chat"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center gap-3 backdrop-blur-xl">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-xs text-red-300 flex-1">{error}</span>
                    <button
                        onClick={clearError}
                        className="text-xs text-red-400 hover:text-red-300 px-2 py-1 hover:bg-red-500/10 rounded transition-colors"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center py-8">
                        {/* Welcome state */}
                        <div className="relative w-16 h-16 mx-auto mb-4">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl opacity-20 blur-xl animate-pulse-slow" />
                            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
                                <Sparkles className="w-8 h-8 text-purple-400" />
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Ready to Assist</h3>
                        <p className="text-sm text-gray-400 mb-6">
                            Ask anything about your code using {selectedModel.name}
                        </p>

                        {/* Quick actions */}
                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                            {QUICK_ACTIONS.map(action => (
                                <button
                                    key={action.label}
                                    onClick={() => handleQuickAction(action.label)}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full border border-white/5 hover:border-white/10 transition-all"
                                >
                                    <span>{action.icon}</span>
                                    <span>{action.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Context mentions hint */}
                        <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-full">
                            <Zap className="w-3.5 h-3.5 text-yellow-500" />
                            <span>Type <kbd className="px-1 bg-white/10 rounded text-gray-400">@</kbd> for context mentions</span>
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {/* Streaming indicator */}
                {isStreaming && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        </div>
                        <div className="flex-1 pt-2">
                            {streamingContent ? (
                                <div className="backdrop-blur-xl bg-white/5 rounded-lg rounded-tl-none p-3 border border-white/5">
                                    <div className="text-sm text-gray-300 whitespace-pre-wrap">
                                        {streamingContent}
                                        <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse rounded-sm" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                    <span>Thinking...</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Premium glass morphism */}
            <div className="p-3 border-t border-white/5 backdrop-blur-xl bg-slate-900/30">
                {/* Active context mentions */}
                {activeMentions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                        {activeMentions.map(mentionId => {
                            const mention = CONTEXT_MENTIONS.find(m => m.id === mentionId)
                            if (!mention) return null
                            const Icon = mention.icon
                            return (
                                <button
                                    key={mentionId}
                                    onClick={() => handleMentionClick(mentionId)}
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs ${mention.color} ${mention.bg} rounded-md border border-white/10 hover:border-white/20 transition-all group`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{mention.label}</span>
                                    <span className="text-gray-500 group-hover:text-white">×</span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Mention picker dropdown */}
                {showMentions && (
                    <div className="absolute bottom-full left-3 right-3 mb-2 backdrop-blur-xl bg-slate-800/95 rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50">
                        <div className="p-2 text-xs text-gray-500 border-b border-white/5">Add context</div>
                        {CONTEXT_MENTIONS.map(mention => {
                            const Icon = mention.icon
                            const isActive = activeMentions.includes(mention.id)
                            return (
                                <button
                                    key={mention.id}
                                    onClick={() => handleMentionClick(mention.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors ${isActive ? 'bg-white/5' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg ${mention.bg} flex items-center justify-center`}>
                                        <Icon className={`w-4 h-4 ${mention.color}`} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className={`text-sm font-medium ${mention.color}`}>{mention.label}</div>
                                        <div className="text-xs text-gray-500">{mention.desc}</div>
                                    </div>
                                    {isActive && <Check className="w-4 h-4 text-green-400" />}
                                </button>
                            )
                        })}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="relative">
                    <div className="flex items-center gap-3 backdrop-blur-xl bg-white/5 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-purple-500/30 border border-white/5 focus-within:border-purple-500/30 transition-all">
                        {/* Context button */}
                        <button
                            type="button"
                            onClick={() => setShowMentions(!showMentions)}
                            className="text-gray-500 hover:text-white transition-colors"
                            title="Add context"
                        >
                            <ChevronDown className={`w-5 h-5 transition-transform ${showMentions ? 'rotate-180' : ''}`} />
                        </button>

                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isStreaming ? "Waiting for response..." : "Ask anything... (@ for context)"}
                            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                            disabled={isStreaming}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isStreaming}
                            className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                        >
                            {isStreaming ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </form>

                {/* Status bar */}
                <div className="flex items-center justify-between mt-2 px-1 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
                        <span className="text-purple-400/60">{selectedModel.name}</span>
                    </div>
                    <span>⏎ Send</span>
                </div>
            </div>
        </div>
    )
}

interface MessageBubbleProps {
    message: {
        id: string
        role: 'user' | 'assistant' | 'system'
        content: string
        timestamp: Date
        modelId?: string
    }
}

function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user'

    return (
        <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border
                ${isUser
                    ? 'bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border-blue-500/20'
                    : 'bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-purple-500/20'
                }
            `}>
                {isUser ? (
                    <span className="text-sm text-blue-400 font-medium">U</span>
                ) : (
                    <Sparkles className="w-4 h-4 text-purple-400" />
                )}
            </div>
            <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
                <div className={`
                    inline-block p-3 rounded-xl text-sm backdrop-blur-xl border
                    ${isUser
                        ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-white text-left border-blue-500/20 rounded-tr-none'
                        : 'bg-white/5 text-gray-300 border-white/5 rounded-tl-none'
                    }
                `}>
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                </div>
                <div className={`text-[10px] text-gray-600 mt-1 ${isUser ? 'text-right' : ''}`}>
                    {message.timestamp instanceof Date
                        ? message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    }
                    {message.modelId && !isUser && (
                        <span className="ml-2 text-purple-400/50">{message.modelId}</span>
                    )}
                </div>
            </div>
        </div>
    )
}
