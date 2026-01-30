/**
 * Phase 601-650: Documentation & Knowledge Base
 * 
 * Documentation generation and management:
 * - API documentation
 * - Markdown previews
 * - Wiki pages
 * - Knowledge graphs
 * - Search indexing
 * - Version history
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface Document {
    id: string;
    title: string;
    content: string;
    type: 'markdown' | 'api' | 'wiki' | 'readme' | 'changelog';
    path?: string;
    tags: string[];
    author: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    published: boolean;
    parentId?: string;
}

export interface DocumentVersion {
    id: string;
    documentId: string;
    version: number;
    content: string;
    author: string;
    createdAt: Date;
    changelog?: string;
}

export interface APIEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    summary: string;
    description: string;
    parameters: APIParameter[];
    requestBody?: APIRequestBody;
    responses: APIResponse[];
    tags: string[];
    deprecated: boolean;
}

export interface APIParameter {
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required: boolean;
    type: string;
    description: string;
    example?: string;
}

export interface APIRequestBody {
    description: string;
    contentType: string;
    schema: Record<string, unknown>;
    example?: unknown;
}

export interface APIResponse {
    statusCode: number;
    description: string;
    contentType?: string;
    schema?: Record<string, unknown>;
    example?: unknown;
}

export interface SearchResult {
    id: string;
    title: string;
    excerpt: string;
    type: 'document' | 'api' | 'code';
    path: string;
    score: number;
}

export interface DocumentationState {
    documents: Document[];
    versions: DocumentVersion[];
    apiEndpoints: APIEndpoint[];
    searchIndex: Map<string, string[]>;
    recentDocuments: string[];

    // Document operations
    createDocument: (doc: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => string;
    updateDocument: (id: string, updates: Partial<Document>) => void;
    deleteDocument: (id: string) => void;
    publishDocument: (id: string) => void;
    unpublishDocument: (id: string) => void;

    // Versioning
    saveVersion: (documentId: string, changelog?: string) => void;
    getVersions: (documentId: string) => DocumentVersion[];
    restoreVersion: (documentId: string, versionId: string) => void;

    // API Documentation
    addEndpoint: (endpoint: Omit<APIEndpoint, 'id'>) => string;
    updateEndpoint: (id: string, updates: Partial<APIEndpoint>) => void;
    deleteEndpoint: (id: string) => void;
    generateOpenAPI: () => Record<string, unknown>;

    // Search
    search: (query: string) => SearchResult[];
    indexDocument: (documentId: string) => void;

    // Navigation
    getDocumentTree: () => { id: string; title: string; children: string[] }[];
    getRecentDocuments: () => Document[];
}

// =============================================================================
// STORE
// =============================================================================

export const useDocumentationService = create<DocumentationState>()(
    persist(
        (set, get) => ({
            documents: [],
            versions: [],
            apiEndpoints: [],
            searchIndex: new Map(),
            recentDocuments: [],

            createDocument: (docData) => {
                const id = `doc_${Date.now()}`;
                const document: Document = {
                    ...docData,
                    id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    version: 1,
                };
                set(state => ({
                    documents: [...state.documents, document],
                    recentDocuments: [id, ...state.recentDocuments.filter(d => d !== id).slice(0, 9)],
                }));
                return id;
            },

            updateDocument: (id, updates) => {
                set(state => ({
                    documents: state.documents.map(d =>
                        d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
                    ),
                    recentDocuments: [id, ...state.recentDocuments.filter(d => d !== id).slice(0, 9)],
                }));
            },

            deleteDocument: (id) => {
                set(state => ({
                    documents: state.documents.filter(d => d.id !== id),
                    versions: state.versions.filter(v => v.documentId !== id),
                    recentDocuments: state.recentDocuments.filter(d => d !== id),
                }));
            },

            publishDocument: (id) => {
                set(state => ({
                    documents: state.documents.map(d =>
                        d.id === id ? { ...d, published: true, updatedAt: new Date() } : d
                    ),
                }));
            },

            unpublishDocument: (id) => {
                set(state => ({
                    documents: state.documents.map(d =>
                        d.id === id ? { ...d, published: false, updatedAt: new Date() } : d
                    ),
                }));
            },

            saveVersion: (documentId, changelog) => {
                const doc = get().documents.find(d => d.id === documentId);
                if (!doc) return;

                const version: DocumentVersion = {
                    id: `ver_${Date.now()}`,
                    documentId,
                    version: doc.version,
                    content: doc.content,
                    author: doc.author,
                    createdAt: new Date(),
                    changelog,
                };

                set(state => ({
                    versions: [...state.versions, version],
                    documents: state.documents.map(d =>
                        d.id === documentId ? { ...d, version: d.version + 1 } : d
                    ),
                }));
            },

            getVersions: (documentId) => get().versions.filter(v => v.documentId === documentId),

            restoreVersion: (documentId, versionId) => {
                const version = get().versions.find(v => v.id === versionId);
                if (!version) return;

                set(state => ({
                    documents: state.documents.map(d =>
                        d.id === documentId ? { ...d, content: version.content, updatedAt: new Date() } : d
                    ),
                }));
            },

            addEndpoint: (endpointData) => {
                const id = `api_${Date.now()}`;
                set(state => ({
                    apiEndpoints: [...state.apiEndpoints, { ...endpointData, id }],
                }));
                return id;
            },

            updateEndpoint: (id, updates) => {
                set(state => ({
                    apiEndpoints: state.apiEndpoints.map(e =>
                        e.id === id ? { ...e, ...updates } : e
                    ),
                }));
            },

            deleteEndpoint: (id) => {
                set(state => ({
                    apiEndpoints: state.apiEndpoints.filter(e => e.id !== id),
                }));
            },

            generateOpenAPI: () => {
                const { apiEndpoints } = get();
                return {
                    openapi: '3.0.0',
                    info: { title: 'API Documentation', version: '1.0.0' },
                    paths: apiEndpoints.reduce((acc, ep) => ({
                        ...acc,
                        [ep.path]: {
                            ...((acc as Record<string, unknown>)[ep.path] || {}),
                            [ep.method.toLowerCase()]: {
                                summary: ep.summary,
                                description: ep.description,
                                tags: ep.tags,
                                deprecated: ep.deprecated,
                            },
                        },
                    }), {}),
                };
            },

            search: (query) => {
                const { documents, apiEndpoints } = get();
                const results: SearchResult[] = [];
                const q = query.toLowerCase();

                documents.forEach(doc => {
                    if (doc.title.toLowerCase().includes(q) || doc.content.toLowerCase().includes(q)) {
                        results.push({
                            id: doc.id,
                            title: doc.title,
                            excerpt: doc.content.slice(0, 150),
                            type: 'document',
                            path: doc.path || `/docs/${doc.id}`,
                            score: doc.title.toLowerCase().includes(q) ? 1 : 0.5,
                        });
                    }
                });

                apiEndpoints.forEach(ep => {
                    if (ep.path.includes(q) || ep.summary.toLowerCase().includes(q)) {
                        results.push({
                            id: ep.id,
                            title: `${ep.method} ${ep.path}`,
                            excerpt: ep.summary,
                            type: 'api',
                            path: `/api#${ep.id}`,
                            score: 0.8,
                        });
                    }
                });

                return results.sort((a, b) => b.score - a.score);
            },

            indexDocument: (_documentId) => {
                // Would build search index
            },

            getDocumentTree: () => {
                const { documents } = get();
                const roots = documents.filter(d => !d.parentId);
                return roots.map(root => ({
                    id: root.id,
                    title: root.title,
                    children: documents.filter(d => d.parentId === root.id).map(c => c.id),
                }));
            },

            getRecentDocuments: () => {
                const { documents, recentDocuments } = get();
                return recentDocuments.map(id => documents.find(d => d.id === id)).filter(Boolean) as Document[];
            },
        }),
        { name: 'sprintloop-documentation' }
    )
);
