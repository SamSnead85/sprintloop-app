/**
 * Search Panel Service
 * 
 * Advanced search with filters, regex, and workspace-wide search.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface SearchMatch {
    filePath: string;
    line: number;
    column: number;
    length: number;
    preview: string;
    previewStart: number;
}

export interface SearchResult {
    filePath: string;
    matches: SearchMatch[];
    collapsed: boolean;
}

export interface SearchOptions {
    query: string;
    isRegex: boolean;
    isCaseSensitive: boolean;
    isWholeWord: boolean;
    includePattern: string;
    excludePattern: string;
    useGitIgnore: boolean;
    maxResults: number;
}

export interface ReplaceOptions extends SearchOptions {
    replacement: string;
    preserveCase: boolean;
}

export interface SearchState {
    query: string;
    replacement: string;
    options: SearchOptions;
    results: SearchResult[];
    totalMatches: number;
    isSearching: boolean;
    currentMatchIndex: number;
    searchHistory: string[];
    replaceHistory: string[];

    // Search
    search: (query?: string) => Promise<void>;
    clearSearch: () => void;

    // Navigation
    goToNextMatch: () => void;
    goToPreviousMatch: () => void;
    goToMatch: (index: number) => void;

    // Replace
    replaceMatch: () => Promise<void>;
    replaceAll: () => Promise<void>;

    // Options
    setQuery: (query: string) => void;
    setReplacement: (replacement: string) => void;
    updateOptions: (options: Partial<SearchOptions>) => void;
    toggleOption: (option: keyof Pick<SearchOptions, 'isRegex' | 'isCaseSensitive' | 'isWholeWord' | 'useGitIgnore'>) => void;

    // Results
    toggleResultCollapse: (filePath: string) => void;
    collapseAll: () => void;
    expandAll: () => void;

    // History
    addToHistory: (query: string, isReplace?: boolean) => void;
    getHistorySuggestions: (query: string, isReplace?: boolean) => string[];
}

// =============================================================================
// SEARCH STORE
// =============================================================================

export const useSearchPanel = create<SearchState>((set, get) => ({
    query: '',
    replacement: '',
    options: {
        query: '',
        isRegex: false,
        isCaseSensitive: false,
        isWholeWord: false,
        includePattern: '',
        excludePattern: '**/node_modules/**',
        useGitIgnore: true,
        maxResults: 500,
    },
    results: [],
    totalMatches: 0,
    isSearching: false,
    currentMatchIndex: 0,
    searchHistory: [],
    replaceHistory: [],

    search: async (query) => {
        const searchQuery = query ?? get().query;
        if (!searchQuery.trim()) {
            set({ results: [], totalMatches: 0 });
            return;
        }

        set({ isSearching: true, query: searchQuery });
        get().addToHistory(searchQuery);

        try {
            // Simulate search
            await new Promise(resolve => setTimeout(resolve, 200));

            const results = simulateSearch(searchQuery, get().options);
            const totalMatches = results.reduce((sum, r) => sum + r.matches.length, 0);

            set({
                results,
                totalMatches,
                isSearching: false,
                currentMatchIndex: totalMatches > 0 ? 0 : -1,
            });
        } catch (error) {
            console.error('[Search] Search failed:', error);
            set({ isSearching: false });
        }
    },

    clearSearch: () => {
        set({
            query: '',
            replacement: '',
            results: [],
            totalMatches: 0,
            currentMatchIndex: 0,
        });
    },

    goToNextMatch: () => {
        const { currentMatchIndex, totalMatches } = get();
        if (totalMatches === 0) return;

        const next = (currentMatchIndex + 1) % totalMatches;
        set({ currentMatchIndex: next });
        navigateToMatchIndex(get().results, next);
    },

    goToPreviousMatch: () => {
        const { currentMatchIndex, totalMatches } = get();
        if (totalMatches === 0) return;

        const prev = currentMatchIndex === 0 ? totalMatches - 1 : currentMatchIndex - 1;
        set({ currentMatchIndex: prev });
        navigateToMatchIndex(get().results, prev);
    },

    goToMatch: (index) => {
        const { totalMatches } = get();
        if (index < 0 || index >= totalMatches) return;

        set({ currentMatchIndex: index });
        navigateToMatchIndex(get().results, index);
    },

    replaceMatch: async () => {
        const { currentMatchIndex, replacement, results } = get();
        if (currentMatchIndex < 0 || !replacement) return;

        // Find current match
        let count = 0;
        for (const result of results) {
            for (const match of result.matches) {
                if (count === currentMatchIndex) {
                    console.log('[Search] Replace at:', match.filePath, match.line, match.column);
                    console.log('[Search] Replace with:', replacement);

                    // In real implementation, apply replace to file
                    // Then refresh search
                    await get().search();
                    return;
                }
                count++;
            }
        }
    },

    replaceAll: async () => {
        const { replacement, results } = get();
        if (!replacement || results.length === 0) return;

        get().addToHistory(replacement, true);

        console.log('[Search] Replacing all', results.length, 'files with:', replacement);

        // In real implementation, apply all replacements
        // Then clear results
        set({ results: [], totalMatches: 0, currentMatchIndex: -1 });
    },

    setQuery: (query) => {
        set({ query });
        // Debounced search in real implementation
    },

    setReplacement: (replacement) => {
        set({ replacement });
    },

    updateOptions: (updates) => {
        set(state => ({
            options: { ...state.options, ...updates },
        }));
    },

    toggleOption: (option) => {
        set(state => ({
            options: { ...state.options, [option]: !state.options[option] },
        }));
    },

    toggleResultCollapse: (filePath) => {
        set(state => ({
            results: state.results.map(r =>
                r.filePath === filePath ? { ...r, collapsed: !r.collapsed } : r
            ),
        }));
    },

    collapseAll: () => {
        set(state => ({
            results: state.results.map(r => ({ ...r, collapsed: true })),
        }));
    },

    expandAll: () => {
        set(state => ({
            results: state.results.map(r => ({ ...r, collapsed: false })),
        }));
    },

    addToHistory: (query, isReplace = false) => {
        if (!query.trim()) return;

        set(state => {
            const key = isReplace ? 'replaceHistory' : 'searchHistory';
            const history = state[key].filter(h => h !== query);
            return { [key]: [query, ...history].slice(0, 20) };
        });
    },

    getHistorySuggestions: (query, isReplace = false) => {
        const history = isReplace ? get().replaceHistory : get().searchHistory;
        if (!query) return history.slice(0, 5);

        return history
            .filter(h => h.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 5);
    },
}));

// =============================================================================
// HELPERS
// =============================================================================

function simulateSearch(query: string, options: SearchOptions): SearchResult[] {
    // Simulate search results
    const mockFiles = [
        'src/App.tsx',
        'src/components/Button.tsx',
        'src/components/Modal.tsx',
        'src/hooks/useStore.ts',
        'src/utils/helpers.ts',
        'src/api/client.ts',
        'src/types/index.ts',
    ];

    const results: SearchResult[] = [];

    for (const filePath of mockFiles) {
        if (Math.random() > 0.5) continue;

        const matchCount = Math.floor(Math.random() * 5) + 1;
        const matches: SearchMatch[] = [];

        for (let i = 0; i < matchCount; i++) {
            const line = Math.floor(Math.random() * 100) + 1;
            const column = Math.floor(Math.random() * 40) + 1;

            matches.push({
                filePath,
                line,
                column,
                length: query.length,
                preview: generatePreviewLine(query, column),
                previewStart: Math.max(0, column - 20),
            });
        }

        if (matches.length > 0) {
            results.push({
                filePath,
                matches: matches.sort((a, b) => a.line - b.line),
                collapsed: false,
            });
        }
    }

    return results.slice(0, options.maxResults);
}

function generatePreviewLine(query: string, column: number): string {
    const before = 'const result = await fetchData('.padStart(column - 1);
    const after = '); // Handle response';
    return before + query + after;
}

function navigateToMatchIndex(results: SearchResult[], index: number): void {
    let count = 0;
    for (const result of results) {
        for (const match of result.matches) {
            if (count === index) {
                console.log('[Search] Navigate to:', match.filePath, match.line, match.column);
                // In real implementation, open file and scroll to position
                return;
            }
            count++;
        }
    }
}

// =============================================================================
// REGEX HELPERS
// =============================================================================

export function buildSearchRegex(
    query: string,
    options: Pick<SearchOptions, 'isRegex' | 'isCaseSensitive' | 'isWholeWord'>
): RegExp | null {
    try {
        let pattern = options.isRegex ? query : escapeRegex(query);

        if (options.isWholeWord) {
            pattern = `\\b${pattern}\\b`;
        }

        const flags = options.isCaseSensitive ? 'g' : 'gi';
        return new RegExp(pattern, flags);
    } catch {
        return null;
    }
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightMatches(
    text: string,
    query: string,
    options: Pick<SearchOptions, 'isRegex' | 'isCaseSensitive' | 'isWholeWord'>
): { text: string; isMatch: boolean }[] {
    const regex = buildSearchRegex(query, options);
    if (!regex) return [{ text, isMatch: false }];

    const parts: { text: string; isMatch: boolean }[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ text: text.slice(lastIndex, match.index), isMatch: false });
        }
        parts.push({ text: match[0], isMatch: true });
        lastIndex = match.index + match[0].length;

        // Prevent infinite loop on zero-length matches
        if (match[0].length === 0) break;
    }

    if (lastIndex < text.length) {
        parts.push({ text: text.slice(lastIndex), isMatch: false });
    }

    return parts.length > 0 ? parts : [{ text, isMatch: false }];
}
