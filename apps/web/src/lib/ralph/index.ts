/**
 * Ralph Wiggum - Agentic Plugin System
 * Intelligent plugin management and orchestration for AI agents
 */

import { create } from 'zustand';

// =============================================================================
// PLUGIN TYPES
// =============================================================================

export interface RalphPlugin {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    icon?: string;
    status: 'installed' | 'enabled' | 'disabled' | 'updating' | 'error';
    category: PluginCategory;
    capabilities: PluginCapability[];
    config: Record<string, unknown>;
    hooks: PluginHooks;
    createdAt: number;
    updatedAt: number;
}

export type PluginCategory =
    | 'ai-model'
    | 'code-tool'
    | 'browser'
    | 'productivity'
    | 'integration'
    | 'ui-extension'
    | 'language'
    | 'testing'
    | 'devops'
    | 'security';

export type PluginCapability =
    | 'code-completion'
    | 'code-review'
    | 'code-generation'
    | 'refactoring'
    | 'testing'
    | 'debugging'
    | 'documentation'
    | 'translation'
    | 'browser-control'
    | 'file-access'
    | 'terminal-access'
    | 'api-access'
    | 'ai-chat'
    | 'custom';

export interface PluginHooks {
    onInstall?: () => Promise<void>;
    onEnable?: () => Promise<void>;
    onDisable?: () => Promise<void>;
    onUninstall?: () => Promise<void>;
    onCommand?: (command: string, args: unknown[]) => Promise<unknown>;
    onFileChange?: (path: string, content: string) => Promise<void>;
    onAIResponse?: (response: string) => Promise<string>;
}

export interface PluginCommand {
    id: string;
    pluginId: string;
    name: string;
    description: string;
    shortcut?: string;
    handler: (args: unknown[]) => Promise<unknown>;
}

export interface PluginMarketplaceEntry {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    downloads: number;
    rating: number;
    icon?: string;
    category: PluginCategory;
    capabilities: PluginCapability[];
    price: 'free' | number;
    featured?: boolean;
}

// =============================================================================
// RALPH STORE
// =============================================================================

interface RalphState {
    plugins: Map<string, RalphPlugin>;
    commands: Map<string, PluginCommand>;
    marketplace: PluginMarketplaceEntry[];
    activePlugins: string[];

    // Plugin Management
    installPlugin: (entry: PluginMarketplaceEntry) => Promise<string>;
    uninstallPlugin: (id: string) => Promise<void>;
    enablePlugin: (id: string) => Promise<void>;
    disablePlugin: (id: string) => Promise<void>;
    updatePlugin: (id: string) => Promise<void>;

    // Configuration
    configurePlugin: (id: string, config: Record<string, unknown>) => void;
    getPluginConfig: (id: string) => Record<string, unknown> | null;

    // Commands
    registerCommand: (command: PluginCommand) => void;
    executeCommand: (commandId: string, args?: unknown[]) => Promise<unknown>;
    getCommands: (pluginId?: string) => PluginCommand[];

    // Marketplace
    searchMarketplace: (query: string) => PluginMarketplaceEntry[];
    getFeaturedPlugins: () => PluginMarketplaceEntry[];
    getPluginsByCategory: (category: PluginCategory) => PluginMarketplaceEntry[];

    // Helpers
    getPlugin: (id: string) => RalphPlugin | undefined;
    getActivePlugins: () => RalphPlugin[];
    getPluginsByCapability: (capability: PluginCapability) => RalphPlugin[];
}

