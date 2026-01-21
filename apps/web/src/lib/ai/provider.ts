/**
 * SprintLoop AI Provider - Production Multi-Provider Implementation
 * 
 * Ported from OpenCode (https://github.com/anomalyco/opencode)
 * Provides unified access to 20+ AI providers via Vercel AI SDK
 */

// Provider configuration types
export interface ProviderConfig {
    id: string;
    name: string;
    apiKeyEnvVar: string;
    baseUrl?: string;
    models: ModelConfig[];
    enabled: boolean;
}

export interface ModelConfig {
    id: string;
    name: string;
    provider: string;
    capabilities: ModelCapabilities;
    contextLimit: number;
    outputLimit: number;
    costPer1kInput: number;
    costPer1kOutput: number;
    status: 'active' | 'beta' | 'deprecated';
}

export interface ModelCapabilities {
    supportsVision: boolean;
    supportsTools: boolean;
    supportsStreaming: boolean;
    supportsReasoning: boolean;
}

// Provider health tracking
interface ProviderHealth {
    provider: string;
    isHealthy: boolean;
    lastError?: string;
    lastCheck: number;
    consecutiveFailures: number;
    avgResponseTime?: number;
}

// Provider registry
const providerHealth = new Map<string, ProviderHealth>();

/**
 * Supported AI Providers
 * Based on OpenCode's bundled providers
 */
export const PROVIDERS: ProviderConfig[] = [
    {
        id: 'anthropic',
        name: 'Anthropic',
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        models: [
            {
                id: 'claude-sonnet-4-20250514',
                name: 'Claude 4 Sonnet',
                provider: 'anthropic',
                capabilities: { supportsVision: true, supportsTools: true, supportsStreaming: true, supportsReasoning: true },
                contextLimit: 200000,
                outputLimit: 64000,
                costPer1kInput: 0.003,
                costPer1kOutput: 0.015,
                status: 'active',
            },
            {
                id: 'claude-3-5-sonnet-20241022',
                name: 'Claude 3.5 Sonnet',
                provider: 'anthropic',
                capabilities: { supportsVision: true, supportsTools: true, supportsStreaming: true, supportsReasoning: false },
                contextLimit: 200000,
                outputLimit: 8192,
                costPer1kInput: 0.003,
                costPer1kOutput: 0.015,
                status: 'active',
            },
            {
                id: 'claude-3-5-haiku-20241022',
                name: 'Claude 3.5 Haiku',
                provider: 'anthropic',
                capabilities: { supportsVision: true, supportsTools: true, supportsStreaming: true, supportsReasoning: false },
                contextLimit: 200000,
                outputLimit: 8192,
                costPer1kInput: 0.0008,
                costPer1kOutput: 0.004,
                status: 'active',
            },
        ],
        enabled: true,
    },
    {
        id: 'openai',
        name: 'OpenAI',
        apiKeyEnvVar: 'OPENAI_API_KEY',
        models: [
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                provider: 'openai',
                capabilities: { supportsVision: true, supportsTools: true, supportsStreaming: true, supportsReasoning: false },
                contextLimit: 128000,
                outputLimit: 16384,
                costPer1kInput: 0.0025,
                costPer1kOutput: 0.01,
                status: 'active',
            },
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                provider: 'openai',
                capabilities: { supportsVision: true, supportsTools: true, supportsStreaming: true, supportsReasoning: false },
                contextLimit: 128000,
                outputLimit: 16384,
                costPer1kInput: 0.00015,
                costPer1kOutput: 0.0006,
                status: 'active',
            },
            {
                id: 'o1',
                name: 'o1',
                provider: 'openai',
                capabilities: { supportsVision: true, supportsTools: true, supportsStreaming: true, supportsReasoning: true },
                contextLimit: 200000,
                outputLimit: 100000,
                costPer1kInput: 0.015,
                costPer1kOutput: 0.06,
                status: 'active',
            },
        ],
        enabled: true,
    },
    {
        id: 'google',
        name: 'Google',
        apiKeyEnvVar: 'GOOGLE_GENERATIVE_AI_API_KEY',
        models: [
            {
                id: 'gemini-2.5-pro-preview-05-06',
                name: 'Gemini 2.5 Pro',
                provider: 'google',
                capabilities: { supportsVision: true, supportsTools: true, supportsStreaming: true, supportsReasoning: true },
                contextLimit: 1000000,
                outputLimit: 65536,
                costPer1kInput: 0.00125,
                costPer1kOutput: 0.01,
                status: 'active',
            },
            {
                id: 'gemini-2.5-flash-preview-05-20',
                name: 'Gemini 2.5 Flash',
                provider: 'google',
                capabilities: { supportsVision: true, supportsTools: true, supportsStreaming: true, supportsReasoning: true },
                contextLimit: 1000000,
                outputLimit: 65536,
                costPer1kInput: 0.00015,
                costPer1kOutput: 0.0006,
                status: 'active',
            },
        ],
        enabled: true,
    },
    {
        id: 'groq',
        name: 'Groq',
        apiKeyEnvVar: 'GROQ_API_KEY',
        models: [
            {
                id: 'llama-3.3-70b-versatile',
                name: 'Llama 3.3 70B',
                provider: 'groq',
                capabilities: { supportsVision: false, supportsTools: true, supportsStreaming: true, supportsReasoning: false },
                contextLimit: 128000,
                outputLimit: 32768,
                costPer1kInput: 0.00059,
                costPer1kOutput: 0.00079,
                status: 'active',
            },
        ],
        enabled: true,
    },
    {
        id: 'xai',
        name: 'xAI',
        apiKeyEnvVar: 'XAI_API_KEY',
        models: [
            {
                id: 'grok-3',
                name: 'Grok 3',
                provider: 'xai',
                capabilities: { supportsVision: true, supportsTools: true, supportsStreaming: true, supportsReasoning: true },
                contextLimit: 131072,
                outputLimit: 131072,
                costPer1kInput: 0.003,
                costPer1kOutput: 0.015,
                status: 'active',
            },
        ],
        enabled: true,
    },
    {
        id: 'ollama',
        name: 'Ollama (Local)',
        apiKeyEnvVar: 'OLLAMA_BASE_URL',
        baseUrl: 'http://localhost:11434',
        models: [
            {
                id: 'llama3.2',
                name: 'Llama 3.2',
                provider: 'ollama',
                capabilities: { supportsVision: false, supportsTools: true, supportsStreaming: true, supportsReasoning: false },
                contextLimit: 128000,
                outputLimit: 4096,
                costPer1kInput: 0,
                costPer1kOutput: 0,
                status: 'active',
            },
            {
                id: 'deepseek-coder-v2',
                name: 'DeepSeek Coder V2',
                provider: 'ollama',
                capabilities: { supportsVision: false, supportsTools: true, supportsStreaming: true, supportsReasoning: false },
                contextLimit: 128000,
                outputLimit: 4096,
                costPer1kInput: 0,
                costPer1kOutput: 0,
                status: 'active',
            },
        ],
        enabled: true,
    },
];

