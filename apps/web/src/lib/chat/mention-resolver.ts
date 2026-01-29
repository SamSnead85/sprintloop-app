/**
 * Mention Resolver
 * 
 * Parse and resolve @ mentions in chat: @file, @symbol, @git, @web
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type MentionType = 'file' | 'symbol' | 'folder' | 'git' | 'web' | 'docs';

export interface Mention {
    type: MentionType;
    raw: string;          // Original text (e.g., "@file:src/App.tsx")
    value: string;        // Resolved value (e.g., "src/App.tsx")
    resolved?: string;    // Resolved content
    startIndex: number;
    endIndex: number;
}

export interface MentionSuggestion {
    type: MentionType;
    label: string;
    value: string;
    description?: string;
    icon: string;
}

export interface MentionResolverState {
    mentions: Mention[];
    suggestions: MentionSuggestion[];
    isResolving: boolean;
    showSuggestions: boolean;
    suggestionPosition: { x: number; y: number };

    // Actions
    parseInput: (input: string) => Mention[];
    resolveMentions: (mentions: Mention[]) => Promise<Mention[]>;
    getSuggestions: (partial: string, type?: MentionType) => Promise<MentionSuggestion[]>;
    showSuggestionsAt: (position: { x: number; y: number }) => void;
    hideSuggestions: () => void;
    buildContextFromMentions: (mentions: Mention[]) => string;
}

// =============================================================================
// MENTION PATTERNS
// =============================================================================

const MENTION_PATTERNS: Record<MentionType, RegExp> = {
    file: /@file:([^\s]+)/g,
    folder: /@folder:([^\s]+)/g,
    symbol: /@symbol:([^\s]+)/g,
    git: /@git(?::([^\s]+))?/g,
    web: /@web:([^\s]+)/g,
    docs: /@docs(?::([^\s]+))?/g,
};

const MENTION_PREFIXES: Record<string, MentionType> = {
    '@file:': 'file',
    '@folder:': 'folder',
    '@symbol:': 'symbol',
    '@git': 'git',
    '@web:': 'web',
    '@docs': 'docs',
};

// =============================================================================
// MENTION RESOLVER STORE
// =============================================================================

export const useMentionResolver = create<MentionResolverState>((set) => ({
    mentions: [],
    suggestions: [],
    isResolving: false,
    showSuggestions: false,
    suggestionPosition: { x: 0, y: 0 },

    parseInput: (input: string): Mention[] => {
        const mentions: Mention[] = [];

        for (const [type, pattern] of Object.entries(MENTION_PATTERNS) as [MentionType, RegExp][]) {
            const regex = new RegExp(pattern.source, 'g');
            let match;

            while ((match = regex.exec(input)) !== null) {
                mentions.push({
                    type,
                    raw: match[0],
                    value: match[1] || '',
                    startIndex: match.index,
                    endIndex: match.index + match[0].length,
                });
            }
        }

        // Sort by position in string
        mentions.sort((a, b) => a.startIndex - b.startIndex);

        set({ mentions });
        return mentions;
    },

    resolveMentions: async (mentions: Mention[]): Promise<Mention[]> => {
        set({ isResolving: true });

        const resolved = await Promise.all(
            mentions.map(async (mention) => ({
                ...mention,
                resolved: await resolveMentionContent(mention),
            }))
        );

        set({ mentions: resolved, isResolving: false });
        return resolved;
    },

    getSuggestions: async (partial: string, type?: MentionType): Promise<MentionSuggestion[]> => {
        const suggestions = await generateSuggestions(partial, type);
        set({ suggestions });
        return suggestions;
    },

    showSuggestionsAt: (position) => {
        set({ showSuggestions: true, suggestionPosition: position });
    },

    hideSuggestions: () => {
        set({ showSuggestions: false, suggestions: [] });
    },

    buildContextFromMentions: (mentions: Mention[]): string => {
        if (mentions.length === 0) return '';

        const sections = mentions
            .filter(m => m.resolved)
            .map(m => {
                const header = getMentionHeader(m);
                return `${header}\n${m.resolved}`;
            });

        return sections.join('\n\n---\n\n');
    },
}));

// =============================================================================
// RESOLUTION FUNCTIONS
// =============================================================================

async function resolveMentionContent(mention: Mention): Promise<string> {
    switch (mention.type) {
        case 'file':
            return resolveFile(mention.value);
        case 'folder':
            return resolveFolder(mention.value);
        case 'symbol':
            return resolveSymbol(mention.value);
        case 'git':
            return resolveGit(mention.value);
        case 'web':
            return resolveWeb(mention.value);
        case 'docs':
            return resolveDocs(mention.value);
        default:
            return '';
    }
}

async function resolveFile(path: string): Promise<string> {
    // In real implementation, read file from filesystem
    // For now, return mock content
    return `// Contents of ${path}\n// [File content would be loaded here]`;
}

async function resolveFolder(path: string): Promise<string> {
    return `Folder: ${path}\n- file1.ts\n- file2.ts\n- subfolder/`;
}

async function resolveSymbol(symbol: string): Promise<string> {
    return `Symbol: ${symbol}\n\n\`\`\`typescript\n// Symbol definition would be here\n\`\`\``;
}

async function resolveGit(ref: string): Promise<string> {
    if (!ref) {
        return `Git Status:\n- Modified: 3 files\n- Staged: 1 file\n- Branch: main`;
    }
    return `Git ref: ${ref}\nCommit details would be here`;
}

async function resolveWeb(url: string): Promise<string> {
    return `Web: ${url}\n[Web content would be fetched and summarized]`;
}

async function resolveDocs(query: string): Promise<string> {
    return `Documentation for: ${query || 'project'}\n[Relevant docs would be here]`;
}

// =============================================================================
// SUGGESTION FUNCTIONS
// =============================================================================

async function generateSuggestions(
    partial: string,
    type?: MentionType
): Promise<MentionSuggestion[]> {
    const suggestions: MentionSuggestion[] = [];

    // Determine what type of suggestion based on input
    if (partial.startsWith('@') || !type) {
        // Show all mention types
        suggestions.push(
            { type: 'file', label: '@file:', value: '@file:', description: 'Include file content', icon: '📄' },
            { type: 'folder', label: '@folder:', value: '@folder:', description: 'Include folder structure', icon: '📁' },
            { type: 'symbol', label: '@symbol:', value: '@symbol:', description: 'Reference function/class', icon: '🔤' },
            { type: 'git', label: '@git', value: '@git', description: 'Git status and changes', icon: '📦' },
            { type: 'web', label: '@web:', value: '@web:', description: 'Search and include web', icon: '🌐' },
            { type: 'docs', label: '@docs', value: '@docs', description: 'Project documentation', icon: '📚' },
        );
    }

    // If we have a specific type, add file/symbol suggestions
    if (type === 'file') {
        suggestions.push(
            { type: 'file', label: 'src/App.tsx', value: '@file:src/App.tsx', icon: '📄' },
            { type: 'file', label: 'src/index.ts', value: '@file:src/index.ts', icon: '📄' },
            { type: 'file', label: 'package.json', value: '@file:package.json', icon: '📄' },
        );
    }

    if (type === 'symbol') {
        suggestions.push(
            { type: 'symbol', label: 'useStore', value: '@symbol:useStore', description: 'Zustand store hook', icon: '🔤' },
            { type: 'symbol', label: 'Component', value: '@symbol:Component', description: 'React component', icon: '🔤' },
        );
    }

    return suggestions;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getMentionHeader(mention: Mention): string {
    const headers: Record<MentionType, string> = {
        file: `📄 File: ${mention.value}`,
        folder: `📁 Folder: ${mention.value}`,
        symbol: `🔤 Symbol: ${mention.value}`,
        git: `📦 Git: ${mention.value || 'status'}`,
        web: `🌐 Web: ${mention.value}`,
        docs: `📚 Docs: ${mention.value || 'project'}`,
    };
    return headers[mention.type];
}

/**
 * Check if user is typing a mention
 */
export function isTypingMention(input: string, cursorPosition: number): { isMention: boolean; partial: string; type?: MentionType } {
    // Look backward from cursor for @
    const beforeCursor = input.slice(0, cursorPosition);
    const atIndex = beforeCursor.lastIndexOf('@');

    if (atIndex === -1) {
        return { isMention: false, partial: '' };
    }

    const partial = beforeCursor.slice(atIndex);

    // Check if there's a space between @ and cursor (not a mention anymore)
    if (partial.includes(' ') && !partial.startsWith('@file:') && !partial.startsWith('@folder:')) {
        return { isMention: false, partial: '' };
    }

    // Determine type if prefix is complete
    for (const [prefix, type] of Object.entries(MENTION_PREFIXES)) {
        if (partial.startsWith(prefix)) {
            return { isMention: true, partial, type };
        }
    }

    return { isMention: true, partial };
}

/**
 * Remove mentions from input and return clean text
 */
export function stripMentions(input: string): string {
    let result = input;

    for (const pattern of Object.values(MENTION_PATTERNS)) {
        result = result.replace(new RegExp(pattern.source, 'g'), '');
    }

    return result.replace(/\s+/g, ' ').trim();
}
