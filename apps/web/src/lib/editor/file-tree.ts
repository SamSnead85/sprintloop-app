/**
 * File Tree Panel
 * 
 * Phase 22: Recursive directory listing with file icons
 * Cursor/VS Code-style file explorer
 */

import { create } from 'zustand';

export interface FileNode {
    id: string;
    name: string;
    path: string;
    type: 'file' | 'directory';
    extension?: string;
    children?: FileNode[];
    isExpanded?: boolean;
    isLoading?: boolean;
    size?: number;
    modified?: number;
}

interface FileTreeState {
    root: FileNode | null;
    selectedPath: string | null;
    expandedPaths: Set<string>;

    // Actions
    setRoot: (root: FileNode) => void;
    selectPath: (path: string) => void;
    toggleExpand: (path: string) => void;
    expandPath: (path: string) => void;
    collapsePath: (path: string) => void;
    collapseAll: () => void;
    expandAll: () => void;
    refreshNode: (path: string, children: FileNode[]) => void;
}

export const useFileTreeStore = create<FileTreeState>((set, get) => ({
    root: null,
    selectedPath: null,
    expandedPaths: new Set(),

    setRoot: (root) => set({ root }),

    selectPath: (path) => set({ selectedPath: path }),

    toggleExpand: (path) => {
        const { expandedPaths } = get();
        const newExpanded = new Set(expandedPaths);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        set({ expandedPaths: newExpanded });
    },

    expandPath: (path) => {
        const { expandedPaths } = get();
        const newExpanded = new Set(expandedPaths);
        newExpanded.add(path);
        set({ expandedPaths: newExpanded });
    },

    collapsePath: (path) => {
        const { expandedPaths } = get();
        const newExpanded = new Set(expandedPaths);
        newExpanded.delete(path);
        set({ expandedPaths: newExpanded });
    },

    collapseAll: () => set({ expandedPaths: new Set() }),

    expandAll: () => {
        const { root } = get();
        if (!root) return;

        const allPaths = new Set<string>();
        const collectPaths = (node: FileNode) => {
            if (node.type === 'directory') {
                allPaths.add(node.path);
                node.children?.forEach(collectPaths);
            }
        };
        collectPaths(root);
        set({ expandedPaths: allPaths });
    },

    refreshNode: (path, children) => {
        const { root } = get();
        if (!root) return;

        const updateNode = (node: FileNode): FileNode => {
            if (node.path === path) {
                return { ...node, children, isLoading: false };
            }
            if (node.children) {
                return { ...node, children: node.children.map(updateNode) };
            }
            return node;
        };

        set({ root: updateNode(root) });
    },
}));

// ============================================================================
// FILE ICONS
// ============================================================================

const FILE_ICONS: Record<string, { icon: string; color: string }> = {
    // TypeScript/JavaScript
    ts: { icon: '📘', color: '#3178c6' },
    tsx: { icon: '⚛️', color: '#61dafb' },
    js: { icon: '📒', color: '#f7df1e' },
    jsx: { icon: '⚛️', color: '#61dafb' },
    mjs: { icon: '📒', color: '#f7df1e' },
    cjs: { icon: '📒', color: '#f7df1e' },

    // Web
    html: { icon: '🌐', color: '#e34c26' },
    css: { icon: '🎨', color: '#264de4' },
    scss: { icon: '🎨', color: '#cc6699' },
    less: { icon: '🎨', color: '#1d365d' },

    // Data
    json: { icon: '📋', color: '#cbcb41' },
    yaml: { icon: '📋', color: '#cb171e' },
    yml: { icon: '📋', color: '#cb171e' },
    xml: { icon: '📋', color: '#e37933' },
    toml: { icon: '📋', color: '#9c4221' },

    // Config
    env: { icon: '⚙️', color: '#6b7280' },
    gitignore: { icon: '🔒', color: '#f14e32' },
    eslintrc: { icon: '⚡', color: '#4b32c3' },

    // Docs
    md: { icon: '📝', color: '#083fa1' },
    mdx: { icon: '📝', color: '#fcb32c' },
    txt: { icon: '📄', color: '#6b7280' },

    // Images
    png: { icon: '🖼️', color: '#a855f7' },
    jpg: { icon: '🖼️', color: '#a855f7' },
    jpeg: { icon: '🖼️', color: '#a855f7' },
    gif: { icon: '🖼️', color: '#a855f7' },
    svg: { icon: '🎨', color: '#ffb13b' },
    ico: { icon: '🖼️', color: '#a855f7' },

    // Other languages
    py: { icon: '🐍', color: '#3572a5' },
    rs: { icon: '🦀', color: '#dea584' },
    go: { icon: '🔵', color: '#00add8' },
    rb: { icon: '💎', color: '#cc342d' },
    java: { icon: '☕', color: '#b07219' },

    // Shell
    sh: { icon: '🖥️', color: '#89e051' },
    bash: { icon: '🖥️', color: '#89e051' },
    zsh: { icon: '🖥️', color: '#89e051' },

    // Lock files
    lock: { icon: '🔒', color: '#6b7280' },

    // Default
    default: { icon: '📄', color: '#6b7280' },
};

