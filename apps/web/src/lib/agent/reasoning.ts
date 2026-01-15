/**
 * Agent Reasoning Transparency
 * 
 * Phase 116: Step-by-step reasoning display
 * "Glass box" AI decision visibility with user intervention
 * Source: Cline, OpenCode
 */

import { create } from 'zustand';

export interface ReasoningStep {
    id: string;
    sessionId: string;
    type: ReasoningStepType;
    title: string;
    content: string;
    status: 'pending' | 'active' | 'completed' | 'skipped' | 'error';
    confidence: number; // 0-100
    alternatives?: AlternativeOption[];
    userOverride?: string;
    artifacts?: ReasoningArtifact[];
    duration?: number;
    timestamp: number;
}

export type ReasoningStepType =
    | 'research'
    | 'analysis'
    | 'planning'
    | 'decision'
    | 'action'
    | 'verification'
    | 'reflection';

export interface AlternativeOption {
    id: string;
    title: string;
    description: string;
    confidence: number;
    tradeoffs: string[];
}

export interface ReasoningArtifact {
    type: 'code' | 'file' | 'command' | 'url' | 'data';
    label: string;
    content: string;
}

export interface ReasoningSession {
    id: string;
    prompt: string;
    steps: ReasoningStep[];
    currentStepIndex: number;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
    startedAt: number;
    completedAt?: number;
}

interface ReasoningState {
    sessions: Map<string, ReasoningSession>;
    activeSessionId: string | null;
    expandedSteps: Set<string>;
    showAlternatives: boolean;

    // Session management
    startSession: (prompt: string) => string;
    endSession: (sessionId: string) => void;
    pauseSession: (sessionId: string) => void;

    // Step management
    addStep: (sessionId: string, step: Omit<ReasoningStep, 'id' | 'sessionId' | 'timestamp'>) => string;
    updateStep: (stepId: string, updates: Partial<ReasoningStep>) => void;
    overrideStep: (stepId: string, override: string) => void;
    skipStep: (stepId: string) => void;

    // Alternatives
    selectAlternative: (stepId: string, alternativeId: string) => void;

    // UI state
    toggleStepExpand: (stepId: string) => void;
    setShowAlternatives: (show: boolean) => void;

    // Getters
    getSession: (sessionId: string) => ReasoningSession | undefined;
    getActiveSession: () => ReasoningSession | undefined;
    getCurrentStep: (sessionId: string) => ReasoningStep | undefined;
}

export const useReasoningStore = create<ReasoningState>((set, get) => ({
    sessions: new Map(),
    activeSessionId: null,
    expandedSteps: new Set(),
    showAlternatives: true,

    startSession: (prompt) => {
        const id = `reasoning-${Date.now()}`;
        const session: ReasoningSession = {
            id,
            prompt,
            steps: [],
            currentStepIndex: 0,
            status: 'active',
            startedAt: Date.now(),
        };

        set(state => {
            const sessions = new Map(state.sessions);
            sessions.set(id, session);
            return { sessions, activeSessionId: id };
        });

        return id;
    },

    endSession: (sessionId) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    status: 'completed',
                    completedAt: Date.now(),
                });
            }
            return { sessions };
        });
    },

    pauseSession: (sessionId) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, { ...session, status: 'paused' });
            }
            return { sessions };
        });
    },

    addStep: (sessionId, step) => {
        const stepId = `step-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
        const newStep: ReasoningStep = {
            ...step,
            id: stepId,
            sessionId,
            timestamp: Date.now(),
        };

        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    steps: [...session.steps, newStep],
                    currentStepIndex: session.steps.length,
                });
            }
            return { sessions };
        });

        return stepId;
    },

    updateStep: (stepId, updates) => {
        set(state => {
            const sessions = new Map(state.sessions);
            for (const [id, session] of sessions) {
                const stepIndex = session.steps.findIndex(s => s.id === stepId);
                if (stepIndex >= 0) {
                    const steps = [...session.steps];
                    steps[stepIndex] = { ...steps[stepIndex], ...updates };
                    sessions.set(id, { ...session, steps });
                    break;
                }
            }
            return { sessions };
        });
    },

    overrideStep: (stepId, override) => {
        get().updateStep(stepId, {
            userOverride: override,
            status: 'completed',
        });
    },

    skipStep: (stepId) => {
        get().updateStep(stepId, { status: 'skipped' });
    },

    selectAlternative: (stepId, alternativeId) => {
        const sessions = get().sessions;

        for (const session of sessions.values()) {
            const step = session.steps.find(s => s.id === stepId);
            if (step) {
                const alternative = step.alternatives?.find(a => a.id === alternativeId);
                if (alternative) {
                    get().updateStep(stepId, {
                        title: alternative.title,
                        content: alternative.description,
                        confidence: alternative.confidence,
                        userOverride: `Selected alternative: ${alternative.title}`,
                    });
                }
                break;
            }
        }
    },

    toggleStepExpand: (stepId) => {
        set(state => {
            const expandedSteps = new Set(state.expandedSteps);
            if (expandedSteps.has(stepId)) {
                expandedSteps.delete(stepId);
            } else {
                expandedSteps.add(stepId);
            }
            return { expandedSteps };
        });
    },

    setShowAlternatives: (show) => {
        set({ showAlternatives: show });
    },

    getSession: (sessionId) => {
        return get().sessions.get(sessionId);
    },

    getActiveSession: () => {
        const { activeSessionId, sessions } = get();
        return activeSessionId ? sessions.get(activeSessionId) : undefined;
    },

    getCurrentStep: (sessionId) => {
        const session = get().sessions.get(sessionId);
        if (!session) return undefined;
        return session.steps[session.currentStepIndex];
    },
}));

/**
 * Format reasoning step for display
 */
export function formatReasoningStep(step: ReasoningStep): string {
    const typeEmoji: Record<ReasoningStepType, string> = {
        research: '🔍',
        analysis: '📊',
        planning: '📝',
        decision: '⚖️',
        action: '⚡',
        verification: '✅',
        reflection: '💭',
    };

    return `${typeEmoji[step.type]} ${step.title}`;
}

/**
 * Get confidence color
 */
export function getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return '#4ade80'; // Green
    if (confidence >= 60) return '#facc15'; // Yellow
    if (confidence >= 40) return '#fb923c'; // Orange
    return '#f87171'; // Red
}

/**
 * Create reasoning step from agent action
 */
export function createReasoningFromAction(
    sessionId: string,
    action: string,
    reasoning: string
): string {
    const store = useReasoningStore.getState();

    return store.addStep(sessionId, {
        type: 'action',
        title: action,
        content: reasoning,
        status: 'completed',
        confidence: 85,
    });
}
