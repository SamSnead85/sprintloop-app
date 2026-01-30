/**
 * File Tabs Service
 * 
 * Manages open file tabs, active tab, dirty state, and tab ordering.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface FileTab {
    id: string;
    path: string;
    name: string;
    language: string;
    icon: string;
    isDirty: boolean;
    isPinned: boolean;
    isPreview: boolean;
    lastAccessTime: number;
    content?: string;
    originalContent?: string;
    cursorPosition?: { line: number; column: number };
    scrollPosition?: { top: number; left: number };
}

export interface FileTabsState {
    tabs: FileTab[];
    activeTabId: string | null;
    maxTabs: number;

    // Tab operations
    openFile: (path: string, options?: { preview?: boolean; focus?: boolean }) => void;
    closeTab: (tabId: string) => void;
    closeOtherTabs: (tabId: string) => void;
    closeAllTabs: () => void;
    closeTabsToTheRight: (tabId: string) => void;
    closeSavedTabs: () => void;

    // Tab state
    setActiveTab: (tabId: string) => void;
    setTabDirty: (tabId: string, isDirty: boolean) => void;
    setTabContent: (tabId: string, content: string) => void;
    pinTab: (tabId: string) => void;
    unpinTab: (tabId: string) => void;
    promotePreviewTab: (tabId: string) => void;

    // Tab ordering
    moveTab: (fromIndex: number, toIndex: number) => void;

    // Cursor/scroll state
    updateCursorPosition: (tabId: string, position: { line: number; column: number }) => void;
    updateScrollPosition: (tabId: string, position: { top: number; left: number }) => void;

    // Utilities
    getTabByPath: (path: string) => FileTab | undefined;
    getDirtyTabs: () => FileTab[];
    hasDirtyTabs: () => boolean;
    saveTab: (tabId: string) => Promise<void>;
    saveAllTabs: () => Promise<void>;
}

// =============================================================================
// FILE TABS STORE
// =============================================================================

export const useFileTabsService = create<FileTabsState>()(
    persist(
        (set, get) => ({
            tabs: [],
            activeTabId: null,
            maxTabs: 20,

            openFile: (path, options = {}) => {
                const { preview = false, focus = true } = options;
                const existingTab = get().tabs.find(t => t.path === path);

                if (existingTab) {
                    if (focus) {
                        set({ activeTabId: existingTab.id });
                    }
                    // If opening a preview tab explicitly, promote it
                    if (!preview && existingTab.isPreview) {
                        get().promotePreviewTab(existingTab.id);
                    }
                    return;
                }

                const name = path.split('/').pop() || path;
                const newTab: FileTab = {
                    id: `tab_${Date.now()}`,
                    path,
                    name,
                    language: getLanguageFromPath(path),
                    icon: getFileIcon(name),
                    isDirty: false,
                    isPinned: false,
                    isPreview: preview,
                    lastAccessTime: Date.now(),
                };

                set(state => {
                    // If preview mode, close existing preview tab
                    let newTabs = [...state.tabs];
                    if (preview) {
                        newTabs = newTabs.filter(t => !t.isPreview);
                    }

                    // Enforce max tabs
                    while (newTabs.length >= state.maxTabs) {
                        const unpinnedTabs = newTabs.filter(t => !t.isPinned && !t.isDirty);
                        if (unpinnedTabs.length > 0) {
                            const oldest = unpinnedTabs.sort((a, b) => a.lastAccessTime - b.lastAccessTime)[0];
                            newTabs = newTabs.filter(t => t.id !== oldest.id);
                        } else {
                            break;
                        }
                    }

                    return {
                        tabs: [...newTabs, newTab],
                        activeTabId: focus ? newTab.id : state.activeTabId,
                    };
                });
            },

            closeTab: (tabId) => {
                const tab = get().tabs.find(t => t.id === tabId);
                if (!tab) return;

                // TODO: Confirm if dirty
                set(state => {
                    const newTabs = state.tabs.filter(t => t.id !== tabId);
                    let newActiveId = state.activeTabId;

                    if (state.activeTabId === tabId) {
                        const index = state.tabs.findIndex(t => t.id === tabId);
                        if (newTabs.length > 0) {
                            newActiveId = newTabs[Math.min(index, newTabs.length - 1)]?.id || null;
                        } else {
                            newActiveId = null;
                        }
                    }

                    return { tabs: newTabs, activeTabId: newActiveId };
                });
            },

            closeOtherTabs: (tabId) => {
                set(state => ({
                    tabs: state.tabs.filter(t => t.id === tabId || t.isPinned),
                    activeTabId: tabId,
                }));
            },

            closeAllTabs: () => {
                set(state => ({
                    tabs: state.tabs.filter(t => t.isPinned),
                    activeTabId: null,
                }));
            },

            closeTabsToTheRight: (tabId) => {
                set(state => {
                    const index = state.tabs.findIndex(t => t.id === tabId);
                    return {
                        tabs: state.tabs.filter((t, i) => i <= index || t.isPinned),
                    };
                });
            },

            closeSavedTabs: () => {
                set(state => ({
                    tabs: state.tabs.filter(t => t.isDirty || t.isPinned),
                }));
            },

            setActiveTab: (tabId) => {
                set(state => ({
                    activeTabId: tabId,
                    tabs: state.tabs.map(t =>
                        t.id === tabId
                            ? { ...t, lastAccessTime: Date.now() }
                            : t
                    ),
                }));
            },

            setTabDirty: (tabId, isDirty) => {
                set(state => ({
                    tabs: state.tabs.map(t =>
                        t.id === tabId ? { ...t, isDirty } : t
                    ),
                }));
            },

            setTabContent: (tabId, content) => {
                set(state => ({
                    tabs: state.tabs.map(t =>
                        t.id === tabId
                            ? { ...t, content, isDirty: content !== t.originalContent }
                            : t
                    ),
                }));
            },

            pinTab: (tabId) => {
                set(state => {
                    const pinned = state.tabs.filter(t => t.isPinned);
                    const unpinned = state.tabs.filter(t => !t.isPinned);
                    const tabToPin = unpinned.find(t => t.id === tabId);

                    if (!tabToPin) return state;

                    return {
                        tabs: [
                            ...pinned,
                            { ...tabToPin, isPinned: true, isPreview: false },
                            ...unpinned.filter(t => t.id !== tabId),
                        ],
                    };
                });
            },

            unpinTab: (tabId) => {
                set(state => ({
                    tabs: state.tabs.map(t =>
                        t.id === tabId ? { ...t, isPinned: false } : t
                    ),
                }));
            },

            promotePreviewTab: (tabId) => {
                set(state => ({
                    tabs: state.tabs.map(t =>
                        t.id === tabId ? { ...t, isPreview: false } : t
                    ),
                }));
            },

            moveTab: (fromIndex, toIndex) => {
                set(state => {
                    const newTabs = [...state.tabs];
                    const [removed] = newTabs.splice(fromIndex, 1);
                    newTabs.splice(toIndex, 0, removed);
                    return { tabs: newTabs };
                });
            },

            updateCursorPosition: (tabId, position) => {
                set(state => ({
                    tabs: state.tabs.map(t =>
                        t.id === tabId ? { ...t, cursorPosition: position } : t
                    ),
                }));
            },

            updateScrollPosition: (tabId, position) => {
                set(state => ({
                    tabs: state.tabs.map(t =>
                        t.id === tabId ? { ...t, scrollPosition: position } : t
                    ),
                }));
            },

            getTabByPath: (path) => {
                return get().tabs.find(t => t.path === path);
            },

            getDirtyTabs: () => {
                return get().tabs.filter(t => t.isDirty);
            },

            hasDirtyTabs: () => {
                return get().tabs.some(t => t.isDirty);
            },

            saveTab: async (tabId) => {
                const tab = get().tabs.find(t => t.id === tabId);
                if (!tab || !tab.isDirty) return;

                console.log('[FileTabs] Saving:', tab.path);
                // In real implementation, write to file system
                set(state => ({
                    tabs: state.tabs.map(t =>
                        t.id === tabId
                            ? { ...t, isDirty: false, originalContent: t.content }
                            : t
                    ),
                }));
            },

            saveAllTabs: async () => {
                const dirtyTabs = get().getDirtyTabs();
                for (const tab of dirtyTabs) {
                    await get().saveTab(tab.id);
                }
            },
        }),
        {
            name: 'sprintloop-file-tabs',
            partialize: (state) => ({
                // Only persist file paths, not content
                tabs: state.tabs.map(t => ({
                    id: t.id,
                    path: t.path,
                    name: t.name,
                    language: t.language,
                    icon: t.icon,
                    isPinned: t.isPinned,
                    cursorPosition: t.cursorPosition,
                })),
            }),
        }
    )
);

// =============================================================================
// HELPERS
// =============================================================================

function getLanguageFromPath(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    const languages: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescriptreact',
        js: 'javascript',
        jsx: 'javascriptreact',
        json: 'json',
        md: 'markdown',
        css: 'css',
        scss: 'scss',
        html: 'html',
        py: 'python',
        rs: 'rust',
        go: 'go',
        java: 'java',
        cpp: 'cpp',
        c: 'c',
        h: 'c',
        rb: 'ruby',
        php: 'php',
        sql: 'sql',
        yaml: 'yaml',
        yml: 'yaml',
        sh: 'shellscript',
        bash: 'shellscript',
        zsh: 'shellscript',
    };
    return languages[ext || ''] || 'plaintext';
}

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
    };
    return icons[ext || ''] || '📄';
}

export { getLanguageFromPath, getFileIcon };
