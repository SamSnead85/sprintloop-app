/**
 * Unified AI Provider with Compliance-Aware Routing
 * Combines cloud providers (Claude, GPT, Gemini) with on-prem (Ollama, vLLM)
 * Automatically routes based on compliance requirements
 */
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamText, generateText } from 'ai'
import { routeRequest, categorizeTask, type RoutingResult } from './compliance-router'
import { createOnPremModel, getOnPremConfig, type OnPremModelConfig } from './on-prem-provider'

// Message type for AI SDK
type AIMessage = { role: 'user' | 'assistant'; content: string }

// Model configurations (cloud)
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
    onprem: boolean
    anyConfigured: boolean
} {
    const anthropic = !!import.meta.env.VITE_ANTHROPIC_API_KEY
    const openai = !!import.meta.env.VITE_OPENAI_API_KEY
    const google = !!import.meta.env.VITE_GOOGLE_AI_API_KEY
    const onprem = getOnPremConfig().enabled

    return {
        anthropic,
        openai,
        google,
        onprem,
        anyConfigured: anthropic || openai || google || onprem,
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

// Get model instance for a given model ID (cloud only)
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

// Get model instance for on-prem
export function getOnPremModelInstance(config: OnPremModelConfig) {
    return createOnPremModel(config)
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

// Enhanced system prompt for compliance-sensitive contexts
const COMPLIANCE_SYSTEM_PROMPT = `${SYSTEM_PROMPT}

IMPORTANT: This is a compliance-sensitive context. Follow these additional guidelines:
- Do not include any personally identifiable information (PII) in responses
- Do not reference specific customer names, account numbers, or financial data
- Code should follow security best practices
- Any data processing suggestions must comply with data governance policies`

// Types for chat
export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    modelId?: ModelId | string
    modelType?: 'cloud' | 'onprem'
    routingInfo?: RoutingResult
}

// Stream chat response with compliance-aware routing
export async function* streamChatWithCompliance(
    messages: ChatMessage[],
    userMessage: string,
    preferredModelId?: ModelId
): AsyncGenerator<{ chunk: string; routingResult?: RoutingResult }> {
    // Route the request based on compliance rules
    const routingResult = await routeRequest({
        task: userMessage,
        userPreferredModel: preferredModelId,
    })

    // Yield routing info first
    yield { chunk: '', routingResult }

    const aiMessages: AIMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
    }))

    // Select system prompt based on compliance context
    const systemPrompt = routingResult.complianceNotes.some(n => n.includes('confidential') || n.includes('production'))
        ? COMPLIANCE_SYSTEM_PROMPT
        : SYSTEM_PROMPT

    try {
        if (routingResult.modelType === 'onprem') {
            // Use on-prem model
            const onPremConfig = routingResult.modelConfig as OnPremModelConfig
            const model = getOnPremModelInstance(onPremConfig)

            console.log(`[AI Provider] Using on-prem model: ${onPremConfig.displayName}`)

            const result = await streamText({
                model,
                system: systemPrompt,
                messages: aiMessages,
            })

            for await (const textPart of result.textStream) {
                yield { chunk: textPart }
            }
        } else {
            // Use cloud model
            const cloudModelId = routingResult.modelId as ModelId
            const model = getModel(cloudModelId)

            console.log(`[AI Provider] Using cloud model: ${MODEL_CONFIGS[cloudModelId].displayName}`)

            const result = await streamText({
                model,
                system: systemPrompt,
                messages: aiMessages,
            })

            for await (const textPart of result.textStream) {
                yield { chunk: textPart }
            }
        }
    } catch (error) {
        console.error('[AI Provider] Streaming error:', error)
        throw error
    }
}

// Original streaming function (for backwards compatibility)
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

// Generate with compliance routing
export async function generateWithCompliance(
    messages: ChatMessage[],
    userMessage: string
): Promise<{ text: string; routingResult: RoutingResult }> {
    const routingResult = await routeRequest({
        task: userMessage,
    })

    const aiMessages: AIMessage[] = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
    }))

    const systemPrompt = routingResult.complianceNotes.some(n => n.includes('confidential'))
        ? COMPLIANCE_SYSTEM_PROMPT
        : SYSTEM_PROMPT

    let text: string

    if (routingResult.modelType === 'onprem') {
        const onPremConfig = routingResult.modelConfig as OnPremModelConfig
        const model = getOnPremModelInstance(onPremConfig)

        const result = await generateText({
            model,
            system: systemPrompt,
            messages: aiMessages,
        })
        text = result.text
    } else {
        const cloudModelId = routingResult.modelId as ModelId
        const model = getModel(cloudModelId)

        const result = await generateText({
            model,
            system: systemPrompt,
            messages: aiMessages,
        })
        text = result.text
    }

    return { text, routingResult }
}

// Utility: Get model display name
export function getModelDisplayName(modelId: string, modelType?: 'cloud' | 'onprem'): string {
    if (modelType === 'onprem' || modelId.startsWith('ollama:') || modelId.startsWith('vllm:')) {
        // Parse on-prem model ID
        const parts = modelId.split(':')
        return parts[1] || modelId
    }

    const config = MODEL_CONFIGS[modelId as ModelId]
    return config?.displayName || modelId
}

// Utility: Get task category for UI display
export { categorizeTask }
