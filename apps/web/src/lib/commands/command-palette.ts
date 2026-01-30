/**
 * Command Palette
 * 
 * Global command search and execution (⌘K / Ctrl+K).
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type CommandCategory = 'file' | 'edit' | 'view' | 'go' | 'run' | 'ai' | 'git' | 'extension';

export interface Command {
    id: string;
    title: string;
    category: CommandCategory;
    shortcut?: string;
    description?: string;
    icon?: string;
    keywords?: string[];
    when?: () => boolean;
    execute: () => void | Promise<void>;
}

export interface CommandGroup {
    category: CommandCategory;
    label: string;
    commands: Command[];
}

export interface CommandPaletteState {
    isOpen: boolean;
    query: string;
    selectedIndex: number;
    recentCommands: string[];
    commands: Map<string, Command>;

    // Actions
    open: (initialQuery?: string) => void;
    close: () => void;
    setQuery: (query: string) => void;
    selectNext: () => void;
    selectPrevious: () => void;
    executeSelected: () => void;
    executeCommand: (id: string) => void;
    registerCommand: (command: Command) => void;
    registerCommands: (commands: Command[]) => void;
    unregisterCommand: (id: string) => void;
    getFilteredCommands: () => CommandGroup[];
}

// =============================================================================
// COMMAND PALETTE STORE
// =============================================================================

export const useCommandPalette = create<CommandPaletteState>((set, get) => ({
    isOpen: false,
    query: '',
    selectedIndex: 0,
    recentCommands: [],
    commands: new Map(),

    open: (initialQuery = '') => {
        set({ isOpen: true, query: initialQuery, selectedIndex: 0 });
    },

    close: () => {
        set({ isOpen: false, query: '', selectedIndex: 0 });
    },

    setQuery: (query: string) => {
        set({ query, selectedIndex: 0 });
    },

    selectNext: () => {
        const groups = get().getFilteredCommands();
        const totalCommands = groups.reduce((sum, g) => sum + g.commands.length, 0);
        set(state => ({
            selectedIndex: (state.selectedIndex + 1) % totalCommands,
        }));
    },

    selectPrevious: () => {
        const groups = get().getFilteredCommands();
        const totalCommands = groups.reduce((sum, g) => sum + g.commands.length, 0);
        set(state => ({
            selectedIndex: (state.selectedIndex - 1 + totalCommands) % totalCommands,
        }));
    },

    executeSelected: () => {
        const groups = get().getFilteredCommands();
        let currentIndex = 0;

        for (const group of groups) {
            for (const command of group.commands) {
                if (currentIndex === get().selectedIndex) {
                    get().executeCommand(command.id);
                    return;
                }
                currentIndex++;
            }
        }
    },

    executeCommand: (id: string) => {
        const command = get().commands.get(id);
        if (!command) return;

        // Check when condition
        if (command.when && !command.when()) return;

        // Execute
        command.execute();

        // Track recent
        set(state => ({
            recentCommands: [id, ...state.recentCommands.filter(c => c !== id)].slice(0, 10),
            isOpen: false,
            query: '',
        }));
    },

    registerCommand: (command: Command) => {
        set(state => {
            const commands = new Map(state.commands);
            commands.set(command.id, command);
            return { commands };
        });
    },

    registerCommands: (commands: Command[]) => {
        set(state => {
            const newCommands = new Map(state.commands);
            for (const command of commands) {
                newCommands.set(command.id, command);
            }
            return { commands: newCommands };
        });
    },

    unregisterCommand: (id: string) => {
        set(state => {
            const commands = new Map(state.commands);
            commands.delete(id);
            return { commands };
        });
    },

    getFilteredCommands: (): CommandGroup[] => {
        const { query, commands, recentCommands } = get();
        const lowerQuery = query.toLowerCase();

        // Filter commands by query
        const filtered = Array.from(commands.values()).filter(cmd => {
            if (cmd.when && !cmd.when()) return false;
            if (!query) return true;

            return (
                cmd.title.toLowerCase().includes(lowerQuery) ||
                cmd.category.toLowerCase().includes(lowerQuery) ||
                cmd.keywords?.some(k => k.toLowerCase().includes(lowerQuery)) ||
                cmd.description?.toLowerCase().includes(lowerQuery)
            );
        });

        // Sort by relevance
        filtered.sort((a, b) => {
            // Recent commands first
            const aRecent = recentCommands.indexOf(a.id);
            const bRecent = recentCommands.indexOf(b.id);
            if (aRecent !== -1 && bRecent === -1) return -1;
            if (aRecent === -1 && bRecent !== -1) return 1;
            if (aRecent !== -1 && bRecent !== -1) return aRecent - bRecent;

            // Exact match first
            if (query) {
                const aExact = a.title.toLowerCase().startsWith(lowerQuery);
                const bExact = b.title.toLowerCase().startsWith(lowerQuery);
                if (aExact && !bExact) return -1;
                if (!aExact && bExact) return 1;
            }

            // Alphabetically
            return a.title.localeCompare(b.title);
        });

        // Group by category
        const groups: Map<CommandCategory, Command[]> = new Map();
        const categoryOrder: CommandCategory[] = ['file', 'edit', 'view', 'go', 'run', 'ai', 'git', 'extension'];

        for (const cmd of filtered) {
            if (!groups.has(cmd.category)) {
                groups.set(cmd.category, []);
            }
            groups.get(cmd.category)!.push(cmd);
        }

        // Build result
        const categoryLabels: Record<CommandCategory, string> = {
            file: 'File',
            edit: 'Edit',
            view: 'View',
            go: 'Go',
            run: 'Run',
            ai: 'AI',
            git: 'Git',
            extension: 'Extensions',
        };

        return categoryOrder
            .filter(cat => groups.has(cat))
            .map(cat => ({
                category: cat,
                label: categoryLabels[cat],
                commands: groups.get(cat)!,
            }));
    },
}));

// =============================================================================
// DEFAULT COMMANDS
// =============================================================================

export function registerDefaultCommands(): void {
    const { registerCommands } = useCommandPalette.getState();

    registerCommands([
        // File commands
        {
            id: 'file.newFile',
            title: 'New File',
            category: 'file',
            shortcut: '⌘N',
            icon: '📄',
            keywords: ['create', 'add'],
            execute: () => console.log('New file'),
        },
        {
            id: 'file.openFile',
            title: 'Open File',
            category: 'file',
            shortcut: '⌘O',
            icon: '📂',
            execute: () => console.log('Open file'),
        },
        {
            id: 'file.save',
            title: 'Save',
            category: 'file',
            shortcut: '⌘S',
            icon: '💾',
            execute: () => console.log('Save'),
        },
        {
            id: 'file.saveAll',
            title: 'Save All',
            category: 'file',
            shortcut: '⌘⇧S',
            icon: '💾',
            execute: () => console.log('Save all'),
        },

        // Edit commands
        {
            id: 'edit.undo',
            title: 'Undo',
            category: 'edit',
            shortcut: '⌘Z',
            execute: () => console.log('Undo'),
        },
        {
            id: 'edit.redo',
            title: 'Redo',
            category: 'edit',
            shortcut: '⌘⇧Z',
            execute: () => console.log('Redo'),
        },
        {
            id: 'edit.find',
            title: 'Find',
            category: 'edit',
            shortcut: '⌘F',
            icon: '🔍',
            execute: () => console.log('Find'),
        },
        {
            id: 'edit.findReplace',
            title: 'Find and Replace',
            category: 'edit',
            shortcut: '⌘⇧H',
            icon: '🔄',
            execute: () => console.log('Find and replace'),
        },
        {
            id: 'edit.formatDocument',
            title: 'Format Document',
            category: 'edit',
            shortcut: '⌥⇧F',
            icon: '✨',
            keywords: ['prettier', 'beautify'],
            execute: () => console.log('Format document'),
        },

        // View commands
        {
            id: 'view.toggleSidebar',
            title: 'Toggle Sidebar',
            category: 'view',
            shortcut: '⌘B',
            icon: '◧',
            execute: () => console.log('Toggle sidebar'),
        },
        {
            id: 'view.toggleTerminal',
            title: 'Toggle Terminal',
            category: 'view',
            shortcut: '⌘`',
            icon: '▣',
            execute: () => console.log('Toggle terminal'),
        },
        {
            id: 'view.toggleProblems',
            title: 'Toggle Problems',
            category: 'view',
            shortcut: '⌘⇧M',
            icon: '⚠️',
            execute: () => console.log('Toggle problems'),
        },
        {
            id: 'view.zoomIn',
            title: 'Zoom In',
            category: 'view',
            shortcut: '⌘+',
            execute: () => console.log('Zoom in'),
        },
        {
            id: 'view.zoomOut',
            title: 'Zoom Out',
            category: 'view',
            shortcut: '⌘-',
            execute: () => console.log('Zoom out'),
        },

        // Go commands
        {
            id: 'go.toFile',
            title: 'Go to File',
            category: 'go',
            shortcut: '⌘P',
            icon: '📄',
            keywords: ['quick open'],
            execute: () => console.log('Go to file'),
        },
        {
            id: 'go.toSymbol',
            title: 'Go to Symbol',
            category: 'go',
            shortcut: '⌘⇧O',
            icon: '🔤',
            execute: () => console.log('Go to symbol'),
        },
        {
            id: 'go.toLine',
            title: 'Go to Line',
            category: 'go',
            shortcut: '⌘G',
            icon: '#',
            execute: () => console.log('Go to line'),
        },
        {
            id: 'go.toDefinition',
            title: 'Go to Definition',
            category: 'go',
            shortcut: 'F12',
            icon: '➜',
            execute: () => console.log('Go to definition'),
        },
        {
            id: 'go.toReferences',
            title: 'Go to References',
            category: 'go',
            shortcut: '⇧F12',
            icon: '🔗',
            execute: () => console.log('Go to references'),
        },

        // Run commands
        {
            id: 'run.start',
            title: 'Start Debugging',
            category: 'run',
            shortcut: 'F5',
            icon: '▶️',
            execute: () => console.log('Start debugging'),
        },
        {
            id: 'run.startWithoutDebugging',
            title: 'Run Without Debugging',
            category: 'run',
            shortcut: '⌃F5',
            icon: '▶️',
            execute: () => console.log('Run without debugging'),
        },
        {
            id: 'run.stop',
            title: 'Stop',
            category: 'run',
            shortcut: '⇧F5',
            icon: '⏹️',
            execute: () => console.log('Stop'),
        },
        {
            id: 'run.restart',
            title: 'Restart',
            category: 'run',
            shortcut: '⌘⇧F5',
            icon: '🔄',
            execute: () => console.log('Restart'),
        },

        // AI commands
        {
            id: 'ai.inlineCompletion',
            title: 'Trigger Inline Completion',
            category: 'ai',
            shortcut: '⌘I',
            icon: '✨',
            keywords: ['copilot', 'suggest'],
            execute: () => console.log('Inline completion'),
        },
        {
            id: 'ai.chat',
            title: 'Open AI Chat',
            category: 'ai',
            shortcut: '⌘⇧I',
            icon: '💬',
            keywords: ['assistant', 'help'],
            execute: () => console.log('Open AI chat'),
        },
        {
            id: 'ai.composer',
            title: 'Open Composer',
            category: 'ai',
            icon: '🚀',
            keywords: ['agent', 'build'],
            execute: () => console.log('Open composer'),
        },
        {
            id: 'ai.explain',
            title: 'Explain Selection',
            category: 'ai',
            icon: '❓',
            execute: () => console.log('Explain'),
        },
        {
            id: 'ai.fix',
            title: 'Fix Selection',
            category: 'ai',
            icon: '🔧',
            execute: () => console.log('Fix'),
        },
        {
            id: 'ai.refactor',
            title: 'Refactor Selection',
            category: 'ai',
            icon: '🔄',
            execute: () => console.log('Refactor'),
        },

        // Git commands
        {
            id: 'git.commit',
            title: 'Git: Commit',
            category: 'git',
            icon: '📦',
            execute: () => console.log('Git commit'),
        },
        {
            id: 'git.push',
            title: 'Git: Push',
            category: 'git',
            icon: '⬆️',
            execute: () => console.log('Git push'),
        },
        {
            id: 'git.pull',
            title: 'Git: Pull',
            category: 'git',
            icon: '⬇️',
            execute: () => console.log('Git pull'),
        },
        {
            id: 'git.stash',
            title: 'Git: Stash',
            category: 'git',
            icon: '📋',
            execute: () => console.log('Git stash'),
        },
        {
            id: 'git.checkout',
            title: 'Git: Checkout Branch',
            category: 'git',
            icon: '🔀',
            keywords: ['switch', 'branch'],
            execute: () => console.log('Git checkout'),
        },
    ]);
}
