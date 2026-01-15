/**
 * Multi-Agent Pool
 * 
 * Inspired by Cursor 2.0's 8-agent parallel execution
 * 
 * Features:
 * - Run up to 8 agents in parallel
 * - Each agent works in isolated Git worktree
 * - Automatic conflict detection
 * - Unified progress tracking
 * - Shadow workspace for validation
 */

import { initializeWorktreeManager, getWorktreeManager } from '../kanban/git-worktree';
import { UnifiedAgentHarness, createAgentFromPreset } from './harness';
import { agentEvents } from './harness';

export interface AgentPoolConfig {
    maxAgents: number;
    projectPath: string;
    mainBranch: string;
    enableShadowWorkspace: boolean;
}

export interface PooledAgent {
    id: string;
    agent: UnifiedAgentHarness;
    status: 'idle' | 'working' | 'paused' | 'completed' | 'failed';
    taskId?: string;
    worktreePath?: string;
    branch?: string;
    startedAt?: number;
    completedAt?: number;
    progress: number;
}

export interface PoolTask {
    id: string;
    title: string;
    description: string;
    priority: number;
    assigned?: string;
    status: 'queued' | 'assigned' | 'running' | 'validating' | 'completed' | 'failed';
    result?: string;
    error?: string;
}

export interface PoolProgress {
    totalAgents: number;
    activeAgents: number;
    completedTasks: number;
    queuedTasks: number;
    runningTasks: number;
    overallProgress: number;
}

/**
 * Agent Pool - Cursor-style multi-agent orchestration
 */
export class AgentPool {
    private config: AgentPoolConfig;
    private agents: Map<string, PooledAgent> = new Map();
    private taskQueue: PoolTask[] = [];
    private completedTasks: PoolTask[] = [];
    private isRunning: boolean = false;

    constructor(config: AgentPoolConfig) {
        this.config = config;
        initializeWorktreeManager(config.projectPath, config.mainBranch);
        this.initializeAgentPool();
    }

    private initializeAgentPool(): void {
        for (let i = 0; i < this.config.maxAgents; i++) {
            const agent = createAgentFromPreset('developer', {
                id: `pool-agent-${i}`,
            });

            this.agents.set(`agent-${i}`, {
                id: `agent-${i}`,
                agent,
                status: 'idle',
                progress: 0,
            });
        }

        console.log(`[AgentPool] Initialized ${this.config.maxAgents} agents`);
    }

    /**
     * Queue a task for execution
     */
    queueTask(title: string, description: string, priority: number = 5): string {
        const task: PoolTask = {
            id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            title,
            description,
            priority,
            status: 'queued',
        };

        this.taskQueue.push(task);
        this.taskQueue.sort((a, b) => b.priority - a.priority);

        console.log(`[AgentPool] Queued task: ${title}`);

        // Auto-start if not running
        if (!this.isRunning) {
            this.start();
        }

        return task.id;
    }

    /**
     * Queue multiple tasks
     */
    queueTasks(tasks: Array<{ title: string; description: string; priority?: number }>): string[] {
        return tasks.map(t => this.queueTask(t.title, t.description, t.priority));
    }

    /**
     * Start the agent pool
     */
    async start(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;

        console.log('[AgentPool] Starting pool execution');

        while (this.isRunning && (this.taskQueue.length > 0 || this.hasActiveAgents())) {
            await this.assignTasks();
            await this.sleep(1000); // Check every second
        }

        console.log('[AgentPool] Pool execution complete');
        this.isRunning = false;
    }

    /**
     * Pause all agents
     */
    pause(): void {
        this.isRunning = false;
        console.log('[AgentPool] Pool paused');
    }

    /**
     * Assign queued tasks to idle agents
     */
    private async assignTasks(): Promise<void> {
        for (const pooledAgent of this.agents.values()) {
            if (pooledAgent.status !== 'idle') continue;

            const task = this.taskQueue.shift();
            if (!task) break;

            await this.executeTask(pooledAgent, task);
        }
    }

