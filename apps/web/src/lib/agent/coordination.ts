/**
 * Multi-Agent Coordination Panel
 * 
 * Phase 115: Visual interface for 8 parallel agents
 * Task assignment, progress tracking, conflict resolution
 * Source: Cursor 2.0
 */

import { create } from 'zustand';

export interface AgentInstance {
    id: string;
    name: string;
    role: AgentRole;
    status: AgentStatus;
    worktree?: string; // Git worktree path for isolation
    currentTask?: AgentTask;
    history: AgentTask[];
    metrics: AgentMetrics;
    createdAt: number;
    lastActiveAt: number;
}

export type AgentRole =
    | 'planner'
    | 'coder'
    | 'reviewer'
    | 'tester'
    | 'debugger'
    | 'documenter'
    | 'refactorer'
    | 'general';

export type AgentStatus =
    | 'idle'
    | 'planning'
    | 'working'
    | 'waiting'
    | 'paused'
    | 'completed'
    | 'error';

export interface AgentTask {
    id: string;
    agentId: string;
    type: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    dependencies: string[]; // Task IDs this depends on
    blockedBy?: string; // Task ID blocking this
    files: string[];
    startedAt?: number;
    completedAt?: number;
    error?: string;
}

export interface AgentMetrics {
    tasksCompleted: number;
    tokensUsed: number;
    totalCost: number;
    avgTaskTime: number;
    successRate: number;
}

export interface CoordinationEvent {
    id: string;
    timestamp: number;
    type: 'task_assigned' | 'task_completed' | 'conflict_detected' | 'conflict_resolved' | 'agent_spawned' | 'agent_terminated';
    agentId?: string;
    taskId?: string;
    message: string;
    details?: Record<string, unknown>;
}

export interface FileConflict {
    id: string;
    path: string;
    agents: string[];
    type: 'concurrent_edit' | 'lock_contention';
    resolution?: 'merged' | 'agent_1_wins' | 'agent_2_wins' | 'manual';
    resolvedAt?: number;
}

interface CoordinationState {
    agents: Map<string, AgentInstance>;
    maxAgents: number;
    pendingTasks: AgentTask[];
    events: CoordinationEvent[];
    conflicts: FileConflict[];

    // Agent management
    spawnAgent: (role: AgentRole, name?: string) => string;
    terminateAgent: (agentId: string) => void;
    pauseAgent: (agentId: string) => void;
    resumeAgent: (agentId: string) => void;

    // Task management
    assignTask: (task: Omit<AgentTask, 'id' | 'status'>, agentId?: string) => string;
    cancelTask: (taskId: string) => void;
    redistributeTasks: () => void;

    // Conflict resolution
    detectConflicts: () => FileConflict[];
    resolveConflict: (conflictId: string, resolution: FileConflict['resolution']) => void;

    // Queries
    getAgent: (agentId: string) => AgentInstance | undefined;
    getAvailableAgents: () => AgentInstance[];
    getAgentsByRole: (role: AgentRole) => AgentInstance[];

    // Events
    addEvent: (event: Omit<CoordinationEvent, 'id' | 'timestamp'>) => void;
}

const ROLE_NAMES: Record<AgentRole, string> = {
    planner: 'Architect',
    coder: 'Developer',
    reviewer: 'Reviewer',
    tester: 'QA Engineer',
    debugger: 'Debugger',
    documenter: 'Technical Writer',
    refactorer: 'Optimizer',
    general: 'Assistant',
};

