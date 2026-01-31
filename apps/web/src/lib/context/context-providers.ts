/**
 * SprintLoop Context Provider System
 * 
 * Implements Continue.dev-style context providers with MCP support.
 * Context providers are plugin-based mechanisms that allow feeding
 * relevant information to the LLM to guide its responses.
 * 
 * Patterns from open-source:
 * - Continue.dev: @ mention system with extensible providers
 * - OpenCode: Auto-compact when approaching context limit
 * - MCP: Model Context Protocol for external integrations
 */

import { create } from 'zustand'

// Context provider interface
export interface ContextProvider {
    id: string
    name: string
    description: string
    icon: string
    color: string

    // Fetch context based on query
    getContext: (query: string) => Promise<ContextItem[]>

    // Search/autocomplete for this provider
    search?: (query: string) => Promise<ContextSuggestion[]>

    // Whether this provider is available
    isAvailable: () => boolean
}

// Individual context item
export interface ContextItem {
    id: string
    providerId: string
    type: 'file' | 'code' | 'web' | 'docs' | 'terminal' | 'git' | 'custom'
    title: string
    content: string
    metadata?: Record<string, unknown>
    tokenCount?: number
}

// Suggestion for autocomplete
export interface ContextSuggestion {
    id: string
    label: string
    description?: string
    icon?: string
    data?: unknown
}

// Built-in context providers
const builtInProviders: ContextProvider[] = [
    {
        id: 'codebase',
        name: '@codebase',
        description: 'Search entire codebase for relevant files',
        icon: '📁',
        color: 'blue',
        isAvailable: () => true,
        getContext: async (query) => {
            // In a real implementation, this would search the codebase index
            return [{
                id: `codebase-${Date.now()}`,
                providerId: 'codebase',
                type: 'code',
                title: 'Codebase Search',
                content: `Searching codebase for: ${query}`,
                tokenCount: 100,
            }]
        },
        search: async (query) => {
            // Would return matching files
            return [
                { id: '1', label: 'src/App.tsx', description: 'Main application' },
                { id: '2', label: 'src/lib/ai/provider.ts', description: 'AI provider' },
            ].filter(s => s.label.toLowerCase().includes(query.toLowerCase()))
        },
    },
    {
        id: 'file',
        name: '@file',
        description: 'Reference specific file content',
        icon: '📄',
        color: 'green',
        isAvailable: () => true,
        getContext: async (query) => {
            // Would read actual file content
            return [{
                id: `file-${Date.now()}`,
                providerId: 'file',
                type: 'file',
                title: query,
                content: `Content of ${query}`,
                tokenCount: 500,
            }]
        },
        search: async (query) => {
            // Would search file tree
            return [
                { id: '1', label: 'package.json' },
                { id: '2', label: 'tsconfig.json' },
                { id: '3', label: '.env.local' },
            ].filter(s => s.label.toLowerCase().includes(query.toLowerCase()))
        },
    },
    {
        id: 'web',
        name: '@web',
        description: 'Search the web for information',
        icon: '🌐',
        color: 'purple',
        isAvailable: () => true,
        getContext: async (query) => {
            // Would perform web search
            return [{
                id: `web-${Date.now()}`,
                providerId: 'web',
                type: 'web',
                title: `Web: ${query}`,
                content: `Web search results for: ${query}`,
                tokenCount: 1000,
            }]
        },
    },
    {
        id: 'docs',
        name: '@docs',
        description: 'Search documentation and APIs',
        icon: '📚',
        color: 'orange',
        isAvailable: () => true,
        getContext: async (query) => {
            return [{
                id: `docs-${Date.now()}`,
                providerId: 'docs',
                type: 'docs',
                title: `Docs: ${query}`,
                content: `Documentation for: ${query}`,
                tokenCount: 800,
            }]
        },
    },
    {
        id: 'terminal',
        name: '@terminal',
        description: 'Include recent terminal output',
        icon: '💻',
        color: 'gray',
        isAvailable: () => true,
        getContext: async () => {
            return [{
                id: `terminal-${Date.now()}`,
                providerId: 'terminal',
                type: 'terminal',
                title: 'Terminal Output',
                content: 'Recent terminal output...',
                tokenCount: 300,
            }]
        },
    },
    {
        id: 'git',
        name: '@git',
        description: 'Include git diff or history',
        icon: '🔀',
        color: 'red',
        isAvailable: () => true,
        getContext: async (query) => {
            return [{
                id: `git-${Date.now()}`,
                providerId: 'git',
                type: 'git',
                title: `Git: ${query || 'diff'}`,
                content: 'Git changes...',
                tokenCount: 400,
            }]
        },
        search: async () => [
            { id: 'diff', label: 'Current diff' },
            { id: 'staged', label: 'Staged changes' },
            { id: 'history', label: 'Recent commits' },
        ],
    },
    {
        id: 'currentFile',
        name: '@currentFile',
        description: 'Include the current active file',
        icon: '📝',
        color: 'cyan',
        isAvailable: () => true,
        getContext: async () => {
            return [{
                id: `currentFile-${Date.now()}`,
                providerId: 'currentFile',
                type: 'file',
                title: 'Current File',
                content: 'Content of current file...',
                tokenCount: 500,
            }]
        },
    },
]

// Context state
interface ContextProviderState {
    providers: ContextProvider[]
    activeContext: ContextItem[]
    totalTokens: number
    maxTokens: number
    isLoading: boolean

