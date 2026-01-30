/**
 * LSP Client
 * 
 * Language Server Protocol client for language features.
 * Connects via WebSocket to LSP servers (for desktop mode).
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export interface Diagnostic {
    filePath: string;
    range: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
    severity: DiagnosticSeverity;
    message: string;
    code?: string | number;
    source?: string;
    relatedInformation?: {
        location: { filePath: string; line: number; column: number };
        message: string;
    }[];
}

export interface CompletionItem {
    label: string;
    kind: CompletionItemKind;
    detail?: string;
    documentation?: string;
    insertText?: string;
    insertTextRules?: number;
}

export type CompletionItemKind =
    | 'text' | 'method' | 'function' | 'constructor' | 'field'
    | 'variable' | 'class' | 'interface' | 'module' | 'property'
    | 'unit' | 'value' | 'enum' | 'keyword' | 'snippet'
    | 'color' | 'file' | 'reference' | 'folder' | 'constant'
    | 'struct' | 'event' | 'operator' | 'typeParameter';

export interface Hover {
    contents: string | { language: string; value: string }[];
    range?: { startLine: number; startColumn: number; endLine: number; endColumn: number };
}

export interface Location {
    filePath: string;
    range: { startLine: number; startColumn: number; endLine: number; endColumn: number };
}

export interface LSPServerConfig {
    language: string;
    command: string;
    args?: string[];
}

export interface LSPState {
    servers: Map<string, LSPConnection>;
    diagnostics: Map<string, Diagnostic[]>;
    isConnecting: boolean;

    // Actions
    connect: (language: string, config: LSPServerConfig) => Promise<void>;
    disconnect: (language: string) => void;
    disconnectAll: () => void;

    // LSP features
    requestCompletion: (filePath: string, line: number, column: number) => Promise<CompletionItem[]>;
    requestHover: (filePath: string, line: number, column: number) => Promise<Hover | null>;
    requestDefinition: (filePath: string, line: number, column: number) => Promise<Location[]>;
    requestReferences: (filePath: string, line: number, column: number) => Promise<Location[]>;
    requestRename: (filePath: string, line: number, column: number, newName: string) => Promise<Map<string, { range: Location['range']; newText: string }[]>>;

    // Diagnostics
    getDiagnosticsForFile: (filePath: string) => Diagnostic[];
    getAllDiagnostics: () => Diagnostic[];
    clearDiagnostics: (filePath: string) => void;
    setDiagnostics: (filePath: string, diagnostics: Diagnostic[]) => void;
}

interface LSPConnection {
    language: string;
    status: 'connecting' | 'connected' | 'disconnected' | 'error';
    ws?: WebSocket;
    capabilities?: Record<string, boolean>;
    pendingRequests: Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }>;
    requestId: number;
}

// =============================================================================
// LSP STORE
// =============================================================================

export const useLSP = create<LSPState>((set, get) => ({
    servers: new Map(),
    diagnostics: new Map(),
    isConnecting: false,

    connect: async (language: string, config: LSPServerConfig) => {
        set({ isConnecting: true });

        const connection: LSPConnection = {
            language,
            status: 'connecting',
            pendingRequests: new Map(),
            requestId: 0,
        };

        try {
            // In desktop mode, spawn LSP server via Tauri
            // For now, we'll mock a WebSocket connection
            console.log(`[LSP] Connecting to ${language} server...`, config);

            // Simulate connection
            await new Promise(resolve => setTimeout(resolve, 500));

            connection.status = 'connected';
            connection.capabilities = {
                completionProvider: true,
                hoverProvider: true,
                definitionProvider: true,
                referencesProvider: true,
                renameProvider: true,
                documentFormattingProvider: true,
            };

            set(state => ({
                servers: new Map(state.servers).set(language, connection),
                isConnecting: false,
            }));

            console.log(`[LSP] Connected to ${language} server`);
        } catch (error) {
            connection.status = 'error';
            set(state => ({
                servers: new Map(state.servers).set(language, connection),
                isConnecting: false,
            }));
            console.error(`[LSP] Failed to connect:`, error);
        }
    },

    disconnect: (language: string) => {
        const connection = get().servers.get(language);
        if (connection?.ws) {
            connection.ws.close();
        }

        set(state => {
            const servers = new Map(state.servers);
            servers.delete(language);
            return { servers };
        });
    },

    disconnectAll: () => {
        for (const connection of get().servers.values()) {
            if (connection.ws) {
                connection.ws.close();
            }
        }
        set({ servers: new Map() });
    },

    requestCompletion: async (_filePath, _line, _column): Promise<CompletionItem[]> => {
        // Mock completion items for now
        return [
            { label: 'console', kind: 'module', detail: 'Console API' },
            { label: 'log', kind: 'method', detail: '(message: any) => void' },
            { label: 'error', kind: 'method', detail: '(message: any) => void' },
            { label: 'useState', kind: 'function', detail: 'React Hook' },
            { label: 'useEffect', kind: 'function', detail: 'React Hook' },
        ];
    },

    requestHover: async (_filePath, _line, _column): Promise<Hover | null> => {
        // Mock hover for now
        return {
            contents: [
                { language: 'typescript', value: 'function log(message: any): void' },
            ],
        };
    },

    requestDefinition: async (_filePath, _line, _column): Promise<Location[]> => {
        // Mock definition
        return [];
    },

    requestReferences: async (_filePath, _line, _column): Promise<Location[]> => {
        // Mock references
        return [];
    },

    requestRename: async (_filePath, _line, _column, _newName): Promise<Map<string, { range: Location['range']; newText: string }[]>> => {
        // Mock rename
        return new Map();
    },

    getDiagnosticsForFile: (filePath) => {
        return get().diagnostics.get(filePath) || [];
    },

    getAllDiagnostics: () => {
        return Array.from(get().diagnostics.values()).flat();
    },

    clearDiagnostics: (filePath) => {
        set(state => {
            const diagnostics = new Map(state.diagnostics);
            diagnostics.delete(filePath);
            return { diagnostics };
        });
    },

    setDiagnostics: (filePath, newDiagnostics) => {
        set(state => ({
            diagnostics: new Map(state.diagnostics).set(filePath, newDiagnostics),
        }));
    },
}));

// =============================================================================
// DIAGNOSTIC HELPERS
// =============================================================================

export function getDiagnosticCounts(): Record<DiagnosticSeverity, number> {
    const diagnostics = useLSP.getState().getAllDiagnostics();
    return {
        error: diagnostics.filter(d => d.severity === 'error').length,
        warning: diagnostics.filter(d => d.severity === 'warning').length,
        info: diagnostics.filter(d => d.severity === 'info').length,
        hint: diagnostics.filter(d => d.severity === 'hint').length,
    };
}

export function groupDiagnosticsByFile(): Map<string, Diagnostic[]> {
    return useLSP.getState().diagnostics;
}

export function getSeverityIcon(severity: DiagnosticSeverity): string {
    switch (severity) {
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        case 'hint': return '💡';
    }
}

export function getCompletionKindIcon(kind: CompletionItemKind): string {
    const icons: Record<CompletionItemKind, string> = {
        text: '📝',
        method: '🔵',
        function: '🟣',
        constructor: '🔶',
        field: '🔷',
        variable: '📦',
        class: '🔶',
        interface: '🔷',
        module: '📦',
        property: '🔹',
        unit: '📏',
        value: '💎',
        enum: '📋',
        keyword: '🔑',
        snippet: '✂️',
        color: '🎨',
        file: '📄',
        reference: '🔗',
        folder: '📁',
        constant: '🔒',
        struct: '🏗️',
        event: '⚡',
        operator: '➕',
        typeParameter: '🔠',
    };
    return icons[kind] || '📄';
}
