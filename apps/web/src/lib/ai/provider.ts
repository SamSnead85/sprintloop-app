/**
 * Unified AI Provider using Vercel AI SDK
 * Supports Claude 4.5, GPT-5, Gemini 2.5 with runtime model switching
 */
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, generateText } from 'ai'

// Message type for AI SDK
type AIMessage = { role: 'user' | 'assistant'; content: string }

// Model configurations
export const MODEL_CONFIGS = {
    'claude-4.5-sonnet': {
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-20250514',
        displayName: 'Claude 4.5 Sonnet',
    },
    'claude-4.5-opus': {
        provider: 'anthropic',
        modelId: 'claude-opus-4-20250514',
        displayName: 'Claude 4.5 Opus',
    },
    'gpt-5': {
        provider: 'openai',
        modelId: 'gpt-5',
        displayName: 'GPT-5',
    },
    'gpt-4o': {
        provider: 'openai',
        modelId: 'gpt-4o',
        displayName: 'GPT-4o',
    },
    'gemini-2.5-pro': {
        provider: 'google',
        modelId: 'gemini-2.5-pro',
        displayName: 'Gemini 2.5 Pro',
    },
    'gemini-2.5-flash': {
        provider: 'google',
        modelId: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash',
    },
} as const

export type ModelId = keyof typeof MODEL_CONFIGS

// Get API key status
export function getApiKeyStatus(): {
    anthropic: boolean
    openai: boolean
    google: boolean
    anyConfigured: boolean
} {
    const anthropic = !!import.meta.env.VITE_ANTHROPIC_API_KEY
    const openai = !!import.meta.env.VITE_OPENAI_API_KEY
    const google = !!import.meta.env.VITE_GOOGLE_AI_API_KEY

    return {
        anthropic,
        openai,
        google,
        anyConfigured: anthropic || openai || google,
    }
}

// Create provider instances
function getAnthropicProvider() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('Anthropic API key not configured')
    return createAnthropic({ apiKey })
}

function getOpenAIProvider() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) throw new Error('OpenAI API key not configured')
    return createOpenAI({ apiKey })
}

function getGoogleProvider() {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY
    if (!apiKey) throw new Error('Google AI API key not configured')
    return createGoogleGenerativeAI({ apiKey })
}

// Get model instance for a given model ID
export function getModel(modelId: ModelId) {
    const config = MODEL_CONFIGS[modelId]

    switch (config.provider) {
        case 'anthropic':
            return getAnthropicProvider()(config.modelId)
        case 'openai':
            return getOpenAIProvider()(config.modelId)
        case 'google':
            return getGoogleProvider()(config.modelId)
        default:
            throw new Error(`Unknown provider for model: ${modelId}`)
    }
}

// Check if a model is available (API key configured)
export function isModelAvailable(modelId: ModelId): boolean {
    const config = MODEL_CONFIGS[modelId]
    const status = getApiKeyStatus()

    switch (config.provider) {
        case 'anthropic':
            return status.anthropic
        case 'openai':
            return status.openai
        case 'google':
            return status.google
        default:
            return false
    }
}

// Get first available model
export function getFirstAvailableModel(): ModelId | null {
    const modelIds = Object.keys(MODEL_CONFIGS) as ModelId[]
    return modelIds.find(isModelAvailable) || null
}

// System prompt for SprintLoop coding assistant
const SYSTEM_PROMPT = `You are SprintLoop AI, a highly capable coding assistant integrated into an AI-native development workspace.

Your capabilities:
- Write, refactor, and debug code across all languages
- Explain complex concepts clearly
- Help with system design and architecture
- Generate documentation and tests
- Assist with git operations and deployment

Guidelines:
- Be concise but thorough
- Use markdown formatting for code blocks
- When showing code changes, explain the reasoning
- Ask clarifying questions if the request is ambiguous
- Prioritize working, maintainable code

Current context: The user is working in a coding IDE and may reference files or errors visible in their workspace.`

// Types for chat
export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    modelId?: ModelId
}

// Stream chat response
export async function* streamChatResponse(
    messages: ChatMessage[],
    modelId: ModelId
): AsyncGenerator<string> {
    const model = getModel(modelId)

    const aiMessages: AIMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
    }))

    const result = await streamText({
        model,
        system: SYSTEM_PROMPT,
        messages: aiMessages,
    })

    for await (const textPart of result.textStream) {
        yield textPart
    }
}

// Non-streaming chat (for simpler use cases)
export async function generateChatResponse(
    messages: ChatMessage[],
    modelId: ModelId
): Promise<string> {
    const model = getModel(modelId)

    const aiMessages: AIMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
    }))

    const result = await generateText({
        model,
        system: SYSTEM_PROMPT,
        messages: aiMessages,
    })

    return result.text
}
