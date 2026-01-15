/**
 * SprintLoop Multi-Agent Orchestrator
 * 
 * CrewAI-style orchestration engine for coordinating multiple AI agents.
 * 
 * Features:
 * - Agent fleet management
 * - Task routing based on agent capabilities
 * - Sequential and parallel execution
 * - Approval queue integration
 * - Real-time status tracking
 */

import type { AgentPlugin, ExecutionResult } from '../plugins/types';

export type AgentRole = 'communications' | 'research' | 'development' | 'browser' | 'creative' | 'personal';

export interface AgentDefinition {
    id: string;
    role: AgentRole;
    name: string;
    description: string;
    model: string;
    plugin?: AgentPlugin;
    status: 'idle' | 'working' | 'waiting_approval' | 'error';
}

export interface Task {
    id: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    requiredRole?: AgentRole;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    assignedAgent?: string;
    result?: ExecutionResult;
    createdAt: number;
    completedAt?: number;
}

export interface WorkflowStep {
    agent: AgentRole;
    task: string;
    waitForApproval: boolean;
    dependsOn?: string[];
}

export interface Workflow {
    id: string;
    name: string;
    steps: WorkflowStep[];
    status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
}

export interface ApprovalRequest {
    id: string;
    agentId: string;
    action: string;
    description: string;
    riskLevel: 'low' | 'medium' | 'high';
    status: 'pending' | 'approved' | 'rejected';
    createdAt: number;
    respondedAt?: number;
}

export class AgentOrchestrator {
    private agents: Map<string, AgentDefinition> = new Map();
    private tasks: Map<string, Task> = new Map();
    private approvalQueue: ApprovalRequest[] = [];
    private onApprovalRequest?: (request: ApprovalRequest) => void;

    constructor() {
        this.initializeDefaultAgents();
    }

    /** Initialize the default agent fleet */
    private initializeDefaultAgents(): void {
        const defaultAgents: AgentDefinition[] = [
            {
                id: 'agent-communications',
                role: 'communications',
                name: 'Communications Agent',
                description: 'Handles emails, messages, and meeting summaries',
                model: 'claude-4.5-sonnet',
                status: 'idle',
            },
            {
                id: 'agent-research',
                role: 'research',
                name: 'Research Agent',
                description: 'Performs web research, summarization, and source tracking',
                model: 'gemini-2.5-pro',
                status: 'idle',
            },
            {
                id: 'agent-development',
                role: 'development',
                name: 'Development Agent',
                description: 'Handles code reviews, PR analysis, and commit generation',
                model: 'gpt-5',
                status: 'idle',
            },
            {
                id: 'agent-browser',
                role: 'browser',
                name: 'Browser Agent',
                description: 'Automates web interactions and testing',
                model: 'claude-4-opus',
                status: 'idle',
            },
            {
                id: 'agent-creative',
                role: 'creative',
                name: 'Creative Agent',
                description: 'Generates documents, presentations, and creative content',
                model: 'gpt-5',
                status: 'idle',
            },
            {
                id: 'agent-personal',
                role: 'personal',
                name: 'Personal Agent',
                description: 'Manages calendar, reminders, and personal tasks',
                model: 'claude-4-haiku',
                status: 'idle',
            },
        ];

        for (const agent of defaultAgents) {
            this.agents.set(agent.id, agent);
        }

        console.log('[Orchestrator] Initialized agent fleet:', this.agents.size, 'agents');
    }

    /** Route a task to the best matching agent */
    routeTask(task: Task): AgentDefinition | null {
        // If task has a required role, use that
        if (task.requiredRole) {
            const agent = Array.from(this.agents.values()).find(
                a => a.role === task.requiredRole && a.status === 'idle'
            );
            if (agent) {
                this.assignTask(task, agent);
                return agent;
            }
        }

        // Otherwise, find the best match based on task description
        const roleHints: Record<string, AgentRole> = {
            email: 'communications',
            message: 'communications',
            meeting: 'communications',
            research: 'research',
            search: 'research',
            code: 'development',
            review: 'development',
            commit: 'development',
            browse: 'browser',
            navigate: 'browser',
            screenshot: 'browser',
            write: 'creative',
            document: 'creative',
            presentation: 'creative',
            calendar: 'personal',
            reminder: 'personal',
            schedule: 'personal',
        };

        const descLower = task.description.toLowerCase();
        for (const [hint, role] of Object.entries(roleHints)) {
            if (descLower.includes(hint)) {
                const agent = Array.from(this.agents.values()).find(
                    a => a.role === role && a.status === 'idle'
                );
                if (agent) {
                    this.assignTask(task, agent);
                    return agent;
                }
            }
        }

        // Fall back to first available agent
        const availableAgent = Array.from(this.agents.values()).find(a => a.status === 'idle');
        if (availableAgent) {
            this.assignTask(task, availableAgent);
            return availableAgent;
        }

        return null;
    }

