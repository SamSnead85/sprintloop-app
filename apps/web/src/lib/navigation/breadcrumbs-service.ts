/**
 * Breadcrumbs Service
 * 
 * File and symbol navigation breadcrumbs.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface BreadcrumbItem {
    id: string;
    type: 'folder' | 'file' | 'symbol';
    name: string;
    path: string;
    icon?: string;
    symbolKind?: SymbolKind;
    range?: { startLine: number; endLine: number };
}

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

export interface BreadcrumbsState {
    items: BreadcrumbItem[];
    activeIndex: number;
    isDropdownOpen: boolean;
    dropdownIndex: number;
    dropdownItems: BreadcrumbItem[];

    // Update
    setItems: (items: BreadcrumbItem[]) => void;
    updateFromPath: (filePath: string) => void;
    updateFromCursor: (filePath: string, line: number) => void;

    // Navigation
    navigateToItem: (index: number) => void;
    navigateToSymbol: (item: BreadcrumbItem) => void;

    // Dropdown
    openDropdown: (index: number) => void;
    closeDropdown: () => void;
    setDropdownItems: (items: BreadcrumbItem[]) => void;
}

// =============================================================================
// BREADCRUMBS STORE
// =============================================================================

export const useBreadcrumbsService = create<BreadcrumbsState>((set, get) => ({
    items: [],
    activeIndex: -1,
    isDropdownOpen: false,
    dropdownIndex: -1,
    dropdownItems: [],

    setItems: (items) => {
        set({ items, activeIndex: items.length - 1 });
    },

    updateFromPath: (filePath) => {
        const parts = filePath.split('/').filter(Boolean);
        const items: BreadcrumbItem[] = [];
        let currentPath = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            currentPath += '/' + part;
            const isFile = i === parts.length - 1;

            items.push({
                id: `path_${i}`,
                type: isFile ? 'file' : 'folder',
                name: part,
                path: currentPath,
                icon: isFile ? getFileIcon(part) : '📁',
            });
        }

        set({ items, activeIndex: items.length - 1 });
    },

    updateFromCursor: (filePath, line) => {
        const { items } = get();

        // Keep folder/file items, add symbol based on cursor position
        const pathItems = items.filter(i => i.type !== 'symbol');

        // Simulate finding symbol at cursor
        const symbol = findSymbolAtLine(filePath, line);

        if (symbol) {
            pathItems.push({
                id: `symbol_${symbol.name}`,
                type: 'symbol',
                name: symbol.name,
                path: filePath,
                symbolKind: symbol.kind,
                icon: getSymbolIcon(symbol.kind),
                range: symbol.range,
            });
        }

        set({ items: pathItems, activeIndex: pathItems.length - 1 });
    },

    navigateToItem: (index) => {
        const { items } = get();
        const item = items[index];

        if (item) {
            console.log('[Breadcrumbs] Navigate to:', item.path);
            set({ activeIndex: index });

            // In real implementation, open file or folder
        }
    },

    navigateToSymbol: (item) => {
        console.log('[Breadcrumbs] Navigate to symbol:', item.name, item.range);

        // In real implementation, scroll editor to symbol
    },

    openDropdown: (index) => {
        const { items } = get();
        const item = items[index];

        if (!item) return;

        // Get sibling items for dropdown
        const siblings = getSiblingItems(item);

        set({
            isDropdownOpen: true,
            dropdownIndex: index,
            dropdownItems: siblings,
        });
    },

    closeDropdown: () => {
        set({
            isDropdownOpen: false,
            dropdownIndex: -1,
            dropdownItems: [],
        });
    },

    setDropdownItems: (items) => {
        set({ dropdownItems: items });
    },
}));

// =============================================================================
// HELPERS
// =============================================================================

function getFileIcon(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();

    const icons: Record<string, string> = {
        ts: '📘',
        tsx: '⚛️',
        js: '📙',
        jsx: '⚛️',
        json: '📋',
        md: '📝',
        css: '🎨',
        scss: '🎨',
        html: '🌐',
        py: '🐍',
        rs: '🦀',
        go: '🐹',
        java: '☕',
        cpp: '⚙️',
        c: '⚙️',
        h: '⚙️',
    };

    return icons[ext || ''] || '📄';
}

function getSymbolIcon(kind: SymbolKind): string {
    const icons: Record<SymbolKind, string> = {
        file: '📄',
        module: '📦',
        namespace: '📦',
        package: '📦',
        class: '🔷',
        method: '🔹',
        property: '🔸',
        field: '🔸',
        constructor: '🔧',
        enum: '📋',
        interface: '🔶',
        function: '⚡',
        variable: '📍',
        constant: '🔒',
        string: '📝',
        number: '🔢',
        boolean: '✓',
        array: '📚',
        object: '📦',
        key: '🔑',
        null: '∅',
        enumMember: '📋',
        struct: '🏗️',
        event: '⚡',
        operator: '➕',
        typeParameter: '📐',
    };

    return icons[kind] || '📍';
}

function findSymbolAtLine(
    _filePath: string,
    line: number
): { name: string; kind: SymbolKind; range: { startLine: number; endLine: number } } | null {
    // Simulate finding a symbol at the current line
    // In real implementation, this would query the symbol tree

    if (line < 10) {
        return {
            name: 'Component',
            kind: 'function',
            range: { startLine: 1, endLine: 50 },
        };
    } else if (line < 30) {
        return {
            name: 'handleClick',
            kind: 'method',
            range: { startLine: 15, endLine: 25 },
        };
    }

    return null;
}

function getSiblingItems(item: BreadcrumbItem): BreadcrumbItem[] {
    // Simulate getting sibling files/folders
    // In real implementation, this would query the file system

    if (item.type === 'folder') {
        return [
            { id: 'sibling_1', type: 'folder', name: 'components', path: '/components', icon: '📁' },
            { id: 'sibling_2', type: 'folder', name: 'lib', path: '/lib', icon: '📁' },
            { id: 'sibling_3', type: 'folder', name: 'hooks', path: '/hooks', icon: '📁' },
            { id: 'sibling_4', type: 'folder', name: 'styles', path: '/styles', icon: '📁' },
        ];
    } else if (item.type === 'file') {
        return [
            { id: 'sibling_1', type: 'file', name: 'index.ts', path: '/index.ts', icon: '📘' },
            { id: 'sibling_2', type: 'file', name: 'types.ts', path: '/types.ts', icon: '📘' },
            { id: 'sibling_3', type: 'file', name: 'utils.ts', path: '/utils.ts', icon: '📘' },
        ];
    } else {
        return [
            { id: 'sym_1', type: 'symbol', name: 'useState', path: item.path, symbolKind: 'function', icon: '⚡' },
            { id: 'sym_2', type: 'symbol', name: 'useEffect', path: item.path, symbolKind: 'function', icon: '⚡' },
            { id: 'sym_3', type: 'symbol', name: 'Component', path: item.path, symbolKind: 'class', icon: '🔷' },
        ];
    }
}

export { getFileIcon, getSymbolIcon };
