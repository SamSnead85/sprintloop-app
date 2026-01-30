/**
 * Workspace Storage Service
 * 
 * Persists workspace state including layout, open files, and session data.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface PanelLayout {
    sidebarWidth: number;
    bottomPanelHeight: number;
    aiPanelWidth: number;
    sidebarVisible: boolean;
    bottomPanelVisible: boolean;
    aiPanelVisible: boolean;
    activeActivityPanel: string;
    activeBottomTab: string;
}

export interface EditorLayout {
    splitDirection: 'horizontal' | 'vertical' | null;
    editorGroups: EditorGroup[];
    activeGroupId: string | null;
}

export interface EditorGroup {
    id: string;
    tabs: string[];  // File paths
    activeTab: string | null;
    size: number;    // Percentage
}

export interface WorkspaceSession {
    id: string;
    name: string;
    createdAt: number;
    lastAccessedAt: number;
    projectPath: string;
    openFiles: string[];
    activeFile: string | null;
    panelLayout: PanelLayout;
    editorLayout: EditorLayout;
    searchHistory: string[];
    terminalHistory: string[];
}

export interface RecentProject {
    path: string;
    name: string;
    lastOpened: number;
    pinned: boolean;
}

export interface WorkspaceState {
    currentSession: WorkspaceSession | null;
    sessions: WorkspaceSession[];
    recentProjects: RecentProject[];
    globalSearchHistory: string[];

    // Session management
    createSession: (projectPath: string, name: string) => WorkspaceSession;
    loadSession: (sessionId: string) => void;
    saveSession: () => void;
    deleteSession: (sessionId: string) => void;

    // Layout management
    updatePanelLayout: (updates: Partial<PanelLayout>) => void;
    updateEditorLayout: (updates: Partial<EditorLayout>) => void;
    resetLayout: () => void;

    // Recent projects
    addRecentProject: (path: string, name: string) => void;
    removeRecentProject: (path: string) => void;
    pinProject: (path: string) => void;
    unpinProject: (path: string) => void;
    getRecentProjects: (limit?: number) => RecentProject[];

    // Search history
    addSearchHistory: (query: string) => void;
    clearSearchHistory: () => void;

    // File operations
    addOpenFile: (path: string) => void;
    removeOpenFile: (path: string) => void;
    setActiveFile: (path: string) => void;
}

// =============================================================================
// DEFAULT VALUES
// =============================================================================

const DEFAULT_PANEL_LAYOUT: PanelLayout = {
    sidebarWidth: 260,
    bottomPanelHeight: 200,
    aiPanelWidth: 350,
    sidebarVisible: true,
    bottomPanelVisible: true,
    aiPanelVisible: true,
    activeActivityPanel: 'files',
    activeBottomTab: 'terminal',
};

const DEFAULT_EDITOR_LAYOUT: EditorLayout = {
    splitDirection: null,
    editorGroups: [
        {
            id: 'main',
            tabs: [],
            activeTab: null,
            size: 100,
        },
    ],
    activeGroupId: 'main',
};

// =============================================================================
// WORKSPACE STORE
// =============================================================================

export const useWorkspaceStorage = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            currentSession: null,
            sessions: [],
            recentProjects: [],
            globalSearchHistory: [],

            createSession: (projectPath, name) => {
                const session: WorkspaceSession = {
                    id: `session_${Date.now()}`,
                    name,
                    createdAt: Date.now(),
                    lastAccessedAt: Date.now(),
                    projectPath,
                    openFiles: [],
                    activeFile: null,
                    panelLayout: { ...DEFAULT_PANEL_LAYOUT },
                    editorLayout: { ...DEFAULT_EDITOR_LAYOUT },
                    searchHistory: [],
                    terminalHistory: [],
                };

                set(state => ({
                    currentSession: session,
                    sessions: [...state.sessions, session],
                }));

                get().addRecentProject(projectPath, name);
                return session;
            },

            loadSession: (sessionId) => {
                const session = get().sessions.find(s => s.id === sessionId);
                if (session) {
                    set({
                        currentSession: {
                            ...session,
                            lastAccessedAt: Date.now(),
                        },
                    });
                }
            },

            saveSession: () => {
                const current = get().currentSession;
                if (!current) return;

                set(state => ({
                    sessions: state.sessions.map(s =>
                        s.id === current.id
                            ? { ...current, lastAccessedAt: Date.now() }
                            : s
                    ),
                }));
            },

            deleteSession: (sessionId) => {
                set(state => ({
                    sessions: state.sessions.filter(s => s.id !== sessionId),
                    currentSession: state.currentSession?.id === sessionId
                        ? null
                        : state.currentSession,
                }));
            },

            updatePanelLayout: (updates) => {
                set(state => ({
                    currentSession: state.currentSession
                        ? {
                            ...state.currentSession,
                            panelLayout: {
                                ...state.currentSession.panelLayout,
                                ...updates,
                            },
                        }
                        : null,
                }));
            },

            updateEditorLayout: (updates) => {
                set(state => ({
                    currentSession: state.currentSession
                        ? {
                            ...state.currentSession,
                            editorLayout: {
                                ...state.currentSession.editorLayout,
                                ...updates,
                            },
                        }
                        : null,
                }));
            },

            resetLayout: () => {
                set(state => ({
                    currentSession: state.currentSession
                        ? {
                            ...state.currentSession,
                            panelLayout: { ...DEFAULT_PANEL_LAYOUT },
                            editorLayout: { ...DEFAULT_EDITOR_LAYOUT },
                        }
                        : null,
                }));
            },

            addRecentProject: (path, name) => {
                set(state => ({
                    recentProjects: [
                        { path, name, lastOpened: Date.now(), pinned: false },
                        ...state.recentProjects.filter(p => p.path !== path),
                    ].slice(0, 20),
                }));
            },

            removeRecentProject: (path) => {
                set(state => ({
                    recentProjects: state.recentProjects.filter(p => p.path !== path),
                }));
            },

            pinProject: (path) => {
                set(state => ({
                    recentProjects: state.recentProjects.map(p =>
                        p.path === path ? { ...p, pinned: true } : p
                    ),
                }));
            },

            unpinProject: (path) => {
                set(state => ({
                    recentProjects: state.recentProjects.map(p =>
                        p.path === path ? { ...p, pinned: false } : p
                    ),
                }));
            },

            getRecentProjects: (limit = 10) => {
                const { recentProjects } = get();
                const pinned = recentProjects.filter(p => p.pinned);
                const unpinned = recentProjects.filter(p => !p.pinned);
                return [...pinned, ...unpinned].slice(0, limit);
            },

            addSearchHistory: (query) => {
                if (!query.trim()) return;
                set(state => ({
                    globalSearchHistory: [
                        query,
                        ...state.globalSearchHistory.filter(q => q !== query),
                    ].slice(0, 50),
                    currentSession: state.currentSession
                        ? {
                            ...state.currentSession,
                            searchHistory: [
                                query,
                                ...state.currentSession.searchHistory.filter(q => q !== query),
                            ].slice(0, 20),
                        }
                        : null,
                }));
            },

            clearSearchHistory: () => {
                set(state => ({
                    globalSearchHistory: [],
                    currentSession: state.currentSession
                        ? { ...state.currentSession, searchHistory: [] }
                        : null,
                }));
            },

            addOpenFile: (path) => {
                set(state => ({
                    currentSession: state.currentSession
                        ? {
                            ...state.currentSession,
                            openFiles: state.currentSession.openFiles.includes(path)
                                ? state.currentSession.openFiles
                                : [...state.currentSession.openFiles, path],
                        }
                        : null,
                }));
            },

            removeOpenFile: (path) => {
                set(state => ({
                    currentSession: state.currentSession
                        ? {
                            ...state.currentSession,
                            openFiles: state.currentSession.openFiles.filter(f => f !== path),
                            activeFile: state.currentSession.activeFile === path
                                ? null
                                : state.currentSession.activeFile,
                        }
                        : null,
                }));
            },

            setActiveFile: (path) => {
                set(state => ({
                    currentSession: state.currentSession
                        ? { ...state.currentSession, activeFile: path }
                        : null,
                }));
            },
        }),
        {
            name: 'sprintloop-workspace',
        }
    )
);

// =============================================================================
// UTILITIES
// =============================================================================

export function restoreWorkspaceFromSession(session: WorkspaceSession): void {
    console.log('[Workspace] Restoring session:', session.name);
    // In real implementation, this would:
    // 1. Open all files from session.openFiles
    // 2. Restore panel layout
    // 3. Set active file
    // 4. Restore terminal state
}

export function getSessionDisplayName(session: WorkspaceSession): string {
    const date = new Date(session.lastAccessedAt);
    return `${session.name} - ${date.toLocaleDateString()}`;
}
