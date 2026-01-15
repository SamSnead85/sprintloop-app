/**
 * SprintLoop Unified Agent Harness
 * 
 * Best-in-class agent architecture infused from:
 * - Cline: Plan/Act modes, approval workflow, MCP tools
 * - Codex CLI: Terminal-first, multi-file ops, Full Auto mode
 * - OpenCode: Event-driven core, LSP integration, custom agents
 * 
 * This is the core orchestration layer that makes SprintLoop
 * a premium, best-in-class agentic IDE for developers and PMs.
 */

// Type import removed - AgentRole not used in this file

// ============================================================================
// CORE TYPES (Inspired by Cline + OpenCode)
// ============================================================================

export type AgentMode = 'suggest' | 'auto_edit' | 'full_auto';

export interface AgentConfig {
    id: string;
    name: string;
    description: string;
    model: string;
    provider: 'anthropic' | 'openai' | 'google' | 'local';
    mode: AgentMode;
    persona?: string;
    systemPrompt?: string;
    tools: AgentTool[];
    maxTokens: number;
    temperature: number;
    approvalRequired: boolean;
}

export interface AgentTool {
    name: string;
    description: string;
    schema: object;
    requiresApproval: boolean;
    execute: (params: unknown) => Promise<ToolResult>;
}

export interface ToolResult {
    success: boolean;
    output: string;
    artifacts?: string[];
    error?: string;
}

export interface AgentAction {
    id: string;
    type: 'file_read' | 'file_write' | 'file_delete' | 'terminal_exec' |
    'browser_navigate' | 'api_call' | 'search' | 'think';
    params: Record<string, unknown>;
    status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
    result?: ToolResult;
    timestamp: number;
    requiresApproval: boolean;
}

export interface AgentPlan {
    id: string;
    goal: string;
    steps: PlanStep[];
    currentStep: number;
    status: 'planning' | 'executing' | 'paused' | 'completed' | 'failed';
    createdAt: number;
    updatedAt: number;
}

export interface PlanStep {
    id: string;
    description: string;
    tool: string;
    params: Record<string, unknown>;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
    output?: string;
    error?: string;
}

// ============================================================================
// EVENT SYSTEM (Inspired by OpenCode's event-driven architecture)
// ============================================================================

export type AgentEventType =
    | 'agent:started'
    | 'agent:thinking'
    | 'agent:planning'
    | 'agent:action_proposed'
    | 'agent:action_approved'
    | 'agent:action_rejected'
    | 'agent:action_executing'
    | 'agent:action_completed'
    | 'agent:step_completed'
    | 'agent:paused'
    | 'agent:resumed'
    | 'agent:completed'
    | 'agent:error'
    | 'agent:message';

export interface AgentEvent {
    type: AgentEventType;
    agentId: string;
    timestamp: number;
    data: unknown;
}

type EventHandler = (event: AgentEvent) => void;

class AgentEventBus {
    private handlers: Map<AgentEventType, EventHandler[]> = new Map();
    private globalHandlers: EventHandler[] = [];

    on(type: AgentEventType, handler: EventHandler): () => void {
        const handlers = this.handlers.get(type) || [];
        handlers.push(handler);
        this.handlers.set(type, handlers);

        return () => {
            const idx = handlers.indexOf(handler);
            if (idx > -1) handlers.splice(idx, 1);
        };
    }

    onAll(handler: EventHandler): () => void {
        this.globalHandlers.push(handler);
        return () => {
            const idx = this.globalHandlers.indexOf(handler);
            if (idx > -1) this.globalHandlers.splice(idx, 1);
        };
    }

    emit(event: AgentEvent): void {
        // Notify specific handlers
        const handlers = this.handlers.get(event.type) || [];
        for (const handler of handlers) {
            try {
                handler(event);
            } catch (e) {
                console.error('[AgentEventBus] Handler error:', e);
            }
        }

        // Notify global handlers
        for (const handler of this.globalHandlers) {
            try {
                handler(event);
            } catch (e) {
                console.error('[AgentEventBus] Global handler error:', e);
            }
        }
    }
}

export const agentEvents = new AgentEventBus();

// ============================================================================
// BUILT-IN TOOLS (Inspired by Cline + Codex CLI)
// ============================================================================

