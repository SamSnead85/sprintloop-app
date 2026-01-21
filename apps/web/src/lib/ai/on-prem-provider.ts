/**
 * On-Prem LLM Provider
 * Supports local/self-hosted models via Ollama, vLLM, llama.cpp, and OpenAI-compatible APIs
 */
import { createOpenAI } from '@ai-sdk/openai'

// Create on-prem model instance using OpenAI-compatible API
// Returns any to avoid type issues across different AI SDK versions
type OnPremModel = ReturnType<ReturnType<typeof createOpenAI>>

// On-prem model configurations
export interface OnPremModelConfig {
    id: string
    displayName: string
    provider: 'ollama' | 'vllm' | 'llamacpp' | 'openai-compatible'
    baseUrl: string
    modelId: string
    contextLength?: number
    description?: string
    icon?: string
}

// Popular on-prem models with default configs
export const ON_PREM_MODEL_PRESETS: Record<string, Omit<OnPremModelConfig, 'baseUrl'>> = {
    // Mistral family
    'mistral-7b': {
        id: 'mistral-7b',
        displayName: 'Mistral 7B',
        provider: 'ollama',
        modelId: 'mistral',
        contextLength: 32768,
        description: 'Fast, efficient general-purpose model',
        icon: '🌀',
    },
    'mistral-nemo': {
        id: 'mistral-nemo',
        displayName: 'Mistral Nemo 12B',
        provider: 'ollama',
        modelId: 'mistral-nemo',
        contextLength: 128000,
        description: 'State-of-the-art 12B with 128K context',
        icon: '🌀',
    },
    'mixtral-8x7b': {
        id: 'mixtral-8x7b',
        displayName: 'Mixtral 8x7B',
        provider: 'ollama',
        modelId: 'mixtral',
        contextLength: 32768,
        description: 'Powerful MoE model, great for coding',
        icon: '🌀',
    },
    'codestral': {
        id: 'codestral',
        displayName: 'Codestral 22B',
        provider: 'ollama',
        modelId: 'codestral',
        contextLength: 32768,
        description: 'Mistral code-specialized model',
        icon: '💻',
    },

    // Llama family
    'llama3.3-70b': {
        id: 'llama3.3-70b',
        displayName: 'Llama 3.3 70B',
        provider: 'ollama',
        modelId: 'llama3.3:70b',
        contextLength: 128000,
        description: 'Meta\'s flagship open model',
        icon: '🦙',
    },
    'llama3.2-8b': {
        id: 'llama3.2-8b',
        displayName: 'Llama 3.2 8B',
        provider: 'ollama',
        modelId: 'llama3.2',
        contextLength: 128000,
        description: 'Fast and capable for most tasks',
        icon: '🦙',
    },
    'llama3.2-3b': {
        id: 'llama3.2-3b',
        displayName: 'Llama 3.2 3B',
        provider: 'ollama',
        modelId: 'llama3.2:3b',
        contextLength: 128000,
        description: 'Lightweight, runs on any machine',
        icon: '🦙',
    },
    'codellama-34b': {
        id: 'codellama-34b',
        displayName: 'Code Llama 34B',
        provider: 'ollama',
        modelId: 'codellama:34b',
        contextLength: 16384,
        description: 'Specialized for code generation',
        icon: '💻',
    },

    // Qwen family
    'qwen2.5-72b': {
        id: 'qwen2.5-72b',
        displayName: 'Qwen 2.5 72B',
        provider: 'ollama',
        modelId: 'qwen2.5:72b',
        contextLength: 131072,
        description: 'Alibaba\'s top-tier open model',
        icon: '🔮',
    },
    'qwen2.5-coder-32b': {
        id: 'qwen2.5-coder-32b',
        displayName: 'Qwen 2.5 Coder 32B',
        provider: 'ollama',
        modelId: 'qwen2.5-coder:32b',
        contextLength: 131072,
        description: 'Best open-source coding model',
        icon: '💻',
    },

    // DeepSeek
    'deepseek-coder-v2': {
        id: 'deepseek-coder-v2',
        displayName: 'DeepSeek Coder V2',
        provider: 'ollama',
        modelId: 'deepseek-coder-v2',
        contextLength: 128000,
        description: 'Excellent for code tasks',
        icon: '🌊',
    },
    'deepseek-r1': {
        id: 'deepseek-r1',
        displayName: 'DeepSeek R1',
        provider: 'ollama',
        modelId: 'deepseek-r1:70b',
        contextLength: 64000,
        description: 'Advanced reasoning model',
        icon: '🧠',
    },

    // Other popular models
    'phi-4': {
        id: 'phi-4',
        displayName: 'Phi-4 14B',
        provider: 'ollama',
        modelId: 'phi4',
        contextLength: 16384,
        description: 'Microsoft\'s compact powerhouse',
        icon: '🔬',
    },
    'command-r-plus': {
        id: 'command-r-plus',
        displayName: 'Command R+',
        provider: 'ollama',
        modelId: 'command-r-plus',
        contextLength: 128000,
        description: 'Cohere\'s best for RAG and agents',
        icon: '🎯',
    },
}

