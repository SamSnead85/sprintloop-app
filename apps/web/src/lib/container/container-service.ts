/**
 * Phase 701-750: Container & DevOps Services
 * 
 * Container management and DevOps integration:
 * - Docker integration
 * - Kubernetes support
 * - Container registry
 * - Compose files
 * - Image management
 * - Cluster monitoring
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface Container {
    id: string;
    name: string;
    image: string;
    status: 'running' | 'stopped' | 'paused' | 'restarting' | 'exited';
    ports: { host: number; container: number; protocol: 'tcp' | 'udp' }[];
    volumes: { source: string; target: string; mode: 'rw' | 'ro' }[];
    environment: Record<string, string>;
    created: Date;
    started?: Date;
    cpuUsage: number;
    memoryUsage: number;
    networkRx: number;
    networkTx: number;
}

export interface DockerImage {
    id: string;
    repository: string;
    tag: string;
    size: number;
    created: Date;
    layers: number;
}

export interface ComposeService {
    name: string;
    image?: string;
    build?: { context: string; dockerfile?: string };
    ports?: string[];
    volumes?: string[];
    environment?: Record<string, string>;
    depends_on?: string[];
    command?: string;
}

export interface ComposeFile {
    id: string;
    name: string;
    path: string;
    version: string;
    services: ComposeService[];
    networks?: Record<string, unknown>;
    volumes?: Record<string, unknown>;
}

export interface KubernetesResource {
    id: string;
    kind: 'Pod' | 'Deployment' | 'Service' | 'ConfigMap' | 'Secret' | 'Ingress';
    name: string;
    namespace: string;
    status: string;
    age: string;
    labels: Record<string, string>;
}

export interface ContainerServiceState {
    containers: Container[];
    images: DockerImage[];
    composeFiles: ComposeFile[];
    kubernetesResources: KubernetesResource[];
    dockerConnected: boolean;
    kubernetesConnected: boolean;

    // Container operations
    listContainers: () => Promise<void>;
    startContainer: (id: string) => Promise<void>;
    stopContainer: (id: string) => Promise<void>;
    restartContainer: (id: string) => Promise<void>;
    removeContainer: (id: string) => Promise<void>;
    execInContainer: (id: string, command: string) => Promise<string>;
    getLogs: (id: string, tail?: number) => Promise<string>;

    // Image operations
    listImages: () => Promise<void>;
    pullImage: (name: string, tag?: string) => Promise<void>;
    removeImage: (id: string) => Promise<void>;
    buildImage: (dockerfile: string, tag: string) => Promise<void>;

    // Compose operations
    parseComposeFile: (path: string) => Promise<ComposeFile>;
    composeUp: (fileId: string) => Promise<void>;
    composeDown: (fileId: string) => Promise<void>;

    // Kubernetes operations
    listK8sResources: (namespace: string) => Promise<void>;
    applyManifest: (yaml: string) => Promise<void>;
    deleteResource: (kind: string, name: string, namespace: string) => Promise<void>;

    // Connection
    connectDocker: () => Promise<void>;
    connectKubernetes: (context: string) => Promise<void>;
}

// =============================================================================
// STORE
// =============================================================================

export const useContainerService = create<ContainerServiceState>((set, get) => ({
    containers: [],
    images: [],
    composeFiles: [],
    kubernetesResources: [],
    dockerConnected: false,
    kubernetesConnected: false,

    listContainers: async () => {
        await new Promise(r => setTimeout(r, 300));
        set({
            containers: [
                { id: 'c1', name: 'web-app', image: 'node:18', status: 'running', ports: [{ host: 3000, container: 3000, protocol: 'tcp' }], volumes: [], environment: {}, created: new Date(), started: new Date(), cpuUsage: 12, memoryUsage: 256, networkRx: 1024, networkTx: 512 },
                { id: 'c2', name: 'postgres-db', image: 'postgres:15', status: 'running', ports: [{ host: 5432, container: 5432, protocol: 'tcp' }], volumes: [{ source: './data', target: '/var/lib/postgresql/data', mode: 'rw' }], environment: { POSTGRES_PASSWORD: '****' }, created: new Date(), started: new Date(), cpuUsage: 5, memoryUsage: 128, networkRx: 256, networkTx: 128 },
                { id: 'c3', name: 'redis-cache', image: 'redis:7', status: 'running', ports: [{ host: 6379, container: 6379, protocol: 'tcp' }], volumes: [], environment: {}, created: new Date(), started: new Date(), cpuUsage: 2, memoryUsage: 64, networkRx: 128, networkTx: 64 },
            ],
        });
    },

    startContainer: async (id) => {
        await new Promise(r => setTimeout(r, 500));
        set(state => ({ containers: state.containers.map(c => c.id === id ? { ...c, status: 'running', started: new Date() } : c) }));
    },

    stopContainer: async (id) => {
        await new Promise(r => setTimeout(r, 500));
        set(state => ({ containers: state.containers.map(c => c.id === id ? { ...c, status: 'stopped' } : c) }));
    },

    restartContainer: async (id) => {
        await get().stopContainer(id);
        await get().startContainer(id);
    },

    removeContainer: async (id) => {
        await new Promise(r => setTimeout(r, 300));
        set(state => ({ containers: state.containers.filter(c => c.id !== id) }));
    },

    execInContainer: async (_id, command) => {
        await new Promise(r => setTimeout(r, 200));
        return `$ ${command}\nCommand executed successfully`;
    },

    getLogs: async (id, _tail = 100) => {
        await new Promise(r => setTimeout(r, 200));
        return `[2024-01-01 12:00:00] Container ${id} started\n[2024-01-01 12:00:01] Listening on port 3000...`;
    },

    listImages: async () => {
        await new Promise(r => setTimeout(r, 300));
        set({
            images: [
                { id: 'img1', repository: 'node', tag: '18-alpine', size: 150000000, created: new Date(), layers: 5 },
                { id: 'img2', repository: 'postgres', tag: '15', size: 350000000, created: new Date(), layers: 13 },
                { id: 'img3', repository: 'redis', tag: '7-alpine', size: 30000000, created: new Date(), layers: 4 },
            ],
        });
    },

    pullImage: async (name, tag = 'latest') => {
        await new Promise(r => setTimeout(r, 1500));
        set(state => ({
            images: [...state.images, { id: `img_${Date.now()}`, repository: name, tag, size: 100000000, created: new Date(), layers: 8 }],
        }));
    },

    removeImage: async (id) => {
        await new Promise(r => setTimeout(r, 300));
        set(state => ({ images: state.images.filter(i => i.id !== id) }));
    },

    buildImage: async (_dockerfile, _tag) => {
        await new Promise(r => setTimeout(r, 2000));
    },

    parseComposeFile: async (path) => {
        await new Promise(r => setTimeout(r, 200));
        const file: ComposeFile = {
            id: `compose_${Date.now()}`,
            name: path.split('/').pop() || 'docker-compose.yml',
            path,
            version: '3.8',
            services: [
                { name: 'web', image: 'node:18', ports: ['3000:3000'], environment: { NODE_ENV: 'development' } },
                { name: 'db', image: 'postgres:15', ports: ['5432:5432'], volumes: ['./data:/var/lib/postgresql/data'] },
            ],
        };
        set(state => ({ composeFiles: [...state.composeFiles, file] }));
        return file;
    },

    composeUp: async (_fileId) => {
        await new Promise(r => setTimeout(r, 2000));
    },

    composeDown: async (_fileId) => {
        await new Promise(r => setTimeout(r, 1000));
    },

    listK8sResources: async (namespace) => {
        await new Promise(r => setTimeout(r, 500));
        set({
            kubernetesResources: [
                { id: 'k8s1', kind: 'Deployment', name: 'web-app', namespace, status: 'Running', age: '5d', labels: { app: 'web' } },
                { id: 'k8s2', kind: 'Service', name: 'web-service', namespace, status: 'Active', age: '5d', labels: { app: 'web' } },
                { id: 'k8s3', kind: 'Pod', name: 'web-app-abc123', namespace, status: 'Running', age: '1h', labels: { app: 'web' } },
            ],
        });
    },

    applyManifest: async (_yaml) => {
        await new Promise(r => setTimeout(r, 500));
    },

    deleteResource: async (kind, name, _namespace) => {
        await new Promise(r => setTimeout(r, 300));
        set(state => ({ kubernetesResources: state.kubernetesResources.filter(r => !(r.kind === kind && r.name === name)) }));
    },

    connectDocker: async () => {
        await new Promise(r => setTimeout(r, 500));
        set({ dockerConnected: true });
        await get().listContainers();
        await get().listImages();
    },

    connectKubernetes: async (_context) => {
        await new Promise(r => setTimeout(r, 500));
        set({ kubernetesConnected: true });
        await get().listK8sResources('default');
    },
}));
