/**
 * AI Code Actions
 * 
 * Quick actions for selected code: explain, fix, refactor, add types, generate tests.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type CodeActionType =
    | 'explain'
    | 'fix_error'
    | 'refactor'
    | 'simplify'
    | 'add_types'
    | 'add_docs'
    | 'generate_tests'
    | 'optimize'
    | 'convert';

export interface CodeAction {
    id: CodeActionType;
    name: string;
    description: string;
    icon: string;
    shortcut?: string;
    requiresSelection: boolean;
    category: 'understand' | 'edit' | 'generate';
}

export interface CodeActionContext {
    filePath: string;
    language: string;
    selectedText: string;
    selectionRange: {
        startLine: number;
        endLine: number;
        startColumn: number;
        endColumn: number;
    };
    surroundingCode: string;
    diagnostics?: Diagnostic[];
}

export interface Diagnostic {
    message: string;
    severity: 'error' | 'warning' | 'info';
    line: number;
    column: number;
}

export interface CodeActionResult {
    action: CodeActionType;
    success: boolean;
    output: string;
    replacement?: string;
    explanation?: string;
    diff?: string;
}

export interface CodeActionsState {
    isMenuVisible: boolean;
    menuPosition: { x: number; y: number };
    currentContext: CodeActionContext | null;
    isExecuting: boolean;
    lastResult: CodeActionResult | null;

    // Actions
    showMenu: (position: { x: number; y: number }, context: CodeActionContext) => void;
    hideMenu: () => void;
    executeAction: (actionType: CodeActionType) => Promise<CodeActionResult>;
    getAvailableActions: () => CodeAction[];
    clearResult: () => void;
}

// =============================================================================
// AVAILABLE ACTIONS
// =============================================================================

const CODE_ACTIONS: CodeAction[] = [
    {
        id: 'explain',
        name: 'Explain',
        description: 'Explain what this code does',
        icon: '💡',
        shortcut: '⌘E',
        requiresSelection: true,
        category: 'understand',
    },
    {
        id: 'fix_error',
        name: 'Fix Error',
        description: 'Fix the error in this code',
        icon: '🔧',
        shortcut: '⌘F',
        requiresSelection: true,
        category: 'edit',
    },
    {
        id: 'refactor',
        name: 'Refactor',
        description: 'Improve code structure',
        icon: '♻️',
        shortcut: '⌘R',
        requiresSelection: true,
        category: 'edit',
    },
    {
        id: 'simplify',
        name: 'Simplify',
        description: 'Make code simpler and cleaner',
        icon: '✨',
        requiresSelection: true,
        category: 'edit',
    },
    {
        id: 'add_types',
        name: 'Add Types',
        description: 'Add TypeScript types',
        icon: '📝',
        requiresSelection: true,
        category: 'edit',
    },
    {
        id: 'add_docs',
        name: 'Add Documentation',
        description: 'Generate JSDoc comments',
        icon: '📚',
        requiresSelection: true,
        category: 'generate',
    },
    {
        id: 'generate_tests',
        name: 'Generate Tests',
        description: 'Create unit tests',
        icon: '🧪',
        shortcut: '⌘T',
        requiresSelection: true,
        category: 'generate',
    },
    {
        id: 'optimize',
        name: 'Optimize',
        description: 'Improve performance',
        icon: '⚡',
        requiresSelection: true,
        category: 'edit',
    },
    {
        id: 'convert',
        name: 'Convert',
        description: 'Convert to different syntax',
        icon: '🔄',
        requiresSelection: true,
        category: 'edit',
    },
];

// =============================================================================
// CODE ACTIONS STORE
// =============================================================================

export const useCodeActions = create<CodeActionsState>((set, get) => ({
    isMenuVisible: false,
    menuPosition: { x: 0, y: 0 },
    currentContext: null,
    isExecuting: false,
    lastResult: null,

    showMenu: (position, context) => {
        set({
            isMenuVisible: true,
            menuPosition: position,
            currentContext: context,
            lastResult: null,
        });
    },

    hideMenu: () => {
        set({ isMenuVisible: false });
    },

    executeAction: async (actionType: CodeActionType): Promise<CodeActionResult> => {
        const { currentContext } = get();

        if (!currentContext) {
            return {
                action: actionType,
                success: false,
                output: 'No code selected',
            };
        }

        set({ isExecuting: true, isMenuVisible: false });

        try {
            const result = await executeCodeAction(actionType, currentContext);
            set({ lastResult: result, isExecuting: false });
            return result;
        } catch (error) {
            const errorResult: CodeActionResult = {
                action: actionType,
                success: false,
                output: error instanceof Error ? error.message : 'Action failed',
            };
            set({ lastResult: errorResult, isExecuting: false });
            return errorResult;
        }
    },

    getAvailableActions: (): CodeAction[] => {
        const { currentContext } = get();

        if (!currentContext) return [];

        let actions = CODE_ACTIONS.filter(a => !a.requiresSelection || currentContext.selectedText);

        // If there are diagnostics, prioritize fix action
        if (currentContext.diagnostics && currentContext.diagnostics.length > 0) {
            actions = actions.sort((a, b) => {
                if (a.id === 'fix_error') return -1;
                if (b.id === 'fix_error') return 1;
                return 0;
            });
        }

        return actions;
    },

    clearResult: () => {
        set({ lastResult: null });
    },
}));

// =============================================================================
// ACTION EXECUTION
// =============================================================================

async function executeCodeAction(
    actionType: CodeActionType,
    context: CodeActionContext
): Promise<CodeActionResult> {
    const prompt = buildActionPrompt(actionType, context);

    // In real implementation, call AI model
    // For now, return mock results
    return mockExecuteAction(actionType, context, prompt);
}

function buildActionPrompt(actionType: CodeActionType, context: CodeActionContext): string {
    const { language, selectedText, surroundingCode, diagnostics } = context;

    const prompts: Record<CodeActionType, string> = {
        explain: `Explain the following ${language} code in simple terms:

\`\`\`${language}
${selectedText}
\`\`\`

Provide a clear, concise explanation.`,

        fix_error: `Fix the error in the following ${language} code:

\`\`\`${language}
${selectedText}
\`\`\`

${diagnostics?.length ? `Errors:\n${diagnostics.map(d => `- ${d.message}`).join('\n')}` : ''}

Provide the corrected code only.`,

        refactor: `Refactor the following ${language} code to improve structure and readability:

\`\`\`${language}
${selectedText}
\`\`\`

Surrounding context:
\`\`\`${language}
${surroundingCode}
\`\`\`

Provide the refactored code only.`,

        simplify: `Simplify the following ${language} code while maintaining functionality:

\`\`\`${language}
${selectedText}
\`\`\`

Provide the simplified code only.`,

        add_types: `Add TypeScript types to the following code:

\`\`\`${language}
${selectedText}
\`\`\`

Provide the typed code only.`,

        add_docs: `Add JSDoc documentation to the following ${language} code:

\`\`\`${language}
${selectedText}
\`\`\`

Provide the documented code only.`,

        generate_tests: `Generate comprehensive unit tests for the following ${language} code:

\`\`\`${language}
${selectedText}
\`\`\`

Use a testing framework appropriate for ${language}. Include edge cases.`,

        optimize: `Optimize the following ${language} code for performance:

\`\`\`${language}
${selectedText}
\`\`\`

Provide the optimized code only with brief inline comments for changes.`,

        convert: `Convert the following ${language} code to a more modern syntax:

\`\`\`${language}
${selectedText}
\`\`\`

Provide the converted code only.`,
    };

    return prompts[actionType];
}

// Mock action executor - replace with actual AI call
async function mockExecuteAction(
    actionType: CodeActionType,
    context: CodeActionContext,
    _prompt: string
): Promise<CodeActionResult> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const { selectedText, language } = context;

    switch (actionType) {
        case 'explain':
            return {
                action: actionType,
                success: true,
                output: `This ${language} code:\n\n${selectedText}\n\n**Explanation:**\n` +
                    `This code defines ${selectedText.includes('function') ? 'a function' : 'a code block'} ` +
                    `that performs operations on the given input. It follows ${language} conventions ` +
                    `and patterns commonly used in modern applications.`,
            };

        case 'fix_error':
            return {
                action: actionType,
                success: true,
                output: 'Error fixed successfully',
                replacement: selectedText + ' // Fixed',
                explanation: 'Added missing semicolon and fixed syntax.',
            };

        case 'refactor':
            return {
                action: actionType,
                success: true,
                output: 'Code refactored',
                replacement: `// Refactored version\n${selectedText}`,
                explanation: 'Extracted helper functions and improved naming.',
            };

        case 'add_types':
            return {
                action: actionType,
                success: true,
                output: 'Types added',
                replacement: selectedText.replace(/\bfunction\s+(\w+)\s*\(/, 'function $1(args: unknown): unknown {'),
                explanation: 'Added TypeScript types based on usage.',
            };

        case 'add_docs':
            return {
                action: actionType,
                success: true,
                output: 'Documentation added',
                replacement: `/**\n * TODO: Add description\n * @returns {unknown}\n */\n${selectedText}`,
            };

        case 'generate_tests':
            return {
                action: actionType,
                success: true,
                output: `describe('Component', () => {\n  it('should work correctly', () => {\n    // Test generated for:\n    // ${selectedText.slice(0, 50)}...\n    expect(true).toBe(true);\n  });\n});`,
            };

        default:
            return {
                action: actionType,
                success: true,
                output: 'Action completed',
                replacement: selectedText,
            };
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get action by ID
 */
export function getCodeAction(id: CodeActionType): CodeAction | undefined {
    return CODE_ACTIONS.find(a => a.id === id);
}

/**
 * Get actions by category
 */
export function getActionsByCategory(category: CodeAction['category']): CodeAction[] {
    return CODE_ACTIONS.filter(a => a.category === category);
}

/**
 * Check if we should show the lightbulb (quick fix available)
 */
export function hasQuickFix(diagnostics?: Diagnostic[]): boolean {
    return diagnostics ? diagnostics.some(d => d.severity === 'error') : false;
}
