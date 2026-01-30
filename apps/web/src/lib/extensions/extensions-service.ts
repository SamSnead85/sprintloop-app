/**
 * Phase 451-500: Extensions & Plugins System
 * 
 * Extensibility infrastructure:
 * - Extension registry
 * - Plugin lifecycle
 * - Extension marketplace
 * - Theme extensions
 * - Language extensions
 * - Custom commands
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
    categories: ExtensionCategory[];
    icon?: string;
    repository?: string;
    homepage?: string;
    license?: string;
    downloads: number;
    rating: number;
    installed: boolean;
    enabled: boolean;
    activationEvents: string[];
    contributes: ExtensionContributes;
}

export type ExtensionCategory =
    | 'themes' | 'languages' | 'snippets' | 'formatters'
    | 'linters' | 'debuggers' | 'keymaps' | 'other';

export interface ExtensionContributes {
    themes?: ThemeContribution[];
    languages?: LanguageContribution[];
    snippets?: SnippetContribution[];
    commands?: CommandContribution[];
    keybindings?: KeybindingContribution[];
    configuration?: ConfigurationContribution[];
}

export interface ThemeContribution {
    id: string;
    label: string;
    uiTheme: 'vs-dark' | 'vs-light';
    path: string;
}

export interface LanguageContribution {
    id: string;
    extensions: string[];
    aliases: string[];
    configuration: string;
}

export interface SnippetContribution {
    language: string;
    path: string;
}

export interface CommandContribution {
    command: string;
    title: string;
    category?: string;
}

export interface KeybindingContribution {
    command: string;
    key: string;
    when?: string;
}

export interface ConfigurationContribution {
    title: string;
    properties: Record<string, { type: string; default: unknown; description: string }>;
}

export interface ExtensionsState {
    installed: Extension[];
    marketplace: Extension[];
    searchQuery: string;
    selectedCategory: ExtensionCategory | null;
    isLoading: boolean;

    // Installation
    install: (extensionId: string) => Promise<void>;
    uninstall: (extensionId: string) => void;
    enable: (extensionId: string) => void;
    disable: (extensionId: string) => void;
    update: (extensionId: string) => Promise<void>;

    // Marketplace
    searchMarketplace: (query: string) => Promise<void>;
    filterByCategory: (category: ExtensionCategory | null) => void;
    refreshMarketplace: () => Promise<void>;

    // Getters
    getInstalledExtension: (id: string) => Extension | undefined;
    getEnabledExtensions: () => Extension[];
    getExtensionsByCategory: (category: ExtensionCategory) => Extension[];
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_EXTENSIONS: Extension[] = [
    {
        id: 'theme-tokyo-night',
        name: 'tokyo-night',
        displayName: 'Tokyo Night Theme',
        version: '2.0.0',
        publisher: 'enkia',
        description: 'A clean Tokyo Night-inspired theme',
        categories: ['themes'],
        downloads: 5200000,
        rating: 4.9,
        installed: false,
        enabled: false,
        activationEvents: ['*'],
        contributes: { themes: [{ id: 'tokyo-night', label: 'Tokyo Night', uiTheme: 'vs-dark', path: './themes/tokyo-night.json' }] },
    },
    {
        id: 'prettier',
        name: 'prettier-vscode',
        displayName: 'Prettier - Code formatter',
        version: '10.1.0',
        publisher: 'esbenp',
        description: 'Code formatter using prettier',
        categories: ['formatters'],
        downloads: 42000000,
        rating: 4.5,
        installed: true,
        enabled: true,
        activationEvents: ['onLanguage:javascript'],
        contributes: { commands: [{ command: 'prettier.format', title: 'Format Document' }] },
    },
    {
        id: 'eslint',
        name: 'vscode-eslint',
        displayName: 'ESLint',
        version: '3.0.0',
        publisher: 'dbaeumer',
        description: 'Integrates ESLint',
        categories: ['linters'],
        downloads: 35000000,
        rating: 4.7,
        installed: true,
        enabled: true,
        activationEvents: ['onLanguage:javascript'],
        contributes: { commands: [{ command: 'eslint.fix', title: 'Fix Problems' }] },
    },
];

// =============================================================================
// STORE
// =============================================================================

export const useExtensionsService = create<ExtensionsState>()(
    persist(
        (set, get) => ({
            installed: MOCK_EXTENSIONS.filter(e => e.installed),
            marketplace: MOCK_EXTENSIONS,
            searchQuery: '',
            selectedCategory: null,
            isLoading: false,

            install: async (extensionId) => {
                set({ isLoading: true });
                await new Promise(r => setTimeout(r, 1000));
                const ext = get().marketplace.find(e => e.id === extensionId);
                if (!ext) return;
                const installedExt = { ...ext, installed: true, enabled: true };
                set(state => ({
                    installed: [...state.installed, installedExt],
                    marketplace: state.marketplace.map(e => e.id === extensionId ? installedExt : e),
                    isLoading: false,
                }));
            },

            uninstall: (extensionId) => {
                set(state => ({
                    installed: state.installed.filter(e => e.id !== extensionId),
                    marketplace: state.marketplace.map(e => e.id === extensionId ? { ...e, installed: false, enabled: false } : e),
                }));
            },

            enable: (extensionId) => set(state => ({ installed: state.installed.map(e => e.id === extensionId ? { ...e, enabled: true } : e) })),
            disable: (extensionId) => set(state => ({ installed: state.installed.map(e => e.id === extensionId ? { ...e, enabled: false } : e) })),
            update: async () => { await new Promise(r => setTimeout(r, 500)); },
            searchMarketplace: async (query) => { set({ isLoading: true, searchQuery: query }); await new Promise(r => setTimeout(r, 300)); set({ isLoading: false }); },
            filterByCategory: (category) => set({ selectedCategory: category }),
            refreshMarketplace: async () => { set({ isLoading: true }); await new Promise(r => setTimeout(r, 500)); set({ isLoading: false }); },
            getInstalledExtension: (id) => get().installed.find(e => e.id === id),
            getEnabledExtensions: () => get().installed.filter(e => e.enabled),
            getExtensionsByCategory: (category) => get().marketplace.filter(e => e.categories.includes(category)),
        }),
        { name: 'sprintloop-extensions', partialize: (state) => ({ installed: state.installed }) }
    )
);
