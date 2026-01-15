/**
 * Keyboard Shortcut Manager
 * 
 * Phase 64: Full keyboard shortcut system with customization
 * VS Code/Cursor-style keybinding management
 */

export interface Keybinding {
    id: string;
    key: string;
    modifiers: KeyModifier[];
    command: string;
    when?: string;
    description: string;
    category: 'editor' | 'navigation' | 'ai' | 'terminal' | 'git' | 'debug' | 'general';
}

export type KeyModifier = 'cmd' | 'ctrl' | 'alt' | 'shift' | 'meta';

interface KeybindingMatch {
    keybinding: Keybinding;
    score: number;
}

/**
 * Default keybindings (Cursor/VS Code style)
 */
export const DEFAULT_KEYBINDINGS: Keybinding[] = [
    // Navigation
    { id: 'commandPalette', key: 'p', modifiers: ['cmd', 'shift'], command: 'palette.open', description: 'Open Command Palette', category: 'navigation' },
    { id: 'quickOpen', key: 'p', modifiers: ['cmd'], command: 'quickOpen.open', description: 'Quick Open File', category: 'navigation' },
    { id: 'toggleSidebar', key: 'b', modifiers: ['cmd'], command: 'sidebar.toggle', description: 'Toggle Sidebar', category: 'navigation' },
    { id: 'toggleTerminal', key: '`', modifiers: ['cmd'], command: 'terminal.toggle', description: 'Toggle Terminal', category: 'navigation' },
    { id: 'togglePanel', key: 'j', modifiers: ['cmd'], command: 'panel.toggle', description: 'Toggle Panel', category: 'navigation' },
    { id: 'goToLine', key: 'g', modifiers: ['ctrl'], command: 'editor.goToLine', description: 'Go to Line', category: 'navigation' },
    { id: 'goToSymbol', key: 'o', modifiers: ['cmd', 'shift'], command: 'editor.goToSymbol', description: 'Go to Symbol', category: 'navigation' },
    { id: 'focusExplorer', key: 'e', modifiers: ['cmd', 'shift'], command: 'explorer.focus', description: 'Focus Explorer', category: 'navigation' },

    // Editor
    { id: 'save', key: 's', modifiers: ['cmd'], command: 'editor.save', description: 'Save File', category: 'editor' },
    { id: 'saveAll', key: 's', modifiers: ['cmd', 'alt'], command: 'editor.saveAll', description: 'Save All', category: 'editor' },
    { id: 'undo', key: 'z', modifiers: ['cmd'], command: 'editor.undo', description: 'Undo', category: 'editor' },
    { id: 'redo', key: 'z', modifiers: ['cmd', 'shift'], command: 'editor.redo', description: 'Redo', category: 'editor' },
    { id: 'find', key: 'f', modifiers: ['cmd'], command: 'editor.find', description: 'Find', category: 'editor' },
    { id: 'replace', key: 'h', modifiers: ['cmd', 'alt'], command: 'editor.replace', description: 'Find and Replace', category: 'editor' },
    { id: 'findInFiles', key: 'f', modifiers: ['cmd', 'shift'], command: 'search.findInFiles', description: 'Search in Files', category: 'editor' },
    { id: 'format', key: 'f', modifiers: ['cmd', 'shift', 'alt'], command: 'editor.format', description: 'Format Document', category: 'editor' },
    { id: 'comment', key: '/', modifiers: ['cmd'], command: 'editor.toggleComment', description: 'Toggle Comment', category: 'editor' },
    { id: 'indentLine', key: ']', modifiers: ['cmd'], command: 'editor.indentLine', description: 'Indent Line', category: 'editor' },
    { id: 'outdentLine', key: '[', modifiers: ['cmd'], command: 'editor.outdentLine', description: 'Outdent Line', category: 'editor' },
    { id: 'moveLine', key: 'ArrowUp', modifiers: ['alt'], command: 'editor.moveLineUp', description: 'Move Line Up', category: 'editor' },
    { id: 'duplicateLine', key: 'd', modifiers: ['cmd', 'shift'], command: 'editor.duplicateLine', description: 'Duplicate Line', category: 'editor' },
    { id: 'deleteLine', key: 'k', modifiers: ['cmd', 'shift'], command: 'editor.deleteLine', description: 'Delete Line', category: 'editor' },
    { id: 'selectWord', key: 'd', modifiers: ['cmd'], command: 'editor.selectWord', description: 'Select Word', category: 'editor' },
    { id: 'selectAll', key: 'a', modifiers: ['cmd'], command: 'editor.selectAll', description: 'Select All', category: 'editor' },

    // Tabs
    { id: 'closeTab', key: 'w', modifiers: ['cmd'], command: 'tabs.close', description: 'Close Tab', category: 'navigation' },
    { id: 'nextTab', key: 'Tab', modifiers: ['ctrl'], command: 'tabs.next', description: 'Next Tab', category: 'navigation' },
    { id: 'prevTab', key: 'Tab', modifiers: ['ctrl', 'shift'], command: 'tabs.previous', description: 'Previous Tab', category: 'navigation' },
    { id: 'reopenTab', key: 't', modifiers: ['cmd', 'shift'], command: 'tabs.reopen', description: 'Reopen Closed Tab', category: 'navigation' },

    // AI
    { id: 'aiChat', key: 'l', modifiers: ['cmd'], command: 'ai.openChat', description: 'Open AI Chat', category: 'ai' },
    { id: 'aiInline', key: 'k', modifiers: ['cmd'], command: 'ai.inlineEdit', description: 'AI Inline Edit', category: 'ai' },
    { id: 'aiExplain', key: 'e', modifiers: ['cmd', 'shift', 'alt'], command: 'ai.explain', description: 'AI Explain Selection', category: 'ai' },
    { id: 'aiRefactor', key: 'r', modifiers: ['cmd', 'shift', 'alt'], command: 'ai.refactor', description: 'AI Refactor', category: 'ai' },
    { id: 'aiGenerate', key: 'g', modifiers: ['cmd', 'shift', 'alt'], command: 'ai.generate', description: 'AI Generate Code', category: 'ai' },
    { id: 'cancelAI', key: 'Escape', modifiers: [], command: 'ai.cancel', description: 'Cancel AI Action', category: 'ai', when: 'ai.isRunning' },

    // Terminal
    { id: 'newTerminal', key: 'n', modifiers: ['ctrl', 'shift'], command: 'terminal.new', description: 'New Terminal', category: 'terminal' },
    { id: 'clearTerminal', key: 'k', modifiers: ['cmd'], command: 'terminal.clear', description: 'Clear Terminal', category: 'terminal', when: 'terminal.focused' },
    { id: 'killTerminal', key: 'c', modifiers: ['ctrl'], command: 'terminal.interrupt', description: 'Interrupt Process', category: 'terminal', when: 'terminal.focused' },

    // Git
    { id: 'gitCommit', key: 'Enter', modifiers: ['cmd'], command: 'git.commit', description: 'Git Commit', category: 'git', when: 'git.inputFocused' },
    { id: 'gitPush', key: 'p', modifiers: ['cmd', 'shift', 'alt'], command: 'git.push', description: 'Git Push', category: 'git' },
    { id: 'gitPull', key: 'l', modifiers: ['cmd', 'shift', 'alt'], command: 'git.pull', description: 'Git Pull', category: 'git' },

    // General
    { id: 'settings', key: ',', modifiers: ['cmd'], command: 'settings.open', description: 'Open Settings', category: 'general' },
    { id: 'shortcuts', key: 'k', modifiers: ['cmd', 'shift'], command: 'shortcuts.open', description: 'Keyboard Shortcuts', category: 'general' },
    { id: 'zoomIn', key: '=', modifiers: ['cmd'], command: 'view.zoomIn', description: 'Zoom In', category: 'general' },
    { id: 'zoomOut', key: '-', modifiers: ['cmd'], command: 'view.zoomOut', description: 'Zoom Out', category: 'general' },
    { id: 'resetZoom', key: '0', modifiers: ['cmd'], command: 'view.resetZoom', description: 'Reset Zoom', category: 'general' },
];

