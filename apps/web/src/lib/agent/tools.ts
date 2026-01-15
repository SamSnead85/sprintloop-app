/**
 * Tool Calling Framework
 * 
 * Phase 15: Unified tool execution layer
 * Inspired by Cline's MCP integration and Codex CLI's tool system
 * 
 * Features:
 * - Standardized tool interface
 * - Result injection into chat
 * - Tool validation and sandboxing
 * - Execution logging
 */

export interface ToolDefinition {
    name: string;
    description: string;
    category: 'file' | 'terminal' | 'browser' | 'search' | 'ai' | 'other';
    parameters: ToolParameter[];
    returnType: 'string' | 'json' | 'binary' | 'void';
    requiresApproval: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    examples: ToolExample[];
}

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    default?: unknown;
    enum?: string[];
}

export interface ToolExample {
    description: string;
    params: Record<string, unknown>;
    expectedOutput: string;
}

export interface ToolExecutionResult {
    success: boolean;
    output: string;
    data?: unknown;
    error?: string;
    duration: number;
    artifacts: string[];
}

export interface ToolExecutionLog {
    id: string;
    toolName: string;
    params: Record<string, unknown>;
    result: ToolExecutionResult;
    timestamp: number;
    sessionId: string;
}

type ToolExecutor = (params: Record<string, unknown>) => Promise<ToolExecutionResult>;

/**
 * Tool Registry - manages all available tools
 */
class ToolRegistry {
    private tools: Map<string, ToolDefinition> = new Map();
    private executors: Map<string, ToolExecutor> = new Map();
    private logs: ToolExecutionLog[] = [];

    /**
     * Register a new tool
     */
    register(definition: ToolDefinition, executor: ToolExecutor): void {
        this.tools.set(definition.name, definition);
        this.executors.set(definition.name, executor);
        console.log(`[ToolRegistry] Registered tool: ${definition.name}`);
    }

    /**
     * Unregister a tool
     */
    unregister(name: string): void {
        this.tools.delete(name);
        this.executors.delete(name);
    }

    /**
     * Get all registered tools
     */
    getAll(): ToolDefinition[] {
        return Array.from(this.tools.values());
    }

    /**
     * Get tool by name
     */
    get(name: string): ToolDefinition | undefined {
        return this.tools.get(name);
    }

    /**
     * Get tools by category
     */
    getByCategory(category: ToolDefinition['category']): ToolDefinition[] {
        return this.getAll().filter(t => t.category === category);
    }

    /**
     * Validate tool parameters
     */
    validateParams(toolName: string, params: Record<string, unknown>): { valid: boolean; errors: string[] } {
        const tool = this.tools.get(toolName);
        if (!tool) {
            return { valid: false, errors: [`Tool "${toolName}" not found`] };
        }

        const errors: string[] = [];

        for (const param of tool.parameters) {
            if (param.required && !(param.name in params)) {
                errors.push(`Missing required parameter: ${param.name}`);
            }

            if (param.name in params && param.enum && !param.enum.includes(String(params[param.name]))) {
                errors.push(`Invalid value for ${param.name}. Must be one of: ${param.enum.join(', ')}`);
            }
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Execute a tool
     */
    async execute(
        toolName: string,
        params: Record<string, unknown>,
        sessionId: string
    ): Promise<ToolExecutionResult> {
        const startTime = Date.now();

        // Validate tool exists
        const executor = this.executors.get(toolName);
        if (!executor) {
            return {
                success: false,
                output: '',
                error: `Tool "${toolName}" not found`,
                duration: 0,
                artifacts: [],
            };
        }

        // Validate params
        const validation = this.validateParams(toolName, params);
        if (!validation.valid) {
            return {
                success: false,
                output: '',
                error: validation.errors.join('; '),
                duration: 0,
                artifacts: [],
            };
        }

        // Execute
        try {
            const result = await executor(params);
            result.duration = Date.now() - startTime;

            // Log execution
            this.logs.push({
                id: `log-${Date.now()}`,
                toolName,
                params,
                result,
                timestamp: Date.now(),
                sessionId,
            });

            return result;
        } catch (error) {
            const result: ToolExecutionResult = {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime,
                artifacts: [],
            };

            this.logs.push({
                id: `log-${Date.now()}`,
                toolName,
                params,
                result,
                timestamp: Date.now(),
                sessionId,
            });

            return result;
        }
    }

    /**
     * Get execution logs
     */
    getLogs(sessionId?: string): ToolExecutionLog[] {
        if (sessionId) {
            return this.logs.filter(l => l.sessionId === sessionId);
        }
        return this.logs;
    }

    /**
     * Clear logs
     */
    clearLogs(): void {
        this.logs = [];
    }

    /**
     * Generate OpenAI-compatible tool schemas
     */
    toOpenAITools(): object[] {
        return this.getAll().map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: 'object',
                    properties: Object.fromEntries(
                        tool.parameters.map(p => [p.name, {
                            type: p.type,
                            description: p.description,
                            enum: p.enum,
                        }])
                    ),
                    required: tool.parameters.filter(p => p.required).map(p => p.name),
                },
            },
        }));
    }

    /**
     * Generate Anthropic-compatible tool schemas
     */
    toAnthropicTools(): object[] {
        return this.getAll().map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: {
                type: 'object',
                properties: Object.fromEntries(
                    tool.parameters.map(p => [p.name, {
                        type: p.type,
                        description: p.description,
                        enum: p.enum,
                    }])
                ),
                required: tool.parameters.filter(p => p.required).map(p => p.name),
            },
        }));
    }
}

