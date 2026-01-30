/**
 * Phase 401-450: API & Integration Services
 * 
 * HTTP client, API testing, and integrations:
 * - REST client
 * - GraphQL client
 * - WebSocket management
 * - API documentation
 * - Request/response history
 * - Environment variables
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type BodyType = 'none' | 'json' | 'form-data' | 'x-www-form-urlencoded' | 'raw' | 'binary' | 'graphql';

export interface HttpRequest {
    id: string;
    name: string;
    method: HttpMethod;
    url: string;
    headers: Record<string, string>;
    params: Record<string, string>;
    bodyType: BodyType;
    body?: string;
    auth?: AuthConfig;
    timeout: number;
}

export interface AuthConfig {
    type: 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth2';
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
}

export interface HttpResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    duration: number;
    size: number;
}

export interface RequestHistory {
    id: string;
    request: HttpRequest;
    response?: HttpResponse;
    timestamp: Date;
    error?: string;
}

export interface Collection {
    id: string;
    name: string;
    requests: HttpRequest[];
    variables: Record<string, string>;
}

export interface ApiEnvironment {
    id: string;
    name: string;
    variables: Record<string, string>;
    isActive: boolean;
}

export interface ApiServiceState {
    collections: Collection[];
    environments: ApiEnvironment[];
    history: RequestHistory[];
    activeEnvironmentId: string | null;

    // Request operations
    executeRequest: (request: HttpRequest) => Promise<HttpResponse>;
    saveRequest: (collectionId: string, request: HttpRequest) => void;
    deleteRequest: (collectionId: string, requestId: string) => void;

    // Collection operations
    createCollection: (name: string) => string;
    deleteCollection: (id: string) => void;
    updateCollection: (id: string, updates: Partial<Collection>) => void;

    // Environment operations
    createEnvironment: (name: string) => string;
    deleteEnvironment: (id: string) => void;
    setActiveEnvironment: (id: string | null) => void;
    setVariable: (envId: string, key: string, value: string) => void;
    getVariable: (key: string) => string | undefined;

    // History
    clearHistory: () => void;
    replayRequest: (historyId: string) => Promise<HttpResponse>;
}

// =============================================================================
// STORE
// =============================================================================

export const useApiService = create<ApiServiceState>()(
    persist(
        (set, get) => ({
            collections: [],
            environments: [
                { id: 'default', name: 'Development', variables: { BASE_URL: 'http://localhost:3000' }, isActive: true },
            ],
            history: [],
            activeEnvironmentId: 'default',

            executeRequest: async (request) => {
                const startTime = Date.now();

                // Simulate API call
                await new Promise(r => setTimeout(r, 200 + Math.random() * 300));

                const response: HttpResponse = {
                    status: 200,
                    statusText: 'OK',
                    headers: { 'content-type': 'application/json', 'x-request-id': `req_${Date.now()}` },
                    body: JSON.stringify({ success: true, data: { id: 1, message: 'Response data' } }, null, 2),
                    duration: Date.now() - startTime,
                    size: 156,
                };

                const historyEntry: RequestHistory = {
                    id: `history_${Date.now()}`,
                    request,
                    response,
                    timestamp: new Date(),
                };

                set(state => ({
                    history: [historyEntry, ...state.history.slice(0, 99)],
                }));

                return response;
            },

            saveRequest: (collectionId, request) => {
                set(state => ({
                    collections: state.collections.map(c =>
                        c.id === collectionId
                            ? { ...c, requests: [...c.requests.filter(r => r.id !== request.id), request] }
                            : c
                    ),
                }));
            },

            deleteRequest: (collectionId, requestId) => {
                set(state => ({
                    collections: state.collections.map(c =>
                        c.id === collectionId
                            ? { ...c, requests: c.requests.filter(r => r.id !== requestId) }
                            : c
                    ),
                }));
            },

            createCollection: (name) => {
                const id = `collection_${Date.now()}`;
                set(state => ({
                    collections: [...state.collections, { id, name, requests: [], variables: {} }],
                }));
                return id;
            },

            deleteCollection: (id) => {
                set(state => ({
                    collections: state.collections.filter(c => c.id !== id),
                }));
            },

            updateCollection: (id, updates) => {
                set(state => ({
                    collections: state.collections.map(c =>
                        c.id === id ? { ...c, ...updates } : c
                    ),
                }));
            },

            createEnvironment: (name) => {
                const id = `env_${Date.now()}`;
                set(state => ({
                    environments: [...state.environments, { id, name, variables: {}, isActive: false }],
                }));
                return id;
            },

            deleteEnvironment: (id) => {
                set(state => ({
                    environments: state.environments.filter(e => e.id !== id),
                    activeEnvironmentId: state.activeEnvironmentId === id ? null : state.activeEnvironmentId,
                }));
            },

            setActiveEnvironment: (id) => {
                set(state => ({
                    environments: state.environments.map(e => ({ ...e, isActive: e.id === id })),
                    activeEnvironmentId: id,
                }));
            },

            setVariable: (envId, key, value) => {
                set(state => ({
                    environments: state.environments.map(e =>
                        e.id === envId ? { ...e, variables: { ...e.variables, [key]: value } } : e
                    ),
                }));
            },

            getVariable: (key) => {
                const activeEnv = get().environments.find(e => e.id === get().activeEnvironmentId);
                return activeEnv?.variables[key];
            },

            clearHistory: () => set({ history: [] }),

            replayRequest: async (historyId) => {
                const entry = get().history.find(h => h.id === historyId);
                if (!entry) throw new Error('History entry not found');
                return get().executeRequest(entry.request);
            },
        }),
        {
            name: 'sprintloop-api',
            partialize: (state) => ({
                collections: state.collections,
                environments: state.environments,
            }),
        }
    )
);