/**
 * Keyboard Shortcut Manager
 */
class KeybindingManager {
    private keybindings: Map<string, Keybinding> = new Map();
    private handlers: Map<string, () => void> = new Map();
    private customizations: Map<string, Partial<Keybinding>> = new Map();
    private contextEvaluator?: (context: string) => boolean;

    constructor() {
        // Load defaults
        for (const kb of DEFAULT_KEYBINDINGS) {
            this.keybindings.set(kb.id, kb);
        }

        // Set up global listener
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', this.handleKeyDown.bind(this));
        }
    }

    /**
     * Register a command handler
     */
    registerHandler(command: string, handler: () => void): () => void {
        this.handlers.set(command, handler);
        return () => this.handlers.delete(command);
    }

    /**
     * Set context evaluator for 'when' conditions
     */
    setContextEvaluator(evaluator: (context: string) => boolean): void {
        this.contextEvaluator = evaluator;
    }

    /**
     * Customize a keybinding
     */
    customize(id: string, updates: Partial<Keybinding>): void {
        this.customizations.set(id, updates);
    }

    /**
     * Reset a keybinding to default
     */
    resetToDefault(id: string): void {
        this.customizations.delete(id);
    }

    /**
     * Get effective keybinding (with customizations applied)
     */
    getKeybinding(id: string): Keybinding | undefined {
        const default_ = this.keybindings.get(id);
        if (!default_) return undefined;

        const custom = this.customizations.get(id);
        if (!custom) return default_;

        return { ...default_, ...custom };
    }

    /**
     * Get all keybindings
     */
    getAllKeybindings(): Keybinding[] {
        return Array.from(this.keybindings.keys())
            .map(id => this.getKeybinding(id)!)
            .sort((a, b) => a.category.localeCompare(b.category));
    }

    /**
     * Get keybindings by category
     */
    getByCategory(category: Keybinding['category']): Keybinding[] {
        return this.getAllKeybindings().filter(kb => kb.category === category);
    }

    /**
     * Handle keydown event
     */
    private handleKeyDown(e: KeyboardEvent): void {
        // Build modifier set
        const modifiers: KeyModifier[] = [];
        if (e.metaKey || e.ctrlKey) modifiers.push('cmd');
        if (e.altKey) modifiers.push('alt');
        if (e.shiftKey) modifiers.push('shift');

        // Find matching keybinding
        const match = this.findMatch(e.key, modifiers);

        if (match) {
            // Check 'when' condition
            if (match.keybinding.when && this.contextEvaluator) {
                if (!this.contextEvaluator(match.keybinding.when)) {
                    return;
                }
            }

            e.preventDefault();
            e.stopPropagation();

            const handler = this.handlers.get(match.keybinding.command);
            if (handler) {
                handler();
            } else {
                console.log(`[Keybindings] No handler for: ${match.keybinding.command}`);
            }
        }
    }

    /**
     * Find matching keybinding
     */
    private findMatch(key: string, modifiers: KeyModifier[]): KeybindingMatch | null {
        for (const kb of this.getAllKeybindings()) {
            if (kb.key.toLowerCase() !== key.toLowerCase()) continue;

            // Check modifiers match exactly
            const kbModifiers = new Set(kb.modifiers);
            const inputModifiers = new Set(modifiers);

            if (kbModifiers.size !== inputModifiers.size) continue;

            let match = true;
            for (const mod of kbModifiers) {
                if (!inputModifiers.has(mod)) {
                    match = false;
                    break;
                }
            }

            if (match) {
                return { keybinding: kb, score: 1 };
            }
        }

        return null;
    }

    /**
     * Format keybinding for display
     */
    formatKeybinding(kb: Keybinding): string {
        const parts: string[] = [];

        if (kb.modifiers.includes('cmd')) parts.push('⌘');
        if (kb.modifiers.includes('ctrl')) parts.push('⌃');
        if (kb.modifiers.includes('alt')) parts.push('⌥');
        if (kb.modifiers.includes('shift')) parts.push('⇧');

        parts.push(kb.key.length === 1 ? kb.key.toUpperCase() : kb.key);

        return parts.join('');
    }
}

// Singleton instance
export const keybindings = new KeybindingManager();

/**
 * Get formatted shortcut string
 */
export function formatShortcut(id: string): string {
    const kb = keybindings.getKeybinding(id);
    return kb ? keybindings.formatKeybinding(kb) : '';
}
