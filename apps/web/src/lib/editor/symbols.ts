/**
 * Symbol Navigation
 * 
 * Phase 24: Outline panel with functions/classes and jump-to-definition
 * Cursor/VS Code-style symbol navigation
 */

import { create } from 'zustand';

export type SymbolKind =
    | 'file' | 'module' | 'namespace' | 'package'
    | 'class' | 'method' | 'property' | 'field'
    | 'constructor' | 'enum' | 'interface' | 'function'
    | 'variable' | 'constant' | 'string' | 'number'
    | 'boolean' | 'array' | 'object' | 'key'
    | 'null' | 'struct' | 'event' | 'operator' | 'type';

export interface DocumentSymbol {
    name: string;
    kind: SymbolKind;
    detail?: string;
    range: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
    selectionRange: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
    children?: DocumentSymbol[];
}

export interface SymbolMatch {
    symbol: DocumentSymbol;
    path: string;
    score: number;
}

interface SymbolState {
    symbols: Record<string, DocumentSymbol[]>; // path -> symbols
    isLoading: boolean;
    error: string | null;

    // Actions
    setSymbols: (path: string, symbols: DocumentSymbol[]) => void;
    clearSymbols: (path: string) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;

    // Getters
    getSymbols: (path: string) => DocumentSymbol[];
    searchSymbols: (query: string, limit?: number) => SymbolMatch[];
}

const SYMBOL_ICONS: Record<SymbolKind, string> = {
    file: '📄',
    module: '📦',
    namespace: '🗂️',
    package: '📦',
    class: '🔷',
    method: '🔹',
    property: '🔸',
    field: '🔸',
    constructor: '🔧',
    enum: '🔢',
    interface: '🔶',
    function: '⚡',
    variable: '📌',
    constant: '🔒',
    string: '📝',
    number: '🔢',
    boolean: '✓',
    array: '[]',
    object: '{}',
    key: '🔑',
    null: '∅',
    struct: '🏗️',
    event: '📡',
    operator: '±',
    type: '🅃',
};

export function getSymbolIcon(kind: SymbolKind): string {
    return SYMBOL_ICONS[kind] || '•';
}

export const useSymbolStore = create<SymbolState>((set, get) => ({
    symbols: {},
    isLoading: false,
    error: null,

    setSymbols: (path, symbols) => {
        set((state) => ({
            symbols: { ...state.symbols, [path]: symbols },
            error: null,
        }));
    },

    clearSymbols: (path) => {
        set((state) => {
            const { [path]: _, ...rest } = state.symbols;
            return { symbols: rest };
        });
    },

    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    getSymbols: (path) => {
        return get().symbols[path] || [];
    },

    searchSymbols: (query, limit = 50) => {
        const results: SymbolMatch[] = [];
        const queryLower = query.toLowerCase();

        const searchInSymbols = (
            symbols: DocumentSymbol[],
            path: string
        ) => {
            for (const symbol of symbols) {
                const nameLower = symbol.name.toLowerCase();

                if (nameLower.includes(queryLower)) {
                    // Calculate match score
                    let score = 0;
                    if (nameLower === queryLower) score = 100;
                    else if (nameLower.startsWith(queryLower)) score = 80;
                    else score = 50;

                    // Boost important symbols
                    if (['class', 'interface', 'function', 'method'].includes(symbol.kind)) {
                        score += 10;
                    }

                    results.push({ symbol, path, score });
                }

                if (symbol.children) {
                    searchInSymbols(symbol.children, path);
                }
            }
        };

        for (const [path, symbols] of Object.entries(get().symbols)) {
            searchInSymbols(symbols, path);
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    },
}));

/**
 * Parse TypeScript/JavaScript symbols (simplified)
 * In production, use Monaco's language service or tree-sitter
 */
export function parseSymbols(code: string, _language: string): DocumentSymbol[] {
    const symbols: DocumentSymbol[] = [];
    const lines = code.split('\n');

    // Simple regex patterns for common symbols
    const patterns: { regex: RegExp; kind: SymbolKind }[] = [
        { regex: /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/m, kind: 'class' },
        { regex: /^(?:export\s+)?interface\s+(\w+)/m, kind: 'interface' },
        { regex: /^(?:export\s+)?type\s+(\w+)/m, kind: 'type' },
        { regex: /^(?:export\s+)?enum\s+(\w+)/m, kind: 'enum' },
        { regex: /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/m, kind: 'function' },
        { regex: /^(?:export\s+)?const\s+(\w+)\s*=/m, kind: 'constant' },
        { regex: /^(?:export\s+)?let\s+(\w+)\s*=/m, kind: 'variable' },
    ];

    lines.forEach((line, lineIndex) => {
        for (const { regex, kind } of patterns) {
            const match = line.match(regex);
            if (match) {
                symbols.push({
                    name: match[1],
                    kind,
                    range: {
                        startLine: lineIndex + 1,
                        startColumn: 0,
                        endLine: lineIndex + 1,
                        endColumn: line.length,
                    },
                    selectionRange: {
                        startLine: lineIndex + 1,
                        startColumn: line.indexOf(match[1]),
                        endLine: lineIndex + 1,
                        endColumn: line.indexOf(match[1]) + match[1].length,
                    },
                });
                break;
            }
        }
    });

    return symbols;
}

/**
 * Flatten symbol tree
 */
export function flattenSymbols(symbols: DocumentSymbol[]): DocumentSymbol[] {
    const result: DocumentSymbol[] = [];

    const flatten = (syms: DocumentSymbol[]) => {
        for (const sym of syms) {
            result.push(sym);
            if (sym.children) flatten(sym.children);
        }
    };

    flatten(symbols);
    return result;
}
