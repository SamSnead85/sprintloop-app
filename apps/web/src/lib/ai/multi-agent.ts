/**
 * Multi-Agent Orchestrator
 * Coordinates multiple specialized agents for complex tasks
 * Inspired by AutoGen, CrewAI, and LangGraph patterns
 */

import { getKnowledgeBase } from './knowledge-base'

// Agent role definitions
export type AgentRole =
    | 'planner'      // Strategic planning and task breakdown
    | 'coder'        // Code generation and implementation
    | 'reviewer'     // Code review and quality assurance
    | 'researcher'   // Information gathering and analysis
    | 'tester'       // Test generation and execution
    | 'documenter'   // Documentation generation
    | 'debugger'     // Bug identification and fixing
    | 'architect'    // System design and architecture

// Agent configuration
export interface AgentConfig {
    id: string
    name: string
    role: AgentRole
    model: string // Model ID (cloud or on-prem)
    systemPrompt: string
    tools: string[]
    temperature?: number
    maxTokens?: number
}

// Task for agents
export interface AgentTask {
    id: string
    title: string
    description: string
    status: 'pending' | 'assigned' | 'running' | 'complete' | 'failed'
    assignedAgent?: string
    dependencies?: string[]
    result?: string
    error?: string
}

// Conversation message between agents
export interface AgentMessage {
    id: string
    from: string // Agent ID or 'user' or 'system'
    to: string | 'all' // Target agent or broadcast
    content: string
    type: 'request' | 'response' | 'handoff' | 'broadcast'
    timestamp: Date
    metadata?: Record<string, unknown>
}

// Orchestrator configuration
export interface OrchestratorConfig {
    maxConcurrentAgents: number
    enableKnowledgeBase: boolean
    defaultModel: string
    handoffStrategy: 'sequential' | 'parallel' | 'adaptive'
}

// Default agent configurations
export const DEFAULT_AGENTS: Record<AgentRole, Partial<AgentConfig>> = {
    planner: {
        name: 'Planner',
        role: 'planner',
        systemPrompt: `You are a strategic planner. Your job is to:
- Break down complex tasks into smaller, manageable steps
- Identify dependencies between tasks
- Assign appropriate agents to each task
- Monitor overall progress and adjust plans as needed

Always output a structured plan with clear steps and assignments.`,
        tools: ['create_task', 'assign_task', 'get_status'],
    },
    coder: {
        name: 'Coder',
        role: 'coder',
        systemPrompt: `You are an expert software developer. Your job is to:
- Write clean, efficient, maintainable code
- Follow best practices and coding standards
- Implement features according to specifications
- Handle edge cases and error conditions

Always provide complete, working code with appropriate comments.`,
        tools: ['read_file', 'write_file', 'run_command', 'search_code'],
    },
    reviewer: {
        name: 'Reviewer',
        role: 'reviewer',
        systemPrompt: `You are a code review expert. Your job is to:
- Review code for quality, correctness, and security
- Identify potential bugs and performance issues
- Suggest improvements and optimizations
- Ensure code follows project standards

Provide constructive feedback with specific suggestions.`,
        tools: ['read_file', 'get_diff', 'add_comment'],
    },
    researcher: {
        name: 'Researcher',
        role: 'researcher',
        systemPrompt: `You are a research specialist. Your job is to:
- Gather relevant information from documentation and code
- Analyze existing implementations
- Find best practices and solutions
- Provide context for decision-making

Always cite sources and provide comprehensive analysis.`,
        tools: ['search_web', 'search_docs', 'search_code', 'knowledge_lookup'],
    },
    tester: {
        name: 'Tester',
        role: 'tester',
        systemPrompt: `You are a testing expert. Your job is to:
- Write comprehensive test cases
- Identify edge cases and failure scenarios
- Execute tests and analyze results
- Ensure code coverage requirements are met

Provide thorough test coverage with clear assertions.`,
        tools: ['read_file', 'write_file', 'run_tests', 'get_coverage'],
    },
    documenter: {
        name: 'Documenter',
        role: 'documenter',
        systemPrompt: `You are a documentation specialist. Your job is to:
- Write clear, comprehensive documentation
- Create API references and guides
- Maintain README files and wikis
- Ensure documentation stays up-to-date

Write documentation that is accessible to all skill levels.`,
        tools: ['read_file', 'write_file', 'get_code_outline'],
    },
    debugger: {
        name: 'Debugger',
        role: 'debugger',
        systemPrompt: `You are a debugging expert. Your job is to:
- Identify root causes of bugs
- Analyze error messages and stack traces
- Propose and implement fixes
- Add logging and monitoring where needed

Systematically trace issues to their source.`,
        tools: ['read_file', 'run_command', 'get_logs', 'add_breakpoint'],
    },
    architect: {
        name: 'Architect',
        role: 'architect',
        systemPrompt: `You are a system architect. Your job is to:
- Design scalable system architectures
- Make technology and framework decisions
- Define interfaces and contracts
- Ensure modularity and maintainability

Create designs that balance complexity with functionality.`,
        tools: ['read_file', 'search_code', 'create_diagram', 'knowledge_lookup'],
    },
}

