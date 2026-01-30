/**
 * Keyboard Shortcuts System
 * 
 * Global hotkey management with customization support.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface KeyBinding {
    id: string;
    command: string;
    key: string;
    mac?: string;
    when?: string;
    description?: string;
}

export interface KeyboardShortcutsState {
    bindings: Map<string, KeyBinding>;
    pressedKeys: Set<string>;
    scheme: 'default' | 'vim' | 'emacs';

    // Actions
    registerBinding: (binding: KeyBinding) => void;
    registerBindings: (bindings: KeyBinding[]) => void;
    unregisterBinding: (id: string) => void;
    updateBinding: (id: string, key: string) => void;
    resetBinding: (id: string) => void;
    resetAll: () => void;
    setScheme: (scheme: 'default' | 'vim' | 'emacs') => void;
    handleKeyDown: (event: KeyboardEvent) => void;
    handleKeyUp: (event: KeyboardEvent) => void;
    getBindingForKey: (key: string) => KeyBinding | undefined;
    getShortcutDisplay: (binding: KeyBinding) => string;
}

// =============================================================================
// KEY UTILITIES
// =============================================================================

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export function normalizeKey(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.metaKey) parts.push('cmd');
    if (event.ctrlKey) parts.push('ctrl');
    if (event.altKey) parts.push('alt');
    if (event.shiftKey) parts.push('shift');

    const key = event.key.toLowerCase();
    if (!['meta', 'control', 'alt', 'shift'].includes(key)) {
        parts.push(key === ' ' ? 'space' : key);
    }

    return parts.join('+');
}

export function parseKeyCombo(combo: string): { modifiers: string[]; key: string } {
    const parts = combo.toLowerCase().split('+');
    const key = parts.pop() || '';
    return { modifiers: parts, key };
}

export function formatKeyDisplay(combo: string): string {
    const symbolMap: Record<string, string> = {
        cmd: '⌘',
        ctrl: isMac ? '⌃' : 'Ctrl',
        alt: isMac ? '⌥' : 'Alt',
        shift: '⇧',
        enter: '↵',
        backspace: '⌫',
        delete: '⌦',
        escape: 'Esc',
        space: 'Space',
        tab: '⇥',
        up: '↑',
        down: '↓',
        left: '←',
        right: '→',
    };

    return combo
        .split('+')
        .map(part => symbolMap[part.toLowerCase()] || part.toUpperCase())
        .join(isMac ? '' : '+');
}

// =============================================================================
// DEFAULT BINDINGS
// =============================================================================

const DEFAULT_BINDINGS: KeyBinding[] = [
    // File
    { id: 'file.new', command: 'file.newFile', key: 'ctrl+n', mac: 'cmd+n', description: 'New File' },
    { id: 'file.open', command: 'file.openFile', key: 'ctrl+o', mac: 'cmd+o', description: 'Open File' },
    { id: 'file.save', command: 'file.save', key: 'ctrl+s', mac: 'cmd+s', description: 'Save' },
    { id: 'file.saveAll', command: 'file.saveAll', key: 'ctrl+shift+s', mac: 'cmd+shift+s', description: 'Save All' },
    { id: 'file.close', command: 'file.close', key: 'ctrl+w', mac: 'cmd+w', description: 'Close Tab' },

    // Edit
    { id: 'edit.undo', command: 'edit.undo', key: 'ctrl+z', mac: 'cmd+z', description: 'Undo' },
    { id: 'edit.redo', command: 'edit.redo', key: 'ctrl+shift+z', mac: 'cmd+shift+z', description: 'Redo' },
    { id: 'edit.cut', command: 'edit.cut', key: 'ctrl+x', mac: 'cmd+x', description: 'Cut' },
    { id: 'edit.copy', command: 'edit.copy', key: 'ctrl+c', mac: 'cmd+c', description: 'Copy' },
    { id: 'edit.paste', command: 'edit.paste', key: 'ctrl+v', mac: 'cmd+v', description: 'Paste' },
    { id: 'edit.find', command: 'edit.find', key: 'ctrl+f', mac: 'cmd+f', description: 'Find' },
    { id: 'edit.replace', command: 'edit.findReplace', key: 'ctrl+h', mac: 'cmd+shift+h', description: 'Find & Replace' },
    { id: 'edit.format', command: 'edit.formatDocument', key: 'alt+shift+f', mac: 'alt+shift+f', description: 'Format Document' },

    // View
    { id: 'view.commandPalette', command: 'view.commandPalette', key: 'ctrl+shift+p', mac: 'cmd+shift+p', description: 'Command Palette' },
    { id: 'view.quickOpen', command: 'go.toFile', key: 'ctrl+p', mac: 'cmd+p', description: 'Quick Open' },
    { id: 'view.sidebar', command: 'view.toggleSidebar', key: 'ctrl+b', mac: 'cmd+b', description: 'Toggle Sidebar' },
    { id: 'view.terminal', command: 'view.toggleTerminal', key: 'ctrl+`', mac: 'cmd+`', description: 'Toggle Terminal' },
    { id: 'view.problems', command: 'view.toggleProblems', key: 'ctrl+shift+m', mac: 'cmd+shift+m', description: 'Toggle Problems' },
    { id: 'view.output', command: 'view.toggleOutput', key: 'ctrl+shift+u', mac: 'cmd+shift+u', description: 'Toggle Output' },
    { id: 'view.explorer', command: 'view.focusExplorer', key: 'ctrl+shift+e', mac: 'cmd+shift+e', description: 'Focus Explorer' },
    { id: 'view.search', command: 'view.focusSearch', key: 'ctrl+shift+f', mac: 'cmd+shift+f', description: 'Search in Files' },
    { id: 'view.git', command: 'view.focusSourceControl', key: 'ctrl+shift+g', mac: 'cmd+shift+g', description: 'Source Control' },
    { id: 'view.extensions', command: 'view.focusExtensions', key: 'ctrl+shift+x', mac: 'cmd+shift+x', description: 'Extensions' },
    { id: 'view.zoomIn', command: 'view.zoomIn', key: 'ctrl+=', mac: 'cmd+=', description: 'Zoom In' },
    { id: 'view.zoomOut', command: 'view.zoomOut', key: 'ctrl+-', mac: 'cmd+-', description: 'Zoom Out' },

    // Go
    { id: 'go.line', command: 'go.toLine', key: 'ctrl+g', mac: 'ctrl+g', description: 'Go to Line' },
    { id: 'go.symbol', command: 'go.toSymbol', key: 'ctrl+shift+o', mac: 'cmd+shift+o', description: 'Go to Symbol' },
    { id: 'go.definition', command: 'go.toDefinition', key: 'f12', description: 'Go to Definition' },
    { id: 'go.references', command: 'go.toReferences', key: 'shift+f12', description: 'Find References' },
    { id: 'go.back', command: 'go.back', key: 'alt+left', mac: 'ctrl+-', description: 'Go Back' },
    { id: 'go.forward', command: 'go.forward', key: 'alt+right', mac: 'ctrl+shift+-', description: 'Go Forward' },

    // AI
    { id: 'ai.inline', command: 'ai.inlineCompletion', key: 'ctrl+i', mac: 'cmd+i', description: 'Inline Completion' },
    { id: 'ai.chat', command: 'ai.chat', key: 'ctrl+shift+i', mac: 'cmd+shift+i', description: 'AI Chat' },
    { id: 'ai.composer', command: 'ai.composer', key: 'ctrl+shift+k', mac: 'cmd+shift+k', description: 'Composer Mode' },

    // Debug
    { id: 'debug.start', command: 'run.start', key: 'f5', description: 'Start Debugging' },
    { id: 'debug.stop', command: 'run.stop', key: 'shift+f5', description: 'Stop Debugging' },
    { id: 'debug.restart', command: 'run.restart', key: 'ctrl+shift+f5', mac: 'cmd+shift+f5', description: 'Restart' },
    { id: 'debug.stepOver', command: 'debug.stepOver', key: 'f10', description: 'Step Over' },
    { id: 'debug.stepInto', command: 'debug.stepInto', key: 'f11', description: 'Step Into' },
    { id: 'debug.stepOut', command: 'debug.stepOut', key: 'shift+f11', description: 'Step Out' },

    // Editor
    { id: 'editor.duplicate', command: 'editor.duplicateLine', key: 'alt+shift+down', mac: 'alt+shift+down', description: 'Duplicate Line' },
    { id: 'editor.moveUp', command: 'editor.moveLineUp', key: 'alt+up', mac: 'alt+up', description: 'Move Line Up' },
    { id: 'editor.moveDown', command: 'editor.moveLineDown', key: 'alt+down', mac: 'alt+down', description: 'Move Line Down' },
    { id: 'editor.deleteLine', command: 'editor.deleteLine', key: 'ctrl+shift+k', mac: 'cmd+shift+k', description: 'Delete Line' },
    { id: 'editor.comment', command: 'editor.toggleLineComment', key: 'ctrl+/', mac: 'cmd+/', description: 'Toggle Comment' },
    { id: 'editor.blockComment', command: 'editor.toggleBlockComment', key: 'alt+shift+a', mac: 'alt+shift+a', description: 'Block Comment' },
    { id: 'editor.selectAll', command: 'editor.selectAll', key: 'ctrl+a', mac: 'cmd+a', description: 'Select All' },
    { id: 'editor.selectWord', command: 'editor.selectWord', key: 'ctrl+d', mac: 'cmd+d', description: 'Add Selection' },
    { id: 'editor.multiCursor', command: 'editor.addCursorAbove', key: 'ctrl+alt+up', mac: 'cmd+alt+up', description: 'Add Cursor Above' },
];

// =============================================================================
// KEYBOARD SHORTCUTS STORE
// =============================================================================

export const useKeyboardShortcuts = create<KeyboardShortcutsState>()(
    persist(
        (set, get) => ({
            bindings: new Map(DEFAULT_BINDINGS.map(b => [b.id, b])),
            pressedKeys: new Set(),
            scheme: 'default',

            registerBinding: (binding) => {
                set(state => {
                    const bindings = new Map(state.bindings);
                    bindings.set(binding.id, binding);
                    return { bindings };
                });
            },

            registerBindings: (bindings) => {
                set(state => {
                    const newBindings = new Map(state.bindings);
                    for (const binding of bindings) {
                        newBindings.set(binding.id, binding);
                    }
                    return { bindings: newBindings };
                });
            },

            unregisterBinding: (id) => {
                set(state => {
                    const bindings = new Map(state.bindings);
                    bindings.delete(id);
                    return { bindings };
                });
            },

            updateBinding: (id, key) => {
                set(state => {
                    const bindings = new Map(state.bindings);
                    const binding = bindings.get(id);
                    if (binding) {
                        bindings.set(id, { ...binding, key, mac: isMac ? key : binding.mac });
                    }
                    return { bindings };
                });
            },

            resetBinding: (id) => {
                const defaultBinding = DEFAULT_BINDINGS.find(b => b.id === id);
                if (defaultBinding) {
                    set(state => {
                        const bindings = new Map(state.bindings);
                        bindings.set(id, defaultBinding);
                        return { bindings };
                    });
                }
            },

            resetAll: () => {
                set({
                    bindings: new Map(DEFAULT_BINDINGS.map(b => [b.id, b])),
                });
            },

            setScheme: (scheme) => {
                set({ scheme });
            },

            handleKeyDown: (event) => {
                const key = normalizeKey(event);
                set(state => ({
                    pressedKeys: new Set(state.pressedKeys).add(key),
                }));
            },

            handleKeyUp: (_event) => {
                set({ pressedKeys: new Set() });
            },

            getBindingForKey: (key) => {
                const bindings = get().bindings;
                for (const binding of bindings.values()) {
                    const targetKey = isMac && binding.mac ? binding.mac : binding.key;
                    if (targetKey === key) {
                        return binding;
                    }
                }
                return undefined;
            },

            getShortcutDisplay: (binding) => {
                const key = isMac && binding.mac ? binding.mac : binding.key;
                return formatKeyDisplay(key);
            },
        }),
        {
            name: 'sprintloop-shortcuts',
            partialize: (state) => ({
                bindings: Array.from(state.bindings.entries()),
                scheme: state.scheme,
            }),
            merge: (persisted, current) => {
                const persistedData = persisted as { bindings?: [string, KeyBinding][]; scheme?: 'default' | 'vim' | 'emacs' } | undefined;
                return {
                    ...current,
                    bindings: new Map(persistedData?.bindings || DEFAULT_BINDINGS.map(b => [b.id, b])),
                    scheme: persistedData?.scheme || 'default',
                };
            },
        }
    )
);

// =============================================================================
// KEYBOARD HOOK
// =============================================================================

export function initGlobalKeyboardShortcuts(
    onCommand: (command: string) => void
): () => void {
    if (typeof window === 'undefined') return () => { };

    const { handleKeyDown, handleKeyUp, getBindingForKey } = useKeyboardShortcuts.getState();

    const handleKey = (event: KeyboardEvent) => {
        // Skip if in input/textarea
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            // Still allow some shortcuts
            if (!event.metaKey && !event.ctrlKey) return;
        }

        handleKeyDown(event);
        const key = normalizeKey(event);
        const binding = getBindingForKey(key);

        if (binding) {
            event.preventDefault();
            event.stopPropagation();
            onCommand(binding.command);
        }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
        window.removeEventListener('keydown', handleKey);
        window.removeEventListener('keyup', handleKeyUp);
    };
}
