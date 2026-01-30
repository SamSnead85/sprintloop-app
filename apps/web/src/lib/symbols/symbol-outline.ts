/**
 * Symbol Outline Service
 * 
 * Document symbol navigation and outline view with hierarchy support.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type SymbolKind =
    | 'file'
    | 'module'
    | 'namespace'
    | 'package'
    | 'class'
    | 'method'
    | 'property'
    | 'field'
    | 'constructor'
    | 'enum'
    | 'interface'
    | 'function'
    | 'variable'
    | 'constant'
    | 'string'
    | 'number'
    | 'boolean'
    | 'array'
    | 'object'
    | 'key'
    | 'null'
    | 'enumMember'
    | 'struct'
    | 'event'
    | 'operator'
    | 'typeParameter';

export interface DocumentSymbol {
    name: string;
    detail?: string;
    kind: SymbolKind;
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
    children: DocumentSymbol[];
}

export interface SymbolLocation {
    path: string;
    line: number;
    column: number;
}

export interface WorkspaceSymbol {
    name: string;
    kind: SymbolKind;
    location: SymbolLocation;
    containerName?: string;
}

export interface SymbolOutlineState {
    documentSymbols: Map<string, DocumentSymbol[]>;
    workspaceSymbols: WorkspaceSymbol[];
    isLoading: boolean;
    expandedNodes: Set<string>;
    selectedSymbol: string | null;
    filter: string;
    sortBy: 'position' | 'name' | 'kind';

    // Document Symbols
    getSymbols: (filePath: string) => Promise<DocumentSymbol[]>;
    refreshSymbols: (filePath: string) => Promise<void>;
    clearSymbols: (filePath?: string) => void;

    // Workspace Symbols
    searchWorkspaceSymbols: (query: string) => Promise<WorkspaceSymbol[]>;

    // Navigation
    goToSymbol: (symbol: DocumentSymbol | WorkspaceSymbol) => void;
    selectSymbol: (symbolId: string | null) => void;

    // UI State
    toggleExpanded: (nodeId: string) => void;
    expandAll: () => void;
    collapseAll: () => void;
    setFilter: (filter: string) => void;
    setSortBy: (sortBy: 'position' | 'name' | 'kind') => void;

    // Utilities
    getSymbolIcon: (kind: SymbolKind) => string;
    getSymbolColor: (kind: SymbolKind) => string;
    flattenSymbols: (symbols: DocumentSymbol[]) => DocumentSymbol[];
}

// =============================================================================
// SYMBOL STORE
// =============================================================================

export const useSymbolOutline = create<SymbolOutlineState>((set, get) => ({
    documentSymbols: new Map(),
    workspaceSymbols: [],
    isLoading: false,
    expandedNodes: new Set(),
    selectedSymbol: null,
    filter: '',
    sortBy: 'position',

    getSymbols: async (filePath) => {
        const cached = get().documentSymbols.get(filePath);
        if (cached) return cached;

        set({ isLoading: true });

        try {
            // In real implementation, request from LSP
            const symbols = await parseDocumentSymbols(filePath);

            set(state => {
                const documentSymbols = new Map(state.documentSymbols);
                documentSymbols.set(filePath, symbols);
                return { documentSymbols, isLoading: false };
            });

            return symbols;
        } catch (error) {
            console.error('[SymbolOutline] Failed to get symbols:', error);
            set({ isLoading: false });
            return [];
        }
    },

    refreshSymbols: async (filePath) => {
        set(state => {
            const documentSymbols = new Map(state.documentSymbols);
            documentSymbols.delete(filePath);
            return { documentSymbols };
        });
        await get().getSymbols(filePath);
    },

    clearSymbols: (filePath) => {
        set(state => {
            const documentSymbols = new Map(state.documentSymbols);
            if (filePath) {
                documentSymbols.delete(filePath);
            } else {
                documentSymbols.clear();
            }
            return { documentSymbols };
        });
    },

    searchWorkspaceSymbols: async (query) => {
        if (query.length < 2) return [];

        set({ isLoading: true });

        try {
            // In real implementation, search via LSP
            const results = await searchSymbols(query);
            set({ workspaceSymbols: results, isLoading: false });
            return results;
        } catch (error) {
            console.error('[SymbolOutline] Symbol search failed:', error);
            set({ isLoading: false });
            return [];
        }
    },

    goToSymbol: (symbol) => {
        // In real implementation, navigate editor to symbol location
        if ('location' in symbol) {
            console.log('[SymbolOutline] Navigate to:', symbol.location);
        } else {
            console.log('[SymbolOutline] Navigate to:', symbol.selectionRange);
        }
    },

    selectSymbol: (symbolId) => {
        set({ selectedSymbol: symbolId });
    },

    toggleExpanded: (nodeId) => {
        set(state => {
            const expandedNodes = new Set(state.expandedNodes);
            if (expandedNodes.has(nodeId)) {
                expandedNodes.delete(nodeId);
            } else {
                expandedNodes.add(nodeId);
            }
            return { expandedNodes };
        });
    },

    expandAll: () => {
        const allNodeIds: string[] = [];

        const collectIds = (symbols: DocumentSymbol[], prefix = '') => {
            symbols.forEach((s, i) => {
                const id = `${prefix}${i}`;
                allNodeIds.push(id);
                if (s.children.length > 0) {
                    collectIds(s.children, `${id}-`);
                }
            });
        };

        for (const symbols of get().documentSymbols.values()) {
            collectIds(symbols);
        }

        set({ expandedNodes: new Set(allNodeIds) });
    },

    collapseAll: () => {
        set({ expandedNodes: new Set() });
    },

    setFilter: (filter) => {
        set({ filter });
    },

    setSortBy: (sortBy) => {
        set({ sortBy });
    },

    getSymbolIcon: (kind) => SYMBOL_ICONS[kind] || '📦',

    getSymbolColor: (kind) => SYMBOL_COLORS[kind] || '#808080',

    flattenSymbols: (symbols) => {
        const result: DocumentSymbol[] = [];

        const flatten = (items: DocumentSymbol[]) => {
            for (const item of items) {
                result.push(item);
                if (item.children.length > 0) {
                    flatten(item.children);
                }
            }
        };

        flatten(symbols);
        return result;
    },
}));

// =============================================================================
// CONSTANTS
// =============================================================================

const SYMBOL_ICONS: Record<SymbolKind, string> = {
    file: '📄',
    module: '📦',
    namespace: '🏷️',
    package: '📦',
    class: '🔷',
    method: '🔹',
    property: '🔸',
    field: '🔸',
    constructor: '🔨',
    enum: '📊',
    interface: '🔶',
    function: 'ƒ',
    variable: '📌',
    constant: '🔒',
    string: '📝',
    number: '#',
    boolean: '⚡',
    array: '[]',
    object: '{}',
    key: '🔑',
    null: '∅',
    enumMember: '📊',
    struct: '🏗️',
    event: '⚡',
    operator: '±',
    typeParameter: 'T',
};

const SYMBOL_COLORS: Record<SymbolKind, string> = {
    file: '#6B7280',
    module: '#3B82F6',
    namespace: '#8B5CF6',
    package: '#3B82F6',
    class: '#F59E0B',
    method: '#10B981',
    property: '#6366F1',
    field: '#6366F1',
    constructor: '#F59E0B',
    enum: '#EC4899',
    interface: '#14B8A6',
    function: '#10B981',
    variable: '#3B82F6',
    constant: '#EF4444',
    string: '#10B981',
    number: '#F59E0B',
    boolean: '#8B5CF6',
    array: '#6366F1',
    object: '#6366F1',
    key: '#F59E0B',
    null: '#6B7280',
    enumMember: '#EC4899',
    struct: '#F59E0B',
    event: '#EF4444',
    operator: '#6B7280',
    typeParameter: '#14B8A6',
};

// =============================================================================
// MOCK PARSERS
// =============================================================================

async function parseDocumentSymbols(filePath: string): Promise<DocumentSymbol[]> {
    await new Promise(resolve => setTimeout(resolve, 50));

    // Generate mock symbols based on file extension
    const ext = filePath.split('.').pop()?.toLowerCase();

    if (ext === 'tsx' || ext === 'jsx') {
        return generateReactSymbols(filePath);
    } else if (ext === 'ts' || ext === 'js') {
        return generateTypescriptSymbols(filePath);
    } else if (ext === 'css' || ext === 'scss') {
        return generateCssSymbols();
    }

    return [];
}

function generateTypescriptSymbols(filePath: string): DocumentSymbol[] {
    const baseName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Module';

    return [
        createSymbol('imports', 'module', 1, 1, 10, []),
        createSymbol(baseName, 'class', 12, 12, 150, [
            createSymbol('constructor', 'constructor', 15, 15, 25, []),
            createSymbol('state', 'property', 28, 28, 35, []),
            createSymbol('initialize', 'method', 38, 38, 55, []),
            createSymbol('render', 'method', 58, 58, 100, []),
            createSymbol('handleEvent', 'method', 103, 103, 120, []),
            createSymbol('dispose', 'method', 123, 123, 145, []),
        ]),
        createSymbol('helperFunction', 'function', 155, 155, 180, []),
        createSymbol('CONFIG', 'constant', 185, 185, 195, []),
    ];
}

function generateReactSymbols(filePath: string): DocumentSymbol[] {
    const componentName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Component';

    return [
        createSymbol('imports', 'module', 1, 1, 8, []),
        createSymbol(`${componentName}Props`, 'interface', 10, 10, 18, [
            createSymbol('className', 'property', 11, 11, 11, []),
            createSymbol('children', 'property', 12, 12, 12, []),
            createSymbol('onAction', 'property', 13, 13, 13, []),
        ]),
        createSymbol(componentName, 'function', 20, 20, 85, [
            createSymbol('useState', 'variable', 22, 22, 22, []),
            createSymbol('useEffect', 'function', 25, 25, 35, []),
            createSymbol('handleClick', 'function', 38, 38, 45, []),
            createSymbol('render', 'function', 48, 48, 82, []),
        ]),
        createSymbol('styles', 'constant', 90, 90, 105, []),
    ];
}

function generateCssSymbols(): DocumentSymbol[] {
    return [
        createSymbol('.container', 'class', 1, 1, 15, []),
        createSymbol('.header', 'class', 18, 18, 35, []),
        createSymbol('.content', 'class', 38, 38, 55, [
            createSymbol('&__title', 'class', 40, 40, 45, []),
            createSymbol('&__body', 'class', 48, 48, 53, []),
        ]),
        createSymbol('.footer', 'class', 58, 58, 75, []),
        createSymbol('@media', 'namespace', 78, 78, 100, []),
    ];
}

function createSymbol(
    name: string,
    kind: SymbolKind,
    startLine: number,
    selectionLine: number,
    endLine: number,
    children: DocumentSymbol[]
): DocumentSymbol {
    return {
        name,
        kind,
        range: { startLine, startColumn: 0, endLine, endColumn: 0 },
        selectionRange: { startLine: selectionLine, startColumn: 0, endLine: selectionLine, endColumn: name.length },
        children,
    };
}

async function searchSymbols(query: string): Promise<WorkspaceSymbol[]> {
    await new Promise(resolve => setTimeout(resolve, 100));

    const lowerQuery = query.toLowerCase();

    // Mock workspace symbols
    const allSymbols: WorkspaceSymbol[] = [
        { name: 'App', kind: 'function', location: { path: 'src/App.tsx', line: 15, column: 1 }, containerName: 'App.tsx' },
        { name: 'useStore', kind: 'function', location: { path: 'src/store.ts', line: 10, column: 1 } },
        { name: 'Button', kind: 'function', location: { path: 'src/components/Button.tsx', line: 8, column: 1 } },
        { name: 'ButtonProps', kind: 'interface', location: { path: 'src/components/Button.tsx', line: 3, column: 1 } },
        { name: 'Modal', kind: 'class', location: { path: 'src/components/Modal.tsx', line: 12, column: 1 } },
        { name: 'fetchData', kind: 'function', location: { path: 'src/api/client.ts', line: 25, column: 1 } },
        { name: 'API_URL', kind: 'constant', location: { path: 'src/config.ts', line: 5, column: 1 } },
        { name: 'Theme', kind: 'interface', location: { path: 'src/types/theme.ts', line: 1, column: 1 } },
        { name: 'UserContext', kind: 'variable', location: { path: 'src/context/user.ts', line: 8, column: 1 } },
        { name: 'formatDate', kind: 'function', location: { path: 'src/utils/date.ts', line: 15, column: 1 } },
    ];

    return allSymbols.filter(s =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.containerName?.toLowerCase().includes(lowerQuery)
    );
}
