/**
 * Agent Memory System
 * 
 * Phase 111: Automatic and user-created memories
 * Cross-session context persistence
 * Source: Windsurf
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Memory {
    id: string;
    type: 'automatic' | 'user-created';
    category: MemoryCategory;
    title: string;
    content: string;
    context?: MemoryContext;
    tags: string[];
    importance: 'low' | 'medium' | 'high' | 'critical';
    createdAt: number;
    lastAccessedAt: number;
    accessCount: number;
    expiresAt?: number;
    sourceSessionId?: string;
}

export type MemoryCategory =
    | 'code_pattern'
    | 'project_structure'
    | 'api_reference'
    | 'bug_fix'
    | 'preference'
    | 'dependency'
    | 'convention'
    | 'other';

export interface MemoryContext {
    filePath?: string;
    functionName?: string;
    language?: string;
    projectPath?: string;
    relatedMemories?: string[];
}

interface MemoryState {
    memories: Memory[];
    autoGenerate: boolean;
    maxMemories: number;

    // CRUD
    createMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>) => string;
    updateMemory: (id: string, updates: Partial<Memory>) => void;
    deleteMemory: (id: string) => void;

    // Queries
    searchMemories: (query: string, limit?: number) => Memory[];
    getMemoriesByCategory: (category: MemoryCategory) => Memory[];
    getRecentMemories: (limit?: number) => Memory[];
    getRelatedMemories: (context: MemoryContext, limit?: number) => Memory[];

    // Access tracking
    accessMemory: (id: string) => void;

    // Settings
    setAutoGenerate: (enabled: boolean) => void;
    pruneExpiredMemories: () => void;

    // Export/Import
    exportMemories: () => string;
    importMemories: (json: string) => number;
}

export const useMemoryStore = create<MemoryState>()(
    persist(
        (set, get) => ({
            memories: [],
            autoGenerate: true,
            maxMemories: 1000,

            createMemory: (memory) => {
                const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                const newMemory: Memory = {
                    ...memory,
                    id,
                    createdAt: Date.now(),
                    lastAccessedAt: Date.now(),
                    accessCount: 0,
                };

                set(state => {
                    let memories = [...state.memories, newMemory];

                    // Enforce max memories limit by removing oldest low-importance
                    if (memories.length > state.maxMemories) {
                        memories = memories
                            .sort((a, b) => {
                                const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                                return importanceOrder[b.importance] - importanceOrder[a.importance] ||
                                    b.lastAccessedAt - a.lastAccessedAt;
                            })
                            .slice(0, state.maxMemories);
                    }

                    return { memories };
                });

                console.log('[MemorySystem] Created memory:', newMemory.title);
                return id;
            },

            updateMemory: (id, updates) => {
                set(state => ({
                    memories: state.memories.map(m =>
                        m.id === id ? { ...m, ...updates } : m
                    ),
                }));
            },

            deleteMemory: (id) => {
                set(state => ({
                    memories: state.memories.filter(m => m.id !== id),
                }));
            },

            searchMemories: (query, limit = 10) => {
                const queryLower = query.toLowerCase();
                return get().memories
                    .filter(m =>
                        m.title.toLowerCase().includes(queryLower) ||
                        m.content.toLowerCase().includes(queryLower) ||
                        m.tags.some(t => t.toLowerCase().includes(queryLower))
                    )
                    .sort((a, b) => b.lastAccessedAt - a.lastAccessedAt)
                    .slice(0, limit);
            },

            getMemoriesByCategory: (category) => {
                return get().memories
                    .filter(m => m.category === category)
                    .sort((a, b) => b.accessCount - a.accessCount);
            },

            getRecentMemories: (limit = 20) => {
                return get().memories
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .slice(0, limit);
            },

            getRelatedMemories: (context, limit = 5) => {
                const memories = get().memories;
                const scored: { memory: Memory; score: number }[] = [];

                for (const memory of memories) {
                    let score = 0;

                    if (context.filePath && memory.context?.filePath === context.filePath) {
                        score += 10;
                    }
                    if (context.language && memory.context?.language === context.language) {
                        score += 5;
                    }
                    if (context.projectPath && memory.context?.projectPath === context.projectPath) {
                        score += 3;
                    }
                    if (context.functionName && memory.content.includes(context.functionName)) {
                        score += 7;
                    }

                    // Boost by access count
                    score += Math.min(memory.accessCount, 10) * 0.5;

                    // Boost by importance
                    const importanceBoost = { critical: 5, high: 3, medium: 1, low: 0 };
                    score += importanceBoost[memory.importance];

                    if (score > 0) {
                        scored.push({ memory, score });
                    }
                }

                return scored
                    .sort((a, b) => b.score - a.score)
                    .slice(0, limit)
                    .map(s => s.memory);
            },

            accessMemory: (id) => {
                set(state => ({
                    memories: state.memories.map(m =>
                        m.id === id
                            ? { ...m, lastAccessedAt: Date.now(), accessCount: m.accessCount + 1 }
                            : m
                    ),
                }));
            },

            setAutoGenerate: (enabled) => {
                set({ autoGenerate: enabled });
            },

            pruneExpiredMemories: () => {
                const now = Date.now();
                set(state => ({
                    memories: state.memories.filter(m =>
                        !m.expiresAt || m.expiresAt > now
                    ),
                }));
            },

            exportMemories: () => {
                return JSON.stringify(get().memories, null, 2);
            },

            importMemories: (json) => {
                try {
                    const imported = JSON.parse(json) as Memory[];
                    set(state => ({
                        memories: [...state.memories, ...imported],
                    }));
                    return imported.length;
                } catch {
                    return 0;
                }
            },
        }),
        {
            name: 'sprintloop:agent-memories',
            partialize: (state) => ({
                memories: state.memories,
                autoGenerate: state.autoGenerate,
                maxMemories: state.maxMemories,
            }),
        }
    )
);

/**
 * Auto-generate memory from conversation
 */
export function generateMemoryFromMessage(
    message: string,
    response: string,
    context?: MemoryContext
): Omit<Memory, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'> | null {
    // Simple heuristics for automatic memory generation
    const responseLower = response.toLowerCase();

    // Check for patterns worth remembering
    if (responseLower.includes('remember that') || responseLower.includes('note that')) {
        return {
            type: 'automatic',
            category: 'convention',
            title: 'Convention noted',
            content: response.slice(0, 500),
            context,
            tags: ['auto-generated'],
            importance: 'medium',
        };
    }

    if (responseLower.includes('the fix is') || responseLower.includes('to fix this')) {
        return {
            type: 'automatic',
            category: 'bug_fix',
            title: 'Bug fix pattern',
            content: response.slice(0, 500),
            context,
            tags: ['auto-generated', 'bug-fix'],
            importance: 'high',
        };
    }

    if (message.toLowerCase().includes('install') && responseLower.includes('npm')) {
        return {
            type: 'automatic',
            category: 'dependency',
            title: 'Package installation',
            content: response.slice(0, 300),
            context,
            tags: ['auto-generated', 'dependencies'],
            importance: 'low',
        };
    }

    return null;
}

/**
 * Create a user memory via command
 */
export function createUserMemory(
    content: string,
    context?: MemoryContext
): string {
    const store = useMemoryStore.getState();

    // Extract title from first line or generate one
    const lines = content.split('\n');
    const title = lines[0].slice(0, 100) || 'User memory';

    return store.createMemory({
        type: 'user-created',
        category: 'other',
        title,
        content,
        context,
        tags: ['user-created'],
        importance: 'medium',
    });
}