/**
 * Multi-Agent Orchestrator
 */
export class MultiAgentOrchestrator {
    private agents: Map<string, AgentConfig> = new Map()
    private tasks: Map<string, AgentTask> = new Map()
    private messages: AgentMessage[] = []
    private config: OrchestratorConfig

    constructor(config: Partial<OrchestratorConfig> = {}) {
        this.config = {
            maxConcurrentAgents: 3,
            enableKnowledgeBase: true,
            defaultModel: 'claude-4.5-sonnet',
            handoffStrategy: 'adaptive',
            ...config,
        }
    }

    /**
     * Register an agent with the orchestrator
     */
    registerAgent(config: Partial<AgentConfig> & { role: AgentRole }): string {
        const id = `agent_${config.role}_${Date.now()}`
        const defaults = DEFAULT_AGENTS[config.role]

        const agent: AgentConfig = {
            id,
            name: config.name || defaults.name || config.role,
            role: config.role,
            model: config.model || this.config.defaultModel,
            systemPrompt: config.systemPrompt || defaults.systemPrompt || '',
            tools: config.tools || defaults.tools || [],
            temperature: config.temperature ?? 0.7,
            maxTokens: config.maxTokens ?? 4096,
        }

        this.agents.set(id, agent)
        return id
    }

    /**
     * Create a task for agents to work on
     */
    createTask(task: Omit<AgentTask, 'id' | 'status'>): string {
        const id = `task_${Date.now()}_${Math.random().toString(36).slice(2)}`

        this.tasks.set(id, {
            ...task,
            id,
            status: 'pending',
        })

        return id
    }

    /**
     * Assign a task to an agent
     */
    assignTask(taskId: string, agentId: string): void {
        const task = this.tasks.get(taskId)
        if (!task) throw new Error(`Task not found: ${taskId}`)

        task.assignedAgent = agentId
        task.status = 'assigned'
    }

    /**
     * Execute a task with the assigned agent
     */
    async executeTask(taskId: string): Promise<string> {
        const task = this.tasks.get(taskId)
        if (!task) throw new Error(`Task not found: ${taskId}`)
        if (!task.assignedAgent) throw new Error(`Task not assigned: ${taskId}`)

        const agent = this.agents.get(task.assignedAgent)
        if (!agent) throw new Error(`Agent not found: ${task.assignedAgent}`)

        task.status = 'running'

        try {
            // Get context from knowledge base if enabled
            let context = ''
            if (this.config.enableKnowledgeBase) {
                const kb = getKnowledgeBase()
                context = await kb.getContext(task.description)
            }

            // Build prompt for agent
            const prompt = this.buildAgentPrompt(agent, task, context)

            // Execute with the agent's model (real model call)
            const result = await this.executeWithModel(agent, prompt)

            task.result = result
            task.status = 'complete'

            // Log the completion
            this.addMessage({
                from: agent.id,
                to: 'system',
                content: result,
                type: 'response',
            })

            return result
        } catch (error) {
            task.status = 'failed'
            task.error = error instanceof Error ? error.message : 'Unknown error'
            throw error
        }
    }

