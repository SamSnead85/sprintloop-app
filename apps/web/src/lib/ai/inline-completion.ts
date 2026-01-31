/**
 * SprintLoop AI Inline Completions
 * 
 * Implements GitHub Copilot-style inline completions:
 * - Ghost text suggestions
 * - Tab to accept
 * - Multi-line completions
 * - Context-aware suggestions
 * - Completion caching
 */

import { create } from 'zustand'

// Completion suggestion
export interface CompletionSuggestion {
    id: string
    text: string
    displayText: string
    insertText: string
    range: {
        startLine: number
        startColumn: number
        endLine: number
        endColumn: number
    }
    confidence: number
    source: 'ai' | 'cache' | 'snippet'
    metadata?: {
        model?: string
        latency?: number
        tokens?: number
    }
}

// Completion context
export interface CompletionContext {
    file: string
    language: string
    prefix: string
    suffix: string
    line: number
    column: number
    recentEdits: string[]
    openFiles: string[]
}

// Inline completion state
interface InlineCompletionState {
    // Current completion
    currentSuggestion: CompletionSuggestion | null
    suggestions: CompletionSuggestion[]
    suggestionIndex: number

    // State
    isLoading: boolean
    isVisible: boolean

    // Settings
    enabled: boolean
    autoTrigger: boolean
    triggerDelay: number
    maxSuggestions: number
    preferredModel: string

    // Cache
    cache: Map<string, CompletionSuggestion[]>
    maxCacheSize: number

    // Stats
    acceptedCount: number
    rejectedCount: number
    totalSuggestions: number

    // Actions
    requestCompletion: (context: CompletionContext) => Promise<void>
    cancelCompletion: () => void

    // Navigation
    showSuggestion: () => void
    hideSuggestion: () => void
    nextSuggestion: () => void
    previousSuggestion: () => void

    // Accept/Reject
    acceptSuggestion: () => CompletionSuggestion | null
    rejectSuggestion: () => void
    acceptPartial: (chars: number) => string

    // Settings
    setEnabled: (enabled: boolean) => void
    setAutoTrigger: (autoTrigger: boolean) => void
    setTriggerDelay: (delay: number) => void
    setPreferredModel: (model: string) => void

    // Cache
    getCachedCompletion: (key: string) => CompletionSuggestion[] | undefined
    cacheCompletion: (key: string, suggestions: CompletionSuggestion[]) => void
    clearCache: () => void

    // Stats
    getAcceptanceRate: () => number
}

export const useInlineCompletion = create<InlineCompletionState>((set, get) => ({
    currentSuggestion: null,
    suggestions: [],
    suggestionIndex: 0,
    isLoading: false,
    isVisible: false,
    enabled: true,
    autoTrigger: true,
    triggerDelay: 300,
    maxSuggestions: 3,
    preferredModel: 'gpt-4',
    cache: new Map(),
    maxCacheSize: 100,
    acceptedCount: 0,
    rejectedCount: 0,
    totalSuggestions: 0,

    requestCompletion: async (context) => {
        if (!get().enabled) return

        set({ isLoading: true })

        // Check cache first
        const cacheKey = `${context.file}:${context.line}:${context.prefix.slice(-50)}`
        const cached = get().getCachedCompletion(cacheKey)

        if (cached && cached.length > 0) {
            set({
                suggestions: cached,
                currentSuggestion: cached[0],
                suggestionIndex: 0,
                isLoading: false,
                isVisible: true,
            })
            return
        }

        try {
            // Simulate AI completion request
            await new Promise(resolve => setTimeout(resolve, 500))

            // Generate mock completions based on context
            const suggestions = generateMockCompletions(context)

            if (suggestions.length > 0) {
                // Cache the results
                get().cacheCompletion(cacheKey, suggestions)

                set({
                    suggestions,
                    currentSuggestion: suggestions[0],
                    suggestionIndex: 0,
                    isLoading: false,
                    isVisible: true,
                    totalSuggestions: get().totalSuggestions + suggestions.length,
                })
            } else {
                set({
                    suggestions: [],
                    currentSuggestion: null,
                    isLoading: false,
                    isVisible: false,
                })
            }
        } catch (error) {
            console.error('Completion error:', error)
            set({ isLoading: false, isVisible: false })
        }
    },

    cancelCompletion: () => {
        set({
            isLoading: false,
            isVisible: false,
            currentSuggestion: null,
            suggestions: [],
        })
    },

    showSuggestion: () => set({ isVisible: true }),

    hideSuggestion: () => set({ isVisible: false }),

    nextSuggestion: () => {
        const { suggestions, suggestionIndex } = get()
        if (suggestions.length === 0) return

        const newIndex = (suggestionIndex + 1) % suggestions.length
        set({
            suggestionIndex: newIndex,
            currentSuggestion: suggestions[newIndex],
        })
    },

    previousSuggestion: () => {
        const { suggestions, suggestionIndex } = get()
        if (suggestions.length === 0) return

        const newIndex = suggestionIndex === 0 ? suggestions.length - 1 : suggestionIndex - 1
        set({
            suggestionIndex: newIndex,
            currentSuggestion: suggestions[newIndex],
        })
    },

    acceptSuggestion: () => {
        const { currentSuggestion } = get()

        if (currentSuggestion) {
            set(state => ({
                acceptedCount: state.acceptedCount + 1,
                isVisible: false,
                currentSuggestion: null,
                suggestions: [],
            }))
        }

        return currentSuggestion
    },

    rejectSuggestion: () => {
        set(state => ({
            rejectedCount: state.rejectedCount + 1,
            isVisible: false,
            currentSuggestion: null,
            suggestions: [],
        }))
    },

    acceptPartial: (chars) => {
        const { currentSuggestion } = get()
        if (!currentSuggestion) return ''

        const partial = currentSuggestion.insertText.slice(0, chars)

        // Update suggestion to show remaining
        const remaining = currentSuggestion.insertText.slice(chars)
        if (remaining) {
            set({
                currentSuggestion: {
                    ...currentSuggestion,
                    insertText: remaining,
                    displayText: remaining,
                },
            })
        } else {
            set({
                isVisible: false,
                currentSuggestion: null,
            })
        }

        return partial
    },

    setEnabled: (enabled) => set({ enabled }),

    setAutoTrigger: (autoTrigger) => set({ autoTrigger }),

    setTriggerDelay: (triggerDelay) => set({ triggerDelay }),

    setPreferredModel: (preferredModel) => set({ preferredModel }),

    getCachedCompletion: (key) => get().cache.get(key),

    cacheCompletion: (key, suggestions) => {
        const { cache, maxCacheSize } = get()

        // Evict oldest entries if cache is full
        if (cache.size >= maxCacheSize) {
            const firstKey = cache.keys().next().value
            if (firstKey) cache.delete(firstKey)
        }

        cache.set(key, suggestions)
    },

    clearCache: () => {
        get().cache.clear()
    },

    getAcceptanceRate: () => {
        const { acceptedCount, rejectedCount } = get()
        const total = acceptedCount + rejectedCount
        return total === 0 ? 0 : acceptedCount / total
    },
}))

