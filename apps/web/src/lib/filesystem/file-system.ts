/**
 * File System Service
 * 
 * High-level file system operations with caching and tree management.
 */

import { create } from 'zustand';
import * as tauri from '../tauri/tauri-commands';

// =============================================================================
// TYPES
// =============================================================================

export interface FileTreeNode {
    path: string;
    name: string;
    type: 'file' | 'directory';
    children?: FileTreeNode[];
    expanded?: boolean;
    loading?: boolean;
}

export interface OpenFile {
    path: string;
    name: string;
    content: string;
    language: string;
    modified: boolean;
    originalContent: string;
}

export interface FileSystemState {
    rootPath: string | null;
    tree: FileTreeNode[];
    openFiles: Map<string, OpenFile>;
    activeFilePath: string | null;
    isLoading: boolean;

    // Actions
    setRootPath: (path: string) => Promise<void>;
    loadDirectory: (path: string) => Promise<FileTreeNode[]>;
    toggleExpand: (path: string) => Promise<void>;

    // File operations
    openFile: (path: string) => Promise<OpenFile | null>;
    closeFile: (path: string) => void;
    setActiveFile: (path: string | null) => void;
    saveFile: (path: string) => Promise<boolean>;
    saveAllFiles: () => Promise<void>;
    updateFileContent: (path: string, content: string) => void;

    // CRUD
    createFile: (path: string, content?: string) => Promise<boolean>;
    createDirectory: (path: string) => Promise<boolean>;
    deleteItem: (path: string) => Promise<boolean>;
    renameItem: (oldPath: string, newPath: string) => Promise<boolean>;

    // Utilities
    getOpenFile: (path: string) => OpenFile | undefined;
    hasUnsavedChanges: () => boolean;
}

// =============================================================================
// LANGUAGE DETECTION
// =============================================================================

const EXTENSION_TO_LANGUAGE: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.json': 'json',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.md': 'markdown',
    '.py': 'python',
    '.rs': 'rust',
    '.go': 'go',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.sql': 'sql',
    '.sh': 'bash',
    '.bash': 'bash',
    '.zsh': 'bash',
    '.toml': 'toml',
    '.xml': 'xml',
    '.svg': 'xml',
};

function detectLanguage(path: string): string {
    const ext = path.slice(path.lastIndexOf('.')).toLowerCase();
    return EXTENSION_TO_LANGUAGE[ext] || 'plaintext';
}

// =============================================================================
// FILE SYSTEM STORE
// =============================================================================

