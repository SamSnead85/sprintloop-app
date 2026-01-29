/**
 * Autonomous Agent Loop
 * 
 * Core agent loop that executes tasks to completion autonomously.
 * Handles planning, execution, error recovery, and user confirmation.
 */

import { create } from 'zustand';
import { executeTool, isToolAvailable } from '../tools/registry';
import type { ToolResult } from '../tools/types';

// =============================================================================
// TYPES
// =============================================================================

export type AgentLoopStatus =
    | 'idle'
    | 'planning'
    | 'executing'
    | 'awaiting_confirmation'
    | 'completed'
    | 'failed'
    | 'paused'
    | 'cancelled';

export interface AgentAction {
    id: string;
    type: 'tool_call' | 'think' | 'ask_user' | 'complete';
    tool?: string;
    toolArgs?: Record<string, unknown>;
    reasoning?: string;
    result?: ToolResult;
    status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
    timestamp: number;
    duration?: number;
}

export interface AgentPlan {
    nextAction: AgentAction;
    remainingSteps: string[];
    confidence: number;
    requiresConfirmation: boolean;
    completionEstimate: number;
}

export interface AgentLoopContext {
    task: string;
    taskId: string;
    status: AgentLoopStatus;
    history: AgentAction[];
    currentPlan?: AgentPlan;
    startedAt: number;
    updatedAt: number;
    completedAt?: number;
    error?: string;
    progress: number;
    confirmationCallback?: (approved: boolean) => void;
}

export interface AutonomousLoopState {
    contexts: Map<string, AgentLoopContext>;
    activeTaskId: string | null;

    // Actions
    startLoop: (task: string) => Promise<string>;
    pauseLoop: (taskId: string) => void;
    resumeLoop: (taskId: string) => void;
    cancelLoop: (taskId: string) => void;
    confirmAction: (taskId: string, approved: boolean) => void;
    getContext: (taskId: string) => AgentLoopContext | undefined;
    getActiveContext: () => AgentLoopContext | undefined;
}

// =============================================================================
// AGENT LOOP STORE
// =============================================================================

