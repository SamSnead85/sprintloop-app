/**
 * Phase 951-1000: Integration Hub Services
 * 
 * Third-party integrations and connectivity:
 * - Service connections
 * - API integrations
 * - Data sync
 * - Import/Export
 * - Plugin marketplace
 * - Custom integrations
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface Integration {
    id: string;
    name: string;
    provider: IntegrationProvider;
    category: IntegrationCategory;
    status: 'connected' | 'disconnected' | 'error' | 'pending';
    config: Record<string, unknown>;
    credentials?: Record<string, string>;
    lastSync?: Date;
    syncEnabled: boolean;
    syncInterval?: number;
    features: string[];
}

export type IntegrationProvider =
    | 'github' | 'gitlab' | 'bitbucket'
    | 'jira' | 'linear' | 'asana' | 'trello'
    | 'slack' | 'discord' | 'teams'
    | 'notion' | 'confluence'
    | 'aws' | 'gcp' | 'azure'
    | 'vercel' | 'netlify' | 'railway'
    | 'sentry' | 'datadog' | 'grafana'
    | 'stripe' | 'twilio'
    | 'custom';

export type IntegrationCategory =
    | 'source-control' | 'project-management' | 'communication'
    | 'documentation' | 'cloud' | 'deployment'
    | 'monitoring' | 'payments' | 'other';

export interface SyncJob {
    id: string;
    integrationId: string;
    type: 'import' | 'export' | 'bidirectional';
    status: 'pending' | 'running' | 'success' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    itemsProcessed: number;
    errors: string[];
}

export interface DataMapping {
    id: string;
    integrationId: string;
    sourceField: string;
    targetField: string;
    transform?: string;
}

export interface WebhookEndpoint {
    id: string;
    integrationId: string;
    url: string;
    events: string[];
    active: boolean;
    secret?: string;
}

export interface IntegrationHubState {
    integrations: Integration[];
    syncJobs: SyncJob[];
    dataMappings: DataMapping[];
    webhookEndpoints: WebhookEndpoint[];

    // Integration management
    addIntegration: (integration: Omit<Integration, 'id' | 'status'>) => string;
    removeIntegration: (id: string) => void;
    connect: (id: string) => Promise<void>;
    disconnect: (id: string) => void;
    updateConfig: (id: string, config: Record<string, unknown>) => void;

    // Sync operations
    syncNow: (integrationId: string) => Promise<SyncJob>;
    enableAutoSync: (integrationId: string, intervalMinutes: number) => void;
    disableAutoSync: (integrationId: string) => void;
    getSyncHistory: (integrationId: string) => SyncJob[];

    // Data mapping
    addMapping: (mapping: Omit<DataMapping, 'id'>) => string;
    updateMapping: (id: string, updates: Partial<DataMapping>) => void;
    removeMapping: (id: string) => void;

    // Import/Export
    importData: (integrationId: string, dataType: string) => Promise<{ imported: number; skipped: number; errors: number }>;
    exportData: (integrationId: string, dataType: string) => Promise<string>;

    // Webhook management
    registerWebhook: (integrationId: string, events: string[]) => string;
    unregisterWebhook: (webhookId: string) => void;

    // Marketplace
    getAvailableIntegrations: () => { provider: IntegrationProvider; name: string; category: IntegrationCategory; description: string }[];
    searchIntegrations: (query: string) => Integration[];
}

// =============================================================================
// AVAILABLE INTEGRATIONS
// =============================================================================

const AVAILABLE_INTEGRATIONS = [
    { provider: 'github' as const, name: 'GitHub', category: 'source-control' as const, description: 'Connect to GitHub repositories, issues, and pull requests' },
    { provider: 'gitlab' as const, name: 'GitLab', category: 'source-control' as const, description: 'Connect to GitLab repositories and CI/CD' },
    { provider: 'bitbucket' as const, name: 'Bitbucket', category: 'source-control' as const, description: 'Connect to Bitbucket repositories' },
    { provider: 'jira' as const, name: 'Jira', category: 'project-management' as const, description: 'Sync issues and projects with Jira' },
    { provider: 'linear' as const, name: 'Linear', category: 'project-management' as const, description: 'Connect to Linear for issue tracking' },
    { provider: 'slack' as const, name: 'Slack', category: 'communication' as const, description: 'Send notifications and updates to Slack' },
    { provider: 'discord' as const, name: 'Discord', category: 'communication' as const, description: 'Send notifications to Discord channels' },
    { provider: 'notion' as const, name: 'Notion', category: 'documentation' as const, description: 'Sync documentation with Notion' },
    { provider: 'aws' as const, name: 'Amazon Web Services', category: 'cloud' as const, description: 'Connect to AWS services' },
    { provider: 'vercel' as const, name: 'Vercel', category: 'deployment' as const, description: 'Deploy to Vercel' },
    { provider: 'netlify' as const, name: 'Netlify', category: 'deployment' as const, description: 'Deploy to Netlify' },
    { provider: 'sentry' as const, name: 'Sentry', category: 'monitoring' as const, description: 'Error tracking with Sentry' },
    { provider: 'datadog' as const, name: 'Datadog', category: 'monitoring' as const, description: 'APM and monitoring with Datadog' },
];

// =============================================================================
// STORE
// =============================================================================

export const useIntegrationHub = create<IntegrationHubState>()(
    persist(
        (set, get) => ({
            integrations: [],
            syncJobs: [],
            dataMappings: [],
            webhookEndpoints: [],

            addIntegration: (integrationData) => {
                const id = `int_${Date.now()}`;
                set(state => ({
                    integrations: [...state.integrations, { ...integrationData, id, status: 'disconnected' }],
                }));
                return id;
            },

            removeIntegration: (id) => {
                set(state => ({
                    integrations: state.integrations.filter(i => i.id !== id),
                    syncJobs: state.syncJobs.filter(s => s.integrationId !== id),
                    dataMappings: state.dataMappings.filter(m => m.integrationId !== id),
                    webhookEndpoints: state.webhookEndpoints.filter(w => w.integrationId !== id),
                }));
            },

            connect: async (id) => {
                set(state => ({
                    integrations: state.integrations.map(i =>
                        i.id === id ? { ...i, status: 'pending' } : i
                    ),
                }));

                await new Promise(r => setTimeout(r, 1500));

                set(state => ({
                    integrations: state.integrations.map(i =>
                        i.id === id ? { ...i, status: 'connected', lastSync: new Date() } : i
                    ),
                }));
            },

            disconnect: (id) => {
                set(state => ({
                    integrations: state.integrations.map(i =>
                        i.id === id ? { ...i, status: 'disconnected', credentials: undefined } : i
                    ),
                }));
            },

            updateConfig: (id, config) => {
                set(state => ({
                    integrations: state.integrations.map(i =>
                        i.id === id ? { ...i, config: { ...i.config, ...config } } : i
                    ),
                }));
            },

            syncNow: async (integrationId) => {
                const job: SyncJob = {
                    id: `sync_${Date.now()}`,
                    integrationId,
                    type: 'bidirectional',
                    status: 'running',
                    startedAt: new Date(),
                    itemsProcessed: 0,
                    errors: [],
                };

                set(state => ({ syncJobs: [job, ...state.syncJobs] }));

                await new Promise(r => setTimeout(r, 2000));

                set(state => ({
                    syncJobs: state.syncJobs.map(s =>
                        s.id === job.id ? { ...s, status: 'success', completedAt: new Date(), itemsProcessed: 42 } : s
                    ),
                    integrations: state.integrations.map(i =>
                        i.id === integrationId ? { ...i, lastSync: new Date() } : i
                    ),
                }));

                return get().syncJobs.find(s => s.id === job.id)!;
            },

            enableAutoSync: (integrationId, intervalMinutes) => {
                set(state => ({
                    integrations: state.integrations.map(i =>
                        i.id === integrationId ? { ...i, syncEnabled: true, syncInterval: intervalMinutes } : i
                    ),
                }));
            },

            disableAutoSync: (integrationId) => {
                set(state => ({
                    integrations: state.integrations.map(i =>
                        i.id === integrationId ? { ...i, syncEnabled: false, syncInterval: undefined } : i
                    ),
                }));
            },

            getSyncHistory: (integrationId) => get().syncJobs.filter(s => s.integrationId === integrationId),

            addMapping: (mappingData) => {
                const id = `map_${Date.now()}`;
                set(state => ({
                    dataMappings: [...state.dataMappings, { ...mappingData, id }],
                }));
                return id;
            },

            updateMapping: (id, updates) => {
                set(state => ({
                    dataMappings: state.dataMappings.map(m =>
                        m.id === id ? { ...m, ...updates } : m
                    ),
                }));
            },

            removeMapping: (id) => {
                set(state => ({ dataMappings: state.dataMappings.filter(m => m.id !== id) }));
            },

            importData: async (_integrationId, _dataType) => {
                await new Promise(r => setTimeout(r, 2000));
                return { imported: 45, skipped: 3, errors: 1 };
            },

            exportData: async (_integrationId, _dataType) => {
                await new Promise(r => setTimeout(r, 1500));
                return JSON.stringify({ exported: 45, timestamp: new Date() });
            },

            registerWebhook: (integrationId, events) => {
                const id = `wh_${Date.now()}`;
                const endpoint: WebhookEndpoint = {
                    id,
                    integrationId,
                    url: `https://api.sprintloop.dev/webhooks/${id}`,
                    events,
                    active: true,
                    secret: `whsec_${Date.now()}`,
                };
                set(state => ({ webhookEndpoints: [...state.webhookEndpoints, endpoint] }));
                return id;
            },

            unregisterWebhook: (webhookId) => {
                set(state => ({ webhookEndpoints: state.webhookEndpoints.filter(w => w.id !== webhookId) }));
            },

            getAvailableIntegrations: () => AVAILABLE_INTEGRATIONS,

            searchIntegrations: (query) => {
                const q = query.toLowerCase();
                return get().integrations.filter(i =>
                    i.name.toLowerCase().includes(q) || i.provider.includes(q)
                );
            },
        }),
        {
            name: 'sprintloop-integrations',
            partialize: (state) => ({
                integrations: state.integrations.map(i => ({ ...i, credentials: undefined })),
                dataMappings: state.dataMappings,
            }),
        }
    )
);
