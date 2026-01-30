/**
 * Quick Open Service
 * 
 * Fast file and symbol search with fuzzy matching.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface QuickOpenItem {
    id: string;
    type: 'file' | 'symbol' | 'command' | 'recent';
    label: string;
    description?: string;
    detail?: string;
    icon?: string;
    path?: string;
    score?: number;
    range?: { startLine: number; endLine: number };
}

export type QuickOpenMode = 'files' | 'symbols' | 'commands' | 'goto';

export interface QuickOpenState {
    isOpen: boolean;
    mode: QuickOpenMode;
    query: string;
    items: QuickOpenItem[];
    filteredItems: QuickOpenItem[];
    selectedIndex: number;
    isLoading: boolean;
    placeholder: string;
    recentFiles: string[];

    // Open/Close
    open: (mode?: QuickOpenMode) => void;
    close: () => void;
    toggle: () => void;

    // Query
    setQuery: (query: string) => void;
    search: () => Promise<void>;

    // Navigation
    selectNext: () => void;
    selectPrevious: () => void;
    selectIndex: (index: number) => void;
    confirm: () => void;

    // Mode
    setMode: (mode: QuickOpenMode) => void;

    // Recent
    addRecentFile: (path: string) => void;
    clearRecentFiles: () => void;
}

// =============================================================================
// QUICK OPEN STORE
// =============================================================================

export const useQuickOpenService = create<QuickOpenState>((set, get) => ({
    isOpen: false,
    mode: 'files',
    query: '',
    items: [],
    filteredItems: [],
    selectedIndex: 0,
    isLoading: false,
    placeholder: 'Go to file...',
    recentFiles: [],

    open: (mode = 'files') => {
        const placeholder = getPlaceholder(mode);
        set({
            isOpen: true,
            mode,
            query: '',
            selectedIndex: 0,
            placeholder,
            filteredItems: mode === 'files' ? getRecentItems(get().recentFiles) : [],
        });
    },

    close: () => {
        set({
            isOpen: false,
            query: '',
            filteredItems: [],
            selectedIndex: 0,
        });
    },

    toggle: () => {
        if (get().isOpen) {
            get().close();
        } else {
            get().open();
        }
    },

    setQuery: (query) => {

        // Check for mode switches
        if (query.startsWith('@')) {
            set({ mode: 'symbols', placeholder: 'Go to symbol...' });
            query = query.slice(1);
        } else if (query.startsWith('>')) {
            set({ mode: 'commands', placeholder: 'Run command...' });
            query = query.slice(1);
        } else if (query.startsWith(':')) {
            set({ mode: 'goto', placeholder: 'Go to line...' });
            query = query.slice(1);
        }

        set({ query, selectedIndex: 0 });
        get().search();
    },

    search: async () => {
        const { query, mode, recentFiles } = get();

        if (!query.trim()) {
            const recent = mode === 'files' ? getRecentItems(recentFiles) : [];
            set({ filteredItems: recent });
            return;
        }

        set({ isLoading: true });

        // Simulate search delay
        await new Promise(resolve => setTimeout(resolve, 50));

        let items: QuickOpenItem[] = [];

        switch (mode) {
            case 'files':
                items = searchFiles(query);
                break;
            case 'symbols':
                items = searchSymbols(query);
                break;
            case 'commands':
                items = searchCommands(query);
                break;
            case 'goto':
                items = parseGotoLine(query);
                break;
        }

        set({
            filteredItems: items,
            isLoading: false,
        });
    },

    selectNext: () => {
        const { selectedIndex, filteredItems } = get();
        if (filteredItems.length === 0) return;

        const next = (selectedIndex + 1) % filteredItems.length;
        set({ selectedIndex: next });
    },

    selectPrevious: () => {
        const { selectedIndex, filteredItems } = get();
        if (filteredItems.length === 0) return;

        const prev = selectedIndex === 0 ? filteredItems.length - 1 : selectedIndex - 1;
        set({ selectedIndex: prev });
    },

    selectIndex: (index) => {
        set({ selectedIndex: index });
    },

    confirm: () => {
        const { filteredItems, selectedIndex } = get();
        const item = filteredItems[selectedIndex];

        if (!item) return;

        console.log('[QuickOpen] Confirm:', item);

        if (item.type === 'file' && item.path) {
            get().addRecentFile(item.path);
        }

        // In real implementation, open file/symbol/run command
        get().close();
    },

    setMode: (mode) => {
        const placeholder = getPlaceholder(mode);
        set({ mode, placeholder, query: '', filteredItems: [], selectedIndex: 0 });
    },

    addRecentFile: (path) => {
        set(state => {
            const recent = [path, ...state.recentFiles.filter(p => p !== path)].slice(0, 10);
            return { recentFiles: recent };
        });
    },

    clearRecentFiles: () => {
        set({ recentFiles: [] });
    },
}));

// =============================================================================
// HELPERS
// =============================================================================

function getPlaceholder(mode: QuickOpenMode): string {
    switch (mode) {
        case 'files': return 'Go to file... (@ for symbols, > for commands)';
        case 'symbols': return 'Go to symbol in editor...';
        case 'commands': return 'Run command...';
        case 'goto': return 'Go to line:column...';
    }
}

function getRecentItems(recentFiles: string[]): QuickOpenItem[] {
    return recentFiles.map((path, idx) => ({
        id: `recent_${idx}`,
        type: 'recent' as const,
        label: path.split('/').pop() || path,
        description: path,
        icon: '🕐',
        path,
    }));
}

function fuzzyMatch(query: string, text: string): number {
    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();

    if (lowerText === lowerQuery) return 100;
    if (lowerText.startsWith(lowerQuery)) return 90;
    if (lowerText.includes(lowerQuery)) return 70;

    // Simple fuzzy scoring
    let score = 0;
    let queryIdx = 0;

    for (let i = 0; i < lowerText.length && queryIdx < lowerQuery.length; i++) {
        if (lowerText[i] === lowerQuery[queryIdx]) {
            score += 10;
            queryIdx++;
        }
    }

    return queryIdx === lowerQuery.length ? score : 0;
}

function searchFiles(query: string): QuickOpenItem[] {
    // Mock file data
    const files = [
        'src/App.tsx',
        'src/components/Button.tsx',
        'src/components/Modal.tsx',
        'src/components/Sidebar.tsx',
        'src/hooks/useStore.ts',
        'src/hooks/useTheme.ts',
        'src/lib/api/client.ts',
        'src/lib/utils/helpers.ts',
        'src/styles/globals.css',
        'src/types/index.ts',
        'package.json',
        'tsconfig.json',
        'README.md',
    ];

    return files
        .map(path => ({
            path,
            score: fuzzyMatch(query, path.split('/').pop() || path),
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((item, idx) => ({
            id: `file_${idx}`,
            type: 'file' as const,
            label: item.path.split('/').pop() || item.path,
            description: item.path,
            icon: getFileIcon(item.path),
            path: item.path,
            score: item.score,
        }));
}

function searchSymbols(query: string): QuickOpenItem[] {
    // Mock symbols data
    const symbols = [
        { name: 'App', kind: 'function', path: 'src/App.tsx', line: 1 },
        { name: 'Button', kind: 'function', path: 'src/components/Button.tsx', line: 5 },
        { name: 'Modal', kind: 'function', path: 'src/components/Modal.tsx', line: 1 },
        { name: 'useStore', kind: 'function', path: 'src/hooks/useStore.ts', line: 10 },
        { name: 'useTheme', kind: 'function', path: 'src/hooks/useTheme.ts', line: 1 },
        { name: 'ApiClient', kind: 'class', path: 'src/lib/api/client.ts', line: 15 },
        { name: 'formatDate', kind: 'function', path: 'src/lib/utils/helpers.ts', line: 25 },
        { name: 'ButtonProps', kind: 'interface', path: 'src/types/index.ts', line: 1 },
    ];

    return symbols
        .map(sym => ({
            sym,
            score: fuzzyMatch(query, sym.name),
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((item, idx) => ({
            id: `symbol_${idx}`,
            type: 'symbol' as const,
            label: item.sym.name,
            description: `${item.sym.kind} in ${item.sym.path}`,
            icon: item.sym.kind === 'class' ? '🔷' : item.sym.kind === 'interface' ? '🔶' : '⚡',
            path: item.sym.path,
            range: { startLine: item.sym.line, endLine: item.sym.line + 10 },
            score: item.score,
        }));
}

function searchCommands(query: string): QuickOpenItem[] {
    // Mock commands
    const commands = [
        { id: 'file.save', label: 'Save', description: 'Save current file' },
        { id: 'file.saveAll', label: 'Save All', description: 'Save all open files' },
        { id: 'view.toggleSidebar', label: 'Toggle Sidebar', description: 'Show/hide sidebar' },
        { id: 'view.toggleTerminal', label: 'Toggle Terminal', description: 'Show/hide terminal' },
        { id: 'editor.formatDocument', label: 'Format Document', description: 'Format the current file' },
        { id: 'git.commit', label: 'Git: Commit', description: 'Commit staged changes' },
        { id: 'git.push', label: 'Git: Push', description: 'Push commits to remote' },
        { id: 'ai.explain', label: 'AI: Explain Code', description: 'Explain selected code' },
        { id: 'ai.refactor', label: 'AI: Refactor', description: 'Suggest refactoring' },
        { id: 'debug.start', label: 'Start Debugging', description: 'Start debug session' },
    ];

    return commands
        .map(cmd => ({
            cmd,
            score: fuzzyMatch(query, cmd.label),
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(item => ({
            id: item.cmd.id,
            type: 'command' as const,
            label: item.cmd.label,
            description: item.cmd.description,
            icon: '▶️',
            score: item.score,
        }));
}

function parseGotoLine(query: string): QuickOpenItem[] {
    const parts = query.split(':');
    const line = parseInt(parts[0], 10);
    const column = parts[1] ? parseInt(parts[1], 10) : 1;

    if (isNaN(line)) {
        return [];
    }

    return [{
        id: 'goto_line',
        type: 'command' as const,
        label: `Go to line ${line}${column > 1 ? `, column ${column}` : ''}`,
        icon: '📍',
    }];
}

function getFileIcon(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const icons: Record<string, string> = {
        ts: '📘',
        tsx: '⚛️',
        js: '📙',
        jsx: '⚛️',
        json: '📋',
        md: '📝',
        css: '🎨',
    };
    return icons[ext || ''] || '📄';
}
