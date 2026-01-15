// AI Model definitions - Latest models as of 2026
export interface AIModel {
    id: string
    name: string
    provider: string
    description: string
    recommended: boolean
}

export const AI_MODELS: AIModel[] = [
    {
        id: 'claude-4.5-sonnet',
        name: 'Claude 4.5 Sonnet',
        provider: 'Anthropic',
        description: 'Best for coding - fast & capable',
        recommended: true
    },
    {
        id: 'claude-4.5-opus',
        name: 'Claude 4.5 Opus',
        provider: 'Anthropic',
        description: 'Most capable model',
        recommended: false
    },
    {
        id: 'gpt-5',
        name: 'GPT-5',
        provider: 'OpenAI',
        description: 'Latest OpenAI flagship',
        recommended: false
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        description: 'Fast multimodal',
        recommended: false
    },
    {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'Google',
        description: 'Advanced reasoning',
        recommended: false
    },
    {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'Google',
        description: 'Fastest responses',
        recommended: false
    },
]

export const DEFAULT_MODEL = AI_MODELS[0]
