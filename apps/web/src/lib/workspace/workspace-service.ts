/**
 * Workspace Service
 * 
 * Multi-root workspace management with project configuration.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface WorkspaceFolder {
    uri: string;
    name: string;
    index: number;
}

export interface WorkspaceConfiguration {
    folders: WorkspaceFolder[];
    settings: Record<string, unknown>;
    extensions: {
        recommendations: string[];
        unwantedRecommendations: string[];
    };
    launch?: LaunchConfiguration[];
    tasks?: TaskConfiguration[];
}

export interface LaunchConfiguration {
    name: string;
    type: string;
    request: string;
    [key: string]: unknown;
}

export interface TaskConfiguration {
    label: string;
    type: string;
    command: string;
    args?: string[];
    group?: string | { kind: string; isDefault: boolean };
    problemMatcher?: string | string[];
    [key: string]: unknown;
}

export interface RecentWorkspace {
    uri: string;
    name: string;
    lastOpened: number;
    folders: string[];
}

export interface WorkspaceServiceState {
    currentWorkspace: WorkspaceConfiguration | null;
    workspaceFolders: WorkspaceFolder[];
    recentWorkspaces: RecentWorkspace[];
    isMultiRoot: boolean;
    workspaceFile: string | null;

    // Workspace Management
    openWorkspace: (uri: string) => Promise<void>;
    openFolder: (uri: string) => Promise<void>;
    addFolder: (uri: string) => void;
    removeFolder: (uri: string) => void;
    saveWorkspace: (uri: string) => Promise<void>;
    closeWorkspace: () => void;

    // Configuration
    getConfiguration: <T>(section: string, folder?: string) => T | undefined;
    updateConfiguration: (section: string, value: unknown, folder?: string) => void;

    // Tasks
    getTasks: () => TaskConfiguration[];
    runTask: (label: string) => Promise<void>;

    // Launch Configurations
    getLaunchConfigs: () => LaunchConfiguration[];

    // Recent
    addToRecent: (workspace: RecentWorkspace) => void;
    clearRecent: () => void;

    // Utilities
    getWorkspaceRoot: () => string | null;
    resolveWorkspacePath: (path: string) => string;
    isInWorkspace: (path: string) => boolean;
}

// =============================================================================
// WORKSPACE STORE
// =============================================================================

export const useWorkspaceService = create<WorkspaceServiceState>()(
    persist(
        (set, get) => ({
            currentWorkspace: null,
            workspaceFolders: [],
            recentWorkspaces: [],
            isMultiRoot: false,
            workspaceFile: null,

            openWorkspace: async (uri) => {
                const config = await loadWorkspaceFile(uri);

                if (config) {
                    const folders = config.folders.map((f, i) => ({
                        ...f,
                        index: i,
                    }));

                    set({
                        currentWorkspace: config,
                        workspaceFolders: folders,
                        isMultiRoot: folders.length > 1,
                        workspaceFile: uri,
                    });

                    get().addToRecent({
                        uri,
                        name: uri.split('/').pop()?.replace('.code-workspace', '') || 'Workspace',
                        lastOpened: Date.now(),
                        folders: folders.map(f => f.uri),
                    });
                }
            },

            openFolder: async (uri) => {
                const folderName = uri.split('/').pop() || 'Project';

                set({
                    currentWorkspace: {
                        folders: [{ uri, name: folderName, index: 0 }],
                        settings: {},
                        extensions: { recommendations: [], unwantedRecommendations: [] },
                    },
                    workspaceFolders: [{ uri, name: folderName, index: 0 }],
                    isMultiRoot: false,
                    workspaceFile: null,
                });

                get().addToRecent({
                    uri,
                    name: folderName,
                    lastOpened: Date.now(),
                    folders: [uri],
                });
            },

            addFolder: (uri) => {
                const folderName = uri.split('/').pop() || 'Folder';
                const { workspaceFolders, currentWorkspace } = get();

                // Check if already added
                if (workspaceFolders.some(f => f.uri === uri)) return;

                const newFolder: WorkspaceFolder = {
                    uri,
                    name: folderName,
                    index: workspaceFolders.length,
                };

                const updatedFolders = [...workspaceFolders, newFolder];

                set({
                    workspaceFolders: updatedFolders,
                    isMultiRoot: updatedFolders.length > 1,
                    currentWorkspace: currentWorkspace ? {
                        ...currentWorkspace,
                        folders: updatedFolders,
                    } : null,
                });
            },

            removeFolder: (uri) => {
                const { workspaceFolders, currentWorkspace } = get();

                const updatedFolders = workspaceFolders
                    .filter(f => f.uri !== uri)
                    .map((f, i) => ({ ...f, index: i }));

                set({
                    workspaceFolders: updatedFolders,
                    isMultiRoot: updatedFolders.length > 1,
                    currentWorkspace: currentWorkspace ? {
                        ...currentWorkspace,
                        folders: updatedFolders,
                    } : null,
                });
            },

            saveWorkspace: async (uri) => {
                const { currentWorkspace } = get();
                if (!currentWorkspace) return;

                // In real implementation, write to file system
                console.log('[Workspace] Saving workspace to:', uri);
                set({ workspaceFile: uri });
            },

            closeWorkspace: () => {
                set({
                    currentWorkspace: null,
                    workspaceFolders: [],
                    isMultiRoot: false,
                    workspaceFile: null,
                });
            },

            getConfiguration: <T>(section: string, _folder?: string): T | undefined => {
                const { currentWorkspace } = get();
                if (!currentWorkspace) return undefined;

                // Navigate nested settings
                const parts = section.split('.');
                let value: unknown = currentWorkspace.settings;

                for (const part of parts) {
                    if (value && typeof value === 'object' && part in value) {
                        value = (value as Record<string, unknown>)[part];
                    } else {
                        return undefined;
                    }
                }

                return value as T;
            },

            updateConfiguration: (section, value, _folder) => {
                const { currentWorkspace } = get();
                if (!currentWorkspace) return;

                const parts = section.split('.');
                const settings = { ...currentWorkspace.settings };

                // Set nested value
                let current: Record<string, unknown> = settings;
                for (let i = 0; i < parts.length - 1; i++) {
                    if (!(parts[i] in current)) {
                        current[parts[i]] = {};
                    }
                    current = current[parts[i]] as Record<string, unknown>;
                }
                current[parts[parts.length - 1]] = value;

                set({
                    currentWorkspace: { ...currentWorkspace, settings },
                });
            },

            getTasks: () => {
                return get().currentWorkspace?.tasks || getDefaultTasks();
            },

            runTask: async (label) => {
                const tasks = get().getTasks();
                const task = tasks.find(t => t.label === label);

                if (task) {
                    console.log('[Workspace] Running task:', task.label, task.command);
                    // In real implementation, execute via terminal
                }
            },

            getLaunchConfigs: () => {
                return get().currentWorkspace?.launch || getDefaultLaunchConfigs();
            },

            addToRecent: (workspace) => {
                set(state => {
                    const recent = state.recentWorkspaces
                        .filter(r => r.uri !== workspace.uri)
                        .slice(0, 9);
                    return { recentWorkspaces: [workspace, ...recent] };
                });
            },

            clearRecent: () => {
                set({ recentWorkspaces: [] });
            },

            getWorkspaceRoot: () => {
                const { workspaceFolders } = get();
                return workspaceFolders[0]?.uri || null;
            },

            resolveWorkspacePath: (path) => {
                const root = get().getWorkspaceRoot();
                if (!root) return path;

                return path
                    .replace('${workspaceFolder}', root)
                    .replace('${workspaceRoot}', root);
            },

            isInWorkspace: (path) => {
                const { workspaceFolders } = get();
                return workspaceFolders.some(f => path.startsWith(f.uri));
            },
        }),
        {
            name: 'sprintloop-workspace',
            partialize: (state) => ({
                recentWorkspaces: state.recentWorkspaces,
            }),
        }
    )
);

// =============================================================================
// HELPERS
// =============================================================================

async function loadWorkspaceFile(uri: string): Promise<WorkspaceConfiguration | null> {
    // In real implementation, read from file system
    await new Promise(resolve => setTimeout(resolve, 50));

    // Return mock workspace
    return {
        folders: [
            { uri: uri.replace('.code-workspace', ''), name: 'Project', index: 0 },
        ],
        settings: {
            'editor.fontSize': 14,
            'editor.tabSize': 2,
            'files.autoSave': 'afterDelay',
        },
        extensions: {
            recommendations: [
                'dbaeumer.vscode-eslint',
                'esbenp.prettier-vscode',
                'bradlc.vscode-tailwindcss',
            ],
            unwantedRecommendations: [],
        },
        launch: getDefaultLaunchConfigs(),
        tasks: getDefaultTasks(),
    };
}

function getDefaultTasks(): TaskConfiguration[] {
    return [
        {
            label: 'build',
            type: 'npm',
            command: 'run build',
            group: { kind: 'build', isDefault: true },
            problemMatcher: ['$tsc'],
        },
        {
            label: 'dev',
            type: 'npm',
            command: 'run dev',
            group: 'none',
        },
        {
            label: 'test',
            type: 'npm',
            command: 'run test',
            group: { kind: 'test', isDefault: true },
            problemMatcher: [],
        },
        {
            label: 'lint',
            type: 'npm',
            command: 'run lint',
            group: 'none',
            problemMatcher: ['$eslint-stylish'],
        },
    ];
}

function getDefaultLaunchConfigs(): LaunchConfiguration[] {
    return [
        {
            name: 'Launch Program',
            type: 'node',
            request: 'launch',
            program: '${workspaceFolder}/src/index.ts',
            outFiles: ['${workspaceFolder}/dist/**/*.js'],
        },
        {
            name: 'Attach to Process',
            type: 'node',
            request: 'attach',
            port: 9229,
        },
    ];
}
