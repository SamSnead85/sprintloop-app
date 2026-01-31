/**
 * SprintLoop Theme System
 * 
 * Phase 3401-3450: Theme System
 * - Theme provider
 * - Theme toggle
 * - Color schemes
 * - CSS variables
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { Sun, Moon, Monitor, Palette } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type ThemeMode = 'light' | 'dark' | 'system'
type ColorScheme = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'cyan'

interface ThemeConfig {
    mode: ThemeMode
    colorScheme: ColorScheme
    radius: 'none' | 'sm' | 'md' | 'lg' | 'full'
    animations: boolean
}

interface ThemeContextValue {
    theme: ThemeConfig
    resolvedMode: 'light' | 'dark'
    setMode: (mode: ThemeMode) => void
    setColorScheme: (scheme: ColorScheme) => void
    setRadius: (radius: ThemeConfig['radius']) => void
    toggleAnimations: () => void
    toggleMode: () => void
}

// ============================================================================
// CSS VARIABLES
// ============================================================================

const colorSchemes: Record<ColorScheme, { primary: string; hue: number }> = {
    purple: { primary: '#a855f7', hue: 270 },
    blue: { primary: '#3b82f6', hue: 217 },
    green: { primary: '#22c55e', hue: 142 },
    orange: { primary: '#f97316', hue: 24 },
    pink: { primary: '#ec4899', hue: 330 },
    cyan: { primary: '#06b6d4', hue: 190 },
}

const radiusValues: Record<ThemeConfig['radius'], string> = {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
}

function applyTheme(config: ThemeConfig, resolvedMode: 'light' | 'dark') {
    const root = document.documentElement
    const scheme = colorSchemes[config.colorScheme]

    // Color scheme
    root.style.setProperty('--color-primary', scheme.primary)
    root.style.setProperty('--color-primary-hue', scheme.hue.toString())

    // Radius
    root.style.setProperty('--radius', radiusValues[config.radius])

    // Mode
    root.classList.remove('light', 'dark')
    root.classList.add(resolvedMode)

    // Animations
    if (!config.animations) {
        root.style.setProperty('--transition-duration', '0ms')
        root.style.setProperty('--animation-duration', '0ms')
    } else {
        root.style.removeProperty('--transition-duration')
        root.style.removeProperty('--animation-duration')
    }
}

// ============================================================================
// CONTEXT
// ============================================================================

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}

// ============================================================================
// THEME PROVIDER
// ============================================================================

interface ThemeProviderProps {
    children: React.ReactNode
    defaultConfig?: Partial<ThemeConfig>
    storageKey?: string
}

export function ThemeProvider({
    children,
    defaultConfig = {},
    storageKey = 'sprintloop-theme',
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<ThemeConfig>(() => {
        // Try to load from storage
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(storageKey)
            if (stored) {
                try {
                    return { ...getDefaultConfig(), ...JSON.parse(stored) }
                } catch {
                    // Ignore parse errors
                }
            }
        }
        return { ...getDefaultConfig(), ...defaultConfig }
    })

    // Resolve system theme
    const [systemMode, setSystemMode] = useState<'light' | 'dark'>(() => {
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        return 'dark'
    })

    const resolvedMode = theme.mode === 'system' ? systemMode : theme.mode

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e: MediaQueryListEvent) => {
            setSystemMode(e.matches ? 'dark' : 'light')
        }

        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }, [])

    // Apply theme on changes
    useEffect(() => {
        applyTheme(theme, resolvedMode)
        localStorage.setItem(storageKey, JSON.stringify(theme))
    }, [theme, resolvedMode, storageKey])

    const setMode = useCallback((mode: ThemeMode) => {
        setTheme(prev => ({ ...prev, mode }))
    }, [])

    const setColorScheme = useCallback((colorScheme: ColorScheme) => {
        setTheme(prev => ({ ...prev, colorScheme }))
    }, [])

    const setRadius = useCallback((radius: ThemeConfig['radius']) => {
        setTheme(prev => ({ ...prev, radius }))
    }, [])

    const toggleAnimations = useCallback(() => {
        setTheme(prev => ({ ...prev, animations: !prev.animations }))
    }, [])

    const toggleMode = useCallback(() => {
        setTheme(prev => ({
            ...prev,
            mode: prev.mode === 'dark' ? 'light' : prev.mode === 'light' ? 'system' : 'dark'
        }))
    }, [])

    return (
        <ThemeContext.Provider
            value={{
                theme,
                resolvedMode,
                setMode,
                setColorScheme,
                setRadius,
                toggleAnimations,
                toggleMode,
            }}
        >
            {children}
        </ThemeContext.Provider>
    )
}

function getDefaultConfig(): ThemeConfig {
    return {
        mode: 'dark',
        colorScheme: 'purple',
        radius: 'lg',
        animations: true,
    }
}

// ============================================================================
// THEME TOGGLE
// ============================================================================

interface ThemeToggleProps {
    variant?: 'icon' | 'button' | 'dropdown'
    className?: string
}

export function ThemeToggle({
    variant = 'icon',
    className = '',
}: ThemeToggleProps) {
    const { theme, toggleMode } = useTheme()

    const icon = {
        dark: <Moon className="w-4 h-4" />,
        light: <Sun className="w-4 h-4" />,
        system: <Monitor className="w-4 h-4" />,
    }[theme.mode]

    if (variant === 'icon') {
        return (
            <button
                onClick={toggleMode}
                className={`p-2 text-gray-400 hover:text-white transition-colors ${className}`}
                title={`Theme: ${theme.mode}`}
            >
                {icon}
            </button>
        )
    }

    if (variant === 'button') {
        return (
            <button
                onClick={toggleMode}
                className={`
                    flex items-center gap-2 px-3 py-2
                    bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300
                    transition-colors
                    ${className}
                `}
            >
                {icon}
                <span className="capitalize">{theme.mode}</span>
            </button>
        )
    }

    return null
}

// ============================================================================
// COLOR SCHEME PICKER
// ============================================================================

interface ColorSchemePickerProps {
    className?: string
}

export function ColorSchemePicker({ className = '' }: ColorSchemePickerProps) {
    const { theme, setColorScheme } = useTheme()

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {(Object.keys(colorSchemes) as ColorScheme[]).map(scheme => (
                <button
                    key={scheme}
                    onClick={() => setColorScheme(scheme)}
                    className={`
                        w-6 h-6 rounded-full transition-all
                        ${theme.colorScheme === scheme
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                            : 'hover:scale-110'
                        }
                    `}
                    style={{ backgroundColor: colorSchemes[scheme].primary }}
                    title={scheme}
                />
            ))}
        </div>
    )
}

// ============================================================================
// RADIUS PICKER
// ============================================================================

interface RadiusPickerProps {
    className?: string
}

export function RadiusPicker({ className = '' }: RadiusPickerProps) {
    const { theme, setRadius } = useTheme()
    const options: ThemeConfig['radius'][] = ['none', 'sm', 'md', 'lg', 'full']

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {options.map(radius => (
                <button
                    key={radius}
                    onClick={() => setRadius(radius)}
                    className={`
                        w-8 h-8 flex items-center justify-center border transition-colors
                        ${theme.radius === radius
                            ? 'border-purple-500 text-purple-400'
                            : 'border-white/10 text-gray-500 hover:text-white'
                        }
                    `}
                    style={{ borderRadius: radiusValues[radius] }}
                    title={radius}
                >
                    <div
                        className="w-4 h-4 bg-current"
                        style={{ borderRadius: radiusValues[radius] }}
                    />
                </button>
            ))}
        </div>
    )
}

// ============================================================================
// THEME PREVIEW
// ============================================================================

interface ThemePreviewProps {
    className?: string
}

export function ThemePreview({ className = '' }: ThemePreviewProps) {
    const { theme, resolvedMode } = useTheme()
    const scheme = colorSchemes[theme.colorScheme]

    return (
        <div
            className={`
                p-4 rounded-xl border overflow-hidden
                ${resolvedMode === 'dark'
                    ? 'bg-slate-900 border-white/10'
                    : 'bg-white border-gray-200'
                }
                ${className}
            `}
        >
            {/* Preview content */}
            <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div
                        className="text-sm font-medium"
                        style={{ color: scheme.primary }}
                    >
                        Preview
                    </div>
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: scheme.primary }}
                    />
                </div>

                {/* Sample button */}
                <button
                    className="w-full py-2 rounded text-white text-sm font-medium transition-colors"
                    style={{
                        backgroundColor: scheme.primary,
                        borderRadius: radiusValues[theme.radius],
                    }}
                >
                    Sample Button
                </button>

                {/* Sample card */}
                <div
                    className={`
                        p-3 border
                        ${resolvedMode === 'dark'
                            ? 'bg-white/5 border-white/10'
                            : 'bg-gray-50 border-gray-200'
                        }
                    `}
                    style={{ borderRadius: radiusValues[theme.radius] }}
                >
                    <div
                        className={`text-xs ${resolvedMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                        Sample card content with current theme settings.
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// THEME CUSTOMIZER
// ============================================================================

interface ThemeCustomizerProps {
    className?: string
}

export function ThemeCustomizer({ className = '' }: ThemeCustomizerProps) {
    const { theme, setMode, toggleAnimations } = useTheme()

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Mode */}
            <div>
                <label className="text-sm font-medium text-white mb-2 block">
                    Theme Mode
                </label>
                <div className="flex items-center gap-2">
                    {(['light', 'dark', 'system'] as ThemeMode[]).map(mode => (
                        <button
                            key={mode}
                            onClick={() => setMode(mode)}
                            className={`
                                flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                                ${theme.mode === mode
                                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    : 'bg-white/5 text-gray-400 border border-transparent hover:text-white'
                                }
                            `}
                        >
                            {mode === 'light' && <Sun className="w-4 h-4" />}
                            {mode === 'dark' && <Moon className="w-4 h-4" />}
                            {mode === 'system' && <Monitor className="w-4 h-4" />}
                            <span className="capitalize">{mode}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Scheme */}
            <div>
                <label className="text-sm font-medium text-white mb-2 block">
                    Color Scheme
                </label>
                <ColorSchemePicker />
            </div>

            {/* Border Radius */}
            <div>
                <label className="text-sm font-medium text-white mb-2 block">
                    Border Radius
                </label>
                <RadiusPicker />
            </div>

            {/* Animations */}
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white">
                    Animations
                </label>
                <button
                    onClick={toggleAnimations}
                    className={`
                        relative w-10 h-6 rounded-full transition-colors
                        ${theme.animations ? 'bg-purple-500' : 'bg-white/10'}
                    `}
                >
                    <div
                        className={`
                            absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                            ${theme.animations ? 'left-5' : 'left-1'}
                        `}
                    />
                </button>
            </div>

            {/* Preview */}
            <ThemePreview />
        </div>
    )
}