export const useRalphStore = create<RalphState>((set, get) => ({
    plugins: new Map(),
    commands: new Map(),
    marketplace: BUILT_IN_MARKETPLACE,
    activePlugins: [],

    installPlugin: async (entry) => {
        const id = `plugin-${Date.now()}`;
        const plugin: RalphPlugin = {
            id,
            name: entry.name,
            version: entry.version,
            description: entry.description,
            author: entry.author,
            icon: entry.icon,
            status: 'installed',
            category: entry.category,
            capabilities: entry.capabilities,
            config: {},
            hooks: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        set(state => {
            const plugins = new Map(state.plugins);
            plugins.set(id, plugin);
            return { plugins };
        });

        console.log('[Ralph] Plugin installed:', entry.name);
        return id;
    },

    uninstallPlugin: async (id) => {
        const plugin = get().plugins.get(id);
        if (plugin?.hooks.onUninstall) {
            await plugin.hooks.onUninstall();
        }

        set(state => {
            const plugins = new Map(state.plugins);
            plugins.delete(id);
            const activePlugins = state.activePlugins.filter(p => p !== id);
            return { plugins, activePlugins };
        });

        console.log('[Ralph] Plugin uninstalled:', id);
    },

    enablePlugin: async (id) => {
        const plugin = get().plugins.get(id);
        if (plugin?.hooks.onEnable) {
            await plugin.hooks.onEnable();
        }

        set(state => {
            const plugins = new Map(state.plugins);
            const p = plugins.get(id);
            if (p) {
                plugins.set(id, { ...p, status: 'enabled', updatedAt: Date.now() });
            }
            return {
                plugins,
                activePlugins: [...state.activePlugins, id]
            };
        });

        console.log('[Ralph] Plugin enabled:', id);
    },

    disablePlugin: async (id) => {
        const plugin = get().plugins.get(id);
        if (plugin?.hooks.onDisable) {
            await plugin.hooks.onDisable();
        }

        set(state => {
            const plugins = new Map(state.plugins);
            const p = plugins.get(id);
            if (p) {
                plugins.set(id, { ...p, status: 'disabled', updatedAt: Date.now() });
            }
            return {
                plugins,
                activePlugins: state.activePlugins.filter(pid => pid !== id)
            };
        });

        console.log('[Ralph] Plugin disabled:', id);
    },

    updatePlugin: async (id) => {
        set(state => {
            const plugins = new Map(state.plugins);
            const p = plugins.get(id);
            if (p) {
                plugins.set(id, { ...p, status: 'updating' });
            }
            return { plugins };
        });

        // Simulate update
        await new Promise(r => setTimeout(r, 2000));

        set(state => {
            const plugins = new Map(state.plugins);
            const p = plugins.get(id);
            if (p) {
                plugins.set(id, {
                    ...p,
                    status: 'enabled',
                    version: incrementVersion(p.version),
                    updatedAt: Date.now(),
                });
            }
            return { plugins };
        });

        console.log('[Ralph] Plugin updated:', id);
    },

    configurePlugin: (id, config) => {
        set(state => {
            const plugins = new Map(state.plugins);
            const p = plugins.get(id);
            if (p) {
                plugins.set(id, { ...p, config: { ...p.config, ...config }, updatedAt: Date.now() });
            }
            return { plugins };
        });
    },

    getPluginConfig: (id) => {
        return get().plugins.get(id)?.config || null;
    },

    registerCommand: (command) => {
        set(state => {
            const commands = new Map(state.commands);
            commands.set(command.id, command);
            return { commands };
        });
    },

    executeCommand: async (commandId, args = []) => {
        const command = get().commands.get(commandId);
        if (!command) throw new Error(`Command not found: ${commandId}`);

        console.log('[Ralph] Executing command:', commandId);
        return command.handler(args);
    },

    getCommands: (pluginId) => {
        const commands = Array.from(get().commands.values());
        return pluginId ? commands.filter(c => c.pluginId === pluginId) : commands;
    },

    searchMarketplace: (query) => {
        const lower = query.toLowerCase();
        return get().marketplace.filter(p =>
            p.name.toLowerCase().includes(lower) ||
            p.description.toLowerCase().includes(lower) ||
            p.author.toLowerCase().includes(lower)
        );
    },

    getFeaturedPlugins: () => {
        return get().marketplace.filter(p => p.featured);
    },

    getPluginsByCategory: (category) => {
        return get().marketplace.filter(p => p.category === category);
    },

    getPlugin: (id) => get().plugins.get(id),

    getActivePlugins: () => {
        const { plugins, activePlugins } = get();
        return activePlugins.map(id => plugins.get(id)!).filter(Boolean);
    },

    getPluginsByCapability: (capability) => {
        return Array.from(get().plugins.values())
            .filter(p => p.capabilities.includes(capability) && p.status === 'enabled');
    },
}));

// Helper
function incrementVersion(version: string): string {
    const parts = version.split('.');
    parts[2] = String(parseInt(parts[2] || '0') + 1);
    return parts.join('.');
}

// =============================================================================
// BUILT-IN MARKETPLACE
// =============================================================================

const BUILT_IN_MARKETPLACE: PluginMarketplaceEntry[] = [
    {
        id: 'claude-ai',
        name: 'Claude AI Integration',
        version: '2.1.0',
        description: 'Full Claude 3.5 Sonnet integration with computer use capabilities',
        author: 'Anthropic',
        downloads: 245000,
        rating: 4.9,
        icon: '🤖',
        category: 'ai-model',
        capabilities: ['code-completion', 'code-generation', 'code-review', 'ai-chat', 'browser-control'],
        price: 'free',
        featured: true,
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o Integration',
        version: '1.5.0',
        description: 'OpenAI GPT-4o with vision and advanced reasoning',
        author: 'OpenAI',
        downloads: 312000,
        rating: 4.8,
        icon: '🧠',
        category: 'ai-model',
        capabilities: ['code-completion', 'code-generation', 'code-review', 'ai-chat'],
        price: 'free',
        featured: true,
    },
    {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        version: '1.2.0',
        description: 'Google Gemini 2.0 Pro with multimodal capabilities',
        author: 'Google DeepMind',
        downloads: 189000,
        rating: 4.7,
        icon: '💎',
        category: 'ai-model',
        capabilities: ['code-completion', 'code-generation', 'ai-chat'],
        price: 'free',
        featured: true,
    },
    {
        id: 'cline-agent',
        name: 'Cline Agentic Coding',
        version: '3.0.0',
        description: 'Autonomous coding agent with full file access and terminal control',
        author: 'Cline Team',
        downloads: 156000,
        rating: 4.8,
        icon: '🔮',
        category: 'code-tool',
        capabilities: ['code-generation', 'file-access', 'terminal-access', 'refactoring'],
        price: 'free',
        featured: true,
    },
    {
        id: 'continue-dev',
        name: 'Continue',
        version: '2.5.0',
        description: 'Open-source AI code assistant with deep IDE integration',
        author: 'Continue',
        downloads: 98000,
        rating: 4.6,
        icon: '▶️',
        category: 'code-tool',
        capabilities: ['code-completion', 'code-generation', 'documentation'],
        price: 'free',
    },
    {
        id: 'cursor-tab',
        name: 'Cursor Tab Completions',
        version: '1.8.0',
        description: 'Multi-line intelligent code completions inspired by Cursor',
        author: 'SprintLoop',
        downloads: 78000,
        rating: 4.7,
        icon: '⌨️',
        category: 'code-tool',
        capabilities: ['code-completion'],
        price: 'free',
    },
    {
        id: 'browser-pilot',
        name: 'Browser Pilot',
        version: '1.0.0',
        description: 'Full browser automation for agentic web tasks',
        author: 'SprintLoop',
        downloads: 45000,
        rating: 4.5,
        icon: '🌐',
        category: 'browser',
        capabilities: ['browser-control'],
        price: 'free',
    },
    {
        id: 'github-copilot',
        name: 'GitHub Copilot Adapter',
        version: '1.3.0',
        description: 'Use GitHub Copilot completions within SprintLoop',
        author: 'GitHub',
        downloads: 234000,
        rating: 4.6,
        icon: '🐙',
        category: 'code-tool',
        capabilities: ['code-completion'],
        price: 10,
    },
    {
        id: 'supermaven',
        name: 'Supermaven',
        version: '2.0.0',
        description: 'Ultra-fast AI code completions with 1M token context',
        author: 'Supermaven',
        downloads: 67000,
        rating: 4.7,
        icon: '⚡',
        category: 'code-tool',
        capabilities: ['code-completion'],
        price: 'free',
        featured: true,
    },
    {
        id: 'devin-agent',
        name: 'Devin-Style Agent',
        version: '0.9.0',
        description: 'Fully autonomous software development agent',
        author: 'SprintLoop Labs',
        downloads: 34000,
        rating: 4.4,
        icon: '🤖',
        category: 'code-tool',
        capabilities: ['code-generation', 'file-access', 'terminal-access', 'browser-control', 'api-access'],
        price: 'free',
    },
    {
        id: 'linear-integration',
        name: 'Linear Integration',
        version: '1.1.0',
        description: 'Connect Linear issues directly to your workflow',
        author: 'Linear',
        downloads: 56000,
        rating: 4.5,
        icon: '📋',
        category: 'integration',
        capabilities: ['api-access'],
        price: 'free',
    },
    {
        id: 'slack-notify',
        name: 'Slack Notifications',
        version: '1.0.0',
        description: 'Send notifications to Slack from your agents',
        author: 'SprintLoop',
        downloads: 43000,
        rating: 4.3,
        icon: '💬',
        category: 'integration',
        capabilities: ['api-access'],
        price: 'free',
    },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Install a plugin by marketplace ID */
export async function installPluginById(marketplaceId: string): Promise<string | null> {
    const store = useRalphStore.getState();
    const entry = store.marketplace.find(p => p.id === marketplaceId);
    if (!entry) return null;
    return store.installPlugin(entry);
}

/** Get all available AI model plugins */
export function getAIModelPlugins(): PluginMarketplaceEntry[] {
    return useRalphStore.getState().getPluginsByCategory('ai-model');
}

/** Get all code tool plugins */
export function getCodeToolPlugins(): PluginMarketplaceEntry[] {
    return useRalphStore.getState().getPluginsByCategory('code-tool');
}
