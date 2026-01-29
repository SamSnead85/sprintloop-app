/**
 * Editor Integration Hooks
 * 
 * Connect AI features to the editor component.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
    useInlineCompletions,
    extractCompletionContext,
    shouldTriggerCompletion,
    createCompletionTrigger,
    type Position,
} from '../ai/inline-completions';
import {
    useCodeActions,
    type CodeActionContext,
} from '../ai/code-actions';
import { useCodebaseIndex } from '../ai/codebase-index';

// =============================================================================
// INLINE COMPLETION HOOK
// =============================================================================

export interface UseEditorCompletionsOptions {
    enabled?: boolean;
    debounceMs?: number;
    language?: string;
    filePath?: string;
}

export function useEditorCompletions(options: UseEditorCompletionsOptions = {}) {
    const { enabled = true, debounceMs = 300, language = 'typescript', filePath = '' } = options;

    const {
        isLoading,
        isVisible,
        getActiveCompletion,
        acceptCompletion,
        dismissCompletions,
        nextCompletion,
        prevCompletion,
    } = useInlineCompletions();

    const triggerRef = useRef(createCompletionTrigger(debounceMs));

    const handleChange = useCallback((content: string, position: Position, char: string) => {
        if (!enabled) return;

        if (shouldTriggerCompletion(char, content.split('\n')[position.line] || '', language)) {
            const context = extractCompletionContext(filePath, content, position, language);
            triggerRef.current({ context, trigger: 'auto' });
        }
    }, [enabled, filePath, language]);

    const handleKeyDown = useCallback((e: KeyboardEvent): boolean => {
        const completion = getActiveCompletion();

        if (!completion) return false;

        // Tab to accept
        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            acceptCompletion();
            return true;
        }

        // Escape to dismiss
        if (e.key === 'Escape') {
            e.preventDefault();
            dismissCompletions();
            return true;
        }

        // Alt+] for next suggestion
        if (e.key === ']' && e.altKey) {
            e.preventDefault();
            nextCompletion();
            return true;
        }

        // Alt+[ for previous suggestion
        if (e.key === '[' && e.altKey) {
            e.preventDefault();
            prevCompletion();
            return true;
        }

        return false;
    }, [getActiveCompletion, acceptCompletion, dismissCompletions, nextCompletion, prevCompletion]);

    const requestManualCompletion = useCallback((content: string, position: Position) => {
        const context = extractCompletionContext(filePath, content, position, language);
        useInlineCompletions.getState().requestCompletion({ context, trigger: 'manual' });
    }, [filePath, language]);

    return {
        isLoading,
        isVisible,
        activeCompletion: getActiveCompletion(),
        handleChange,
        handleKeyDown,
        acceptCompletion,
        dismissCompletions,
        requestManualCompletion,
    };
}

// =============================================================================
// CODE ACTIONS HOOK
// =============================================================================

export interface UseCodeActionsOptions {
    enabled?: boolean;
    language?: string;
    filePath?: string;
}

export function useEditorCodeActions(options: UseCodeActionsOptions = {}) {
    const { enabled = true, language = 'typescript', filePath = '' } = options;

    const {
        isMenuVisible,
        menuPosition,
        isExecuting,
        lastResult,
        showMenu,
        hideMenu,
        executeAction,
        getAvailableActions,
        clearResult,
    } = useCodeActions();

    const handleSelectionChange = useCallback((
        selectedText: string,
        selectionRange: { startLine: number; endLine: number; startColumn: number; endColumn: number },
        surroundingCode: string,
        mousePosition?: { x: number; y: number }
    ) => {
        if (!enabled || !selectedText.trim()) {
            hideMenu();
            return;
        }

        const context: CodeActionContext = {
            filePath,
            language,
            selectedText,
            selectionRange,
            surroundingCode,
        };

        // Show menu at mouse position or selection end
        const position = mousePosition || { x: 0, y: 0 };
        showMenu(position, context);
    }, [enabled, filePath, language, hideMenu, showMenu]);

    const handleContextMenu = useCallback((
        e: MouseEvent,
        selectedText: string,
        selectionRange: { startLine: number; endLine: number; startColumn: number; endColumn: number },
        surroundingCode: string
    ) => {
        if (!enabled || !selectedText.trim()) return false;

        e.preventDefault();

        const context: CodeActionContext = {
            filePath,
            language,
            selectedText,
            selectionRange,
            surroundingCode,
        };

        showMenu({ x: e.clientX, y: e.clientY }, context);
        return true;
    }, [enabled, filePath, language, showMenu]);

    return {
        isMenuVisible,
        menuPosition,
        isExecuting,
        lastResult,
        availableActions: getAvailableActions(),
        handleSelectionChange,
        handleContextMenu,
        executeAction,
        hideMenu,
        clearResult,
    };
}

// =============================================================================
// CODEBASE CONTEXT HOOK
// =============================================================================

export function useCodebaseContext() {
    const {
        files,
        stats,
        isIndexing,
        indexProgress,
        indexCodebase,
        indexFile,
        searchFiles,
        searchSymbols,
        getContextForFiles,
    } = useCodebaseIndex();

    // Auto-index on mount (if desktop with file access)
    useEffect(() => {
        // Would check for Tauri/desktop mode here
        // indexCodebase('/path/to/project');
    }, []);

    const getRelevantContext = useCallback((query: string, maxFiles = 5): string => {
        // Search for relevant files based on query
        const relevantFiles = searchFiles(query).slice(0, maxFiles);
        const paths = relevantFiles.map(f => f.path);
        return getContextForFiles(paths);
    }, [searchFiles, getContextForFiles]);

    const getSymbolContext = useCallback((symbolName: string): string => {
        const results = searchSymbols(symbolName);
        if (results.length === 0) return '';

        const symbol = results[0];
        const file = files.get(symbol.path);

        if (!file?.content) return '';

        // Extract lines around symbol
        const lines = file.content.split('\n');
        const startLine = Math.max(0, symbol.line - 1);
        const endLine = Math.min(lines.length, symbol.endLine + 5);

        return lines.slice(startLine, endLine).join('\n');
    }, [searchSymbols, files]);

    return {
        stats,
        isIndexing,
        indexProgress,
        indexCodebase,
        indexFile,
        searchFiles,
        searchSymbols,
        getRelevantContext,
        getSymbolContext,
    };
}

// =============================================================================
// KEYBOARD SHORTCUTS
// =============================================================================

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    action: string;
    description: string;
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
    { key: 'k', meta: true, action: 'command-palette', description: 'Open command palette' },
    { key: 'p', meta: true, action: 'quick-open', description: 'Quick open file' },
    { key: 'f', meta: true, shift: true, action: 'search-project', description: 'Search in project' },
    { key: 'b', meta: true, action: 'toggle-sidebar', description: 'Toggle sidebar' },
    { key: '`', meta: true, action: 'toggle-terminal', description: 'Toggle terminal' },
    { key: 's', meta: true, action: 'save', description: 'Save file' },
    { key: 'z', meta: true, action: 'undo', description: 'Undo' },
    { key: 'z', meta: true, shift: true, action: 'redo', description: 'Redo' },
    { key: '/', meta: true, action: 'toggle-comment', description: 'Toggle comment' },
    { key: 'i', meta: true, action: 'inline-completion', description: 'Trigger inline completion' },
    { key: '.', meta: true, action: 'quick-fix', description: 'Quick fix' },
    { key: 'Enter', meta: true, action: 'ai-chat', description: 'Focus AI chat' },
];

export function useKeyboardShortcuts(
    handlers: Record<string, () => void>,
    shortcuts: KeyboardShortcut[] = DEFAULT_SHORTCUTS
) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            for (const shortcut of shortcuts) {
                const matches =
                    e.key.toLowerCase() === shortcut.key.toLowerCase() &&
                    !!e.ctrlKey === !!shortcut.ctrl &&
                    !!e.altKey === !!shortcut.alt &&
                    !!e.shiftKey === !!shortcut.shift &&
                    !!e.metaKey === !!shortcut.meta;

                if (matches && handlers[shortcut.action]) {
                    e.preventDefault();
                    handlers[shortcut.action]();
                    return;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers, shortcuts]);

    return { shortcuts };
}
