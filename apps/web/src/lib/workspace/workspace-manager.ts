/**
 * Workspace Manager Service
 * 
 * Extended workspace management with multi-folder and recent projects.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface WorkspaceFolder {
    id: string;
    name: string;
    path: string;
    color?: string;
    order: number;
}

export interface Workspace {
    id: string;
    name: string;
    folders: WorkspaceFolder[];
    settings?: Record<string, unknown>;
    createdAt: Date;
    lastOpenedAt: Date;
}

export interface RecentProject {
    id: string;
    name: string;
    path: string;
    lastOpened: Date;
    workspaceId?: string;
    pinned?: boolean;
}

export interface WorkspaceManagerState {
    workspaces: Workspace[];
    currentWorkspaceId: string | null;
    recentProjects: RecentProject[];
    isWelcomeVisible: boolean;

    // Workspace operations
    createWorkspace: (name: string, folders?: string[]) => string;
    openWorkspace: (workspaceId: string) => void;
    closeWorkspace: () => void;
    deleteWorkspace: (workspaceId: string) => void;
    renameWorkspace: (workspaceId: string, name: string) => void;

    // Folder operations
    addFolder: (workspaceId: string, path: string, name?: string) => void;
    removeFolder: (workspaceId: string, folderId: string) => void;
    reorderFolders: (workspaceId: string, folderIds: string[]) => void;
    setFolderColor: (workspaceId: string, folderId: string, color: string) => void;

    // Recent projects
    addRecentProject: (name: string, path: string, workspaceId?: string) => void;
    removeRecentProject: (projectId: string) => void;
    clearRecentProjects: () => void;
    togglePinProject: (projectId: string) => void;

    // Getters
    getCurrentWorkspace: () => Workspace | undefined;
    getRecentPinned: () => RecentProject[];

    // Welcome
    setWelcomeVisible: (visible: boolean) => void;
}

// =============================================================================
// WORKSPACE MANAGER STORE
// =============================================================================

export const useWorkspaceManager = create<WorkspaceManagerState>()(
    persist(
        (set, get) => ({
            workspaces: [],
            currentWorkspaceId: null,
            recentProjects: [],
            isWelcomeVisible: true,

            createWorkspace: (name, folders = []) => {
                const id = `ws_${Date.now()}`;
                const workspace: Workspace = {
                    id,
                    name,
                    folders: folders.map((path, i) => ({
                        id: `folder_${Date.now()}_${i}`,
                        name: path.split('/').pop() || path,
                        path,
                        order: i,
                    })),
                    createdAt: new Date(),
                    lastOpenedAt: new Date(),
                };

                set(state => ({
                    workspaces: [...state.workspaces, workspace],
                    currentWorkspaceId: id,
                }));

                return id;
            },

            openWorkspace: (workspaceId) => {
                set(state => ({
                    currentWorkspaceId: workspaceId,
                    workspaces: state.workspaces.map(ws =>
                        ws.id === workspaceId ? { ...ws, lastOpenedAt: new Date() } : ws
                    ),
                    isWelcomeVisible: false,
                }));
            },

            closeWorkspace: () => set({ currentWorkspaceId: null }),

            deleteWorkspace: (workspaceId) => {
                set(state => ({
                    workspaces: state.workspaces.filter(ws => ws.id !== workspaceId),
                    currentWorkspaceId: state.currentWorkspaceId === workspaceId
                        ? null : state.currentWorkspaceId,
                }));
            },

            renameWorkspace: (workspaceId, name) => {
                set(state => ({
                    workspaces: state.workspaces.map(ws => ws.id === workspaceId ? { ...ws, name } : ws),
                }));
            },

            addFolder: (workspaceId, path, name) => {
                const folder: WorkspaceFolder = {
                    id: `folder_${Date.now()}`,
                    name: name || path.split('/').pop() || path,
                    path,
                    order: get().workspaces.find(ws => ws.id === workspaceId)?.folders.length || 0,
                };
                set(state => ({
                    workspaces: state.workspaces.map(ws =>
                        ws.id === workspaceId ? { ...ws, folders: [...ws.folders, folder] } : ws
                    ),
                }));
            },

            removeFolder: (workspaceId, folderId) => {
                set(state => ({
                    workspaces: state.workspaces.map(ws =>
                        ws.id === workspaceId
                            ? { ...ws, folders: ws.folders.filter(f => f.id !== folderId) } : ws
                    ),
                }));
            },

            reorderFolders: (workspaceId, folderIds) => {
                set(state => ({
                    workspaces: state.workspaces.map(ws => {
                        if (ws.id !== workspaceId) return ws;
                        const reordered = folderIds.map((id, order) => {
                            const folder = ws.folders.find(f => f.id === id);
                            return folder ? { ...folder, order } : null;
                        }).filter(Boolean) as WorkspaceFolder[];
                        return { ...ws, folders: reordered };
                    }),
                }));
            },

            setFolderColor: (workspaceId, folderId, color) => {
                set(state => ({
                    workspaces: state.workspaces.map(ws =>
                        ws.id === workspaceId
                            ? { ...ws, folders: ws.folders.map(f => f.id === folderId ? { ...f, color } : f) }
                            : ws
                    ),
                }));
            },

            addRecentProject: (name, path, workspaceId) => {
                const project: RecentProject = { id: `recent_${Date.now()}`, name, path, lastOpened: new Date(), workspaceId };
                set(state => {
                    const filtered = state.recentProjects.filter(p => p.path !== path);
                    return { recentProjects: [project, ...filtered].slice(0, 20) };
                });
            },

            removeRecentProject: (projectId) => {
                set(state => ({ recentProjects: state.recentProjects.filter(p => p.id !== projectId) }));
            },

            clearRecentProjects: () => set({ recentProjects: [] }),

            togglePinProject: (projectId) => {
                set(state => ({
                    recentProjects: state.recentProjects.map(p => p.id === projectId ? { ...p, pinned: !p.pinned } : p),
                }));
            },

            getCurrentWorkspace: () => {
                const { workspaces, currentWorkspaceId } = get();
                return workspaces.find(ws => ws.id === currentWorkspaceId);
            },

            getRecentPinned: () => get().recentProjects.filter(p => p.pinned),

            setWelcomeVisible: (visible) => set({ isWelcomeVisible: visible }),
        }),
        { name: 'sprintloop-workspace-manager', partialize: (state) => ({ workspaces: state.workspaces, recentProjects: state.recentProjects }) }
    )
);

// =============================================================================
// UTILITIES
// =============================================================================

export function formatLastOpened(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
}

export const FOLDER_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
];
