/**
 * Project Store
 * Manages current project state, files, open tabs, mode, and preview
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type AIModel, DEFAULT_MODEL } from '../config/models'
import { audit } from '../lib/audit/logger'
import * as tauriBridge from '../lib/tauri-bridge'

export type ProjectMode = 'planning' | 'execution'

export interface ProjectFile {
    id: string
    name: string
    path: string
    content: string
    language: string
    isModified: boolean
}

export interface ProjectTask {
    id: string
    text: string
    completed: boolean
    inProgress: boolean
}

export interface Project {
    id: string
    name: string
    path: string
    model: AIModel
    createdAt: string
    lastOpened: string
    description?: string
}

interface ProjectStore {
    // Current project
    currentProject: Project | null
    isProjectOpen: boolean

    // Mode
    mode: ProjectMode

    // Tasks
    tasks: ProjectTask[]

    // Preview
    previewUrl: string
    isPreviewVisible: boolean

    // Files
    files: ProjectFile[]
    openTabs: string[] // file IDs
    activeTabId: string | null

    // Actions
    createProject: (path: string, name: string, description?: string, model?: AIModel) => Promise<void>
    openProject: (path: string, name: string, model?: AIModel) => void
    closeProject: () => void
    setProjectModel: (model: AIModel) => void

    // Mode actions
    setMode: (mode: ProjectMode) => void
    togglePreview: () => void
    setPreviewUrl: (url: string) => void

    // Task actions
    addTask: (text: string) => void
    toggleTask: (id: string) => void
    setTaskInProgress: (id: string, inProgress: boolean) => void

    // File actions
    openFile: (file: ProjectFile) => void
    closeTab: (fileId: string) => void
    setActiveTab: (fileId: string) => void
    updateFileContent: (fileId: string, content: string) => void
    saveFile: (fileId: string) => void
}

export const useProjectStore = create<ProjectStore>()(
    persist(
        (set, get) => ({
            // Initial state
            currentProject: null,
            isProjectOpen: false,
            mode: 'planning' as ProjectMode,
            tasks: [],
            previewUrl: 'http://localhost:5173',
            isPreviewVisible: false,
            files: [],
            openTabs: [],
            activeTabId: null,

            // Create new project with config
            createProject: async (path, name, description = '', model = DEFAULT_MODEL) => {
                console.log('[Project] Creating project:', name, 'at', path);

                const project: Project = {
                    id: `project-${Date.now()}`,
                    name,
                    path,
                    model,
                    description,
                    createdAt: new Date().toISOString(),
                    lastOpened: new Date().toISOString(),
                };

                // Initialize with default tasks
                const defaultTasks: ProjectTask[] = [
                    { id: '1', text: 'Define project requirements', completed: false, inProgress: false },
                    { id: '2', text: 'Set up project structure', completed: false, inProgress: false },
                    { id: '3', text: 'Implement core features', completed: false, inProgress: false },
                ];

                // Create .sprintloop config directory
                if (tauriBridge.isTauri()) {
                    try {
                        const configPath = `${path}/.sprintloop/project.json`;
                        const taskPath = `${path}/.sprintloop/task.md`;

                        await tauriBridge.writeFileContent(configPath, JSON.stringify(project, null, 2));

                        const taskMd = `# ${name}\n\n## Tasks\n\n- [ ] Define project requirements\n- [ ] Set up project structure\n- [ ] Implement core features\n`;
                        await tauriBridge.writeFileContent(taskPath, taskMd);

                        console.log('[Project] Config files created');
                    } catch (e) {
                        console.error('[Project] Failed to create config:', e);
                    }
                }

                set({
                    currentProject: project,
                    isProjectOpen: true,
                    mode: 'planning',
                    tasks: defaultTasks,
                    files: [],
                    openTabs: [],
                    activeTabId: null,
                });

                audit.projectOpen(path, name);
            },

            // Project actions
            openProject: (path, name, model = DEFAULT_MODEL) => {
                const project: Project = {
                    id: `project-${Date.now()}`,
                    name,
                    path,
                    model,
                    createdAt: new Date().toISOString(),
                    lastOpened: new Date().toISOString(),
                };

                set({
                    currentProject: project,
                    isProjectOpen: true,
                    mode: 'planning',
                    tasks: [],
                    files: [],
                    openTabs: [],
                    activeTabId: null,
                });

                audit.projectOpen(path, name);
            },

            closeProject: () => {
                const { currentProject } = get();
                if (currentProject) {
                    audit.projectClose(currentProject.path);
                }

                set({
                    currentProject: null,
                    isProjectOpen: false,
                    mode: 'planning',
                    tasks: [],
                    isPreviewVisible: false,
                    files: [],
                    openTabs: [],
                    activeTabId: null,
                });
            },

            setProjectModel: (model) => {
                const { currentProject } = get()
                if (!currentProject) return

                const previousModel = currentProject.model
                set({
                    currentProject: { ...currentProject, model },
                })

                if (previousModel.id !== model.id) {
                    audit.modelSwitch(previousModel.name, model.name)
                }
            },

            // File actions
            openFile: (file) => {
                const { files, openTabs } = get()

                // Add file if not already in list
                const existingFile = files.find(f => f.id === file.id)
                const updatedFiles = existingFile ? files : [...files, file]

                // Add to open tabs if not already open
                const updatedTabs = openTabs.includes(file.id)
                    ? openTabs
                    : [...openTabs, file.id]

                set({
                    files: updatedFiles,
                    openTabs: updatedTabs,
                    activeTabId: file.id,
                })
            },

            closeTab: (fileId) => {
                const { openTabs, activeTabId, files } = get()
                const tabIndex = openTabs.indexOf(fileId)
                const updatedTabs = openTabs.filter(id => id !== fileId)

                // Remove file from files list
                const updatedFiles = files.filter(f => f.id !== fileId)

                // Set new active tab
                let newActiveTabId = activeTabId
                if (activeTabId === fileId) {
                    // Activate adjacent tab
                    if (tabIndex > 0) {
                        newActiveTabId = updatedTabs[tabIndex - 1]
                    } else if (updatedTabs.length > 0) {
                        newActiveTabId = updatedTabs[0]
                    } else {
                        newActiveTabId = null
                    }
                }

                set({
                    files: updatedFiles,
                    openTabs: updatedTabs,
                    activeTabId: newActiveTabId,
                })
            },

            setActiveTab: (fileId) => {
                set({ activeTabId: fileId })
            },

            updateFileContent: (fileId, content) => {
                const { files } = get()
                const updatedFiles = files.map(f =>
                    f.id === fileId
                        ? { ...f, content, isModified: true }
                        : f
                )
                set({ files: updatedFiles })
            },

            saveFile: (fileId) => {
                const { files } = get()
                const file = files.find(f => f.id === fileId)
                if (!file) return

                const updatedFiles = files.map(f =>
                    f.id === fileId
                        ? { ...f, isModified: false }
                        : f
                )
                set({ files: updatedFiles })

                audit.fileSave(file.path)
            },

            // Mode actions
            setMode: (mode) => {
                console.log('[Project] Mode changed to:', mode);
                set({ mode });
            },

            togglePreview: () => {
                set(state => ({ isPreviewVisible: !state.isPreviewVisible }));
            },

            setPreviewUrl: (url) => {
                set({ previewUrl: url });
            },

            // Task actions
            addTask: (text) => {
                const id = Date.now().toString();
                set(state => ({
                    tasks: [...state.tasks, { id, text, completed: false, inProgress: false }],
                }));
            },

            toggleTask: (id) => {
                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === id ? { ...t, completed: !t.completed, inProgress: false } : t
                    ),
                }));
            },

            setTaskInProgress: (id, inProgress) => {
                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === id ? { ...t, inProgress } : t
                    ),
                }));
            },
        }),
        {
            name: 'sprintloop:project-state',
            partialize: (state) => ({
                currentProject: state.currentProject,
                isProjectOpen: state.isProjectOpen,
                // Don't persist file contents - too large
            }),
        }
    )
)