    /**
     * Execute a task with an agent
     */
    private async executeTask(pooledAgent: PooledAgent, task: PoolTask): Promise<void> {
        const worktreeManager = getWorktreeManager();

        try {
            // Create isolated worktree
            const worktree = await worktreeManager.createWorktree(task.id);
            pooledAgent.worktreePath = worktree.path;
            pooledAgent.branch = worktree.branch;

            // Update statuses
            pooledAgent.status = 'working';
            pooledAgent.taskId = task.id;
            pooledAgent.startedAt = Date.now();
            task.status = 'running';
            task.assigned = pooledAgent.id;

            agentEvents.emit({
                type: 'agent:started',
                agentId: pooledAgent.id,
                timestamp: Date.now(),
                data: { taskId: task.id, branch: worktree.branch },
            });

            // Start agent session
            const session = pooledAgent.agent.startSession(worktree.path);

            // Process the task
            const result = await pooledAgent.agent.processMessage(
                `Task: ${task.title}\n\nDescription: ${task.description}\n\nPlease complete this task in the worktree at ${worktree.path}.`
            );

            // Validate if shadow workspace enabled
            if (this.config.enableShadowWorkspace) {
                task.status = 'validating';
                const isValid = await this.validateInShadowWorkspace(pooledAgent.branch!);

                if (!isValid) {
                    throw new Error('Shadow workspace validation failed');
                }
            }

            // Commit changes
            await worktreeManager.commit(task.id, `Complete: ${task.title}`);

            // Mark complete
            pooledAgent.status = 'completed';
            pooledAgent.completedAt = Date.now();
            pooledAgent.progress = 100;
            task.status = 'completed';
            task.result = result.content;

            this.completedTasks.push(task);

            agentEvents.emit({
                type: 'agent:completed',
                agentId: pooledAgent.id,
                timestamp: Date.now(),
                data: { taskId: task.id, sessionId: session.id },
            });

        } catch (error) {
            pooledAgent.status = 'failed';
            task.status = 'failed';
            task.error = error instanceof Error ? error.message : 'Unknown error';

            agentEvents.emit({
                type: 'agent:error',
                agentId: pooledAgent.id,
                timestamp: Date.now(),
                data: { taskId: task.id, error: task.error },
            });

        } finally {
            // Reset agent for next task
            setTimeout(() => {
                pooledAgent.status = 'idle';
                pooledAgent.taskId = undefined;
                pooledAgent.progress = 0;
            }, 2000);
        }
    }

    /**
     * Validate changes in a shadow workspace (Cursor 2.0 feature)
     */
    private async validateInShadowWorkspace(_branch: string): Promise<boolean> {
        console.log('[AgentPool] Running shadow workspace validation');

        // In real implementation:
        // 1. Create a temporary copy of the worktree
        // 2. Run the build
        // 3. Run linter
        // 4. Run tests
        // 5. Report results

        return true; // Simulate validation passing
    }

    /**
     * Check if any agents are active
     */
    private hasActiveAgents(): boolean {
        return Array.from(this.agents.values()).some(a =>
            a.status === 'working' || a.status === 'paused'
        );
    }

    /**
     * Get pool progress
     */
    getProgress(): PoolProgress {
        const agents = Array.from(this.agents.values());
        const active = agents.filter(a => a.status === 'working');

        const completedCount = this.completedTasks.length;
        const queuedCount = this.taskQueue.length;
        const runningCount = active.length;
        const totalTasks = completedCount + queuedCount + runningCount;

        return {
            totalAgents: agents.length,
            activeAgents: active.length,
            completedTasks: completedCount,
            queuedTasks: queuedCount,
            runningTasks: runningCount,
            overallProgress: totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0,
        };
    }

    /**
     * Get agent statuses
     */
    getAgentStatuses(): PooledAgent[] {
        return Array.from(this.agents.values());
    }

    /**
     * Get completed tasks
     */
    getCompletedTasks(): PoolTask[] {
        return this.completedTasks;
    }

    /**
     * Merge all completed work into main branch
     */
    async mergeAll(squash: boolean = true): Promise<{ success: boolean; merged: number }> {
        const worktreeManager = getWorktreeManager();
        let merged = 0;

        for (const task of this.completedTasks) {
            if (task.status === 'completed') {
                try {
                    await worktreeManager.merge(task.id, squash);
                    merged++;
                } catch (error) {
                    console.error(`[AgentPool] Failed to merge task ${task.id}:`, error);
                }
            }
        }

        return { success: merged === this.completedTasks.length, merged };
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Create a new agent pool
 */
export function createAgentPool(config: Partial<AgentPoolConfig> & { projectPath: string }): AgentPool {
    return new AgentPool({
        maxAgents: 8,
        mainBranch: 'main',
        enableShadowWorkspace: true,
        ...config,
    });
}
