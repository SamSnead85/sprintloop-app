/**
 * Monaco Theme: SprintLoop Dark
 * 
 * Phase 19: Custom Monaco editor theme
 * Obsidian-inspired syntax colors with purple accents
 */

import type * as Monaco from 'monaco-editor';

export const SPRINTLOOP_DARK_THEME: Monaco.editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        // Comments
        { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
        { token: 'comment.doc', foreground: '9CA3AF', fontStyle: 'italic' },

        // Keywords
        { token: 'keyword', foreground: 'A78BFA' },
        { token: 'keyword.control', foreground: 'A78BFA' },
        { token: 'keyword.operator', foreground: 'C4B5FD' },

        // Strings
        { token: 'string', foreground: '34D399' },
        { token: 'string.escape', foreground: '6EE7B7' },
        { token: 'string.regex', foreground: 'FCD34D' },

        // Numbers
        { token: 'number', foreground: 'FB923C' },
        { token: 'number.hex', foreground: 'FDBA74' },

        // Types
        { token: 'type', foreground: '60A5FA' },
        { token: 'type.identifier', foreground: '93C5FD' },
        { token: 'class', foreground: '60A5FA' },
        { token: 'interface', foreground: '67E8F9' },

        // Functions
        { token: 'function', foreground: 'FCD34D' },
        { token: 'function.declaration', foreground: 'FDE68A' },

        // Variables
        { token: 'variable', foreground: 'E5E7EB' },
        { token: 'variable.predefined', foreground: 'F472B6' },
        { token: 'variable.parameter', foreground: 'FDA4AF' },

        // Constants
        { token: 'constant', foreground: 'FB923C' },
        { token: 'constant.language', foreground: 'F472B6' },

        // Operators
        { token: 'operator', foreground: 'C4B5FD' },
        { token: 'delimiter', foreground: '9CA3AF' },
        { token: 'delimiter.bracket', foreground: '9CA3AF' },

        // Tags (JSX/HTML)
        { token: 'tag', foreground: 'F472B6' },
        { token: 'tag.attribute.name', foreground: 'A78BFA' },
        { token: 'tag.attribute.value', foreground: '34D399' },

        // Markup
        { token: 'markup.heading', foreground: 'A78BFA', fontStyle: 'bold' },
        { token: 'markup.bold', fontStyle: 'bold' },
        { token: 'markup.italic', fontStyle: 'italic' },
        { token: 'markup.link', foreground: '60A5FA' },

        // JSON
        { token: 'string.key.json', foreground: 'A78BFA' },
        { token: 'string.value.json', foreground: '34D399' },

        // CSS
        { token: 'attribute.name.css', foreground: '60A5FA' },
        { token: 'attribute.value.css', foreground: '34D399' },
        { token: 'property.css', foreground: 'A78BFA' },
    ],
    colors: {
        // Editor
        'editor.background': '#0a0a0f',
        'editor.foreground': '#E5E7EB',
        'editorCursor.foreground': '#A78BFA',
        'editor.lineHighlightBackground': '#1f1f2e',
        'editor.selectionBackground': '#a78bfa33',
        'editor.inactiveSelectionBackground': '#a78bfa22',

        // Line numbers
        'editorLineNumber.foreground': '#4B5563',
        'editorLineNumber.activeForeground': '#A78BFA',

        // Gutter
        'editorGutter.background': '#0a0a0f',
        'editorGutter.addedBackground': '#34D399',
        'editorGutter.modifiedBackground': '#60A5FA',
        'editorGutter.deletedBackground': '#F87171',

        // Bracket matching
        'editorBracketMatch.background': '#a78bfa44',
        'editorBracketMatch.border': '#A78BFA',

        // Find/Replace
        'editor.findMatchBackground': '#FCD34D44',
        'editor.findMatchHighlightBackground': '#FCD34D22',

        // Minimap
        'minimap.background': '#0d0d14',
        'minimap.selectionHighlight': '#A78BFA',

        // Scrollbar
        'scrollbarSlider.background': '#ffffff10',
        'scrollbarSlider.hoverBackground': '#ffffff20',
        'scrollbarSlider.activeBackground': '#a78bfa44',

        // Widget
        'editorWidget.background': '#12121a',
        'editorWidget.border': '#ffffff10',

        // Suggest
        'editorSuggestWidget.background': '#12121a',
        'editorSuggestWidget.border': '#ffffff10',
        'editorSuggestWidget.selectedBackground': '#a78bfa33',
        'editorSuggestWidget.highlightForeground': '#A78BFA',

        // Hover
        'editorHoverWidget.background': '#12121a',
        'editorHoverWidget.border': '#ffffff10',

        // Input
        'input.background': '#0d0d14',
        'input.border': '#ffffff10',
        'input.foreground': '#E5E7EB',
        'inputOption.activeBorder': '#A78BFA',

        // Dropdown
        'dropdown.background': '#12121a',
        'dropdown.border': '#ffffff10',

        // List
        'list.activeSelectionBackground': '#a78bfa33',
        'list.activeSelectionForeground': '#ffffff',
        'list.hoverBackground': '#ffffff08',
        'list.focusBackground': '#a78bfa22',
    },
};

/**
 * Register the SprintLoop theme with Monaco
 */
export function registerSprintLoopTheme(monaco: typeof Monaco): void {
    monaco.editor.defineTheme('sprintloop-dark', SPRINTLOOP_DARK_THEME);
}

/**
 * Apply the theme to an editor
 */
export function applySprintLoopTheme(editor: Monaco.editor.IStandaloneCodeEditor): void {
    editor.updateOptions({ theme: 'sprintloop-dark' });
}
