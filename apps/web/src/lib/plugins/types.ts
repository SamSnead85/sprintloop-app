/**
 * SprintLoop Plugin System
 * 
 * Unified interface for integrating open-source AI coding assistants:
 * - Continue: VS Code-style AI assistant
 * - Cline/Roo: Autonomous Plan/Act coding agent
 * - OpenHands: Full software development agent
 * - Tabby: Self-hosted local-first completion
 */

export interface PluginContext {
    /** Current file content */
    fileContent: string;
    /** Current file path */
    filePath: string;
    /** Cursor position */
    cursorPosition: { line: number; column: number };
    /** Selected text (if any) */
    selection?: string;
    /** Project root directory */
    projectRoot: string;
    /** Recent file history */
    recentFiles: string[];
}

export interface CompletionResult {
    text: string;
    insertText: string;
    range?: { start: number; end: number };
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface EditResult {
    newContent: string;
    changes: Array<{
        range: { start: number; end: number };
        text: string;
    }>;
}

export interface Plugin {
    /** Unique plugin identifier */
    id: string;
    /** Display name */
    name: string;
    /** Plugin version */
    version: string;
    /** Whether the plugin is enabled */
    enabled: boolean;
    /** Initialize the plugin */
    initialize: () => Promise<void>;
    /** Shutdown the plugin */
    shutdown: () => Promise<void>;
}

export interface AIAssistantPlugin extends Plugin {
    /** Chat with context awareness */
    chat: (messages: ChatMessage[], context: PluginContext) => AsyncIterable<string>;
    /** Get inline completions */
    autocomplete: (context: PluginContext) => Promise<CompletionResult[]>;
    /** Apply an edit based on instruction */
    edit: (instruction: string, context: PluginContext) => Promise<EditResult>;
}

export interface AgentPlugin extends Plugin {
    /** Agent operation mode */
    mode: 'plan' | 'act' | 'autonomous';
    /** Plan a task */
    plan: (task: string, context: PluginContext) => Promise<Plan>;
    /** Execute a plan */
    execute: (plan: Plan, context: PluginContext) => Promise<ExecutionResult>;
    /** Available capabilities */
    capabilities: AgentCapabilities;
}

export interface Plan {
    id: string;
    steps: PlanStep[];
    estimatedDuration: number;
    riskLevel: 'low' | 'medium' | 'high';
}

export interface PlanStep {
    id: string;
    description: string;
    action: string;
    target?: string;
    requiresApproval: boolean;
}

export interface ExecutionResult {
    success: boolean;
    output: string;
    filesModified: string[];
    errors?: string[];
}

export interface AgentCapabilities {
    canReadFiles: boolean;
    canWriteFiles: boolean;
    canExecuteTerminal: boolean;
    canBrowseWeb: boolean;
    canCallAPIs: boolean;
    canCreateProjects: boolean;
}

/** Plugin registry for managing all plugins */
export class PluginRegistry {
    private plugins: Map<string, Plugin> = new Map();

    register(plugin: Plugin): void {
        this.plugins.set(plugin.id, plugin);
    }

    unregister(id: string): void {
        this.plugins.delete(id);
    }

    get<T extends Plugin>(id: string): T | undefined {
        return this.plugins.get(id) as T | undefined;
    }

    getAll(): Plugin[] {
        return Array.from(this.plugins.values());
    }

    getEnabled(): Plugin[] {
        return this.getAll().filter(p => p.enabled);
    }

    async initializeAll(): Promise<void> {
        for (const plugin of this.getEnabled()) {
            await plugin.initialize();
        }
    }

    async shutdownAll(): Promise<void> {
        for (const plugin of this.plugins.values()) {
            await plugin.shutdown();
        }
    }
}

// Export global plugin registry
export const pluginRegistry = new PluginRegistry();
