import type * as monaco from 'monaco-editor'

/**
 * Obsidian Glass Theme for Monaco Editor
 * Matches the SprintLoop design system with dark, premium aesthetics
 */
export const obsidianGlassTheme: monaco.editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        // Comments
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'comment.line', foreground: '6b7280' },
        { token: 'comment.block', foreground: '6b7280' },

        // Keywords
        { token: 'keyword', foreground: 'c084fc' }, // Purple
        { token: 'keyword.control', foreground: 'c084fc' },
        { token: 'keyword.operator', foreground: 'f472b6' }, // Pink

        // Strings
        { token: 'string', foreground: '34d399' }, // Emerald
        { token: 'string.escape', foreground: '10b981' },

        // Numbers
        { token: 'number', foreground: 'fb923c' }, // Orange
        { token: 'number.hex', foreground: 'fb923c' },

        // Types
        { token: 'type', foreground: '38bdf8' }, // Sky blue
        { token: 'type.identifier', foreground: '38bdf8' },

        // Functions
        { token: 'function', foreground: '60a5fa' }, // Blue
        { token: 'function.declaration', foreground: '60a5fa' },

        // Variables
        { token: 'variable', foreground: 'e5e7eb' }, // Light gray
        { token: 'variable.parameter', foreground: 'fbbf24' }, // Amber
        { token: 'variable.other', foreground: 'e5e7eb' },

        // Constants
        { token: 'constant', foreground: 'f472b6' }, // Pink
        { token: 'constant.language', foreground: 'fb923c' },

        // Classes
        { token: 'class', foreground: 'fbbf24' }, // Amber
        { token: 'interface', foreground: '38bdf8' },

        // Decorators / Attributes
        { token: 'annotation', foreground: 'a78bfa' }, // Violet
        { token: 'attribute', foreground: 'a78bfa' },

        // Tags (HTML/JSX)
        { token: 'tag', foreground: 'f472b6' },
        { token: 'tag.attribute.name', foreground: 'c084fc' },
        { token: 'tag.attribute.value', foreground: '34d399' },

        // Operators
        { token: 'operator', foreground: '94a3b8' },
        { token: 'delimiter', foreground: '94a3b8' },
        { token: 'delimiter.bracket', foreground: '94a3b8' },

        // Regex
        { token: 'regexp', foreground: 'f472b6' },

        // Markdown
        { token: 'markup.heading', foreground: '60a5fa', fontStyle: 'bold' },
        { token: 'markup.bold', fontStyle: 'bold' },
        { token: 'markup.italic', fontStyle: 'italic' },
        { token: 'markup.link', foreground: '38bdf8' },
    ],
    colors: {
        // Editor backgrounds
        'editor.background': '#0d0f12',
        'editor.foreground': '#e5e7eb',
        'editorCursor.foreground': '#3b82f6',

        // Line numbers
        'editorLineNumber.foreground': '#4b5563',
        'editorLineNumber.activeForeground': '#9ca3af',

        // Selection
        'editor.selectionBackground': '#3b82f640',
        'editor.selectionHighlightBackground': '#3b82f620',
        'editor.inactiveSelectionBackground': '#3b82f630',

        // Current line
        'editor.lineHighlightBackground': '#1a1d2480',
        'editor.lineHighlightBorder': '#00000000',

        // Find matches
        'editor.findMatchBackground': '#fbbf2450',
        'editor.findMatchHighlightBackground': '#fbbf2430',

        // Gutter
        'editorGutter.background': '#0d0f12',
        'editorGutter.addedBackground': '#34d399',
        'editorGutter.modifiedBackground': '#3b82f6',
        'editorGutter.deletedBackground': '#ef4444',

        // Minimap
        'minimap.background': '#0d0f12',
        'minimapSlider.background': '#3b82f620',
        'minimapSlider.hoverBackground': '#3b82f640',
        'minimapSlider.activeBackground': '#3b82f660',

        // Scrollbar
        'scrollbar.shadow': '#00000000',
        'scrollbarSlider.background': '#ffffff15',
        'scrollbarSlider.hoverBackground': '#ffffff25',
        'scrollbarSlider.activeBackground': '#ffffff35',

        // Widget
        'editorWidget.background': '#1a1d24',
        'editorWidget.border': '#ffffff10',
        'editorSuggestWidget.background': '#1a1d24',
        'editorSuggestWidget.border': '#ffffff10',
        'editorSuggestWidget.foreground': '#e5e7eb',
        'editorSuggestWidget.selectedBackground': '#3b82f640',
        'editorSuggestWidget.highlightForeground': '#3b82f6',

        // Hover widget
        'editorHoverWidget.background': '#1a1d24',
        'editorHoverWidget.border': '#ffffff10',

        // Indent guides
        'editorIndentGuide.background': '#ffffff10',
        'editorIndentGuide.activeBackground': '#ffffff20',

        // Whitespace
        'editorWhitespace.foreground': '#ffffff10',

        // Bracket matching
        'editorBracketMatch.background': '#3b82f630',
        'editorBracketMatch.border': '#3b82f6',

        // Error/Warning
        'editorError.foreground': '#ef4444',
        'editorWarning.foreground': '#fbbf24',
        'editorInfo.foreground': '#3b82f6',

        // Peek view
        'peekView.border': '#3b82f6',
        'peekViewEditor.background': '#0d0f12',
        'peekViewEditorGutter.background': '#0d0f12',
        'peekViewResult.background': '#1a1d24',
        'peekViewTitle.background': '#1a1d24',
    },
}

/**
 * Register the Obsidian Glass theme with a Monaco instance
 */
export function defineObsidianTheme(monacoInstance: typeof monaco) {
    monacoInstance.editor.defineTheme('obsidian-glass', obsidianGlassTheme)
}
