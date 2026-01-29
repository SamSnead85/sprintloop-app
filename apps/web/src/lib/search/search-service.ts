/**
 * Search & Replace Service
 * 
 * Global search and replace across the project.
 */

import { create } from 'zustand';
import * as tauri from '../tauri/tauri-commands';
import { useCodebaseIndex } from '../ai/codebase-index';

// =============================================================================
// TYPES
// =============================================================================

export interface SearchMatch {
    filePath: string;
    line: number;
    column: number;
    lineContent: string;
    matchText: string;
    beforeMatch: string;
    afterMatch: string;
}

export interface SearchResult {
    filePath: string;
    fileName: string;
    matches: SearchMatch[];
    collapsed: boolean;
}

export interface SearchOptions {
    caseSensitive: boolean;
    wholeWord: boolean;
    useRegex: boolean;
    includePattern: string;
    excludePattern: string;
    maxResults: number;
}

export interface SearchState {
    query: string;
    replaceText: string;
    options: SearchOptions;
    results: SearchResult[];
    totalMatches: number;
    isSearching: boolean;
    selectedMatch: { filePath: string; line: number } | null;

    // Actions
    setQuery: (query: string) => void;
    setReplaceText: (text: string) => void;
    setOptions: (options: Partial<SearchOptions>) => void;
    search: () => Promise<void>;
    replaceMatch: (filePath: string, line: number) => Promise<void>;
    replaceAll: () => Promise<void>;
    replaceInFile: (filePath: string) => Promise<void>;
    toggleCollapse: (filePath: string) => void;
    selectMatch: (filePath: string, line: number) => void;
    clearResults: () => void;
}

const DEFAULT_OPTIONS: SearchOptions = {
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    includePattern: '',
    excludePattern: '**/node_modules/**,**/.git/**,**/dist/**',
    maxResults: 1000,
};

// =============================================================================
// SEARCH STORE
// =============================================================================

export const useSearch = create<SearchState>((set, get) => ({
    query: '',
    replaceText: '',
    options: DEFAULT_OPTIONS,
    results: [],
    totalMatches: 0,
    isSearching: false,
    selectedMatch: null,

    setQuery: (query) => set({ query }),
    setReplaceText: (replaceText) => set({ replaceText }),

    setOptions: (newOptions) => set(state => ({
        options: { ...state.options, ...newOptions },
    })),

    search: async () => {
        const { query, options } = get();

        if (!query.trim()) {
            set({ results: [], totalMatches: 0 });
            return;
        }

        set({ isSearching: true });

        try {
            // Use codebase index if available
            const { files } = useCodebaseIndex.getState();
            const results: SearchResult[] = [];
            let totalMatches = 0;

            const regex = buildSearchRegex(query, options);

            for (const [filePath, fileNode] of files) {
                if (!shouldIncludeFile(filePath, options)) continue;

                const content = fileNode.content || await tauri.readFile(filePath);
                const matches = findMatches(content, regex, filePath);

                if (matches.length > 0) {
                    results.push({
                        filePath,
                        fileName: filePath.split('/').pop() || filePath,
                        matches,
                        collapsed: false,
                    });
                    totalMatches += matches.length;
                }

                if (totalMatches >= options.maxResults) break;
            }

            set({ results, totalMatches, isSearching: false });
        } catch (error) {
            console.error('[Search] Failed:', error);
            set({ isSearching: false });
        }
    },

    replaceMatch: async (filePath: string, line: number) => {
        const { query, replaceText, options, results } = get();

        try {
            const content = await tauri.readFile(filePath);
            const lines = content.split('\n');

            const regex = buildSearchRegex(query, options);
            lines[line - 1] = lines[line - 1].replace(regex, replaceText);

            await tauri.writeFile(filePath, lines.join('\n'));

            // Update results
            const newResults = results.map(r => {
                if (r.filePath === filePath) {
                    return {
                        ...r,
                        matches: r.matches.filter(m => m.line !== line),
                    };
                }
                return r;
            }).filter(r => r.matches.length > 0);

            set({
                results: newResults,
                totalMatches: get().totalMatches - 1,
            });
        } catch (error) {
            console.error('[Search] Replace failed:', error);
        }
    },

    replaceAll: async () => {
        const { results } = get();

        for (const result of results) {
            await get().replaceInFile(result.filePath);
        }

        set({ results: [], totalMatches: 0 });
    },

    replaceInFile: async (filePath: string) => {
        const { query, replaceText, options, results } = get();

        try {
            const content = await tauri.readFile(filePath);
            const regex = buildSearchRegex(query, { ...options, useRegex: true });
            const newContent = content.replace(new RegExp(regex.source, 'g' + (options.caseSensitive ? '' : 'i')), replaceText);

            await tauri.writeFile(filePath, newContent);

            // Remove from results
            const result = results.find(r => r.filePath === filePath);
            const removedCount = result?.matches.length || 0;

            set({
                results: results.filter(r => r.filePath !== filePath),
                totalMatches: get().totalMatches - removedCount,
            });
        } catch (error) {
            console.error('[Search] Replace in file failed:', error);
        }
    },

    toggleCollapse: (filePath: string) => {
        set(state => ({
            results: state.results.map(r =>
                r.filePath === filePath ? { ...r, collapsed: !r.collapsed } : r
            ),
        }));
    },

    selectMatch: (filePath: string, line: number) => {
        set({ selectedMatch: { filePath, line } });
    },

    clearResults: () => {
        set({ results: [], totalMatches: 0, selectedMatch: null });
    },
}));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function buildSearchRegex(query: string, options: SearchOptions): RegExp {
    let pattern = options.useRegex ? query : escapeRegex(query);

    if (options.wholeWord) {
        pattern = `\\b${pattern}\\b`;
    }

    const flags = options.caseSensitive ? 'g' : 'gi';

    return new RegExp(pattern, flags);
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shouldIncludeFile(filePath: string, options: SearchOptions): boolean {
    const { includePattern, excludePattern } = options;

    // Check exclude patterns
    if (excludePattern) {
        const excludes = excludePattern.split(',').map(p => p.trim());
        for (const pattern of excludes) {
            if (matchGlob(filePath, pattern)) return false;
        }
    }

    // Check include patterns
    if (includePattern) {
        const includes = includePattern.split(',').map(p => p.trim());
        for (const pattern of includes) {
            if (matchGlob(filePath, pattern)) return true;
        }
        return false;
    }

    return true;
}

function matchGlob(path: string, pattern: string): boolean {
    // Simple glob matching (** = any path, * = any segment)
    const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\//g, '\\/');

    return new RegExp(regexPattern).test(path);
}

function findMatches(content: string, regex: RegExp, filePath: string): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        let match;

        // Reset regex for each line
        regex.lastIndex = 0;

        while ((match = regex.exec(line)) !== null) {
            matches.push({
                filePath,
                line: i + 1,
                column: match.index + 1,
                lineContent: line,
                matchText: match[0],
                beforeMatch: line.slice(Math.max(0, match.index - 20), match.index),
                afterMatch: line.slice(match.index + match[0].length, match.index + match[0].length + 20),
            });

            // Prevent infinite loop for zero-width matches
            if (match[0].length === 0) break;
        }
    }

    return matches;
}
