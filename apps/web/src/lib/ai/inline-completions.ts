/**
 * Inline AI Completions
 * 
 * Ghost text suggestions while typing, similar to Cursor/GitHub Copilot.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface Position {
    line: number;
    column: number;
}

export interface Range {
    start: Position;
    end: Position;
}

export interface InlineCompletion {
    id: string;
    text: string;
    insertText: string;
    range: Range;
    confidence: number;
    source: 'ai' | 'snippet' | 'history';
}

export interface CompletionContext {
    filePath: string;
    language: string;
    prefix: string;      // Text before cursor
    suffix: string;      // Text after cursor
    line: string;        // Current line
    lineNumber: number;
    selectedText?: string;
}

export interface CompletionRequest {
    context: CompletionContext;
    trigger: 'auto' | 'manual' | 'selection';
    maxTokens?: number;
}

export interface InlineCompletionState {
    completions: InlineCompletion[];
    activeIndex: number;
    isLoading: boolean;
    isVisible: boolean;
    lastContext: CompletionContext | null;

    // Actions
    requestCompletion: (request: CompletionRequest) => Promise<void>;
    acceptCompletion: () => InlineCompletion | null;
    nextCompletion: () => void;
    prevCompletion: () => void;
    dismissCompletions: () => void;
    getActiveCompletion: () => InlineCompletion | null;
}

// =============================================================================
// COMPLETION STORE
// =============================================================================

export const useInlineCompletions = create<InlineCompletionState>((set, get) => ({
    completions: [],
    activeIndex: 0,
    isLoading: false,
    isVisible: false,
    lastContext: null,

    requestCompletion: async (request: CompletionRequest) => {
        set({ isLoading: true, lastContext: request.context });

        try {
            const completions = await generateCompletions(request);

            set({
                completions,
                activeIndex: 0,
                isVisible: completions.length > 0,
                isLoading: false,
            });
        } catch (error) {
            console.error('[InlineCompletions] Error:', error);
            set({ isLoading: false, completions: [], isVisible: false });
        }
    },

    acceptCompletion: (): InlineCompletion | null => {
        const { completions, activeIndex } = get();
        const completion = completions[activeIndex];

        set({ completions: [], isVisible: false, activeIndex: 0 });

        return completion || null;
    },

    nextCompletion: () => {
        const { completions, activeIndex } = get();
        if (completions.length > 1) {
            set({ activeIndex: (activeIndex + 1) % completions.length });
        }
    },

    prevCompletion: () => {
        const { completions, activeIndex } = get();
        if (completions.length > 1) {
            set({ activeIndex: (activeIndex - 1 + completions.length) % completions.length });
        }
    },

    dismissCompletions: () => {
        set({ completions: [], isVisible: false, activeIndex: 0 });
    },

    getActiveCompletion: (): InlineCompletion | null => {
        const { completions, activeIndex, isVisible } = get();
        return isVisible && completions.length > 0 ? completions[activeIndex] : null;
    },
}));

// =============================================================================
// COMPLETION GENERATION
// =============================================================================

async function generateCompletions(request: CompletionRequest): Promise<InlineCompletion[]> {
    const { context, trigger } = request;

    // Build prompt for completion
    const prompt = buildCompletionPrompt(context, trigger);

    // In real implementation, this would call the AI model
    // For now, return mock completions based on context
    const completions = await mockGenerateCompletions(context, prompt);

    return completions;
}

function buildCompletionPrompt(context: CompletionContext, trigger: 'auto' | 'manual' | 'selection'): string {
    const { filePath, language, prefix, suffix, line } = context;

    return `Complete the following ${language} code. Provide only the completion text, no explanation.

File: ${filePath}
Language: ${language}
Trigger: ${trigger}

Current line: ${line}

Code before cursor:
\`\`\`${language}
${prefix.slice(-500)}
\`\`\`

Code after cursor:
\`\`\`${language}
${suffix.slice(0, 200)}
\`\`\`

Completion:`;
}

// Mock completion generator - replace with actual AI call
async function mockGenerateCompletions(
    context: CompletionContext,
    _prompt: string
): Promise<InlineCompletion[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const { line, lineNumber } = context;
    const completions: InlineCompletion[] = [];

    // Simple pattern matching for common completions
    if (line.includes('const ') && !line.includes('=')) {
        completions.push(createCompletion(
            ' = ',
            lineNumber,
            line.length,
            0.9
        ));
    }

    if (line.includes('function ') && line.includes('(') && !line.includes('{')) {
        completions.push(createCompletion(
            ') {\n  \n}',
            lineNumber,
            line.length,
            0.85
        ));
    }

    if (line.includes('if (') && !line.includes('{')) {
        completions.push(createCompletion(
            ') {\n  \n}',
            lineNumber,
            line.length,
            0.9
        ));
    }

    if (line.includes('import ') && line.includes('from ') && !line.includes(';')) {
        completions.push(createCompletion(
            ';',
            lineNumber,
            line.length,
            0.95
        ));
    }

    if (line.includes('console.log(') && !line.includes(');')) {
        completions.push(createCompletion(
            ');',
            lineNumber,
            line.length,
            0.95
        ));
    }

    if (line.includes('return ') && !line.includes(';')) {
        completions.push(createCompletion(
            ';',
            lineNumber,
            line.length,
            0.9
        ));
    }

    // React component patterns
    if (line.includes('useState(') && !line.includes(')')) {
        completions.push(createCompletion(
            'null)',
            lineNumber,
            line.length,
            0.8
        ));
    }

    if (line.includes('useEffect(') && !line.includes(')')) {
        completions.push(createCompletion(
            '() => {\n  \n}, [])',
            lineNumber,
            line.length,
            0.85
        ));
    }

    return completions;
}

function createCompletion(
    text: string,
    line: number,
    column: number,
    confidence: number
): InlineCompletion {
    return {
        id: `completion-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        insertText: text,
        range: {
            start: { line, column },
            end: { line, column },
        },
        confidence,
        source: 'ai',
    };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a debounced completion trigger
 */
