/**
 * Theme System
 * 
 * CSS custom properties based theming with light/dark mode support.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface Theme {
    id: string;
    name: string;
    type: 'light' | 'dark';
    colors: ThemeColors;
}

export interface ThemeColors {
    // Backgrounds
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    bgHover: string;
    bgActive: string;
    bgOverlay: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;

    // Borders
    borderPrimary: string;
    borderSecondary: string;
    borderFocus: string;

    // Accent
    accent: string;
    accentHover: string;
    accentMuted: string;

    // Status
    success: string;
    warning: string;
    error: string;
    info: string;

    // Syntax highlighting
    syntaxKeyword: string;
    syntaxString: string;
    syntaxNumber: string;
    syntaxComment: string;
    syntaxFunction: string;
    syntaxType: string;
    syntaxVariable: string;
    syntaxOperator: string;
}

export interface ThemeState {
    currentTheme: string;
    themes: Theme[];

    // Actions
    setTheme: (id: string) => void;
    addTheme: (theme: Theme) => void;
    removeTheme: (id: string) => void;
    getCurrentTheme: () => Theme;
    applyTheme: () => void;
}

// =============================================================================
// BUILT-IN THEMES
// =============================================================================

const DARK_THEME: Theme = {
    id: 'dark',
    name: 'Dark',
    type: 'dark',
    colors: {
        // Backgrounds
        bgPrimary: '#0d1117',
        bgSecondary: '#161b22',
        bgTertiary: '#21262d',
        bgHover: '#30363d',
        bgActive: '#388bfd26',
        bgOverlay: 'rgba(0, 0, 0, 0.5)',

        // Text
        textPrimary: '#e6edf3',
        textSecondary: '#8b949e',
        textMuted: '#6e7681',
        textInverse: '#0d1117',

        // Borders
        borderPrimary: '#30363d',
        borderSecondary: '#21262d',
        borderFocus: '#388bfd',

        // Accent
        accent: '#388bfd',
        accentHover: '#58a6ff',
        accentMuted: '#388bfd26',

        // Status
        success: '#3fb950',
        warning: '#d29922',
        error: '#f85149',
        info: '#58a6ff',

        // Syntax
        syntaxKeyword: '#ff7b72',
        syntaxString: '#a5d6ff',
        syntaxNumber: '#79c0ff',
        syntaxComment: '#8b949e',
        syntaxFunction: '#d2a8ff',
        syntaxType: '#ff7b72',
        syntaxVariable: '#ffa657',
        syntaxOperator: '#79c0ff',
    },
};

const LIGHT_THEME: Theme = {
    id: 'light',
    name: 'Light',
    type: 'light',
    colors: {
        // Backgrounds
        bgPrimary: '#ffffff',
        bgSecondary: '#f6f8fa',
        bgTertiary: '#eaeef2',
        bgHover: '#d0d7de',
        bgActive: '#0969da1a',
        bgOverlay: 'rgba(0, 0, 0, 0.3)',

        // Text
        textPrimary: '#1f2328',
        textSecondary: '#656d76',
        textMuted: '#8c959f',
        textInverse: '#ffffff',

        // Borders
        borderPrimary: '#d0d7de',
        borderSecondary: '#e1e4e8',
        borderFocus: '#0969da',

        // Accent
        accent: '#0969da',
        accentHover: '#0550ae',
        accentMuted: '#0969da1a',

        // Status
        success: '#1a7f37',
        warning: '#9a6700',
        error: '#cf222e',
        info: '#0969da',

        // Syntax
        syntaxKeyword: '#cf222e',
        syntaxString: '#0a3069',
        syntaxNumber: '#0550ae',
        syntaxComment: '#6e7781',
        syntaxFunction: '#8250df',
        syntaxType: '#cf222e',
        syntaxVariable: '#953800',
        syntaxOperator: '#0550ae',
    },
};

const MONOKAI_THEME: Theme = {
    id: 'monokai',
    name: 'Monokai Pro',
    type: 'dark',
    colors: {
        // Backgrounds
        bgPrimary: '#2d2a2e',
        bgSecondary: '#3b383e',
        bgTertiary: '#49464d',
        bgHover: '#5a575e',
        bgActive: '#78dce826',
        bgOverlay: 'rgba(0, 0, 0, 0.5)',

        // Text
        textPrimary: '#fcfcfa',
        textSecondary: '#c1c0c0',
        textMuted: '#939293',
        textInverse: '#2d2a2e',

        // Borders
        borderPrimary: '#5a575e',
        borderSecondary: '#49464d',
        borderFocus: '#78dce8',

        // Accent
        accent: '#78dce8',
        accentHover: '#a9eff4',
        accentMuted: '#78dce826',

        // Status
        success: '#a9dc76',
        warning: '#ffd866',
        error: '#ff6188',
        info: '#78dce8',

        // Syntax
        syntaxKeyword: '#ff6188',
        syntaxString: '#ffd866',
        syntaxNumber: '#ab9df2',
        syntaxComment: '#727072',
        syntaxFunction: '#a9dc76',
        syntaxType: '#78dce8',
        syntaxVariable: '#fcfcfa',
        syntaxOperator: '#ff6188',
    },
};

const NORD_THEME: Theme = {
    id: 'nord',
    name: 'Nord',
    type: 'dark',
    colors: {
        bgPrimary: '#2e3440',
        bgSecondary: '#3b4252',
        bgTertiary: '#434c5e',
        bgHover: '#4c566a',
        bgActive: '#88c0d026',
        bgOverlay: 'rgba(0, 0, 0, 0.5)',

        textPrimary: '#eceff4',
        textSecondary: '#d8dee9',
        textMuted: '#a5adba',
        textInverse: '#2e3440',

        borderPrimary: '#4c566a',
        borderSecondary: '#434c5e',
        borderFocus: '#88c0d0',

        accent: '#88c0d0',
        accentHover: '#8fbcbb',
        accentMuted: '#88c0d026',

        success: '#a3be8c',
        warning: '#ebcb8b',
        error: '#bf616a',
        info: '#81a1c1',

        syntaxKeyword: '#81a1c1',
        syntaxString: '#a3be8c',
        syntaxNumber: '#b48ead',
        syntaxComment: '#616e88',
        syntaxFunction: '#88c0d0',
        syntaxType: '#8fbcbb',
        syntaxVariable: '#d8dee9',
        syntaxOperator: '#81a1c1',
    },
};

// =============================================================================
// THEME STORE
// =============================================================================

export const useTheme = create<ThemeState>()(
    persist(
        (set, get) => ({
            currentTheme: 'dark',
            themes: [DARK_THEME, LIGHT_THEME, MONOKAI_THEME, NORD_THEME],

            setTheme: (id: string) => {
                set({ currentTheme: id });
                get().applyTheme();
            },

            addTheme: (theme: Theme) => {
                set(state => ({
                    themes: [...state.themes, theme],
                }));
            },

            removeTheme: (id: string) => {
                if (id === 'dark' || id === 'light') return; // Can't remove built-in themes

                set(state => ({
                    themes: state.themes.filter(t => t.id !== id),
                    currentTheme: state.currentTheme === id ? 'dark' : state.currentTheme,
                }));
            },

            getCurrentTheme: () => {
                const { currentTheme, themes } = get();
                return themes.find(t => t.id === currentTheme) || DARK_THEME;
            },

            applyTheme: () => {
                const theme = get().getCurrentTheme();
                const root = document.documentElement;

                // Apply all colors as CSS custom properties
                for (const [key, value] of Object.entries(theme.colors)) {
                    const cssVar = `--${camelToKebab(key)}`;
                    root.style.setProperty(cssVar, value);
                }

                // Set theme type attribute
                root.setAttribute('data-theme', theme.type);
            },
        }),
        {
            name: 'sprintloop-theme',
            partialize: (state) => ({ currentTheme: state.currentTheme }),
        }
    )
);

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

/**
 * Initialize theme on app start
 */
export function initializeTheme(): void {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const { currentTheme, applyTheme, setTheme } = useTheme.getState();

    // If no stored preference, use system preference
    if (!currentTheme) {
        setTheme(prefersDark ? 'dark' : 'light');
    } else {
        applyTheme();
    }

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user is using system themes
        const current = useTheme.getState().currentTheme;
        if (current === 'light' || current === 'dark') {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
}

/**
 * Get CSS variable value
 */
export function getCssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}