    /**
     * Run a multi-agent workflow
     */
    async runWorkflow(description: string, roles: AgentRole[] = ['planner', 'coder', 'reviewer']): Promise<void> {
        // Register required agents
        const agentIds: string[] = []
        for (const role of roles) {
            agentIds.push(this.registerAgent({ role }))
        }

        // Create initial planning task
        const planTaskId = this.createTask({
            title: 'Plan the approach',
            description: `Analyze and plan: ${description}`,
        })

        // Assign to planner if available
        const plannerId = agentIds.find(id => this.agents.get(id)?.role === 'planner')
        if (plannerId) {
            this.assignTask(planTaskId, plannerId)
            await this.executeTask(planTaskId)
        }

        // Execute remaining tasks based on handoff strategy
        // This is a simplified version - full implementation would follow the plan
        for (const agentId of agentIds) {
            const agent = this.agents.get(agentId)
            if (agent && agent.role !== 'planner') {
                const taskId = this.createTask({
                    title: `${agent.name} work`,
                    description,
                    dependencies: [planTaskId],
                })
                this.assignTask(taskId, agentId)
                await this.executeTask(taskId)
            }
        }
    }

    /**
     * Get all messages
     */
    getMessages(): AgentMessage[] {
        return [...this.messages]
    }

    /**
     * Get all tasks
     */
    getTasks(): AgentTask[] {
        return Array.from(this.tasks.values())
    }

    /**
     * Get all agents
     */
    getAgents(): AgentConfig[] {
        return Array.from(this.agents.values())
    }

    // Add a message to the conversation
    private addMessage(msg: Omit<AgentMessage, 'id' | 'timestamp'>): void {
        this.messages.push({
            ...msg,
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            timestamp: new Date(),
        })
    }

    // Build prompt for an agent
    private buildAgentPrompt(agent: AgentConfig, task: AgentTask, context: string): string {
        return `${agent.systemPrompt}

## Current Task
**Title:** ${task.title}
**Description:** ${task.description}

${context ? `## Relevant Context\n${context}` : ''}

## Instructions
Complete the task described above. Provide a clear, actionable response.`
    }

    // Execute agent with real model (compliance-aware routing)
    private async executeWithModel(agent: AgentConfig, prompt: string): Promise<string> {
        console.log(`[${agent.name}] Executing with preferred model: ${agent.model}`)
        console.log(`[${agent.name}] Prompt length: ${prompt.length} chars`)

        // Import dynamically to avoid circular deps
        const { generateWithCompliance } = await import('./provider')

        try {
            // Build message history
            const messages = [{
                id: 'agent-prompt',
                role: 'user' as const,
                content: prompt,
                timestamp: new Date(),
            }]

            // Execute with compliance routing
            const { text, routingResult } = await generateWithCompliance(messages, prompt)

            console.log(`[${agent.name}] Completed using ${routingResult.modelType}:${routingResult.modelId}`)
            console.log(`[${agent.name}] Routing: ${routingResult.reason}`)

            return text
        } catch (error) {
            console.error(`[${agent.name}] Execution failed:`, error)
            throw error
        }
    }
}

// Global orchestrator instance
let globalOrchestrator: MultiAgentOrchestrator | null = null

export function getOrchestrator(): MultiAgentOrchestrator {
    if (!globalOrchestrator) {
        globalOrchestrator = new MultiAgentOrchestrator()
    }
    return globalOrchestrator
}

export function initOrchestrator(config: Partial<OrchestratorConfig>): MultiAgentOrchestrator {
    globalOrchestrator = new MultiAgentOrchestrator(config)
    return globalOrchestrator
}
