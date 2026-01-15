/**
 * Multi-Tab Support
 * 
 * Phase 20: Multi-tab editor with persistence
 * VS Code/Cursor style tab management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EditorTab {
    id: string;
    path: string;
    name: string;
    language: string;
    isDirty: boolean;
    viewState?: unknown; // Monaco view state for scroll position, cursor, etc.
    lastAccessed: number;
}

export interface TabGroup {
    id: string;
    tabs: EditorTab[];
    activeTabId: string | null;
    column: number;
}

interface TabsState {
    groups: TabGroup[];
    activeGroupId: string;

    // Tab actions
    openTab: (path: string, groupId?: string) => void;
    closeTab: (tabId: string, groupId?: string) => void;
    closeOtherTabs: (tabId: string, groupId?: string) => void;
    closeTabsToRight: (tabId: string, groupId?: string) => void;
    setActiveTab: (tabId: string, groupId?: string) => void;

    // Group actions
    splitRight: (tabId: string) => void;
    splitDown: (tabId: string) => void;
    setActiveGroup: (groupId: string) => void;
    closeGroup: (groupId: string) => void;

    // Dirty state
    setTabDirty: (tabId: string, isDirty: boolean) => void;

    // Tab reordering
    moveTab: (tabId: string, fromGroupId: string, toGroupId: string, index: number) => void;
}

function getLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescriptreact',
        js: 'javascript',
        jsx: 'javascriptreact',
        json: 'json',
        md: 'markdown',
        css: 'css',
        scss: 'scss',
        html: 'html',
        vue: 'vue',
        py: 'python',
        rs: 'rust',
        go: 'go',
        java: 'java',
        yaml: 'yaml',
        yml: 'yaml',
        toml: 'toml',
        sh: 'shell',
        bash: 'shell',
    };
    return languageMap[ext] || 'plaintext';
}

function getName(path: string): string {
    return path.split('/').pop() || path;
}

export const useTabsStore = create<TabsState>()(
    persist(
        (set, get) => ({
            groups: [{
                id: 'main',
                tabs: [],
                activeTabId: null,
                column: 0,
            }],
            activeGroupId: 'main',

            openTab: (path, groupId) => {
                const targetGroupId = groupId || get().activeGroupId;

                set((state) => {
                    const groups = state.groups.map(group => {
                        if (group.id !== targetGroupId) return group;

                        // Check if tab already exists
                        const existingTab = group.tabs.find(t => t.path === path);
                        if (existingTab) {
                            return {
                                ...group,
                                activeTabId: existingTab.id,
                                tabs: group.tabs.map(t =>
                                    t.id === existingTab.id
                                        ? { ...t, lastAccessed: Date.now() }
                                        : t
                                ),
                            };
                        }

                        // Create new tab
                        const newTab: EditorTab = {
                            id: `tab-${Date.now()}`,
                            path,
                            name: getName(path),
                            language: getLanguage(path),
                            isDirty: false,
                            lastAccessed: Date.now(),
                        };

                        return {
                            ...group,
                            tabs: [...group.tabs, newTab],
                            activeTabId: newTab.id,
                        };
                    });

                    return { groups, activeGroupId: targetGroupId };
                });
            },

            closeTab: (tabId, groupId) => {
                const targetGroupId = groupId || get().activeGroupId;

                set((state) => {
                    const groups = state.groups.map(group => {
                        if (group.id !== targetGroupId) return group;

                        const tabIndex = group.tabs.findIndex(t => t.id === tabId);
                        if (tabIndex === -1) return group;

                        const newTabs = group.tabs.filter(t => t.id !== tabId);

                        // Select adjacent tab if closing active
                        let newActiveId = group.activeTabId;
                        if (group.activeTabId === tabId) {
                            if (newTabs.length === 0) {
                                newActiveId = null;
                            } else if (tabIndex >= newTabs.length) {
                                newActiveId = newTabs[newTabs.length - 1].id;
                            } else {
                                newActiveId = newTabs[tabIndex].id;
                            }
                        }

                        return {
                            ...group,
                            tabs: newTabs,
                            activeTabId: newActiveId,
                        };
                    });

                    return { groups };
                });
            },

            closeOtherTabs: (tabId, groupId) => {
                const targetGroupId = groupId || get().activeGroupId;

                set((state) => ({
                    groups: state.groups.map(group => {
                        if (group.id !== targetGroupId) return group;
                        const tab = group.tabs.find(t => t.id === tabId);
                        return tab ? { ...group, tabs: [tab], activeTabId: tabId } : group;
                    }),
                }));
            },

            closeTabsToRight: (tabId, groupId) => {
                const targetGroupId = groupId || get().activeGroupId;

                set((state) => ({
                    groups: state.groups.map(group => {
                        if (group.id !== targetGroupId) return group;
                        const tabIndex = group.tabs.findIndex(t => t.id === tabId);
                        if (tabIndex === -1) return group;
                        return { ...group, tabs: group.tabs.slice(0, tabIndex + 1) };
                    }),
                }));
            },

            setActiveTab: (tabId, groupId) => {
                const targetGroupId = groupId || get().activeGroupId;

                set((state) => ({
                    groups: state.groups.map(group =>
                        group.id === targetGroupId
                            ? { ...group, activeTabId: tabId }
                            : group
                    ),
                    activeGroupId: targetGroupId,
                }));
            },

            splitRight: (tabId) => {
                const state = get();
                const currentGroup = state.groups.find(g =>
                    g.tabs.some(t => t.id === tabId)
                );
                const tab = currentGroup?.tabs.find(t => t.id === tabId);

                if (!tab || !currentGroup) return;

                const newGroup: TabGroup = {
                    id: `group-${Date.now()}`,
                    tabs: [{ ...tab, id: `tab-${Date.now()}` }],
                    activeTabId: null,
                    column: currentGroup.column + 1,
                };
                newGroup.activeTabId = newGroup.tabs[0].id;

                set((state) => ({
                    groups: [...state.groups, newGroup],
                    activeGroupId: newGroup.id,
                }));
            },

            splitDown: (_tabId) => {
                // Similar to splitRight but for vertical split
                console.log('[Tabs] splitDown not yet implemented');
            },

            setActiveGroup: (groupId) => {
                set({ activeGroupId: groupId });
            },

            closeGroup: (groupId) => {
                set((state) => {
                    const groups = state.groups.filter(g => g.id !== groupId);
                    return {
                        groups: groups.length > 0 ? groups : [{
                            id: 'main',
                            tabs: [],
                            activeTabId: null,
                            column: 0,
                        }],
                        activeGroupId: groups.length > 0 ? groups[0].id : 'main',
                    };
                });
            },

            setTabDirty: (tabId, isDirty) => {
                set((state) => ({
                    groups: state.groups.map(group => ({
                        ...group,
                        tabs: group.tabs.map(tab =>
                            tab.id === tabId ? { ...tab, isDirty } : tab
                        ),
                    })),
                }));
            },

            moveTab: (tabId, fromGroupId, toGroupId, index) => {
                set((state) => {
                    const fromGroup = state.groups.find(g => g.id === fromGroupId);
                    const tab = fromGroup?.tabs.find(t => t.id === tabId);

                    if (!tab) return state;

                    return {
                        groups: state.groups.map(group => {
                            if (group.id === fromGroupId) {
                                return {
                                    ...group,
                                    tabs: group.tabs.filter(t => t.id !== tabId),
                                };
                            }
                            if (group.id === toGroupId) {
                                const newTabs = [...group.tabs];
                                newTabs.splice(index, 0, tab);
                                return { ...group, tabs: newTabs, activeTabId: tabId };
                            }
                            return group;
                        }),
                    };
                });
            },
        }),
        {
            name: 'sprintloop:tabs',
            partialize: (state) => ({
                groups: state.groups.map(g => ({
                    ...g,
                    tabs: g.tabs.map(t => ({
                        id: t.id,
                        path: t.path,
                        name: t.name,
                        language: t.language,
                        isDirty: false, // Don't persist dirty state
                    })),
                })),
                activeGroupId: state.activeGroupId,
            }),
        }
    )
);