export const BUILT_IN_TOOLS: AgentTool[] = [
    {
        name: 'read_file',
        description: 'Read the contents of a file',
        schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] },
        requiresApproval: false,
        execute: async (params) => {
            const { path } = params as { path: string };
            console.log('[Tool] Reading file:', path);
            // In real implementation, use Tauri FS API
            return { success: true, output: `Contents of ${path}`, artifacts: [path] };
        },
    },
    {
        name: 'write_file',
        description: 'Write content to a file',
        schema: {
            type: 'object',
            properties: { path: { type: 'string' }, content: { type: 'string' } },
            required: ['path', 'content']
        },
        requiresApproval: true,
        execute: async (params) => {
            const { path, content } = params as { path: string; content: string };
            console.log('[Tool] Writing file:', path, 'Length:', content.length);
            return { success: true, output: `Wrote ${content.length} chars to ${path}`, artifacts: [path] };
        },
    },
    {
        name: 'execute_command',
        description: 'Execute a terminal command',
        schema: {
            type: 'object',
            properties: { command: { type: 'string' }, cwd: { type: 'string' } },
            required: ['command']
        },
        requiresApproval: true,
        execute: async (params) => {
            const { command, cwd } = params as { command: string; cwd?: string };
            console.log('[Tool] Executing command:', command, 'in', cwd || '.');
            // In real implementation, use Tauri shell API
            return { success: true, output: `Executed: ${command}` };
        },
    },
    {
        name: 'search_files',
        description: 'Search for files matching a pattern',
        schema: {
            type: 'object',
            properties: { pattern: { type: 'string' }, directory: { type: 'string' } },
            required: ['pattern']
        },
        requiresApproval: false,
        execute: async (params) => {
            const { pattern, directory } = params as { pattern: string; directory?: string };
            console.log('[Tool] Searching for:', pattern, 'in', directory || '.');
            return { success: true, output: `Found files matching ${pattern}` };
        },
    },
    {
        name: 'search_code',
        description: 'Search for code patterns using ripgrep',
        schema: {
            type: 'object',
            properties: { query: { type: 'string' }, path: { type: 'string' } },
            required: ['query']
        },
        requiresApproval: false,
        execute: async (params) => {
            const { query, path } = params as { query: string; path?: string };
            console.log('[Tool] Searching code for:', query, 'in', path || '.');
            return { success: true, output: `Code search results for "${query}"` };
        },
    },
    {
        name: 'browse_web',
        description: 'Navigate to a URL and extract content',
        schema: {
            type: 'object',
            properties: { url: { type: 'string' }, selector: { type: 'string' } },
            required: ['url']
        },
        requiresApproval: true,
        execute: async (params) => {
            const { url } = params as { url: string };
            console.log('[Tool] Browsing:', url);
            return { success: true, output: `Fetched content from ${url}` };
        },
    },
    {
        name: 'think',
        description: 'Internal reasoning step - no action taken',
        schema: {
            type: 'object',
            properties: { thought: { type: 'string' } },
            required: ['thought']
        },
        requiresApproval: false,
        execute: async (params) => {
            const { thought } = params as { thought: string };
            return { success: true, output: thought };
        },
    },
];

// ============================================================================
// AGENT SESSION (Inspired by OpenCode's session management)
// ============================================================================

export interface AgentSession {
    id: string;
    agentId: string;
    projectPath: string;
    messages: SessionMessage[];
    actions: AgentAction[];
    plan?: AgentPlan;
    mode: AgentMode;
    createdAt: number;
    updatedAt: number;
}

export interface SessionMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp: number;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
}

export interface ToolCall {
    id: string;
    name: string;
    params: Record<string, unknown>;
}

// ============================================================================
// UNIFIED AGENT HARNESS
// ============================================================================

export class UnifiedAgentHarness {
    private config: AgentConfig;
    private session: AgentSession | null = null;
    private onApprovalRequest?: (action: AgentAction) => Promise<boolean>;

    constructor(config: AgentConfig) {
        this.config = config;
    }

