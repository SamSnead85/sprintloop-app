/**
 * Snippets Service
 * 
 * Manages code snippets with language-specific templates.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface Snippet {
    id: string;
    name: string;
    prefix: string;
    description?: string;
    body: string[];
    scope: string[];  // languages
    source: 'builtin' | 'user' | 'extension';
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SnippetsState {
    snippets: Snippet[];
    searchQuery: string;
    selectedScope: string | null;
    selectedSnippetId: string | null;

    // CRUD
    addSnippet: (snippet: Omit<Snippet, 'id' | 'source' | 'createdAt' | 'updatedAt'>) => string;
    updateSnippet: (id: string, updates: Partial<Snippet>) => void;
    deleteSnippet: (id: string) => void;
    duplicateSnippet: (id: string) => string;

    // Search/Filter
    setSearchQuery: (query: string) => void;
    setSelectedScope: (scope: string | null) => void;
    getFilteredSnippets: () => Snippet[];

    // Selection
    selectSnippet: (id: string | null) => void;
    getSelectedSnippet: () => Snippet | undefined;

    // Insertion
    getSnippetBody: (id: string) => string;
    findSnippetsByPrefix: (prefix: string, language: string) => Snippet[];
}

// =============================================================================
// DEFAULT SNIPPETS
// =============================================================================

const DEFAULT_SNIPPETS: Snippet[] = [
    // JavaScript/TypeScript
    { id: 'log', name: 'Console Log', prefix: 'log', body: ['console.log($1);'], scope: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'], source: 'builtin', description: 'Log output to console' },
    { id: 'fn', name: 'Function', prefix: 'fn', body: ['function ${1:name}(${2:params}) {', '\t$0', '}'], scope: ['javascript', 'typescript'], source: 'builtin', description: 'Function declaration' },
    { id: 'afn', name: 'Arrow Function', prefix: 'afn', body: ['const ${1:name} = (${2:params}) => {', '\t$0', '};'], scope: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'], source: 'builtin', description: 'Arrow function' },
    { id: 'iife', name: 'IIFE', prefix: 'iife', body: ['(function() {', '\t$0', '})();'], scope: ['javascript', 'typescript'], source: 'builtin', description: 'Immediately invoked function expression' },
    { id: 'imp', name: 'Import', prefix: 'imp', body: ["import { $1 } from '${2:module}';"], scope: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'], source: 'builtin', description: 'Import statement' },
    { id: 'exp', name: 'Export', prefix: 'exp', body: ['export { $1 };'], scope: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'], source: 'builtin', description: 'Export statement' },
    { id: 'exd', name: 'Export Default', prefix: 'exd', body: ['export default $1;'], scope: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'], source: 'builtin', description: 'Export default' },
    { id: 'trycatch', name: 'Try Catch', prefix: 'try', body: ['try {', '\t$1', '} catch (error) {', '\t$2', '}'], scope: ['javascript', 'typescript'], source: 'builtin', description: 'Try-catch block' },
    { id: 'promise', name: 'Promise', prefix: 'prom', body: ['new Promise((resolve, reject) => {', '\t$0', '});'], scope: ['javascript', 'typescript'], source: 'builtin', description: 'Promise constructor' },

    // React
    { id: 'rfc', name: 'React Function Component', prefix: 'rfc', body: ['export function ${1:Component}() {', '\treturn (', '\t\t<div>$0</div>', '\t);', '}'], scope: ['javascriptreact', 'typescriptreact'], source: 'builtin', description: 'React functional component' },
    { id: 'useState', name: 'useState Hook', prefix: 'us', body: ['const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initial});'], scope: ['javascriptreact', 'typescriptreact'], source: 'builtin', description: 'useState hook' },
    { id: 'useEffect', name: 'useEffect Hook', prefix: 'ue', body: ['useEffect(() => {', '\t$0', '}, [${1:deps}]);'], scope: ['javascriptreact', 'typescriptreact'], source: 'builtin', description: 'useEffect hook' },
    { id: 'useMemo', name: 'useMemo Hook', prefix: 'um', body: ['const ${1:memo} = useMemo(() => {', '\treturn $0;', '}, [${2:deps}]);'], scope: ['javascriptreact', 'typescriptreact'], source: 'builtin', description: 'useMemo hook' },
    { id: 'useCallback', name: 'useCallback Hook', prefix: 'uc', body: ['const ${1:callback} = useCallback(() => {', '\t$0', '}, [${2:deps}]);'], scope: ['javascriptreact', 'typescriptreact'], source: 'builtin', description: 'useCallback hook' },

    // TypeScript
    { id: 'interface', name: 'Interface', prefix: 'int', body: ['interface ${1:Name} {', '\t$0', '}'], scope: ['typescript', 'typescriptreact'], source: 'builtin', description: 'Interface declaration' },
    { id: 'type', name: 'Type Alias', prefix: 'type', body: ['type ${1:Name} = $0;'], scope: ['typescript', 'typescriptreact'], source: 'builtin', description: 'Type alias' },
    { id: 'enum', name: 'Enum', prefix: 'enum', body: ['enum ${1:Name} {', '\t$0', '}'], scope: ['typescript', 'typescriptreact'], source: 'builtin', description: 'Enum declaration' },

    // Python
    { id: 'pydef', name: 'Python Function', prefix: 'def', body: ['def ${1:name}(${2:params}):', '\t"""${3:docstring}"""', '\t$0'], scope: ['python'], source: 'builtin', description: 'Python function' },
    { id: 'pyclass', name: 'Python Class', prefix: 'class', body: ['class ${1:Name}:', '\t"""${2:docstring}"""', '\t', '\tdef __init__(self${3:, params}):', '\t\t$0'], scope: ['python'], source: 'builtin', description: 'Python class' },
    { id: 'pymain', name: 'Python Main', prefix: 'main', body: ["if __name__ == '__main__':", '\t$0'], scope: ['python'], source: 'builtin', description: 'Python main block' },

    // HTML
    { id: 'html5', name: 'HTML5 Boilerplate', prefix: 'html5', body: ['<!DOCTYPE html>', '<html lang="${1:en}">', '<head>', '\t<meta charset="UTF-8">', '\t<meta name="viewport" content="width=device-width, initial-scale=1.0">', '\t<title>${2:Document}</title>', '</head>', '<body>', '\t$0', '</body>', '</html>'], scope: ['html'], source: 'builtin', description: 'HTML5 boilerplate' },
    { id: 'div', name: 'Div', prefix: 'div', body: ['<div class="${1:class}">', '\t$0', '</div>'], scope: ['html', 'javascriptreact', 'typescriptreact'], source: 'builtin', description: 'Div element' },

    // CSS
    { id: 'flex', name: 'Flexbox', prefix: 'flex', body: ['display: flex;', 'justify-content: ${1:center};', 'align-items: ${2:center};'], scope: ['css', 'scss'], source: 'builtin', description: 'Flexbox layout' },
    { id: 'grid', name: 'CSS Grid', prefix: 'grid', body: ['display: grid;', 'grid-template-columns: ${1:1fr 1fr};', 'gap: ${2:1rem};'], scope: ['css', 'scss'], source: 'builtin', description: 'CSS Grid layout' },
];

// =============================================================================
// SNIPPETS STORE
// =============================================================================

export const useSnippetsService = create<SnippetsState>()(
    persist(
        (set, get) => ({
            snippets: DEFAULT_SNIPPETS,
            searchQuery: '',
            selectedScope: null,
            selectedSnippetId: null,

            addSnippet: (snippet) => {
                const id = `snippet_${Date.now()}`;
                const newSnippet: Snippet = {
                    ...snippet,
                    id,
                    source: 'user',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                set(state => ({ snippets: [...state.snippets, newSnippet] }));
                return id;
            },

            updateSnippet: (id, updates) => {
                set(state => ({
                    snippets: state.snippets.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s),
                }));
            },

            deleteSnippet: (id) => {
                set(state => ({
                    snippets: state.snippets.filter(s => s.id !== id),
                    selectedSnippetId: state.selectedSnippetId === id ? null : state.selectedSnippetId,
                }));
            },

            duplicateSnippet: (id) => {
                const original = get().snippets.find(s => s.id === id);
                if (!original) return '';
                return get().addSnippet({ ...original, name: `${original.name} (Copy)`, prefix: `${original.prefix}copy` });
            },

            setSearchQuery: (query) => set({ searchQuery: query }),
            setSelectedScope: (scope) => set({ selectedScope: scope }),

            getFilteredSnippets: () => {
                const { snippets, searchQuery, selectedScope } = get();
                let filtered = snippets;
                if (selectedScope) {
                    filtered = filtered.filter(s => s.scope.includes(selectedScope));
                }
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    filtered = filtered.filter(s => s.name.toLowerCase().includes(query) || s.prefix.toLowerCase().includes(query) || s.description?.toLowerCase().includes(query));
                }
                return filtered;
            },

            selectSnippet: (id) => set({ selectedSnippetId: id }),
            getSelectedSnippet: () => get().snippets.find(s => s.id === get().selectedSnippetId),

            getSnippetBody: (id) => {
                const snippet = get().snippets.find(s => s.id === id);
                return snippet ? snippet.body.join('\n') : '';
            },

            findSnippetsByPrefix: (prefix, language) => {
                return get().snippets.filter(s => s.prefix.startsWith(prefix) && s.scope.includes(language));
            },
        }),
        { name: 'sprintloop-snippets', partialize: (state) => ({ snippets: state.snippets.filter(s => s.source === 'user') }) }
    )
);

// =============================================================================
// UTILITIES
// =============================================================================

export const LANGUAGE_LABELS: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    javascriptreact: 'JSX',
    typescriptreact: 'TSX',
    python: 'Python',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    json: 'JSON',
    markdown: 'Markdown',
};

export function expandSnippet(body: string[], tabStops: Record<number, string> = {}): string {
    let result = body.join('\n');
    // Replace tab stops
    for (const [num, value] of Object.entries(tabStops)) {
        result = result.replace(new RegExp(`\\$${num}`, 'g'), value);
    }
    // Clean remaining tab stops
    result = result.replace(/\$\d+/g, '');
    result = result.replace(/\$\{(\d+):([^}]+)\}/g, '$2');
    return result;
}
