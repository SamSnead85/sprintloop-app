/**
 * Sandboxed Compute Environment
 * 
 * Phase 114: Isolated execution environment for agents
 * Shell, editor, browser in sandbox for safe experimentation
 * Source: Devin
 */

import { create } from 'zustand';

export interface Sandbox {
    id: string;
    name: string;
    type: 'local' | 'docker' | 'vm' | 'cloud';
    status: 'creating' | 'ready' | 'running' | 'paused' | 'stopped' | 'destroyed';
    config: SandboxConfig;
    resources: SandboxResources;
    processes: SandboxProcess[];
    filesystem: SandboxFilesystem;
    createdAt: number;
    lastActivityAt: number;
}

export interface SandboxConfig {
    baseImage?: string;
    workdir: string;
    env: Record<string, string>;
    ports: PortMapping[];
    volumes: VolumeMount[];
    network: NetworkConfig;
    timeout: number; // Auto-destroy after inactivity (ms)
    maxCpu: number; // CPU cores
    maxMemory: number; // MB
    maxDisk: number; // MB
}

export interface PortMapping {
    host: number;
    container: number;
    protocol: 'tcp' | 'udp';
}

export interface VolumeMount {
    hostPath: string;
    containerPath: string;
    readOnly: boolean;
}

export interface NetworkConfig {
    mode: 'bridge' | 'host' | 'none' | 'isolated';
    allowedHosts: string[];
    blockedPorts: number[];
}

export interface SandboxResources {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIn: number;
    networkOut: number;
}

export interface SandboxProcess {
    pid: number;
    command: string;
    status: 'running' | 'completed' | 'failed';
    exitCode?: number;
    stdout: string;
    stderr: string;
    startedAt: number;
    completedAt?: number;
}

export interface SandboxFilesystem {
    root: string;
    files: SandboxFile[];
    watchedPaths: string[];
}

export interface SandboxFile {
    path: string;
    type: 'file' | 'directory';
    size: number;
    modified: number;
}

interface SandboxState {
    sandboxes: Map<string, Sandbox>;
    activeSandboxId: string | null;

    // Sandbox lifecycle
    create: (config?: Partial<SandboxConfig>) => Promise<string>;
    start: (id: string) => Promise<void>;
    stop: (id: string) => Promise<void>;
    pause: (id: string) => Promise<void>;
    resume: (id: string) => Promise<void>;
    destroy: (id: string) => Promise<void>;

    // Execution
    exec: (id: string, command: string) => Promise<SandboxProcess>;
    writeFile: (id: string, path: string, content: string) => Promise<void>;
    readFile: (id: string, path: string) => Promise<string>;
    listFiles: (id: string, path: string) => Promise<SandboxFile[]>;

    // Getters
    getSandbox: (id: string) => Sandbox | undefined;
    getActiveSandbox: () => Sandbox | undefined;

    // Management
    setActive: (id: string | null) => void;
    cleanup: () => Promise<void>;
}

const DEFAULT_CONFIG: SandboxConfig = {
    workdir: '/workspace',
    env: {
        NODE_ENV: 'development',
        PATH: '/usr/local/bin:/usr/bin:/bin',
    },
    ports: [],
    volumes: [],
    network: {
        mode: 'bridge',
        allowedHosts: ['github.com', 'npmjs.org', 'registry.npmjs.org'],
        blockedPorts: [22, 25, 3389],
    },
    timeout: 30 * 60 * 1000, // 30 minutes
    maxCpu: 2,
    maxMemory: 4096, // 4GB
    maxDisk: 10240, // 10GB
};

