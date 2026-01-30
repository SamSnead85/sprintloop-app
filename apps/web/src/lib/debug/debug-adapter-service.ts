/**
 * Debug Adapter Service
 * 
 * Manages debugging sessions, breakpoints, and debug state.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type DebugState = 'inactive' | 'initializing' | 'running' | 'paused' | 'stopped';
export type BreakpointType = 'line' | 'conditional' | 'logpoint' | 'exception';

export interface Breakpoint {
    id: string;
    file: string;
    line: number;
    type: BreakpointType;
    enabled: boolean;
    condition?: string;
    logMessage?: string;
    hitCount?: number;
    verified: boolean;
}

export interface StackFrame {
    id: number;
    name: string;
    file: string;
    line: number;
    column: number;
    source?: string;
}

export interface Variable {
    name: string;
    value: string;
    type: string;
    variablesReference: number;
    children?: Variable[];
    evaluateName?: string;
}

export interface Scope {
    name: string;
    variablesReference: number;
    expensive: boolean;
    variables: Variable[];
}

export interface DebugSession {
    id: string;
    name: string;
    type: string;
    state: DebugState;
    startedAt?: Date;
    stackFrames: StackFrame[];
    scopes: Scope[];
    currentFrameId: number | null;
}

export interface WatchExpression {
    id: string;
    expression: string;
    value?: string;
    type?: string;
    error?: string;
}

export interface DebugAdapterState {
    sessions: DebugSession[];
    activeSessionId: string | null;
    breakpoints: Breakpoint[];
    watchExpressions: WatchExpression[];
    exceptionBreakpoints: { caught: boolean; uncaught: boolean };

    // Session lifecycle
    startSession: (name: string, type: string) => string;
    stopSession: (sessionId: string) => void;
    pauseSession: (sessionId: string) => void;
    continueSession: (sessionId: string) => void;

    // Stepping
    stepOver: (sessionId: string) => void;
    stepInto: (sessionId: string) => void;
    stepOut: (sessionId: string) => void;
    restart: (sessionId: string) => void;

    // Breakpoints
    addBreakpoint: (file: string, line: number, options?: Partial<Breakpoint>) => string;
    removeBreakpoint: (breakpointId: string) => void;
    toggleBreakpoint: (breakpointId: string) => void;
    editBreakpoint: (breakpointId: string, updates: Partial<Breakpoint>) => void;
    clearAllBreakpoints: () => void;
    getBreakpointsForFile: (file: string) => Breakpoint[];

    // Watch expressions
    addWatch: (expression: string) => string;
    removeWatch: (watchId: string) => void;
    evaluateWatch: (watchId: string) => void;

    // Stack frames
    selectStackFrame: (sessionId: string, frameId: number) => void;

    // Exception breakpoints
    setExceptionBreakpoints: (caught: boolean, uncaught: boolean) => void;

    // Getters
    getActiveSession: () => DebugSession | undefined;
    isDebugging: () => boolean;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const createMockStackFrames = (): StackFrame[] => [
    { id: 0, name: 'handleRequest', file: 'src/api/handler.ts', line: 42, column: 12 },
    { id: 1, name: 'processData', file: 'src/utils/data.ts', line: 128, column: 8 },
    { id: 2, name: 'validateInput', file: 'src/utils/validation.ts', line: 56, column: 4 },
    { id: 3, name: 'main', file: 'src/index.ts', line: 15, column: 1 },
];

const createMockScopes = (): Scope[] => [
    {
        name: 'Local',
        variablesReference: 1,
        expensive: false,
        variables: [
            { name: 'request', value: '{ method: "POST", url: "/api/users" }', type: 'Object', variablesReference: 2 },
            { name: 'userId', value: '12345', type: 'number', variablesReference: 0 },
            { name: 'isValid', value: 'true', type: 'boolean', variablesReference: 0 },
        ],
    },
    {
        name: 'Closure',
        variablesReference: 3,
        expensive: false,
        variables: [
            { name: 'config', value: '{ debug: true, timeout: 5000 }', type: 'Object', variablesReference: 4 },
        ],
    },
    {
        name: 'Global',
        variablesReference: 5,
        expensive: true,
        variables: [],
    },
];

// =============================================================================
// DEBUG STORE
// =============================================================================

export const useDebugService = create<DebugAdapterState>((set, get) => ({
    sessions: [],
    activeSessionId: null,
    breakpoints: [],
    watchExpressions: [],
    exceptionBreakpoints: { caught: false, uncaught: true },

    startSession: (name, type) => {
        const session: DebugSession = {
            id: `session_${Date.now()}`,
            name,
            type,
            state: 'initializing',
            startedAt: new Date(),
            stackFrames: [],
            scopes: [],
            currentFrameId: null,
        };

        set(state => ({
            sessions: [...state.sessions, session],
            activeSessionId: session.id,
        }));

        // Simulate initialization
        setTimeout(() => {
            set(state => ({
                sessions: state.sessions.map(s =>
                    s.id === session.id ? { ...s, state: 'running' as DebugState } : s
                ),
            }));
        }, 500);

        return session.id;
    },

    stopSession: (sessionId) => {
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === sessionId ? { ...s, state: 'stopped' as DebugState } : s
            ),
        }));

        setTimeout(() => {
            set(state => ({
                sessions: state.sessions.filter(s => s.id !== sessionId),
                activeSessionId: state.activeSessionId === sessionId
                    ? state.sessions[0]?.id || null
                    : state.activeSessionId,
            }));
        }, 500);
    },

    pauseSession: (sessionId) => {
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === sessionId
                    ? {
                        ...s,
                        state: 'paused' as DebugState,
                        stackFrames: createMockStackFrames(),
                        scopes: createMockScopes(),
                        currentFrameId: 0,
                    }
                    : s
            ),
        }));
    },

    continueSession: (sessionId) => {
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === sessionId
                    ? { ...s, state: 'running' as DebugState, stackFrames: [], scopes: [], currentFrameId: null }
                    : s
            ),
        }));
    },

    stepOver: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session || session.state !== 'paused') return;

        set(state => ({
            sessions: state.sessions.map(s => {
                if (s.id !== sessionId) return s;
                const frames = [...s.stackFrames];
                if (frames[0]) {
                    frames[0] = { ...frames[0], line: frames[0].line + 1 };
                }
                return { ...s, stackFrames: frames };
            }),
        }));
    },

    stepInto: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session || session.state !== 'paused') return;

        set(state => ({
            sessions: state.sessions.map(s => {
                if (s.id !== sessionId) return s;
                const newFrame: StackFrame = {
                    id: s.stackFrames.length,
                    name: 'nestedFunction',
                    file: s.stackFrames[0]?.file || 'unknown',
                    line: 1,
                    column: 1,
                };
                return { ...s, stackFrames: [newFrame, ...s.stackFrames], currentFrameId: newFrame.id };
            }),
        }));
    },

    stepOut: (sessionId) => {
        const session = get().sessions.find(s => s.id === sessionId);
        if (!session || session.state !== 'paused') return;

        set(state => ({
            sessions: state.sessions.map(s => {
                if (s.id !== sessionId || s.stackFrames.length <= 1) return s;
                const frames = s.stackFrames.slice(1);
                return { ...s, stackFrames: frames, currentFrameId: frames[0]?.id ?? null };
            }),
        }));
    },

    restart: (sessionId) => {
        get().stopSession(sessionId);
        const session = get().sessions.find(s => s.id === sessionId);
        if (session) {
            setTimeout(() => {
                get().startSession(session.name, session.type);
            }, 600);
        }
    },

    addBreakpoint: (file, line, options = {}) => {
        const existing = get().breakpoints.find(b => b.file === file && b.line === line);
        if (existing) return existing.id;

        const breakpoint: Breakpoint = {
            id: `bp_${Date.now()}`,
            file,
            line,
            type: 'line',
            enabled: true,
            verified: true,
            ...options,
        };

        set(state => ({ breakpoints: [...state.breakpoints, breakpoint] }));
        return breakpoint.id;
    },

    removeBreakpoint: (breakpointId) => {
        set(state => ({
            breakpoints: state.breakpoints.filter(b => b.id !== breakpointId),
        }));
    },

    toggleBreakpoint: (breakpointId) => {
        set(state => ({
            breakpoints: state.breakpoints.map(b =>
                b.id === breakpointId ? { ...b, enabled: !b.enabled } : b
            ),
        }));
    },

    editBreakpoint: (breakpointId, updates) => {
        set(state => ({
            breakpoints: state.breakpoints.map(b =>
                b.id === breakpointId ? { ...b, ...updates } : b
            ),
        }));
    },

    clearAllBreakpoints: () => {
        set({ breakpoints: [] });
    },

    getBreakpointsForFile: (file) => {
        return get().breakpoints.filter(b => b.file === file);
    },

    addWatch: (expression) => {
        const watch: WatchExpression = {
            id: `watch_${Date.now()}`,
            expression,
            value: 'undefined',
        };

        set(state => ({ watchExpressions: [...state.watchExpressions, watch] }));
        get().evaluateWatch(watch.id);
        return watch.id;
    },

    removeWatch: (watchId) => {
        set(state => ({
            watchExpressions: state.watchExpressions.filter(w => w.id !== watchId),
        }));
    },

    evaluateWatch: (watchId) => {
        // Simulate evaluation
        set(state => ({
            watchExpressions: state.watchExpressions.map(w =>
                w.id === watchId
                    ? { ...w, value: `<evaluated: ${w.expression}>`, type: 'any' }
                    : w
            ),
        }));
    },

    selectStackFrame: (sessionId, frameId) => {
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === sessionId ? { ...s, currentFrameId: frameId } : s
            ),
        }));
    },

    setExceptionBreakpoints: (caught, uncaught) => {
        set({ exceptionBreakpoints: { caught, uncaught } });
    },

    getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find(s => s.id === activeSessionId);
    },

    isDebugging: () => {
        const session = get().getActiveSession();
        return session?.state === 'running' || session?.state === 'paused';
    },
}));

// =============================================================================
// UTILITIES
// =============================================================================

export function getStateIcon(state: DebugState): string {
    const icons: Record<DebugState, string> = {
        inactive: '⚫',
        initializing: '🔄',
        running: '🟢',
        paused: '⏸️',
        stopped: '🔴',
    };
    return icons[state];
}

export function getBreakpointIcon(breakpoint: Breakpoint): string {
    if (!breakpoint.enabled) return '⚪';
    if (!breakpoint.verified) return '🔘';

    const icons: Record<BreakpointType, string> = {
        line: '🔴',
        conditional: '🟠',
        logpoint: '🔵',
        exception: '🟣',
    };
    return icons[breakpoint.type];
}
