/**
 * Snippets Service
 * 
 * Code snippets and templates with variable substitution.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface SnippetVariable {
    name: string;
    default?: string;
    transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'camelCase' | 'pascalCase' | 'snakeCase';
}

export interface Snippet {
    id: string;
    prefix: string;          // Trigger prefix (e.g., 'rfc' for React Functional Component)
    name: string;
    description: string;
    body: string[];          // Lines of snippet body
    language: string[];      // Language scopes
    variables?: SnippetVariable[];
    isBuiltIn: boolean;
    scope?: 'global' | 'workspace' | 'project';
}

export interface SnippetsState {
    snippets: Snippet[];
    recentlyUsed: string[];

    // Snippet operations
    addSnippet: (snippet: Omit<Snippet, 'id' | 'isBuiltIn'>) => void;
    updateSnippet: (id: string, updates: Partial<Snippet>) => void;
    deleteSnippet: (id: string) => void;

    // Search and filter
    searchSnippets: (query: string, language?: string) => Snippet[];
    getSnippetsByLanguage: (language: string) => Snippet[];
    getSnippetByPrefix: (prefix: string, language: string) => Snippet | undefined;

    // Usage tracking
    markAsUsed: (snippetId: string) => void;
    getRecentSnippets: (limit?: number) => Snippet[];

    // Expansion
    expandSnippet: (snippetId: string, variables?: Record<string, string>) => string;
}

// =============================================================================
// BUILT-IN SNIPPETS
// =============================================================================

const BUILT_IN_SNIPPETS: Snippet[] = [
    // React snippets
    {
        id: 'react-fc',
        prefix: 'rfc',
        name: 'React Functional Component',
        description: 'Create a React functional component with TypeScript',
        body: [
            "import React from 'react';",
            '',
            'interface ${1:ComponentName}Props {',
            '    ${2:// props}',
            '}',
            '',
            'export function ${1:ComponentName}({ ${3} }: ${1:ComponentName}Props) {',
            '    return (',
            '        <div>',
            '            ${4:// content}',
            '        </div>',
            '    );',
            '}',
        ],
        language: ['typescriptreact', 'javascriptreact'],
        isBuiltIn: true,
    },
    {
        id: 'react-hook',
        prefix: 'hook',
        name: 'React Custom Hook',
        description: 'Create a custom React hook',
        body: [
            "import { useState, useEffect } from 'react';",
            '',
            'export function use${1:HookName}(${2:params}) {',
            '    const [${3:state}, set${3:State}] = useState(${4:initialValue});',
            '',
            '    useEffect(() => {',
            '        ${5:// effect}',
            '    }, []);',
            '',
            '    return { ${3:state} };',
            '}',
        ],
        language: ['typescriptreact', 'typescript', 'javascriptreact', 'javascript'],
        isBuiltIn: true,
    },
    {
        id: 'react-usestate',
        prefix: 'uss',
        name: 'useState Hook',
        description: 'React useState hook',
        body: ['const [${1:state}, set${1:State}] = useState(${2:initialValue});'],
        language: ['typescriptreact', 'javascriptreact', 'typescript', 'javascript'],
        isBuiltIn: true,
    },
    {
        id: 'react-useeffect',
        prefix: 'use',
        name: 'useEffect Hook',
        description: 'React useEffect hook',
        body: [
            'useEffect(() => {',
            '    ${1:// effect}',
            '    return () => {',
            '        ${2:// cleanup}',
            '    };',
            '}, [${3:dependencies}]);',
        ],
        language: ['typescriptreact', 'javascriptreact', 'typescript', 'javascript'],
        isBuiltIn: true,
    },

    // TypeScript snippets
    {
        id: 'ts-interface',
        prefix: 'int',
        name: 'TypeScript Interface',
        description: 'Create a TypeScript interface',
        body: [
            'interface ${1:InterfaceName} {',
            '    ${2:property}: ${3:type};',
            '}',
        ],
        language: ['typescript', 'typescriptreact'],
        isBuiltIn: true,
    },
    {
        id: 'ts-type',
        prefix: 'type',
        name: 'TypeScript Type Alias',
        description: 'Create a TypeScript type',
        body: ['type ${1:TypeName} = ${2:type};'],
        language: ['typescript', 'typescriptreact'],
        isBuiltIn: true,
    },
    {
        id: 'ts-async',
        prefix: 'afn',
        name: 'Async Function',
        description: 'Create an async function',
        body: [
            'async function ${1:functionName}(${2:params}): Promise<${3:ReturnType}> {',
            '    ${4:// body}',
            '}',
        ],
        language: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
        isBuiltIn: true,
    },
    {
        id: 'ts-tryCatch',
        prefix: 'try',
        name: 'Try-Catch Block',
        description: 'Try-catch with error handling',
        body: [
            'try {',
            '    ${1:// code}',
            '} catch (error) {',
            '    console.error(error);',
            '    ${2:// handle error}',
            '}',
        ],
        language: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
        isBuiltIn: true,
    },

    // Console snippets
    {
        id: 'console-log',
        prefix: 'cl',
        name: 'Console Log',
        description: 'console.log statement',
        body: ["console.log('${1:message}', ${2:value});"],
        language: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
        isBuiltIn: true,
    },
    {
        id: 'console-error',
        prefix: 'ce',
        name: 'Console Error',
        description: 'console.error statement',
        body: ["console.error('${1:error}:', ${2:error});"],
        language: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
        isBuiltIn: true,
    },

    // Import/Export
    {
        id: 'import',
        prefix: 'imp',
        name: 'Import Statement',
        description: 'Import a module',
        body: ["import { ${2:module} } from '${1:package}';"],
        language: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
        isBuiltIn: true,
    },
    {
        id: 'import-default',
        prefix: 'impd',
        name: 'Import Default',
        description: 'Import default export',
        body: ["import ${2:module} from '${1:package}';"],
        language: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
        isBuiltIn: true,
    },
    {
        id: 'export-default',
        prefix: 'expd',
        name: 'Export Default',
        description: 'Export default',
        body: ['export default ${1:module};'],
        language: ['typescript', 'typescriptreact', 'javascript', 'javascriptreact'],
        isBuiltIn: true,
    },

    // Zustand
    {
        id: 'zustand-store',
        prefix: 'zstore',
        name: 'Zustand Store',
        description: 'Create a Zustand store',
        body: [
            "import { create } from 'zustand';",
            '',
            'interface ${1:StoreName}State {',
            '    ${2:property}: ${3:type};',
            '    ${4:action}: (${5:params}) => void;',
            '}',
            '',
            'export const use${1:StoreName}Store = create<${1:StoreName}State>((set, get) => ({',
            '    ${2:property}: ${6:initialValue},',
            '    ${4:action}: (${5:params}) => {',
            '        set({ ${7:updates} });',
            '    },',
            '}));',
        ],
        language: ['typescript', 'typescriptreact'],
        isBuiltIn: true,
    },
];

// =============================================================================
// SNIPPETS STORE
// =============================================================================

export const useSnippetsService = create<SnippetsState>()(
    persist(
        (set, get) => ({
            snippets: BUILT_IN_SNIPPETS,
            recentlyUsed: [],

            addSnippet: (snippet) => {
                const newSnippet: Snippet = {
                    ...snippet,
                    id: `custom_${Date.now()}`,
                    isBuiltIn: false,
                };
                set(state => ({
                    snippets: [...state.snippets, newSnippet],
                }));
            },

            updateSnippet: (id, updates) => {
                set(state => ({
                    snippets: state.snippets.map(s =>
                        s.id === id && !s.isBuiltIn ? { ...s, ...updates } : s
                    ),
                }));
            },

            deleteSnippet: (id) => {
                set(state => ({
                    snippets: state.snippets.filter(s => s.id !== id || s.isBuiltIn),
                }));
            },

            searchSnippets: (query, language) => {
                const lowerQuery = query.toLowerCase();
                return get().snippets.filter(s => {
                    const matchesQuery =
                        s.prefix.toLowerCase().includes(lowerQuery) ||
                        s.name.toLowerCase().includes(lowerQuery) ||
                        s.description.toLowerCase().includes(lowerQuery);
                    const matchesLanguage = !language || s.language.includes(language);
                    return matchesQuery && matchesLanguage;
                });
            },

            getSnippetsByLanguage: (language) => {
                return get().snippets.filter(s => s.language.includes(language));
            },

            getSnippetByPrefix: (prefix, language) => {
                return get().snippets.find(
                    s => s.prefix === prefix && s.language.includes(language)
                );
            },

            markAsUsed: (snippetId) => {
                set(state => ({
                    recentlyUsed: [
                        snippetId,
                        ...state.recentlyUsed.filter(id => id !== snippetId),
                    ].slice(0, 20),
                }));
            },

            getRecentSnippets: (limit = 5) => {
                const { snippets, recentlyUsed } = get();
                return recentlyUsed
                    .slice(0, limit)
                    .map(id => snippets.find(s => s.id === id))
                    .filter((s): s is Snippet => s !== undefined);
            },

            expandSnippet: (snippetId, variables = {}) => {
                const snippet = get().snippets.find(s => s.id === snippetId);
                if (!snippet) return '';

                let body = snippet.body.join('\n');

                // Replace variables
                Object.entries(variables).forEach(([key, value]) => {
                    body = body.replace(new RegExp(`\\$\\{\\d+:${key}\\}`, 'g'), value);
                    body = body.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
                });

                // Replace unfilled tab stops with empty string
                body = body.replace(/\$\{\d+:[^}]*\}/g, '');
                body = body.replace(/\$\{\d+\}/g, '');
                body = body.replace(/\$\d+/g, '');

                get().markAsUsed(snippetId);
                return body;
            },
        }),
        {
            name: 'sprintloop-snippets',
            partialize: (state) => ({
                snippets: state.snippets.filter(s => !s.isBuiltIn),
                recentlyUsed: state.recentlyUsed,
            }),
        }
    )
);
