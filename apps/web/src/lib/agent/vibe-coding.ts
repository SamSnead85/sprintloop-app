/**
 * Vibe Coding Mode
 * 
 * Phase 109: Assign same problem to multiple AI models simultaneously
 * Compare results side-by-side and select best approach
 * Source: Cursor 2.0
 */

import { create } from 'zustand';

export interface VibeCodingSession {
    id: string;
    prompt: string;
    models: ModelConfig[];
    responses: ModelResponse[];
    status: 'running' | 'completed' | 'cancelled';
    selectedResponseId: string | null;
    startedAt: number;
    completedAt?: number;
}

export interface ModelConfig {
    id: string;
    provider: 'anthropic' | 'openai' | 'google' | 'local';
    model: string;
    displayName: string;
    temperature: number;
    maxTokens: number;
}

export interface ModelResponse {
    id: string;
    modelId: string;
    content: string;
    codeBlocks: CodeBlock[];
    status: 'pending' | 'streaming' | 'completed' | 'error';
    error?: string;
    metrics: ResponseMetrics;
    startedAt: number;
    completedAt?: number;
}

export interface CodeBlock {
    language: string;
    code: string;
    filename?: string;
}

export interface ResponseMetrics {
    tokensUsed: number;
    latencyMs: number;
    estimatedCost: number;
    qualityScore?: number; // 0-100, user-rated or AI-evaluated
}

interface VibeCodingState {
    sessions: VibeCodingSession[];
    activeSessionId: string | null;
    defaultModels: ModelConfig[];

    // Actions
    startSession: (prompt: string, models?: ModelConfig[]) => string;
    cancelSession: (sessionId: string) => void;
    selectResponse: (sessionId: string, responseId: string) => void;
    rateResponse: (sessionId: string, responseId: string, score: number) => void;
    triggerModelCalls: (sessionId: string) => Promise<void>;

    // Getters
    getSession: (sessionId: string) => VibeCodingSession | undefined;
    getActiveSession: () => VibeCodingSession | undefined;
}

// Default model configurations
const DEFAULT_MODELS: ModelConfig[] = [
    {
        id: 'claude-4-sonnet',
        provider: 'anthropic',
        model: 'claude-4-sonnet-20260101',
        displayName: 'Claude 4 Sonnet',
        temperature: 0.7,
        maxTokens: 4096,
    },
    {
        id: 'gpt-4o',
        provider: 'openai',
        model: 'gpt-4o',
        displayName: 'GPT-4o',
        temperature: 0.7,
        maxTokens: 4096,
    },
    {
        id: 'gemini-2-flash',
        provider: 'google',
        model: 'gemini-2.0-flash-exp',
        displayName: 'Gemini 2.0 Flash',
        temperature: 0.7,
        maxTokens: 4096,
    },
];

