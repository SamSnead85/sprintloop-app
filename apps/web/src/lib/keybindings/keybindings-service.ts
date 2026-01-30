/**
 * Keybindings Service
 * 
 * Manages keyboard shortcuts with customization support.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface Keybinding {
    id: string;
    command: string;
    title: string;
    keybinding: string;
    when?: string;
    source: 'default' | 'user' | 'extension';
    category: KeybindingCategory;
}

export type KeybindingCategory =
    | 'editor' | 'file' | 'view' | 'navigation'
    | 'search' | 'git' | 'debug' | 'terminal' | 'ai';

export interface KeybindingsState {
    keybindings: Keybinding[];
    userOverrides: Record<string, string>;
    searchQuery: string;
    selectedCategory: KeybindingCategory | null;
    recordingFor: string | null;

    // Operations
    setKeybinding: (commandId: string, keybinding: string) => void;
    resetKeybinding: (commandId: string) => void;
    resetAll: () => void;

    // Search/Filter
    setSearchQuery: (query: string) => void;
    setSelectedCategory: (category: KeybindingCategory | null) => void;
    getFilteredKeybindings: () => Keybinding[];

    // Recording
    startRecording: (commandId: string) => void;
    stopRecording: () => void;

    // Getters
    getKeybindingForCommand: (command: string) => string | undefined;
    getCommandForKeybinding: (keybinding: string) => string | undefined;
    getEffectiveKeybinding: (commandId: string) => string;
}

// =============================================================================
// DEFAULT KEYBINDINGS
// =============================================================================

const DEFAULT_KEYBINDINGS: Keybinding[] = [
    // File
    { id: 'file.new', command: 'file.new', title: 'New File', keybinding: 'Ctrl+N', source: 'default', category: 'file' },
    { id: 'file.open', command: 'file.open', title: 'Open File', keybinding: 'Ctrl+O', source: 'default', category: 'file' },
    { id: 'file.save', command: 'file.save', title: 'Save', keybinding: 'Ctrl+S', source: 'default', category: 'file' },
    { id: 'file.saveAll', command: 'file.saveAll', title: 'Save All', keybinding: 'Ctrl+Shift+S', source: 'default', category: 'file' },
    { id: 'file.close', command: 'file.close', title: 'Close Editor', keybinding: 'Ctrl+W', source: 'default', category: 'file' },

    // Editor
    { id: 'editor.undo', command: 'editor.undo', title: 'Undo', keybinding: 'Ctrl+Z', source: 'default', category: 'editor' },
    { id: 'editor.redo', command: 'editor.redo', title: 'Redo', keybinding: 'Ctrl+Shift+Z', source: 'default', category: 'editor' },
    { id: 'editor.cut', command: 'editor.cut', title: 'Cut', keybinding: 'Ctrl+X', source: 'default', category: 'editor' },
    { id: 'editor.copy', command: 'editor.copy', title: 'Copy', keybinding: 'Ctrl+C', source: 'default', category: 'editor' },
    { id: 'editor.paste', command: 'editor.paste', title: 'Paste', keybinding: 'Ctrl+V', source: 'default', category: 'editor' },
    { id: 'editor.selectAll', command: 'editor.selectAll', title: 'Select All', keybinding: 'Ctrl+A', source: 'default', category: 'editor' },
    { id: 'editor.find', command: 'editor.find', title: 'Find', keybinding: 'Ctrl+F', source: 'default', category: 'editor' },
    { id: 'editor.replace', command: 'editor.replace', title: 'Find and Replace', keybinding: 'Ctrl+H', source: 'default', category: 'editor' },
    { id: 'editor.format', command: 'editor.format', title: 'Format Document', keybinding: 'Shift+Alt+F', source: 'default', category: 'editor' },
    { id: 'editor.comment', command: 'editor.comment', title: 'Toggle Comment', keybinding: 'Ctrl+/', source: 'default', category: 'editor' },

    // View
    { id: 'view.commandPalette', command: 'view.commandPalette', title: 'Command Palette', keybinding: 'Ctrl+Shift+P', source: 'default', category: 'view' },
    { id: 'view.quickOpen', command: 'view.quickOpen', title: 'Quick Open', keybinding: 'Ctrl+P', source: 'default', category: 'view' },
    { id: 'view.explorer', command: 'view.explorer', title: 'Show Explorer', keybinding: 'Ctrl+Shift+E', source: 'default', category: 'view' },
    { id: 'view.search', command: 'view.search', title: 'Show Search', keybinding: 'Ctrl+Shift+F', source: 'default', category: 'view' },
    { id: 'view.git', command: 'view.git', title: 'Show Git', keybinding: 'Ctrl+Shift+G', source: 'default', category: 'view' },
    { id: 'view.debug', command: 'view.debug', title: 'Show Debug', keybinding: 'Ctrl+Shift+D', source: 'default', category: 'view' },
    { id: 'view.terminal', command: 'view.terminal', title: 'Toggle Terminal', keybinding: 'Ctrl+`', source: 'default', category: 'view' },
    { id: 'view.sidebar', command: 'view.sidebar', title: 'Toggle Sidebar', keybinding: 'Ctrl+B', source: 'default', category: 'view' },

    // Navigation
    { id: 'nav.goToLine', command: 'nav.goToLine', title: 'Go to Line', keybinding: 'Ctrl+G', source: 'default', category: 'navigation' },
    { id: 'nav.goToSymbol', command: 'nav.goToSymbol', title: 'Go to Symbol', keybinding: 'Ctrl+Shift+O', source: 'default', category: 'navigation' },
    { id: 'nav.goBack', command: 'nav.goBack', title: 'Go Back', keybinding: 'Alt+Left', source: 'default', category: 'navigation' },
    { id: 'nav.goForward', command: 'nav.goForward', title: 'Go Forward', keybinding: 'Alt+Right', source: 'default', category: 'navigation' },

    // Search
    { id: 'search.inFiles', command: 'search.inFiles', title: 'Search in Files', keybinding: 'Ctrl+Shift+F', source: 'default', category: 'search' },
    { id: 'search.replaceInFiles', command: 'search.replaceInFiles', title: 'Replace in Files', keybinding: 'Ctrl+Shift+H', source: 'default', category: 'search' },

    // Git
    { id: 'git.commit', command: 'git.commit', title: 'Git: Commit', keybinding: 'Ctrl+Enter', when: 'git.inputFocused', source: 'default', category: 'git' },
    { id: 'git.stage', command: 'git.stage', title: 'Git: Stage Changes', keybinding: 'Ctrl+Shift+K', source: 'default', category: 'git' },

    // Debug
    { id: 'debug.start', command: 'debug.start', title: 'Start Debugging', keybinding: 'F5', source: 'default', category: 'debug' },
    { id: 'debug.stop', command: 'debug.stop', title: 'Stop Debugging', keybinding: 'Shift+F5', source: 'default', category: 'debug' },
    { id: 'debug.stepOver', command: 'debug.stepOver', title: 'Step Over', keybinding: 'F10', source: 'default', category: 'debug' },
    { id: 'debug.stepInto', command: 'debug.stepInto', title: 'Step Into', keybinding: 'F11', source: 'default', category: 'debug' },
    { id: 'debug.stepOut', command: 'debug.stepOut', title: 'Step Out', keybinding: 'Shift+F11', source: 'default', category: 'debug' },
    { id: 'debug.toggleBreakpoint', command: 'debug.toggleBreakpoint', title: 'Toggle Breakpoint', keybinding: 'F9', source: 'default', category: 'debug' },

    // Terminal
    { id: 'terminal.new', command: 'terminal.new', title: 'New Terminal', keybinding: 'Ctrl+Shift+`', source: 'default', category: 'terminal' },
    { id: 'terminal.split', command: 'terminal.split', title: 'Split Terminal', keybinding: 'Ctrl+Shift+5', source: 'default', category: 'terminal' },
    { id: 'terminal.kill', command: 'terminal.kill', title: 'Kill Terminal', keybinding: 'Ctrl+Shift+K', when: 'terminalFocused', source: 'default', category: 'terminal' },

    // AI
    { id: 'ai.chat', command: 'ai.chat', title: 'Open AI Chat', keybinding: 'Ctrl+Shift+I', source: 'default', category: 'ai' },
    { id: 'ai.inline', command: 'ai.inline', title: 'Inline AI Edit', keybinding: 'Ctrl+K', source: 'default', category: 'ai' },
    { id: 'ai.accept', command: 'ai.accept', title: 'Accept AI Suggestion', keybinding: 'Tab', when: 'aiSuggestionVisible', source: 'default', category: 'ai' },
    { id: 'ai.reject', command: 'ai.reject', title: 'Reject AI Suggestion', keybinding: 'Escape', when: 'aiSuggestionVisible', source: 'default', category: 'ai' },
];

// =============================================================================
// KEYBINDINGS STORE
// =============================================================================

export const useKeybindingsService = create<KeybindingsState>()(
    persist(
        (set, get) => ({
            keybindings: DEFAULT_KEYBINDINGS,
            userOverrides: {},
            searchQuery: '',
            selectedCategory: null,
            recordingFor: null,

            setKeybinding: (commandId, keybinding) => {
                set(state => ({
                    userOverrides: { ...state.userOverrides, [commandId]: keybinding },
                    recordingFor: null,
                }));
            },

            resetKeybinding: (commandId) => {
                set(state => {
                    const newOverrides = { ...state.userOverrides };
                    delete newOverrides[commandId];
                    return { userOverrides: newOverrides };
                });
            },

            resetAll: () => set({ userOverrides: {} }),

            setSearchQuery: (query) => set({ searchQuery: query }),
            setSelectedCategory: (category) => set({ selectedCategory: category }),

            getFilteredKeybindings: () => {
                const { keybindings, searchQuery, selectedCategory, userOverrides } = get();
                let filtered = keybindings;

                if (selectedCategory) {
                    filtered = filtered.filter(kb => kb.category === selectedCategory);
                }

                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    filtered = filtered.filter(kb =>
                        kb.title.toLowerCase().includes(query) ||
                        kb.command.toLowerCase().includes(query) ||
                        kb.keybinding.toLowerCase().includes(query)
                    );
                }

                // Apply user overrides
                return filtered.map(kb => ({
                    ...kb,
                    keybinding: userOverrides[kb.id] || kb.keybinding,
                    source: userOverrides[kb.id] ? 'user' as const : kb.source,
                }));
            },

            startRecording: (commandId) => set({ recordingFor: commandId }),
            stopRecording: () => set({ recordingFor: null }),

            getKeybindingForCommand: (command) => {
                const { keybindings, userOverrides } = get();
                const kb = keybindings.find(k => k.command === command);
                if (!kb) return undefined;
                return userOverrides[kb.id] || kb.keybinding;
            },

            getCommandForKeybinding: (keybinding) => {
                const { keybindings, userOverrides } = get();
                // Check user overrides first
                for (const [id, binding] of Object.entries(userOverrides)) {
                    if (binding === keybinding) {
                        const kb = keybindings.find(k => k.id === id);
                        return kb?.command;
                    }
                }
                // Check defaults
                const kb = keybindings.find(k => k.keybinding === keybinding);
                return kb?.command;
            },

            getEffectiveKeybinding: (commandId) => {
                const { keybindings, userOverrides } = get();
                if (userOverrides[commandId]) return userOverrides[commandId];
                const kb = keybindings.find(k => k.id === commandId);
                return kb?.keybinding || '';
            },
        }),
        { name: 'sprintloop-keybindings', partialize: (state) => ({ userOverrides: state.userOverrides }) }
    )
);

// =============================================================================
// UTILITIES
// =============================================================================

export const CATEGORY_LABELS: Record<KeybindingCategory, string> = {
    editor: 'Editor',
    file: 'File',
    view: 'View',
    navigation: 'Navigation',
    search: 'Search',
    git: 'Git',
    debug: 'Debug',
    terminal: 'Terminal',
    ai: 'AI',
};

export function parseKeybinding(keybinding: string): { modifiers: string[]; key: string } {
    const parts = keybinding.split('+');
    const key = parts.pop() || '';
    return { modifiers: parts, key };
}

export function formatKeybinding(keybinding: string): string {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    return keybinding
        .replace(/Ctrl/g, isMac ? '⌘' : 'Ctrl')
        .replace(/Alt/g, isMac ? '⌥' : 'Alt')
        .replace(/Shift/g, isMac ? '⇧' : 'Shift');
}
