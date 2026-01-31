/**
 * SprintLoop Theme Engine v2
 * 
 * Phase 301-340: Premium theme system
 * - 10+ premium themes
 * - Custom color tokens
 * - Dynamic theme switching
 * - Theme persistence
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface ColorTokens {
    // Background colors
    bgPrimary: string
    bgSecondary: string
    bgTertiary: string
    bgOverlay: string
    bgAccent: string
    bgAccentHover: string
    bgSuccess: string
    bgWarning: string
    bgError: string
    bgInfo: string

    // Text colors
    textPrimary: string
    textSecondary: string
    textTertiary: string
    textInverse: string
    textAccent: string
    textSuccess: string
    textWarning: string
    textError: string

    // Border colors
    borderPrimary: string
    borderSecondary: string
    borderAccent: string
    borderFocus: string

    // Syntax highlighting
    syntaxKeyword: string
    syntaxString: string
    syntaxNumber: string
    syntaxComment: string
    syntaxFunction: string
    syntaxVariable: string
    syntaxType: string
    syntaxOperator: string
    syntaxPunctuation: string

    // Editor specific
    editorBackground: string
    editorLineNumber: string
    editorLineHighlight: string
    editorSelection: string
    editorCursor: string
    editorIndentGuide: string

    // Terminal
    terminalBackground: string
    terminalForeground: string
    terminalCursor: string
    terminalBlack: string
    terminalRed: string
    terminalGreen: string
    terminalYellow: string
    terminalBlue: string
    terminalMagenta: string
    terminalCyan: string
    terminalWhite: string
}

interface ThemeConfig {
    id: string
    name: string
    type: 'dark' | 'light'
    colors: ColorTokens
    fonts?: {
        sans: string
        mono: string
    }
    borderRadius?: {
        sm: string
        md: string
        lg: string
        xl: string
    }
}

interface ThemeContextValue {
    theme: ThemeConfig
    themes: ThemeConfig[]
    setTheme: (themeId: string) => void
    toggleTheme: () => void
    customizeTheme: (overrides: Partial<ColorTokens>) => void
    resetTheme: () => void
}

// ============================================================================
// THEME DEFINITIONS
// ============================================================================

const obsidianTheme: ThemeConfig = {
    id: 'obsidian',
    name: 'Obsidian',
    type: 'dark',
    colors: {
        bgPrimary: '#0a0a0b',
        bgSecondary: '#111113',
        bgTertiary: '#1a1a1e',
        bgOverlay: 'rgba(0, 0, 0, 0.8)',
        bgAccent: '#8b5cf6',
        bgAccentHover: '#7c3aed',
        bgSuccess: '#10b981',
        bgWarning: '#f59e0b',
        bgError: '#ef4444',
        bgInfo: '#3b82f6',

        textPrimary: '#ffffff',
        textSecondary: '#a1a1aa',
        textTertiary: '#71717a',
        textInverse: '#0a0a0b',
        textAccent: '#a78bfa',
        textSuccess: '#34d399',
        textWarning: '#fbbf24',
        textError: '#f87171',

        borderPrimary: 'rgba(255, 255, 255, 0.1)',
        borderSecondary: 'rgba(255, 255, 255, 0.05)',
        borderAccent: '#8b5cf6',
        borderFocus: '#8b5cf6',

        syntaxKeyword: '#c084fc',
        syntaxString: '#86efac',
        syntaxNumber: '#fca5a5',
        syntaxComment: '#6b7280',
        syntaxFunction: '#93c5fd',
        syntaxVariable: '#f9fafb',
        syntaxType: '#fcd34d',
        syntaxOperator: '#f472b6',
        syntaxPunctuation: '#9ca3af',

        editorBackground: '#0a0a0b',
        editorLineNumber: '#4b5563',
        editorLineHighlight: 'rgba(255, 255, 255, 0.05)',
        editorSelection: 'rgba(139, 92, 246, 0.3)',
        editorCursor: '#8b5cf6',
        editorIndentGuide: 'rgba(255, 255, 255, 0.05)',

        terminalBackground: '#0a0a0b',
        terminalForeground: '#e5e7eb',
        terminalCursor: '#8b5cf6',
        terminalBlack: '#1f2937',
        terminalRed: '#ef4444',
        terminalGreen: '#10b981',
        terminalYellow: '#f59e0b',
        terminalBlue: '#3b82f6',
        terminalMagenta: '#a855f7',
        terminalCyan: '#06b6d4',
        terminalWhite: '#f9fafb',
    },
}

const midnightBlue: ThemeConfig = {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    type: 'dark',
    colors: {
        ...obsidianTheme.colors,
        bgPrimary: '#0f172a',
        bgSecondary: '#1e293b',
        bgTertiary: '#334155',
        bgAccent: '#3b82f6',
        bgAccentHover: '#2563eb',
        textAccent: '#60a5fa',
        borderAccent: '#3b82f6',
        borderFocus: '#3b82f6',
        syntaxKeyword: '#7dd3fc',
        editorBackground: '#0f172a',
        editorCursor: '#3b82f6',
        editorSelection: 'rgba(59, 130, 246, 0.3)',
        terminalBackground: '#0f172a',
        terminalCursor: '#3b82f6',
    },
}

const emeraldDark: ThemeConfig = {
    id: 'emerald-dark',
    name: 'Emerald',
    type: 'dark',
    colors: {
        ...obsidianTheme.colors,
        bgPrimary: '#022c22',
        bgSecondary: '#064e3b',
        bgTertiary: '#065f46',
        bgAccent: '#10b981',
        bgAccentHover: '#059669',
        textAccent: '#34d399',
        borderAccent: '#10b981',
        borderFocus: '#10b981',
        syntaxKeyword: '#6ee7b7',
        editorBackground: '#022c22',
        editorCursor: '#10b981',
        editorSelection: 'rgba(16, 185, 129, 0.3)',
        terminalBackground: '#022c22',
        terminalCursor: '#10b981',
    },
}

const rosePine: ThemeConfig = {
    id: 'rose-pine',
    name: 'Rosé Pine',
    type: 'dark',
    colors: {
        ...obsidianTheme.colors,
        bgPrimary: '#191724',
        bgSecondary: '#1f1d2e',
        bgTertiary: '#26233a',
        bgAccent: '#eb6f92',
        bgAccentHover: '#ea5a83',
        textPrimary: '#e0def4',
        textSecondary: '#908caa',
        textTertiary: '#6e6a86',
        textAccent: '#ebbcba',
        borderAccent: '#eb6f92',
        borderFocus: '#c4a7e7',
        syntaxKeyword: '#c4a7e7',
        syntaxString: '#f6c177',
        syntaxNumber: '#eb6f92',
        syntaxFunction: '#9ccfd8',
        editorBackground: '#191724',
        editorCursor: '#c4a7e7',
        editorSelection: 'rgba(196, 167, 231, 0.2)',
        terminalBackground: '#191724',
        terminalCursor: '#c4a7e7',
    },
}

const tokyoNight: ThemeConfig = {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    type: 'dark',
    colors: {
        ...obsidianTheme.colors,
        bgPrimary: '#1a1b26',
        bgSecondary: '#24283b',
        bgTertiary: '#414868',
        bgAccent: '#7aa2f7',
        bgAccentHover: '#6a92e7',
        textPrimary: '#c0caf5',
        textSecondary: '#a9b1d6',
        textTertiary: '#565f89',
        textAccent: '#bb9af7',
        borderAccent: '#7aa2f7',
        borderFocus: '#7aa2f7',
        syntaxKeyword: '#bb9af7',
        syntaxString: '#9ece6a',
        syntaxNumber: '#ff9e64',
        syntaxFunction: '#7aa2f7',
        editorBackground: '#1a1b26',
        editorCursor: '#7aa2f7',
        editorSelection: 'rgba(122, 162, 247, 0.2)',
        terminalBackground: '#1a1b26',
        terminalCursor: '#7aa2f7',
    },
}

const draculaTheme: ThemeConfig = {
    id: 'dracula',
    name: 'Dracula',
    type: 'dark',
    colors: {
        ...obsidianTheme.colors,
        bgPrimary: '#282a36',
        bgSecondary: '#343746',
        bgTertiary: '#44475a',
        bgAccent: '#bd93f9',
        bgAccentHover: '#a570f0',
        textPrimary: '#f8f8f2',
        textSecondary: '#bfc7d5',
        textTertiary: '#6272a4',
        textAccent: '#ff79c6',
        borderAccent: '#bd93f9',
        borderFocus: '#bd93f9',
        syntaxKeyword: '#ff79c6',
        syntaxString: '#f1fa8c',
        syntaxNumber: '#bd93f9',
        syntaxComment: '#6272a4',
        syntaxFunction: '#50fa7b',
        editorBackground: '#282a36',
        editorCursor: '#bd93f9',
        editorSelection: 'rgba(189, 147, 249, 0.2)',
        terminalBackground: '#282a36',
        terminalCursor: '#bd93f9',
    },
}

const nordTheme: ThemeConfig = {
    id: 'nord',
    name: 'Nord',
    type: 'dark',
    colors: {
        ...obsidianTheme.colors,
        bgPrimary: '#2e3440',
        bgSecondary: '#3b4252',
        bgTertiary: '#434c5e',
        bgAccent: '#88c0d0',
        bgAccentHover: '#81a1c1',
        textPrimary: '#eceff4',
        textSecondary: '#d8dee9',
        textTertiary: '#4c566a',
        textAccent: '#8fbcbb',
        borderAccent: '#88c0d0',
        borderFocus: '#88c0d0',
        syntaxKeyword: '#81a1c1',
        syntaxString: '#a3be8c',
        syntaxNumber: '#b48ead',
        syntaxFunction: '#88c0d0',
        editorBackground: '#2e3440',
        editorCursor: '#88c0d0',
        editorSelection: 'rgba(136, 192, 208, 0.2)',
        terminalBackground: '#2e3440',
        terminalCursor: '#88c0d0',
    },
}

const gruvboxDark: ThemeConfig = {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    type: 'dark',
    colors: {
        ...obsidianTheme.colors,
        bgPrimary: '#282828',
        bgSecondary: '#3c3836',
        bgTertiary: '#504945',
        bgAccent: '#fe8019',
        bgAccentHover: '#d65d0e',
        textPrimary: '#ebdbb2',
        textSecondary: '#d5c4a1',
        textTertiary: '#928374',
        textAccent: '#fabd2f',
        borderAccent: '#fe8019',
        borderFocus: '#fe8019',
        syntaxKeyword: '#fb4934',
        syntaxString: '#b8bb26',
        syntaxNumber: '#d3869b',
        syntaxFunction: '#8ec07c',
        editorBackground: '#282828',
        editorCursor: '#fe8019',
        editorSelection: 'rgba(254, 128, 25, 0.2)',
        terminalBackground: '#282828',
        terminalCursor: '#fe8019',
    },
}

const lightTheme: ThemeConfig = {
    id: 'light',
    name: 'Light',
    type: 'light',
    colors: {
        bgPrimary: '#ffffff',
        bgSecondary: '#f8fafc',
        bgTertiary: '#f1f5f9',
        bgOverlay: 'rgba(255, 255, 255, 0.9)',
        bgAccent: '#8b5cf6',
        bgAccentHover: '#7c3aed',
        bgSuccess: '#10b981',
        bgWarning: '#f59e0b',
        bgError: '#ef4444',
        bgInfo: '#3b82f6',

        textPrimary: '#0f172a',
        textSecondary: '#475569',
        textTertiary: '#94a3b8',
        textInverse: '#ffffff',
        textAccent: '#7c3aed',
        textSuccess: '#059669',
        textWarning: '#d97706',
        textError: '#dc2626',

        borderPrimary: '#e2e8f0',
        borderSecondary: '#f1f5f9',
        borderAccent: '#8b5cf6',
        borderFocus: '#8b5cf6',

        syntaxKeyword: '#7c3aed',
        syntaxString: '#059669',
        syntaxNumber: '#dc2626',
        syntaxComment: '#94a3b8',
        syntaxFunction: '#2563eb',
        syntaxVariable: '#0f172a',
        syntaxType: '#d97706',
        syntaxOperator: '#db2777',
        syntaxPunctuation: '#64748b',

        editorBackground: '#ffffff',
        editorLineNumber: '#cbd5e1',
        editorLineHighlight: '#f8fafc',
        editorSelection: 'rgba(139, 92, 246, 0.2)',
        editorCursor: '#8b5cf6',
        editorIndentGuide: '#e2e8f0',

        terminalBackground: '#0f172a',
        terminalForeground: '#e2e8f0',
        terminalCursor: '#8b5cf6',
        terminalBlack: '#1e293b',
        terminalRed: '#ef4444',
        terminalGreen: '#10b981',
        terminalYellow: '#f59e0b',
        terminalBlue: '#3b82f6',
        terminalMagenta: '#a855f7',
        terminalCyan: '#06b6d4',
        terminalWhite: '#f1f5f9',
    },
}

const solarizedLight: ThemeConfig = {
    id: 'solarized-light',
    name: 'Solarized Light',
    type: 'light',
    colors: {
        ...lightTheme.colors,
        bgPrimary: '#fdf6e3',
        bgSecondary: '#eee8d5',
        bgTertiary: '#ddd6c3',
        bgAccent: '#268bd2',
        textPrimary: '#657b83',
        textSecondary: '#839496',
        textAccent: '#268bd2',
        syntaxKeyword: '#859900',
        syntaxString: '#2aa198',
        syntaxNumber: '#d33682',
        editorBackground: '#fdf6e3',
    },
}

// All themes
export const themes: ThemeConfig[] = [
    obsidianTheme,
    midnightBlue,
    emeraldDark,
    rosePine,
    tokyoNight,
    draculaTheme,
    nordTheme,
    gruvboxDark,
    lightTheme,
    solarizedLight,
]

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) throw new Error('useTheme must be used within ThemeProvider')
    return context
}

// ============================================================================
// PROVIDER
// ============================================================================

interface ThemeProviderProps {
    children: React.ReactNode
    defaultTheme?: string
    storageKey?: string
}

export function ThemeProvider({
    children,
    defaultTheme = 'obsidian',
    storageKey = 'sprintloop-theme',
}: ThemeProviderProps) {
    const [currentTheme, setCurrentTheme] = useState<ThemeConfig>(() => {
        if (typeof window === 'undefined') {
            return themes.find(t => t.id === defaultTheme) || obsidianTheme
        }

        const stored = localStorage.getItem(storageKey)
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                const found = themes.find(t => t.id === parsed.id)
                if (found) {
                    return { ...found, colors: { ...found.colors, ...parsed.customColors } }
                }
            } catch {
                // Use default
            }
        }

        return themes.find(t => t.id === defaultTheme) || obsidianTheme
    })

    const [customOverrides, setCustomOverrides] = useState<Partial<ColorTokens>>({})

    // Apply theme CSS variables
    useEffect(() => {
        const root = document.documentElement
        const colors = { ...currentTheme.colors, ...customOverrides }

        Object.entries(colors).forEach(([key, value]) => {
            const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
            root.style.setProperty(cssVar, value)
        })

        root.setAttribute('data-theme', currentTheme.id)
        root.setAttribute('data-theme-type', currentTheme.type)

        // Persist
        localStorage.setItem(storageKey, JSON.stringify({
            id: currentTheme.id,
            customColors: customOverrides,
        }))
    }, [currentTheme, customOverrides, storageKey])

    const setTheme = useCallback((themeId: string) => {
        const theme = themes.find(t => t.id === themeId)
        if (theme) {
            setCurrentTheme(theme)
            setCustomOverrides({})
        }
    }, [])

    const toggleTheme = useCallback(() => {
        const currentIndex = themes.findIndex(t => t.id === currentTheme.id)
        const nextIndex = (currentIndex + 1) % themes.length
        setCurrentTheme(themes[nextIndex])
        setCustomOverrides({})
    }, [currentTheme])

    const customizeTheme = useCallback((overrides: Partial<ColorTokens>) => {
        setCustomOverrides(prev => ({ ...prev, ...overrides }))
    }, [])

    const resetTheme = useCallback(() => {
        setCustomOverrides({})
    }, [])

    return (
        <ThemeContext.Provider
            value={{
                theme: { ...currentTheme, colors: { ...currentTheme.colors, ...customOverrides } },
                themes,
                setTheme,
                toggleTheme,
                customizeTheme,
                resetTheme,
            }}
        >
            {children}
        </ThemeContext.Provider>
    )
}

// ============================================================================
// THEME SWITCHER COMPONENT
// ============================================================================

interface ThemeSwitcherProps {
    showPreview?: boolean
    className?: string
}

export function ThemeSwitcher({ showPreview = true, className = '' }: ThemeSwitcherProps) {
    const { theme, themes, setTheme } = useTheme()

    return (
        <div className={`grid grid-cols-5 gap-2 ${className}`}>
            {themes.map(t => (
                <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`
                        relative p-3 rounded-lg border-2 transition-all
                        ${theme.id === t.id
                            ? 'border-purple-500 ring-2 ring-purple-500/20'
                            : 'border-transparent hover:border-white/20'
                        }
                    `}
                    style={{ backgroundColor: t.colors.bgPrimary }}
                    title={t.name}
                >
                    {showPreview && (
                        <div className="flex gap-1">
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: t.colors.bgAccent }}
                            />
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: t.colors.textPrimary }}
                            />
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: t.colors.syntaxKeyword }}
                            />
                        </div>
                    )}
                    <span
                        className="block text-xs mt-2 truncate"
                        style={{ color: t.colors.textSecondary }}
                    >
                        {t.name}
                    </span>
                </button>
            ))}
        </div>
    )
}

// ============================================================================
// CSS VARIABLES OUTPUT
// ============================================================================

export function generateThemeCSS(theme: ThemeConfig): string {
    return Object.entries(theme.colors)
        .map(([key, value]) => {
            const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
            return `${cssVar}: ${value};`
        })
        .join('\n')
}
