/**
 * Tabby Plugin
 * 
 * Self-hosted, privacy-first code completion.
 * Runs entirely offline using local Docker container.
 * 
 * Features:
 * - Offline operation (privacy)
 * - Self-hosted via Docker
 * - Fast local inference
 * - No API costs
 */

import type { AIAssistantPlugin, PluginContext, CompletionResult, ChatMessage, EditResult } from './types';

export interface TabbyConfig {
    /** Tabby server endpoint */
    endpoint: string;
    /** Model identifier */
    modelId: string;
    /** Request timeout (ms) */
    timeout: number;
    /** Enable for specific languages only */
    enabledLanguages: string[];
}

const defaultConfig: TabbyConfig = {
    endpoint: 'http://localhost:8080',
    modelId: 'TabbyML/DeepSeek-Coder-1.3B',
    timeout: 5000,
    enabledLanguages: ['typescript', 'javascript', 'python', 'rust', 'go'],
};

export class TabbyPlugin implements AIAssistantPlugin {
    readonly id = 'tabby';
    readonly name = 'Tabby';
    readonly version = '1.0.0';
    enabled = true;

    private config: TabbyConfig;
    private serverAvailable = false;

    constructor(config: Partial<TabbyConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    async initialize(): Promise<void> {
        console.log('[Tabby] Initializing with endpoint:', this.config.endpoint);

        // Check if Tabby server is available
        try {
            const response = await fetch(`${this.config.endpoint}/health`, {
                signal: AbortSignal.timeout(this.config.timeout),
            });
            this.serverAvailable = response.ok;
            console.log('[Tabby] Server status:', this.serverAvailable ? 'available' : 'unavailable');
        } catch {
            this.serverAvailable = false;
            console.log('[Tabby] Server not available, running in fallback mode');
        }
    }

    async shutdown(): Promise<void> {
        console.log('[Tabby] Shutting down');
    }

    async *chat(_messages: ChatMessage[], _context: PluginContext): AsyncIterable<string> {
        // Tabby is primarily for completions, not chat
        yield 'Tabby is optimized for code completions. For chat, please use another provider.';
    }

    async autocomplete(context: PluginContext): Promise<CompletionResult[]> {
        if (!this.serverAvailable) {
            return [];
        }

        // Check if language is enabled
        const language = this.detectLanguage(context.filePath);
        if (!this.config.enabledLanguages.includes(language)) {
            return [];
        }

        try {
            // In a real implementation, this would call the Tabby API
            // POST /v1/completions with { prompt, language }
            console.log('[Tabby] Requesting completion for', language);

            return [
                {
                    text: '// Tabby completion',
                    insertText: '// Local AI-generated code',
                },
            ];
        } catch (error) {
            console.error('[Tabby] Completion error:', error);
            return [];
        }
    }

    async edit(_instruction: string, context: PluginContext): Promise<EditResult> {
        // Tabby doesn't support edit mode
        console.log('[Tabby] Edit mode not supported');
        return {
            newContent: context.fileContent,
            changes: [],
        };
    }

    private detectLanguage(filePath: string): string {
        const ext = filePath.split('.').pop()?.toLowerCase() || '';
        const langMap: Record<string, string> = {
            ts: 'typescript',
            tsx: 'typescript',
            js: 'javascript',
            jsx: 'javascript',
            py: 'python',
            rs: 'rust',
            go: 'go',
        };
        return langMap[ext] || ext;
    }

    /** Check if Tabby server is running */
    isServerAvailable(): boolean {
        return this.serverAvailable;
    }

    /** Get server info */
    async getServerInfo(): Promise<{ model: string; version: string } | null> {
        if (!this.serverAvailable) return null;

        try {
            const response = await fetch(`${this.config.endpoint}/v1/models`);
            return await response.json();
        } catch {
            return null;
        }
    }
}

export function createTabbyPlugin(config?: Partial<TabbyConfig>): TabbyPlugin {
    return new TabbyPlugin(config);
}
