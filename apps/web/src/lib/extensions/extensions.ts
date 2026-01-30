/**
 * Extensions System
 * 
 * Plugin architecture for extending the IDE.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface Extension {
    id: string;
    name: string;
    displayName: string;
    description: string;
    version: string;
    author: string;
    repository?: string;
    icon?: string;
    categories: ExtensionCategory[];

    // State
    installed: boolean;
    enabled: boolean;
    activationEvents: string[];

    // Contributions
    contributes?: ExtensionContributes;
}

export type ExtensionCategory =
    | 'themes'
    | 'languages'
    | 'snippets'
    | 'linters'
    | 'debuggers'
    | 'formatters'
    | 'ai'
    | 'other';

export interface ExtensionContributes {
    commands?: ExtensionCommand[];
    themes?: ExtensionTheme[];
    languages?: ExtensionLanguage[];
    snippets?: ExtensionSnippet[];
    keybindings?: ExtensionKeybinding[];
}

export interface ExtensionCommand {
    command: string;
    title: string;
    category?: string;
}

export interface ExtensionTheme {
    id: string;
    label: string;
    uiTheme: 'vs-dark' | 'vs-light';
    path: string;
}

export interface ExtensionLanguage {
    id: string;
    extensions: string[];
    aliases: string[];
}

export interface ExtensionSnippet {
    language: string;
    path: string;
}

export interface ExtensionKeybinding {
    command: string;
    key: string;
    mac?: string;
    when?: string;
}

export interface ExtensionsState {
    extensions: Map<string, Extension>;
    marketplace: Extension[];
    isLoading: boolean;

    // Actions
    install: (extensionId: string) => Promise<void>;
    uninstall: (extensionId: string) => Promise<void>;
    enable: (extensionId: string) => void;
    disable: (extensionId: string) => void;
    getExtension: (extensionId: string) => Extension | undefined;
    getInstalled: () => Extension[];
    getEnabled: () => Extension[];
    getByCategory: (category: ExtensionCategory) => Extension[];
    searchMarketplace: (query: string) => Promise<Extension[]>;
    loadMarketplace: () => Promise<void>;
    registerExtension: (extension: Extension) => void;
}

// =============================================================================
// EXTENSIONS STORE
// =============================================================================

export const useExtensions = create<ExtensionsState>((set, get) => ({
    extensions: new Map(),
    marketplace: [],
    isLoading: false,

    install: async (extensionId: string) => {
        const extension = get().marketplace.find(e => e.id === extensionId);
        if (!extension) return;

        // Simulate install
        await new Promise(resolve => setTimeout(resolve, 500));

        set(state => {
            const extensions = new Map(state.extensions);
            extensions.set(extensionId, { ...extension, installed: true, enabled: true });
            return { extensions };
        });

        console.log(`[Extensions] Installed: ${extension.displayName}`);
    },

    uninstall: async (extensionId: string) => {
        await new Promise(resolve => setTimeout(resolve, 200));

        set(state => {
            const extensions = new Map(state.extensions);
            extensions.delete(extensionId);
            return { extensions };
        });

        console.log(`[Extensions] Uninstalled: ${extensionId}`);
    },

    enable: (extensionId: string) => {
        set(state => {
            const extensions = new Map(state.extensions);
            const ext = extensions.get(extensionId);
            if (ext) {
                extensions.set(extensionId, { ...ext, enabled: true });
            }
            return { extensions };
        });
    },

    disable: (extensionId: string) => {
        set(state => {
            const extensions = new Map(state.extensions);
            const ext = extensions.get(extensionId);
            if (ext) {
                extensions.set(extensionId, { ...ext, enabled: false });
            }
            return { extensions };
        });
    },

    getExtension: (extensionId: string) => {
        return get().extensions.get(extensionId);
    },

    getInstalled: () => {
        return Array.from(get().extensions.values()).filter(e => e.installed);
    },

    getEnabled: () => {
        return Array.from(get().extensions.values()).filter(e => e.installed && e.enabled);
    },

    getByCategory: (category: ExtensionCategory) => {
        return Array.from(get().extensions.values()).filter(e =>
            e.installed && e.categories.includes(category)
        );
    },

    searchMarketplace: async (query: string) => {
        // Mock search
        const { marketplace } = get();
        const lowerQuery = query.toLowerCase();
        return marketplace.filter(e =>
            e.name.toLowerCase().includes(lowerQuery) ||
            e.displayName.toLowerCase().includes(lowerQuery) ||
            e.description.toLowerCase().includes(lowerQuery)
        );
    },

    loadMarketplace: async () => {
        set({ isLoading: true });

        // Mock marketplace data
        const mockExtensions: Extension[] = [
            {
                id: 'sprintloop.ai-autocomplete',
                name: 'ai-autocomplete',
                displayName: 'AI Autocomplete',
                description: 'Intelligent code completions powered by AI',
                version: '1.0.0',
                author: 'SprintLoop',
                icon: '🤖',
                categories: ['ai'],
                installed: false,
                enabled: false,
                activationEvents: ['onStartupFinished'],
            },
            {
                id: 'sprintloop.git-lens',
                name: 'git-lens',
                displayName: 'GitLens',
                description: 'Supercharge Git with rich annotations',
                version: '2.1.0',
                author: 'SprintLoop',
                icon: '🔍',
                categories: ['other'],
                installed: false,
                enabled: false,
                activationEvents: ['onStartupFinished'],
            },
            {
                id: 'sprintloop.prettier',
                name: 'prettier',
                displayName: 'Prettier',
                description: 'Code formatter for multiple languages',
                version: '3.0.0',
                author: 'SprintLoop',
                icon: '✨',
                categories: ['formatters'],
                installed: false,
                enabled: false,
                activationEvents: ['onLanguage:javascript', 'onLanguage:typescript'],
            },
            {
                id: 'sprintloop.eslint',
                name: 'eslint',
                displayName: 'ESLint',
                description: 'Integrates ESLint into the editor',
                version: '2.4.0',
                author: 'SprintLoop',
                icon: '⚠️',
                categories: ['linters'],
                installed: false,
                enabled: false,
                activationEvents: ['onLanguage:javascript', 'onLanguage:typescript'],
            },
            {
                id: 'sprintloop.python',
                name: 'python',
                displayName: 'Python',
                description: 'Python language support with IntelliSense',
                version: '1.8.0',
                author: 'SprintLoop',
                icon: '🐍',
                categories: ['languages'],
                installed: false,
                enabled: false,
                activationEvents: ['onLanguage:python'],
                contributes: {
                    languages: [{ id: 'python', extensions: ['.py'], aliases: ['Python'] }],
                },
            },
            {
                id: 'sprintloop.material-theme',
                name: 'material-theme',
                displayName: 'Material Theme',
                description: 'Material Design inspired theme',
                version: '4.0.0',
                author: 'SprintLoop',
                icon: '🎨',
                categories: ['themes'],
                installed: false,
                enabled: false,
                activationEvents: [],
                contributes: {
                    themes: [
                        { id: 'material-dark', label: 'Material Dark', uiTheme: 'vs-dark', path: '' },
                        { id: 'material-light', label: 'Material Light', uiTheme: 'vs-light', path: '' },
                    ],
                },
            },
        ];

        set({ marketplace: mockExtensions, isLoading: false });
    },

    registerExtension: (extension: Extension) => {
        set(state => {
            const extensions = new Map(state.extensions);
            extensions.set(extension.id, extension);
            return { extensions };
        });
    },
}));

// Initialize marketplace on first access
useExtensions.getState().loadMarketplace();