export const useSandboxStore = create<SandboxState>((set, get) => ({
    sandboxes: new Map(),
    activeSandboxId: null,

    create: async (configOverrides) => {
        const id = `sandbox-${Date.now()}`;
        const config = { ...DEFAULT_CONFIG, ...configOverrides };

        const sandbox: Sandbox = {
            id,
            name: `Sandbox ${id.slice(-8)}`,
            type: 'local', // Would detect based on config
            status: 'creating',
            config,
            resources: {
                cpuUsage: 0,
                memoryUsage: 0,
                diskUsage: 0,
                networkIn: 0,
                networkOut: 0,
            },
            processes: [],
            filesystem: {
                root: config.workdir,
                files: [],
                watchedPaths: [],
            },
            createdAt: Date.now(),
            lastActivityAt: Date.now(),
        };

        set(state => {
            const sandboxes = new Map(state.sandboxes);
            sandboxes.set(id, sandbox);
            return { sandboxes };
        });

        console.log('[Sandbox] Creating sandbox:', id);

        // Simulate creation
        await new Promise(resolve => setTimeout(resolve, 1000));

        set(state => {
            const sandboxes = new Map(state.sandboxes);
            const sb = sandboxes.get(id);
            if (sb) {
                sandboxes.set(id, { ...sb, status: 'ready' });
            }
            return { sandboxes, activeSandboxId: id };
        });

        return id;
    },

    start: async (id) => {
        const sandbox = get().sandboxes.get(id);
        if (!sandbox) throw new Error('Sandbox not found');

        console.log('[Sandbox] Starting:', id);

        set(state => {
            const sandboxes = new Map(state.sandboxes);
            sandboxes.set(id, { ...sandbox, status: 'running', lastActivityAt: Date.now() });
            return { sandboxes };
        });
    },

    stop: async (id) => {
        const sandbox = get().sandboxes.get(id);
        if (!sandbox) throw new Error('Sandbox not found');

        console.log('[Sandbox] Stopping:', id);

        set(state => {
            const sandboxes = new Map(state.sandboxes);
            sandboxes.set(id, { ...sandbox, status: 'stopped', lastActivityAt: Date.now() });
            return { sandboxes };
        });
    },

    pause: async (id) => {
        const sandbox = get().sandboxes.get(id);
        if (!sandbox) throw new Error('Sandbox not found');

        set(state => {
            const sandboxes = new Map(state.sandboxes);
            sandboxes.set(id, { ...sandbox, status: 'paused', lastActivityAt: Date.now() });
            return { sandboxes };
        });
    },

    resume: async (id) => {
        const sandbox = get().sandboxes.get(id);
        if (!sandbox) throw new Error('Sandbox not found');

        set(state => {
            const sandboxes = new Map(state.sandboxes);
            sandboxes.set(id, { ...sandbox, status: 'running', lastActivityAt: Date.now() });
            return { sandboxes };
        });
    },

    destroy: async (id) => {
        console.log('[Sandbox] Destroying:', id);

        set(state => {
            const sandboxes = new Map(state.sandboxes);
            sandboxes.delete(id);
            return {
                sandboxes,
                activeSandboxId: state.activeSandboxId === id ? null : state.activeSandboxId,
            };
        });
    },

    exec: async (id, command) => {
        const sandbox = get().sandboxes.get(id);
        if (!sandbox || sandbox.status !== 'running') {
            throw new Error('Sandbox not running');
        }

        const process: SandboxProcess = {
            pid: Math.floor(Math.random() * 65535),
            command,
            status: 'running',
            stdout: '',
            stderr: '',
            startedAt: Date.now(),
        };

        console.log('[Sandbox] Executing:', command);

        // Simulate execution
        await new Promise(resolve => setTimeout(resolve, 500));

        process.status = 'completed';
        process.exitCode = 0;
        process.stdout = `Executed: ${command}\n`;
        process.completedAt = Date.now();

        set(state => {
            const sandboxes = new Map(state.sandboxes);
            const sb = sandboxes.get(id);
            if (sb) {
                sandboxes.set(id, {
                    ...sb,
                    processes: [...sb.processes, process],
                    lastActivityAt: Date.now(),
                });
            }
            return { sandboxes };
        });

        return process;
    },

    writeFile: async (id, path, content) => {
        const sandbox = get().sandboxes.get(id);
        if (!sandbox) throw new Error('Sandbox not found');

        console.log('[Sandbox] Writing file:', path);

        const file: SandboxFile = {
            path,
            type: 'file',
            size: content.length,
            modified: Date.now(),
        };

        set(state => {
            const sandboxes = new Map(state.sandboxes);
            const sb = sandboxes.get(id);
            if (sb) {
                const files = sb.filesystem.files.filter(f => f.path !== path);
                sandboxes.set(id, {
                    ...sb,
                    filesystem: { ...sb.filesystem, files: [...files, file] },
                    lastActivityAt: Date.now(),
                });
            }
            return { sandboxes };
        });
    },

    readFile: async (id, path) => {
        const sandbox = get().sandboxes.get(id);
        if (!sandbox) throw new Error('Sandbox not found');

        console.log('[Sandbox] Reading file:', path);

        // Simulated file read
        return `// Contents of ${path}\n`;
    },

    listFiles: async (id, path) => {
        const sandbox = get().sandboxes.get(id);
        if (!sandbox) throw new Error('Sandbox not found');

        return sandbox.filesystem.files.filter(f => f.path.startsWith(path));
    },

    getSandbox: (id) => {
        return get().sandboxes.get(id);
    },

    getActiveSandbox: () => {
        const { activeSandboxId, sandboxes } = get();
        return activeSandboxId ? sandboxes.get(activeSandboxId) : undefined;
    },

    setActive: (id) => {
        set({ activeSandboxId: id });
    },

    cleanup: async () => {
        const { sandboxes } = get();
        const now = Date.now();

        for (const [id, sandbox] of sandboxes) {
            const inactive = now - sandbox.lastActivityAt > sandbox.config.timeout;
            if (inactive) {
                await get().destroy(id);
            }
        }
    },
}));

/**
 * Create a sandbox for agent experimentation
 */
export async function createAgentSandbox(
    projectPath: string,
    options?: Partial<SandboxConfig>
): Promise<string> {
    const store = useSandboxStore.getState();

    return store.create({
        ...options,
        volumes: [
            { hostPath: projectPath, containerPath: '/workspace', readOnly: false },
            ...(options?.volumes || []),
        ],
    });
}

/**
 * Run code in sandbox and return result
 */
export async function runInSandbox(
    sandboxId: string,
    command: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const store = useSandboxStore.getState();
    const process = await store.exec(sandboxId, command);

    return {
        stdout: process.stdout,
        stderr: process.stderr,
        exitCode: process.exitCode || 0,
    };
}
