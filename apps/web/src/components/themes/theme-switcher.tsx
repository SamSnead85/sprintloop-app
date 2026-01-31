/**
 * SprintLoop Theme Switcher System
 * 
 * Phase 2001-2050: Theme management
 * - Theme gallery
 * - Preview on hover
 * - Custom themes
 * - Color customization
 * - Import/export
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
    Palette,
    Sun,
    Moon,
    Monitor,
    Check,
    Plus,
    Edit3,
    Trash2,
    Download,
    Upload,
    Star,
    StarOff,
    Eye,
    ChevronRight,
    Search
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface ThemeColors {
    background: string
    foreground: string
    accent: string
    accentForeground: string
    muted: string
    mutedForeground: string
    border: string
    selection: string
    lineHighlight: string
    error: string
    warning: string
    success: string
    info: string
}

interface Theme {
    id: string
    name: string
    type: 'dark' | 'light' | 'high-contrast'
    colors: ThemeColors
    isBuiltIn?: boolean
    isFavorite?: boolean
    author?: string
}

// ============================================================================
// THEME PREVIEW
// ============================================================================

interface ThemePreviewProps {
    theme: Theme
    isActive: boolean
    onSelect: () => void
    onToggleFavorite?: () => void
    onEdit?: () => void
    onDelete?: () => void
    showActions?: boolean
}

function ThemePreview({
    theme,
    isActive,
    onSelect,
    onToggleFavorite,
    onEdit,
    onDelete,
    showActions = true,
}: ThemePreviewProps) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
                group relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all
                ${isActive ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/10 hover:border-white/20'}
            `}
            onClick={onSelect}
        >
            {/* Mini preview */}
            <div
                className="h-20 p-2"
                style={{ backgroundColor: theme.colors.background }}
            >
                {/* Fake editor */}
                <div className="flex gap-1">
                    {/* Sidebar */}
                    <div
                        className="w-4 h-full rounded-sm"
                        style={{ backgroundColor: theme.colors.muted }}
                    />
                    {/* Editor area */}
                    <div className="flex-1 space-y-1">
                        {/* Toolbar */}
                        <div
                            className="h-2 rounded-sm"
                            style={{ backgroundColor: theme.colors.muted }}
                        />
                        {/* Code lines */}
                        <div className="space-y-0.5">
                            <div className="flex gap-1">
                                <div
                                    className="w-4 h-1.5 rounded-sm"
                                    style={{ backgroundColor: theme.colors.accent }}
                                />
                                <div
                                    className="w-8 h-1.5 rounded-sm"
                                    style={{ backgroundColor: theme.colors.foreground, opacity: 0.6 }}
                                />
                            </div>
                            <div className="flex gap-1 pl-2">
                                <div
                                    className="w-6 h-1.5 rounded-sm"
                                    style={{ backgroundColor: theme.colors.success }}
                                />
                                <div
                                    className="w-10 h-1.5 rounded-sm"
                                    style={{ backgroundColor: theme.colors.foreground, opacity: 0.6 }}
                                />
                            </div>
                            <div className="flex gap-1 pl-2">
                                <div
                                    className="w-5 h-1.5 rounded-sm"
                                    style={{ backgroundColor: theme.colors.warning }}
                                />
                                <div
                                    className="w-4 h-1.5 rounded-sm"
                                    style={{ backgroundColor: theme.colors.foreground, opacity: 0.6 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Theme name */}
            <div
                className="px-2 py-1.5 flex items-center justify-between"
                style={{ backgroundColor: theme.colors.muted }}
            >
                <span
                    className="text-xs font-medium truncate"
                    style={{ color: theme.colors.foreground }}
                >
                    {theme.name}
                </span>
                {isActive && (
                    <Check className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                )}
            </div>

            {/* Actions overlay */}
            {showActions && isHovered && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2">
                    {onToggleFavorite && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleFavorite()
                            }}
                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                            title={theme.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                            {theme.isFavorite ? (
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            ) : (
                                <StarOff className="w-4 h-4 text-white" />
                            )}
                        </button>
                    )}
                    {!theme.isBuiltIn && onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit()
                            }}
                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                            title="Edit theme"
                        >
                            <Edit3 className="w-4 h-4 text-white" />
                        </button>
                    )}
                    {!theme.isBuiltIn && onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete()
                            }}
                            className="p-2 bg-white/10 rounded-lg hover:bg-red-500/50 transition-colors"
                            title="Delete theme"
                        >
                            <Trash2 className="w-4 h-4 text-white" />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// COLOR PICKER