// On-prem provider configuration store
export interface OnPremConfig {
    enabled: boolean
    endpoints: {
        ollama?: string      // e.g., http://localhost:11434
        vllm?: string        // e.g., http://localhost:8000
        llamacpp?: string    // e.g., http://localhost:8080
        custom?: string      // Any OpenAI-compatible endpoint
    }
    activeModels: OnPremModelConfig[]
}

// Default config
const DEFAULT_ON_PREM_CONFIG: OnPremConfig = {
    enabled: false,
    endpoints: {
        ollama: 'http://localhost:11434',
    },
    activeModels: [],
}

// Get on-prem config from localStorage or env
export function getOnPremConfig(): OnPremConfig {
    try {
        const stored = localStorage.getItem('sprintloop:onprem-config')
        if (stored) {
            return JSON.parse(stored)
        }
    } catch {
        // Ignore parse errors
    }

    // Check env for defaults
    const ollamaUrl = import.meta.env.VITE_OLLAMA_URL
    const vllmUrl = import.meta.env.VITE_VLLM_URL

    if (ollamaUrl || vllmUrl) {
        return {
            enabled: true,
            endpoints: {
                ollama: ollamaUrl || DEFAULT_ON_PREM_CONFIG.endpoints.ollama,
                vllm: vllmUrl,
            },
            activeModels: [],
        }
    }

    return DEFAULT_ON_PREM_CONFIG
}

// Save on-prem config
export function saveOnPremConfig(config: OnPremConfig): void {
    localStorage.setItem('sprintloop:onprem-config', JSON.stringify(config))
}

// Check if Ollama is available
export async function checkOllamaConnection(baseUrl: string = 'http://localhost:11434'): Promise<{
    connected: boolean
    models: string[]
    error?: string
}> {
    try {
        const response = await fetch(`${baseUrl}/api/tags`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        const models = (data.models || []).map((m: { name: string }) => m.name)

        return { connected: true, models }
    } catch (err) {
        return {
            connected: false,
            models: [],
            error: err instanceof Error ? err.message : 'Connection failed',
        }
    }
}

// Check vLLM/OpenAI-compatible endpoint
export async function checkOpenAICompatibleConnection(baseUrl: string): Promise<{
    connected: boolean
    models: string[]
    error?: string
}> {
    try {
        const response = await fetch(`${baseUrl}/v1/models`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        const models = (data.data || []).map((m: { id: string }) => m.id)

        return { connected: true, models }
    } catch (err) {
        return {
            connected: false,
            models: [],
            error: err instanceof Error ? err.message : 'Connection failed',
        }
    }
}

// Create on-prem model instance using OpenAI-compatible API
export function createOnPremModel(config: OnPremModelConfig): OnPremModel {
    const baseUrl = getOnPremBaseUrl(config)

    // All on-prem providers expose OpenAI-compatible APIs
    const provider = createOpenAI({
        baseURL: baseUrl,
        apiKey: 'ollama', // Ollama doesn't require auth, but SDK needs something
    })

    return provider(config.modelId)
}

function getOnPremBaseUrl(config: OnPremModelConfig): string {
    const onPremConfig = getOnPremConfig()

    switch (config.provider) {
        case 'ollama':
            return (onPremConfig.endpoints.ollama || 'http://localhost:11434') + '/v1'
        case 'vllm':
            return (onPremConfig.endpoints.vllm || 'http://localhost:8000') + '/v1'
        case 'llamacpp':
            return onPremConfig.endpoints.llamacpp || 'http://localhost:8080'
        case 'openai-compatible':
            return config.baseUrl
        default:
            return config.baseUrl
    }
}

// Get all available on-prem models
export async function getAvailableOnPremModels(): Promise<OnPremModelConfig[]> {
    const config = getOnPremConfig()
    if (!config.enabled) return []

    const available: OnPremModelConfig[] = []

    // Check Ollama
    if (config.endpoints.ollama) {
        const ollama = await checkOllamaConnection(config.endpoints.ollama)
        if (ollama.connected) {
            for (const modelName of ollama.models) {
                // Match to presets or create custom config
                const preset = Object.values(ON_PREM_MODEL_PRESETS).find(
                    p => p.modelId === modelName || modelName.startsWith(p.modelId.split(':')[0])
                )

                available.push({
                    id: `ollama:${modelName}`,
                    displayName: preset?.displayName || modelName,
                    provider: 'ollama',
                    baseUrl: config.endpoints.ollama!,
                    modelId: modelName,
                    contextLength: preset?.contextLength || 4096,
                    description: preset?.description,
                    icon: preset?.icon || '🤖',
                })
            }
        }
    }

    // Check vLLM
    if (config.endpoints.vllm) {
        const vllm = await checkOpenAICompatibleConnection(config.endpoints.vllm)
        if (vllm.connected) {
            for (const modelName of vllm.models) {
                available.push({
                    id: `vllm:${modelName}`,
                    displayName: modelName,
                    provider: 'vllm',
                    baseUrl: config.endpoints.vllm!,
                    modelId: modelName,
                    icon: '⚡',
                })
            }
        }
    }

    return available
}

// Export provider type info
export type OnPremProvider = 'ollama' | 'vllm' | 'llamacpp' | 'openai-compatible'