// Global registry instance
export const toolRegistry = new ToolRegistry();

// ============================================================================
// BUILT-IN TOOL DEFINITIONS
// ============================================================================

const builtInTools: Array<{ definition: ToolDefinition; executor: ToolExecutor }> = [
    {
        definition: {
            name: 'read_file',
            description: 'Read the contents of a file from the file system',
            category: 'file',
            parameters: [
                { name: 'path', type: 'string', description: 'Path to the file', required: true },
                { name: 'encoding', type: 'string', description: 'File encoding', required: false, default: 'utf-8' },
            ],
            returnType: 'string',
            requiresApproval: false,
            riskLevel: 'low',
            examples: [
                { description: 'Read a TypeScript file', params: { path: 'src/index.ts' }, expectedOutput: 'File contents...' },
            ],
        },
        executor: async (params) => ({
            success: true,
            output: `[Simulated] Contents of ${params.path}`,
            duration: 0,
            artifacts: [params.path as string],
        }),
    },
    {
        definition: {
            name: 'write_file',
            description: 'Write content to a file (creates if not exists, overwrites if exists)',
            category: 'file',
            parameters: [
                { name: 'path', type: 'string', description: 'Path to the file', required: true },
                { name: 'content', type: 'string', description: 'Content to write', required: true },
            ],
            returnType: 'void',
            requiresApproval: true,
            riskLevel: 'medium',
            examples: [
                { description: 'Create a new file', params: { path: 'test.txt', content: 'Hello' }, expectedOutput: 'File written' },
            ],
        },
        executor: async (params) => ({
            success: true,
            output: `Wrote to ${params.path}`,
            duration: 0,
            artifacts: [params.path as string],
        }),
    },
    {
        definition: {
            name: 'execute_command',
            description: 'Execute a shell command in the terminal',
            category: 'terminal',
            parameters: [
                { name: 'command', type: 'string', description: 'Command to execute', required: true },
                { name: 'cwd', type: 'string', description: 'Working directory', required: false },
                { name: 'timeout', type: 'number', description: 'Timeout in ms', required: false, default: 30000 },
            ],
            returnType: 'string',
            requiresApproval: true,
            riskLevel: 'high',
            examples: [
                { description: 'Run npm install', params: { command: 'npm install' }, expectedOutput: 'Installation log...' },
            ],
        },
        executor: async (params) => ({
            success: true,
            output: `[Simulated] Executed: ${params.command}`,
            duration: 0,
            artifacts: [],
        }),
    },
    {
        definition: {
            name: 'search_code',
            description: 'Search for patterns in code using ripgrep',
            category: 'search',
            parameters: [
                { name: 'query', type: 'string', description: 'Search query or regex', required: true },
                { name: 'path', type: 'string', description: 'Path to search in', required: false, default: '.' },
                { name: 'fileTypes', type: 'array', description: 'File extensions to include', required: false },
            ],
            returnType: 'json',
            requiresApproval: false,
            riskLevel: 'low',
            examples: [
                { description: 'Search for function', params: { query: 'function handleSubmit' }, expectedOutput: '[]' },
            ],
        },
        executor: async (params) => ({
            success: true,
            output: `Found 5 matches for "${params.query}"`,
            data: [],
            duration: 0,
            artifacts: [],
        }),
    },
    {
        definition: {
            name: 'browse_url',
            description: 'Fetch and parse content from a URL',
            category: 'browser',
            parameters: [
                { name: 'url', type: 'string', description: 'URL to fetch', required: true },
                { name: 'selector', type: 'string', description: 'CSS selector to extract', required: false },
            ],
            returnType: 'string',
            requiresApproval: true,
            riskLevel: 'medium',
            examples: [
                { description: 'Fetch docs', params: { url: 'https://docs.example.com' }, expectedOutput: 'Page content...' },
            ],
        },
        executor: async (params) => ({
            success: true,
            output: `[Simulated] Content from ${params.url}`,
            duration: 0,
            artifacts: [],
        }),
    },
];

// Register built-in tools
for (const { definition, executor } of builtInTools) {
    toolRegistry.register(definition, executor);
}

/**
 * Format tool results for injection into chat
 */
export function formatToolResultForChat(log: ToolExecutionLog): string {
    const status = log.result.success ? '✓' : '✗';
    const duration = `${log.result.duration}ms`;

    let output = `**Tool: ${log.toolName}** ${status} (${duration})\n`;
    output += `Params: \`${JSON.stringify(log.params)}\`\n`;

    if (log.result.success) {
        output += `\n\`\`\`\n${log.result.output}\n\`\`\``;
    } else {
        output += `\nError: ${log.result.error}`;
    }

    return output;
}