export const useCoordinationStore = create<CoordinationState>((set, get) => ({
    agents: new Map(),
    maxAgents: 8,
    pendingTasks: [],
    events: [],
    conflicts: [],

    spawnAgent: (role, name) => {
        const { agents, maxAgents } = get();

        if (agents.size >= maxAgents) {
            throw new Error(`Maximum agents (${maxAgents}) reached`);
        }

        const id = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
        const agentName = name || `${ROLE_NAMES[role]} ${agents.size + 1}`;

        const agent: AgentInstance = {
            id,
            name: agentName,
            role,
            status: 'idle',
            history: [],
            metrics: {
                tasksCompleted: 0,
                tokensUsed: 0,
                totalCost: 0,
                avgTaskTime: 0,
                successRate: 100,
            },
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
        };

        set(state => {
            const newAgents = new Map(state.agents);
            newAgents.set(id, agent);
            return { agents: newAgents };
        });

        get().addEvent({
            type: 'agent_spawned',
            agentId: id,
            message: `Agent "${agentName}" (${role}) spawned`,
        });

        return id;
    },

    terminateAgent: (agentId) => {
        const agent = get().agents.get(agentId);
        if (!agent) return;

        set(state => {
            const newAgents = new Map(state.agents);
            newAgents.delete(agentId);
            return { agents: newAgents };
        });

        get().addEvent({
            type: 'agent_terminated',
            agentId,
            message: `Agent "${agent.name}" terminated`,
        });
    },

    pauseAgent: (agentId) => {
        set(state => {
            const agents = new Map(state.agents);
            const agent = agents.get(agentId);
            if (agent) {
                agents.set(agentId, { ...agent, status: 'paused' });
            }
            return { agents };
        });
    },

    resumeAgent: (agentId) => {
        set(state => {
            const agents = new Map(state.agents);
            const agent = agents.get(agentId);
            if (agent) {
                agents.set(agentId, { ...agent, status: 'idle' });
            }
            return { agents };
        });
    },

    assignTask: (task, agentId) => {
        const taskId = `task-${Date.now()}`;
        const newTask: AgentTask = {
            ...task,
            id: taskId,
            status: 'pending',
        };

        // Auto-assign if no agent specified
        const targetAgentId = agentId || get().getAvailableAgents()[0]?.id;

        if (targetAgentId) {
            newTask.agentId = targetAgentId;
            newTask.status = 'in_progress';
            newTask.startedAt = Date.now();

            set(state => {
                const agents = new Map(state.agents);
                const agent = agents.get(targetAgentId);
                if (agent) {
                    agents.set(targetAgentId, {
                        ...agent,
                        status: 'working',
                        currentTask: newTask,
                        lastActiveAt: Date.now(),
                    });
                }
                return { agents };
            });

            get().addEvent({
                type: 'task_assigned',
                agentId: targetAgentId,
                taskId,
                message: `Task "${task.description}" assigned to agent`,
            });
        } else {
            set(state => ({
                pendingTasks: [...state.pendingTasks, newTask],
            }));
        }

        return taskId;
    },

    cancelTask: (taskId) => {
        set(state => {
            // Remove from pending
            const pendingTasks = state.pendingTasks.filter(t => t.id !== taskId);

            // Cancel in agents
            const agents = new Map(state.agents);
            for (const [id, agent] of agents) {
                if (agent.currentTask?.id === taskId) {
                    agents.set(id, {
                        ...agent,
                        currentTask: undefined,
                        status: 'idle',
                    });
                }
            }

            return { pendingTasks, agents };
        });
    },

    redistributeTasks: () => {
        const { pendingTasks, getAvailableAgents, assignTask } = get();
        const available = getAvailableAgents();

        for (const agent of available) {
            const task = pendingTasks.shift();
            if (task) {
                assignTask(task, agent.id);
            } else {
                break;
            }
        }
    },

    detectConflicts: () => {
        const { agents } = get();
        const fileAccess = new Map<string, string[]>();
        const conflicts: FileConflict[] = [];

        // Track which files each agent is touching
        for (const [agentId, agent] of agents) {
            if (agent.currentTask) {
                for (const file of agent.currentTask.files) {
                    const accessing = fileAccess.get(file) || [];
                    accessing.push(agentId);
                    fileAccess.set(file, accessing);
                }
            }
        }

        // Find conflicts
        for (const [path, agentIds] of fileAccess) {
            if (agentIds.length > 1) {
                conflicts.push({
                    id: `conflict-${Date.now()}-${path}`,
                    path,
                    agents: agentIds,
                    type: 'concurrent_edit',
                });
            }
        }

        set({ conflicts });
        return conflicts;
    },

    resolveConflict: (conflictId, resolution) => {
        set(state => ({
            conflicts: state.conflicts.map(c =>
                c.id === conflictId
                    ? { ...c, resolution, resolvedAt: Date.now() }
                    : c
            ),
        }));

        get().addEvent({
            type: 'conflict_resolved',
            message: `Conflict resolved with strategy: ${resolution}`,
        });
    },

    getAgent: (agentId) => {
        return get().agents.get(agentId);
    },

    getAvailableAgents: () => {
        return Array.from(get().agents.values()).filter(
            a => a.status === 'idle'
        );
    },

    getAgentsByRole: (role) => {
        return Array.from(get().agents.values()).filter(a => a.role === role);
    },

    addEvent: (event) => {
        const newEvent: CoordinationEvent = {
            ...event,
            id: `event-${Date.now()}`,
            timestamp: Date.now(),
        };

        set(state => ({
            events: [newEvent, ...state.events].slice(0, 100), // Keep last 100
        }));
    },
}));

/**
 * Initialize default agent pool
 */
export function initializeAgentPool(config?: {
    roles?: AgentRole[];
    count?: number;
}): string[] {
    const store = useCoordinationStore.getState();
    const roles = config?.roles || ['planner', 'coder', 'reviewer'];
    const count = config?.count || 3;

    const agentIds: string[] = [];
    for (let i = 0; i < count; i++) {
        const role = roles[i % roles.length];
        agentIds.push(store.spawnAgent(role));
    }

    return agentIds;
}

/**
 * Get coordination dashboard summary
 */
export function getCoordinationSummary(): {
    activeAgents: number;
    pendingTasks: number;
    completedTasks: number;
    conflicts: number;
    totalCost: number;
} {
    const state = useCoordinationStore.getState();

    let completedTasks = 0;
    let totalCost = 0;

    for (const agent of state.agents.values()) {
        completedTasks += agent.metrics.tasksCompleted;
        totalCost += agent.metrics.totalCost;
    }

    return {
        activeAgents: Array.from(state.agents.values()).filter(a => a.status === 'working').length,
        pendingTasks: state.pendingTasks.length,
        completedTasks,
        conflicts: state.conflicts.filter(c => !c.resolvedAt).length,
        totalCost,
    };
}
