/**
 * Quick File Opener
 * 
 * Phase 23: Cmd+P fuzzy file search
 * Cursor/VS Code-style quick open
 */

import { create } from 'zustand';

export interface QuickOpenItem {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'symbol' | 'command' | 'recent';
    icon?: string;
    description?: string;
    score?: number;
}

interface QuickOpenState {
    isOpen: boolean;
    query: string;
    items: QuickOpenItem[];
    filteredItems: QuickOpenItem[];
    selectedIndex: number;
    recentFiles: QuickOpenItem[];

    // Actions
    open: () => void;
    close: () => void;
    setQuery: (query: string) => void;
    selectNext: () => void;
    selectPrevious: () => void;
    selectItem: (index: number) => void;
    addRecentFile: (item: QuickOpenItem) => void;
    setItems: (items: QuickOpenItem[]) => void;
}

/**
 * Fuzzy match scoring
 */
function fuzzyScore(query: string, target: string): number {
    if (!query) return 0;

    const queryLower = query.toLowerCase();
    const targetLower = target.toLowerCase();

    // Exact match
    if (targetLower === queryLower) return 100;

    // Starts with
    if (targetLower.startsWith(queryLower)) return 90;

    // Contains
    if (targetLower.includes(queryLower)) return 70;

    // Fuzzy match
    let score = 0;
    let queryIndex = 0;
    let consecutiveMatches = 0;

    for (let i = 0; i < targetLower.length && queryIndex < queryLower.length; i++) {
        if (targetLower[i] === queryLower[queryIndex]) {
            score += 10 + consecutiveMatches * 5;
            consecutiveMatches++;
            queryIndex++;
        } else {
            consecutiveMatches = 0;
        }
    }

    // Penalize for unmatched query characters
    if (queryIndex < queryLower.length) {
        return 0;
    }

    return score;
}

/**
 * Filter and rank items by query
 */
function filterItems(items: QuickOpenItem[], query: string): QuickOpenItem[] {
    if (!query) {
        return items.slice(0, 20);
    }

    const scored = items
        .map(item => ({
            ...item,
            score: Math.max(
                fuzzyScore(query, item.name),
                fuzzyScore(query, item.path) * 0.5
            ),
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score);

    return scored.slice(0, 20);
}

export const useQuickOpenStore = create<QuickOpenState>((set, get) => ({
    isOpen: false,
    query: '',
    items: [],
    filteredItems: [],
    selectedIndex: 0,
    recentFiles: [],

    open: () => {
        const { recentFiles, items } = get();
        // Show recent files when opening with no query
        const initial = recentFiles.length > 0 ? recentFiles : items.slice(0, 10);
        set({
            isOpen: true,
            query: '',
            selectedIndex: 0,
            filteredItems: initial,
        });
    },

    close: () => set({ isOpen: false, query: '', selectedIndex: 0 }),

    setQuery: (query: string) => {
        const { items, recentFiles } = get();
        const allItems = [...recentFiles, ...items];
        const filtered = filterItems(allItems, query);
        set({ query, filteredItems: filtered, selectedIndex: 0 });
    },

    selectNext: () => {
        const { selectedIndex, filteredItems } = get();
        const newIndex = Math.min(selectedIndex + 1, filteredItems.length - 1);
        set({ selectedIndex: newIndex });
    },

    selectPrevious: () => {
        const { selectedIndex } = get();
        const newIndex = Math.max(selectedIndex - 1, 0);
        set({ selectedIndex: newIndex });
    },

    selectItem: (index: number) => set({ selectedIndex: index }),

    addRecentFile: (item: QuickOpenItem) => {
        const { recentFiles } = get();
        const filtered = recentFiles.filter(f => f.path !== item.path);
        const recent: QuickOpenItem = { ...item, type: 'recent' };
        set({ recentFiles: [recent, ...filtered].slice(0, 10) });
    },

    setItems: (items: QuickOpenItem[]) => {
        const { query } = get();
        const filtered = filterItems(items, query);
        set({ items, filteredItems: filtered });
    },
}));

/**
 * Get icon for quick open item type
 */
export function getQuickOpenIcon(item: QuickOpenItem): string {
    switch (item.type) {
        case 'recent': return '🕐';
        case 'symbol': return '🔷';
        case 'command': return '⚡';
        case 'file':
        default:
            return item.icon || '📄';
    }
}

/**
 * Format path for display (truncate if too long)
 */
export function formatPathForDisplay(path: string, maxLength: number = 50): string {
    if (path.length <= maxLength) return path;

    const parts = path.split('/');
    if (parts.length <= 3) return path;

    const start = parts.slice(0, 2).join('/');
    const end = parts.slice(-2).join('/');

    return `${start}/.../${end}`;
}

/**
 * Keyboard shortcut handler for quick open
 */
export function createQuickOpenKeyHandler(
    onSelect: (item: QuickOpenItem) => void
): (e: KeyboardEvent) => void {
    return (e: KeyboardEvent) => {
        const store = useQuickOpenStore.getState();

        if (!store.isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                store.selectNext();
                break;
            case 'ArrowUp':
                e.preventDefault();
                store.selectPrevious();
                break;
            case 'Enter':
                e.preventDefault();
                const selected = store.filteredItems[store.selectedIndex];
                if (selected) {
                    onSelect(selected);
                    store.addRecentFile(selected);
                    store.close();
                }
                break;
            case 'Escape':
                e.preventDefault();
                store.close();
                break;
        }
    };
}
