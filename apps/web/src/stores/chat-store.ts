/**
 * Chat Store
 * Manages AI chat messages with persistence and streaming state
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type ChatMessage, type ModelId, streamChatResponse, isModelAvailable, getFirstAvailableModel } from '../lib/ai/provider'
import { audit } from '../lib/audit/logger'

interface ChatStore {
    // Message state
    messages: ChatMessage[]
    isStreaming: boolean
    streamingContent: string
    currentModel: ModelId
    error: string | null

    // Actions
    sendMessage: (content: string) => Promise<void>
    setModel: (model: ModelId) => void
    clearChat: () => void
    clearError: () => void

    // Internal
    _addMessage: (message: ChatMessage) => void
    _setStreaming: (streaming: boolean, content?: string) => void
    _setError: (error: string | null) => void
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

            // Public actions
            sendMessage: async (content) => {
                const { messages, currentModel, _addMessage, _setStreaming, _setError } = get()

                // Clear any previous error
                _setError(null)

                // Check if model is available
                if (!isModelAvailable(currentModel)) {
                    const fallbackModel = getFirstAvailableModel()
                    if (!fallbackModel) {
                        _setError('No AI models configured. Please add API keys in settings.')
                        return
                    }
                    // Use fallback model
                    set({ currentModel: fallbackModel })
                    audit.modelSwitch(currentModel, fallbackModel)
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

                try {
                    _setStreaming(true, '')

                    // Stream the response
                    for await (const chunk of streamChatResponse([...messages, userMessage], get().currentModel)) {
                        fullContent += chunk
                        _setStreaming(true, fullContent)
                    }

                    // Add completed message
                    const assistantMessage: ChatMessage = {
                        id: assistantMessageId,
                        role: 'assistant',
                        content: fullContent,
                        timestamp: new Date(),
                        modelId: get().currentModel,
                    }
                    _addMessage(assistantMessage)

                    // Log successful response
                    await audit.aiResponse(get().currentModel, fullContent.length, Date.now() - startTime)

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
                        content: `⚠️ Error: ${errorMessage}\n\nPlease check your API key configuration or try a different model.`,
                        timestamp: new Date(),
                        modelId: get().currentModel,
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
