/**
 * Chat Store
 * Manages AI chat messages with persistence and streaming state
 * Supports compliance-aware routing to on-prem or cloud models
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type ChatMessage, type ModelId, streamChatWithCompliance, getApiKeyStatus } from '../lib/ai/provider'
import { type RoutingResult } from '../lib/ai/compliance-router'
import { audit } from '../lib/audit/logger'

interface ChatStore {
    // Message state
    messages: ChatMessage[]
    isStreaming: boolean
    streamingContent: string
    currentModel: ModelId
    error: string | null
    lastRoutingResult: RoutingResult | null

    // Actions
    sendMessage: (content: string) => Promise<void>
    setModel: (model: ModelId) => void
    clearChat: () => void
    clearError: () => void

    // Internal
    _addMessage: (message: ChatMessage) => void
    _setStreaming: (streaming: boolean, content?: string) => void
    _setError: (error: string | null) => void
    _setRoutingResult: (result: RoutingResult | null) => void
}

export const useChatStore = create<ChatStore>()(
    persist(
        (set, get) => ({
            // Initial state
            messages: [],
            isStreaming: false,
            streamingContent: '',
            currentModel: 'claude-4.5-sonnet',
            error: null,
            lastRoutingResult: null,

            // Internal actions
            _addMessage: (message) => {
                set((state) => ({
                    messages: [...state.messages, message],
                }))
            },

            _setStreaming: (streaming, content = '') => {
                set({ isStreaming: streaming, streamingContent: content })
            },

            _setError: (error) => {
                set({ error })
            },

            _setRoutingResult: (result) => {
                set({ lastRoutingResult: result })
            },

            // Public actions
            sendMessage: async (content) => {
                const { messages, currentModel, _addMessage, _setStreaming, _setError, _setRoutingResult } = get()

                // Clear any previous error and routing result
                _setError(null)
                _setRoutingResult(null)

                // Check if any model is available
                const apiStatus = getApiKeyStatus()
                if (!apiStatus.anyConfigured) {
                    _setError('No AI models configured. Please add API keys or enable on-prem models in settings.')
                    return
                }

                // Create user message
                const userMessage: ChatMessage = {
                    id: `msg-${Date.now()}-user`,
                    role: 'user',
                    content,
                    timestamp: new Date(),
                    modelId: currentModel,
                }
                _addMessage(userMessage)

                // Log AI request
                await audit.aiRequest(content, currentModel)
                const startTime = Date.now()

                // Create placeholder for assistant message
                const assistantMessageId = `msg-${Date.now()}-assistant`
                let fullContent = ''
                let routingResult: RoutingResult | null = null

                try {
                    _setStreaming(true, '')

                    // Stream with compliance-aware routing
                    for await (const { chunk, routingResult: result } of streamChatWithCompliance(
                        [...messages, userMessage],
                        content,
                        currentModel
                    )) {
                        // Capture routing result on first yield
                        if (result && !routingResult) {
                            routingResult = result
                            _setRoutingResult(result)
                            console.log('[Chat] Routed to:', result.modelType, result.modelId, result.reason)
                        }

                        // Accumulate content
                        if (chunk) {
                            fullContent += chunk
                            _setStreaming(true, fullContent)
                        }
                    }

                    // Add completed message with routing info
                    const assistantMessage: ChatMessage = {
                        id: assistantMessageId,
                        role: 'assistant',
                        content: fullContent,
                        timestamp: new Date(),
                        modelId: routingResult?.modelId || currentModel,
                        modelType: routingResult?.modelType,
                        routingInfo: routingResult || undefined,
                    }
                    _addMessage(assistantMessage)

                    // Log successful response
                    const modelUsed = routingResult?.modelId || currentModel
                    await audit.aiResponse(modelUsed, fullContent.length, Date.now() - startTime)

                } catch (error) {
                    console.error('AI response error:', error)

                    const errorMessage = error instanceof Error
                        ? error.message
                        : 'Failed to get AI response'

                    _setError(errorMessage)

                    // Add error message to chat
                    const errorAssistantMessage: ChatMessage = {
                        id: assistantMessageId,
                        role: 'assistant',
                        content: `⚠️ Error: ${errorMessage}\n\n${routingResult?.modelType === 'onprem'
                            ? 'On-prem model connection failed. Check Ollama is running and configured correctly.'
                            : 'Please check your API key configuration or try a different model.'
                            }`,
                        timestamp: new Date(),
                        modelId: routingResult?.modelId || currentModel,
                        modelType: routingResult?.modelType,
                    }
                    _addMessage(errorAssistantMessage)

                } finally {
                    _setStreaming(false, '')
                }
            },

            setModel: (model) => {
                const previous = get().currentModel
                set({ currentModel: model })
                if (previous !== model) {
                    audit.modelSwitch(previous, model)
                }
            },

            clearChat: () => {
                set({ messages: [], error: null })
            },

            clearError: () => {
                set({ error: null })
            },
        }),
        {
            name: 'sprintloop:chat-history',
            partialize: (state) => ({
                messages: state.messages.slice(-50), // Keep last 50 messages
                currentModel: state.currentModel,
            }),
        }
    )
)
