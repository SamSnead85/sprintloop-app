/**
 * SprintLoop Agent Framework
 * Base agent class for multi-agent orchestration
 */

import { generateWithCompliance } from '../ai/provider';
import { executeTool, getAllTools, type ToolDefinition } from '../tools/registry';

export type AgentRole = 'planner' | 'coder' | 'reviewer' | 'tester' | 'debugger';

export interface AgentMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    agentRole?: AgentRole;
    toolCalls?: ToolCall[];
}

export interface ToolCall {
    tool: string;
    args: Record<string, unknown>;
    result?: string;
    success?: boolean;
}

export interface AgentConfig {
    role: AgentRole;
    name: string;
    systemPrompt: string;
    availableTools: string[];
}

export interface AgentResponse {
    content: string;
    toolCalls: ToolCall[];
    handoffTo?: AgentRole;
    isComplete: boolean;
}

/**
 * Base Agent class - foundation for all specialist agents
 */
export abstract class BaseAgent {
    protected config: AgentConfig;
    protected messages: AgentMessage[] = [];
    protected tools: ToolDefinition[] = [];

    constructor(config: AgentConfig) {
        this.config = config;
        this.loadTools();
    }

    private loadTools(): void {
        const allTools = getAllTools();
        this.tools = allTools.filter(t =>
            this.config.availableTools.includes(t.id) ||
            this.config.availableTools.includes('*')
        );
    }

    /**
     * Process a user message and generate a response
     */
    async process(userMessage: string, context?: string): Promise<AgentResponse> {
        // Build the prompt with system context
        const prompt = this.buildPrompt(userMessage, context);

        // Add user message to history
        this.messages.push({
            id: crypto.randomUUID(),
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
        });

        try {
            // Generate response from AI
            const result = await generateWithCompliance(this.messages, prompt);

            // Parse response for tool calls and handoffs
            const { content, toolCalls, handoffTo } = this.parseResponse(result.text);

            // Execute any tool calls
            const executedToolCalls = await this.executeToolCalls(toolCalls);

            // Check if task is complete
            const isComplete = this.checkCompletion(content);

            // Add assistant message to history
            this.messages.push({
                id: crypto.randomUUID(),
                role: 'assistant',
                content,
                timestamp: new Date(),
                agentRole: this.config.role,
                toolCalls: executedToolCalls,
            });

            return {
                content,
                toolCalls: executedToolCalls,
                handoffTo,
                isComplete,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return {
                content: `Error: ${errorMessage}`,
                toolCalls: [],
                isComplete: false,
            };
        }
    }

    /**
     * Build the prompt with system context and available tools
     */
    protected buildPrompt(userMessage: string, context?: string): string {
        const toolList = this.tools.map(t => `- ${t.name}: ${t.description}`).join('\n');

        return `${this.config.systemPrompt}

**Available Tools:**
${toolList || 'No tools available'}

**Context:**
${context || 'No additional context'}

**User Request:**
${userMessage}

**Instructions:**
1. Analyze the request
2. Use tools when needed (format: \`\`\`tool\n{"tool": "name", "args": {...}}\n\`\`\`)
3. If you need another agent, say: HANDOFF_TO: [agent_role]
4. When complete, say: TASK_COMPLETE

Respond:`;
    }

    /**
     * Parse response for tool calls and handoffs
     */
    protected parseResponse(text: string): { content: string; toolCalls: ToolCall[]; handoffTo?: AgentRole } {
        const toolCalls: ToolCall[] = [];
        let handoffTo: AgentRole | undefined;

        // Parse tool calls
        const toolMatches = text.matchAll(/```tool\n(\{[\s\S]*?\})\n```/g);
        for (const match of toolMatches) {
            try {
                const parsed = JSON.parse(match[1]);
                if (parsed.tool && parsed.args) {
                    toolCalls.push({ tool: parsed.tool, args: parsed.args });
                }
            } catch {
                // Skip invalid tool calls
            }
        }

        // Parse handoff
        const handoffMatch = text.match(/HANDOFF_TO:\s*(planner|coder|reviewer|tester|debugger)/i);
        if (handoffMatch) {
            handoffTo = handoffMatch[1].toLowerCase() as AgentRole;
        }

        // Clean content
        const content = text
            .replace(/```tool\n[\s\S]*?\n```/g, '')
            .replace(/HANDOFF_TO:\s*\w+/gi, '')
            .replace(/TASK_COMPLETE/gi, '')
            .trim();

        return { content, toolCalls, handoffTo };
    }

    /**
     * Execute tool calls and return results
     */
    protected async executeToolCalls(toolCalls: ToolCall[]): Promise<ToolCall[]> {
        const results: ToolCall[] = [];

        for (const call of toolCalls) {
            try {
                const result = await executeTool(call.tool, call.args);
                results.push({
                    ...call,
                    result: result.output,
                    success: result.success,
                });
            } catch (error) {
                results.push({
                    ...call,
                    result: error instanceof Error ? error.message : 'Unknown error',
                    success: false,
                });
            }
        }

        return results;
    }

    /**
     * Check if the task is complete
     */
    protected checkCompletion(content: string): boolean {
        return content.toLowerCase().includes('task_complete') ||
            content.toLowerCase().includes('task complete') ||
            content.toLowerCase().includes('completed successfully');
    }

    /**
     * Get agent info
     */
    getInfo(): AgentConfig {
        return { ...this.config };
    }

    /**
     * Clear message history
     */
    clearHistory(): void {
        this.messages = [];
    }
}
