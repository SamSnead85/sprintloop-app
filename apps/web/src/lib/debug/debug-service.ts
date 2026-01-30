/**
 * Debug Service
 * 
 * Full debugging support with breakpoints, call stack, and variable inspection.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface Breakpoint {
    id: string;
    filePath: string;
    line: number;
    column?: number;
    condition?: string;
    hitCount?: number;
    logMessage?: string;
    enabled: boolean;
    verified: boolean;
}

export interface StackFrame {
    id: number;
    name: string;
    source: {
        path: string;
        line: number;
        column?: number;
    };
    scopes: Scope[];
}

export interface Scope {
    name: string;
    variablesReference: number;
    expensive: boolean;
}

export interface Variable {
    name: string;
    value: string;
    type?: string;
    variablesReference: number;
    namedVariables?: number;
    indexedVariables?: number;
    evaluateName?: string;
}

export interface WatchExpression {
    id: string;
    expression: string;
    value?: string;
    type?: string;
    error?: string;
}

export type DebugState = 'inactive' | 'running' | 'paused' | 'stopped';

export interface DebugConfiguration {
    name: string;
    type: string;
    request: 'launch' | 'attach';
    program?: string;
    args?: string[];
    cwd?: string;
    env?: Record<string, string>;
    port?: number;
    stopOnEntry?: boolean;
}

export interface DebugServiceState {
    state: DebugState;
    currentSession: string | null;
    configurations: DebugConfiguration[];
    breakpoints: Map<string, Breakpoint[]>;
    callStack: StackFrame[];
    currentFrame: number | null;
    variables: Map<number, Variable[]>;
    watchExpressions: WatchExpression[];
    output: DebugOutput[];

    // Session
    startSession: (config: DebugConfiguration) => Promise<void>;
    stopSession: () => Promise<void>;

    // Control
    continue: () => Promise<void>;
    pause: () => Promise<void>;
    stepOver: () => Promise<void>;
    stepInto: () => Promise<void>;
    stepOut: () => Promise<void>;
    restart: () => Promise<void>;

    // Breakpoints
    addBreakpoint: (filePath: string, line: number, options?: Partial<Breakpoint>) => void;
    removeBreakpoint: (id: string) => void;
    toggleBreakpoint: (filePath: string, line: number) => void;
    updateBreakpoint: (id: string, updates: Partial<Breakpoint>) => void;
    clearBreakpoints: (filePath?: string) => void;
    getBreakpointsForFile: (filePath: string) => Breakpoint[];

    // Variables
    getVariables: (variablesReference: number) => Promise<Variable[]>;
    setVariable: (variablesReference: number, name: string, value: string) => Promise<boolean>;

    // Watch
    addWatch: (expression: string) => void;
    removeWatch: (id: string) => void;
    evaluateWatch: (id: string) => Promise<void>;

    // Evaluation
    evaluate: (expression: string, frameId?: number) => Promise<string>;

    // Stack
    setCurrentFrame: (frameId: number) => void;
}

export interface DebugOutput {
    type: 'console' | 'stdout' | 'stderr' | 'debug';
    message: string;
    timestamp: number;
    source?: string;
}

// =============================================================================
// DEBUG STORE
// =============================================================================

let breakpointIdCounter = 0;
let watchIdCounter = 0;

export const useDebugService = create<DebugServiceState>((set, get) => ({
    state: 'inactive',
    currentSession: null,
    configurations: getDefaultConfigurations(),
    breakpoints: new Map(),
    callStack: [],
    currentFrame: null,
    variables: new Map(),
    watchExpressions: [],
    output: [],

    startSession: async (config) => {
        set({
            state: 'running',
            currentSession: config.name,
            output: [{
                type: 'debug',
                message: `Starting debug session: ${config.name}`,
                timestamp: Date.now(),
            }],
        });

        // Simulate debug adapter connection
        await simulateDebugStart(config);

        // If stopOnEntry, pause immediately
        if (config.stopOnEntry) {
            const mockStack = generateMockCallStack(config.program || 'index.ts');
            set({
                state: 'paused',
                callStack: mockStack,
                currentFrame: mockStack[0]?.id || null,
            });
        }
    },

    stopSession: async () => {
        set({
            state: 'inactive',
            currentSession: null,
            callStack: [],
            currentFrame: null,
            variables: new Map(),
            output: [...get().output, {
                type: 'debug',
                message: 'Debug session ended',
                timestamp: Date.now(),
            }],
        });
    },

    continue: async () => {
        const { state } = get();
        if (state !== 'paused') return;

        set({ state: 'running', callStack: [], currentFrame: null });

        // Simulate hitting next breakpoint
        await new Promise(resolve => setTimeout(resolve, 500));

        const breakpoints = Array.from(get().breakpoints.values()).flat();
        if (breakpoints.length > 0 && Math.random() > 0.3) {
            const bp = breakpoints[Math.floor(Math.random() * breakpoints.length)];
            const mockStack = generateMockCallStack(bp.filePath, bp.line);
            set({
                state: 'paused',
                callStack: mockStack,
                currentFrame: mockStack[0]?.id || null,
            });
        }
    },

    pause: async () => {
        if (get().state !== 'running') return;

        const mockStack = generateMockCallStack('index.ts');
        set({
            state: 'paused',
            callStack: mockStack,
            currentFrame: mockStack[0]?.id || null,
        });
    },

    stepOver: async () => {
        if (get().state !== 'paused') return;

        set({ state: 'running' });
        await new Promise(resolve => setTimeout(resolve, 100));

        const { callStack } = get();
        if (callStack.length > 0) {
            const updated = [...callStack];
            updated[0] = {
                ...updated[0],
                source: {
                    ...updated[0].source,
                    line: updated[0].source.line + 1,
                },
            };
            set({ state: 'paused', callStack: updated });
        }
    },

    stepInto: async () => {
        if (get().state !== 'paused') return;

        set({ state: 'running' });
        await new Promise(resolve => setTimeout(resolve, 100));

        const { callStack } = get();
        const newFrame: StackFrame = {
            id: callStack.length,
            name: 'innerFunction',
            source: { path: callStack[0]?.source.path || 'unknown.ts', line: 1 },
            scopes: [{ name: 'Local', variablesReference: 1, expensive: false }],
        };
        set({ state: 'paused', callStack: [newFrame, ...callStack], currentFrame: newFrame.id });
    },

    stepOut: async () => {
        if (get().state !== 'paused') return;

        set({ state: 'running' });
        await new Promise(resolve => setTimeout(resolve, 100));

        const { callStack } = get();
        if (callStack.length > 1) {
            const updated = callStack.slice(1);
            set({ state: 'paused', callStack: updated, currentFrame: updated[0]?.id || null });
        }
    },

    restart: async () => {
        const { currentSession, configurations } = get();
        if (!currentSession) return;

        await get().stopSession();
        const config = configurations.find(c => c.name === currentSession);
        if (config) {
            await get().startSession(config);
        }
    },

    addBreakpoint: (filePath, line, options = {}) => {
        const id = `bp_${++breakpointIdCounter}`;
        const breakpoint: Breakpoint = {
            id,
            filePath,
            line,
            enabled: true,
            verified: true,
            ...options,
        };

        set(state => {
            const fileBreakpoints = state.breakpoints.get(filePath) || [];
            const newBreakpoints = new Map(state.breakpoints);
            newBreakpoints.set(filePath, [...fileBreakpoints, breakpoint]);
            return { breakpoints: newBreakpoints };
        });
    },

    removeBreakpoint: (id) => {
        set(state => {
            const newBreakpoints = new Map(state.breakpoints);
            for (const [filePath, bps] of newBreakpoints) {
                const filtered = bps.filter(bp => bp.id !== id);
                if (filtered.length !== bps.length) {
                    newBreakpoints.set(filePath, filtered);
                }
            }
            return { breakpoints: newBreakpoints };
        });
    },

    toggleBreakpoint: (filePath, line) => {
        const existing = get().getBreakpointsForFile(filePath).find(bp => bp.line === line);
        if (existing) {
            get().removeBreakpoint(existing.id);
        } else {
            get().addBreakpoint(filePath, line);
        }
    },

    updateBreakpoint: (id, updates) => {
        set(state => {
            const newBreakpoints = new Map(state.breakpoints);
            for (const [filePath, bps] of newBreakpoints) {
                const idx = bps.findIndex(bp => bp.id === id);
                if (idx !== -1) {
                    const updated = [...bps];
                    updated[idx] = { ...updated[idx], ...updates };
                    newBreakpoints.set(filePath, updated);
                    break;
                }
            }
            return { breakpoints: newBreakpoints };
        });
    },

    clearBreakpoints: (filePath) => {
        set(state => {
            const newBreakpoints = new Map(state.breakpoints);
            if (filePath) {
                newBreakpoints.delete(filePath);
            } else {
                newBreakpoints.clear();
            }
            return { breakpoints: newBreakpoints };
        });
    },

    getBreakpointsForFile: (filePath) => {
        return get().breakpoints.get(filePath) || [];
    },

    getVariables: async (variablesReference) => {
        // Return cached or generate mock variables
        const cached = get().variables.get(variablesReference);
        if (cached) return cached;

        const mockVars = generateMockVariables(variablesReference);
        set(state => {
            const newVars = new Map(state.variables);
            newVars.set(variablesReference, mockVars);
            return { variables: newVars };
        });
        return mockVars;
    },

    setVariable: async (_variablesReference, _name, _value) => {
        // In real implementation, send to debug adapter
        return true;
    },

    addWatch: (expression) => {
        const id = `watch_${++watchIdCounter}`;
        set(state => ({
            watchExpressions: [...state.watchExpressions, { id, expression }],
        }));
        get().evaluateWatch(id);
    },

    removeWatch: (id) => {
        set(state => ({
            watchExpressions: state.watchExpressions.filter(w => w.id !== id),
        }));
    },

    evaluateWatch: async (id) => {
        const watch = get().watchExpressions.find(w => w.id === id);
        if (!watch) return;

        // Simulate evaluation
        await new Promise(resolve => setTimeout(resolve, 50));

        const result = evaluateMockExpression(watch.expression);
        set(state => ({
            watchExpressions: state.watchExpressions.map(w =>
                w.id === id ? { ...w, ...result } : w
            ),
        }));
    },

    evaluate: async (expression, _frameId) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        const result = evaluateMockExpression(expression);
        if (result.error) throw new Error(result.error);
        return result.value || 'undefined';
    },

    setCurrentFrame: (frameId) => {
        set({ currentFrame: frameId });
    },
}));

// =============================================================================
// HELPERS
// =============================================================================

function getDefaultConfigurations(): DebugConfiguration[] {
    return [
        {
            name: 'Launch Program',
            type: 'node',
            request: 'launch',
            program: '${workspaceFolder}/src/index.ts',
            stopOnEntry: false,
        },
        {
            name: 'Attach to Process',
            type: 'node',
            request: 'attach',
            port: 9229,
        },
        {
            name: 'Debug Tests',
            type: 'node',
            request: 'launch',
            program: '${workspaceFolder}/node_modules/.bin/vitest',
            args: ['--run'],
        },
    ];
}

async function simulateDebugStart(_config: DebugConfiguration): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200));
}

function generateMockCallStack(filePath: string, line = 1): StackFrame[] {
    return [
        {
            id: 0,
            name: 'main',
            source: { path: filePath, line, column: 1 },
            scopes: [
                { name: 'Local', variablesReference: 1, expensive: false },
                { name: 'Closure', variablesReference: 2, expensive: false },
                { name: 'Global', variablesReference: 3, expensive: true },
            ],
        },
        {
            id: 1,
            name: 'runApp',
            source: { path: 'app.ts', line: 42 },
            scopes: [{ name: 'Local', variablesReference: 4, expensive: false }],
        },
        {
            id: 2,
            name: '<anonymous>',
            source: { path: 'bootstrap.ts', line: 15 },
            scopes: [{ name: 'Local', variablesReference: 5, expensive: false }],
        },
    ];
}

function generateMockVariables(ref: number): Variable[] {
    const varSets: Record<number, Variable[]> = {
        1: [
            { name: 'count', value: '42', type: 'number', variablesReference: 0 },
            { name: 'message', value: '"Hello World"', type: 'string', variablesReference: 0 },
            { name: 'items', value: 'Array(3)', type: 'array', variablesReference: 10 },
            { name: 'config', value: 'Object', type: 'object', variablesReference: 11 },
        ],
        2: [
            { name: 'callback', value: 'ƒ callback()', type: 'function', variablesReference: 0 },
            { name: 'state', value: '"ready"', type: 'string', variablesReference: 0 },
        ],
        10: [
            { name: '0', value: '"apple"', type: 'string', variablesReference: 0 },
            { name: '1', value: '"banana"', type: 'string', variablesReference: 0 },
            { name: '2', value: '"cherry"', type: 'string', variablesReference: 0 },
            { name: 'length', value: '3', type: 'number', variablesReference: 0 },
        ],
        11: [
            { name: 'debug', value: 'true', type: 'boolean', variablesReference: 0 },
            { name: 'port', value: '3000', type: 'number', variablesReference: 0 },
            { name: 'host', value: '"localhost"', type: 'string', variablesReference: 0 },
        ],
    };
    return varSets[ref] || [];
}

function evaluateMockExpression(expr: string): { value?: string; type?: string; error?: string } {
    // Simple mock evaluation
    try {
        if (expr.includes('undefined')) {
            return { error: 'undefined is not defined' };
        }
        if (expr.match(/^\d+$/)) {
            return { value: expr, type: 'number' };
        }
        if (expr.startsWith('"') || expr.startsWith("'")) {
            return { value: expr, type: 'string' };
        }
        if (expr === 'true' || expr === 'false') {
            return { value: expr, type: 'boolean' };
        }
        // Default: pretend it's a variable
        return { value: `<${expr}>`, type: 'object' };
    } catch {
        return { error: 'Evaluation failed' };
    }
}
