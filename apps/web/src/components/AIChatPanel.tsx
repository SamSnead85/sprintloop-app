import { useEffect, useRef, useCallback, useState } from 'react'
import { Sparkles, Send, Loader2, AlertCircle, Trash2, Settings as SettingsIcon } from 'lucide-react'
import { useChatStore } from '../stores/chat-store'
import { useUserStore } from '../stores/user-store'
import { ModelSelector } from './ModelSelector'
import { AI_MODELS, type AIModel } from '../config/models'
import { getApiKeyStatus } from '../lib/ai/provider'

/**
 * AI Chat Panel with real AI integration
 * Uses Vercel AI SDK for streaming responses from Claude/GPT/Gemini
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
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const apiKeyStatus = getApiKeyStatus()

    // Find the selected model object
    const selectedModel = AI_MODELS.find(m => m.id === preferredModel) || AI_MODELS[0]

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, streamingContent])

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!input.trim() || isStreaming) return

        const content = input.trim()
        setInput('')
        await sendMessage(content)
    }, [input, isStreaming, sendMessage])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    const handleModelChange = (model: AIModel) => {
        setPreferredModel(model.id as typeof preferredModel)
    }

    // Show API key setup if no keys configured
    if (!apiKeyStatus.anyConfigured) {
        return (
            <div className="h-full flex flex-col">
                <div className="h-10 flex items-center justify-between px-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-white">AI Assistant</span>
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center max-w-sm">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <SettingsIcon className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">API Keys Required</h3>
                        <p className="text-sm text-gray-400 mb-4">
                            To use AI features, add your API keys to a <code className="text-purple-400">.env.local</code> file:
                        </p>
                        <div className="text-left bg-slate-800/50 rounded-lg p-3 text-xs font-mono text-gray-300">
                            <div className="text-gray-500"># At least one required:</div>
                            <div>VITE_ANTHROPIC_API_KEY=sk-ant-...</div>
                            <div>VITE_OPENAI_API_KEY=sk-...</div>
                            <div>VITE_GOOGLE_AI_API_KEY=AI...</div>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            Restart the dev server after adding keys.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-10 flex items-center justify-between px-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">AI Assistant</span>
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
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                            title="Clear chat"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="px-3 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-xs text-red-300 flex-1">{error}</span>
                    <button
                        onClick={clearError}
                        className="text-xs text-red-400 hover:text-red-300"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                            Ask me anything about your code
                        </p>
                        <p className="text-xs text-gray-600">
                            Using {selectedModel.name} by {selectedModel.provider}
                        </p>
                    </div>
                )}

                {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                {/* Streaming indicator */}
                {isStreaming && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        </div>
                        <div className="flex-1 pt-2">
                            {streamingContent ? (
                                <div className="text-sm text-gray-300 whitespace-pre-wrap">
                                    {streamingContent}
                                    <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse" />
                                </div>
                            ) : (
                                <div className="text-sm text-gray-400">Thinking...</div>
                            )}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-white/5">
                <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-purple-500/50">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isStreaming ? "Waiting for response..." : "Ask anything..."}
                        className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                        disabled={isStreaming}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isStreaming}
                        className="text-purple-400 hover:text-purple-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        {isStreaming ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>
                <div className="mt-2 text-xs text-gray-600 text-center">
                    <span className="text-purple-400/60">{selectedModel.name}</span>
                    <span className="mx-1">•</span>
                    <span>Enter to send</span>
                </div>
            </form>
        </div>
    )
}

interface MessageBubbleProps {
    message: {
        id: string
        role: 'user' | 'assistant'
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
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${isUser ? 'bg-blue-500/20' : 'bg-purple-500/20'}
      `}>
                {isUser ? (
                    <span className="text-sm text-blue-400 font-medium">U</span>
                ) : (
                    <Sparkles className="w-4 h-4 text-purple-400" />
                )}
            </div>
            <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
                <div className={`
          inline-block p-3 rounded-lg text-sm
          ${isUser
                        ? 'bg-blue-500/20 text-white text-left'
                        : 'bg-white/5 text-gray-300'
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
