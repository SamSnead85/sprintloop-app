/**
 * User Preferences Store
 * Persists user settings, selected model, and API key status
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getApiKeyStatus, type ModelId } from '../lib/ai/provider'
import { audit } from '../lib/audit/logger'

interface UserPreferences {
    // AI Settings
    preferredModel: ModelId

    // UI Settings
    theme: 'dark' | 'light' | 'system'
    fontSize: number
    tabSize: number

    // Feature Flags
    enableAuditLogging: boolean
    enableAutoSave: boolean

    // Recent Projects
    recentProjects: {
        id: string
        name: string
        path: string
        lastOpened: string
    }[]
}

interface UserStore extends UserPreferences {
    // API Key Status (computed, not persisted)
    apiKeyStatus: ReturnType<typeof getApiKeyStatus>

    // Actions
    setPreferredModel: (model: ModelId) => void
    setTheme: (theme: 'dark' | 'light' | 'system') => void
    setFontSize: (size: number) => void
    setTabSize: (size: number) => void
    toggleAuditLogging: () => void
    toggleAutoSave: () => void
    addRecentProject: (project: { id: string; name: string; path: string }) => void
    removeRecentProject: (projectId: string) => void
    refreshApiKeyStatus: () => void

    // Initialization
    _hasHydrated: boolean
    setHasHydrated: (state: boolean) => void
}

export const useUserStore = create<UserStore>()(
    persist(
        (set, get) => ({
            // Default preferences
            preferredModel: 'claude-4.5-sonnet',
            theme: 'dark',
            fontSize: 14,
            tabSize: 2,
            enableAuditLogging: true,
            enableAutoSave: true,
            recentProjects: [],

            // API Key Status (refreshed on mount)
            apiKeyStatus: getApiKeyStatus(),

            // Hydration state
            _hasHydrated: false,
            setHasHydrated: (state) => set({ _hasHydrated: state }),

            // Actions
            setPreferredModel: (model) => {
                const previous = get().preferredModel
                set({ preferredModel: model })
                audit.modelSwitch(previous, model)
            },

            setTheme: (theme) => {
                const previous = get().theme
                set({ theme })
                audit.settingChange('theme', previous, theme)
            },

            setFontSize: (size) => {
                set({ fontSize: size })
            },

            setTabSize: (size) => {
                set({ tabSize: size })
            },

            toggleAuditLogging: () => {
                const current = get().enableAuditLogging
                set({ enableAuditLogging: !current })
                audit.settingChange('enableAuditLogging', current, !current)
            },

            toggleAutoSave: () => {
                const current = get().enableAutoSave
                set({ enableAutoSave: !current })
                audit.settingChange('enableAutoSave', current, !current)
            },

            addRecentProject: (project) => {
                const { recentProjects } = get()
                const filtered = recentProjects.filter(p => p.id !== project.id)
                const updated = [
                    { ...project, lastOpened: new Date().toISOString() },
                    ...filtered,
                ].slice(0, 10) // Keep only 10 most recent
                set({ recentProjects: updated })
            },

            removeRecentProject: (projectId) => {
                const { recentProjects } = get()
                set({ recentProjects: recentProjects.filter(p => p.id !== projectId) })
            },

            refreshApiKeyStatus: () => {
                set({ apiKeyStatus: getApiKeyStatus() })
            },
        }),
        {
            name: 'sprintloop:user-preferences',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true)
                state?.refreshApiKeyStatus()
            },
            partialize: (state) => ({
                preferredModel: state.preferredModel,
                theme: state.theme,
                fontSize: state.fontSize,
                tabSize: state.tabSize,
                enableAuditLogging: state.enableAuditLogging,
                enableAutoSave: state.enableAutoSave,
                recentProjects: state.recentProjects,
            }),
        }
    )
)

// Hook to wait for hydration
export function useHasHydrated() {
    return useUserStore((state) => state._hasHydrated)
}
