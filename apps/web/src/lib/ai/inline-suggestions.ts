/**
 * Inline AI Suggestions
 * 
 * Phase 26: Ghost text completions with tab-to-accept
 * Cursor/Copilot-style inline AI suggestions
 */

export interface InlineSuggestion {
    id: string;
    text: string;
    insertText: string;
    range: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
    displayText: string;
    confidence: number;
    model: string;
}

export interface SuggestionContext {
    filePath: string;
    language: string;
    prefix: string;     // Text before cursor
    suffix: string;     // Text after cursor
    cursorLine: number;
    cursorColumn: number;
}

// Debounce timer ID
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Request inline completion from AI
 */
export async function requestInlineCompletion(
    context: SuggestionContext,
    _signal?: AbortSignal
): Promise<InlineSuggestion | null> {
    console.log('[InlineAI] Requesting completion for:', context.filePath);

    // In real implementation, call AI model with FIM (fill-in-the-middle) prompt
    // For now, return mock suggestions based on context

    const { prefix, language } = context;
    const lastLine = prefix.split('\n').pop() || '';

    // Simple pattern-based suggestions
    let suggestion: string | null = null;

    if (language === 'typescript' || language === 'javascript') {
        if (lastLine.trim().startsWith('const ') && lastLine.includes('= ')) {
            suggestion = '';
        } else if (lastLine.trim() === 'export function ') {
            suggestion = 'example() {\n  \n}';
        } else if (lastLine.includes('console.')) {
            suggestion = "log('');";
        } else if (lastLine.trim().startsWith('import ')) {
            suggestion = "from '';";
        }
    }

    if (!suggestion) return null;

    return {
        id: `sugg-${Date.now()}`,
        text: suggestion,
        insertText: suggestion,
        range: {
            startLine: context.cursorLine,
            startColumn: context.cursorColumn,
            endLine: context.cursorLine,
            endColumn: context.cursorColumn,
        },
        displayText: suggestion,
        confidence: 0.75,
        model: 'local-pattern',
    };
}

/**
 * Request completion with debounce
 */
export function requestCompletionDebounced(
    context: SuggestionContext,
    callback: (suggestion: InlineSuggestion | null) => void,
    delayMs: number = 300
): () => void {
    // Cancel previous request
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    const abortController = new AbortController();

    debounceTimer = setTimeout(async () => {
        try {
            const suggestion = await requestInlineCompletion(context, abortController.signal);
            callback(suggestion);
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('[InlineAI] Error:', error);
            }
            callback(null);
        }
    }, delayMs);

    // Return cancel function
    return () => {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        abortController.abort();
    };
}

/**
 * Accept the current suggestion
 */
export function acceptSuggestion(suggestion: InlineSuggestion): string {
    console.log('[InlineAI] Accepted:', suggestion.text.slice(0, 50));
    return suggestion.insertText;
}

/**
 * Dismiss the current suggestion
 */
export function dismissSuggestion(): void {
    console.log('[InlineAI] Suggestion dismissed');
}

/**
 * Cycle through alternative suggestions
 */
export function getAlternatives(_suggestion: InlineSuggestion): InlineSuggestion[] {
    // In real implementation, fetch from AI with different sampling
    return [];
}
