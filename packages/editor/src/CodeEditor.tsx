import { useRef, useCallback } from 'react'
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import { defineObsidianTheme } from './theme'

export interface CodeEditorProps {
    /** File content */
    value: string
    /** Programming language (typescript, javascript, python, etc.) */
    language?: string
    /** File path for model identification */
    path?: string
    /** Read-only mode */
    readOnly?: boolean
    /** Callback when content changes */
    onChange?: (value: string | undefined) => void
    /** Callback when editor is mounted */
    onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monaco: typeof import('monaco-editor')) => void
    /** Additional editor options */
    options?: monaco.editor.IStandaloneEditorConstructionOptions
    /** Custom class name */
    className?: string
}

/**
 * SprintLoop Code Editor
 * 
 * A Monaco Editor wrapper with the Obsidian Glass theme and optimized settings
 * for a premium coding experience.
 */
export function CodeEditor({
    value,
    language = 'typescript',
    path,
    readOnly = false,
    onChange,
    onMount: onMountProp,
    options,
    className,
}: CodeEditorProps) {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    const monacoRef = useRef<typeof monaco | null>(null)

    const handleMount: OnMount = useCallback((editor, monacoInstance) => {
        editorRef.current = editor
        monacoRef.current = monacoInstance

        // Register and apply Obsidian Glass theme
        defineObsidianTheme(monacoInstance)
        monacoInstance.editor.setTheme('obsidian-glass')

        // Configure editor settings
        editor.updateOptions({
            fontSize: 14,
            lineHeight: 22,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontLigatures: true,
            minimap: {
                enabled: true,
                maxColumn: 80,
                renderCharacters: false,
            },
            scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
            },
            padding: { top: 12, bottom: 12 },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            guides: {
                bracketPairs: true,
                indentation: true,
            },
            renderLineHighlight: 'all',
            renderWhitespace: 'selection',
            wordWrap: 'off',
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: 'full',
            suggest: {
                showKeywords: true,
                showSnippets: true,
                insertMode: 'replace',
                preview: true,
            },
            quickSuggestions: {
                other: true,
                comments: false,
                strings: true,
            },
            acceptSuggestionOnCommitCharacter: true,
            acceptSuggestionOnEnter: 'on',
            parameterHints: { enabled: true },
            folding: true,
            foldingStrategy: 'indentation',
            links: true,
            colorDecorators: true,
            contextmenu: true,
            mouseWheelZoom: true,
            dragAndDrop: true,
            ...options,
        })

        // Focus editor
        editor.focus()

        // Call user's onMount callback
        onMountProp?.(editor, monacoInstance)
    }, [onMountProp, options])

    const handleChange: OnChange = useCallback((value) => {
        onChange?.(value)
    }, [onChange])

    return (
        <div className={`h-full w-full ${className || ''}`}>
            <Editor
                height="100%"
                width="100%"
                language={language}
                value={value}
                path={path}
                theme="vs-dark" // Will be overridden by obsidian-glass in onMount
                onChange={handleChange}
                onMount={handleMount}
                loading={
                    <div className="h-full w-full flex items-center justify-center bg-slate-950">
                        <div className="flex items-center gap-2 text-gray-500">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm">Loading editor...</span>
                        </div>
                    </div>
                }
                options={{
                    readOnly,
                    domReadOnly: readOnly,
                }}
            />
        </div>
    )
}
