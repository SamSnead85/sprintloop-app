/**
 * Code Context Injection
 * 
 * Phase 13: Auto-inject open file content into AI prompts
 * - Smart file selection based on query
 * - Context-aware code inclusion
 * - Symbol extraction
 */

import { useProjectStore } from '../../stores/project-store';

export interface CodeContext {
    files: FileContext[];
    symbols: SymbolContext[];
    totalTokens: number;
}

export interface FileContext {
    path: string;
    content: string;
    language: string;
    relevanceScore: number;
    tokens: number;
}

export interface SymbolContext {
    name: string;
    type: 'function' | 'class' | 'variable' | 'interface' | 'type';
    filePath: string;
    lineStart: number;
    lineEnd: number;
    content: string;
}

// Keywords that suggest specific file types
const LANGUAGE_HINTS: Record<string, string[]> = {
    typescript: ['ts', 'tsx', 'type', 'interface', 'typescript'],
    javascript: ['js', 'jsx', 'javascript'],
    python: ['python', 'py', 'pip', 'django', 'flask'],
    rust: ['rust', 'rs', 'cargo'],
    css: ['css', 'style', 'styling', 'tailwind'],
    html: ['html', 'markup', 'template'],
};

/**
 * Estimate tokens for text
 */
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Calculate relevance score for a file based on query
 */
function calculateRelevance(filePath: string, fileContent: string, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    const pathLower = filePath.toLowerCase();
    const contentLower = fileContent.toLowerCase();

    // File name matches query
    const fileName = filePath.split('/').pop() || '';
    if (queryLower.includes(fileName.toLowerCase().replace(/\.\w+$/, ''))) {
        score += 50;
    }

    // Path contains query terms
    const queryTerms = queryLower.split(/\s+/);
    for (const term of queryTerms) {
        if (term.length > 2 && pathLower.includes(term)) {
            score += 20;
        }
        if (term.length > 2 && contentLower.includes(term)) {
            score += 10;
        }
    }

    // Language hints
    for (const [lang, hints] of Object.entries(LANGUAGE_HINTS)) {
        if (hints.some(h => queryLower.includes(h))) {
            if (filePath.endsWith(`.${lang}`) || filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
                score += 15;
            }
        }
    }

    return score;
}

/**
 * Get code context from open files
 */
export function getOpenFilesContext(query: string, maxTokens: number = 8000): CodeContext {
    const store = useProjectStore.getState();
    const files = store.files;

    if (files.length === 0) {
        return { files: [], symbols: [], totalTokens: 0 };
    }

    // Score and sort files by relevance
    const scoredFiles = files.map(file => ({
        path: file.path,
        content: file.content,
        language: file.language,
        relevanceScore: calculateRelevance(file.path, file.content, query),
        tokens: estimateTokens(file.content),
    })).sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Select files within token limit
    const selectedFiles: FileContext[] = [];
    let totalTokens = 0;

    for (const file of scoredFiles) {
        if (file.relevanceScore > 0 && totalTokens + file.tokens <= maxTokens) {
            selectedFiles.push(file);
            totalTokens += file.tokens;
        }

        // Always include active file
        const activeTab = store.activeTabId;
        if (activeTab && file.path === files.find(f => f.id === activeTab)?.path) {
            if (!selectedFiles.includes(file) && totalTokens + file.tokens <= maxTokens) {
                selectedFiles.push(file);
                totalTokens += file.tokens;
            }
        }
    }

    return {
        files: selectedFiles,
        symbols: [], // Would extract from files
        totalTokens,
    };
}

/**
 * Format code context for injection into prompt
 */
export function formatCodeContext(context: CodeContext): string {
    if (context.files.length === 0) {
        return '';
    }

    let formatted = '## Current Code Context\n\n';

    for (const file of context.files) {
        formatted += `### ${file.path}\n`;
        formatted += '```' + file.language + '\n';
        formatted += file.content;
        formatted += '\n```\n\n';
    }

    return formatted;
}

/**
 * Build system prompt with code context
 */
export function buildSystemPromptWithContext(
    basePrompt: string,
    query: string,
    maxContextTokens: number = 8000
): string {
    const context = getOpenFilesContext(query, maxContextTokens);
    const formattedContext = formatCodeContext(context);

    if (!formattedContext) {
        return basePrompt;
    }

    return `${basePrompt}

${formattedContext}

The above shows the code files the user currently has open. Use this context to provide more accurate and relevant assistance.`;
}

/**
 * Extract mentioned file names from a query
 */
export function extractMentionedFiles(query: string): string[] {
    const filePattern = /\b[\w-]+\.(ts|tsx|js|jsx|py|rs|go|css|html|json|md)\b/gi;
    const matches = query.match(filePattern);
    return matches ? [...new Set(matches)] : [];
}

/**
 * Get specific file content by name
 */
export function getFileByName(fileName: string): FileContext | null {
    const store = useProjectStore.getState();
    const file = store.files.find(f =>
        f.path.endsWith(fileName) || f.name === fileName
    );

    if (!file) return null;

    return {
        path: file.path,
        content: file.content,
        language: file.language,
        relevanceScore: 100,
        tokens: estimateTokens(file.content),
    };
}
