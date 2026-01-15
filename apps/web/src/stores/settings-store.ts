/**
 * Settings Store
 * 
 * Phase 30: Per-project configuration with .sprintloop config file
 * Phase 38: Settings UI preferences
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EditorSettings {
    fontSize: number;
    fontFamily: string;
    tabSize: number;
    insertSpaces: boolean;
    wordWrap: 'on' | 'off' | 'wordWrapColumn';
    lineNumbers: 'on' | 'off' | 'relative';
    minimap: boolean;
    cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
    cursorStyle: 'line' | 'block' | 'underline';
    formatOnSave: boolean;
    formatOnPaste: boolean;
}

export interface AISettings {
    defaultModel: string;
    defaultProvider: 'anthropic' | 'openai' | 'google';
    agentMode: 'suggest' | 'auto_edit' | 'full_auto';
    maxTokens: number;
    temperature: number;
    streamResponses: boolean;
    autoApproveReads: boolean;
    showCostEstimates: boolean;
}

export interface TerminalSettings {
    fontSize: number;
    fontFamily: string;
    cursorBlink: boolean;
    scrollback: number;
    shell: string;
    defaultCwd: string;
}

export interface UISettings {
    theme: 'dark' | 'light' | 'system';
    sidebarPosition: 'left' | 'right';
    activityBarVisible: boolean;
    statusBarVisible: boolean;
    panelPosition: 'bottom' | 'right';
    compactMode: boolean;
}

export interface KeybindingSettings {
    commandPalette: string;
    quickOpen: string;
    toggleSidebar: string;
    toggleTerminal: string;
    saveFile: string;
    closeTab: string;
    nextTab: string;
    prevTab: string;
}

export interface SprintLoopSettings {
    editor: EditorSettings;
    ai: AISettings;
    terminal: TerminalSettings;
    ui: UISettings;
    keybindings: KeybindingSettings;

    // Project-specific
    projectSettings: Record<string, Partial<SprintLoopSettings>>;
}

const DEFAULT_SETTINGS: SprintLoopSettings = {
    editor: {
        fontSize: 14,
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        tabSize: 2,
        insertSpaces: true,
        wordWrap: 'on',
        lineNumbers: 'on',
        minimap: true,
        cursorBlinking: 'smooth',
        cursorStyle: 'line',
        formatOnSave: true,
        formatOnPaste: false,
    },
    ai: {
        defaultModel: 'claude-4-sonnet',
        defaultProvider: 'anthropic',
        agentMode: 'auto_edit',
        maxTokens: 4096,
        temperature: 0.7,
        streamResponses: true,
        autoApproveReads: true,
        showCostEstimates: true,
    },
    terminal: {
        fontSize: 13,
        fontFamily: 'JetBrains Mono, monospace',
        cursorBlink: true,
        scrollback: 10000,
        shell: '',
        defaultCwd: '',
    },
    ui: {
        theme: 'dark',
        sidebarPosition: 'left',
        activityBarVisible: true,
        statusBarVisible: true,
        panelPosition: 'bottom',
        compactMode: false,
    },
    keybindings: {
        commandPalette: 'cmd+shift+p',
        quickOpen: 'cmd+p',
        toggleSidebar: 'cmd+b',
        toggleTerminal: 'cmd+`',
        saveFile: 'cmd+s',
        closeTab: 'cmd+w',
        nextTab: 'cmd+option+right',
        prevTab: 'cmd+option+left',
    },
    projectSettings: {},
};

interface SettingsState extends SprintLoopSettings {
    // Current project path
    currentProject: string | null;

    // Actions
    setCurrentProject: (path: string | null) => void;
    updateEditorSettings: (settings: Partial<EditorSettings>) => void;
    updateAISettings: (settings: Partial<AISettings>) => void;
    updateTerminalSettings: (settings: Partial<TerminalSettings>) => void;
    updateUISettings: (settings: Partial<UISettings>) => void;
    updateKeybindings: (bindings: Partial<KeybindingSettings>) => void;
    setProjectSetting: (projectPath: string, settings: Partial<SprintLoopSettings>) => void;
    getEffectiveSettings: () => SprintLoopSettings;
    resetToDefaults: () => void;
    exportSettings: () => string;
    importSettings: (json: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set, get) => ({
            ...DEFAULT_SETTINGS,
            currentProject: null,

            setCurrentProject: (path) => set({ currentProject: path }),

            updateEditorSettings: (settings) => set((state) => ({
                editor: { ...state.editor, ...settings },
            })),

            updateAISettings: (settings) => set((state) => ({
                ai: { ...state.ai, ...settings },
            })),

            updateTerminalSettings: (settings) => set((state) => ({
                terminal: { ...state.terminal, ...settings },
            })),

            updateUISettings: (settings) => set((state) => ({
                ui: { ...state.ui, ...settings },
            })),

            updateKeybindings: (bindings) => set((state) => ({
                keybindings: { ...state.keybindings, ...bindings },
            })),

            setProjectSetting: (projectPath, settings) => set((state) => ({
                projectSettings: {
                    ...state.projectSettings,
                    [projectPath]: {
                        ...state.projectSettings[projectPath],
                        ...settings,
                    },
                },
            })),

            getEffectiveSettings: () => {
                const state = get();
                const projectPath = state.currentProject;

                if (!projectPath || !state.projectSettings[projectPath]) {
                    return state;
                }

                const projectOverrides = state.projectSettings[projectPath];

                return {
                    ...state,
                    editor: { ...state.editor, ...projectOverrides.editor },
                    ai: { ...state.ai, ...projectOverrides.ai },
                    terminal: { ...state.terminal, ...projectOverrides.terminal },
                    ui: { ...state.ui, ...projectOverrides.ui },
                    keybindings: { ...state.keybindings, ...projectOverrides.keybindings },
                };
            },

            resetToDefaults: () => set(DEFAULT_SETTINGS),

            exportSettings: () => {
                const state = get();
                const exportable = {
                    editor: state.editor,
                    ai: state.ai,
                    terminal: state.terminal,
                    ui: state.ui,
                    keybindings: state.keybindings,
                };
                return JSON.stringify(exportable, null, 2);
            },

            importSettings: (json) => {
                try {
                    const parsed = JSON.parse(json);
                    set({
                        editor: { ...DEFAULT_SETTINGS.editor, ...parsed.editor },
                        ai: { ...DEFAULT_SETTINGS.ai, ...parsed.ai },
                        terminal: { ...DEFAULT_SETTINGS.terminal, ...parsed.terminal },
                        ui: { ...DEFAULT_SETTINGS.ui, ...parsed.ui },
                        keybindings: { ...DEFAULT_SETTINGS.keybindings, ...parsed.keybindings },
                    });
                } catch (e) {
                    console.error('[Settings] Failed to import settings:', e);
                }
            },
        }),
        {
            name: 'sprintloop:settings',
            partialize: (state) => ({
                editor: state.editor,
                ai: state.ai,
                terminal: state.terminal,
                ui: state.ui,
                keybindings: state.keybindings,
                projectSettings: state.projectSettings,
            }),
        }
    )
);

/**
 * Load .sprintloop project config
 */
export async function loadProjectConfig(projectPath: string): Promise<Partial<SprintLoopSettings> | null> {
    // In real implementation, read .sprintloop/config.json from project
    console.log(`[Settings] Loading project config from ${projectPath}/.sprintloop`);
    return null;
}

/**
 * Save .sprintloop project config
 */
export async function saveProjectConfig(projectPath: string, settings: Partial<SprintLoopSettings>): Promise<void> {
    // In real implementation, write to .sprintloop/config.json
    console.log(`[Settings] Saving project config to ${projectPath}/.sprintloop`, settings);
}
