/**
 * Context Manager
 * 
 * Unified context management for agent operations.
 * Combines memories, codebase understanding, and session context.
 */

import { create } from 'zustand';
import { useMemoryStore, type Memory } from './memories';

// =============================================================================
// TYPES
// =============================================================================

export interface FileContext {
    path: string;
    language: string;
    size: number;
    lastModified: number;
    summary?: string;
    symbols?: SymbolInfo[];
    dependencies?: string[];
}

export interface SymbolInfo {
    name: string;
    type: 'function' | 'class' | 'interface' | 'type' | 'variable' | 'export';
    line: number;
    signature?: string;
}

export interface CodebaseGraph {
    rootPath: string;
    files: Map<string, FileContext>;
    dependencies: Map<string, string[]>;
    lastUpdated: number;
}

export interface SessionContext {
    id: string;
    startedAt: number;
    currentFile?: string;
    recentFiles: string[];
    recentCommands: string[];
    userPreferences: Record<string, unknown>;
}

export interface UnifiedContext {
    session: SessionContext;
    codebase?: CodebaseGraph;
    relevantMemories: Memory[];
    relevantFiles: FileContext[];
    tokenBudget: number;
    actualTokens: number;
}

export interface ContextManagerState {
    sessions: Map<string, SessionContext>;
    activeSessionId: string | null;
    codebaseGraphs: Map<string, CodebaseGraph>;

    // Session management
    createSession: () => string;
    endSession: (sessionId: string) => void;
    setActiveSession: (sessionId: string) => void;

    // Context building
    buildContext: (task: string, tokenBudget?: number) => UnifiedContext;
    getRelevantMemories: (task: string, limit?: number) => Memory[];

    // Codebase tracking
    indexCodebase: (rootPath: string) => Promise<CodebaseGraph>;
    updateFileContext: (path: string, context: FileContext) => void;
    getFileContext: (path: string) => FileContext | undefined;

    // Session activity
    recordFileAccess: (path: string) => void;
    recordCommand: (command: string) => void;
    setUserPreference: (key: string, value: unknown) => void;
}

// =============================================================================
// CONTEXT MANAGER STORE
// =============================================================================