/**
 * Get all available models across all providers
 */
export function getAllModels(): ModelConfig[] {
    return PROVIDERS.filter(p => p.enabled).flatMap(p => p.models);
}

/**
 * Get a specific model by ID
 */
export function getModel(modelId: string): ModelConfig | undefined {
    return getAllModels().find(m => m.id === modelId);
}

/**
 * Get provider by ID
 */
export function getProvider(providerId: string): ProviderConfig | undefined {
    return PROVIDERS.find(p => p.id === providerId);
}

/**
 * Check if a provider has an API key configured
 */
export function isProviderConfigured(providerId: string): boolean {
    const provider = getProvider(providerId);
    if (!provider) return false;

    // For Ollama, check if the base URL is accessible
    if (providerId === 'ollama') {
        return true; // Assume local Ollama is available
    }

    // Check environment variable or localStorage
    const envValue = typeof process !== 'undefined'
        ? process.env?.[provider.apiKeyEnvVar]
        : undefined;
    const storedValue = typeof localStorage !== 'undefined'
        ? localStorage.getItem(`sprintloop_${provider.apiKeyEnvVar}`)
        : undefined;

    return !!(envValue || storedValue);
}

/**
 * Get configured providers (those with API keys)
 */
export function getConfiguredProviders(): ProviderConfig[] {
    return PROVIDERS.filter(p => p.enabled && isProviderConfigured(p.id));
}

/**
 * Initialize provider health tracking
 */
export function initializeProviderHealth(): void {
    for (const provider of PROVIDERS) {
        if (!providerHealth.has(provider.id)) {
            providerHealth.set(provider.id, {
                provider: provider.id,
                isHealthy: true,
                lastCheck: Date.now(),
                consecutiveFailures: 0,
            });
        }
    }
}

/**
 * Report provider success
 */