    /**
     * Start a new agent session
     */
    startSession(projectPath: string): AgentSession {
        this.session = {
            id: `session-${Date.now()}`,
            agentId: this.config.id,
            projectPath,
            messages: [],
            actions: [],
            mode: this.config.mode,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // Add system prompt
        if (this.config.systemPrompt) {
            this.session.messages.push({
                id: `msg-${Date.now()}`,
                role: 'system',
                content: this.config.systemPrompt,
                timestamp: Date.now(),
            });
        }

        agentEvents.emit({
            type: 'agent:started',
            agentId: this.config.id,
            timestamp: Date.now(),
            data: { sessionId: this.session.id, projectPath },
        });

        return this.session;
    }

    /**
     * Process a user message
     */
    async processMessage(content: string): Promise<SessionMessage> {
        if (!this.session) {
            throw new Error('No active session. Call startSession() first.');
        }

        // Add user message
        const userMessage: SessionMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content,
            timestamp: Date.now(),
        };
        this.session.messages.push(userMessage);
        this.session.updatedAt = Date.now();

        agentEvents.emit({
            type: 'agent:message',
            agentId: this.config.id,
            timestamp: Date.now(),
            data: { message: userMessage },
        });

        // Generate plan (Cline's Plan mode)
        agentEvents.emit({
            type: 'agent:planning',
            agentId: this.config.id,
            timestamp: Date.now(),
            data: { goal: content },
        });

        const plan = await this.generatePlan(content);
        this.session.plan = plan;

        // Execute plan based on mode
        if (this.config.mode === 'full_auto') {
            await this.executePlanFullAuto(plan);
        } else if (this.config.mode === 'auto_edit') {
            await this.executePlanAutoEdit(plan);
        } else {
            await this.executePlanSuggest(plan);
        }

        // Generate response
        const response = await this.generateResponse();
        const assistantMessage: SessionMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: response,
            timestamp: Date.now(),
        };
        this.session.messages.push(assistantMessage);

        return assistantMessage;
    }

    /**
     * Generate an execution plan (Cline's structured planning)
     */
    private async generatePlan(goal: string): Promise<AgentPlan> {
        // In real implementation, call LLM to generate plan
        console.log('[Agent] Generating plan for:', goal);

        const plan: AgentPlan = {
            id: `plan-${Date.now()}`,
            goal,
            steps: [],
            currentStep: 0,
            status: 'planning',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // Simulate plan generation
        // In production, this would call the AI model
        plan.steps = [
            { id: 'step-1', description: 'Analyze request', tool: 'think', params: {}, status: 'pending' },
            { id: 'step-2', description: 'Search codebase', tool: 'search_code', params: {}, status: 'pending' },
            { id: 'step-3', description: 'Implement changes', tool: 'write_file', params: {}, status: 'pending' },
        ];

        plan.status = 'executing';
        return plan;
    }

    /**
     * Full Auto mode - execute without approval (Codex CLI's Full Auto)
     */
    private async executePlanFullAuto(plan: AgentPlan): Promise<void> {
        for (let i = 0; i < plan.steps.length; i++) {
            plan.currentStep = i;
            const step = plan.steps[i];
            step.status = 'in_progress';

            agentEvents.emit({
                type: 'agent:action_executing',
                agentId: this.config.id,
                timestamp: Date.now(),
                data: { step, index: i },
            });

            const tool = this.config.tools.find(t => t.name === step.tool);
            if (tool) {
                try {
                    const result = await tool.execute(step.params);
                    step.status = result.success ? 'completed' : 'failed';
                    step.output = result.output;
                } catch (e) {
                    step.status = 'failed';
                    step.error = e instanceof Error ? e.message : 'Unknown error';
                }
            } else {
                step.status = 'completed';
                step.output = `Simulated: ${step.description}`;
            }

            agentEvents.emit({
                type: 'agent:step_completed',
                agentId: this.config.id,
                timestamp: Date.now(),
                data: { step, index: i },
            });
        }

        plan.status = 'completed';
        plan.updatedAt = Date.now();
    }

    /**
     * Auto Edit mode - auto-approve reads, require approval for writes
     */
    private async executePlanAutoEdit(plan: AgentPlan): Promise<void> {
        for (let i = 0; i < plan.steps.length; i++) {
            plan.currentStep = i;
            const step = plan.steps[i];
            const tool = this.config.tools.find(t => t.name === step.tool);

            if (tool?.requiresApproval && this.onApprovalRequest) {
                const action: AgentAction = {
                    id: `action-${Date.now()}`,
                    type: 'file_write',
                    params: step.params,
                    status: 'pending',
                    timestamp: Date.now(),
                    requiresApproval: true,
                };

                agentEvents.emit({
                    type: 'agent:action_proposed',
                    agentId: this.config.id,
                    timestamp: Date.now(),
                    data: { action, step },
                });

                const approved = await this.onApprovalRequest(action);
                if (!approved) {
                    step.status = 'skipped';
                    continue;
                }
            }

            step.status = 'in_progress';
            // Execute step...
            step.status = 'completed';
            step.output = `Completed: ${step.description}`;
        }

        plan.status = 'completed';
    }

    /**
     * Suggest mode - require approval for all actions
     */
    private async executePlanSuggest(plan: AgentPlan): Promise<void> {
        // In suggest mode, we just present the plan and wait for approval
        agentEvents.emit({
            type: 'agent:paused',
            agentId: this.config.id,
            timestamp: Date.now(),
            data: { plan, reason: 'Awaiting user approval for plan' },
        });

        plan.status = 'paused';
    }

    /**
     * Approve and execute a paused plan
     */
    async approvePlan(): Promise<void> {
        if (!this.session?.plan || this.session.plan.status !== 'paused') {
            throw new Error('No paused plan to approve');
        }

        agentEvents.emit({
            type: 'agent:resumed',
            agentId: this.config.id,
            timestamp: Date.now(),
            data: {},
        });

        // Execute with auto-edit mode after approval
        await this.executePlanAutoEdit(this.session.plan);
    }

    /**
     * Generate final response
     */
    private async generateResponse(): Promise<string> {
        const plan = this.session?.plan;
        if (!plan) return 'No actions taken.';

        const completedSteps = plan.steps.filter(s => s.status === 'completed');
        return `Completed ${completedSteps.length}/${plan.steps.length} steps:\n${completedSteps.map(s => `• ${s.description}`).join('\n')
            }`;
    }

    /**
     * Set approval handler
     */
    setApprovalHandler(handler: (action: AgentAction) => Promise<boolean>): void {
        this.onApprovalRequest = handler;
    }

    /**
     * Get current session
     */
    getSession(): AgentSession | null {
        return this.session;
    }

    /**
     * Get config
     */
    getConfig(): AgentConfig {
        return this.config;
    }
}

