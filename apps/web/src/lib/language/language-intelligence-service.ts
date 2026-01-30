/**
 * Phase 51-100: Language Intelligence Services
 * 
 * Consolidated language support including:
 * - Language detection
 * - Syntax highlighting themes
 * - Language-specific settings
 * - File associations
 * - Grammar definitions
 * - Semantic tokens
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface LanguageConfig {
    id: string;
    name: string;
    extensions: string[];
    aliases: string[];
    mimeTypes: string[];
    firstLine?: RegExp;
    configuration: LanguageSettings;
}

export interface LanguageSettings {
    tabSize: number;
    insertSpaces: boolean;
    wordWrap: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
    autoClosingBrackets: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
    autoClosingQuotes: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
    formatOnSave: boolean;
    formatOnPaste: boolean;
    trimTrailingWhitespace: boolean;
}

export interface SyntaxToken {
    scope: string;
    settings: {
        foreground?: string;
        fontStyle?: string;
    };
}

export interface SemanticToken {
    tokenType: string;
    tokenModifiers: string[];
    color: string;
}

export interface FileAssociation {
    pattern: string;
    languageId: string;
}

export interface LanguageIntelligenceState {
    languages: LanguageConfig[];
    fileAssociations: FileAssociation[];
    currentLanguage: string | null;
    semanticHighlighting: boolean;

    // Operations
    detectLanguage: (filename: string, content?: string) => string;
    getLanguageConfig: (languageId: string) => LanguageConfig | undefined;
    setCurrentLanguage: (languageId: string) => void;
    addFileAssociation: (association: FileAssociation) => void;
    removeFileAssociation: (pattern: string) => void;
    updateLanguageSettings: (languageId: string, settings: Partial<LanguageSettings>) => void;
    toggleSemanticHighlighting: () => void;
}

// =============================================================================
// DEFAULT LANGUAGES
// =============================================================================

const defaultSettings: LanguageSettings = {
    tabSize: 4,
    insertSpaces: true,
    wordWrap: 'off',
    autoClosingBrackets: 'languageDefined',
    autoClosingQuotes: 'languageDefined',
    formatOnSave: false,
    formatOnPaste: false,
    trimTrailingWhitespace: true,
};

const DEFAULT_LANGUAGES: LanguageConfig[] = [
    { id: 'javascript', name: 'JavaScript', extensions: ['.js', '.mjs', '.cjs'], aliases: ['js'], mimeTypes: ['text/javascript'], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'typescript', name: 'TypeScript', extensions: ['.ts', '.mts', '.cts'], aliases: ['ts'], mimeTypes: ['text/typescript'], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'javascriptreact', name: 'JavaScript React', extensions: ['.jsx'], aliases: ['jsx'], mimeTypes: ['text/jsx'], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'typescriptreact', name: 'TypeScript React', extensions: ['.tsx'], aliases: ['tsx'], mimeTypes: ['text/tsx'], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'python', name: 'Python', extensions: ['.py', '.pyw', '.pyi'], aliases: ['py'], mimeTypes: ['text/python'], configuration: defaultSettings },
    { id: 'rust', name: 'Rust', extensions: ['.rs'], aliases: ['rs'], mimeTypes: ['text/rust'], configuration: defaultSettings },
    { id: 'go', name: 'Go', extensions: ['.go'], aliases: ['golang'], mimeTypes: ['text/go'], configuration: { ...defaultSettings, insertSpaces: false } },
    { id: 'java', name: 'Java', extensions: ['.java'], aliases: [], mimeTypes: ['text/java'], configuration: defaultSettings },
    { id: 'csharp', name: 'C#', extensions: ['.cs'], aliases: ['cs'], mimeTypes: ['text/csharp'], configuration: defaultSettings },
    { id: 'cpp', name: 'C++', extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'], aliases: ['c++'], mimeTypes: ['text/cpp'], configuration: defaultSettings },
    { id: 'c', name: 'C', extensions: ['.c'], aliases: [], mimeTypes: ['text/c'], configuration: defaultSettings },
    { id: 'html', name: 'HTML', extensions: ['.html', '.htm'], aliases: [], mimeTypes: ['text/html'], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'css', name: 'CSS', extensions: ['.css'], aliases: [], mimeTypes: ['text/css'], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'scss', name: 'SCSS', extensions: ['.scss'], aliases: ['sass'], mimeTypes: ['text/scss'], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'json', name: 'JSON', extensions: ['.json', '.jsonc'], aliases: [], mimeTypes: ['application/json'], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'yaml', name: 'YAML', extensions: ['.yml', '.yaml'], aliases: [], mimeTypes: ['text/yaml'], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'markdown', name: 'Markdown', extensions: ['.md', '.markdown'], aliases: ['md'], mimeTypes: ['text/markdown'], configuration: { ...defaultSettings, wordWrap: 'on' } },
    { id: 'xml', name: 'XML', extensions: ['.xml', '.xsl', '.xslt'], aliases: [], mimeTypes: ['text/xml'], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'sql', name: 'SQL', extensions: ['.sql'], aliases: [], mimeTypes: ['text/sql'], configuration: defaultSettings },
    { id: 'shell', name: 'Shell Script', extensions: ['.sh', '.bash', '.zsh'], aliases: ['bash', 'zsh'], mimeTypes: ['text/shell'], configuration: defaultSettings },
    { id: 'dockerfile', name: 'Dockerfile', extensions: [], aliases: ['docker'], mimeTypes: [], configuration: defaultSettings },
    { id: 'toml', name: 'TOML', extensions: ['.toml'], aliases: [], mimeTypes: ['text/toml'], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'graphql', name: 'GraphQL', extensions: ['.graphql', '.gql'], aliases: ['gql'], mimeTypes: ['application/graphql'], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'prisma', name: 'Prisma', extensions: ['.prisma'], aliases: [], mimeTypes: [], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'vue', name: 'Vue', extensions: ['.vue'], aliases: [], mimeTypes: [], configuration: { ...defaultSettings, tabSize: 2 } },
    { id: 'svelte', name: 'Svelte', extensions: ['.svelte'], aliases: [], mimeTypes: [], configuration: { ...defaultSettings, tabSize: 2 } },
];

// =============================================================================
// STORE
// =============================================================================

export const useLanguageIntelligence = create<LanguageIntelligenceState>()(
    persist(
        (set, get) => ({
            languages: DEFAULT_LANGUAGES,
            fileAssociations: [],
            currentLanguage: null,
            semanticHighlighting: true,

            detectLanguage: (filename, content) => {
                const { languages, fileAssociations } = get();

                // Check file associations first
                for (const assoc of fileAssociations) {
                    if (new RegExp(assoc.pattern).test(filename)) {
                        return assoc.languageId;
                    }
                }

                // Check by extension
                const ext = '.' + filename.split('.').pop()?.toLowerCase();
                for (const lang of languages) {
                    if (lang.extensions.includes(ext)) return lang.id;
                }

                // Check special filenames
                const basename = filename.split('/').pop()?.toLowerCase() || '';
                if (basename === 'dockerfile') return 'dockerfile';
                if (basename === 'makefile') return 'makefile';
                if (basename.endsWith('.d.ts')) return 'typescript';

                // Check first line for shebang
                if (content) {
                    const firstLine = content.split('\n')[0];
                    if (firstLine.startsWith('#!/')) {
                        if (firstLine.includes('python')) return 'python';
                        if (firstLine.includes('node')) return 'javascript';
                        if (firstLine.includes('bash') || firstLine.includes('sh')) return 'shell';
                    }
                }

                return 'plaintext';
            },

            getLanguageConfig: (languageId) => {
                return get().languages.find(l => l.id === languageId);
            },

            setCurrentLanguage: (languageId) => set({ currentLanguage: languageId }),

            addFileAssociation: (association) => {
                set(state => ({
                    fileAssociations: [...state.fileAssociations.filter(a => a.pattern !== association.pattern), association],
                }));
            },

            removeFileAssociation: (pattern) => {
                set(state => ({
                    fileAssociations: state.fileAssociations.filter(a => a.pattern !== pattern),
                }));
            },

            updateLanguageSettings: (languageId, settings) => {
                set(state => ({
                    languages: state.languages.map(lang =>
                        lang.id === languageId
                            ? { ...lang, configuration: { ...lang.configuration, ...settings } }
                            : lang
                    ),
                }));
            },

            toggleSemanticHighlighting: () => set(state => ({ semanticHighlighting: !state.semanticHighlighting })),
        }),
        { name: 'sprintloop-language-intelligence' }
    )
);

// =============================================================================
// UTILITIES
// =============================================================================

export function getLanguageIcon(languageId: string): string {
    const icons: Record<string, string> = {
        javascript: '🟨', typescript: '🔷', python: '🐍', rust: '🦀', go: '🐹',
        java: '☕', csharp: '🟪', cpp: '🔵', html: '🌐', css: '🎨', json: '📋',
        markdown: '📝', sql: '🗄️', shell: '🔧', dockerfile: '🐳', vue: '💚', svelte: '🧡'
    };
    return icons[languageId] || '📄';
}
