/**
 * Phase 551-600: Task & Issue Tracking
 * 
 * Project management integration:
 * - Task boards
 * - Issue tracking
 * - Sprint management
 * - Time tracking
 * - Labels & priorities
 * - Assignments
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export type TaskStatus = 'backlog' | 'todo' | 'in-progress' | 'review' | 'done' | 'archived';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskType = 'feature' | 'bug' | 'improvement' | 'task' | 'epic';

export interface Task {
    id: string;
    title: string;
    description?: string;
    type: TaskType;
    status: TaskStatus;
    priority: TaskPriority;
    labels: string[];
    assignees: string[];
    reporter: string;
    createdAt: Date;
    updatedAt: Date;
    dueDate?: Date;
    estimatedHours?: number;
    loggedHours: number;
    parentId?: string;
    subtasks: string[];
    linkedFiles: string[];
    comments: TaskComment[];
    attachments: TaskAttachment[];
}

export interface TaskComment {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Date;
}

export interface TaskAttachment {
    id: string;
    name: string;
    url: string;
    size: number;
    mimeType: string;
}

export interface Sprint {
    id: string;
    name: string;
    goal?: string;
    startDate: Date;
    endDate: Date;
    status: 'planning' | 'active' | 'completed';
    taskIds: string[];
}

export interface Board {
    id: string;
    name: string;
    columns: BoardColumn[];
    filters: BoardFilters;
}

export interface BoardColumn {
    id: string;
    name: string;
    status: TaskStatus;
    taskIds: string[];
    limit?: number;
}

export interface BoardFilters {
    assignees: string[];
    labels: string[];
    types: TaskType[];
    searchQuery: string;
}

export interface TimeEntry {
    id: string;
    taskId: string;
    userId: string;
    hours: number;
    description?: string;
    date: Date;
}

export interface TaskManagementState {
    tasks: Task[];
    sprints: Sprint[];
    boards: Board[];
    labels: { id: string; name: string; color: string }[];
    timeEntries: TimeEntry[];
    activeSprintId: string | null;
    activeBoardId: string | null;

    // Task operations
    createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'loggedHours' | 'subtasks' | 'comments' | 'attachments'>) => string;
    updateTask: (id: string, updates: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    moveTask: (taskId: string, newStatus: TaskStatus) => void;
    addSubtask: (parentId: string, title: string) => string;
    linkFile: (taskId: string, filePath: string) => void;

    // Comments
    addComment: (taskId: string, content: string) => void;
    deleteComment: (taskId: string, commentId: string) => void;

    // Sprint operations
    createSprint: (sprint: Omit<Sprint, 'id' | 'status' | 'taskIds'>) => string;
    startSprint: (id: string) => void;
    completeSprint: (id: string) => void;
    addTaskToSprint: (sprintId: string, taskId: string) => void;
    removeTaskFromSprint: (sprintId: string, taskId: string) => void;

    // Board operations
    createBoard: (name: string) => string;
    setActiveBoard: (id: string | null) => void;

    // Time tracking
    logTime: (taskId: string, hours: number, description?: string) => void;
    getTaskTimeEntries: (taskId: string) => TimeEntry[];

    // Labels
    createLabel: (name: string, color: string) => string;
    deleteLabel: (id: string) => void;

    // Filtering
    getFilteredTasks: (filters: Partial<BoardFilters>) => Task[];
    getTasksByStatus: (status: TaskStatus) => Task[];
}

// =============================================================================
// STORE
// =============================================================================

const DEFAULT_LABELS = [
    { id: 'lbl_bug', name: 'Bug', color: '#ef4444' },
    { id: 'lbl_feature', name: 'Feature', color: '#3b82f6' },
    { id: 'lbl_enhancement', name: 'Enhancement', color: '#22c55e' },
    { id: 'lbl_documentation', name: 'Documentation', color: '#a855f7' },
    { id: 'lbl_urgent', name: 'Urgent', color: '#f97316' },
];

export const useTaskManagement = create<TaskManagementState>()(
    persist(
        (set, get) => ({
            tasks: [],
            sprints: [],
            boards: [],
            labels: DEFAULT_LABELS,
            timeEntries: [],
            activeSprintId: null,
            activeBoardId: null,

            createTask: (taskData) => {
                const id = `task_${Date.now()}`;
                const task: Task = {
                    ...taskData,
                    id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    loggedHours: 0,
                    subtasks: [],
                    comments: [],
                    attachments: [],
                };
                set(state => ({ tasks: [...state.tasks, task] }));
                return id;
            },

            updateTask: (id, updates) => {
                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
                    ),
                }));
            },

            deleteTask: (id) => {
                set(state => ({
                    tasks: state.tasks.filter(t => t.id !== id),
                    timeEntries: state.timeEntries.filter(e => e.taskId !== id),
                }));
            },

            moveTask: (taskId, newStatus) => {
                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date() } : t
                    ),
                }));
            },

            addSubtask: (parentId, title) => {
                const subtaskId = get().createTask({
                    title,
                    type: 'task',
                    status: 'todo',
                    priority: 'medium',
                    labels: [],
                    assignees: [],
                    reporter: 'current_user',
                    parentId,
                    linkedFiles: [],
                });
                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === parentId ? { ...t, subtasks: [...t.subtasks, subtaskId] } : t
                    ),
                }));
                return subtaskId;
            },

            linkFile: (taskId, filePath) => {
                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId && !t.linkedFiles.includes(filePath)
                            ? { ...t, linkedFiles: [...t.linkedFiles, filePath] }
                            : t
                    ),
                }));
            },

            addComment: (taskId, content) => {
                const comment: TaskComment = {
                    id: `comment_${Date.now()}`,
                    authorId: 'current_user',
                    authorName: 'You',
                    content,
                    createdAt: new Date(),
                };
                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId ? { ...t, comments: [...t.comments, comment] } : t
                    ),
                }));
            },

            deleteComment: (taskId, commentId) => {
                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId ? { ...t, comments: t.comments.filter(c => c.id !== commentId) } : t
                    ),
                }));
            },

            createSprint: (sprintData) => {
                const id = `sprint_${Date.now()}`;
                set(state => ({
                    sprints: [...state.sprints, { ...sprintData, id, status: 'planning', taskIds: [] }],
                }));
                return id;
            },

            startSprint: (id) => {
                set(state => ({
                    sprints: state.sprints.map(s => s.id === id ? { ...s, status: 'active' } : s),
                    activeSprintId: id,
                }));
            },

            completeSprint: (id) => {
                set(state => ({
                    sprints: state.sprints.map(s => s.id === id ? { ...s, status: 'completed' } : s),
                    activeSprintId: state.activeSprintId === id ? null : state.activeSprintId,
                }));
            },

            addTaskToSprint: (sprintId, taskId) => {
                set(state => ({
                    sprints: state.sprints.map(s =>
                        s.id === sprintId && !s.taskIds.includes(taskId)
                            ? { ...s, taskIds: [...s.taskIds, taskId] }
                            : s
                    ),
                }));
            },

            removeTaskFromSprint: (sprintId, taskId) => {
                set(state => ({
                    sprints: state.sprints.map(s =>
                        s.id === sprintId ? { ...s, taskIds: s.taskIds.filter(id => id !== taskId) } : s
                    ),
                }));
            },

            createBoard: (name) => {
                const id = `board_${Date.now()}`;
                const board: Board = {
                    id,
                    name,
                    columns: [
                        { id: 'col_backlog', name: 'Backlog', status: 'backlog', taskIds: [] },
                        { id: 'col_todo', name: 'To Do', status: 'todo', taskIds: [] },
                        { id: 'col_progress', name: 'In Progress', status: 'in-progress', taskIds: [], limit: 5 },
                        { id: 'col_review', name: 'Review', status: 'review', taskIds: [] },
                        { id: 'col_done', name: 'Done', status: 'done', taskIds: [] },
                    ],
                    filters: { assignees: [], labels: [], types: [], searchQuery: '' },
                };
                set(state => ({ boards: [...state.boards, board], activeBoardId: id }));
                return id;
            },

            setActiveBoard: (id) => set({ activeBoardId: id }),

            logTime: (taskId, hours, description) => {
                const entry: TimeEntry = {
                    id: `time_${Date.now()}`,
                    taskId,
                    userId: 'current_user',
                    hours,
                    description,
                    date: new Date(),
                };
                set(state => ({
                    timeEntries: [...state.timeEntries, entry],
                    tasks: state.tasks.map(t =>
                        t.id === taskId ? { ...t, loggedHours: t.loggedHours + hours } : t
                    ),
                }));
            },

            getTaskTimeEntries: (taskId) => get().timeEntries.filter(e => e.taskId === taskId),

            createLabel: (name, color) => {
                const id = `lbl_${Date.now()}`;
                set(state => ({ labels: [...state.labels, { id, name, color }] }));
                return id;
            },

            deleteLabel: (id) => {
                set(state => ({ labels: state.labels.filter(l => l.id !== id) }));
            },

            getFilteredTasks: (filters) => {
                const { tasks } = get();
                return tasks.filter(task => {
                    if (filters.assignees?.length && !filters.assignees.some(a => task.assignees.includes(a))) return false;
                    if (filters.labels?.length && !filters.labels.some(l => task.labels.includes(l))) return false;
                    if (filters.types?.length && !filters.types.includes(task.type)) return false;
                    if (filters.searchQuery && !task.title.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
                    return true;
                });
            },

            getTasksByStatus: (status) => get().tasks.filter(t => t.status === status),
        }),
        { name: 'sprintloop-tasks' }
    )
);