export const useFileSystem = create<FileSystemState>((set, get) => ({
    rootPath: null,
    tree: [],
    openFiles: new Map(),
    activeFilePath: null,
    isLoading: false,

    setRootPath: async (path: string) => {
        set({ rootPath: path, isLoading: true, tree: [] });

        try {
            const children = await get().loadDirectory(path);
            set({
                tree: [{
                    path,
                    name: path.split('/').pop() || path,
                    type: 'directory',
                    children,
                    expanded: true,
                }],
                isLoading: false,
            });
        } catch (error) {
            console.error('[FileSystem] Failed to load root:', error);
            set({ isLoading: false });
        }
    },

    loadDirectory: async (path: string): Promise<FileTreeNode[]> => {
        try {
            const entries = await tauri.readDir(path);

            return entries
                .sort((a, b) => {
                    // Directories first, then alphabetically
                    if (a.isDir && !b.isDir) return -1;
                    if (!a.isDir && b.isDir) return 1;
                    return a.name.localeCompare(b.name);
                })
                .filter(e => !e.name.startsWith('.') || e.name === '.env')
                .map(entry => ({
                    path: entry.path,
                    name: entry.name,
                    type: entry.isDir ? 'directory' as const : 'file' as const,
                    children: entry.isDir ? [] : undefined,
                    expanded: false,
                }));
        } catch (error) {
            console.error('[FileSystem] Failed to load directory:', error);
            return [];
        }
    },

    toggleExpand: async (path: string) => {
        const updateTree = (nodes: FileTreeNode[]): FileTreeNode[] => {
            return nodes.map(node => {
                if (node.path === path) {
                    return { ...node, expanded: !node.expanded };
                }
                if (node.children) {
                    return { ...node, children: updateTree(node.children) };
                }
                return node;
            });
        };

        // Find and load children if needed
        const findNode = (nodes: FileTreeNode[]): FileTreeNode | undefined => {
            for (const node of nodes) {
                if (node.path === path) return node;
                if (node.children) {
                    const found = findNode(node.children);
                    if (found) return found;
                }
            }
        };

        const node = findNode(get().tree);

        if (node && node.type === 'directory' && !node.expanded && node.children?.length === 0) {
            // Load children
            set(state => ({
                tree: updateTreeLoading(state.tree, path, true),
            }));

            const children = await get().loadDirectory(path);

            set(state => ({
                tree: updateTreeChildren(state.tree, path, children),
            }));
        }

        set(state => ({ tree: updateTree(state.tree) }));
    },

    openFile: async (path: string): Promise<OpenFile | null> => {
        const existing = get().openFiles.get(path);
        if (existing) {
            set({ activeFilePath: path });
            return existing;
        }

        try {
            const content = await tauri.readFile(path);

            const file: OpenFile = {
                path,
                name: path.split('/').pop() || path,
                content,
                language: detectLanguage(path),
                modified: false,
                originalContent: content,
            };

            set(state => ({
                openFiles: new Map(state.openFiles).set(path, file),
                activeFilePath: path,
            }));

            return file;
        } catch (error) {
            console.error('[FileSystem] Failed to open file:', error);
            return null;
        }
    },

    closeFile: (path: string) => {
        set(state => {
            const openFiles = new Map(state.openFiles);
            openFiles.delete(path);

            let activeFilePath = state.activeFilePath;
            if (activeFilePath === path) {
                const paths = Array.from(openFiles.keys());
                activeFilePath = paths.length > 0 ? paths[paths.length - 1] : null;
            }

            return { openFiles, activeFilePath };
        });
    },

    setActiveFile: (path: string | null) => {
        set({ activeFilePath: path });
    },

    saveFile: async (path: string): Promise<boolean> => {
        const file = get().openFiles.get(path);
        if (!file) return false;

        try {
            await tauri.writeFile(path, file.content);

            set(state => ({
                openFiles: new Map(state.openFiles).set(path, {
                    ...file,
                    modified: false,
                    originalContent: file.content,
                }),
            }));

            return true;
        } catch (error) {
            console.error('[FileSystem] Failed to save file:', error);
            return false;
        }
    },

    saveAllFiles: async () => {
        const { openFiles, saveFile } = get();

        for (const [path, file] of openFiles) {
            if (file.modified) {
                await saveFile(path);
            }
        }
    },

    updateFileContent: (path: string, content: string) => {
        const file = get().openFiles.get(path);
        if (!file) return;

        set(state => ({
            openFiles: new Map(state.openFiles).set(path, {
                ...file,
                content,
                modified: content !== file.originalContent,
            }),
        }));
    },

    createFile: async (path: string, content = ''): Promise<boolean> => {
        try {
            await tauri.writeFile(path, content);

            // Refresh parent directory
            const parentPath = path.slice(0, path.lastIndexOf('/'));
            const children = await get().loadDirectory(parentPath);

            set(state => ({
                tree: updateTreeChildren(state.tree, parentPath, children),
            }));

            return true;
        } catch (error) {
            console.error('[FileSystem] Failed to create file:', error);
            return false;
        }
    },

    createDirectory: async (path: string): Promise<boolean> => {
        try {
            await tauri.createDir(path);

            // Refresh parent directory
            const parentPath = path.slice(0, path.lastIndexOf('/'));
            const children = await get().loadDirectory(parentPath);

            set(state => ({
                tree: updateTreeChildren(state.tree, parentPath, children),
            }));

            return true;
        } catch (error) {
            console.error('[FileSystem] Failed to create directory:', error);
            return false;
        }
    },

    deleteItem: async (path: string): Promise<boolean> => {
        try {
            const info = await tauri.getFileInfo(path);

            if (info?.isDir) {
                await tauri.removeDir(path);
            } else {
                await tauri.removeFile(path);
            }

            // Close if open
            get().closeFile(path);

            // Refresh parent directory
            const parentPath = path.slice(0, path.lastIndexOf('/'));
            const children = await get().loadDirectory(parentPath);

            set(state => ({
                tree: updateTreeChildren(state.tree, parentPath, children),
            }));

            return true;
        } catch (error) {
            console.error('[FileSystem] Failed to delete:', error);
            return false;
        }
    },

    renameItem: async (oldPath: string, newPath: string): Promise<boolean> => {
        try {
            await tauri.rename(oldPath, newPath);

            // Update open file if needed
            const file = get().openFiles.get(oldPath);
            if (file) {
                set(state => {
                    const openFiles = new Map(state.openFiles);
                    openFiles.delete(oldPath);
                    openFiles.set(newPath, { ...file, path: newPath, name: newPath.split('/').pop() || newPath });

                    return {
                        openFiles,
                        activeFilePath: state.activeFilePath === oldPath ? newPath : state.activeFilePath,
                    };
                });
            }

            // Refresh parent directory
            const parentPath = oldPath.slice(0, oldPath.lastIndexOf('/'));
            const children = await get().loadDirectory(parentPath);

            set(state => ({
                tree: updateTreeChildren(state.tree, parentPath, children),
            }));

            return true;
        } catch (error) {
            console.error('[FileSystem] Failed to rename:', error);
            return false;
        }
    },

    getOpenFile: (path: string) => get().openFiles.get(path),

    hasUnsavedChanges: () => {
        for (const file of get().openFiles.values()) {
            if (file.modified) return true;
        }
        return false;
    },
}));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function updateTreeLoading(nodes: FileTreeNode[], path: string, loading: boolean): FileTreeNode[] {
    return nodes.map(node => {
        if (node.path === path) {
            return { ...node, loading };
        }
        if (node.children) {
            return { ...node, children: updateTreeLoading(node.children, path, loading) };
        }
        return node;
    });
}

function updateTreeChildren(nodes: FileTreeNode[], path: string, children: FileTreeNode[]): FileTreeNode[] {
    return nodes.map(node => {
        if (node.path === path) {
            return { ...node, children, loading: false, expanded: true };
        }
        if (node.children) {
            return { ...node, children: updateTreeChildren(node.children, path, children) };
        }
        return node;
    });
}
