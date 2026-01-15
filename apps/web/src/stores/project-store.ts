/**
 * Project Store
 * Manages current project state, files, and open tabs
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type AIModel, DEFAULT_MODEL } from '../config/models'
import { audit } from '../lib/audit/logger'

export interface ProjectFile {
    id: string
    name: string
    path: string
    content: string
    language: string
    isModified: boolean
}

export interface Project {
    id: string
    name: string
    path: string
    model: AIModel
    createdAt: string
    lastOpened: string
}

interface ProjectStore {
    // Current project
    currentProject: Project | null
    isProjectOpen: boolean

    // Files
    files: ProjectFile[]
    openTabs: string[] // file IDs
    activeTabId: string | null

    // Actions
    openProject: (path: string, name: string, model?: AIModel) => void
    closeProject: () => void
    setProjectModel: (model: AIModel) => void

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
            files: [],
            openTabs: [],
            activeTabId: null,

            // Project actions
            openProject: (path, name, model = DEFAULT_MODEL) => {
                const project: Project = {
                    id: `project-${Date.now()}`,
                    name,
                    path,
                    model,
                    createdAt: new Date().toISOString(),
                    lastOpened: new Date().toISOString(),
                }

                set({
                    currentProject: project,
                    isProjectOpen: true,
                    files: [],
                    openTabs: [],
                    activeTabId: null,
                })

                audit.projectOpen(path, name)
            },

            closeProject: () => {
                const { currentProject } = get()
                if (currentProject) {
                    audit.projectClose(currentProject.path)
                }

                set({
                    currentProject: null,
                    isProjectOpen: false,
                    files: [],
                    openTabs: [],
                    activeTabId: null,
                })
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
