/**
 * SprintLoop Cascade Flows Engine
 * 
 * Implements Windsurf-style autonomous coding flow:
 * - Deep codebase understanding with semantic model
 * - Flows technology for developer-AI synchronization
 * - Multi-file editing and refactoring
 * - Turbo mode for fully autonomous execution
 * - Memories and Rulebooks for persistence
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Flow action types tracked by the system
export type FlowActionType =
    | 'file_edit'
    | 'file_create'
    | 'file_delete'
    | 'terminal_command'
    | 'clipboard_copy'
    | 'clipboard_paste'
    | 'file_view'
    | 'search'
    | 'navigate'
    | 'ai_message'
    | 'user_message'

// Individual flow action
export interface FlowAction {
    id: string
    type: FlowActionType
    timestamp: number
    data: {
        filePath?: string
        content?: string
        command?: string
        query?: string
        message?: string
        selection?: { start: number; end: number }
    }
    inferredIntent?: string
}

// Cascade execution mode
export type CascadeMode = 'write' | 'chat' | 'turbo'

// Memory entry (persistent across sessions)
export interface CascadeMemory {
    id: string
    key: string
    value: string
    category: 'project' | 'workflow' | 'preference' | 'pattern'
    createdAt: number
    lastAccessedAt: number
    accessCount: number
}

// Rulebook for custom AI behavior
export interface CascadeRulebook {
    id: string
    name: string
    description: string
    rules: string[]
    enabled: boolean
    priority: number
}

// Built-in rulebooks
const DEFAULT_RULEBOOKS: CascadeRulebook[] = [
    {
        id: 'typescript-strict',
        name: 'TypeScript Strict',
        description: 'Enforce strict TypeScript patterns',
        rules: [
            'Always use explicit type annotations',
            'Prefer interfaces over types for objects',
            'Use const assertions where appropriate',
            'Avoid any type, use unknown if needed',
        ],
        enabled: true,
        priority: 1,
    },
    {
        id: 'react-patterns',
        name: 'React Best Practices',
        description: 'Modern React patterns and hooks',
        rules: [
            'Use functional components with hooks',
            'Prefer custom hooks for reusable logic',
            'Memoize expensive computations',
            'Use proper dependency arrays',
        ],
        enabled: true,
        priority: 2,
    },
    {
        id: 'clean-code',
        name: 'Clean Code',
        description: 'Enforce clean code principles',
        rules: [
            'Keep functions small and focused',
            'Use meaningful variable names',
            'Avoid deep nesting',
            'Prefer composition over inheritance',
        ],
        enabled: true,
        priority: 3,
    },
]

// Semantic model node
interface SemanticNode {
    path: string
    type: 'file' | 'function' | 'class' | 'variable' | 'import' | 'export'
    name: string
    dependencies: string[]
    dependents: string[]
    description?: string
    lastModified: number
}

// Cascade state
interface CascadeFlowState {
    // Current mode
    mode: CascadeMode
    autoExecute: boolean

    // Flow tracking
    flowActions: FlowAction[]
    maxFlowHistory: number

    // Semantic model
    semanticModel: Map<string, SemanticNode>
    isIndexing: boolean
    lastIndexed: number | null

    // Memories (Windsurf feature)
    memories: CascadeMemory[]
    maxMemories: number

    // Rulebooks
    rulebooks: CascadeRulebook[]

    // Pending operations requiring approval
    pendingOperations: FlowAction[]

    // Actions
    setMode: (mode: CascadeMode) => void
    toggleAutoExecute: () => void

    // Flow tracking
    trackAction: (type: FlowActionType, data: FlowAction['data']) => void
    inferIntent: () => string | null
    getRecentActions: (count?: number) => FlowAction[]
    clearFlowHistory: () => void

    // Semantic model
    indexCodebase: (files: { path: string; content: string }[]) => Promise<void>
    getNode: (path: string) => SemanticNode | undefined
    getDependencyChain: (path: string) => string[]
    getAffectedFiles: (changedPaths: string[]) => string[]

    // Memories
    remember: (key: string, value: string, category: CascadeMemory['category']) => void
    recall: (key: string) => string | null
    recallByCategory: (category: CascadeMemory['category']) => CascadeMemory[]
    forgetMemory: (id: string) => void

    // Rulebooks
    addRulebook: (rulebook: Omit<CascadeRulebook, 'id'>) => void
    updateRulebook: (id: string, updates: Partial<CascadeRulebook>) => void
    deleteRulebook: (id: string) => void
    getActiveRules: () => string[]

    // Pending operations
    queueOperation: (action: FlowAction) => void
    approveOperation: (id: string) => FlowAction | undefined
    rejectOperation: (id: string) => void
    approveAllOperations: () => FlowAction[]

    // Generate context summary
    generateFlowContext: () => string
}

export const useCascadeFlow = create<CascadeFlowState>()(
    persist(
        (set, get) => ({
            mode: 'write',
            autoExecute: false,
            flowActions: [],
            maxFlowHistory: 100,
            semanticModel: new Map(),
            isIndexing: false,
            lastIndexed: null,
            memories: [],
            maxMemories: 500,
            rulebooks: DEFAULT_RULEBOOKS,
            pendingOperations: [],

            setMode: (mode) => set({ mode }),

            toggleAutoExecute: () => set(state => ({ autoExecute: !state.autoExecute })),

            trackAction: (type, data) => {
                const action: FlowAction = {
                    id: `flow-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    type,
                    timestamp: Date.now(),
                    data,
                }

                set(state => {
                    const actions = [...state.flowActions, action]
                    // Keep only recent actions
                    if (actions.length > state.maxFlowHistory) {
                        actions.splice(0, actions.length - state.maxFlowHistory)
                    }
                    return { flowActions: actions }
                })
            },

            inferIntent: () => {
                const { flowActions } = get()
                const recent = flowActions.slice(-10)

                if (recent.length === 0) return null

                // Simple intent inference based on action patterns
                const fileEdits = recent.filter(a => a.type === 'file_edit')
                const searches = recent.filter(a => a.type === 'search')
                const terminalCmds = recent.filter(a => a.type === 'terminal_command')

                if (fileEdits.length > 3) {
                    return 'refactoring'
                }
                if (searches.length > 2) {
                    return 'exploring'
                }
                if (terminalCmds.some(c => c.data.command?.includes('test'))) {
                    return 'testing'
                }
                if (terminalCmds.some(c => c.data.command?.includes('build') || c.data.command?.includes('deploy'))) {
                    return 'deploying'
                }

                return null
            },

            getRecentActions: (count = 10) => get().flowActions.slice(-count),

            clearFlowHistory: () => set({ flowActions: [] }),

            indexCodebase: async (files) => {
                set({ isIndexing: true })

                const model = new Map<string, SemanticNode>()

                for (const file of files) {
                    // Simple semantic parsing
                    const node: SemanticNode = {
                        path: file.path,
                        type: 'file',
                        name: file.path.split('/').pop() || file.path,
                        dependencies: extractDependencies(file.content),
                        dependents: [],
                        lastModified: Date.now(),
                    }
                    model.set(file.path, node)
                }

                // Build dependents graph
                for (const [path, node] of model) {
                    for (const dep of node.dependencies) {
                        const depNode = model.get(dep)
                        if (depNode) {
                            depNode.dependents.push(path)
                        }
                    }
                }

                set({
                    semanticModel: model,
                    isIndexing: false,
                    lastIndexed: Date.now(),
                })
            },

            getNode: (path) => get().semanticModel.get(path),

            getDependencyChain: (path) => {
                const { semanticModel } = get()
                const visited = new Set<string>()
                const chain: string[] = []

                function traverse(p: string) {
                    if (visited.has(p)) return
                    visited.add(p)
                    chain.push(p)

                    const node = semanticModel.get(p)
                    if (node) {
                        for (const dep of node.dependencies) {
                            traverse(dep)
                        }
                    }
                }

                traverse(path)
                return chain
            },

            getAffectedFiles: (changedPaths) => {
                const { semanticModel } = get()
                const affected = new Set<string>()

                function propagate(path: string) {
                    if (affected.has(path)) return
                    affected.add(path)

                    const node = semanticModel.get(path)
                    if (node) {
                        for (const dependent of node.dependents) {
                            propagate(dependent)
                        }
                    }
                }

                for (const path of changedPaths) {
                    propagate(path)
                }

                return Array.from(affected)
            },

            remember: (key, value, category) => {
                const { memories, maxMemories } = get()

                // Check if key exists
                const existing = memories.find(m => m.key === key)

                if (existing) {
                    set({
                        memories: memories.map(m =>
                            m.key === key
                                ? { ...m, value, lastAccessedAt: Date.now(), accessCount: m.accessCount + 1 }
                                : m
                        ),
                    })
                } else {
                    const newMemory: CascadeMemory = {
                        id: `mem-${Date.now()}`,
                        key,
                        value,
                        category,
                        createdAt: Date.now(),
                        lastAccessedAt: Date.now(),
                        accessCount: 1,
                    }

                    let updatedMemories = [...memories, newMemory]

                    // Purge old memories if over limit (LRU)
                    if (updatedMemories.length > maxMemories) {
                        updatedMemories.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
                        updatedMemories = updatedMemories.slice(0, maxMemories)
                    }

                    set({ memories: updatedMemories })
                }
            },

            recall: (key) => {
                const { memories } = get()
                const memory = memories.find(m => m.key === key)

                if (memory) {
                    // Update access stats
                    set({
                        memories: memories.map(m =>
                            m.key === key
                                ? { ...m, lastAccessedAt: Date.now(), accessCount: m.accessCount + 1 }
                                : m
                        ),
                    })
                    return memory.value
                }

                return null
            },

            recallByCategory: (category) => get().memories.filter(m => m.category === category),

            forgetMemory: (id) => {
                set(state => ({
                    memories: state.memories.filter(m => m.id !== id),
                }))
            },

            addRulebook: (rulebook) => {
                const newRulebook: CascadeRulebook = {
                    ...rulebook,
                    id: `rb-${Date.now()}`,
                }
                set(state => ({ rulebooks: [...state.rulebooks, newRulebook] }))
            },

            updateRulebook: (id, updates) => {
                set(state => ({
                    rulebooks: state.rulebooks.map(rb =>
                        rb.id === id ? { ...rb, ...updates } : rb
                    ),
                }))
            },

            deleteRulebook: (id) => {
                set(state => ({
                    rulebooks: state.rulebooks.filter(rb => rb.id !== id),
                }))
            },

            getActiveRules: () => {
                const { rulebooks } = get()
                return rulebooks
                    .filter(rb => rb.enabled)
                    .sort((a, b) => a.priority - b.priority)
                    .flatMap(rb => rb.rules)
            },

            queueOperation: (action) => {
                set(state => ({
                    pendingOperations: [...state.pendingOperations, action],
                }))
            },

            approveOperation: (id) => {
                const { pendingOperations } = get()
                const operation = pendingOperations.find(op => op.id === id)

                if (operation) {
                    set({
                        pendingOperations: pendingOperations.filter(op => op.id !== id),
                    })
                }

                return operation
            },

            rejectOperation: (id) => {
                set(state => ({
                    pendingOperations: state.pendingOperations.filter(op => op.id !== id),
                }))
            },

            approveAllOperations: () => {
                const { pendingOperations } = get()
                set({ pendingOperations: [] })
                return pendingOperations
            },

            generateFlowContext: () => {
                const { flowActions, memories, rulebooks, inferIntent } = get()

                const intent = inferIntent()
                const recentActions = flowActions.slice(-5)
                const relevantMemories = memories.slice(-10)
                const activeRules = rulebooks.filter(rb => rb.enabled)

                let context = '=== Flow Context ===\n'

                if (intent) {
                    context += `\nInferred Intent: ${intent}\n`
                }

                if (recentActions.length > 0) {
                    context += `\nRecent Actions:\n${recentActions.map(a =>
                        `- ${a.type}: ${a.data.filePath || a.data.command || a.data.message || ''}`
                    ).join('\n')}\n`
                }

                if (relevantMemories.length > 0) {
                    context += `\nRelevant Memories:\n${relevantMemories.map(m =>
                        `- ${m.key}: ${m.value.slice(0, 100)}...`
                    ).join('\n')}\n`
                }

                if (activeRules.length > 0) {
                    context += `\nActive Rules:\n${activeRules.flatMap(rb => rb.rules).join('\n')}\n`
                }

                return context
            },
        }),
        {
            name: 'sprintloop-cascade-flow',
            partialize: (state) => ({
                mode: state.mode,
                autoExecute: state.autoExecute,
                memories: state.memories,
                rulebooks: state.rulebooks,
            }),
        }
    )
)

// Helper to extract dependencies from file content
function extractDependencies(content: string): string[] {
    const deps: string[] = []

    // Match import statements
    const importRegex = /import\s+(?:(?:\{[^}]*\}|[\w*]+)\s+from\s+)?['"]([^'"]+)['"]/g
    let match
    while ((match = importRegex.exec(content)) !== null) {
        deps.push(match[1])
    }

    // Match require statements
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
    while ((match = requireRegex.exec(content)) !== null) {
        deps.push(match[1])
    }

    return deps
}
