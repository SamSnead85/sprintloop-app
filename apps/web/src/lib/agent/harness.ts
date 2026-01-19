/**
 * Agent Harness System
 * Environment and build management for agentic workflows
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface AgentEnvironment {
    id: string;
    name: string;
    type: EnvironmentType;
    status: 'creating' | 'running' | 'stopped' | 'error' | 'destroyed';
    config: EnvironmentConfig;
    resources: ResourceUsage;
    createdAt: number;
    lastActiveAt: number;
}

export type EnvironmentType =
    | 'local'
    | 'docker'
    | 'kubernetes'
    | 'cloud-sandbox'
    | 'remote-vm';

export interface EnvironmentConfig {
    baseImage?: string;
    nodeVersion?: string;
    pythonVersion?: string;
    ports?: number[];
    volumes?: string[];
    envVars?: Record<string, string>;
    cpuLimit?: number;
    memoryLimit?: string;
    networkMode?: 'bridge' | 'host' | 'none';
    capabilities?: string[];
}

export interface ResourceUsage {
    cpu: number; // percentage
    memory: number; // MB
    disk: number; // MB
    network: { rx: number; tx: number }; // bytes/s
}

export interface BuildJob {
    id: string;
    environmentId: string;
    name: string;
    status: 'queued' | 'running' | 'success' | 'failed' | 'cancelled';
    steps: BuildStep[];
    logs: string[];
    startedAt?: number;
    completedAt?: number;
    duration?: number;
    artifacts?: BuildArtifact[];
}

export interface BuildStep {
    id: string;
    name: string;
    command: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    logs: string[];
    startedAt?: number;
    completedAt?: number;
    exitCode?: number;
}

export interface BuildArtifact {
    name: string;
    path: string;
    size: number;
    type: 'file' | 'directory' | 'archive';
}

export interface AgentSession {
    id: string;
    environmentId: string;
    agentId: string;
    status: 'active' | 'paused' | 'completed' | 'failed';
    task: string;
    progress: number;
    actions: AgentAction[];
    createdAt: number;
    updatedAt: number;
}

export interface AgentAction {
    id: string;
    type: 'file_read' | 'file_write' | 'command' | 'browser' | 'api_call' | 'think' | 'ask';
    description: string;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    result?: unknown;
    timestamp: number;
    duration?: number;
}

// =============================================================================
// HARNESS STORE
// =============================================================================

interface HarnessState {
    environments: Map<string, AgentEnvironment>;
    builds: Map<string, BuildJob>;
    sessions: Map<string, AgentSession>;
    activeEnvironmentId: string | null;

    // Environment Management
    createEnvironment: (name: string, type: EnvironmentType, config?: EnvironmentConfig) => Promise<string>;
    startEnvironment: (id: string) => Promise<void>;
    stopEnvironment: (id: string) => Promise<void>;
    destroyEnvironment: (id: string) => Promise<void>;
    getEnvironmentStats: (id: string) => ResourceUsage | null;

    // Build Management
    createBuild: (environmentId: string, name: string, steps: Omit<BuildStep, 'id' | 'status' | 'logs'>[]) => Promise<string>;
    runBuild: (buildId: string) => Promise<BuildJob>;
    cancelBuild: (buildId: string) => void;
    getBuildLogs: (buildId: string) => string[];

    // Session Management
    createSession: (environmentId: string, agentId: string, task: string) => string;
    updateSessionProgress: (sessionId: string, progress: number) => void;
    addSessionAction: (sessionId: string, action: Omit<AgentAction, 'id' | 'timestamp'>) => void;
    endSession: (sessionId: string, status: 'completed' | 'failed') => void;

    // Helpers
    getEnvironment: (id: string) => AgentEnvironment | undefined;
    getActiveEnvironment: () => AgentEnvironment | undefined;
    getEnvironmentSessions: (environmentId: string) => AgentSession[];
}

export const useHarnessStore = create<HarnessState>((set, get) => ({
    environments: new Map(),
    builds: new Map(),
    sessions: new Map(),
    activeEnvironmentId: null,

    createEnvironment: async (name, type, config = {}) => {
        const id = `env-${Date.now()}`;
        const environment: AgentEnvironment = {
            id,
            name,
            type,
            status: 'creating',
            config,
            resources: { cpu: 0, memory: 0, disk: 0, network: { rx: 0, tx: 0 } },
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
        };

        set(state => {
            const environments = new Map(state.environments);
            environments.set(id, environment);
            return { environments, activeEnvironmentId: id };
        });

        console.log('[Harness] Creating environment:', name, type);

        // Simulate environment creation
        await new Promise(r => setTimeout(r, 2000));

        set(state => {
            const environments = new Map(state.environments);
            const env = environments.get(id);
            if (env) {
                environments.set(id, { ...env, status: 'running' });
            }
            return { environments };
        });

        return id;
    },

    startEnvironment: async (id) => {
        console.log('[Harness] Starting environment:', id);
        await new Promise(r => setTimeout(r, 1000));

        set(state => {
            const environments = new Map(state.environments);
            const env = environments.get(id);
            if (env) {
                environments.set(id, { ...env, status: 'running', lastActiveAt: Date.now() });
            }
            return { environments };
        });
    },

    stopEnvironment: async (id) => {
        console.log('[Harness] Stopping environment:', id);
        await new Promise(r => setTimeout(r, 500));

        set(state => {
            const environments = new Map(state.environments);
            const env = environments.get(id);
            if (env) {
                environments.set(id, { ...env, status: 'stopped' });
            }
            return { environments };
        });
    },

    destroyEnvironment: async (id) => {
        console.log('[Harness] Destroying environment:', id);
        await new Promise(r => setTimeout(r, 1000));

        set(state => {
            const environments = new Map(state.environments);
            environments.delete(id);
            return {
                environments,
                activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
            };
        });
    },

    getEnvironmentStats: (id) => {
        const env = get().environments.get(id);
        if (!env || env.status !== 'running') return null;

        // Return simulated stats
        return {
            cpu: Math.random() * 50 + 10,
            memory: Math.random() * 500 + 200,
            disk: Math.random() * 1000 + 500,
            network: { rx: Math.random() * 10000, tx: Math.random() * 5000 },
        };
    },

    createBuild: async (environmentId, name, steps) => {
        const id = `build-${Date.now()}`;
        const build: BuildJob = {
            id,
            environmentId,
            name,
            status: 'queued',
            steps: steps.map((s, i) => ({
                ...s,
                id: `step-${i}`,
                status: 'pending' as const,
                logs: [],
            })),
            logs: [],
        };

        set(state => {
            const builds = new Map(state.builds);
            builds.set(id, build);
            return { builds };
        });

        return id;
    },

    runBuild: async (buildId) => {
        const build = get().builds.get(buildId);
        if (!build) throw new Error('Build not found');

        console.log('[Harness] Running build:', build.name);

        // Update to running
        const updateBuild = (updates: Partial<BuildJob>) => {
            set(state => {
                const builds = new Map(state.builds);
                const b = builds.get(buildId);
                if (b) {
                    builds.set(buildId, { ...b, ...updates });
                }
                return { builds };
            });
        };

        updateBuild({ status: 'running', startedAt: Date.now(), logs: ['📦 Build started...'] });

        // Execute each step
        for (let i = 0; i < build.steps.length; i++) {
            const step = build.steps[i];

            // Update step to running
            set(state => {
                const builds = new Map(state.builds);
                const b = builds.get(buildId);
                if (b) {
                    b.steps[i] = { ...step, status: 'running', startedAt: Date.now() };
                    b.logs = [...b.logs, `▶️ Running: ${step.name}`];
                    builds.set(buildId, { ...b });
                }
                return { builds };
            });

            // Simulate step execution
            await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));

            // Complete step
            set(state => {
                const builds = new Map(state.builds);
                const b = builds.get(buildId);
                if (b) {
                    b.steps[i] = {
                        ...step,
                        status: 'success',
                        completedAt: Date.now(),
                        exitCode: 0,
                        logs: [`$ ${step.command}`, 'Command completed successfully'],
                    };
                    b.logs = [...b.logs, `✅ Completed: ${step.name}`];
                    builds.set(buildId, { ...b });
                }
                return { builds };
            });
        }

        // Complete build
        const completedBuild = {
            ...get().builds.get(buildId)!,
            status: 'success' as const,
            completedAt: Date.now(),
            duration: Date.now() - (build.startedAt || Date.now()),
            logs: [...build.logs, '🎉 Build completed successfully!'],
        };

        set(state => {
            const builds = new Map(state.builds);
            builds.set(buildId, completedBuild);
            return { builds };
        });

        return completedBuild;
    },

    cancelBuild: (buildId) => {
        set(state => {
            const builds = new Map(state.builds);
            const b = builds.get(buildId);
            if (b && b.status === 'running') {
                builds.set(buildId, { ...b, status: 'cancelled', completedAt: Date.now() });
            }
            return { builds };
        });
    },

    getBuildLogs: (buildId) => {
        return get().builds.get(buildId)?.logs || [];
    },

    createSession: (environmentId, agentId, task) => {
        const id = `session-${Date.now()}`;
        const session: AgentSession = {
            id,
            environmentId,
            agentId,
            status: 'active',
            task,
            progress: 0,
            actions: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        set(state => {
            const sessions = new Map(state.sessions);
            sessions.set(id, session);
            return { sessions };
        });

        console.log('[Harness] Session created:', id);
        return id;
    },

    updateSessionProgress: (sessionId, progress) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const s = sessions.get(sessionId);
            if (s) {
                sessions.set(sessionId, { ...s, progress, updatedAt: Date.now() });
            }
            return { sessions };
        });
    },

    addSessionAction: (sessionId, action) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const s = sessions.get(sessionId);
            if (s) {
                sessions.set(sessionId, {
                    ...s,
                    actions: [...s.actions, { ...action, id: `action-${Date.now()}`, timestamp: Date.now() }],
                    updatedAt: Date.now(),
                });
            }
            return { sessions };
        });
    },

    endSession: (sessionId, status) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const s = sessions.get(sessionId);
            if (s) {
                sessions.set(sessionId, { ...s, status, progress: 100, updatedAt: Date.now() });
            }
            return { sessions };
        });
    },

    getEnvironment: (id) => get().environments.get(id),

    getActiveEnvironment: () => {
        const { activeEnvironmentId, environments } = get();
        return activeEnvironmentId ? environments.get(activeEnvironmentId) : undefined;
    },

    getEnvironmentSessions: (environmentId) => {
        return Array.from(get().sessions.values())
            .filter(s => s.environmentId === environmentId);
    },
}));

// =============================================================================
// AGENT TYPES (Required by flows.ts, pool.ts, index.ts)
// =============================================================================

export type AgentMode = 'plan' | 'act' | 'auto' | 'review';

export interface AgentConfig {
    id?: string;
    mode?: AgentMode;
    persona?: string;
    maxIterations?: number;
    autoApprove?: boolean;
}

export interface AgentTool {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
    execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolResult {
    success: boolean;
    output: string;
    artifacts?: string[];
}

export interface AgentPlan {
    id: string;
    steps: PlanStep[];
    status: 'draft' | 'approved' | 'executing' | 'completed';
}

export interface PlanStep {
    id: string;
    description: string;
    tool?: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
}

export type AgentEventType =
    | 'agent:started'
    | 'agent:message'
    | 'agent:action_executing'
    | 'agent:step_completed'
    | 'agent:completed'
    | 'agent:error'
    | 'agent:paused';

export interface AgentEvent {
    type: AgentEventType;
    agentId: string;
    timestamp: number;
    data?: Record<string, unknown>;
}

export interface SessionMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface ToolCall {
    id: string;
    tool: string;
    params: Record<string, unknown>;
    result?: ToolResult;
}

// =============================================================================
// AGENT EVENT EMITTER
// =============================================================================

class AgentEventEmitter {
    private listeners: ((event: AgentEvent) => void)[] = [];

    emit(event: AgentEvent): void {
        this.listeners.forEach(listener => listener(event));
    }

    subscribe(listener: (event: AgentEvent) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

export const agentEvents = new AgentEventEmitter();

// =============================================================================
// UNIFIED AGENT HARNESS
// =============================================================================

export class UnifiedAgentHarness {
    private id: string;
    private _mode: AgentMode;
    private currentSession: AgentSession | null = null;
    private _projectPath: string = '';

    constructor(config: AgentConfig = {}) {
        this.id = config.id || `agent-${Date.now()}`;
        this._mode = config.mode || 'act';
    }

    startSession(projectPath: string): AgentSession {
        this._projectPath = projectPath;
        const store = useHarnessStore.getState();
        const envId = store.activeEnvironmentId || 'default-env';
        const sessionId = store.createSession(envId, this.id, 'Agent session');

        this.currentSession = {
            id: sessionId,
            environmentId: envId,
            agentId: this.id,
            status: 'active',
            task: '',
            progress: 0,
            actions: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        agentEvents.emit({
            type: 'agent:started',
            agentId: this.id,
            timestamp: Date.now(),
            data: { sessionId, projectPath },
        });

        return this.currentSession;
    }

    async processMessage(message: string): Promise<{ content: string; toolCalls?: ToolCall[] }> {
        if (!this.currentSession) {
            throw new Error('No active session. Call startSession first.');
        }

        agentEvents.emit({
            type: 'agent:message',
            agentId: this.id,
            timestamp: Date.now(),
            data: { message },
        });

        // Simulate processing
        await new Promise(r => setTimeout(r, 500));

        return {
            content: `Processed: ${message.slice(0, 100)}...`,
            toolCalls: [],
        };
    }

    endSession(): void {
        if (this.currentSession) {
            const store = useHarnessStore.getState();
            store.endSession(this.currentSession.id, 'completed');

            agentEvents.emit({
                type: 'agent:completed',
                agentId: this.id,
                timestamp: Date.now(),
                data: { sessionId: this.currentSession.id },
            });

            this.currentSession = null;
        }
    }

    getSession(): AgentSession | null {
        return this.currentSession;
    }

    getId(): string {
        return this.id;
    }

    getMode(): AgentMode {
        return this._mode;
    }

    getProjectPath(): string {
        return this._projectPath;
    }
}

// =============================================================================
// PRESET AGENTS
// =============================================================================

export const PRESET_AGENTS = {
    developer: { persona: 'developer', mode: 'act' as AgentMode },
    architect: { persona: 'architect', mode: 'plan' as AgentMode },
    reviewer: { persona: 'reviewer', mode: 'review' as AgentMode },
    debugger: { persona: 'debugger', mode: 'act' as AgentMode },
};

export const BUILT_IN_TOOLS: AgentTool[] = [
    {
        name: 'read_file',
        description: 'Read a file from the filesystem',
        parameters: { path: { type: 'string' } },
        execute: async (_params) => ({ success: true, output: 'File content' }),
    },
    {
        name: 'write_file',
        description: 'Write content to a file',
        parameters: { path: { type: 'string' }, content: { type: 'string' } },
        execute: async (_params) => ({ success: true, output: 'File written' }),
    },
    {
        name: 'execute_command',
        description: 'Execute a shell command',
        parameters: { command: { type: 'string' } },
        execute: async (_params) => ({ success: true, output: 'Command executed' }),
    },
    {
        name: 'search_code',
        description: 'Search for code patterns',
        parameters: { query: { type: 'string' } },
        execute: async (_params) => ({ success: true, output: 'Search results' }),
    },
    {
        name: 'think',
        description: 'Internal reasoning step',
        parameters: { thought: { type: 'string' } },
        execute: async (_params) => ({ success: true, output: 'Thinking complete' }),
    },
];

export function createAgentFromPreset(
    presetName: keyof typeof PRESET_AGENTS,
    overrides: Partial<AgentConfig> = {}
): UnifiedAgentHarness {
    const preset = PRESET_AGENTS[presetName];
    return new UnifiedAgentHarness({
        ...preset,
        ...overrides,
    });
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Create a quick development environment */
export async function createDevEnvironment(name = 'Development'): Promise<string> {
    const store = useHarnessStore.getState();
    return store.createEnvironment(name, 'local', {
        nodeVersion: '20',
        pythonVersion: '3.11',
        envVars: { NODE_ENV: 'development' },
    });
}

/** Create a Docker-based sandbox */
export async function createSandbox(name = 'Sandbox'): Promise<string> {
    const store = useHarnessStore.getState();
    return store.createEnvironment(name, 'docker', {
        baseImage: 'node:20-alpine',
        memoryLimit: '2g',
        cpuLimit: 2,
        networkMode: 'bridge',
    });
}

/** Run a quick build */
export async function quickBuild(commands: string[]): Promise<BuildJob> {
    const store = useHarnessStore.getState();
    let envId = store.activeEnvironmentId;

    if (!envId) {
        envId = await createDevEnvironment();
    }

    const buildId = await store.createBuild(
        envId,
        'Quick Build',
        commands.map((cmd, i) => ({ name: `Step ${i + 1}`, command: cmd }))
    );

    return store.runBuild(buildId);
}
