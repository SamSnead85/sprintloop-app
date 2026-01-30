/**
 * Refactoring Service
 * 
 * Code refactoring operations like rename, extract, and inline.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type RefactoringType =
    | 'rename'
    | 'extract-variable'
    | 'extract-function'
    | 'extract-constant'
    | 'extract-interface'
    | 'inline-variable'
    | 'move-to-file'
    | 'convert-to-arrow'
    | 'convert-to-async';

export interface RefactoringLocation {
    file: string;
    startLine: number;
    endLine: number;
    startColumn: number;
    endColumn: number;
}

export interface RefactoringChange {
    type: 'insert' | 'replace' | 'delete';
    location: RefactoringLocation;
    newText?: string;
}

export interface RefactoringPreview {
    type: RefactoringType;
    description: string;
    changes: RefactoringChange[];
    affectedFiles: string[];
}

export interface RefactoringState {
    isRefactoring: boolean;
    currentRefactoring: RefactoringType | null;
    preview: RefactoringPreview | null;
    history: RefactoringPreview[];

    // Operations
    startRename: (location: RefactoringLocation, oldName: string) => void;
    extractVariable: (location: RefactoringLocation, expression: string) => RefactoringPreview;
    extractFunction: (location: RefactoringLocation, code: string) => RefactoringPreview;
    extractConstant: (location: RefactoringLocation, value: string) => RefactoringPreview;
    extractInterface: (location: RefactoringLocation, objectLiteral: string) => RefactoringPreview;
    inlineVariable: (location: RefactoringLocation, variableName: string) => RefactoringPreview;
    convertToArrowFunction: (location: RefactoringLocation) => RefactoringPreview;
    convertToAsync: (location: RefactoringLocation) => RefactoringPreview;

    // Preview management
    showPreview: (preview: RefactoringPreview) => void;
    applyRefactoring: () => Promise<void>;
    cancelRefactoring: () => void;

    // Undo
    undoLastRefactoring: () => Promise<void>;
}

// =============================================================================
// REFACTORING STORE
// =============================================================================

export const useRefactoringService = create<RefactoringState>((set, get) => ({
    isRefactoring: false,
    currentRefactoring: null,
    preview: null,
    history: [],

    startRename: (location, oldName) => {
        console.log('[Refactor] Starting rename for:', oldName, 'at', location);
        set({
            isRefactoring: true,
            currentRefactoring: 'rename',
        });

        // In real implementation, this would:
        // 1. Find all references to the symbol
        // 2. Show inline rename input
        // 3. Preview changes across files
    },

    extractVariable: (location, expression) => {
        console.log('[Refactor] Extract variable from:', expression, 'at', location);

        const preview: RefactoringPreview = {
            type: 'extract-variable',
            description: `Extract expression to variable`,
            changes: [
                {
                    type: 'insert',
                    location: { ...location, startColumn: 0, endColumn: 0 },
                    newText: `const extractedVariable = ${expression};\n`,
                },
                {
                    type: 'replace',
                    location,
                    newText: 'extractedVariable',
                },
            ],
            affectedFiles: [location.file],
        };

        get().showPreview(preview);
        return preview;
    },

    extractFunction: (location, code) => {
        console.log('[Refactor] Extract function from code at', location);

        // Analyze code for parameters and return values
        const functionName = 'extractedFunction';

        const preview: RefactoringPreview = {
            type: 'extract-function',
            description: `Extract code to function '${functionName}'`,
            changes: [
                {
                    type: 'insert',
                    location: { ...location, startLine: location.startLine - 1, endLine: location.startLine - 1, startColumn: 0, endColumn: 0 },
                    newText: `function ${functionName}() {\n${code}\n}\n\n`,
                },
                {
                    type: 'replace',
                    location,
                    newText: `${functionName}();`,
                },
            ],
            affectedFiles: [location.file],
        };

        get().showPreview(preview);
        return preview;
    },

    extractConstant: (location, value) => {
        console.log('[Refactor] Extract constant:', value);

        const constantName = 'EXTRACTED_CONSTANT';

        const preview: RefactoringPreview = {
            type: 'extract-constant',
            description: `Extract value to constant '${constantName}'`,
            changes: [
                {
                    type: 'insert',
                    location: { ...location, startLine: 1, endLine: 1, startColumn: 0, endColumn: 0 },
                    newText: `const ${constantName} = ${value};\n`,
                },
                {
                    type: 'replace',
                    location,
                    newText: constantName,
                },
            ],
            affectedFiles: [location.file],
        };

        get().showPreview(preview);
        return preview;
    },

    extractInterface: (location, objectLiteral) => {
        console.log('[Refactor] Extract interface from:', objectLiteral);

        const interfaceName = 'ExtractedInterface';

        const preview: RefactoringPreview = {
            type: 'extract-interface',
            description: `Extract interface '${interfaceName}'`,
            changes: [
                {
                    type: 'insert',
                    location: { ...location, startLine: 1, endLine: 1, startColumn: 0, endColumn: 0 },
                    newText: `interface ${interfaceName} {\n    // TODO: Add type definitions\n}\n\n`,
                },
            ],
            affectedFiles: [location.file],
        };

        get().showPreview(preview);
        return preview;
    },

    inlineVariable: (location, variableName) => {
        console.log('[Refactor] Inline variable:', variableName);

        const preview: RefactoringPreview = {
            type: 'inline-variable',
            description: `Inline variable '${variableName}'`,
            changes: [
                {
                    type: 'delete',
                    location,
                },
                // Additional changes to replace references would be added here
            ],
            affectedFiles: [location.file],
        };

        get().showPreview(preview);
        return preview;
    },

    convertToArrowFunction: (location) => {
        console.log('[Refactor] Convert to arrow function at', location);

        const preview: RefactoringPreview = {
            type: 'convert-to-arrow',
            description: 'Convert function to arrow function',
            changes: [
                {
                    type: 'replace',
                    location,
                    newText: '/* Arrow function conversion preview */',
                },
            ],
            affectedFiles: [location.file],
        };

        get().showPreview(preview);
        return preview;
    },

    convertToAsync: (location) => {
        console.log('[Refactor] Convert to async function at', location);

        const preview: RefactoringPreview = {
            type: 'convert-to-async',
            description: 'Convert function to async/await',
            changes: [
                {
                    type: 'replace',
                    location,
                    newText: '/* Async conversion preview */',
                },
            ],
            affectedFiles: [location.file],
        };

        get().showPreview(preview);
        return preview;
    },

    showPreview: (preview) => {
        set({
            isRefactoring: true,
            currentRefactoring: preview.type,
            preview,
        });
    },

    applyRefactoring: async () => {
        const { preview } = get();
        if (!preview) return;

        console.log('[Refactor] Applying refactoring:', preview.type);

        // In real implementation, this would:
        // 1. Apply all changes to files
        // 2. Update the file system
        // 3. Refresh editors

        set(state => ({
            isRefactoring: false,
            currentRefactoring: null,
            preview: null,
            history: [preview, ...state.history].slice(0, 20),
        }));
    },

    cancelRefactoring: () => {
        set({
            isRefactoring: false,
            currentRefactoring: null,
            preview: null,
        });
    },

    undoLastRefactoring: async () => {
        const { history } = get();
        if (history.length === 0) return;

        const lastRefactoring = history[0];
        console.log('[Refactor] Undoing:', lastRefactoring.type);

        // In real implementation, this would reverse the changes

        set(state => ({
            history: state.history.slice(1),
        }));
    },
}));

// =============================================================================
// REFACTORING HELPERS
// =============================================================================

export function getRefactoringLabel(type: RefactoringType): string {
    const labels: Record<RefactoringType, string> = {
        'rename': 'Rename Symbol',
        'extract-variable': 'Extract Variable',
        'extract-function': 'Extract Function',
        'extract-constant': 'Extract Constant',
        'extract-interface': 'Extract Interface',
        'inline-variable': 'Inline Variable',
        'move-to-file': 'Move to New File',
        'convert-to-arrow': 'Convert to Arrow Function',
        'convert-to-async': 'Convert to Async/Await',
    };
    return labels[type];
}

export function getAvailableRefactorings(
    hasSelection: boolean,
    selectionType: 'expression' | 'statement' | 'function' | 'none'
): RefactoringType[] {
    const refactorings: RefactoringType[] = ['rename'];

    if (hasSelection) {
        if (selectionType === 'expression') {
            refactorings.push('extract-variable', 'extract-constant');
        }
        if (selectionType === 'statement') {
            refactorings.push('extract-function');
        }
        if (selectionType === 'function') {
            refactorings.push('convert-to-arrow', 'convert-to-async', 'move-to-file');
        }
    }

    return refactorings;
}