    // Provider management
    registerProvider: (provider: ContextProvider) => void
    unregisterProvider: (providerId: string) => void
    getProvider: (providerId: string) => ContextProvider | undefined
    getAvailableProviders: () => ContextProvider[]

    // Context management
    addContext: (providerId: string, query?: string) => Promise<void>
    removeContext: (contextId: string) => void
    clearContext: () => void

    // Search across providers
    searchProviders: (query: string) => Promise<ContextSuggestion[]>

    // Auto-compact when approaching limit (OpenCode pattern)
    compactContext: () => void

    // Format context for prompt
    formatContextForPrompt: () => string
}

// Context provider store
export const useContextProviders = create<ContextProviderState>((set, get) => ({
    providers: builtInProviders,
    activeContext: [],
    totalTokens: 0,
    maxTokens: 128000, // Default max tokens
    isLoading: false,

    registerProvider: (provider) => {
        set(state => ({
            providers: [...state.providers.filter(p => p.id !== provider.id), provider],
        }))
    },

    unregisterProvider: (providerId) => {
        set(state => ({
            providers: state.providers.filter(p => p.id !== providerId),
        }))
    },

    getProvider: (providerId) => {
        return get().providers.find(p => p.id === providerId)
    },

    getAvailableProviders: () => {
        return get().providers.filter(p => p.isAvailable())
    },

    addContext: async (providerId, query = '') => {
        const provider = get().getProvider(providerId)
        if (!provider) return

        set({ isLoading: true })

        try {
            const items = await provider.getContext(query)

            set(state => {
                const newContext = [...state.activeContext, ...items]
                const totalTokens = newContext.reduce((sum, item) => sum + (item.tokenCount || 0), 0)

                return {
                    activeContext: newContext,
                    totalTokens,
                    isLoading: false,
                }
            })

            // Auto-compact if approaching limit
            const { totalTokens, maxTokens, compactContext } = get()
            if (totalTokens > maxTokens * 0.9) {
                compactContext()
            }
        } catch (error) {
            console.error('Failed to add context:', error)
            set({ isLoading: false })
        }
    },

    removeContext: (contextId) => {
        set(state => {
            const newContext = state.activeContext.filter(c => c.id !== contextId)
            return {
                activeContext: newContext,
                totalTokens: newContext.reduce((sum, item) => sum + (item.tokenCount || 0), 0),
            }
        })
    },

    clearContext: () => {
        set({ activeContext: [], totalTokens: 0 })
    },

    searchProviders: async (query) => {
        const providers = get().getAvailableProviders()
        const results: ContextSuggestion[] = []

        // Search each provider
        for (const provider of providers) {
            if (provider.search) {
                try {
                    const suggestions = await provider.search(query)
                    results.push(...suggestions.map(s => ({
                        ...s,
                        id: `${provider.id}:${s.id}`,
                        icon: s.icon || provider.icon,
                    })))
                } catch {
                    // Skip failed provider
                }
            }
        }

        return results.slice(0, 10) // Limit results
    },

    compactContext: () => {
        // OpenCode pattern: Auto-summarize when approaching limit
        set(state => {
            const { activeContext, maxTokens } = state

            // If under 80% of limit, no need to compact
            const totalTokens = activeContext.reduce((sum, item) => sum + (item.tokenCount || 0), 0)
            if (totalTokens < maxTokens * 0.8) {
                return state
            }

            // Sort by importance (files > code > other)
            const priorityOrder: Record<string, number> = {
                file: 1,
                code: 2,
                git: 3,
                terminal: 4,
                docs: 5,
                web: 6,
                custom: 7,
            }

            const sorted = [...activeContext].sort((a, b) =>
                (priorityOrder[a.type] || 10) - (priorityOrder[b.type] || 10)
            )

            // Keep items until we're under 70% of limit
            const targetTokens = maxTokens * 0.7
            let currentTokens = 0
            const kept: ContextItem[] = []

            for (const item of sorted) {
                const itemTokens = item.tokenCount || 0
                if (currentTokens + itemTokens <= targetTokens) {
                    kept.push(item)
                    currentTokens += itemTokens
                }
            }

            console.log(`[Context] Compacted from ${activeContext.length} to ${kept.length} items`)

            return {
                activeContext: kept,
                totalTokens: currentTokens,
            }
        })
    },

    formatContextForPrompt: () => {
        const { activeContext } = get()

        if (activeContext.length === 0) {
            return ''
        }

        const sections = activeContext.map(item => {
            const header = `=== ${item.type.toUpperCase()}: ${item.title} ===`
            return `${header}\n${item.content}\n`
        })

        return `<context>\n${sections.join('\n')}</context>\n\n`
    },
}))

// Parse @ mentions from input text
export function parseContextMentions(input: string): { providerId: string; query: string }[] {
    const mentionPattern = /@(\w+)(?:\s+([^\s@]+))?/g
    const mentions: { providerId: string; query: string }[] = []

    let match
    while ((match = mentionPattern.exec(input)) !== null) {
        mentions.push({
            providerId: match[1],
            query: match[2] || '',
        })
    }

    return mentions
}

// Remove @ mentions from input text
export function stripContextMentions(input: string): string {
    return input.replace(/@\w+(?:\s+[^\s@]+)?/g, '').trim()
}
