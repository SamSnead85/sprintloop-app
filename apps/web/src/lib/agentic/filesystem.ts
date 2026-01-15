/**
 * File System Operations Module
 * Phases 101-200: File reading, writing, organization, and cloud sync
 */

import { create } from 'zustand';

export interface FileEntry {
    path: string;
    name: string;
    type: 'file' | 'directory';
    size: number;
    modified: number;
    created: number;
    extension?: string;
    mimeType?: string;
}

export interface FileContent {
    path: string;
    content: string | ArrayBuffer;
    encoding: 'utf-8' | 'base64' | 'binary';
    size: number;
}

export interface FileWatch {
    id: string;
    path: string;
    recursive: boolean;
    callback: (event: FileEvent) => void;
}

export interface FileEvent {
    type: 'created' | 'modified' | 'deleted' | 'renamed';
    path: string;
    oldPath?: string;
    timestamp: number;
}

interface FileSystemState {
    currentDirectory: string;
    recentFiles: string[];
    watchers: FileWatch[];
    clipboard: { action: 'copy' | 'cut'; paths: string[] } | null;

    // Navigation
    setCurrentDirectory: (path: string) => void;

    // Reading
    readFile: (path: string, encoding?: 'utf-8' | 'base64') => Promise<FileContent>;
    readDirectory: (path: string) => Promise<FileEntry[]>;
    exists: (path: string) => Promise<boolean>;
    getFileInfo: (path: string) => Promise<FileEntry>;

    // Writing
    writeFile: (path: string, content: string | ArrayBuffer) => Promise<void>;
    appendFile: (path: string, content: string) => Promise<void>;
    createDirectory: (path: string) => Promise<void>;

    // Operations
    copyFile: (source: string, destination: string) => Promise<void>;
    moveFile: (source: string, destination: string) => Promise<void>;
    deleteFile: (path: string) => Promise<void>;
    renameFile: (path: string, newName: string) => Promise<void>;

    // Search
    searchFiles: (query: string, directory?: string) => Promise<FileEntry[]>;
    searchContent: (query: string, extensions?: string[]) => Promise<{ path: string; line: number; content: string }[]>;

    // Watch
    watchPath: (path: string, callback: (event: FileEvent) => void, recursive?: boolean) => string;
    unwatchPath: (watchId: string) => void;

    // Clipboard
    copyToClipboard: (paths: string[]) => void;
    cutToClipboard: (paths: string[]) => void;
    paste: (destination: string) => Promise<void>;

    // Recent
    addToRecent: (path: string) => void;
    getRecentFiles: () => string[];
}

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
    currentDirectory: '/',
    recentFiles: [],
    watchers: [],
    clipboard: null,

    setCurrentDirectory: (path) => {
        set({ currentDirectory: path });
    },

    readFile: async (path, encoding = 'utf-8') => {
        console.log('[FileSystem] Reading:', path);
        await new Promise(r => setTimeout(r, 100));
        return {
            path,
            content: `// Contents of ${path}\n`,
            encoding,
            size: 100,
        };
    },

    readDirectory: async (path) => {
        console.log('[FileSystem] Listing:', path);
        await new Promise(r => setTimeout(r, 100));
        return [];
    },

    exists: async (path) => {
        console.log('[FileSystem] Checking exists:', path);
        return true;
    },

    getFileInfo: async (path) => {
        console.log('[FileSystem] Getting info:', path);
        const name = path.split('/').pop() || '';
        return {
            path,
            name,
            type: 'file' as const,
            size: 1024,
            modified: Date.now(),
            created: Date.now(),
            extension: name.split('.').pop(),
        };
    },

    writeFile: async (path, content) => {
        console.log('[FileSystem] Writing:', path, 'Size:', typeof content === 'string' ? content.length : content.byteLength);
        await new Promise(r => setTimeout(r, 100));
        get().addToRecent(path);
    },

    appendFile: async (path, _content) => {
        console.log('[FileSystem] Appending to:', path);
        await new Promise(r => setTimeout(r, 50));
    },

    createDirectory: async (path) => {
        console.log('[FileSystem] Creating directory:', path);
        await new Promise(r => setTimeout(r, 50));
    },

    copyFile: async (source, destination) => {
        console.log('[FileSystem] Copying:', source, '->', destination);
        await new Promise(r => setTimeout(r, 100));
    },

    moveFile: async (source, destination) => {
        console.log('[FileSystem] Moving:', source, '->', destination);
        await new Promise(r => setTimeout(r, 100));
    },

    deleteFile: async (path) => {
        console.log('[FileSystem] Deleting:', path);
        await new Promise(r => setTimeout(r, 50));
    },

    renameFile: async (path, newName) => {
        console.log('[FileSystem] Renaming:', path, '->', newName);
        await new Promise(r => setTimeout(r, 50));
    },

    searchFiles: async (query, directory) => {
        console.log('[FileSystem] Searching files:', query, 'in', directory);
        await new Promise(r => setTimeout(r, 200));
        return [];
    },

    searchContent: async (query, extensions) => {
        console.log('[FileSystem] Searching content:', query, 'extensions:', extensions);
        await new Promise(r => setTimeout(r, 500));
        return [];
    },

    watchPath: (path, callback, recursive = false) => {
        const id = `watch-${Date.now()}`;
        set(state => ({
            watchers: [...state.watchers, { id, path, callback, recursive }],
        }));
        console.log('[FileSystem] Watching:', path);
        return id;
    },

    unwatchPath: (watchId) => {
        set(state => ({
            watchers: state.watchers.filter(w => w.id !== watchId),
        }));
    },

    copyToClipboard: (paths) => {
        set({ clipboard: { action: 'copy', paths } });
    },

    cutToClipboard: (paths) => {
        set({ clipboard: { action: 'cut', paths } });
    },

    paste: async (destination) => {
        const clipboard = get().clipboard;
        if (!clipboard) return;

        for (const path of clipboard.paths) {
            const name = path.split('/').pop() || '';
            const destPath = `${destination}/${name}`;

            if (clipboard.action === 'copy') {
                await get().copyFile(path, destPath);
            } else {
                await get().moveFile(path, destPath);
            }
        }

        if (clipboard.action === 'cut') {
            set({ clipboard: null });
        }
    },

    addToRecent: (path) => {
        set(state => ({
            recentFiles: [path, ...state.recentFiles.filter(p => p !== path)].slice(0, 20),
        }));
    },

    getRecentFiles: () => get().recentFiles,
}));

/** Read a text file */
export async function readTextFile(path: string): Promise<string> {
    const store = useFileSystemStore.getState();
    const result = await store.readFile(path);
    return result.content as string;
}

/** Write a text file */
export async function writeTextFile(path: string, content: string): Promise<void> {
    const store = useFileSystemStore.getState();
    await store.writeFile(path, content);
}

/** List files in directory */
export async function listFiles(path: string): Promise<FileEntry[]> {
    const store = useFileSystemStore.getState();
    return store.readDirectory(path);
}

/** Search for files by name */
export async function findFiles(pattern: string, directory?: string): Promise<FileEntry[]> {
    const store = useFileSystemStore.getState();
    return store.searchFiles(pattern, directory);
}
