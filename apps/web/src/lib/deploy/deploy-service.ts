/**
 * SprintLoop One-Click Deploy Service
 * 
 * Implements Cursor-style and modern deployment:
 * - Vercel integration
 * - Netlify integration
 * - GitHub Pages
 * - Railway, Render, Fly.io
 * - Preview deployments
 * - Environment management
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Deployment provider types
export type DeployProvider =
    | 'vercel'
    | 'netlify'
    | 'github-pages'
    | 'railway'
    | 'render'
    | 'fly'
    | 'cloudflare'
    | 'aws-amplify'

// Deployment status
export type DeployStatus =
    | 'idle'
    | 'building'
    | 'deploying'
    | 'ready'
    | 'error'
    | 'queued'
    | 'cancelled'

// Environment variables
export interface EnvVariable {
    key: string
    value: string
    isSecret: boolean
    environment: 'production' | 'preview' | 'development' | 'all'
}

// Deployment record
export interface Deployment {
    id: string
    provider: DeployProvider
    status: DeployStatus
    url?: string
    previewUrl?: string
    branch: string
    commit: string
    commitMessage?: string
    createdAt: number
    completedAt?: number
    buildLogs?: string[]
    error?: string
    environment: 'production' | 'preview'
    meta?: Record<string, unknown>
}

// Provider configuration
export interface ProviderConfig {
    provider: DeployProvider
    name: string
    icon: string
    color: string
    connected: boolean
    projectId?: string
    teamId?: string
    apiKey?: string
    features: {
        preview: boolean
        serverless: boolean
        edge: boolean
        database: boolean
        storage: boolean
    }
}

// Deploy providers configuration
const DEPLOY_PROVIDERS: Record<DeployProvider, Omit<ProviderConfig, 'connected' | 'projectId' | 'teamId' | 'apiKey'>> = {
    vercel: {
        provider: 'vercel',
        name: 'Vercel',
        icon: '▲',
        color: '#000',
        features: { preview: true, serverless: true, edge: true, database: true, storage: true },
    },
    netlify: {
        provider: 'netlify',
        name: 'Netlify',
        icon: '◇',
        color: '#00C7B7',
        features: { preview: true, serverless: true, edge: true, database: false, storage: false },
    },
    'github-pages': {
        provider: 'github-pages',
        name: 'GitHub Pages',
        icon: '🐙',
        color: '#181717',
        features: { preview: false, serverless: false, edge: false, database: false, storage: false },
    },
    railway: {
        provider: 'railway',
        name: 'Railway',
        icon: '🚂',
        color: '#0B0D0E',
        features: { preview: true, serverless: false, edge: false, database: true, storage: false },
    },
    render: {
        provider: 'render',
        name: 'Render',
        icon: '◈',
        color: '#46E3B7',
        features: { preview: true, serverless: false, edge: false, database: true, storage: false },
    },
    fly: {
        provider: 'fly',
        name: 'Fly.io',
        icon: '🪁',
        color: '#7B3FE4',
        features: { preview: true, serverless: false, edge: true, database: true, storage: true },
    },
    cloudflare: {
        provider: 'cloudflare',
        name: 'Cloudflare Pages',
        icon: '☁️',
        color: '#F38020',
        features: { preview: true, serverless: true, edge: true, database: true, storage: true },
    },
    'aws-amplify': {
        provider: 'aws-amplify',
        name: 'AWS Amplify',
        icon: '📦',
        color: '#FF9900',
        features: { preview: true, serverless: true, edge: false, database: true, storage: true },
    },
}

// Deploy state
interface DeployState {
    // Providers
    providers: ProviderConfig[]
    defaultProvider: DeployProvider | null

    // Deployments
    deployments: Deployment[]
    currentDeployment: Deployment | null

    // Environment
    envVariables: EnvVariable[]

    // Build settings
    buildCommand: string
    outputDirectory: string
    installCommand: string
    rootDirectory: string

    // Actions
    connectProvider: (provider: DeployProvider, config: { apiKey?: string; projectId?: string; teamId?: string }) => Promise<boolean>
    disconnectProvider: (provider: DeployProvider) => void
    setDefaultProvider: (provider: DeployProvider) => void

    // Deployment
    deploy: (options?: { preview?: boolean; branch?: string }) => Promise<Deployment>
    cancelDeployment: (deploymentId: string) => void
    getDeploymentStatus: (deploymentId: string) => Deployment | undefined
    getDeployments: (limit?: number) => Deployment[]
    clearDeployments: () => void

    // Environment variables
    addEnvVariable: (variable: Omit<EnvVariable, 'key'> & { key: string }) => void
    updateEnvVariable: (key: string, updates: Partial<EnvVariable>) => void
    removeEnvVariable: (key: string) => void
    syncEnvVariables: () => Promise<boolean>

    // Build settings
    setBuildSettings: (settings: Partial<Pick<DeployState, 'buildCommand' | 'outputDirectory' | 'installCommand' | 'rootDirectory'>>) => void
    detectBuildSettings: () => void

    // Helpers
    getProviderConfig: (provider: DeployProvider) => ProviderConfig | undefined
    getConnectedProviders: () => ProviderConfig[]
    getLatestDeployment: (environment?: 'production' | 'preview') => Deployment | undefined
}

export const useDeployService = create<DeployState>()(
    persist(
        (set, get) => ({
            providers: Object.values(DEPLOY_PROVIDERS).map(p => ({
                ...p,
                connected: false,
            })),
            defaultProvider: null,
            deployments: [],
            currentDeployment: null,
            envVariables: [],
            buildCommand: 'npm run build',
            outputDirectory: 'dist',
            installCommand: 'npm install',
            rootDirectory: './',

            connectProvider: async (provider, config) => {
                // Simulate API connection
                await new Promise(resolve => setTimeout(resolve, 1000))

                set(state => ({
                    providers: state.providers.map(p =>
                        p.provider === provider
                            ? { ...p, connected: true, ...config }
                            : p
                    ),
                    defaultProvider: state.defaultProvider || provider,
                }))

                return true
            },

            disconnectProvider: (provider) => {
                set(state => ({
                    providers: state.providers.map(p =>
                        p.provider === provider
                            ? { ...p, connected: false, apiKey: undefined, projectId: undefined }
                            : p
                    ),
                    defaultProvider: state.defaultProvider === provider ? null : state.defaultProvider,
                }))
            },

            setDefaultProvider: (provider) => set({ defaultProvider: provider }),

            deploy: async ({ preview = false, branch = 'main' } = {}) => {
                const { defaultProvider, buildCommand, outputDirectory } = get()

                if (!defaultProvider) {
                    throw new Error('No deployment provider configured')
                }

                const deploymentId = `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

                const deployment: Deployment = {
                    id: deploymentId,
                    provider: defaultProvider,
                    status: 'queued',
                    branch,
                    commit: 'abc123',
                    commitMessage: 'Latest changes',
                    createdAt: Date.now(),
                    environment: preview ? 'preview' : 'production',
                    buildLogs: [],
                }

                set(state => ({
                    currentDeployment: deployment,
                    deployments: [deployment, ...state.deployments].slice(0, 50),
                }))

                // Simulate build process
                const updateStatus = (status: DeployStatus, logs?: string[]) => {
                    set(state => {
                        const updated: Deployment = {
                            ...deployment,
                            status,
                            buildLogs: [...(deployment.buildLogs || []), ...(logs || [])],
                        }
                        return {
                            currentDeployment: updated,
                            deployments: state.deployments.map(d =>
                                d.id === deploymentId ? updated : d
                            ),
                        }
                    })
                }

                // Building
                await new Promise(resolve => setTimeout(resolve, 500))
                updateStatus('building', [`> ${buildCommand}`])

                await new Promise(resolve => setTimeout(resolve, 1500))
                updateStatus('building', ['✓ Build completed', `Output: ${outputDirectory}`])

                // Deploying
                await new Promise(resolve => setTimeout(resolve, 500))
                updateStatus('deploying', ['Uploading to CDN...'])

                await new Promise(resolve => setTimeout(resolve, 1000))

                // Complete
                const finalDeployment: Deployment = {
                    ...deployment,
                    status: 'ready',
                    url: preview ? undefined : `https://myproject.${defaultProvider}.app`,
                    previewUrl: preview ? `https://preview-${Date.now()}.${defaultProvider}.app` : undefined,
                    completedAt: Date.now(),
                    buildLogs: [
                        `> ${buildCommand}`,
                        '✓ Build completed',
                        `Output: ${outputDirectory}`,
                        'Uploading to CDN...',
                        '✓ Deployed successfully',
                    ],
                }

                set(state => ({
                    currentDeployment: null,
                    deployments: state.deployments.map(d =>
                        d.id === deploymentId ? finalDeployment : d
                    ),
                }))

                return finalDeployment
            },

            cancelDeployment: (deploymentId) => {
                set(state => ({
                    currentDeployment: state.currentDeployment?.id === deploymentId ? null : state.currentDeployment,
                    deployments: state.deployments.map(d =>
                        d.id === deploymentId ? { ...d, status: 'cancelled' as const } : d
                    ),
                }))
            },

            getDeploymentStatus: (deploymentId) => get().deployments.find(d => d.id === deploymentId),

            getDeployments: (limit = 10) => get().deployments.slice(0, limit),

            clearDeployments: () => set({ deployments: [] }),

            addEnvVariable: (variable) => {
                set(state => ({
                    envVariables: [...state.envVariables.filter(v => v.key !== variable.key), variable],
                }))
            },

            updateEnvVariable: (key, updates) => {
                set(state => ({
                    envVariables: state.envVariables.map(v =>
                        v.key === key ? { ...v, ...updates } : v
                    ),
                }))
            },

            removeEnvVariable: (key) => {
                set(state => ({
                    envVariables: state.envVariables.filter(v => v.key !== key),
                }))
            },

            syncEnvVariables: async () => {
                // Would sync with provider
                await new Promise(resolve => setTimeout(resolve, 500))
                return true
            },

            setBuildSettings: (settings) => set(settings),

            detectBuildSettings: () => {
                // Auto-detect from package.json or config files
                // For now, use sensible defaults
                set({
                    buildCommand: 'npm run build',
                    outputDirectory: 'dist',
                    installCommand: 'npm install',
                    rootDirectory: './',
                })
            },

            getProviderConfig: (provider) => get().providers.find(p => p.provider === provider),

            getConnectedProviders: () => get().providers.filter(p => p.connected),

            getLatestDeployment: (environment) => {
                const deps = get().deployments.filter(d =>
                    d.status === 'ready' && (!environment || d.environment === environment)
                )
                return deps[0]
            },
        }),
        {
            name: 'sprintloop-deploy',
            partialize: (state) => ({
                providers: state.providers.map(p => ({
                    provider: p.provider,
                    connected: p.connected,
                    projectId: p.projectId,
                })),
                defaultProvider: state.defaultProvider,
                envVariables: state.envVariables.filter(v => !v.isSecret),
                buildCommand: state.buildCommand,
                outputDirectory: state.outputDirectory,
                installCommand: state.installCommand,
                rootDirectory: state.rootDirectory,
            }),
        }
    )
)
