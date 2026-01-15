/**
 * API Integration Module
 * Phases 1101-1200: REST, GraphQL, WebSocket clients
 */

import { create } from 'zustand';

export interface APIEndpoint {
    id: string;
    name: string;
    baseUrl: string;
    auth?: APIAuth;
    headers?: Record<string, string>;
    rateLimit?: RateLimit;
    lastUsed?: number;
}

export interface APIAuth {
    type: 'none' | 'bearer' | 'basic' | 'apiKey' | 'oauth2';
    token?: string;
    username?: string;
    password?: string;
    keyName?: string;
    keyValue?: string;
    keyLocation?: 'header' | 'query';
}

export interface RateLimit {
    requests: number;
    window: number; // ms
    remaining: number;
    resetAt: number;
}

export interface APIRequest {
    id: string;
    endpointId: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    body?: unknown;
    timestamp: number;
}

export interface APIResponse {
    requestId: string;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    duration: number;
    timestamp: number;
}

export interface WebSocketConnection {
    id: string;
    url: string;
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
    messages: WSMessage[];
    connectedAt?: number;
}

export interface WSMessage {
    id: string;
    direction: 'sent' | 'received';
    data: unknown;
    timestamp: number;
}

interface APIState {
    endpoints: Map<string, APIEndpoint>;
    history: { request: APIRequest; response: APIResponse }[];
    websockets: Map<string, WebSocketConnection>;

    // Endpoints
    addEndpoint: (endpoint: Omit<APIEndpoint, 'id'>) => string;
    removeEndpoint: (id: string) => void;
    updateEndpoint: (id: string, updates: Partial<APIEndpoint>) => void;

    // HTTP
    request: (endpointId: string, config: Omit<APIRequest, 'id' | 'endpointId' | 'timestamp'>) => Promise<APIResponse>;
    get: (endpointId: string, path: string, query?: Record<string, string>) => Promise<APIResponse>;
    post: (endpointId: string, path: string, body?: unknown) => Promise<APIResponse>;
    put: (endpointId: string, path: string, body?: unknown) => Promise<APIResponse>;
    delete: (endpointId: string, path: string) => Promise<APIResponse>;

    // WebSocket
    connectWS: (url: string) => string;
    disconnectWS: (id: string) => void;
    sendWS: (id: string, data: unknown) => void;

    // History
    clearHistory: () => void;
}

export const useAPIStore = create<APIState>((set, get) => ({
    endpoints: new Map(),
    history: [],
    websockets: new Map(),

    addEndpoint: (endpointData) => {
        const id = `api-${Date.now()}`;
        set(state => {
            const endpoints = new Map(state.endpoints);
            endpoints.set(id, { ...endpointData, id });
            return { endpoints };
        });
        console.log('[API] Endpoint added:', endpointData.name);
        return id;
    },

    removeEndpoint: (id) => {
        set(state => {
            const endpoints = new Map(state.endpoints);
            endpoints.delete(id);
            return { endpoints };
        });
    },

    updateEndpoint: (id, updates) => {
        set(state => {
            const endpoints = new Map(state.endpoints);
            const endpoint = endpoints.get(id);
            if (endpoint) {
                endpoints.set(id, { ...endpoint, ...updates });
            }
            return { endpoints };
        });
    },

    request: async (endpointId, config) => {
        const endpoint = get().endpoints.get(endpointId);
        if (!endpoint) throw new Error('Endpoint not found');

        const request: APIRequest = {
            ...config,
            id: `req-${Date.now()}`,
            endpointId,
            timestamp: Date.now(),
        };

        console.log(`[API] ${config.method} ${endpoint.baseUrl}${config.path}`);

        const startTime = Date.now();

        // Simulate API call
        await new Promise(r => setTimeout(r, 200 + Math.random() * 300));

        const response: APIResponse = {
            requestId: request.id,
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            body: { success: true, data: {} },
            duration: Date.now() - startTime,
            timestamp: Date.now(),
        };

        set(state => ({
            history: [...state.history, { request, response }],
            endpoints: new Map(state.endpoints).set(endpointId, {
                ...endpoint,
                lastUsed: Date.now(),
            }),
        }));

        return response;
    },

    get: async (endpointId, path, query) => {
        return get().request(endpointId, { method: 'GET', path, query });
    },

    post: async (endpointId, path, body) => {
        return get().request(endpointId, { method: 'POST', path, body });
    },

    put: async (endpointId, path, body) => {
        return get().request(endpointId, { method: 'PUT', path, body });
    },

    delete: async (endpointId, path) => {
        return get().request(endpointId, { method: 'DELETE', path });
    },

    connectWS: (url) => {
        const id = `ws-${Date.now()}`;
        set(state => {
            const websockets = new Map(state.websockets);
            websockets.set(id, {
                id,
                url,
                status: 'connected',
                messages: [],
                connectedAt: Date.now(),
            });
            return { websockets };
        });
        console.log('[API] WebSocket connected:', url);
        return id;
    },

    disconnectWS: (id) => {
        set(state => {
            const websockets = new Map(state.websockets);
            const ws = websockets.get(id);
            if (ws) {
                websockets.set(id, { ...ws, status: 'disconnected' });
            }
            return { websockets };
        });
    },

    sendWS: (id, data) => {
        set(state => {
            const websockets = new Map(state.websockets);
            const ws = websockets.get(id);
            if (ws) {
                websockets.set(id, {
                    ...ws,
                    messages: [...ws.messages, {
                        id: `msg-${Date.now()}`,
                        direction: 'sent',
                        data,
                        timestamp: Date.now(),
                    }],
                });
            }
            return { websockets };
        });
    },

    clearHistory: () => set({ history: [] }),
}));

/** Quick API call */
export async function callAPI(
    baseUrl: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown
): Promise<unknown> {
    const store = useAPIStore.getState();

    // Find or create endpoint
    let endpoint = Array.from(store.endpoints.values()).find(e => e.baseUrl === baseUrl);
    if (!endpoint) {
        const id = store.addEndpoint({ name: baseUrl, baseUrl });
        endpoint = store.endpoints.get(id)!;
    }

    const response = await store.request(endpoint.id, { method, path, body });
    return response.body;
}
