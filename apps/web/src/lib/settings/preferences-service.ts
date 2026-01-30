/**
 * Workspace Preferences Service
 * 
 * Extended workspace settings with user preferences and customization.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export type SettingType = 'string' | 'number' | 'boolean' | 'select' | 'color' | 'keybinding' | 'array';
export type SettingCategory = 'editor' | 'workbench' | 'terminal' | 'files' | 'search' | 'git' | 'extensions' | 'ai';

export interface SettingDefinition {
    key: string;
    type: SettingType;
    category: SettingCategory;
    label: string;
    description: string;
    default: unknown;
    options?: Array<{ value: string | number; label: string }>;
    min?: number;
    max?: number;
    scope?: 'user' | 'workspace' | 'folder';
    tags?: string[];
}

export interface PreferencesState {
    settings: Record<string, unknown>;
    definitions: SettingDefinition[];
    searchQuery: string;
    activeCategory: SettingCategory | null;
    showModified: boolean;

    // Get/Set
    getSetting: <T>(key: string) => T;
    setSetting: (key: string, value: unknown) => void;
    resetSetting: (key: string) => void;
    resetAll: () => void;

    // Filtering
    setSearchQuery: (query: string) => void;
    setActiveCategory: (category: SettingCategory | null) => void;
    toggleShowModified: () => void;
    getFilteredSettings: () => SettingDefinition[];

    // Utilities
    isModified: (key: string) => boolean;
    getModifiedCount: () => number;
    exportSettings: () => string;
    importSettings: (json: string) => boolean;
}

// =============================================================================
// PREFERENCES DEFINITIONS
// =============================================================================

const PREFERENCE_DEFINITIONS: SettingDefinition[] = [
    // Editor
    { key: 'editor.fontSize', type: 'number', category: 'editor', label: 'Font Size', description: 'Controls the font size in pixels.', default: 14, min: 8, max: 32 },
    { key: 'editor.fontFamily', type: 'string', category: 'editor', label: 'Font Family', description: 'Controls the font family.', default: "'JetBrains Mono', 'Fira Code', monospace" },
    { key: 'editor.lineHeight', type: 'number', category: 'editor', label: 'Line Height', description: 'Controls the line height.', default: 1.5, min: 0, max: 3 },
    { key: 'editor.tabSize', type: 'number', category: 'editor', label: 'Tab Size', description: 'The number of spaces a tab equals.', default: 4, min: 1, max: 8 },
    { key: 'editor.insertSpaces', type: 'boolean', category: 'editor', label: 'Insert Spaces', description: 'Insert spaces when pressing Tab.', default: true },
    { key: 'editor.wordWrap', type: 'select', category: 'editor', label: 'Word Wrap', description: 'Controls how lines should wrap.', default: 'off', options: [{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }, { value: 'bounded', label: 'Bounded' }] },
    { key: 'editor.minimap.enabled', type: 'boolean', category: 'editor', label: 'Minimap Enabled', description: 'Controls whether the minimap is shown.', default: true },
    { key: 'editor.lineNumbers', type: 'select', category: 'editor', label: 'Line Numbers', description: 'Controls the display of line numbers.', default: 'on', options: [{ value: 'on', label: 'On' }, { value: 'off', label: 'Off' }, { value: 'relative', label: 'Relative' }] },
    { key: 'editor.cursorStyle', type: 'select', category: 'editor', label: 'Cursor Style', description: 'Controls the cursor style.', default: 'line', options: [{ value: 'line', label: 'Line' }, { value: 'block', label: 'Block' }, { value: 'underline', label: 'Underline' }] },
    { key: 'editor.autoSave', type: 'select', category: 'editor', label: 'Auto Save', description: 'Controls auto save.', default: 'off', options: [{ value: 'off', label: 'Off' }, { value: 'afterDelay', label: 'After Delay' }, { value: 'onFocusChange', label: 'On Focus Change' }] },
    { key: 'editor.formatOnSave', type: 'boolean', category: 'editor', label: 'Format On Save', description: 'Format a file on save.', default: false },
    { key: 'editor.formatOnPaste', type: 'boolean', category: 'editor', label: 'Format On Paste', description: 'Format pasted content.', default: false },
    // Workbench
    { key: 'workbench.colorTheme', type: 'select', category: 'workbench', label: 'Color Theme', description: 'Specifies the color theme.', default: 'dark-obsidian', options: [{ value: 'dark-obsidian', label: 'Dark Obsidian' }, { value: 'light-breeze', label: 'Light Breeze' }, { value: 'midnight-blue', label: 'Midnight Blue' }] },
    { key: 'workbench.sideBar.location', type: 'select', category: 'workbench', label: 'Side Bar Location', description: 'Controls side bar location.', default: 'left', options: [{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
    { key: 'workbench.activityBar.visible', type: 'boolean', category: 'workbench', label: 'Activity Bar Visible', description: 'Controls activity bar visibility.', default: true },
    { key: 'workbench.statusBar.visible', type: 'boolean', category: 'workbench', label: 'Status Bar Visible', description: 'Controls status bar visibility.', default: true },
    // Terminal
    { key: 'terminal.integrated.fontSize', type: 'number', category: 'terminal', label: 'Font Size', description: 'Terminal font size.', default: 13, min: 8, max: 24 },
    { key: 'terminal.integrated.fontFamily', type: 'string', category: 'terminal', label: 'Font Family', description: 'Terminal font family.', default: "'JetBrains Mono', monospace" },
    { key: 'terminal.integrated.cursorStyle', type: 'select', category: 'terminal', label: 'Cursor Style', description: 'Terminal cursor style.', default: 'block', options: [{ value: 'block', label: 'Block' }, { value: 'underline', label: 'Underline' }, { value: 'line', label: 'Line' }] },
    { key: 'terminal.integrated.scrollback', type: 'number', category: 'terminal', label: 'Scrollback', description: 'Maximum buffer lines.', default: 1000, min: 100, max: 100000 },
    // Files
    { key: 'files.autoSaveDelay', type: 'number', category: 'files', label: 'Auto Save Delay', description: 'Delay in ms for auto save.', default: 1000, min: 100, max: 10000 },
    { key: 'files.encoding', type: 'select', category: 'files', label: 'Encoding', description: 'Default encoding.', default: 'utf8', options: [{ value: 'utf8', label: 'UTF-8' }, { value: 'utf16le', label: 'UTF-16 LE' }] },
    { key: 'files.eol', type: 'select', category: 'files', label: 'End of Line', description: 'Default EOL character.', default: 'auto', options: [{ value: 'auto', label: 'Auto' }, { value: '\n', label: 'LF' }, { value: '\r\n', label: 'CRLF' }] },
    // Search
    { key: 'search.caseSensitive', type: 'boolean', category: 'search', label: 'Case Sensitive', description: 'Search case sensitively.', default: false },
    { key: 'search.useGlobalIgnoreFiles', type: 'boolean', category: 'search', label: 'Use Global Ignore Files', description: 'Use global .gitignore.', default: true },
    // Git
    { key: 'git.enabled', type: 'boolean', category: 'git', label: 'Enabled', description: 'Whether git is enabled.', default: true },
    { key: 'git.autofetch', type: 'boolean', category: 'git', label: 'Auto Fetch', description: 'Automatically fetch from remotes.', default: true },
    { key: 'git.confirmSync', type: 'boolean', category: 'git', label: 'Confirm Sync', description: 'Confirm before syncing.', default: true },
    // AI
    { key: 'ai.enabled', type: 'boolean', category: 'ai', label: 'AI Features Enabled', description: 'Enable AI-powered features.', default: true },
    { key: 'ai.model', type: 'select', category: 'ai', label: 'AI Model', description: 'AI model to use.', default: 'gemini-2.0-flash', options: [{ value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' }, { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }, { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' }] },
    { key: 'ai.inlineSuggestions', type: 'boolean', category: 'ai', label: 'Inline Suggestions', description: 'Show AI suggestions inline.', default: true },
    { key: 'ai.autoComplete', type: 'boolean', category: 'ai', label: 'Auto Complete', description: 'AI-powered auto-completion.', default: true },
];

// =============================================================================
// PREFERENCES STORE
// =============================================================================

export const usePreferencesService = create<PreferencesState>()(
    persist(
        (set, get) => ({
            settings: {},
            definitions: PREFERENCE_DEFINITIONS,
            searchQuery: '',
            activeCategory: null,
            showModified: false,

            getSetting: <T,>(key: string): T => {
                const value = get().settings[key];
                if (value !== undefined) return value as T;
                const def = get().definitions.find(d => d.key === key);
                return (def?.default as T) ?? (undefined as T);
            },

            setSetting: (key, value) => {
                set(state => ({ settings: { ...state.settings, [key]: value } }));
            },

            resetSetting: (key) => {
                set(state => {
                    const newSettings = { ...state.settings };
                    delete newSettings[key];
                    return { settings: newSettings };
                });
            },

            resetAll: () => set({ settings: {} }),

            setSearchQuery: (query) => set({ searchQuery: query }),

            setActiveCategory: (category) => set({ activeCategory: category }),

            toggleShowModified: () => set(state => ({ showModified: !state.showModified })),

            getFilteredSettings: () => {
                const { definitions, searchQuery, activeCategory, showModified, settings } = get();
                let filtered = [...definitions];

                if (activeCategory) {
                    filtered = filtered.filter(d => d.category === activeCategory);
                }

                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    filtered = filtered.filter(d =>
                        d.key.toLowerCase().includes(query) ||
                        d.label.toLowerCase().includes(query) ||
                        d.description.toLowerCase().includes(query)
                    );
                }

                if (showModified) {
                    filtered = filtered.filter(d => settings[d.key] !== undefined && settings[d.key] !== d.default);
                }

                return filtered;
            },

            isModified: (key) => {
                const { settings, definitions } = get();
                const def = definitions.find(d => d.key === key);
                return settings[key] !== undefined && settings[key] !== def?.default;
            },

            getModifiedCount: () => {
                const { settings, definitions } = get();
                return definitions.filter(d => settings[d.key] !== undefined && settings[d.key] !== d.default).length;
            },

            exportSettings: () => JSON.stringify(get().settings, null, 2),

            importSettings: (json) => {
                try {
                    const imported = JSON.parse(json);
                    set({ settings: imported });
                    return true;
                } catch {
                    return false;
                }
            },
        }),
        { name: 'sprintloop-preferences' }
    )
);

// =============================================================================
// UTILITIES
// =============================================================================

export function getCategoryIcon(category: SettingCategory): string {
    const icons: Record<SettingCategory, string> = {
        editor: '📝', workbench: '🪟', terminal: '💻', files: '📁',
        search: '🔍', git: '🔀', extensions: '🧩', ai: '🤖',
    };
    return icons[category];
}

export function getCategoryLabel(category: SettingCategory): string {
    const labels: Record<SettingCategory, string> = {
        editor: 'Editor', workbench: 'Workbench', terminal: 'Terminal', files: 'Files',
        search: 'Search', git: 'Git', extensions: 'Extensions', ai: 'AI',
    };
    return labels[category];
}