export const useContextManager = create<ContextManagerState>((set, get) => ({
    sessions: new Map(),
    activeSessionId: null,
    codebaseGraphs: new Map(),

    createSession: (): string => {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const session: SessionContext = {
            id: sessionId,
            startedAt: Date.now(),
            recentFiles: [],
            recentCommands: [],
            userPreferences: {},
        };

        set(state => ({
            sessions: new Map(state.sessions).set(sessionId, session),
            activeSessionId: sessionId,
        }));

        return sessionId;
    },

    endSession: (sessionId: string) => {
        set(state => {
            const sessions = new Map(state.sessions);
            sessions.delete(sessionId);
            return {
                sessions,
                activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
            };
        });
    },

    setActiveSession: (sessionId: string) => {
        set({ activeSessionId: sessionId });
    },

    buildContext: (task: string, tokenBudget = 8000): UnifiedContext => {
        const { activeSessionId, sessions, codebaseGraphs } = get();

        // Get current session
        const session = activeSessionId ? sessions.get(activeSessionId) : undefined;
        const defaultSession: SessionContext = {
            id: 'default',
            startedAt: Date.now(),
            recentFiles: [],
            recentCommands: [],
            userPreferences: {},
        };

        // Get relevant memories
        const relevantMemories = get().getRelevantMemories(task, 10);

        // Get relevant files from codebase
        const relevantFiles: FileContext[] = [];
        for (const graph of codebaseGraphs.values()) {
            // Simple relevance: files mentioned in task or recently accessed
            for (const [path, context] of graph.files) {
                if (task.toLowerCase().includes(path.toLowerCase()) ||
                    session?.recentFiles.includes(path)) {
                    relevantFiles.push(context);
                }
            }
        }

        // Estimate tokens (rough: 4 chars per token)
        const memoryTokens = relevantMemories.reduce((sum, m) =>
            sum + Math.ceil((m.title.length + m.content.length) / 4), 0);
        const fileTokens = relevantFiles.reduce((sum, f) =>
            sum + Math.ceil((f.path.length + (f.summary?.length || 0)) / 4), 0);
        const actualTokens = memoryTokens + fileTokens;

        // Trim if over budget
        if (actualTokens > tokenBudget) {
            // Prioritize by importance/recency
            relevantMemories.sort((a, b) => {
                const aScore = (a.importance === 'critical' ? 4 : a.importance === 'high' ? 3 :
                    a.importance === 'medium' ? 2 : 1) + (a.accessCount * 0.1);
                const bScore = (b.importance === 'critical' ? 4 : b.importance === 'high' ? 3 :
                    b.importance === 'medium' ? 2 : 1) + (b.accessCount * 0.1);
                return bScore - aScore;
            });

            // Keep only what fits
            let currentTokens = 0;
            const filteredMemories: Memory[] = [];
            for (const memory of relevantMemories) {
                const memTokens = Math.ceil((memory.title.length + memory.content.length) / 4);
                if (currentTokens + memTokens <= tokenBudget * 0.6) {
                    filteredMemories.push(memory);
                    currentTokens += memTokens;
                }
            }
            relevantMemories.length = 0;
            relevantMemories.push(...filteredMemories);
        }

        return {
            session: session || defaultSession,
            codebase: codebaseGraphs.values().next().value,
            relevantMemories,
            relevantFiles: relevantFiles.slice(0, 10), // Limit files
            tokenBudget,
            actualTokens: Math.min(actualTokens, tokenBudget),
        };
    },

    getRelevantMemories: (task: string, limit = 10): Memory[] => {
        const memoryStore = useMemoryStore.getState();

        // Search memories by task keywords
        const keywords = task.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const searchResults = memoryStore.searchMemories(keywords.join(' '), limit);

        // Also get recent memories
        const recentMemories = memoryStore.getRecentMemories(5);

        // Combine and deduplicate
        const combined = new Map<string, Memory>();
        for (const memory of [...searchResults, ...recentMemories]) {
            combined.set(memory.id, memory);
        }

        return Array.from(combined.values()).slice(0, limit);
    },

    indexCodebase: async (rootPath: string): Promise<CodebaseGraph> => {
        // In real implementation, this would scan the filesystem
        // For now, create an empty graph
        const graph: CodebaseGraph = {
            rootPath,
            files: new Map(),
            dependencies: new Map(),
            lastUpdated: Date.now(),
        };

        set(state => ({
            codebaseGraphs: new Map(state.codebaseGraphs).set(rootPath, graph),
        }));

        console.log(`[ContextManager] Indexed codebase at ${rootPath}`);
        return graph;
    },

    updateFileContext: (path: string, context: FileContext) => {
        set(state => {
            // Find or create graph for this file's root
            const graphs = new Map(state.codebaseGraphs);
            for (const graph of graphs.values()) {
                if (path.startsWith(graph.rootPath)) {
                    const files = new Map(graph.files);
                    files.set(path, context);
                    graphs.set(graph.rootPath, { ...graph, files, lastUpdated: Date.now() });
                    break;
                }
            }
            return { codebaseGraphs: graphs };
        });
    },

    getFileContext: (path: string): FileContext | undefined => {
        for (const graph of get().codebaseGraphs.values()) {
            const context = graph.files.get(path);
            if (context) return context;
        }
        return undefined;
    },

    recordFileAccess: (path: string) => {
        set(state => {
            const { activeSessionId, sessions } = state;
            if (!activeSessionId) return state;

            const session = sessions.get(activeSessionId);
            if (!session) return state;

            const recentFiles = [path, ...session.recentFiles.filter(f => f !== path)].slice(0, 20);
            const updated = new Map(sessions);
            updated.set(activeSessionId, { ...session, recentFiles, currentFile: path });

            return { sessions: updated };
        });
    },

    recordCommand: (command: string) => {
        set(state => {
            const { activeSessionId, sessions } = state;
            if (!activeSessionId) return state;

            const session = sessions.get(activeSessionId);
            if (!session) return state;

            const recentCommands = [command, ...session.recentCommands].slice(0, 50);
            const updated = new Map(sessions);
            updated.set(activeSessionId, { ...session, recentCommands });

            return { sessions: updated };
        });
    },

    setUserPreference: (key: string, value: unknown) => {
        set(state => {
            const { activeSessionId, sessions } = state;
            if (!activeSessionId) return state;

            const session = sessions.get(activeSessionId);
            if (!session) return state;

            const userPreferences = { ...session.userPreferences, [key]: value };
            const updated = new Map(sessions);
            updated.set(activeSessionId, { ...session, userPreferences });

            return { sessions: updated };
        });
    },
}));

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get a summary of the current context for debugging
 */
export function getContextSummary(): string {
    const state = useContextManager.getState();
    const { activeSessionId, sessions, codebaseGraphs } = state;

    const session = activeSessionId ? sessions.get(activeSessionId) : undefined;
    const graphCount = codebaseGraphs.size;
    const totalFiles = Array.from(codebaseGraphs.values())
        .reduce((sum, g) => sum + g.files.size, 0);

    return [
        `Session: ${session ? session.id : 'none'}`,
        `Codebases: ${graphCount}`,
        `Total files indexed: ${totalFiles}`,
        `Recent files: ${session?.recentFiles.length || 0}`,
        `Recent commands: ${session?.recentCommands.length || 0}`,
    ].join('\n');
}

/**
 * Create a context string for AI prompts
 */
export function formatContextForPrompt(context: UnifiedContext): string {
    const parts: string[] = [];

    // Add relevant memories
    if (context.relevantMemories.length > 0) {
        parts.push('## Relevant Memories');
        for (const memory of context.relevantMemories.slice(0, 5)) {
            parts.push(`- ${memory.title}: ${memory.content.slice(0, 200)}...`);
        }
    }

    // Add relevant files
    if (context.relevantFiles.length > 0) {
        parts.push('\n## Relevant Files');
        for (const file of context.relevantFiles.slice(0, 5)) {
            parts.push(`- ${file.path} (${file.language})`);
            if (file.summary) parts.push(`  ${file.summary}`);
        }
    }

    // Add recent activity
    if (context.session.recentFiles.length > 0) {
        parts.push('\n## Recent Activity');
        parts.push(`Files: ${context.session.recentFiles.slice(0, 3).join(', ')}`);
    }

    return parts.join('\n');
}
