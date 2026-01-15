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