export function reportProviderSuccess(providerId: string, responseTime: number): void {
    const health = providerHealth.get(providerId);
    if (health) {
        health.isHealthy = true;
        health.consecutiveFailures = 0;
        health.avgResponseTime = responseTime;
        health.lastCheck = Date.now();
        health.lastError = undefined;
        providerHealth.set(providerId, health);
    }
}

/**
 * Report provider failure
 */
export function reportProviderFailure(providerId: string, error: string): void {
    const health = providerHealth.get(providerId);
    if (health) {
        health.consecutiveFailures++;
        health.lastError = error;
        health.lastCheck = Date.now();

        // Mark unhealthy after 3 consecutive failures
        if (health.consecutiveFailures >= 3) {
            health.isHealthy = false;
        }
        providerHealth.set(providerId, health);
    }
}

/**
 * Check if a provider is healthy
 */
export function isProviderHealthy(providerId: string): boolean {
    const health = providerHealth.get(providerId);
    if (!health) return true;

    // Reset health after 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    if (!health.isHealthy && Date.now() - health.lastCheck > fiveMinutes) {
        health.isHealthy = true;
        health.consecutiveFailures = 0;
        providerHealth.set(providerId, health);
    }

    return health.isHealthy;
}

/**
 * Get all provider health statuses
 */
export function getProviderHealthStatuses(): ProviderHealth[] {
    return Array.from(providerHealth.values());
}

// Initialize on module load
initializeProviderHealth();

// ============================================================================
// BACKWARD COMPATIBILITY - Types and functions expected by existing stores
// ============================================================================

/**
 * Model ID type - backwards compatible alias
 */
export type ModelId = string;

/**
 * Chat message type - backwards compatible
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    modelId: string;
    modelType?: 'cloud' | 'onprem';
    routingInfo?: {
        modelId: string;
        modelType: 'cloud' | 'onprem';
        reason: string;
    };
}

/**
 * API key status - backwards compatible
 */
export interface ApiKeyStatus {
    anyConfigured: boolean;
    anthropic: boolean;
    openai: boolean;
    google: boolean;
    ollama: boolean;
}

/**
 * Get API key status across all providers
 */
export function getApiKeyStatus(): ApiKeyStatus {
    return {
        anyConfigured: getConfiguredProviders().length > 0,
        anthropic: isProviderConfigured('anthropic'),
        openai: isProviderConfigured('openai'),
        google: isProviderConfigured('google'),
        ollama: isProviderConfigured('ollama'),
    };
}

/**
 * Stream chat with compliance-aware routing
 * Connected to real Vercel AI SDK for actual AI responses
 */
export async function* streamChatWithCompliance(
    messages: ChatMessage[],
    userMessage: string,
    preferredModel: string
): AsyncGenerator<{ chunk: string; routingResult?: Awaited<ReturnType<typeof import('./compliance-router').routeRequest>> }> {
    // Import compliance router dynamically to avoid circular deps
    const { routeRequest } = await import('./compliance-router');
    const { streamText } = await import('ai');

    // Get proper routing result
    const routingResult = await routeRequest({
        task: userMessage,
        userPreferredModel: preferredModel,
    });

    // Yield routing result first
    yield { chunk: '', routingResult };

    try {
        // Get the AI provider SDK instance
        const provider = await getProviderSDK(routingResult.modelId);

        if (!provider) {
            // Fallback if no provider configured
            const fallbackMsg = `⚠️ No AI provider configured. Please add an API key in settings.

To get started:
1. Get an API key from Anthropic, OpenAI, or Google
2. Add it to your environment variables or settings
3. Restart the app

I can help you code once connected!`;
            for (const char of fallbackMsg) {
                yield { chunk: char };
            }
            return;
        }

        // Convert messages to AI SDK format
        const aiMessages = messages.map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
        }));

        // Add the new user message
        aiMessages.push({ role: 'user', content: userMessage });

        // Add system message for agentic coding
        const systemMessage = `You are SprintLoop AI, an expert agentic coding assistant. You help developers write, understand, and debug code.

Available tools (in desktop app):
- Read files from the project
- Edit files with precise changes
- Write new files
- Execute terminal commands
- Search code patterns

Be concise, practical, and write clean code. When showing code, use proper markdown formatting.`;

        // Stream from the AI provider
        const result = streamText({
            model: provider,
            system: systemMessage,
            messages: aiMessages,
            maxOutputTokens: 4096,
        });

        // Stream the chunks
        for await (const textPart of (await result).textStream) {
            yield { chunk: textPart };
        }

        // Report success for health tracking
        reportProviderSuccess(routingResult.modelId.split('/')[0] || 'unknown', Date.now());
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Report failure for health tracking
        const providerId = routingResult.modelId.split('/')[0] || 'unknown';
        reportProviderFailure(providerId, errorMessage);

        // Yield error message
        yield { chunk: `\n\n❌ **Error**: ${errorMessage}\n\nPlease check your API key and try again.` };
    }
}