const FOLDER_ICONS: Record<string, { icon: string; color: string }> = {
    src: { icon: '📦', color: '#60a5fa' },
    lib: { icon: '📚', color: '#a78bfa' },
    components: { icon: '🧩', color: '#f472b6' },
    pages: { icon: '📄', color: '#34d399' },
    styles: { icon: '🎨', color: '#fb923c' },
    assets: { icon: '🖼️', color: '#fcd34d' },
    public: { icon: '🌐', color: '#60a5fa' },
    node_modules: { icon: '📦', color: '#6b7280' },
    dist: { icon: '📤', color: '#6b7280' },
    build: { icon: '🔨', color: '#6b7280' },
    test: { icon: '🧪', color: '#10b981' },
    tests: { icon: '🧪', color: '#10b981' },
    __tests__: { icon: '🧪', color: '#10b981' },
    config: { icon: '⚙️', color: '#9ca3af' },
    hooks: { icon: '🪝', color: '#a78bfa' },
    utils: { icon: '🔧', color: '#f59e0b' },
    helpers: { icon: '🤝', color: '#f59e0b' },
    api: { icon: '🔌', color: '#3b82f6' },
    types: { icon: '📐', color: '#3178c6' },
    store: { icon: '🗃️', color: '#8b5cf6' },
    stores: { icon: '🗃️', color: '#8b5cf6' },
    default: { icon: '📁', color: '#9ca3af' },
};

/**
 * Get icon for a file
 */
export function getFileIcon(filename: string): { icon: string; color: string } {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    // Check for special files
    if (filename === '.gitignore') return FILE_ICONS.gitignore;
    if (filename.startsWith('.env')) return FILE_ICONS.env;
    if (filename.includes('eslint')) return FILE_ICONS.eslintrc;

    return FILE_ICONS[ext] || FILE_ICONS.default;
}

/**
 * Get icon for a folder
 */
export function getFolderIcon(foldername: string): { icon: string; color: string } {
    const lower = foldername.toLowerCase();
    return FOLDER_ICONS[lower] || FOLDER_ICONS.default;
}

/**
 * Sort file nodes (directories first, then alphabetically)
 */
export function sortFileNodes(nodes: FileNode[]): FileNode[] {
    return [...nodes].sort((a, b) => {
        // Directories first
        if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
        }
        // Then alphabetically (case-insensitive)
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
}

/**
 * Filter out hidden/ignored files
 */
export function filterFileNodes(nodes: FileNode[], options: {
    showHidden?: boolean;
    showNodeModules?: boolean;
} = {}): FileNode[] {
    return nodes.filter(node => {
        if (!options.showHidden && node.name.startsWith('.') && node.name !== '.env') {
            return false;
        }
        if (!options.showNodeModules && node.name === 'node_modules') {
            return false;
        }
        return true;
    });
}
