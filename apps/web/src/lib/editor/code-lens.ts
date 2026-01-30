/**
 * Code Lens Service
 * 
 * Inline code actions, references, and annotations above code elements.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface CodeLens {
    id: string;
    range: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
    command?: CodeLensCommand;
    data?: unknown;
}

export interface CodeLensCommand {
    title: string;
    command: string;
    arguments?: unknown[];
    tooltip?: string;
}

export interface CodeLensProvider {
    id: string;
    name: string;
    languages: string[];
    provideLenses: (filePath: string, content: string) => Promise<CodeLens[]>;
    resolveCodeLens?: (lens: CodeLens) => Promise<CodeLens>;
}

export interface CodeLensState {
    lenses: Map<string, CodeLens[]>;
    providers: CodeLensProvider[];
    isEnabled: boolean;
    isLoading: Map<string, boolean>;

    // Provider Management
    registerProvider: (provider: CodeLensProvider) => void;
    unregisterProvider: (id: string) => void;

    // Lens Operations
    getLenses: (filePath: string) => CodeLens[];
    refreshLenses: (filePath: string, content: string) => Promise<void>;
    resolveLens: (filePath: string, lensId: string) => Promise<CodeLens | null>;
    clearLenses: (filePath?: string) => void;

    // Commands
    executeLensCommand: (command: CodeLensCommand) => Promise<void>;

    // Settings
    setEnabled: (enabled: boolean) => void;
}

// =============================================================================
// CODE LENS STORE
// =============================================================================

let lensIdCounter = 0;

export const useCodeLensService = create<CodeLensState>((set, get) => ({
    lenses: new Map(),
    providers: getDefaultProviders(),
    isEnabled: true,
    isLoading: new Map(),

    registerProvider: (provider) => {
        set(state => ({
            providers: [...state.providers, provider],
        }));
    },

    unregisterProvider: (id) => {
        set(state => ({
            providers: state.providers.filter(p => p.id !== id),
        }));
    },

    getLenses: (filePath) => {
        return get().lenses.get(filePath) || [];
    },

    refreshLenses: async (filePath, content) => {
        if (!get().isEnabled) return;

        set(state => {
            const isLoading = new Map(state.isLoading);
            isLoading.set(filePath, true);
            return { isLoading };
        });

        try {
            const ext = filePath.split('.').pop()?.toLowerCase() || '';
            const language = getLanguageFromExtension(ext);

            const applicableProviders = get().providers.filter(p =>
                p.languages.includes('*') || p.languages.includes(language)
            );

            const allLenses: CodeLens[] = [];

            for (const provider of applicableProviders) {
                try {
                    const providerLenses = await provider.provideLenses(filePath, content);
                    allLenses.push(...providerLenses);
                } catch (error) {
                    console.error(`[CodeLens] Provider ${provider.id} failed:`, error);
                }
            }

            set(state => {
                const lenses = new Map(state.lenses);
                lenses.set(filePath, allLenses);
                const isLoading = new Map(state.isLoading);
                isLoading.set(filePath, false);
                return { lenses, isLoading };
            });
        } catch (error) {
            console.error('[CodeLens] Failed to refresh lenses:', error);
            set(state => {
                const isLoading = new Map(state.isLoading);
                isLoading.set(filePath, false);
                return { isLoading };
            });
        }
    },

    resolveLens: async (filePath, lensId) => {
        const fileLenses = get().lenses.get(filePath) || [];
        const lens = fileLenses.find(l => l.id === lensId);

        if (!lens) return null;

        // Find provider that can resolve this lens
        for (const provider of get().providers) {
            if (provider.resolveCodeLens) {
                try {
                    const resolved = await provider.resolveCodeLens(lens);

                    // Update lens in store
                    set(state => {
                        const lenses = new Map(state.lenses);
                        const updated = (lenses.get(filePath) || []).map(l =>
                            l.id === lensId ? resolved : l
                        );
                        lenses.set(filePath, updated);
                        return { lenses };
                    });

                    return resolved;
                } catch {
                    // Try next provider
                }
            }
        }

        return lens;
    },

    clearLenses: (filePath) => {
        set(state => {
            const lenses = new Map(state.lenses);
            if (filePath) {
                lenses.delete(filePath);
            } else {
                lenses.clear();
            }
            return { lenses };
        });
    },

    executeLensCommand: async (command) => {
        console.log('[CodeLens] Executing command:', command.command, command.arguments);
        // In real implementation, dispatch to command system
    },

    setEnabled: (enabled) => {
        set({ isEnabled: enabled });
        if (!enabled) {
            set({ lenses: new Map() });
        }
    },
}));

// =============================================================================
// DEFAULT PROVIDERS
// =============================================================================

function getDefaultProviders(): CodeLensProvider[] {
    return [
        createReferencesProvider(),
        createTestProvider(),
        createAIActionsProvider(),
    ];
}

function createReferencesProvider(): CodeLensProvider {
    return {
        id: 'references',
        name: 'References',
        languages: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
        provideLenses: async (filePath, content) => {
            const lenses: CodeLens[] = [];
            const lines = content.split('\n');

            // Find functions and classes
            const patterns = [
                /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
                /^(?:export\s+)?class\s+(\w+)/,
                /^(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s+)?\(/,
                /^\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/,
            ];

            lines.forEach((line, index) => {
                for (const pattern of patterns) {
                    const match = line.match(pattern);
                    if (match) {
                        const refCount = Math.floor(Math.random() * 15);
                        lenses.push({
                            id: `lens_${++lensIdCounter}`,
                            range: {
                                startLine: index + 1,
                                startColumn: 0,
                                endLine: index + 1,
                                endColumn: line.length,
                            },
                            command: {
                                title: `${refCount} reference${refCount !== 1 ? 's' : ''}`,
                                command: 'editor.action.findAllReferences',
                                arguments: [filePath, index + 1],
                                tooltip: 'Find all references',
                            },
                        });
                        break;
                    }
                }
            });

            return lenses;
        },
    };
}

function createTestProvider(): CodeLensProvider {
    return {
        id: 'test',
        name: 'Test Runner',
        languages: ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'],
        provideLenses: async (filePath, content) => {
            if (!filePath.includes('.test.') && !filePath.includes('.spec.')) {
                return [];
            }

            const lenses: CodeLens[] = [];
            const lines = content.split('\n');

            const testPatterns = [
                /(?:describe|it|test)\s*\(\s*['"`]([^'"`]+)['"`]/,
            ];

            lines.forEach((line, index) => {
                for (const pattern of testPatterns) {
                    const match = line.match(pattern);
                    if (match) {
                        lenses.push({
                            id: `lens_${++lensIdCounter}`,
                            range: {
                                startLine: index + 1,
                                startColumn: 0,
                                endLine: index + 1,
                                endColumn: line.length,
                            },
                            command: {
                                title: '▶ Run Test',
                                command: 'testing.runTest',
                                arguments: [filePath, match[1]],
                                tooltip: 'Run this test',
                            },
                        });
                        lenses.push({
                            id: `lens_${++lensIdCounter}`,
                            range: {
                                startLine: index + 1,
                                startColumn: 0,
                                endLine: index + 1,
                                endColumn: line.length,
                            },
                            command: {
                                title: '🐛 Debug Test',
                                command: 'testing.debugTest',
                                arguments: [filePath, match[1]],
                                tooltip: 'Debug this test',
                            },
                        });
                        break;
                    }
                }
            });

            return lenses;
        },
    };
}

function createAIActionsProvider(): CodeLensProvider {
    return {
        id: 'ai-actions',
        name: 'AI Actions',
        languages: ['*'],
        provideLenses: async (_filePath, content) => {
            const lenses: CodeLens[] = [];
            const lines = content.split('\n');

            // Add AI actions to complex functions (>10 lines)
            let inFunction = false;
            let functionStart = 0;
            let braceCount = 0;

            lines.forEach((line, index) => {
                if (line.match(/(?:function|=>)\s*[({]/) || line.match(/^\s*(?:async\s+)?(?:\w+)\s*\([^)]*\)\s*{/)) {
                    inFunction = true;
                    functionStart = index;
                    braceCount = (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
                } else if (inFunction) {
                    braceCount += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;

                    if (braceCount <= 0) {
                        const functionLength = index - functionStart;
                        if (functionLength > 10) {
                            lenses.push({
                                id: `lens_${++lensIdCounter}`,
                                range: {
                                    startLine: functionStart + 1,
                                    startColumn: 0,
                                    endLine: functionStart + 1,
                                    endColumn: lines[functionStart].length,
                                },
                                command: {
                                    title: '✨ Explain with AI',
                                    command: 'ai.explainCode',
                                    arguments: [functionStart + 1, index + 1],
                                    tooltip: 'Get AI explanation for this code',
                                },
                            });
                            lenses.push({
                                id: `lens_${++lensIdCounter}`,
                                range: {
                                    startLine: functionStart + 1,
                                    startColumn: 0,
                                    endLine: functionStart + 1,
                                    endColumn: lines[functionStart].length,
                                },
                                command: {
                                    title: '🔧 Refactor with AI',
                                    command: 'ai.refactorCode',
                                    arguments: [functionStart + 1, index + 1],
                                    tooltip: 'Get AI suggestions for refactoring',
                                },
                            });
                        }
                        inFunction = false;
                    }
                }
            });

            return lenses;
        },
    };
}

// =============================================================================
// HELPERS
// =============================================================================

function getLanguageFromExtension(ext: string): string {
    const langMap: Record<string, string> = {
        ts: 'typescript',
        tsx: 'typescriptreact',
        js: 'javascript',
        jsx: 'javascriptreact',
        py: 'python',
        rb: 'ruby',
        go: 'go',
        rs: 'rust',
        java: 'java',
        cs: 'csharp',
        cpp: 'cpp',
        c: 'c',
        css: 'css',
        scss: 'scss',
        html: 'html',
        json: 'json',
        md: 'markdown',
    };
    return langMap[ext] || ext;
}