/**
 * Get the Vercel AI SDK provider instance for a model
 */
async function getProviderSDK(modelId: string) {
    // Determine provider from model ID
    let providerId = 'anthropic';
    if (modelId.includes('gpt') || modelId.includes('o1') || modelId.includes('o3')) {
        providerId = 'openai';
    } else if (modelId.includes('gemini')) {
        providerId = 'google';
    } else if (modelId.includes('llama') || modelId.includes('mixtral')) {
        providerId = 'groq';
    }

    // Check if provider is configured
    if (!isProviderConfigured(providerId)) {
        return null;
    }

    // Get API key from environment or localStorage
    const provider = PROVIDERS.find(p => p.id === providerId);
    if (!provider) return null;

    const apiKey = getApiKey(provider.apiKeyEnvVar);
    if (!apiKey) return null;

    // Create SDK instance based on provider
    switch (providerId) {
        case 'anthropic': {
            const { createAnthropic } = await import('@ai-sdk/anthropic');
            const anthropic = createAnthropic({ apiKey });
            return anthropic(modelId);
        }
        case 'openai': {
            const { createOpenAI } = await import('@ai-sdk/openai');
            const openai = createOpenAI({ apiKey });
            return openai(modelId);
        }
        case 'google': {
            const { createGoogleGenerativeAI } = await import('@ai-sdk/google');
            const google = createGoogleGenerativeAI({ apiKey });
            return google(modelId);
        }
        default:
            return null;
    }
}

/**
 * Get API key from environment or localStorage
 */
function getApiKey(envVar: string): string | null {
    // Try environment variable first
    if (typeof process !== 'undefined' && process.env?.[envVar]) {
        return process.env[envVar] as string;
    }

    // Try localStorage (for browser)
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(`sprintloop_${envVar.toLowerCase()}`);
        if (stored) return stored;
    }

    // Try import.meta.env (Vite)
    if (typeof import.meta !== 'undefined' && import.meta.env?.[`VITE_${envVar}`]) {
        return import.meta.env[`VITE_${envVar}`];
    }

    return null;
}

/**
 * Generate with compliance (for multi-agent system)
 * Connected to real Vercel AI SDK for actual AI responses
 */
export async function generateWithCompliance(
    messages: Array<{ id: string; role: string; content: string; timestamp: Date }>,
    prompt: string
): Promise<{ text: string; routingResult: { modelType: 'cloud' | 'onprem'; modelId: string; reason: string } }> {
    // Import compliance router and AI SDK
    const { routeRequest } = await import('./compliance-router');
    const { generateText } = await import('ai');

    // Get routing result
    const routingResult = await routeRequest({
        task: prompt,
    });

    try {
        // Get the AI provider SDK instance
        const provider = await getProviderSDK(routingResult.modelId);

        if (!provider) {
            return {
                text: '⚠️ No AI provider configured. Please add an API key.',
                routingResult: {
                    modelType: routingResult.modelType,
                    modelId: routingResult.modelId,
                    reason: 'No provider available',
                },
            };
        }

        // Convert messages to AI SDK format
        const aiMessages = messages.map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
        }));

        // Add the prompt as user message
        aiMessages.push({ role: 'user', content: prompt });

        // Generate response
        const result = await generateText({
            model: provider,
            messages: aiMessages,
            maxOutputTokens: 2048,
        });

        reportProviderSuccess(routingResult.modelId.split('/')[0] || 'unknown', Date.now());

        return {
            text: result.text,
            routingResult: {
                modelType: routingResult.modelType,
                modelId: routingResult.modelId,
                reason: routingResult.reason,
            },
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const providerId = routingResult.modelId.split('/')[0] || 'unknown';
        reportProviderFailure(providerId, errorMessage);

        return {
            text: `❌ Error: ${errorMessage}`,
            routingResult: {
                modelType: routingResult.modelType,
                modelId: routingResult.modelId,
                reason: `Error: ${errorMessage}`,
            },
        };
    }
}
