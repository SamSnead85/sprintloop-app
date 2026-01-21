/**
 * SprintLoop Tool Registry
 * 
 * Ported from OpenCode - Centralized tool registration and execution
 * Tools are the capabilities that AI agents can use to interact with the system
 */

import type { ToolResult } from './types';

// Tool definition interface
export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    parameters: ToolParameter[];
    execute: (args: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    description: string;
    required: boolean;
    default?: unknown;
}

// Tool registry singleton
const tools = new Map<string, ToolDefinition>();

/**
 * Register a tool
 */
export function registerTool(tool: ToolDefinition): void {
    tools.set(tool.id, tool);
}

/**
 * Get a tool by ID
 */
export function getTool(toolId: string): ToolDefinition | undefined {
    return tools.get(toolId);
}

/**
 * Get all registered tools
 */
export function getAllTools(): ToolDefinition[] {
    return Array.from(tools.values());
}

/**
 * Execute a tool by ID with given arguments
 */
export async function executeTool(
    toolId: string,
    args: Record<string, unknown>
): Promise<ToolResult> {
    const tool = tools.get(toolId);
    if (!tool) {
        return {
            success: false,
            output: `Tool '${toolId}' not found`,
            error: `Unknown tool: ${toolId}`,
        };
    }

    try {
        const result = await tool.execute(args);
        return result;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            output: '',
            error: errorMessage,
        };
    }
}

/**
 * Convert tools to OpenAI function calling format
 */
export function getToolsForOpenAI(): Array<{
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: {
            type: 'object';
            properties: Record<string, unknown>;
            required: string[];
        };
    };
}> {
    return getAllTools().map(tool => ({
        type: 'function' as const,
        function: {
            name: tool.id,
            description: tool.description,
            parameters: {
                type: 'object',
                properties: Object.fromEntries(
                    tool.parameters.map(p => [
                        p.name,
                        {
                            type: p.type,
                            description: p.description,
                            ...(p.default !== undefined ? { default: p.default } : {}),
                        },
                    ])
                ),
                required: tool.parameters.filter(p => p.required).map(p => p.name),
            },
        },
    }));
}

/**
 * Initialize all core tools
 */
export async function initializeTools(): Promise<void> {
    // Import and register core tools
    const { readTool } = await import('./read');
    const { writeTool } = await import('./write');
    const { editTool } = await import('./edit');
    const { bashTool } = await import('./bash');
    const { grepTool } = await import('./grep');
    const { globTool } = await import('./glob');

    registerTool(readTool);
    registerTool(writeTool);
    registerTool(editTool);
    registerTool(bashTool);
    registerTool(grepTool);
    registerTool(globTool);

    console.log(`[ToolRegistry] Initialized ${tools.size} tools`);
}
