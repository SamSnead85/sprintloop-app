/**
 * Theme Service
 * 
 * Manages IDE themes with dark/light modes and custom themes.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface ThemeColors {
    // Background
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgHover: string;
    bgActive: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // Borders
    border: string;
    borderHover: string;
    borderActive: string;

    // Accent
    accent: string;
    accentHover: string;
    accentBg: string;

    // Status colors
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    error: string;
    errorBg: string;
    info: string;
    infoBg: string;

    // Syntax highlighting
    syntaxKeyword: string;
    syntaxString: string;
    syntaxNumber: string;
    syntaxComment: string;
    syntaxFunction: string;
    syntaxVariable: string;
    syntaxType: string;
    syntaxOperator: string;
    syntaxPunctuation: string;
}

export interface Theme {
    id: string;
    name: string;
    type: 'dark' | 'light';
    colors: ThemeColors;
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
}

export interface ThemeState {
    currentThemeId: string;
    themes: Theme[];
    systemTheme: 'dark' | 'light';
    followSystem: boolean;

    // Theme operations
    setTheme: (themeId: string) => void;
    setFollowSystem: (follow: boolean) => void;
    addCustomTheme: (theme: Theme) => void;
    removeCustomTheme: (themeId: string) => void;
    updateCustomTheme: (themeId: string, updates: Partial<Theme>) => void;

    // Getters
    getCurrentTheme: () => Theme;
    getEffectiveTheme: () => Theme;
    isDarkMode: () => boolean;

    // CSS variable application
    applyTheme: (theme: Theme) => void;
}

// =============================================================================
// BUILT-IN THEMES
// =============================================================================

const DARK_OBSIDIAN: Theme = {
    id: 'dark-obsidian',
    name: 'Dark Obsidian',
    type: 'dark',
    colors: {
        bgPrimary: '#0d0f12',
        bgSecondary: '#1a1d24',
        bgTertiary: '#1e2129',
        bgHover: 'rgba(255, 255, 255, 0.05)',
        bgActive: 'rgba(255, 255, 255, 0.1)',

        textPrimary: '#f3f4f6',
        textSecondary: '#9ca3af',
        textMuted: '#6b7280',
        textInverse: '#0d0f12',

        border: 'rgba(255, 255, 255, 0.08)',
        borderHover: 'rgba(255, 255, 255, 0.15)',
        borderActive: 'rgba(255, 255, 255, 0.25)',

        accent: '#6366f1',
        accentHover: '#818cf8',
        accentBg: 'rgba(99, 102, 241, 0.15)',

        success: '#22c55e',
        successBg: 'rgba(34, 197, 94, 0.15)',
        warning: '#eab308',
        warningBg: 'rgba(234, 179, 8, 0.15)',
        error: '#ef4444',
        errorBg: 'rgba(239, 68, 68, 0.15)',
        info: '#3b82f6',
        infoBg: 'rgba(59, 130, 246, 0.15)',

        syntaxKeyword: '#c792ea',
        syntaxString: '#c3e88d',
        syntaxNumber: '#f78c6c',
        syntaxComment: '#637777',
        syntaxFunction: '#82aaff',
        syntaxVariable: '#f07178',
        syntaxType: '#ffcb6b',
        syntaxOperator: '#89ddff',
        syntaxPunctuation: '#89ddff',
    },
};

const LIGHT_BREEZE: Theme = {
    id: 'light-breeze',
    name: 'Light Breeze',
    type: 'light',
    colors: {
        bgPrimary: '#ffffff',
        bgSecondary: '#f8fafc',
        bgTertiary: '#f1f5f9',
        bgHover: 'rgba(0, 0, 0, 0.03)',
        bgActive: 'rgba(0, 0, 0, 0.06)',

        textPrimary: '#1e293b',
        textSecondary: '#475569',
        textMuted: '#94a3b8',
        textInverse: '#ffffff',

        border: 'rgba(0, 0, 0, 0.08)',
        borderHover: 'rgba(0, 0, 0, 0.12)',
        borderActive: 'rgba(0, 0, 0, 0.2)',

        accent: '#6366f1',
        accentHover: '#4f46e5',
        accentBg: 'rgba(99, 102, 241, 0.1)',

        success: '#16a34a',
        successBg: 'rgba(22, 163, 74, 0.1)',
        warning: '#ca8a04',
        warningBg: 'rgba(202, 138, 4, 0.1)',
        error: '#dc2626',
        errorBg: 'rgba(220, 38, 38, 0.1)',
        info: '#2563eb',
        infoBg: 'rgba(37, 99, 235, 0.1)',

        syntaxKeyword: '#7c3aed',
        syntaxString: '#059669',
        syntaxNumber: '#d97706',
        syntaxComment: '#9ca3af',
        syntaxFunction: '#2563eb',
        syntaxVariable: '#dc2626',
        syntaxType: '#ca8a04',
        syntaxOperator: '#0891b2',
        syntaxPunctuation: '#64748b',
    },
};

const MIDNIGHT_BLUE: Theme = {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    type: 'dark',
    colors: {
        bgPrimary: '#0a1628',
        bgSecondary: '#0f1f3a',
        bgTertiary: '#142850',
        bgHover: 'rgba(59, 130, 246, 0.1)',
        bgActive: 'rgba(59, 130, 246, 0.2)',

        textPrimary: '#e2e8f0',
        textSecondary: '#94a3b8',
        textMuted: '#64748b',
        textInverse: '#0a1628',

        border: 'rgba(59, 130, 246, 0.2)',
        borderHover: 'rgba(59, 130, 246, 0.3)',
        borderActive: 'rgba(59, 130, 246, 0.5)',

        accent: '#3b82f6',
        accentHover: '#60a5fa',
        accentBg: 'rgba(59, 130, 246, 0.2)',

        success: '#22c55e',
        successBg: 'rgba(34, 197, 94, 0.15)',
        warning: '#f59e0b',
        warningBg: 'rgba(245, 158, 11, 0.15)',
        error: '#f43f5e',
        errorBg: 'rgba(244, 63, 94, 0.15)',
        info: '#38bdf8',
        infoBg: 'rgba(56, 189, 248, 0.15)',

        syntaxKeyword: '#38bdf8',
        syntaxString: '#a3e635',
        syntaxNumber: '#f97316',
        syntaxComment: '#64748b',
        syntaxFunction: '#818cf8',
        syntaxVariable: '#f472b6',
        syntaxType: '#facc15',
        syntaxOperator: '#22d3ee',
        syntaxPunctuation: '#94a3b8',
    },
};

const FOREST_GREEN: Theme = {
    id: 'forest-green',
    name: 'Forest Green',
    type: 'dark',
    colors: {
        bgPrimary: '#0d1912',
        bgSecondary: '#152419',
        bgTertiary: '#1c2e20',
        bgHover: 'rgba(34, 197, 94, 0.1)',
        bgActive: 'rgba(34, 197, 94, 0.2)',

        textPrimary: '#ecfdf5',
        textSecondary: '#a7f3d0',
        textMuted: '#6ee7b7',
        textInverse: '#0d1912',

        border: 'rgba(34, 197, 94, 0.2)',
        borderHover: 'rgba(34, 197, 94, 0.3)',
        borderActive: 'rgba(34, 197, 94, 0.5)',

        accent: '#22c55e',
        accentHover: '#4ade80',
        accentBg: 'rgba(34, 197, 94, 0.2)',

        success: '#22c55e',
        successBg: 'rgba(34, 197, 94, 0.2)',
        warning: '#fbbf24',
        warningBg: 'rgba(251, 191, 36, 0.15)',
        error: '#f87171',
        errorBg: 'rgba(248, 113, 113, 0.15)',
        info: '#60a5fa',
        infoBg: 'rgba(96, 165, 250, 0.15)',

        syntaxKeyword: '#4ade80',
        syntaxString: '#fde68a',
        syntaxNumber: '#fb923c',
        syntaxComment: '#6b7280',
        syntaxFunction: '#86efac',
        syntaxVariable: '#fca5a5',
        syntaxType: '#fbbf24',
        syntaxOperator: '#a5f3fc',
        syntaxPunctuation: '#a7f3d0',
    },
};

const BUILT_IN_THEMES: Theme[] = [
    DARK_OBSIDIAN,
    LIGHT_BREEZE,
    MIDNIGHT_BLUE,
    FOREST_GREEN,
];

// =============================================================================
// THEME STORE
// =============================================================================

export const useThemeService = create<ThemeState>()(
    persist(
        (set, get) => ({
            currentThemeId: 'dark-obsidian',
            themes: BUILT_IN_THEMES,
            systemTheme: 'dark',
            followSystem: false,

            setTheme: (themeId) => {
                const theme = get().themes.find(t => t.id === themeId);
                if (theme) {
                    set({ currentThemeId: themeId });
                    get().applyTheme(theme);
                }
            },

            setFollowSystem: (follow) => {
                set({ followSystem: follow });
                if (follow) {
                    const systemTheme = get().systemTheme === 'dark' ? DARK_OBSIDIAN : LIGHT_BREEZE;
                    get().applyTheme(systemTheme);
                } else {
                    get().applyTheme(get().getCurrentTheme());
                }
            },

            addCustomTheme: (theme) => {
                set(state => ({
                    themes: [...state.themes, theme],
                }));
            },

            removeCustomTheme: (themeId) => {
                set(state => ({
                    themes: state.themes.filter(t => t.id !== themeId || BUILT_IN_THEMES.some(b => b.id === t.id)),
                    currentThemeId: state.currentThemeId === themeId ? 'dark-obsidian' : state.currentThemeId,
                }));
            },

            updateCustomTheme: (themeId, updates) => {
                set(state => ({
                    themes: state.themes.map(t =>
                        t.id === themeId ? { ...t, ...updates } : t
                    ),
                }));
            },

            getCurrentTheme: () => {
                return get().themes.find(t => t.id === get().currentThemeId) || DARK_OBSIDIAN;
            },

            getEffectiveTheme: () => {
                if (get().followSystem) {
                    return get().systemTheme === 'dark' ? DARK_OBSIDIAN : LIGHT_BREEZE;
                }
                return get().getCurrentTheme();
            },

            isDarkMode: () => {
                return get().getEffectiveTheme().type === 'dark';
            },

            applyTheme: (theme) => {
                const root = document.documentElement;
                const { colors } = theme;

                // Apply colors as CSS variables
                root.style.setProperty('--color-bg-primary', colors.bgPrimary);
                root.style.setProperty('--color-bg-secondary', colors.bgSecondary);
                root.style.setProperty('--color-bg-tertiary', colors.bgTertiary);
                root.style.setProperty('--color-bg-hover', colors.bgHover);
                root.style.setProperty('--color-bg-active', colors.bgActive);

                root.style.setProperty('--color-text-primary', colors.textPrimary);
                root.style.setProperty('--color-text-secondary', colors.textSecondary);
                root.style.setProperty('--color-text-muted', colors.textMuted);

                root.style.setProperty('--color-border', colors.border);
                root.style.setProperty('--color-border-hover', colors.borderHover);

                root.style.setProperty('--color-accent', colors.accent);
                root.style.setProperty('--color-accent-hover', colors.accentHover);
                root.style.setProperty('--color-accent-bg', colors.accentBg);

                root.style.setProperty('--color-success', colors.success);
                root.style.setProperty('--color-warning', colors.warning);
                root.style.setProperty('--color-error', colors.error);
                root.style.setProperty('--color-info', colors.info);

                // Apply font settings if specified
                if (theme.fontFamily) {
                    root.style.setProperty('--font-family', theme.fontFamily);
                }
                if (theme.fontSize) {
                    root.style.setProperty('--font-size-base', `${theme.fontSize}px`);
                }

                console.log('[Theme] Applied:', theme.name);
            },
        }),
        {
            name: 'sprintloop-theme',
            partialize: (state) => ({
                currentThemeId: state.currentThemeId,
                followSystem: state.followSystem,
                // Only persist custom themes
                themes: state.themes.filter(t => !BUILT_IN_THEMES.some(b => b.id === t.id)),
            }),
        }
    )
);

// =============================================================================
// SYSTEM THEME DETECTION
// =============================================================================

export function initSystemThemeListener(): () => void {
    if (typeof window === 'undefined') return () => { };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        useThemeService.setState({ systemTheme: e.matches ? 'dark' : 'light' });

        if (useThemeService.getState().followSystem) {
            const theme = e.matches ? DARK_OBSIDIAN : LIGHT_BREEZE;
            useThemeService.getState().applyTheme(theme);
        }
    };

    // Set initial value
    handleChange(mediaQuery);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
}

export { BUILT_IN_THEMES, DARK_OBSIDIAN, LIGHT_BREEZE };