    /** Assign a task to an agent */
    private assignTask(task: Task, agent: AgentDefinition): void {
        task.assignedAgent = agent.id;
        task.status = 'in_progress';
        agent.status = 'working';
        this.tasks.set(task.id, task);

        console.log(`[Orchestrator] Assigned task "${task.title}" to ${agent.name}`);
    }

    /** Execute a chain of agents sequentially */
    async executeChain(tasks: Task[]): Promise<ExecutionResult[]> {
        const results: ExecutionResult[] = [];

        for (const task of tasks) {
            const agent = this.routeTask(task);
            if (!agent) {
                results.push({
                    success: false,
                    output: `No available agent for task: ${task.title}`,
                    filesModified: [],
                    errors: ['No available agent'],
                });
                continue;
            }

            // Execute the task
            const result = await this.executeAgentTask(agent, task);
            results.push(result);

            // Release the agent
            agent.status = 'idle';
            task.status = result.success ? 'completed' : 'failed';
            task.result = result;
            task.completedAt = Date.now();
        }

        return results;
    }

    /** Execute multiple tasks in parallel */
    async executeParallel(tasks: Task[]): Promise<ExecutionResult[]> {
        const promises = tasks.map(async (task) => {
            const agent = this.routeTask(task);
            if (!agent) {
                return {
                    success: false,
                    output: `No available agent for task: ${task.title}`,
                    filesModified: [],
                    errors: ['No available agent'],
                } as ExecutionResult;
            }

            const result = await this.executeAgentTask(agent, task);
            agent.status = 'idle';
            task.status = result.success ? 'completed' : 'failed';
            task.result = result;
            task.completedAt = Date.now();

            return result;
        });

        return Promise.all(promises);
    }

    /** Execute a single agent task */
    private async executeAgentTask(agent: AgentDefinition, task: Task): Promise<ExecutionResult> {
        console.log(`[Orchestrator] Executing task "${task.title}" with ${agent.name}`);

        // If agent has a plugin, use it
        if (agent.plugin) {
            const context = {
                fileContent: '',
                filePath: '',
                cursorPosition: { line: 0, column: 0 },
                projectRoot: '.',
                recentFiles: [],
            };

            const plan = await agent.plugin.plan(task.description, context);
            return await agent.plugin.execute(plan, context);
        }

        // Otherwise, simulate execution
        await new Promise(r => setTimeout(r, 1000));

        return {
            success: true,
            output: `Task "${task.title}" completed by ${agent.name}`,
            filesModified: [],
        };
    }

    /** Request approval for an agent action */
    requestApproval(agentId: string, action: string, description: string, riskLevel: ApprovalRequest['riskLevel']): ApprovalRequest {
        const request: ApprovalRequest = {
            id: `approval-${Date.now()}`,
            agentId,
            action,
            description,
            riskLevel,
            status: 'pending',
            createdAt: Date.now(),
        };

        this.approvalQueue.push(request);

        const agent = this.agents.get(agentId);
        if (agent) {
            agent.status = 'waiting_approval';
        }

        this.onApprovalRequest?.(request);

        return request;
    }

    /** Respond to an approval request */
    respondToApproval(requestId: string, approved: boolean): void {
        const request = this.approvalQueue.find(r => r.id === requestId);
        if (request) {
            request.status = approved ? 'approved' : 'rejected';
            request.respondedAt = Date.now();

            const agent = this.agents.get(request.agentId);
            if (agent) {
                agent.status = approved ? 'working' : 'idle';
            }
        }
    }

    /** Get pending approval requests */
    getPendingApprovals(): ApprovalRequest[] {
        return this.approvalQueue.filter(r => r.status === 'pending');
    }

    /** Set approval request handler */
    setApprovalHandler(handler: (request: ApprovalRequest) => void): void {
        this.onApprovalRequest = handler;
    }

    /** Get all agents */
    getAgents(): AgentDefinition[] {
        return Array.from(this.agents.values());
    }

    /** Get agent by ID */
    getAgent(id: string): AgentDefinition | undefined {
        return this.agents.get(id);
    }

    /** Get agent by role */
    getAgentByRole(role: AgentRole): AgentDefinition | undefined {
        return Array.from(this.agents.values()).find(a => a.role === role);
    }

    /** Create a new task */
    createTask(title: string, description: string, priority: Task['priority'] = 'medium', requiredRole?: AgentRole): Task {
        const task: Task = {
            id: `task-${Date.now()}`,
            title,
            description,
            priority,
            requiredRole,
            status: 'pending',
            createdAt: Date.now(),
        };

        this.tasks.set(task.id, task);
        return task;
    }

    /** Get all tasks */
    getTasks(): Task[] {
        return Array.from(this.tasks.values());
    }
}

// Export singleton instance
export const orchestrator = new AgentOrchestrator();
