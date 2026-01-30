/**
 * Settings Service
 * 
 * IDE configuration with categories, search, and persistence.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface SettingDefinition {
    key: string;
    type: 'string' | 'number' | 'boolean' | 'enum' | 'object' | 'array';
    default: unknown;
    description: string;
    category: SettingCategory;
    enumValues?: string[];
    scope: 'user' | 'workspace' | 'language';
    tags?: string[];
    deprecated?: boolean;
    deprecationMessage?: string;
}

export type SettingCategory =
    | 'editor'
    | 'workbench'
    | 'terminal'
    | 'features'
    | 'extensions'
    | 'ai'
    | 'git'
    | 'debug'
    | 'keybindings';

export interface SettingsState {
    userSettings: Record<string, unknown>;
    workspaceSettings: Record<string, unknown>;
    definitions: SettingDefinition[];
    searchQuery: string;
    expandedCategories: Set<SettingCategory>;
    activeScope: 'user' | 'workspace';
    modifiedOnly: boolean;

    // Get/Set
    getSetting: <T>(key: string) => T;
    setSetting: (key: string, value: unknown, scope?: 'user' | 'workspace') => void;
    resetSetting: (key: string, scope?: 'user' | 'workspace') => void;
    resetCategory: (category: SettingCategory) => void;

    // Definitions
    getDefinition: (key: string) => SettingDefinition | undefined;
    getDefinitionsByCategory: (category: SettingCategory) => SettingDefinition[];
    searchDefinitions: (query: string) => SettingDefinition[];

    // UI State
    setSearchQuery: (query: string) => void;
    toggleCategory: (category: SettingCategory) => void;
    setActiveScope: (scope: 'user' | 'workspace') => void;
    setModifiedOnly: (value: boolean) => void;

    // Import/Export
    exportSettings: () => string;
    importSettings: (json: string) => void;

    // Modified tracking
    isModified: (key: string) => boolean;
    getModifiedKeys: () => string[];
}

// =============================================================================
// DEFAULT SETTINGS
// =============================================================================

const DEFAULT_DEFINITIONS: SettingDefinition[] = [
    // Editor
    { key: 'editor.fontSize', type: 'number', default: 14, description: 'Controls the font size in pixels', category: 'editor', scope: 'user' },
    { key: 'editor.fontFamily', type: 'string', default: "'Fira Code', 'Monaco', monospace", description: 'Controls the font family', category: 'editor', scope: 'user' },
    { key: 'editor.tabSize', type: 'number', default: 4, description: 'The number of spaces a tab is equivalent to', category: 'editor', scope: 'user' },
    { key: 'editor.insertSpaces', type: 'boolean', default: true, description: 'Insert spaces when pressing Tab', category: 'editor', scope: 'user' },
    { key: 'editor.wordWrap', type: 'enum', default: 'off', enumValues: ['off', 'on', 'wordWrapColumn', 'bounded'], description: 'Controls how lines should wrap', category: 'editor', scope: 'user' },
    { key: 'editor.lineNumbers', type: 'enum', default: 'on', enumValues: ['off', 'on', 'relative', 'interval'], description: 'Controls the display of line numbers', category: 'editor', scope: 'user' },
    { key: 'editor.minimap.enabled', type: 'boolean', default: true, description: 'Controls whether the minimap is shown', category: 'editor', scope: 'user' },
    { key: 'editor.minimap.side', type: 'enum', default: 'right', enumValues: ['left', 'right'], description: 'Controls the side where to render the minimap', category: 'editor', scope: 'user' },
    { key: 'editor.cursorStyle', type: 'enum', default: 'line', enumValues: ['block', 'block-outline', 'line', 'line-thin', 'underline', 'underline-thin'], description: 'Controls the cursor style', category: 'editor', scope: 'user' },
    { key: 'editor.cursorBlinking', type: 'enum', default: 'blink', enumValues: ['blink', 'smooth', 'phase', 'expand', 'solid'], description: 'Control the cursor animation style', category: 'editor', scope: 'user' },
    { key: 'editor.autoClosingBrackets', type: 'enum', default: 'always', enumValues: ['always', 'languageDefined', 'beforeWhitespace', 'never'], description: 'Controls whether the editor should automatically close brackets', category: 'editor', scope: 'user' },
    { key: 'editor.formatOnSave', type: 'boolean', default: false, description: 'Format a file on save', category: 'editor', scope: 'user' },
    { key: 'editor.formatOnPaste', type: 'boolean', default: false, description: 'Format pasted content', category: 'editor', scope: 'user' },
    { key: 'editor.autoSave', type: 'enum', default: 'off', enumValues: ['off', 'afterDelay', 'onFocusChange', 'onWindowChange'], description: 'Controls auto save of dirty editors', category: 'editor', scope: 'user' },

    // Workbench
    { key: 'workbench.colorTheme', type: 'string', default: 'SprintLoop Dark', description: 'Specifies the color theme', category: 'workbench', scope: 'user' },
    { key: 'workbench.iconTheme', type: 'string', default: 'material-icons', description: 'Specifies the file icon theme', category: 'workbench', scope: 'user' },
    { key: 'workbench.sideBar.location', type: 'enum', default: 'left', enumValues: ['left', 'right'], description: 'Controls the location of the sidebar', category: 'workbench', scope: 'user' },
    { key: 'workbench.activityBar.visible', type: 'boolean', default: true, description: 'Controls the visibility of the activity bar', category: 'workbench', scope: 'user' },
    { key: 'workbench.statusBar.visible', type: 'boolean', default: true, description: 'Controls the visibility of the status bar', category: 'workbench', scope: 'user' },
    { key: 'workbench.panel.defaultLocation', type: 'enum', default: 'bottom', enumValues: ['bottom', 'right', 'left'], description: 'Controls the default location of the panel', category: 'workbench', scope: 'user' },

    // Terminal
    { key: 'terminal.integrated.fontSize', type: 'number', default: 13, description: 'Controls the font size of the terminal', category: 'terminal', scope: 'user' },
    { key: 'terminal.integrated.fontFamily', type: 'string', default: "'Fira Code', monospace", description: 'Controls the font family of the terminal', category: 'terminal', scope: 'user' },
    { key: 'terminal.integrated.shell', type: 'string', default: '/bin/zsh', description: 'The path of the shell that the terminal uses', category: 'terminal', scope: 'user' },
    { key: 'terminal.integrated.cursorStyle', type: 'enum', default: 'block', enumValues: ['block', 'underline', 'line'], description: 'Controls the style of the terminal cursor', category: 'terminal', scope: 'user' },
    { key: 'terminal.integrated.copyOnSelection', type: 'boolean', default: false, description: 'Copy text to clipboard on selection', category: 'terminal', scope: 'user' },

    // AI Features
    { key: 'ai.enabled', type: 'boolean', default: true, description: 'Enable AI-powered features', category: 'ai', scope: 'user' },
    { key: 'ai.provider', type: 'enum', default: 'gemini', enumValues: ['gemini', 'openai', 'anthropic', 'ollama'], description: 'AI provider to use', category: 'ai', scope: 'user' },
    { key: 'ai.inlineCompletions', type: 'boolean', default: true, description: 'Show AI-powered inline completions', category: 'ai', scope: 'user' },
    { key: 'ai.autoComplete.enabled', type: 'boolean', default: true, description: 'Enable automatic AI suggestions', category: 'ai', scope: 'user' },
    { key: 'ai.autoComplete.delay', type: 'number', default: 300, description: 'Delay in ms before showing suggestions', category: 'ai', scope: 'user' },
    { key: 'ai.codeActions.enabled', type: 'boolean', default: true, description: 'Show AI-powered code actions', category: 'ai', scope: 'user' },
    { key: 'ai.chat.contextSize', type: 'number', default: 8000, description: 'Maximum context size for AI chat', category: 'ai', scope: 'user' },

    // Git
    { key: 'git.enabled', type: 'boolean', default: true, description: 'Enable Git features', category: 'git', scope: 'user' },
    { key: 'git.autofetch', type: 'boolean', default: true, description: 'Automatically fetch from remote', category: 'git', scope: 'user' },
    { key: 'git.confirmSync', type: 'boolean', default: true, description: 'Confirm before synchronizing git repos', category: 'git', scope: 'user' },
    { key: 'git.enableSmartCommit', type: 'boolean', default: true, description: 'Commit all changes when there are no staged changes', category: 'git', scope: 'user' },
    { key: 'git.showPushSuccessNotification', type: 'boolean', default: true, description: 'Show notification after successful push', category: 'git', scope: 'user' },

    // Debug
    { key: 'debug.console.fontSize', type: 'number', default: 13, description: 'Controls the font size in the debug console', category: 'debug', scope: 'user' },
    { key: 'debug.console.wordWrap', type: 'boolean', default: true, description: 'Controls word wrap in the debug console', category: 'debug', scope: 'user' },
    { key: 'debug.toolBarLocation', type: 'enum', default: 'floating', enumValues: ['floating', 'docked', 'hidden'], description: 'Controls the location of the debug toolbar', category: 'debug', scope: 'user' },
    { key: 'debug.openDebug', type: 'enum', default: 'openOnFirstSessionStart', enumValues: ['neverOpen', 'openOnSessionStart', 'openOnFirstSessionStart', 'openOnDebugBreak'], description: 'Controls when the debug view should open', category: 'debug', scope: 'user' },
];

// =============================================================================
// SETTINGS STORE
// =============================================================================

export const useSettingsService = create<SettingsState>()(
    persist(
        (set, get) => ({
            userSettings: {},
            workspaceSettings: {},
            definitions: DEFAULT_DEFINITIONS,
            searchQuery: '',
            expandedCategories: new Set<SettingCategory>(['editor', 'ai']),
            activeScope: 'user',
            modifiedOnly: false,

            getSetting: <T>(key: string): T => {
                const { userSettings, workspaceSettings, definitions } = get();

                // Workspace settings override user settings
                if (key in workspaceSettings) {
                    return workspaceSettings[key] as T;
                }
                if (key in userSettings) {
                    return userSettings[key] as T;
                }

                const def = definitions.find(d => d.key === key);
                return (def?.default ?? undefined) as T;
            },

            setSetting: (key, value, scope = 'user') => {
                set(state => {
                    const settingsKey = scope === 'user' ? 'userSettings' : 'workspaceSettings';
                    return {
                        [settingsKey]: {
                            ...state[settingsKey],
                            [key]: value,
                        },
                    };
                });
            },

            resetSetting: (key, scope = 'user') => {
                set(state => {
                    const settingsKey = scope === 'user' ? 'userSettings' : 'workspaceSettings';
                    const newSettings = { ...state[settingsKey] };
                    delete newSettings[key];
                    return { [settingsKey]: newSettings };
                });
            },

            resetCategory: (category) => {
                const { definitions } = get();
                const keysToReset = definitions
                    .filter(d => d.category === category)
                    .map(d => d.key);

                set(state => {
                    const newUserSettings = { ...state.userSettings };
                    const newWorkspaceSettings = { ...state.workspaceSettings };

                    for (const key of keysToReset) {
                        delete newUserSettings[key];
                        delete newWorkspaceSettings[key];
                    }

                    return {
                        userSettings: newUserSettings,
                        workspaceSettings: newWorkspaceSettings,
                    };
                });
            },

            getDefinition: (key) => {
                return get().definitions.find(d => d.key === key);
            },

            getDefinitionsByCategory: (category) => {
                return get().definitions.filter(d => d.category === category);
            },

            searchDefinitions: (query) => {
                const lowerQuery = query.toLowerCase();
                return get().definitions.filter(d =>
                    d.key.toLowerCase().includes(lowerQuery) ||
                    d.description.toLowerCase().includes(lowerQuery) ||
                    d.tags?.some(t => t.toLowerCase().includes(lowerQuery))
                );
            },

            setSearchQuery: (query) => {
                set({ searchQuery: query });
            },

            toggleCategory: (category) => {
                set(state => {
                    const newExpanded = new Set(state.expandedCategories);
                    if (newExpanded.has(category)) {
                        newExpanded.delete(category);
                    } else {
                        newExpanded.add(category);
                    }
                    return { expandedCategories: newExpanded };
                });
            },

            setActiveScope: (scope) => {
                set({ activeScope: scope });
            },

            setModifiedOnly: (value) => {
                set({ modifiedOnly: value });
            },

            exportSettings: () => {
                const { userSettings, workspaceSettings } = get();
                return JSON.stringify({ user: userSettings, workspace: workspaceSettings }, null, 2);
            },

            importSettings: (json) => {
                try {
                    const parsed = JSON.parse(json);
                    set({
                        userSettings: parsed.user || {},
                        workspaceSettings: parsed.workspace || {},
                    });
                } catch (error) {
                    console.error('[Settings] Failed to import settings:', error);
                }
            },

            isModified: (key) => {
                const { userSettings, workspaceSettings } = get();
                return key in userSettings || key in workspaceSettings;
            },

            getModifiedKeys: () => {
                const { userSettings, workspaceSettings } = get();
                return [...new Set([...Object.keys(userSettings), ...Object.keys(workspaceSettings)])];
            },
        }),
        {
            name: 'sprintloop-settings',
            partialize: (state) => ({
                userSettings: state.userSettings,
                workspaceSettings: state.workspaceSettings,
            }),
        }
    )
);

// =============================================================================
// CATEGORY INFO
// =============================================================================

export const CATEGORY_INFO: Record<SettingCategory, { label: string; icon: string; description: string }> = {
    editor: { label: 'Editor', icon: '📝', description: 'Settings related to the code editor' },
    workbench: { label: 'Workbench', icon: '🖥️', description: 'Appearance and window settings' },
    terminal: { label: 'Terminal', icon: '⬛', description: 'Integrated terminal settings' },
    features: { label: 'Features', icon: '⚡', description: 'Feature toggles and preferences' },
    extensions: { label: 'Extensions', icon: '🧩', description: 'Extension settings' },
    ai: { label: 'AI', icon: '🤖', description: 'AI-powered features configuration' },
    git: { label: 'Git', icon: '🌿', description: 'Version control settings' },
    debug: { label: 'Debug', icon: '🐛', description: 'Debugging configuration' },
    keybindings: { label: 'Keybindings', icon: '⌨️', description: 'Keyboard shortcuts' },
};
