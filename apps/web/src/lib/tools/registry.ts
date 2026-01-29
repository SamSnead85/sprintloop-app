/**
 * SprintLoop Tool Registry
 * 
 * Ported from OpenCode - Centralized tool registration and execution
 * Tools are the capabilities that AI agents can use to interact with the system
 * 
 * Enhanced with platform-aware capability detection
 */

import type { ToolResult } from './types';
import {
    type CapabilityRequirement,
    canExecuteTool as checkCapabilities,
    getPlatform,
    ToolCapabilityError
} from './capability-detector';

// Tool definition interface with capability requirements
export interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    parameters: ToolParameter[];
    execute: (args: Record<string, unknown>) => Promise<ToolResult>;
    /** Capabilities required to execute this tool */
    requiredCapabilities?: CapabilityRequirement[];
    /** Alternative tool to suggest when this one is unavailable */
    webAlternative?: string;
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
 * Get only tools available on current platform
 */
export function getAvailableTools(): ToolDefinition[] {
    return getAllTools().filter(tool => {
        if (!tool.requiredCapabilities || tool.requiredCapabilities.length === 0) {
            return true;
        }
        const { canExecute } = checkCapabilities(tool.requiredCapabilities);
        return canExecute;
    });
}

/**
 * Check if a specific tool is available on current platform
 */
export function isToolAvailable(toolId: string): boolean {
    const tool = tools.get(toolId);
    if (!tool) return false;

    if (!tool.requiredCapabilities || tool.requiredCapabilities.length === 0) {
        return true;
    }

    const { canExecute } = checkCapabilities(tool.requiredCapabilities);
    return canExecute;
}

/**
 * Execute a tool by ID with given arguments
 * Includes capability checking and graceful error handling
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

    // Check platform capabilities
    if (tool.requiredCapabilities && tool.requiredCapabilities.length > 0) {
        const { canExecute, missingCapabilities, suggestions } = checkCapabilities(
            tool.requiredCapabilities
        );

        if (!canExecute) {
            const platform = getPlatform();
            const alternativeMsg = tool.webAlternative
                ? `\n\nAlternative: Try using '${tool.webAlternative}' instead.`
                : '';

            return {
                success: false,
                output: '',
                error: `Tool '${tool.name}' is not available in ${platform} mode.\n` +
                    `Missing capabilities: ${missingCapabilities.join(', ')}\n` +
                    `Suggestions:\n${suggestions.map(s => `  • ${s}`).join('\n')}${alternativeMsg}`,
            };
        }
    }

    try {
        const result = await tool.execute(args);
        return result;
    } catch (error) {
        // Handle capability errors specially
        if (error instanceof ToolCapabilityError) {
            return {
                success: false,
                output: '',
                error: `${error.message}\nSuggestions:\n${error.suggestions.map(s => `  • ${s}`).join('\n')}`,
            };
        }

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
 * Only includes tools available on current platform
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
    // Only expose tools that are available on current platform
    return getAvailableTools().map(tool => ({
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
 * Get tool availability summary for debugging/display
 */
export function getToolAvailabilitySummary(): {
    available: string[];
    unavailable: Array<{ id: string; reason: string }>;
} {
    const available: string[] = [];
    const unavailable: Array<{ id: string; reason: string }> = [];

    for (const tool of tools.values()) {
        if (!tool.requiredCapabilities || tool.requiredCapabilities.length === 0) {
            available.push(tool.id);
            continue;
        }

        const { canExecute, missingCapabilities } = checkCapabilities(tool.requiredCapabilities);
        if (canExecute) {
            available.push(tool.id);
        } else {
            unavailable.push({
                id: tool.id,
                reason: `Missing: ${missingCapabilities.join(', ')}`,
            });
        }
    }

    return { available, unavailable };
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

    const { available, unavailable } = getToolAvailabilitySummary();
    console.log(`[ToolRegistry] Initialized ${tools.size} tools`);
    console.log(`[ToolRegistry] Available: ${available.length}, Unavailable: ${unavailable.length}`);

    if (unavailable.length > 0) {
        console.log(`[ToolRegistry] Unavailable tools on ${getPlatform()}:`,
            unavailable.map(t => t.id).join(', ')
        );
    }
}

