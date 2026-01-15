/**
 * Agent Task Executor
 * 
 * Connects the Kanban board to the agent orchestrator.
 * Enables parallel task execution with isolated tracking.
 */

import { useKanbanStore, type KanbanTask } from './kanban-store';
import { orchestrator, type AgentRole } from '../orchestrator';

export interface ExecutionProgress {
    taskId: string;
    progress: number;
    status: string;
    currentStep?: string;
    output?: string;
}

export type ProgressCallback = (progress: ExecutionProgress) => void;

/**
 * Execute a Kanban task using the assigned AI agent
 */
export async function executeKanbanTask(
    taskId: string,
    onProgress?: ProgressCallback
): Promise<void> {
    const store = useKanbanStore.getState();
    const task = store.tasks.get(taskId);

    if (!task) {
        throw new Error(`Task ${taskId} not found`);
    }

    if (!task.assignedAgent) {
        throw new Error(`Task ${taskId} has no assigned agent`);
    }

    // Start the task
    store.startTask(taskId);

    onProgress?.({
        taskId,
        progress: 0,
        status: 'Starting agent...',
        currentStep: 'initialization',
    });

    try {
        // Create orchestrator task
        const orchTask = orchestrator.createTask(
            task.title,
            task.description,
            task.priority,
            task.assignedAgent as AgentRole
        );

        onProgress?.({
            taskId,
            progress: 10,
            status: 'Agent assigned',
            currentStep: 'planning',
        });

        // Execute via orchestrator
        const results = await orchestrator.executeChain([orchTask]);
        const result = results[0];

        if (result.success) {
            // Add commits if files were modified
            if (result.filesModified.length > 0) {
                const commits = result.filesModified.map((file, i) => ({
                    sha: `${Date.now().toString(36)}-${i}`,
                    message: `Agent: ${task.title} - modified ${file}`,
                    author: task.assignedAgent || 'unknown',
                    timestamp: Date.now(),
                    filesChanged: 1,
                }));

                store.updateTask(taskId, {
                    commits: [...task.commits, ...commits],
                });
            }

            onProgress?.({
                taskId,
                progress: 90,
                status: 'Submitting for review...',
                currentStep: 'review',
                output: result.output,
            });

            // Submit for review
            store.submitForReview(taskId);

            onProgress?.({
                taskId,
                progress: 100,
                status: 'Ready for review',
                currentStep: 'complete',
                output: result.output,
            });
        } else {
            store.updateTask(taskId, {
                status: 'failed',
                column: 'in_progress',
            });

            onProgress?.({
                taskId,
                progress: 0,
                status: 'Failed',
                output: result.errors?.join(', '),
            });
        }
    } catch (error) {
        store.updateTask(taskId, {
            status: 'failed',
        });

        onProgress?.({
            taskId,
            progress: 0,
            status: 'Error',
            output: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
    }
}

/**
 * Execute multiple Kanban tasks in parallel
 * (Key vibe-kanban feature: parallel execution with isolation)
 */
export async function executeParallelTasks(
    taskIds: string[],
    onProgress?: (taskId: string, progress: ExecutionProgress) => void
): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    const promises = taskIds.map(async (taskId) => {
        try {
            await executeKanbanTask(taskId, (progress) => {
                onProgress?.(taskId, progress);
            });
            results.set(taskId, true);
        } catch {
            results.set(taskId, false);
        }
    });

    await Promise.all(promises);
    return results;
}

/**
 * Get suggested agent for a task based on description
 */
export function suggestAgentForTask(task: Partial<KanbanTask>): AgentRole {
    const description = (task.description || task.title || '').toLowerCase();

    const hints: [string[], AgentRole][] = [
        [['email', 'message', 'slack', 'communicate', 'meeting'], 'communications'],
        [['research', 'search', 'find', 'investigate', 'analyze'], 'research'],
        [['code', 'implement', 'fix', 'bug', 'feature', 'refactor', 'test'], 'development'],
        [['browse', 'website', 'scrape', 'screenshot', 'click'], 'browser'],
        [['write', 'document', 'blog', 'content', 'presentation'], 'creative'],
        [['calendar', 'schedule', 'remind', 'plan', 'organize'], 'personal'],
    ];

    for (const [keywords, role] of hints) {
        if (keywords.some(k => description.includes(k))) {
            return role;
        }
    }

    return 'development'; // Default
}

/**
 * Auto-assign agents to all unassigned tasks
 */
export function autoAssignAgents(): number {
    const store = useKanbanStore.getState();
    let assigned = 0;

    for (const [taskId, task] of store.tasks) {
        if (!task.assignedAgent && task.status === 'pending') {
            const suggestedAgent = suggestAgentForTask(task);
            store.assignAgent(taskId, suggestedAgent);
            assigned++;
        }
    }

    return assigned;
}
