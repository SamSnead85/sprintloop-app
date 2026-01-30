/**
 * Extensions Service
 * 
 * Extension marketplace, installation, and management.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface Extension {
    id: string;
    name: string;
    displayName: string;
    version: string;
    publisher: string;
    description: string;
    category: ExtensionCategory;
    icon?: string;
    repository?: string;
    homepage?: string;
    rating: number;
    ratingCount: number;
    downloadCount: number;
    lastUpdated: string;
    tags: string[];
    dependencies?: string[];
}

export interface InstalledExtension extends Extension {
    enabled: boolean;
    installedAt: string;
    settings?: Record<string, unknown>;
}

export type ExtensionCategory =
    | 'languages'
    | 'themes'
    | 'debuggers'
    | 'formatters'
    | 'linters'
    | 'snippets'
    | 'keymaps'
    | 'ai'
    | 'other';

export interface ExtensionsState {
    installed: InstalledExtension[];
    marketplace: Extension[];
    isLoading: boolean;
    searchQuery: string;
    selectedCategory: ExtensionCategory | 'all' | 'installed' | 'recommended';

    // Installation
    installExtension: (ext: Extension) => Promise<void>;
    uninstallExtension: (id: string) => Promise<void>;
    updateExtension: (id: string) => Promise<void>;

    // Enable/Disable
    enableExtension: (id: string) => void;
    disableExtension: (id: string) => void;

    // Queries
    getInstalledExtension: (id: string) => InstalledExtension | undefined;
    isInstalled: (id: string) => boolean;
    getByCategory: (category: ExtensionCategory) => Extension[];
    searchExtensions: (query: string) => Extension[];
    getRecommended: () => Extension[];

    // UI State
    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: ExtensionCategory | 'all' | 'installed' | 'recommended') => void;

    // Marketplace
    fetchMarketplace: () => Promise<void>;
    refreshMarketplace: () => Promise<void>;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_EXTENSIONS: Extension[] = [
    {
        id: 'sprintloop.ai-assistant',
        name: 'ai-assistant',
        displayName: 'SprintLoop AI Assistant',
        version: '2.0.0',
        publisher: 'SprintLoop',
        description: 'AI-powered coding assistant with inline completions, refactoring, and chat',
        category: 'ai',
        icon: '🤖',
        rating: 4.9,
        ratingCount: 12500,
        downloadCount: 850000,
        lastUpdated: '2025-01-15',
        tags: ['ai', 'completion', 'productivity'],
    },
    {
        id: 'typescript.language',
        name: 'typescript-language',
        displayName: 'TypeScript',
        version: '5.3.0',
        publisher: 'Microsoft',
        description: 'TypeScript and JavaScript language support with IntelliSense',
        category: 'languages',
        icon: '📘',
        rating: 4.8,
        ratingCount: 45000,
        downloadCount: 2500000,
        lastUpdated: '2025-01-10',
        tags: ['typescript', 'javascript', 'language'],
    },
    {
        id: 'prettier.formatter',
        name: 'prettier',
        displayName: 'Prettier - Code Formatter',
        version: '10.0.0',
        publisher: 'Prettier',
        description: 'Code formatter using prettier',
        category: 'formatters',
        icon: '✨',
        rating: 4.7,
        ratingCount: 32000,
        downloadCount: 1800000,
        lastUpdated: '2025-01-12',
        tags: ['formatter', 'code style', 'prettier'],
    },
    {
        id: 'eslint.linter',
        name: 'eslint',
        displayName: 'ESLint',
        version: '9.0.0',
        publisher: 'ESLint',
        description: 'Integrates ESLint into VS Code',
        category: 'linters',
        icon: '🔍',
        rating: 4.6,
        ratingCount: 28000,
        downloadCount: 1600000,
        lastUpdated: '2025-01-08',
        tags: ['linter', 'javascript', 'typescript'],
    },
    {
        id: 'one-dark.theme',
        name: 'one-dark-pro',
        displayName: 'One Dark Pro',
        version: '3.15.0',
        publisher: 'binaryify',
        description: "Atom's iconic One Dark theme for VS Code",
        category: 'themes',
        icon: '🎨',
        rating: 4.8,
        ratingCount: 18000,
        downloadCount: 950000,
        lastUpdated: '2024-12-20',
        tags: ['theme', 'dark', 'atom'],
    },
    {
        id: 'python.language',
        name: 'python',
        displayName: 'Python',
        version: '2024.0.0',
        publisher: 'Microsoft',
        description: 'Python language support with IntelliSense, linting, debugging',
        category: 'languages',
        icon: '🐍',
        rating: 4.7,
        ratingCount: 52000,
        downloadCount: 3200000,
        lastUpdated: '2025-01-14',
        tags: ['python', 'language', 'debugging'],
    },
    {
        id: 'node.debugger',
        name: 'node-debug',
        displayName: 'Node.js Debugger',
        version: '1.50.0',
        publisher: 'Microsoft',
        description: 'Debug Node.js applications',
        category: 'debuggers',
        icon: '🐛',
        rating: 4.5,
        ratingCount: 15000,
        downloadCount: 800000,
        lastUpdated: '2025-01-05',
        tags: ['debugger', 'node', 'javascript'],
    },
    {
        id: 'react.snippets',
        name: 'react-snippets',
        displayName: 'ES7+ React/Redux/React-Native Snippets',
        version: '4.4.0',
        publisher: 'dsznajder',
        description: 'Simple extensions for React, Redux and React-Native code snippets',
        category: 'snippets',
        icon: '⚛️',
        rating: 4.6,
        ratingCount: 22000,
        downloadCount: 1100000,
        lastUpdated: '2024-12-28',
        tags: ['snippets', 'react', 'redux'],
    },
    {
        id: 'vim.keymap',
        name: 'vim',
        displayName: 'Vim',
        version: '2.0.0',
        publisher: 'vscodevim',
        description: 'Vim emulation for Visual Studio Code',
        category: 'keymaps',
        icon: '🅥',
        rating: 4.4,
        ratingCount: 12000,
        downloadCount: 600000,
        lastUpdated: '2025-01-02',
        tags: ['vim', 'keymap', 'emulation'],
    },
    {
        id: 'docker.tools',
        name: 'docker',
        displayName: 'Docker',
        version: '1.28.0',
        publisher: 'Microsoft',
        description: 'Docker extension for VS Code',
        category: 'other',
        icon: '🐳',
        rating: 4.6,
        ratingCount: 19000,
        downloadCount: 900000,
        lastUpdated: '2025-01-07',
        tags: ['docker', 'containers', 'devops'],
    },
];

// =============================================================================
// EXTENSIONS STORE
// =============================================================================

export const useExtensionsService = create<ExtensionsState>()(
    persist(
        (set, get) => ({
            installed: [],
            marketplace: MOCK_EXTENSIONS,
            isLoading: false,
            searchQuery: '',
            selectedCategory: 'all',

            installExtension: async (ext) => {
                set({ isLoading: true });

                // Simulate installation
                await new Promise(resolve => setTimeout(resolve, 500));

                const installed: InstalledExtension = {
                    ...ext,
                    enabled: true,
                    installedAt: new Date().toISOString(),
                };

                set(state => ({
                    installed: [...state.installed, installed],
                    isLoading: false,
                }));

                console.log('[Extensions] Installed:', ext.displayName);
            },

            uninstallExtension: async (id) => {
                set({ isLoading: true });

                await new Promise(resolve => setTimeout(resolve, 300));

                set(state => ({
                    installed: state.installed.filter(e => e.id !== id),
                    isLoading: false,
                }));

                console.log('[Extensions] Uninstalled:', id);
            },

            updateExtension: async (id) => {
                set({ isLoading: true });

                await new Promise(resolve => setTimeout(resolve, 400));

                const marketplaceVersion = get().marketplace.find(e => e.id === id);
                if (marketplaceVersion) {
                    set(state => ({
                        installed: state.installed.map(e =>
                            e.id === id ? { ...e, version: marketplaceVersion.version } : e
                        ),
                        isLoading: false,
                    }));
                }

                console.log('[Extensions] Updated:', id);
            },

            enableExtension: (id) => {
                set(state => ({
                    installed: state.installed.map(e =>
                        e.id === id ? { ...e, enabled: true } : e
                    ),
                }));
            },

            disableExtension: (id) => {
                set(state => ({
                    installed: state.installed.map(e =>
                        e.id === id ? { ...e, enabled: false } : e
                    ),
                }));
            },

            getInstalledExtension: (id) => {
                return get().installed.find(e => e.id === id);
            },

            isInstalled: (id) => {
                return get().installed.some(e => e.id === id);
            },

            getByCategory: (category) => {
                return get().marketplace.filter(e => e.category === category);
            },

            searchExtensions: (query) => {
                const lowerQuery = query.toLowerCase();
                return get().marketplace.filter(e =>
                    e.displayName.toLowerCase().includes(lowerQuery) ||
                    e.description.toLowerCase().includes(lowerQuery) ||
                    e.tags.some(t => t.toLowerCase().includes(lowerQuery))
                );
            },

            getRecommended: () => {
                return get().marketplace
                    .filter(e => e.rating >= 4.5 && !get().isInstalled(e.id))
                    .sort((a, b) => b.downloadCount - a.downloadCount)
                    .slice(0, 5);
            },

            setSearchQuery: (query) => {
                set({ searchQuery: query });
            },

            setSelectedCategory: (category) => {
                set({ selectedCategory: category });
            },

            fetchMarketplace: async () => {
                set({ isLoading: true });

                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 300));

                set({ marketplace: MOCK_EXTENSIONS, isLoading: false });
            },

            refreshMarketplace: async () => {
                await get().fetchMarketplace();
            },
        }),
        {
            name: 'sprintloop-extensions',
            partialize: (state) => ({
                installed: state.installed,
            }),
        }
    )
);

// =============================================================================
// CATEGORY INFO
// =============================================================================

export const EXTENSION_CATEGORY_INFO: Record<ExtensionCategory, { label: string; icon: string }> = {
    languages: { label: 'Languages', icon: '🌐' },
    themes: { label: 'Themes', icon: '🎨' },
    debuggers: { label: 'Debuggers', icon: '🐛' },
    formatters: { label: 'Formatters', icon: '✨' },
    linters: { label: 'Linters', icon: '🔍' },
    snippets: { label: 'Snippets', icon: '📝' },
    keymaps: { label: 'Keymaps', icon: '⌨️' },
    ai: { label: 'AI', icon: '🤖' },
    other: { label: 'Other', icon: '📦' },
};
