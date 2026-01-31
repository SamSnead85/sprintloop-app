/**
 * SprintLoop Workspace Settings System
 * 
 * Phase 1201-1250: Settings management
 * - Settings categories
 * - Search settings
 * - Setting types (toggle, select, input)
 * - Settings sync
 * - Default reset
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import {
    Settings,
    Search,
    ChevronRight,
    ChevronDown,
    RotateCcw,
    Cloud,
    CloudOff,
    Check,
    Code,
    Palette,
    Terminal,
    Keyboard,
    Eye,
    FileText,
    GitBranch,
    Zap,
    Shield,
    Globe,
    Layout,
    Monitor
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type SettingType = 'boolean' | 'string' | 'number' | 'select' | 'multiselect' | 'color' | 'keybinding'

interface SettingOption {
    value: string
    label: string
    description?: string
}

interface Setting {
    id: string
    key: string
    label: string
    description?: string
    type: SettingType
    category: string
    subcategory?: string
    defaultValue: unknown
    value: unknown
    options?: SettingOption[]
    min?: number
    max?: number
    step?: number
    tags?: string[]
}

interface SettingsCategory {
    id: string
    label: string
    icon: React.ReactNode
    description?: string
    subcategories?: string[]
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const defaultSettings: Setting[] = [
    // Editor settings
    {
        id: 'editor.fontSize',
        key: 'editor.fontSize',
        label: 'Font Size',
        description: 'Controls the font size in pixels',
        type: 'number',
        category: 'editor',
        defaultValue: 14,
        value: 14,
        min: 8,
        max: 32,
        step: 1,
    },
    {
        id: 'editor.fontFamily',
        key: 'editor.fontFamily',
        label: 'Font Family',
        description: 'Controls the font family',
        type: 'string',
        category: 'editor',
        defaultValue: 'JetBrains Mono, monospace',
        value: 'JetBrains Mono, monospace',
    },
    {
        id: 'editor.tabSize',
        key: 'editor.tabSize',
        label: 'Tab Size',
        description: 'The number of spaces a tab is equal to',
        type: 'number',
        category: 'editor',
        defaultValue: 2,
        value: 2,
        min: 1,
        max: 8,
    },
    {
        id: 'editor.insertSpaces',
        key: 'editor.insertSpaces',
        label: 'Insert Spaces',
        description: 'Insert spaces when pressing Tab',
        type: 'boolean',
        category: 'editor',
        defaultValue: true,
        value: true,
    },
    {
        id: 'editor.wordWrap',
        key: 'editor.wordWrap',
        label: 'Word Wrap',
        description: 'Controls how lines should wrap',
        type: 'select',
        category: 'editor',
        defaultValue: 'off',
        value: 'off',
        options: [
            { value: 'off', label: 'Off' },
            { value: 'on', label: 'On' },
            { value: 'wordWrapColumn', label: 'Word Wrap Column' },
            { value: 'bounded', label: 'Bounded' },
        ],
    },
    {
        id: 'editor.minimap.enabled',
        key: 'editor.minimap.enabled',
        label: 'Show Minimap',
        description: 'Controls whether the minimap is shown',
        type: 'boolean',
        category: 'editor',
        subcategory: 'Minimap',
        defaultValue: true,
        value: true,
    },
    {
        id: 'editor.lineNumbers',
        key: 'editor.lineNumbers',
        label: 'Line Numbers',
        description: 'Controls the display of line numbers',
        type: 'select',
        category: 'editor',
        defaultValue: 'on',
        value: 'on',
        options: [
            { value: 'off', label: 'Off' },
            { value: 'on', label: 'On' },
            { value: 'relative', label: 'Relative' },
        ],
    },
    {
        id: 'editor.cursorBlinking',
        key: 'editor.cursorBlinking',
        label: 'Cursor Blinking',
        description: 'Control the cursor animation style',
        type: 'select',
        category: 'editor',
        defaultValue: 'blink',
        value: 'blink',
        options: [
            { value: 'blink', label: 'Blink' },
            { value: 'smooth', label: 'Smooth' },
            { value: 'phase', label: 'Phase' },
            { value: 'expand', label: 'Expand' },
            { value: 'solid', label: 'Solid' },
        ],
    },
    // Appearance settings
    {
        id: 'workbench.colorTheme',
        key: 'workbench.colorTheme',
        label: 'Color Theme',
        description: 'Specifies the color theme',
        type: 'select',
        category: 'appearance',
        defaultValue: 'obsidian',
        value: 'obsidian',
        options: [
            { value: 'obsidian', label: 'Obsidian' },
            { value: 'midnight-blue', label: 'Midnight Blue' },
            { value: 'tokyo-night', label: 'Tokyo Night' },
            { value: 'dracula', label: 'Dracula' },
            { value: 'nord', label: 'Nord' },
        ],
    },
    {
        id: 'workbench.iconTheme',
        key: 'workbench.iconTheme',
        label: 'Icon Theme',
        description: 'Specifies the file icon theme',
        type: 'select',
        category: 'appearance',
        defaultValue: 'material-icons',
        value: 'material-icons',
        options: [
            { value: 'material-icons', label: 'Material Icons' },
            { value: 'seti', label: 'Seti' },
            { value: 'minimal', label: 'Minimal' },
        ],
    },
    {
        id: 'workbench.sideBar.location',
        key: 'workbench.sideBar.location',
        label: 'Sidebar Location',
        description: 'Controls the location of the sidebar',
        type: 'select',
        category: 'appearance',
        defaultValue: 'left',
        value: 'left',
        options: [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
        ],
    },
    // Terminal settings
    {
        id: 'terminal.fontFamily',
        key: 'terminal.fontFamily',
        label: 'Terminal Font Family',
        description: 'Controls the font family of the terminal',
        type: 'string',
        category: 'terminal',
        defaultValue: 'JetBrains Mono, monospace',
        value: 'JetBrains Mono, monospace',
    },
    {
        id: 'terminal.fontSize',
        key: 'terminal.fontSize',
        label: 'Terminal Font Size',
        description: 'Controls the font size of the terminal',
        type: 'number',
        category: 'terminal',
        defaultValue: 13,
        value: 13,
        min: 8,
        max: 24,
    },
    {
        id: 'terminal.cursorStyle',
        key: 'terminal.cursorStyle',
        label: 'Cursor Style',
        description: 'Controls the style of the terminal cursor',
        type: 'select',
        category: 'terminal',
        defaultValue: 'block',
        value: 'block',
        options: [
            { value: 'block', label: 'Block' },
            { value: 'line', label: 'Line' },
            { value: 'underline', label: 'Underline' },
        ],
    },
    // Files settings
    {
        id: 'files.autoSave',
        key: 'files.autoSave',
        label: 'Auto Save',
        description: 'Controls auto save of dirty editors',
        type: 'select',
        category: 'files',
        defaultValue: 'afterDelay',
        value: 'afterDelay',
        options: [
            { value: 'off', label: 'Off' },
            { value: 'afterDelay', label: 'After Delay' },
            { value: 'onFocusChange', label: 'On Focus Change' },
            { value: 'onWindowChange', label: 'On Window Change' },
        ],
    },
    {
        id: 'files.autoSaveDelay',
        key: 'files.autoSaveDelay',
        label: 'Auto Save Delay',
        description: 'Controls the delay in milliseconds after which a dirty editor is auto saved',
        type: 'number',
        category: 'files',
        defaultValue: 1000,
        value: 1000,
        min: 100,
        max: 10000,
        step: 100,
    },
    {
        id: 'files.trimTrailingWhitespace',
        key: 'files.trimTrailingWhitespace',
        label: 'Trim Trailing Whitespace',
        description: 'When enabled, will trim trailing whitespace when saving a file',
        type: 'boolean',
        category: 'files',
        defaultValue: true,
        value: true,
    },
    // Git settings
    {
        id: 'git.autofetch',
        key: 'git.autofetch',
        label: 'Auto Fetch',
        description: 'When enabled, fetch all branches periodically',
        type: 'boolean',
        category: 'git',
        defaultValue: true,
        value: true,
    },
    {
        id: 'git.confirmSync',
        key: 'git.confirmSync',
        label: 'Confirm Sync',
        description: 'Confirm before synchronizing',
        type: 'boolean',
        category: 'git',
        defaultValue: true,
        value: true,
    },
]

const settingsCategories: SettingsCategory[] = [
    { id: 'editor', label: 'Editor', icon: <Code className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'terminal', label: 'Terminal', icon: <Terminal className="w-4 h-4" /> },
    { id: 'files', label: 'Files', icon: <FileText className="w-4 h-4" /> },
    { id: 'git', label: 'Git', icon: <GitBranch className="w-4 h-4" /> },
    { id: 'keyboard', label: 'Keyboard', icon: <Keyboard className="w-4 h-4" /> },
    { id: 'extensions', label: 'Extensions', icon: <Zap className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Shield className="w-4 h-4" /> },
]

// ============================================================================
// CONTEXT
// ============================================================================

interface SettingsContextValue {
    settings: Setting[]
    categories: SettingsCategory[]
    getSetting: <T>(key: string) => T
    updateSetting: (key: string, value: unknown) => void
    resetSetting: (key: string) => void
    resetAllSettings: () => void
    searchSettings: (query: string) => Setting[]
    syncEnabled: boolean
    toggleSync: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function useSettings() {
    const context = useContext(SettingsContext)
    if (!context) throw new Error('useSettings must be used within SettingsProvider')
    return context
}

// ============================================================================
// PROVIDER
// ============================================================================

interface SettingsProviderProps {
    children: React.ReactNode
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    const [settings, setSettings] = useState<Setting[]>(defaultSettings)
    const [syncEnabled, setSyncEnabled] = useState(false)

    const getSetting = useCallback(<T,>(key: string): T => {
        const setting = settings.find(s => s.key === key)
        return (setting?.value ?? setting?.defaultValue) as T
    }, [settings])

    const updateSetting = useCallback((key: string, value: unknown) => {
        setSettings(prev =>
            prev.map(s => s.key === key ? { ...s, value } : s)
        )
    }, [])

    const resetSetting = useCallback((key: string) => {
        setSettings(prev =>
            prev.map(s => s.key === key ? { ...s, value: s.defaultValue } : s)
        )
    }, [])

    const resetAllSettings = useCallback(() => {
        setSettings(prev =>
            prev.map(s => ({ ...s, value: s.defaultValue }))
        )
    }, [])

    const searchSettings = useCallback((query: string) => {
        const lowerQuery = query.toLowerCase()
        return settings.filter(s =>
            s.label.toLowerCase().includes(lowerQuery) ||
            s.description?.toLowerCase().includes(lowerQuery) ||
            s.key.toLowerCase().includes(lowerQuery) ||
            s.tags?.some(t => t.toLowerCase().includes(lowerQuery))
        )
    }, [settings])

    const toggleSync = useCallback(() => {
        setSyncEnabled(prev => !prev)
    }, [])

    return (
        <SettingsContext.Provider
            value={{
                settings,
                categories: settingsCategories,
                getSetting,
                updateSetting,
                resetSetting,
                resetAllSettings,
                searchSettings,
                syncEnabled,
                toggleSync,
            }}
        >
            {children}
        </SettingsContext.Provider>
    )
}

// ============================================================================
// SETTING CONTROL
// ============================================================================

interface SettingControlProps {
    setting: Setting
    onChange: (value: unknown) => void
    onReset?: () => void
}

export function SettingControl({ setting, onChange, onReset }: SettingControlProps) {
    const isModified = setting.value !== setting.defaultValue

    const renderControl = () => {
        switch (setting.type) {
            case 'boolean':
                return (
                    <button
                        onClick={() => onChange(!setting.value)}
                        className={`
                            relative w-11 h-6 rounded-full transition-colors
                            ${setting.value ? 'bg-purple-500' : 'bg-slate-700'}
                        `}
                    >
                        <span
                            className={`
                                absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                                ${setting.value ? 'left-6' : 'left-1'}
                            `}
                        />
                    </button>
                )

            case 'string':
                return (
                    <input
                        type="text"
                        value={setting.value as string}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-64 px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                    />
                )

            case 'number':
                return (
                    <div className="flex items-center gap-2">
                        <input
                            type="range"
                            min={setting.min}
                            max={setting.max}
                            step={setting.step}
                            value={setting.value as number}
                            onChange={(e) => onChange(Number(e.target.value))}
                            className="w-32 accent-purple-500"
                        />
                        <input
                            type="number"
                            min={setting.min}
                            max={setting.max}
                            step={setting.step}
                            value={setting.value as number}
                            onChange={(e) => onChange(Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-slate-800 border border-white/10 rounded text-sm text-white text-center focus:outline-none focus:border-purple-500"
                        />
                    </div>
                )

            case 'select':
                return (
                    <select
                        value={setting.value as string}
                        onChange={(e) => onChange(e.target.value)}
                        className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                        {setting.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                )

            default:
                return null
        }
    }

    return (
        <div className="flex items-start justify-between py-4 border-b border-white/5">
            <div className="flex-1 pr-4">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-white">{setting.label}</h4>
                    {isModified && (
                        <span className="w-2 h-2 bg-purple-500 rounded-full" title="Modified" />
                    )}
                </div>
                {setting.description && (
                    <p className="text-xs text-gray-500 mt-1">{setting.description}</p>
                )}
                <p className="text-xs text-gray-600 font-mono mt-1">{setting.key}</p>
            </div>

            <div className="flex items-center gap-2">
                {renderControl()}
                {isModified && onReset && (
                    <button
                        onClick={onReset}
                        className="p-1.5 text-gray-500 hover:text-white transition-colors"
                        title="Reset to default"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// SETTINGS PANEL
// ============================================================================

interface SettingsPanelProps {
    className?: string
}

export function SettingsPanel({ className = '' }: SettingsPanelProps) {
    const {
        settings,
        categories,
        updateSetting,
        resetSetting,
        resetAllSettings,
        searchSettings,
        syncEnabled,
        toggleSync,
    } = useSettings()

    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const filteredSettings = useMemo(() => {
        if (search) return searchSettings(search)
        if (selectedCategory) return settings.filter(s => s.category === selectedCategory)
        return settings
    }, [settings, search, selectedCategory, searchSettings])

    const groupedSettings = useMemo(() => {
        const groups: Record<string, Setting[]> = {}
        filteredSettings.forEach(s => {
            const key = s.subcategory || s.category
            if (!groups[key]) groups[key] = []
            groups[key].push(s)
        })
        return groups
    }, [filteredSettings])

    return (
        <div className={`flex h-full bg-slate-900 ${className}`}>
            {/* Sidebar */}
            <div className="w-56 border-r border-white/5 flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search settings..."
                            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Settings className="w-4 h-4" />
                        All Settings
                    </button>

                    <div className="h-px bg-white/5 my-2" />

                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.id ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {cat.icon}
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Sync toggle */}
                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={toggleSync}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${syncEnabled ? 'bg-green-500/10 text-green-400' : 'text-gray-400 hover:bg-white/5'
                            }`}
                    >
                        {syncEnabled ? <Cloud className="w-4 h-4" /> : <CloudOff className="w-4 h-4" />}
                        {syncEnabled ? 'Settings Sync On' : 'Settings Sync Off'}
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto">
                <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-white/5">
                    <h2 className="text-lg font-medium text-white">
                        {selectedCategory
                            ? categories.find(c => c.id === selectedCategory)?.label
                            : 'All Settings'}
                    </h2>
                    <button
                        onClick={resetAllSettings}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset All
                    </button>
                </div>

                <div className="p-6">
                    {Object.entries(groupedSettings).map(([group, groupSettings]) => (
                        <div key={group} className="mb-8">
                            <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">
                                {group}
                            </h3>
                            <div className="bg-slate-800/30 rounded-xl px-4">
                                {groupSettings.map(setting => (
                                    <SettingControl
                                        key={setting.id}
                                        setting={setting}
                                        onChange={(value) => updateSetting(setting.key, value)}
                                        onReset={() => resetSetting(setting.key)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}

                    {filteredSettings.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <Settings className="w-12 h-12 mb-4 opacity-30" />
                            <p>No settings found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