export const useVibeCodingStore = create<VibeCodingState>((set, get) => ({
    sessions: [],
    activeSessionId: null,
    defaultModels: DEFAULT_MODELS,

    startSession: (prompt, models) => {
        const modelsToUse = models || get().defaultModels;
        const sessionId = `vibe-${Date.now()}`;

        const session: VibeCodingSession = {
            id: sessionId,
            prompt,
            models: modelsToUse,
            responses: modelsToUse.map(model => ({
                id: `resp-${model.id}-${Date.now()}`,
                modelId: model.id,
                content: '',
                codeBlocks: [],
                status: 'pending',
                metrics: {
                    tokensUsed: 0,
                    latencyMs: 0,
                    estimatedCost: 0,
                },
                startedAt: Date.now(),
            })),
            status: 'running',
            selectedResponseId: null,
            startedAt: Date.now(),
        };

        set(state => ({
            sessions: [...state.sessions, session],
            activeSessionId: sessionId,
        }));

        // Trigger parallel model calls
        get().triggerModelCalls(sessionId);

        return sessionId;
    },

    cancelSession: (sessionId) => {
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === sessionId
                    ? { ...s, status: 'cancelled' as const }
                    : s
            ),
        }));
    },

    selectResponse: (sessionId, responseId) => {
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === sessionId
                    ? { ...s, selectedResponseId: responseId }
                    : s
            ),
        }));
    },

    rateResponse: (sessionId, responseId, score) => {
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === sessionId
                    ? {
                        ...s,
                        responses: s.responses.map(r =>
                            r.id === responseId
                                ? { ...r, metrics: { ...r.metrics, qualityScore: score } }
                                : r
                        ),
                    }
                    : s
            ),
        }));
    },

    getSession: (sessionId) => {
        return get().sessions.find(s => s.id === sessionId);
    },

    getActiveSession: () => {
        const { activeSessionId, sessions } = get();
        return activeSessionId ? sessions.find(s => s.id === activeSessionId) : undefined;
    },

    // Internal: trigger parallel API calls
    triggerModelCalls: async (sessionId: string) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session) return;

        console.log('[VibeCoding] Starting parallel model calls for session:', sessionId);

        // In real implementation, make parallel API calls
        // For now, simulate with timeouts
        const promises = session.responses.map(async (response, index) => {
            const model = session.models.find(m => m.id === response.modelId);
            if (!model) return;

            // Simulate varying response times
            await new Promise(resolve => setTimeout(resolve, 1000 + index * 500));

            // Update response status to streaming
            set(state => ({
                sessions: state.sessions.map(s =>
                    s.id === sessionId
                        ? {
                            ...s,
                            responses: s.responses.map(r =>
                                r.id === response.id
                                    ? { ...r, status: 'streaming' as const }
                                    : r
                            ),
                        }
                        : s
                ),
            }));

            // Simulate completion
            await new Promise(resolve => setTimeout(resolve, 1000 + index * 300));

            const completedAt = Date.now();
            set(state => ({
                sessions: state.sessions.map(s =>
                    s.id === sessionId
                        ? {
                            ...s,
                            responses: s.responses.map(r =>
                                r.id === response.id
                                    ? {
                                        ...r,
                                        status: 'completed' as const,
                                        content: `Response from ${model.displayName}:\n\n${session.prompt}\n\n// Implementation here...`,
                                        codeBlocks: [{
                                            language: 'typescript',
                                            code: `// ${model.displayName} solution\nfunction solve() {\n  // ...\n}`,
                                        }],
                                        completedAt,
                                        metrics: {
                                            tokensUsed: 500 + Math.random() * 500,
                                            latencyMs: completedAt - r.startedAt,
                                            estimatedCost: 0.001 + Math.random() * 0.01,
                                        },
                                    }
                                    : r
                            ),
                        }
                        : s
                ),
            }));
        });

        await Promise.all(promises);

        // Mark session as completed
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === sessionId
                    ? { ...s, status: 'completed' as const, completedAt: Date.now() }
                    : s
            ),
        }));
    },
}));

/**
 * Extract code blocks from markdown response
 */
export function extractCodeBlocks(content: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        blocks.push({
            language: match[1] || 'plaintext',
            code: match[2].trim(),
        });
    }

    return blocks;
}

/**
 * Compare two code solutions
 */
export function compareSolutions(a: CodeBlock, b: CodeBlock): {
    additions: string[];
    deletions: string[];
    similarity: number;
} {
    const linesA = a.code.split('\n');
    const linesB = b.code.split('\n');

    const setA = new Set(linesA);
    const setB = new Set(linesB);

    const additions = linesB.filter(l => !setA.has(l));
    const deletions = linesA.filter(l => !setB.has(l));

    const intersection = linesA.filter(l => setB.has(l)).length;
    const union = new Set([...linesA, ...linesB]).size;
    const similarity = union > 0 ? (intersection / union) * 100 : 0;

    return { additions, deletions, similarity };
}