export const useAutonomousLoopStore = create<AutonomousLoopState>((set, get) => ({
    contexts: new Map(),
    activeTaskId: null,

    startLoop: async (task: string): Promise<string> => {
        const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const context: AgentLoopContext = {
            task,
            taskId,
            status: 'planning',
            history: [],
            startedAt: Date.now(),
            updatedAt: Date.now(),
            progress: 0,
        };

        set(state => ({
            contexts: new Map(state.contexts).set(taskId, context),
            activeTaskId: taskId,
        }));

        // Start the autonomous loop
        runAgentLoop(taskId).catch(error => {
            console.error('[AutonomousLoop] Loop failed:', error);
            set(state => {
                const contexts = new Map(state.contexts);
                const ctx = contexts.get(taskId);
                if (ctx) {
                    contexts.set(taskId, {
                        ...ctx,
                        status: 'failed',
                        error: error instanceof Error ? error.message : String(error),
                        updatedAt: Date.now(),
                    });
                }
                return { contexts };
            });
        });

        return taskId;
    },

    pauseLoop: (taskId: string) => {
        set(state => {
            const contexts = new Map(state.contexts);
            const ctx = contexts.get(taskId);
            if (ctx && ctx.status === 'executing') {
                contexts.set(taskId, {
                    ...ctx,
                    status: 'paused',
                    updatedAt: Date.now(),
                });
            }
            return { contexts };
        });
    },

    resumeLoop: (taskId: string) => {
        const ctx = get().contexts.get(taskId);
        if (ctx && ctx.status === 'paused') {
            set(state => {
                const contexts = new Map(state.contexts);
                contexts.set(taskId, {
                    ...ctx,
                    status: 'executing',
                    updatedAt: Date.now(),
                });
                return { contexts };
            });

            // Resume the loop
            runAgentLoop(taskId);
        }
    },

    cancelLoop: (taskId: string) => {
        set(state => {
            const contexts = new Map(state.contexts);
            const ctx = contexts.get(taskId);
            if (ctx) {
                contexts.set(taskId, {
                    ...ctx,
                    status: 'cancelled',
                    completedAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
            return { contexts, activeTaskId: state.activeTaskId === taskId ? null : state.activeTaskId };
        });
    },

    confirmAction: (taskId: string, approved: boolean) => {
        const ctx = get().contexts.get(taskId);
        if (ctx && ctx.status === 'awaiting_confirmation' && ctx.confirmationCallback) {
            ctx.confirmationCallback(approved);
        }
    },

    getContext: (taskId: string) => get().contexts.get(taskId),

    getActiveContext: () => {
        const { activeTaskId, contexts } = get();
        return activeTaskId ? contexts.get(activeTaskId) : undefined;
    },
}));

// =============================================================================
// CORE LOOP LOGIC
// =============================================================================

/**
 * Main agent loop - runs until task is complete, failed, or cancelled
 */
async function runAgentLoop(taskId: string): Promise<void> {
    const store = useAutonomousLoopStore.getState();
    let context = store.contexts.get(taskId);

    if (!context) {
        throw new Error(`Task ${taskId} not found`);
    }

    const maxIterations = 50; // Safety limit
    let iterations = 0;

    while (iterations < maxIterations) {
        iterations++;

        // Refresh context
        context = useAutonomousLoopStore.getState().contexts.get(taskId);
        if (!context) break;

        // Check for terminal states
        if (['completed', 'failed', 'cancelled', 'paused'].includes(context.status)) {
            console.log(`[AutonomousLoop] Loop ended with status: ${context.status}`);
            break;
        }

        try {
            // Phase 1: Plan next step
            updateStatus(taskId, 'planning');
            const plan = await planNextStep(context);

            if (!plan) {
                // No more steps - task is complete
                updateStatus(taskId, 'completed', { progress: 100 });
                break;
            }

            updateContext(taskId, { currentPlan: plan });

            // Phase 2: Check if confirmation is needed
            if (plan.requiresConfirmation) {
                const approved = await requestConfirmation(taskId, plan);
                if (!approved) {
                    addAction(taskId, { ...plan.nextAction, status: 'skipped' });
                    continue;
                }
            }

            // Phase 3: Execute the action
            updateStatus(taskId, 'executing');
            const result = await executeAction(context, plan.nextAction);

            addAction(taskId, {
                ...plan.nextAction,
                result,
                status: result.success ? 'completed' : 'failed',
                duration: Date.now() - plan.nextAction.timestamp,
            });

            // Update progress estimate
            const newProgress = Math.min(95, context.progress + plan.completionEstimate);
            updateContext(taskId, { progress: newProgress });

            // Phase 4: Check for completion
            if (isTaskComplete(context, plan.nextAction)) {
                updateStatus(taskId, 'completed', { progress: 100 });
                break;
            }

            // Phase 5: Handle errors
            if (!result.success) {
                const shouldContinue = await handleError(taskId, plan.nextAction, result);
                if (!shouldContinue) {
                    updateStatus(taskId, 'failed', { error: result.error });
                    break;
                }
            }

        } catch (error) {
            console.error('[AutonomousLoop] Iteration error:', error);
            updateStatus(taskId, 'failed', {
                error: error instanceof Error ? error.message : String(error),
            });
            break;
        }
    }

    if (iterations >= maxIterations) {
        updateStatus(taskId, 'failed', { error: 'Maximum iterations exceeded' });
    }
}

/**
 * Plan the next step based on current context
 */
async function planNextStep(context: AgentLoopContext): Promise<AgentPlan | null> {
    // Simple heuristic-based planning
    // In a real implementation, this would call the AI model
    // and use getAvailableTools() to filter available actions

    const taskLower = context.task.toLowerCase();

    // Check if this looks like a completion state
    if (context.history.length > 0) {
        const lastAction = context.history[context.history.length - 1];
        if (lastAction.type === 'complete' ||
            (lastAction.result?.success && lastAction.reasoning?.includes('final'))) {
            return null; // Task is complete
        }
    }

    // Determine next action based on task type
    let nextAction: AgentAction;
    let requiresConfirmation = false;
    let completionEstimate = 10;

    if (taskLower.includes('create') || taskLower.includes('make') || taskLower.includes('new')) {
        // File creation task
        if (!context.history.some(a => a.tool === 'write')) {
            nextAction = createAction('tool_call', 'write', {
                file_path: extractFilePath(context.task) || '/tmp/new-file.ts',
                content: '// Generated file content\n',
            }, 'Creating new file based on task requirements');
            requiresConfirmation = true;
            completionEstimate = 40;
        } else {
            nextAction = createAction('complete', undefined, undefined, 'File creation completed');
            completionEstimate = 100;
        }
    } else if (taskLower.includes('read') || taskLower.includes('show') || taskLower.includes('view')) {
        // File reading task
        if (!context.history.some(a => a.tool === 'read')) {
            nextAction = createAction('tool_call', 'read', {
                file_path: extractFilePath(context.task) || '/tmp/example.ts',
            }, 'Reading file to understand contents');
            completionEstimate = 80;
        } else {
            nextAction = createAction('complete', undefined, undefined, 'File read completed');
            completionEstimate = 100;
        }
    } else if (taskLower.includes('run') || taskLower.includes('execute') || taskLower.includes('build')) {
        // Command execution task
        if (!context.history.some(a => a.tool === 'bash')) {
            const command = extractCommand(context.task) || 'echo "Hello World"';
            nextAction = createAction('tool_call', 'bash', {
                command,
            }, 'Executing command');
            requiresConfirmation = isDestructiveCommand(command);
            completionEstimate = 50;
        } else {
            nextAction = createAction('complete', undefined, undefined, 'Command execution completed');
            completionEstimate = 100;
        }
    } else {
        // Generic thinking step
        if (context.history.length === 0) {
            nextAction = createAction('think', undefined, undefined,
                `Analyzing task: "${context.task}". Need to determine the best approach.`);
            completionEstimate = 10;
        } else {
            nextAction = createAction('complete', undefined, undefined,
                'Task analysis complete - no specific action required');
            completionEstimate = 100;
        }
    }

    // Check if the required tool is available
    if (nextAction.tool && !isToolAvailable(nextAction.tool)) {
        nextAction = createAction('ask_user', undefined, undefined,
            `The tool "${nextAction.tool}" is not available on this platform. ` +
            `Please use the desktop app for this operation.`);
        requiresConfirmation = false;
    }

    return {
        nextAction,
        remainingSteps: [], // Would be populated by AI planning
        confidence: 0.8,
        requiresConfirmation,
        completionEstimate,
    };
}

/**
 * Execute an action
 */
async function executeAction(
    _context: AgentLoopContext,
    action: AgentAction
): Promise<ToolResult> {
    if (action.type === 'think') {
        return {
            success: true,
            output: action.reasoning || 'Thinking...',
        };
    }

    if (action.type === 'complete') {
        return {
            success: true,
            output: 'Task completed',
        };
    }

    if (action.type === 'ask_user') {
        return {
            success: true,
            output: action.reasoning || 'Waiting for user input',
        };
    }

    if (action.type === 'tool_call' && action.tool && action.toolArgs) {
        return await executeTool(action.tool, action.toolArgs);
    }

    return {
        success: false,
        output: '',
        error: `Unknown action type: ${action.type}`,
    };
}

/**
 * Request user confirmation for an action
 */
async function requestConfirmation(taskId: string, plan: AgentPlan): Promise<boolean> {
    return new Promise((resolve) => {
        useAutonomousLoopStore.setState(state => {
            const contexts = new Map(state.contexts);
            const ctx = contexts.get(taskId);
            if (ctx) {
                contexts.set(taskId, {
                    ...ctx,
                    status: 'awaiting_confirmation',
                    currentPlan: plan,
                    confirmationCallback: resolve,
                    updatedAt: Date.now(),
                });
            }
            return { contexts };
        });
    });
}

/**
 * Handle action errors
 */
async function handleError(
    _taskId: string,
    action: AgentAction,
    result: ToolResult
): Promise<boolean> {
    console.warn(`[AutonomousLoop] Action failed:`, action, result.error);

    // Simple retry logic - in real implementation would be smarter
    return false; // Don't continue on error for now
}

/**
 * Check if the task is complete
 */
function isTaskComplete(context: AgentLoopContext, lastAction: AgentAction): boolean {
    if (lastAction.type === 'complete') return true;
    if (context.progress >= 100) return true;
    return false;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createAction(
    type: AgentAction['type'],
    tool?: string,
    toolArgs?: Record<string, unknown>,
    reasoning?: string
): AgentAction {
    return {
        id: `action-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type,
        tool,
        toolArgs,
        reasoning,
        status: 'pending',
        timestamp: Date.now(),
    };
}

function updateStatus(
    taskId: string,
    status: AgentLoopStatus,
    updates?: Partial<AgentLoopContext>
): void {
    useAutonomousLoopStore.setState(state => {
        const contexts = new Map(state.contexts);
        const ctx = contexts.get(taskId);
        if (ctx) {
            contexts.set(taskId, {
                ...ctx,
                ...updates,
                status,
                updatedAt: Date.now(),
                ...(status === 'completed' ? { completedAt: Date.now() } : {}),
            });
        }
        return { contexts };
    });
}

function updateContext(taskId: string, updates: Partial<AgentLoopContext>): void {
    useAutonomousLoopStore.setState(state => {
        const contexts = new Map(state.contexts);
        const ctx = contexts.get(taskId);
        if (ctx) {
            contexts.set(taskId, { ...ctx, ...updates, updatedAt: Date.now() });
        }
        return { contexts };
    });
}

function addAction(taskId: string, action: AgentAction): void {
    useAutonomousLoopStore.setState(state => {
        const contexts = new Map(state.contexts);
        const ctx = contexts.get(taskId);
        if (ctx) {
            contexts.set(taskId, {
                ...ctx,
                history: [...ctx.history, action],
                updatedAt: Date.now(),
            });
        }
        return { contexts };
    });
}

function extractFilePath(task: string): string | null {
    // Simple regex to extract file paths
    const match = task.match(/[\/\w\-\.]+\.(ts|tsx|js|jsx|json|md|css|html)/i);
    return match ? match[0] : null;
}

function extractCommand(task: string): string | null {
    // Simple extraction - look for quoted commands or common patterns
    const quotedMatch = task.match(/"([^"]+)"|'([^']+)'|`([^`]+)`/);
    if (quotedMatch) return quotedMatch[1] || quotedMatch[2] || quotedMatch[3];

    // Look for common commands
    const cmdMatch = task.match(/(?:run|execute)\s+(\S+(?:\s+\S+)*)/i);
    return cmdMatch ? cmdMatch[1] : null;
}

function isDestructiveCommand(command: string): boolean {
    const destructivePatterns = [
        /\brm\b/, /\brmdir\b/, /\bdel\b/, /\bdelete\b/,
        /\bmv\b/, /\bmove\b/,
        /--force/, /-f\b/,
        /\bdrop\b/, /\btruncate\b/,
        /\bgit\s+push\b.*--force/,
        /\bgit\s+reset\b.*--hard/,
    ];

    return destructivePatterns.some(pattern => pattern.test(command.toLowerCase()));
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
    runAgentLoop,
    planNextStep,
    executeAction,
    isTaskComplete,
};
