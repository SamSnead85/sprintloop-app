/**
 * SprintLoop Kanban Store
 * 
 * Inspired by vibe-kanban: AI agent orchestration with Kanban board UI.
 * 
 * Key Features:
 * - Visual task board with columns (To Do, In Progress, In Review, Done)
 * - AI agent assignment per task
 * - Parallel task execution tracking
 * - Git worktree isolation (conceptual - tracked per task)
 * - Built-in code review flow
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentRole } from '../orchestrator';

export type KanbanColumn = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface KanbanTask {
    id: string;
    title: string;
    description: string;
    column: KanbanColumn;
    priority: 'low' | 'medium' | 'high' | 'critical';

    // AI Agent Assignment
    assignedAgent?: AgentRole;
    agentModel?: string;

    // Execution State
    status: 'pending' | 'running' | 'awaiting_review' | 'completed' | 'failed';
    progress: number; // 0-100

    // Git Integration
    gitBranch?: string;
    gitWorktree?: string;
    commits: GitCommit[];

    // Code Review
    reviewStatus?: 'pending' | 'approved' | 'changes_requested';
    reviewComments: ReviewComment[];
    diffUrl?: string;

    // Metadata
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
    estimatedMinutes?: number;
    actualMinutes?: number;

    // Labels & Organization
    labels: string[];
    projectId?: string;
}

export interface GitCommit {
    sha: string;
    message: string;
    author: string;
    timestamp: number;
    filesChanged: number;
}

export interface ReviewComment {
    id: string;
    author: string;
    content: string;
    timestamp: number;
    lineNumber?: number;
    filePath?: string;
    resolved: boolean;
}

export interface KanbanBoard {
    id: string;
    name: string;
    description?: string;
    columns: KanbanColumn[];
    taskIds: string[]; // Task IDs in this board
    createdAt: number;
}

interface KanbanStore {
    // Boards
    boards: KanbanBoard[];
    activeBoardId: string | null;

    // Tasks
    tasks: Map<string, KanbanTask>;

    // Dev Servers (vibe-kanban feature)
    devServers: DevServer[];

    // Board Actions
    createBoard: (name: string, description?: string) => KanbanBoard;
    deleteBoard: (boardId: string) => void;
    setActiveBoard: (boardId: string) => void;

    // Task Actions
    createTask: (boardId: string, task: Partial<KanbanTask>) => KanbanTask;
    updateTask: (taskId: string, updates: Partial<KanbanTask>) => void;
    deleteTask: (taskId: string) => void;
    moveTask: (taskId: string, toColumn: KanbanColumn) => void;

    // Agent Assignment
    assignAgent: (taskId: string, agent: AgentRole, model?: string) => void;
    unassignAgent: (taskId: string) => void;
    startTask: (taskId: string) => void;
    completeTask: (taskId: string) => void;

    // Code Review
    submitForReview: (taskId: string) => void;
    approveReview: (taskId: string) => void;
    requestChanges: (taskId: string, comment: string) => void;
    addReviewComment: (taskId: string, comment: Omit<ReviewComment, 'id' | 'timestamp'>) => void;

    // Dev Server Management
    startDevServer: (name: string, command: string, port: number) => void;
    stopDevServer: (serverId: string) => void;

    // Queries
    getTasksByColumn: (column: KanbanColumn) => KanbanTask[];
    getTasksByAgent: (agent: AgentRole) => KanbanTask[];
    getActiveBoard: () => KanbanBoard | null;
    getBoardTasks: (boardId: string) => KanbanTask[];
}

export interface DevServer {
    id: string;
    name: string;
    command: string;
    port: number;
    status: 'starting' | 'running' | 'stopped' | 'error';
    pid?: number;
    startedAt?: number;
    url?: string;
}

export const useKanbanStore = create<KanbanStore>()(
    persist(
        (set, get) => ({
            boards: [],
            activeBoardId: null,
            tasks: new Map(),
            devServers: [],

            // Board Actions
            createBoard: (name, description) => {
                const board: KanbanBoard = {
                    id: `board-${Date.now()}`,
                    name,
                    description,
                    columns: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
                    taskIds: [],
                    createdAt: Date.now(),
                };

                set((state) => ({
                    boards: [...state.boards, board],
                    activeBoardId: board.id,
                }));

                return board;
            },

            deleteBoard: (boardId) => {
                set((state) => ({
                    boards: state.boards.filter(b => b.id !== boardId),
                    activeBoardId: state.activeBoardId === boardId ? null : state.activeBoardId,
                }));
            },

            setActiveBoard: (boardId) => {
                set({ activeBoardId: boardId });
            },

            // Task Actions
            createTask: (boardId, taskData) => {
                const task: KanbanTask = {
                    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                    title: taskData.title || 'New Task',
                    description: taskData.description || '',
                    column: taskData.column || 'backlog',
                    priority: taskData.priority || 'medium',
                    status: 'pending',
                    progress: 0,
                    commits: [],
                    reviewComments: [],
                    labels: taskData.labels || [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    ...taskData,
                };

                set((state) => {
                    const newTasks = new Map(state.tasks);
                    newTasks.set(task.id, task);

                    const boards = state.boards.map(b =>
                        b.id === boardId
                            ? { ...b, taskIds: [...b.taskIds, task.id] }
                            : b
                    );

                    return { tasks: newTasks, boards };
                });

                return task;
            },

            updateTask: (taskId, updates) => {
                set((state) => {
                    const newTasks = new Map(state.tasks);
                    const task = newTasks.get(taskId);
                    if (task) {
                        newTasks.set(taskId, { ...task, ...updates, updatedAt: Date.now() });
                    }
                    return { tasks: newTasks };
                });
            },

            deleteTask: (taskId) => {
                set((state) => {
                    const newTasks = new Map(state.tasks);
                    newTasks.delete(taskId);

                    const boards = state.boards.map(b => ({
                        ...b,
                        taskIds: b.taskIds.filter(id => id !== taskId),
                    }));

                    return { tasks: newTasks, boards };
                });
            },

            moveTask: (taskId, toColumn) => {
                const { updateTask } = get();
                updateTask(taskId, { column: toColumn });

                // Auto-update status based on column
                if (toColumn === 'in_progress') {
                    updateTask(taskId, { status: 'running' });
                } else if (toColumn === 'in_review') {
                    updateTask(taskId, { status: 'awaiting_review' });
                } else if (toColumn === 'done') {
                    updateTask(taskId, { status: 'completed', completedAt: Date.now() });
                }
            },

            // Agent Assignment
            assignAgent: (taskId, agent, model) => {
                const { updateTask } = get();
                updateTask(taskId, {
                    assignedAgent: agent,
                    agentModel: model,
                    gitBranch: `agent/${agent}/${taskId.slice(0, 8)}`,
                });
            },

            unassignAgent: (taskId) => {
                const { updateTask } = get();
                updateTask(taskId, { assignedAgent: undefined, agentModel: undefined });
            },

            startTask: (taskId) => {
                const { moveTask, updateTask } = get();
                moveTask(taskId, 'in_progress');
                updateTask(taskId, { status: 'running', progress: 0 });
            },

            completeTask: (taskId) => {
                const { moveTask, updateTask } = get();
                moveTask(taskId, 'done');
                updateTask(taskId, {
                    status: 'completed',
                    progress: 100,
                    completedAt: Date.now(),
                });
            },

            // Code Review
            submitForReview: (taskId) => {
                const { moveTask, updateTask } = get();
                moveTask(taskId, 'in_review');
                updateTask(taskId, {
                    status: 'awaiting_review',
                    reviewStatus: 'pending',
                });
            },

            approveReview: (taskId) => {
                const { updateTask } = get();
                updateTask(taskId, { reviewStatus: 'approved' });
            },

            requestChanges: (taskId, comment) => {
                const { updateTask, addReviewComment } = get();
                updateTask(taskId, { reviewStatus: 'changes_requested' });
                addReviewComment(taskId, {
                    author: 'You',
                    content: comment,
                    resolved: false,
                });
            },

            addReviewComment: (taskId, commentData) => {
                set((state) => {
                    const newTasks = new Map(state.tasks);
                    const task = newTasks.get(taskId);
                    if (task) {
                        const comment: ReviewComment = {
                            id: `comment-${Date.now()}`,
                            timestamp: Date.now(),
                            ...commentData,
                        };
                        newTasks.set(taskId, {
                            ...task,
                            reviewComments: [...task.reviewComments, comment],
                            updatedAt: Date.now(),
                        });
                    }
                    return { tasks: newTasks };
                });
            },

            // Dev Server Management
            startDevServer: (name, command, port) => {
                const server: DevServer = {
                    id: `server-${Date.now()}`,
                    name,
                    command,
                    port,
                    status: 'starting',
                    startedAt: Date.now(),
                    url: `http://localhost:${port}`,
                };

                set((state) => ({
                    devServers: [...state.devServers, server],
                }));

                // Simulate server starting (in real impl, would spawn process)
                setTimeout(() => {
                    set((state) => ({
                        devServers: state.devServers.map(s =>
                            s.id === server.id ? { ...s, status: 'running' } : s
                        ),
                    }));
                }, 2000);
            },

            stopDevServer: (serverId) => {
                set((state) => ({
                    devServers: state.devServers.map(s =>
                        s.id === serverId ? { ...s, status: 'stopped' } : s
                    ),
                }));
            },

            // Queries
            getTasksByColumn: (column) => {
                const { tasks } = get();
                return Array.from(tasks.values()).filter(t => t.column === column);
            },

            getTasksByAgent: (agent) => {
                const { tasks } = get();
                return Array.from(tasks.values()).filter(t => t.assignedAgent === agent);
            },

            getActiveBoard: () => {
                const { boards, activeBoardId } = get();
                return boards.find(b => b.id === activeBoardId) || null;
            },

            getBoardTasks: (boardId) => {
                const { boards, tasks } = get();
                const board = boards.find(b => b.id === boardId);
                if (!board) return [];
                return board.taskIds.map(id => tasks.get(id)).filter(Boolean) as KanbanTask[];
            },
        }),
        {
            name: 'sprintloop:kanban-state',
            partialize: (state) => ({
                boards: state.boards,
                activeBoardId: state.activeBoardId,
                tasks: Array.from(state.tasks.entries()),
                devServers: state.devServers,
            }),
            merge: (persistedState, currentState) => {
                const state = persistedState as Partial<typeof currentState> & { tasks?: [string, KanbanTask][] };
                return {
                    ...currentState,
                    ...state,
                    tasks: new Map(state.tasks || []),
                };
            },
        }
    )
);