// ============================================================================

interface ColorPickerProps {
    label: string
    value: string
    onChange: (value: string) => void
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-400">{label}</span>
            <div className="flex items-center gap-2">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer bg-transparent"
                />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-20 px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-gray-300 font-mono focus:outline-none focus:border-purple-500"
                />
            </div>
        </div>
    )
}

// ============================================================================
// THEME SWITCHER
// ============================================================================

interface ThemeSwitcherProps {
    themes?: Theme[]
    activeThemeId?: string
    onSelectTheme?: (theme: Theme) => void
    onCreateTheme?: () => void
    onEditTheme?: (theme: Theme) => void
    onDeleteTheme?: (theme: Theme) => void
    onToggleFavorite?: (theme: Theme) => void
    onExport?: () => void
    onImport?: () => void
    className?: string
}

export function ThemeSwitcher({
    themes: propThemes,
    activeThemeId: propActiveId,
    onSelectTheme,
    onCreateTheme,
    onEditTheme,
    onDeleteTheme,
    onToggleFavorite,
    onExport,
    onImport,
    className = '',
}: ThemeSwitcherProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'dark' | 'light' | 'high-contrast'>('all')

    // Demo themes
    const defaultThemes: Theme[] = [
        {
            id: 'dark-default',
            name: 'Dark+',
            type: 'dark',
            isBuiltIn: true,
            colors: {
                background: '#1e1e1e',
                foreground: '#d4d4d4',
                accent: '#569cd6',
                accentForeground: '#ffffff',
                muted: '#252526',
                mutedForeground: '#808080',
                border: '#3c3c3c',
                selection: '#264f78',
                lineHighlight: '#2a2d2e',
                error: '#f14c4c',
                warning: '#cca700',
                success: '#89d185',
                info: '#3794ff',
            },
        },
        {
            id: 'light-default',
            name: 'Light+',
            type: 'light',
            isBuiltIn: true,
            colors: {
                background: '#ffffff',
                foreground: '#000000',
                accent: '#0066b8',
                accentForeground: '#ffffff',
                muted: '#f3f3f3',
                mutedForeground: '#6e6e6e',
                border: '#e5e5e5',
                selection: '#add6ff',
                lineHighlight: '#f5f5f5',
                error: '#d32f2f',
                warning: '#fb8c00',
                success: '#388e3c',
                info: '#1976d2',
            },
        },
        {
            id: 'monokai',
            name: 'Monokai',
            type: 'dark',
            isBuiltIn: true,
            isFavorite: true,
            colors: {
                background: '#272822',
                foreground: '#f8f8f2',
                accent: '#66d9ef',
                accentForeground: '#000000',
                muted: '#3e3d32',
                mutedForeground: '#75715e',
                border: '#49483e',
                selection: '#49483e',
                lineHighlight: '#3e3d32',
                error: '#f92672',
                warning: '#e6db74',
                success: '#a6e22e',
                info: '#66d9ef',
            },
        },
        {
            id: 'dracula',
            name: 'Dracula',
            type: 'dark',
            isBuiltIn: true,
            colors: {
                background: '#282a36',
                foreground: '#f8f8f2',
                accent: '#8be9fd',
                accentForeground: '#282a36',
                muted: '#44475a',
                mutedForeground: '#6272a4',
                border: '#44475a',
                selection: '#44475a',
                lineHighlight: '#44475a',
                error: '#ff5555',
                warning: '#f1fa8c',
                success: '#50fa7b',
                info: '#8be9fd',
            },
        },
        {
            id: 'github-dark',
            name: 'GitHub Dark',
            type: 'dark',
            isBuiltIn: true,
            colors: {
                background: '#0d1117',
                foreground: '#c9d1d9',
                accent: '#58a6ff',
                accentForeground: '#ffffff',
                muted: '#161b22',
                mutedForeground: '#8b949e',
                border: '#30363d',
                selection: '#264f78',
                lineHighlight: '#161b22',
                error: '#f85149',
                warning: '#d29922',
                success: '#3fb950',
                info: '#58a6ff',
            },
        },
        {
            id: 'one-dark-pro',
            name: 'One Dark Pro',
            type: 'dark',
            isBuiltIn: true,
            colors: {
                background: '#282c34',
                foreground: '#abb2bf',
                accent: '#61afef',
                accentForeground: '#282c34',
                muted: '#21252b',
                mutedForeground: '#5c6370',
                border: '#3e4451',
                selection: '#3e4451',
                lineHighlight: '#2c313c',
                error: '#e06c75',
                warning: '#e5c07b',
                success: '#98c379',
                info: '#61afef',
            },
        },
    ]

    const themes = propThemes || defaultThemes
    const activeThemeId = propActiveId || 'dark-default'

    // Filter themes
    const filteredThemes = useMemo(() => {
        return themes.filter(theme => {
            if (filterType !== 'all' && theme.type !== filterType) return false
            if (searchQuery) {
                return theme.name.toLowerCase().includes(searchQuery.toLowerCase())
            }
            return true
        })
    }, [themes, filterType, searchQuery])

    // Group by favorites
    const favoriteThemes = filteredThemes.filter(t => t.isFavorite)
    const otherThemes = filteredThemes.filter(t => !t.isFavorite)

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-white">Themes</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onImport}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="Import theme"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onExport}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="Export theme"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onCreateTheme}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="Create theme"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Search and filter */}
            <div className="px-4 py-3 space-y-2 border-b border-white/5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search themes..."
                        className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`flex-1 py-1.5 rounded text-xs transition-colors ${filterType === 'all' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterType('dark')}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs transition-colors ${filterType === 'dark' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        <Moon className="w-3 h-3" /> Dark
                    </button>
                    <button
                        onClick={() => setFilterType('light')}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs transition-colors ${filterType === 'light' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        <Sun className="w-3 h-3" /> Light
                    </button>
                    <button
                        onClick={() => setFilterType('high-contrast')}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs transition-colors ${filterType === 'high-contrast' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        <Monitor className="w-3 h-3" /> HC
                    </button>
                </div>
            </div>

            {/* Theme gallery */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Favorites */}
                {favoriteThemes.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-medium text-gray-400 uppercase">Favorites</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {favoriteThemes.map(theme => (
                                <ThemePreview
                                    key={theme.id}
                                    theme={theme}
                                    isActive={theme.id === activeThemeId}
                                    onSelect={() => onSelectTheme?.(theme)}
                                    onToggleFavorite={() => onToggleFavorite?.(theme)}
                                    onEdit={() => onEditTheme?.(theme)}
                                    onDelete={() => onDeleteTheme?.(theme)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* All themes */}
                <div>
                    {favoriteThemes.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                            <Palette className="w-4 h-4 text-gray-500" />
                            <span className="text-xs font-medium text-gray-400 uppercase">All Themes</span>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        {otherThemes.map(theme => (
                            <ThemePreview
                                key={theme.id}
                                theme={theme}
                                isActive={theme.id === activeThemeId}
                                onSelect={() => onSelectTheme?.(theme)}
                                onToggleFavorite={() => onToggleFavorite?.(theme)}
                                onEdit={() => onEditTheme?.(theme)}
                                onDelete={() => onDeleteTheme?.(theme)}
                            />
                        ))}
                    </div>
                </div>

                {filteredThemes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Palette className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No themes found</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// QUICK THEME TOGGLE
// ============================================================================

interface QuickThemeToggleProps {
    isDark: boolean
    onToggle: () => void
    className?: string
}

export function QuickThemeToggle({ isDark, onToggle, className = '' }: QuickThemeToggleProps) {
    return (
        <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-colors hover:bg-white/5 ${className}`}
            title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
            {isDark ? (
                <Sun className="w-5 h-5 text-gray-400 hover:text-yellow-400 transition-colors" />
            ) : (
                <Moon className="w-5 h-5 text-gray-400 hover:text-purple-400 transition-colors" />
            )}
        </button>
    )
}