// ============================================================================
// PRESET AGENTS (Inspired by OpenCode's agent system)
// ============================================================================

export const PRESET_AGENTS: Record<string, Partial<AgentConfig>> = {
    developer: {
        name: 'Developer Agent',
        description: 'Full-stack development agent with read/write access',
        persona: 'Senior full-stack developer',
        mode: 'auto_edit',
        approvalRequired: true,
        tools: BUILT_IN_TOOLS,
    },
    planner: {
        name: 'Planner Agent',
        description: 'Read-only agent for analysis and planning',
        persona: 'Technical architect',
        mode: 'suggest',
        approvalRequired: false,
        tools: BUILT_IN_TOOLS.filter(t => !t.requiresApproval),
    },
    reviewer: {
        name: 'Code Reviewer',
        description: 'Reviews code and suggests improvements',
        persona: 'Senior code reviewer',
        mode: 'suggest',
        approvalRequired: false,
        tools: [BUILT_IN_TOOLS[0], BUILT_IN_TOOLS[4], BUILT_IN_TOOLS[6]], // read, search, think
    },
    automator: {
        name: 'Full Auto Agent',
        description: 'Fully autonomous agent (use with caution)',
        persona: 'Efficient automation specialist',
        mode: 'full_auto',
        approvalRequired: false,
        tools: BUILT_IN_TOOLS,
    },
};

/**
 * Create an agent from a preset
 */
export function createAgentFromPreset(
    preset: keyof typeof PRESET_AGENTS,
    overrides?: Partial<AgentConfig>
): UnifiedAgentHarness {
    const presetConfig = PRESET_AGENTS[preset];

    const config: AgentConfig = {
        id: `agent-${preset}-${Date.now()}`,
        name: presetConfig.name || preset,
        description: presetConfig.description || '',
        model: overrides?.model || 'claude-4-sonnet',
        provider: overrides?.provider || 'anthropic',
        mode: presetConfig.mode || 'auto_edit',
        persona: presetConfig.persona,
        systemPrompt: buildSystemPrompt(presetConfig.persona || preset),
        tools: presetConfig.tools || BUILT_IN_TOOLS,
        maxTokens: overrides?.maxTokens || 4096,
        temperature: overrides?.temperature || 0.7,
        approvalRequired: presetConfig.approvalRequired ?? true,
        ...overrides,
    };

    return new UnifiedAgentHarness(config);
}

function buildSystemPrompt(persona: string): string {
    return `You are ${persona}, an expert AI coding assistant integrated into SprintLoop IDE.

Your capabilities:
- Read and analyze code files
- Write and modify code with user approval
- Execute terminal commands
- Search through codebases
- Browse web for documentation
- Think step-by-step before acting

Guidelines:
1. Always explain your reasoning before taking action
2. Request approval for destructive operations
3. Provide clear, concise responses
4. Follow project conventions and best practices
5. Ask clarifying questions when requirements are unclear

You have access to the following tools: read_file, write_file, execute_command, search_files, search_code, browse_web, think.`;
}