// Generate mock completions based on context
function generateMockCompletions(context: CompletionContext): CompletionSuggestion[] {
    const suggestions: CompletionSuggestion[] = []

    // Detect patterns and generate relevant completions
    const lastLine = context.prefix.split('\n').pop() || ''

    // Function completion
    if (lastLine.match(/function\s+\w*$/)) {
        suggestions.push({
            id: `comp-${Date.now()}-1`,
            text: '() {\n  \n}',
            displayText: '() { ... }',
            insertText: '() {\n  \n}',
            range: {
                startLine: context.line,
                startColumn: context.column,
                endLine: context.line,
                endColumn: context.column,
            },
            confidence: 0.9,
            source: 'ai',
        })
    }

    // Arrow function
    if (lastLine.match(/const\s+\w+\s*=\s*$/)) {
        suggestions.push({
            id: `comp-${Date.now()}-2`,
            text: '() => {\n  \n}',
            displayText: '() => { ... }',
            insertText: '() => {\n  \n}',
            range: {
                startLine: context.line,
                startColumn: context.column,
                endLine: context.line,
                endColumn: context.column,
            },
            confidence: 0.85,
            source: 'ai',
        })
    }

    // Console log
    if (lastLine.match(/console\./)) {
        suggestions.push({
            id: `comp-${Date.now()}-3`,
            text: 'log()',
            displayText: 'log()',
            insertText: 'log()',
            range: {
                startLine: context.line,
                startColumn: context.column,
                endLine: context.line,
                endColumn: context.column,
            },
            confidence: 0.95,
            source: 'ai',
        })
    }

    // Import statement
    if (lastLine.match(/^import\s+{?\s*$/)) {
        const importSuggestions = [
            'useState, useEffect } from \'react\'',
            'type FC } from \'react\'',
            'create } from \'zustand\'',
        ]

        suggestions.push({
            id: `comp-${Date.now()}-4`,
            text: importSuggestions[0],
            displayText: importSuggestions[0],
            insertText: importSuggestions[0],
            range: {
                startLine: context.line,
                startColumn: context.column,
                endLine: context.line,
                endColumn: context.column,
            },
            confidence: 0.8,
            source: 'ai',
        })
    }

    // Default multi-line completion
    if (suggestions.length === 0 && lastLine.trim().length > 0) {
        suggestions.push({
            id: `comp-${Date.now()}-5`,
            text: ' // TODO: implement',
            displayText: '// TODO: implement',
            insertText: ' // TODO: implement',
            range: {
                startLine: context.line,
                startColumn: context.column,
                endLine: context.line,
                endColumn: context.column,
            },
            confidence: 0.5,
            source: 'ai',
        })
    }

    return suggestions
}

// Helper function to get ghost text display styles
export function getGhostTextStyles() {
    return {
        color: 'rgba(156, 163, 175, 0.5)',
        fontStyle: 'italic',
        pointerEvents: 'none' as const,
        userSelect: 'none' as const,
    }
}

// Get display text for ghost text rendering
export function getGhostDisplayText(suggestion: CompletionSuggestion | null): string {
    return suggestion?.displayText || ''
}

// Keyboard handler for inline completions
export function useInlineCompletionKeyboard() {
    const {
        isVisible,
        acceptSuggestion,
        rejectSuggestion,
        nextSuggestion,
        previousSuggestion
    } = useInlineCompletion()

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isVisible) return

        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault()
            acceptSuggestion()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            rejectSuggestion()
        } else if (e.key === 'ArrowDown' && e.altKey) {
            e.preventDefault()
            nextSuggestion()
        } else if (e.key === 'ArrowUp' && e.altKey) {
            e.preventDefault()
            previousSuggestion()
        }
    }

    return { handleKeyDown }
}