export function createCompletionTrigger(delayMs = 300): (request: CompletionRequest) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (request: CompletionRequest) => {
        if (timeoutId) clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            useInlineCompletions.getState().requestCompletion(request);
        }, delayMs);
    };
}

/**
 * Extract completion context from editor state
 */
export function extractCompletionContext(
    filePath: string,
    content: string,
    cursorPosition: Position,
    language: string
): CompletionContext {
    const lines = content.split('\n');
    const lineIndex = cursorPosition.line;
    const column = cursorPosition.column;

    const prefix = lines.slice(0, lineIndex).join('\n') +
        (lineIndex > 0 ? '\n' : '') +
        lines[lineIndex].slice(0, column);

    const suffix = lines[lineIndex].slice(column) +
        (lineIndex < lines.length - 1 ? '\n' : '') +
        lines.slice(lineIndex + 1).join('\n');

    return {
        filePath,
        language,
        prefix,
        suffix,
        line: lines[lineIndex] || '',
        lineNumber: lineIndex,
    };
}

/**
 * Should trigger auto-completion?
 */
export function shouldTriggerCompletion(
    char: string,
    line: string,
    language: string
): boolean {
    // Don't trigger in comments
    if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#')) {
        return false;
    }

    // Don't trigger in strings (simplified check)
    const quotes = (line.match(/['"]/g) || []).length;
    if (quotes % 2 !== 0) {
        return false;
    }

    // Trigger on specific characters
    const triggerChars = [' ', '.', '(', '{', '[', '=', ':', ',', '\n'];
    if (triggerChars.includes(char)) {
        return true;
    }

    // Language-specific triggers
    if (language === 'typescript' || language === 'javascript') {
        if (char === '<' || char === '>') return true;
    }

    return false;
}
