/**
 * Codebase Index
 * 
 * Index project files and symbols for AI-powered code understanding.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface FileNode {
    path: string;
    name: string;
    type: 'file' | 'directory';
    language?: string;
    size: number;
    lastModified: number;
    symbols?: SymbolInfo[];
    content?: string;
}

export interface SymbolInfo {
    name: string;
    kind: SymbolKind;
    path: string;
    line: number;
    endLine: number;
    signature?: string;
    documentation?: string;
    children?: SymbolInfo[];
}

export type SymbolKind =
    | 'function'
    | 'class'
    | 'interface'
    | 'type'
    | 'variable'
    | 'constant'
    | 'enum'
    | 'method'
    | 'property'
    | 'module';

export interface CodebaseStats {
    totalFiles: number;
    totalSymbols: number;
    languages: Record<string, number>;
    lastIndexed: number;
}

export interface CodebaseIndexState {
    files: Map<string, FileNode>;
    symbols: Map<string, SymbolInfo>;
    stats: CodebaseStats;
    isIndexing: boolean;
    indexProgress: number;
    rootPath: string | null;

    // Actions
    indexCodebase: (rootPath: string) => Promise<void>;
    indexFile: (path: string, content: string) => Promise<void>;
    getFile: (path: string) => FileNode | undefined;
    getSymbol: (name: string) => SymbolInfo | undefined;
    searchFiles: (query: string) => FileNode[];
    searchSymbols: (query: string, kind?: SymbolKind) => SymbolInfo[];
    getContextForFiles: (paths: string[], maxTokens?: number) => string;
    clear: () => void;
}

// =============================================================================
// LANGUAGE DETECTION
// =============================================================================

const LANGUAGE_EXTENSIONS: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.kt': 'kotlin',
    '.swift': 'swift',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.php': 'php',
    '.vue': 'vue',
    '.svelte': 'svelte',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
    '.sql': 'sql',
    '.sh': 'bash',
    '.bash': 'bash',
};

function getLanguageFromPath(path: string): string | undefined {
    const ext = path.slice(path.lastIndexOf('.'));
    return LANGUAGE_EXTENSIONS[ext];
}

// =============================================================================
// CODEBASE INDEX STORE
// =============================================================================

export const useCodebaseIndex = create<CodebaseIndexState>((set, get) => ({
    files: new Map(),
    symbols: new Map(),
    stats: {
        totalFiles: 0,
        totalSymbols: 0,
        languages: {},
        lastIndexed: 0,
    },
    isIndexing: false,
    indexProgress: 0,
    rootPath: null,

    indexCodebase: async (rootPath: string) => {
        set({ isIndexing: true, indexProgress: 0, rootPath });

        try {
            // In real implementation, use Tauri to scan filesystem
            // For now, simulate indexing with mock data
            await simulateIndexing(set, get);

            set(state => ({
                stats: {
                    ...state.stats,
                    lastIndexed: Date.now(),
                },
                isIndexing: false,
                indexProgress: 100,
            }));

            console.log('[CodebaseIndex] Indexing complete');
        } catch (error) {
            console.error('[CodebaseIndex] Indexing failed:', error);
            set({ isIndexing: false });
        }
    },

    indexFile: async (path: string, content: string) => {
        const language = getLanguageFromPath(path);
        const symbols = extractSymbols(content, language);

        const fileNode: FileNode = {
            path,
            name: path.split('/').pop() || path,
            type: 'file',
            language,
            size: content.length,
            lastModified: Date.now(),
            symbols,
            content,
        };

        set(state => {
            const files = new Map(state.files).set(path, fileNode);
            const symbolMap = new Map(state.symbols);

            // Add symbols to global map
            for (const symbol of symbols) {
                symbolMap.set(`${path}:${symbol.name}`, { ...symbol, path });
            }

            return {
                files,
                symbols: symbolMap,
                stats: {
                    ...state.stats,
                    totalFiles: files.size,
                    totalSymbols: symbolMap.size,
                    languages: updateLanguageStats(files),
                },
            };
        });
    },

    getFile: (path: string) => get().files.get(path),

    getSymbol: (name: string) => {
        const { symbols } = get();

        // Try exact match first
        for (const [key, symbol] of symbols) {
            if (key.endsWith(`:${name}`) || symbol.name === name) {
                return symbol;
            }
        }

        return undefined;
    },

    searchFiles: (query: string): FileNode[] => {
        const { files } = get();
        const queryLower = query.toLowerCase();

        return Array.from(files.values())
            .filter(f =>
                f.path.toLowerCase().includes(queryLower) ||
                f.name.toLowerCase().includes(queryLower)
            )
            .slice(0, 20);
    },

    searchSymbols: (query: string, kind?: SymbolKind): SymbolInfo[] => {
        const { symbols } = get();
        const queryLower = query.toLowerCase();

        return Array.from(symbols.values())
            .filter(s => {
                const matchesQuery = s.name.toLowerCase().includes(queryLower);
                const matchesKind = !kind || s.kind === kind;
                return matchesQuery && matchesKind;
            })
            .slice(0, 20);
    },

    getContextForFiles: (paths: string[], maxTokens = 4000): string => {
        const { files } = get();
        const sections: string[] = [];
        let tokenCount = 0;
        const tokensPerChar = 0.25; // Rough estimate

        for (const path of paths) {
            const file = files.get(path);
            if (!file || !file.content) continue;

            const fileTokens = file.content.length * tokensPerChar;

            if (tokenCount + fileTokens > maxTokens) {
                // Truncate content
                const remainingTokens = maxTokens - tokenCount;
                const maxChars = Math.floor(remainingTokens / tokensPerChar);
                const truncated = file.content.slice(0, maxChars) + '\n// ... (truncated)';

                sections.push(`## ${file.path}\n\`\`\`${file.language || ''}\n${truncated}\n\`\`\``);
                break;
            }

            sections.push(`## ${file.path}\n\`\`\`${file.language || ''}\n${file.content}\n\`\`\``);
            tokenCount += fileTokens;
        }

        return sections.join('\n\n');
    },

    clear: () => {
        set({
            files: new Map(),
            symbols: new Map(),
            stats: { totalFiles: 0, totalSymbols: 0, languages: {}, lastIndexed: 0 },
            rootPath: null,
        });
    },
}));

// =============================================================================
// SYMBOL EXTRACTION
// =============================================================================

function extractSymbols(content: string, language?: string): SymbolInfo[] {
    if (!language) return [];

    const symbols: SymbolInfo[] = [];
    const lines = content.split('\n');

    // Simple regex-based extraction (production would use tree-sitter)
    const patterns: Record<string, { kind: SymbolKind; regex: RegExp }[]> = {
        typescript: [
            { kind: 'function', regex: /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g },
            { kind: 'class', regex: /(?:export\s+)?class\s+(\w+)/g },
            { kind: 'interface', regex: /(?:export\s+)?interface\s+(\w+)/g },
            { kind: 'type', regex: /(?:export\s+)?type\s+(\w+)/g },
            { kind: 'constant', regex: /(?:export\s+)?const\s+(\w+)/g },
            { kind: 'variable', regex: /(?:export\s+)?(?:let|var)\s+(\w+)/g },
        ],
        javascript: [
            { kind: 'function', regex: /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g },
            { kind: 'class', regex: /(?:export\s+)?class\s+(\w+)/g },
            { kind: 'constant', regex: /(?:export\s+)?const\s+(\w+)/g },
            { kind: 'variable', regex: /(?:export\s+)?(?:let|var)\s+(\w+)/g },
        ],
        python: [
            { kind: 'function', regex: /def\s+(\w+)/g },
            { kind: 'class', regex: /class\s+(\w+)/g },
        ],
    };

    const langPatterns = patterns[language] || [];

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];

        for (const { kind, regex } of langPatterns) {
            const freshRegex = new RegExp(regex.source, 'g');
            let match;

            while ((match = freshRegex.exec(line)) !== null) {
                symbols.push({
                    name: match[1],
                    kind,
                    path: '',
                    line: lineNum + 1,
                    endLine: lineNum + 1,
                    signature: line.trim(),
                });
            }
        }
    }

    return symbols;
}

function updateLanguageStats(files: Map<string, FileNode>): Record<string, number> {
    const stats: Record<string, number> = {};

    for (const file of files.values()) {
        if (file.language) {
            stats[file.language] = (stats[file.language] || 0) + 1;
        }
    }

    return stats;
}

async function simulateIndexing(
    set: (partial: Partial<CodebaseIndexState>) => void,
    _get: () => CodebaseIndexState
): Promise<void> {
    // Simulate progressive indexing
    for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 50));
        set({ indexProgress: i });
    }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get symbol kind icon
 */
export function getSymbolIcon(kind: SymbolKind): string {
    const icons: Record<SymbolKind, string> = {
        function: '𝑓',
        class: '◇',
        interface: '◈',
        type: '𝑇',
        variable: '𝑥',
        constant: '𝐶',
        enum: '∈',
        method: '◆',
        property: '●',
        module: '▣',
    };
    return icons[kind];
}

/**
 * Format symbol for display
 */
export function formatSymbol(symbol: SymbolInfo): string {
    return `${getSymbolIcon(symbol.kind)} ${symbol.name}`;
}
