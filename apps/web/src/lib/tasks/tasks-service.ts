/**
 * Tasks Service
 * 
 * Manages IDE tasks like build, test, linting, and custom scripts.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export type TaskType = 'build' | 'test' | 'lint' | 'format' | 'custom' | 'watch';
export type TaskStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled';

export interface Task {
    id: string;
    name: string;
    type: TaskType;
    command: string;
    cwd?: string;
    status: TaskStatus;
    output: string[];
    startTime?: number;
    endTime?: number;
    exitCode?: number;
    isDefault?: boolean;
    isBackground?: boolean;
    problemMatcher?: string;
}

export interface TaskDefinition {
    name: string;
    type: TaskType;
    command: string;
    cwd?: string;
    isDefault?: boolean;
    dependsOn?: string[];
    problemMatcher?: string;
    group?: 'build' | 'test';
    presentation?: {
        reveal?: 'always' | 'never' | 'silent';
        panel?: 'dedicated' | 'shared';
        clear?: boolean;
    };
}

export interface TaskState {
    tasks: Task[];
    taskDefinitions: TaskDefinition[];
    runningTasks: Set<string>;
    recentTasks: string[];

    // Task operations
    runTask: (taskId: string) => Promise<void>;
    runTaskByName: (name: string) => Promise<void>;
    stopTask: (taskId: string) => void;
    restartTask: (taskId: string) => Promise<void>;

    // Task management
    addTaskDefinition: (definition: TaskDefinition) => void;
    removeTaskDefinition: (name: string) => void;
    getTask: (taskId: string) => Task | undefined;
    getTaskByName: (name: string) => Task | undefined;

    // Shortcuts
    runBuildTask: () => Promise<void>;
    runTestTask: () => Promise<void>;

    // History
    clearTaskOutput: (taskId: string) => void;
    getRecentTasks: () => TaskDefinition[];
}

// =============================================================================
// BUILT-IN TASKS
// =============================================================================

const BUILT_IN_TASKS: TaskDefinition[] = [
    {
        name: 'Build',
        type: 'build',
        command: 'npm run build',
        isDefault: true,
        group: 'build',
        problemMatcher: '$tsc',
    },
    {
        name: 'Dev Server',
        type: 'watch',
        command: 'npm run dev',
        isDefault: false,
    },
    {
        name: 'Test',
        type: 'test',
        command: 'npm test',
        isDefault: true,
        group: 'test',
    },
    {
        name: 'Test Watch',
        type: 'test',
        command: 'npm run test:watch',
    },
    {
        name: 'Lint',
        type: 'lint',
        command: 'npm run lint',
        problemMatcher: '$eslint-stylish',
    },
    {
        name: 'Lint Fix',
        type: 'lint',
        command: 'npm run lint:fix',
    },
    {
        name: 'Type Check',
        type: 'build',
        command: 'npx tsc --noEmit',
        problemMatcher: '$tsc',
    },
    {
        name: 'Format',
        type: 'format',
        command: 'npm run format',
    },
    {
        name: 'Clean',
        type: 'custom',
        command: 'rm -rf node_modules dist .next',
    },
    {
        name: 'Install',
        type: 'custom',
        command: 'npm install',
    },
];

// =============================================================================
// TASKS STORE
// =============================================================================

export const useTasksService = create<TaskState>()(
    persist(
        (set, get) => ({
            tasks: [],
            taskDefinitions: BUILT_IN_TASKS,
            runningTasks: new Set(),
            recentTasks: [],

            runTask: async (taskId) => {
                const task = get().tasks.find(t => t.id === taskId);
                if (!task) return;

                console.log('[Tasks] Running task:', task.name);

                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId
                            ? { ...t, status: 'running' as TaskStatus, startTime: Date.now(), output: [], exitCode: undefined }
                            : t
                    ),
                    runningTasks: new Set([...state.runningTasks, taskId]),
                }));

                // Simulate task execution
                await simulateTaskExecution(taskId, task.command, (output) => {
                    set(state => ({
                        tasks: state.tasks.map(t =>
                            t.id === taskId
                                ? { ...t, output: [...t.output, output] }
                                : t
                        ),
                    }));
                });

                // Complete task
                const success = Math.random() > 0.1;
                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId
                            ? {
                                ...t,
                                status: success ? 'success' : 'error',
                                endTime: Date.now(),
                                exitCode: success ? 0 : 1,
                            }
                            : t
                    ),
                    runningTasks: new Set([...state.runningTasks].filter(id => id !== taskId)),
                    recentTasks: [task.name, ...state.recentTasks.filter(n => n !== task.name)].slice(0, 5),
                }));
            },

            runTaskByName: async (name) => {
                const definition = get().taskDefinitions.find(d => d.name === name);
                if (!definition) return;

                // Create a task instance
                const task: Task = {
                    id: `task_${Date.now()}`,
                    name: definition.name,
                    type: definition.type,
                    command: definition.command,
                    cwd: definition.cwd,
                    status: 'idle',
                    output: [],
                    isDefault: definition.isDefault,
                    problemMatcher: definition.problemMatcher,
                };

                set(state => ({
                    tasks: [...state.tasks, task],
                }));

                await get().runTask(task.id);
            },

            stopTask: (taskId) => {
                console.log('[Tasks] Stopping task:', taskId);

                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId
                            ? { ...t, status: 'cancelled' as TaskStatus, endTime: Date.now() }
                            : t
                    ),
                    runningTasks: new Set([...state.runningTasks].filter(id => id !== taskId)),
                }));
            },

            restartTask: async (taskId) => {
                get().stopTask(taskId);
                await new Promise(resolve => setTimeout(resolve, 100));
                await get().runTask(taskId);
            },

            addTaskDefinition: (definition) => {
                set(state => ({
                    taskDefinitions: [...state.taskDefinitions.filter(d => d.name !== definition.name), definition],
                }));
            },

            removeTaskDefinition: (name) => {
                set(state => ({
                    taskDefinitions: state.taskDefinitions.filter(d => d.name !== name),
                }));
            },

            getTask: (taskId) => get().tasks.find(t => t.id === taskId),

            getTaskByName: (name) => get().tasks.find(t => t.name === name),

            runBuildTask: async () => {
                const buildTask = get().taskDefinitions.find(d => d.group === 'build' && d.isDefault);
                if (buildTask) {
                    await get().runTaskByName(buildTask.name);
                }
            },

            runTestTask: async () => {
                const testTask = get().taskDefinitions.find(d => d.group === 'test' && d.isDefault);
                if (testTask) {
                    await get().runTaskByName(testTask.name);
                }
            },

            clearTaskOutput: (taskId) => {
                set(state => ({
                    tasks: state.tasks.map(t =>
                        t.id === taskId ? { ...t, output: [] } : t
                    ),
                }));
            },

            getRecentTasks: () => {
                const recent = get().recentTasks;
                return get().taskDefinitions.filter(d => recent.includes(d.name));
            },
        }),
        {
            name: 'sprintloop-tasks',
            partialize: (state) => ({
                taskDefinitions: state.taskDefinitions.filter(d => !BUILT_IN_TASKS.some(b => b.name === d.name)),
                recentTasks: state.recentTasks,
            }),
        }
    )
);

// =============================================================================
// SIMULATION HELPERS
// =============================================================================

async function simulateTaskExecution(
    _taskId: string,
    command: string,
    onOutput: (line: string) => void
): Promise<void> {
    onOutput(`$ ${command}`);
    onOutput('');

    const outputs = [
        '> sprintloop@0.1.0 build',
        '> vite build',
        '',
        'vite v5.0.0 building for production...',
        '✓ 42 modules transformed.',
        'dist/index.html            0.46 kB │ gzip:  0.30 kB',
        'dist/assets/index-abc.css  1.24 kB │ gzip:  0.54 kB',
        'dist/assets/index-xyz.js   124.12 kB │ gzip:  40.23 kB',
        '',
        '✓ built in 1.23s',
    ];

    for (const line of outputs) {
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        onOutput(line);
    }
}

// =============================================================================
// UTILITIES
// =============================================================================

export function getTaskIcon(type: TaskType): string {
    const icons: Record<TaskType, string> = {
        build: '🔨',
        test: '🧪',
        lint: '🔍',
        format: '✨',
        custom: '⚙️',
        watch: '👁️',
    };
    return icons[type];
}

export function getTaskStatusColor(status: TaskStatus): string {
    const colors: Record<TaskStatus, string> = {
        idle: '#888',
        running: '#3b82f6',
        success: '#22c55e',
        error: '#ef4444',
        cancelled: '#f59e0b',
    };
    return colors[status];
}
