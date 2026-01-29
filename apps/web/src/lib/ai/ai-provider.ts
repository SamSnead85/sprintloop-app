/**
 * AI Provider Service
 * 
 * Unified interface for multiple AI providers (Gemini, OpenAI, Anthropic).
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'ollama' | 'custom';

export interface AIModel {
    id: string;
    name: string;
    provider: AIProvider;
    contextLength: number;
    supportsStreaming: boolean;
    supportsTools: boolean;
    costPer1kTokens?: { input: number; output: number };
}

export interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
}

export interface ToolResult {
    toolCallId: string;
    result: unknown;
}

export interface StreamChunk {
    type: 'text' | 'tool_call' | 'done' | 'error';
    content?: string;
    toolCall?: ToolCall;
    error?: string;
}

export interface CompletionOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    tools?: ToolDefinition[];
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}

export interface AIProviderState {
    provider: AIProvider;
    model: string;
    apiKey: string | null;
    baseUrl: string | null;
    isConnected: boolean;
    availableModels: AIModel[];

    // Configuration
    setProvider: (provider: AIProvider) => void;
    setModel: (model: string) => void;
    setApiKey: (key: string) => void;
    setBaseUrl: (url: string) => void;

    // API Methods
    complete: (messages: Message[], options?: CompletionOptions) => Promise<string>;
    stream: (messages: Message[], options?: CompletionOptions) => AsyncGenerator<StreamChunk>;
    testConnection: () => Promise<boolean>;
}

// =============================================================================
// AVAILABLE MODELS
// =============================================================================

const MODELS: AIModel[] = [
    // Gemini
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'gemini', contextLength: 1000000, supportsStreaming: true, supportsTools: true },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'gemini', contextLength: 2000000, supportsStreaming: true, supportsTools: true },

    // OpenAI
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextLength: 128000, supportsStreaming: true, supportsTools: true },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextLength: 128000, supportsStreaming: true, supportsTools: true },
    { id: 'o1-preview', name: 'o1 Preview', provider: 'openai', contextLength: 128000, supportsStreaming: false, supportsTools: false },

    // Anthropic
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextLength: 200000, supportsStreaming: true, supportsTools: true },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', contextLength: 200000, supportsStreaming: true, supportsTools: true },

    // Ollama (local)
    { id: 'llama3.2', name: 'Llama 3.2', provider: 'ollama', contextLength: 128000, supportsStreaming: true, supportsTools: false },
    { id: 'codellama', name: 'Code Llama', provider: 'ollama', contextLength: 100000, supportsStreaming: true, supportsTools: false },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'ollama', contextLength: 128000, supportsStreaming: true, supportsTools: false },
];

// =============================================================================
// AI PROVIDER STORE
// =============================================================================

export const useAIProvider = create<AIProviderState>((set, get) => ({
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    apiKey: null,
    baseUrl: null,
    isConnected: false,
    availableModels: MODELS,

    setProvider: (provider) => {
        const models = MODELS.filter(m => m.provider === provider);
        set({
            provider,
            model: models[0]?.id || '',
            isConnected: false,
        });
    },

    setModel: (model) => set({ model }),
    setApiKey: (apiKey) => set({ apiKey, isConnected: false }),
    setBaseUrl: (baseUrl) => set({ baseUrl }),

    complete: async (messages: Message[], options?: CompletionOptions): Promise<string> => {
        const { provider, model, apiKey, baseUrl } = get();

        try {
            switch (provider) {
                case 'gemini':
                    return await completeGemini(messages, model, apiKey!, options);
                case 'openai':
                    return await completeOpenAI(messages, model, apiKey!, options);
                case 'anthropic':
                    return await completeAnthropic(messages, model, apiKey!, options);
                case 'ollama':
                    return await completeOllama(messages, model, baseUrl || 'http://localhost:11434', options);
                default:
                    throw new Error(`Unknown provider: ${provider}`);
            }
        } catch (error) {
            console.error('[AIProvider] Completion failed:', error);
            throw error;
        }
    },

    stream: async function* (messages: Message[], options?: CompletionOptions): AsyncGenerator<StreamChunk> {
        const { provider, model, apiKey, baseUrl } = get();

        try {
            switch (provider) {
                case 'gemini':
                    yield* streamGemini(messages, model, apiKey!, options);
                    break;
                case 'openai':
                    yield* streamOpenAI(messages, model, apiKey!, options);
                    break;
                case 'anthropic':
                    yield* streamAnthropic(messages, model, apiKey!, options);
                    break;
                case 'ollama':
                    yield* streamOllama(messages, model, baseUrl || 'http://localhost:11434', options);
                    break;
                default:
                    yield { type: 'error', error: `Unknown provider: ${provider}` };
            }
        } catch (error) {
            yield { type: 'error', error: error instanceof Error ? error.message : 'Unknown error' };
        }
    },

    testConnection: async (): Promise<boolean> => {
        const { provider, apiKey, baseUrl } = get();

        try {
            let connected = false;

            switch (provider) {
                case 'gemini':
                    connected = await testGeminiConnection(apiKey!);
                    break;
                case 'openai':
                    connected = await testOpenAIConnection(apiKey!);
                    break;
                case 'anthropic':
                    connected = await testAnthropicConnection(apiKey!);
                    break;
                case 'ollama':
                    connected = await testOllamaConnection(baseUrl || 'http://localhost:11434');
                    break;
            }

            set({ isConnected: connected });
            return connected;
        } catch {
            set({ isConnected: false });
            return false;
        }
    },
}));

// =============================================================================
// PROVIDER IMPLEMENTATIONS
// =============================================================================

async function completeGemini(
    messages: Message[],
    model: string,
    apiKey: string,
    options?: CompletionOptions
): Promise<string> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: messages.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }],
                })),
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                    maxOutputTokens: options?.maxTokens ?? 8192,
                },
            }),
        }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function* streamGemini(
    messages: Message[],
    model: string,
    apiKey: string,
    options?: CompletionOptions
): AsyncGenerator<StreamChunk> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: messages.map(m => ({
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: m.content }],
                })),
                generationConfig: {
                    temperature: options?.temperature ?? 0.7,
                    maxOutputTokens: options?.maxTokens ?? 8192,
                },
            }),
        }
    );

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
        yield { type: 'error', error: 'No response body' };
        return;
    }

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
            try {
                const data = JSON.parse(line.slice(6));
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    yield { type: 'text', content: text };
                }
            } catch {
                // Skip invalid JSON
            }
        }
    }

    yield { type: 'done' };
}

async function completeOpenAI(
    messages: Message[],
    model: string,
    apiKey: string,
    options?: CompletionOptions
): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 4096,
        }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}

async function* streamOpenAI(
    messages: Message[],
    model: string,
    apiKey: string,
    options?: CompletionOptions
): AsyncGenerator<StreamChunk> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 4096,
            stream: true,
        }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
        yield { type: 'error', error: 'No response body' };
        return;
    }

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: ') && l !== 'data: [DONE]');

        for (const line of lines) {
            try {
                const data = JSON.parse(line.slice(6));
                const content = data.choices?.[0]?.delta?.content;
                if (content) {
                    yield { type: 'text', content };
                }
            } catch {
                // Skip invalid JSON
            }
        }
    }

    yield { type: 'done' };
}

async function completeAnthropic(
    messages: Message[],
    model: string,
    apiKey: string,
    options?: CompletionOptions
): Promise<string> {
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            system: systemMessage?.content,
            messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
            max_tokens: options?.maxTokens ?? 4096,
        }),
    });

    const data = await response.json();
    return data.content?.[0]?.text || '';
}

async function* streamAnthropic(
    messages: Message[],
    model: string,
    apiKey: string,
    options?: CompletionOptions
): AsyncGenerator<StreamChunk> {
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model,
            system: systemMessage?.content,
            messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
            max_tokens: options?.maxTokens ?? 4096,
            stream: true,
        }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
        yield { type: 'error', error: 'No response body' };
        return;
    }

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
            try {
                const data = JSON.parse(line.slice(6));
                if (data.type === 'content_block_delta') {
                    yield { type: 'text', content: data.delta?.text || '' };
                }
            } catch {
                // Skip invalid JSON
            }
        }
    }

    yield { type: 'done' };
}

async function completeOllama(
    messages: Message[],
    model: string,
    baseUrl: string,
    options?: CompletionOptions
): Promise<string> {
    const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: false,
            options: {
                temperature: options?.temperature ?? 0.7,
                num_predict: options?.maxTokens ?? 4096,
            },
        }),
    });

    const data = await response.json();
    return data.message?.content || '';
}

async function* streamOllama(
    messages: Message[],
    model: string,
    baseUrl: string,
    options?: CompletionOptions
): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: true,
            options: {
                temperature: options?.temperature ?? 0.7,
                num_predict: options?.maxTokens ?? 4096,
            },
        }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
        yield { type: 'error', error: 'No response body' };
        return;
    }

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split('\n').filter(Boolean);

        for (const line of lines) {
            try {
                const data = JSON.parse(line);
                if (data.message?.content) {
                    yield { type: 'text', content: data.message.content };
                }
                if (data.done) {
                    yield { type: 'done' };
                }
            } catch {
                // Skip invalid JSON
            }
        }
    }
}

// =============================================================================
// CONNECTION TESTS
// =============================================================================

async function testGeminiConnection(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        return response.ok;
    } catch {
        return false;
    }
}

async function testOpenAIConnection(apiKey: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` },
        });
        return response.ok;
    } catch {
        return false;
    }
}

async function testAnthropicConnection(apiKey: string): Promise<boolean> {
    // Anthropic doesn't have a simple test endpoint
    // We just verify the key format
    return apiKey.startsWith('sk-ant-');
}

async function testOllamaConnection(baseUrl: string): Promise<boolean> {
    try {
        const response = await fetch(`${baseUrl}/api/tags`);
        return response.ok;
    } catch {
        return false;
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getModelsForProvider(provider: AIProvider): AIModel[] {
    return MODELS.filter(m => m.provider === provider);
}

export function getModelById(id: string): AIModel | undefined {
    return MODELS.find(m => m.id === id);
}
