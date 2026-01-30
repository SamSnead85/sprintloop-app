/**
 * Settings System
 * 
 * IDE settings with persistence and schema validation.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface EditorSettings {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
    tabSize: number;
    insertSpaces: boolean;
    wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
    wordWrapColumn: number;
    minimap: boolean;
    lineNumbers: 'on' | 'off' | 'relative';
    renderWhitespace: 'none' | 'boundary' | 'selection' | 'all';
    cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
    cursorStyle: 'line' | 'block' | 'underline';
    bracketPairColorization: boolean;
    autoClosingBrackets: boolean;
    autoClosingQuotes: boolean;
    formatOnSave: boolean;
    formatOnPaste: boolean;
}

export interface AISettings {
    provider: 'gemini' | 'openai' | 'anthropic' | 'ollama';
    model: string;
    apiKey: string;
    ollamaHost: string;
    inlineCompletions: boolean;
    completionDelay: number;
    maxTokens: number;
    temperature: number;
    streamResponses: boolean;
}

export interface TerminalSettings {
    fontSize: number;
    fontFamily: string;
    shell: string;
    cursorBlink: boolean;
    copyOnSelection: boolean;
    scrollback: number;
}

export interface AppearanceSettings {
    theme: string;
    iconTheme: string;
    sidebarPosition: 'left' | 'right';
    activityBarVisible: boolean;
    statusBarVisible: boolean;
    tabsVisible: boolean;
    breadcrumbsVisible: boolean;
}

export interface KeybindingSettings {
    scheme: 'default' | 'vim' | 'emacs';
    customBindings: Record<string, string>;
}

export interface Settings {
    editor: EditorSettings;
    ai: AISettings;
    terminal: TerminalSettings;
    appearance: AppearanceSettings;
    keybindings: KeybindingSettings;
}

export interface SettingsState extends Settings {
    // Actions
    updateEditor: (settings: Partial<EditorSettings>) => void;
    updateAI: (settings: Partial<AISettings>) => void;
    updateTerminal: (settings: Partial<TerminalSettings>) => void;
    updateAppearance: (settings: Partial<AppearanceSettings>) => void;
    updateKeybindings: (settings: Partial<KeybindingSettings>) => void;
    resetToDefaults: () => void;
    exportSettings: () => string;
    importSettings: (json: string) => boolean;
}

// =============================================================================
// DEFAULTS
// =============================================================================

const DEFAULT_EDITOR: EditorSettings = {
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    lineHeight: 1.6,
    tabSize: 4,
    insertSpaces: true,
    wordWrap: 'off',
    wordWrapColumn: 80,
    minimap: true,
    lineNumbers: 'on',
    renderWhitespace: 'selection',
    cursorBlinking: 'blink',
    cursorStyle: 'line',
    bracketPairColorization: true,
    autoClosingBrackets: true,
    autoClosingQuotes: true,
    formatOnSave: true,
    formatOnPaste: false,
};

const DEFAULT_AI: AISettings = {
    provider: 'gemini',
    model: 'gemini-2.0-flash',
    apiKey: '',
    ollamaHost: 'http://localhost:11434',
    inlineCompletions: true,
    completionDelay: 300,
    maxTokens: 4096,
    temperature: 0.7,
    streamResponses: true,
};

const DEFAULT_TERMINAL: TerminalSettings = {
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    shell: '/bin/zsh',
    cursorBlink: true,
    copyOnSelection: true,
    scrollback: 1000,
};

const DEFAULT_APPEARANCE: AppearanceSettings = {
    theme: 'dark',
    iconTheme: 'default',
    sidebarPosition: 'left',
    activityBarVisible: true,
    statusBarVisible: true,
    tabsVisible: true,
    breadcrumbsVisible: true,
};

const DEFAULT_KEYBINDINGS: KeybindingSettings = {
    scheme: 'default',
    customBindings: {},
};

const DEFAULT_SETTINGS: Settings = {
    editor: DEFAULT_EDITOR,
    ai: DEFAULT_AI,
    terminal: DEFAULT_TERMINAL,
    appearance: DEFAULT_APPEARANCE,
    keybindings: DEFAULT_KEYBINDINGS,
};

// =============================================================================
// SETTINGS STORE
// =============================================================================

export const useSettings = create<SettingsState>()(
    persist(
        (set, get) => ({
            ...DEFAULT_SETTINGS,

            updateEditor: (settings) => set(state => ({
                editor: { ...state.editor, ...settings },
            })),

            updateAI: (settings) => set(state => ({
                ai: { ...state.ai, ...settings },
            })),

            updateTerminal: (settings) => set(state => ({
                terminal: { ...state.terminal, ...settings },
            })),

            updateAppearance: (settings) => set(state => ({
                appearance: { ...state.appearance, ...settings },
            })),

            updateKeybindings: (settings) => set(state => ({
                keybindings: { ...state.keybindings, ...settings },
            })),

            resetToDefaults: () => set(DEFAULT_SETTINGS),

            exportSettings: () => {
                const { editor, ai, terminal, appearance, keybindings } = get();
                return JSON.stringify({ editor, ai, terminal, appearance, keybindings }, null, 2);
            },

            importSettings: (json) => {
                try {
                    const imported = JSON.parse(json) as Partial<Settings>;
                    set(state => ({
                        editor: { ...state.editor, ...imported.editor },
                        ai: { ...state.ai, ...imported.ai },
                        terminal: { ...state.terminal, ...imported.terminal },
                        appearance: { ...state.appearance, ...imported.appearance },
                        keybindings: { ...state.keybindings, ...imported.keybindings },
                    }));
                    return true;
                } catch {
                    return false;
                }
            },
        }),
        {
            name: 'sprintloop-settings',
        }
    )
);

// =============================================================================
// SETTINGS SCHEMA (for UI generation)
// =============================================================================

export interface SettingSchema {
    key: string;
    label: string;
    description?: string;
    type: 'string' | 'number' | 'boolean' | 'select';
    options?: { value: string | number; label: string }[];
    min?: number;
    max?: number;
    step?: number;
}

export const EDITOR_SCHEMA: SettingSchema[] = [
    { key: 'fontSize', label: 'Font Size', type: 'number', min: 8, max: 32, step: 1 },
    { key: 'fontFamily', label: 'Font Family', type: 'string' },
    { key: 'lineHeight', label: 'Line Height', type: 'number', min: 1, max: 3, step: 0.1 },
    { key: 'tabSize', label: 'Tab Size', type: 'number', min: 2, max: 8, step: 1 },
    { key: 'insertSpaces', label: 'Insert Spaces', type: 'boolean' },
    {
        key: 'wordWrap',
        label: 'Word Wrap',
        type: 'select',
        options: [
            { value: 'off', label: 'Off' },
            { value: 'on', label: 'On' },
            { value: 'wordWrapColumn', label: 'At Column' },
            { value: 'bounded', label: 'Bounded' },
        ],
    },
    { key: 'minimap', label: 'Minimap', type: 'boolean' },
    {
        key: 'lineNumbers',
        label: 'Line Numbers',
        type: 'select',
        options: [
            { value: 'on', label: 'On' },
            { value: 'off', label: 'Off' },
            { value: 'relative', label: 'Relative' },
        ],
    },
    { key: 'bracketPairColorization', label: 'Bracket Colorization', type: 'boolean' },
    { key: 'formatOnSave', label: 'Format On Save', type: 'boolean' },
];

export const AI_SCHEMA: SettingSchema[] = [
    {
        key: 'provider',
        label: 'AI Provider',
        type: 'select',
        options: [
            { value: 'gemini', label: 'Google Gemini' },
            { value: 'openai', label: 'OpenAI' },
            { value: 'anthropic', label: 'Anthropic Claude' },
            { value: 'ollama', label: 'Ollama (Local)' },
        ],
    },
    { key: 'model', label: 'Model', type: 'string' },
    { key: 'apiKey', label: 'API Key', type: 'string', description: 'Your API key (stored locally)' },
    { key: 'inlineCompletions', label: 'Inline Completions', type: 'boolean' },
    { key: 'completionDelay', label: 'Completion Delay (ms)', type: 'number', min: 0, max: 1000 },
    { key: 'maxTokens', label: 'Max Tokens', type: 'number', min: 256, max: 32768 },
    { key: 'temperature', label: 'Temperature', type: 'number', min: 0, max: 2, step: 0.1 },
    { key: 'streamResponses', label: 'Stream Responses', type: 'boolean' },
];
