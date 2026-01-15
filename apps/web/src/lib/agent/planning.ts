/**
 * Interactive Planning Mode
 * 
 * Phase 110: Live markdown file of tasks and goals
 * Human-AI collaborative roadmap editing
 * Source: Windsurf Planning Mode, Devin Interactive Planning
 */

import { create } from 'zustand';

export interface PlanningSession {
    id: string;
    title: string;
    goal: string;
    status: 'planning' | 'in_progress' | 'completed' | 'paused';
    plan: PlanDocument;
    history: PlanRevision[];
    collaborators: Collaborator[];
    createdAt: number;
    updatedAt: number;
}

export interface PlanDocument {
    content: string;
    tasks: PlanTask[];
    sections: PlanSection[];
    lastEditedBy: 'user' | 'agent';
    lastEditedAt: number;
}

export interface PlanTask {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked' | 'skipped';
    priority: 'low' | 'medium' | 'high' | 'critical';
    estimatedTime?: string;
    dependencies: string[];
    assignedTo: 'user' | 'agent' | 'both';
    completedAt?: number;
    notes?: string;
}

export interface PlanSection {
    id: string;
    title: string;
    content: string;
    tasks: string[];
    order: number;
}

export interface PlanRevision {
    id: string;
    timestamp: number;
    author: 'user' | 'agent';
    description: string;
    diff: string;
}

export interface Collaborator {
    type: 'user' | 'agent';
    name: string;
    role: string;
}

interface PlanningState {
    sessions: PlanningSession[];
    activeSessionId: string | null;
    viewMode: 'edit' | 'preview' | 'split';

    // Session management
    createSession: (goal: string, title?: string) => string;
    updateSession: (id: string, updates: Partial<PlanningSession>) => void;
    deleteSession: (id: string) => void;
    setActiveSession: (id: string | null) => void;

    // Plan editing
    updatePlanContent: (sessionId: string, content: string, author: 'user' | 'agent') => void;

    // Task management
    addTask: (sessionId: string, task: Omit<PlanTask, 'id'>) => string;
    updateTask: (sessionId: string, taskId: string, updates: Partial<PlanTask>) => void;
    deleteTask: (sessionId: string, taskId: string) => void;
    reorderTasks: (sessionId: string, taskIds: string[]) => void;

    // Getters
    getSession: (id: string) => PlanningSession | undefined;
    getActiveSession: () => PlanningSession | undefined;
    getTasksByStatus: (sessionId: string, status: PlanTask['status']) => PlanTask[];

    // View mode
    setViewMode: (mode: 'edit' | 'preview' | 'split') => void;
}

export const usePlanningStore = create<PlanningState>((set, get) => ({
    sessions: [],
    activeSessionId: null,
    viewMode: 'split',

    createSession: (goal, title) => {
        const id = `plan-${Date.now()}`;
        const session: PlanningSession = {
            id,
            title: title || `Plan: ${goal.slice(0, 50)}`,
            goal,
            status: 'planning',
            plan: {
                content: generateInitialPlan(goal),
                tasks: [],
                sections: [],
                lastEditedBy: 'agent',
                lastEditedAt: Date.now(),
            },
            history: [],
            collaborators: [
                { type: 'user', name: 'Developer', role: 'Lead' },
                { type: 'agent', name: 'SprintLoop', role: 'Assistant' },
            ],
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        set(state => ({
            sessions: [...state.sessions, session],
            activeSessionId: id,
        }));

        return id;
    },

    updateSession: (id, updates) => {
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
            ),
        }));
    },

    deleteSession: (id) => {
        set(state => ({
            sessions: state.sessions.filter(s => s.id !== id),
            activeSessionId: state.activeSessionId === id ? null : state.activeSessionId,
        }));
    },

    setActiveSession: (id) => {
        set({ activeSessionId: id });
    },

    updatePlanContent: (sessionId, content, author) => {
        set(state => ({
            sessions: state.sessions.map(s => {
                if (s.id !== sessionId) return s;

                const revision: PlanRevision = {
                    id: `rev-${Date.now()}`,
                    timestamp: Date.now(),
                    author,
                    description: `${author === 'user' ? 'User' : 'Agent'} edited plan`,
                    diff: '', // Would compute actual diff
                };

                return {
                    ...s,
                    plan: {
                        ...s.plan,
                        content,
                        tasks: extractTasksFromMarkdown(content),
                        lastEditedBy: author,
                        lastEditedAt: Date.now(),
                    },
                    history: [...s.history, revision],
                    updatedAt: Date.now(),
                };
            }),
        }));
    },

    addTask: (sessionId, task) => {
        const taskId = `task-${Date.now()}`;
        const newTask: PlanTask = { ...task, id: taskId };

        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === sessionId
                    ? {
                        ...s,
                        plan: {
                            ...s.plan,
                            tasks: [...s.plan.tasks, newTask],
                        },
                        updatedAt: Date.now(),
                    }
                    : s
            ),
        }));

        return taskId;
    },

    updateTask: (sessionId, taskId, updates) => {
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === sessionId
                    ? {
                        ...s,
                        plan: {
                            ...s.plan,
                            tasks: s.plan.tasks.map(t =>
                                t.id === taskId ? { ...t, ...updates } : t
                            ),
                        },
                        updatedAt: Date.now(),
                    }
                    : s
            ),
        }));
    },

    deleteTask: (sessionId, taskId) => {
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === sessionId
                    ? {
                        ...s,
                        plan: {
                            ...s.plan,
                            tasks: s.plan.tasks.filter(t => t.id !== taskId),
                        },
                        updatedAt: Date.now(),
                    }
                    : s
            ),
        }));
    },

    reorderTasks: (sessionId, taskIds) => {
        set(state => ({
            sessions: state.sessions.map(s => {
                if (s.id !== sessionId) return s;

                const taskMap = new Map(s.plan.tasks.map(t => [t.id, t]));
                const reordered = taskIds
                    .map(id => taskMap.get(id))
                    .filter((t): t is PlanTask => t !== undefined);

                return {
                    ...s,
                    plan: { ...s.plan, tasks: reordered },
                    updatedAt: Date.now(),
                };
            }),
        }));
    },

    getSession: (id) => {
        return get().sessions.find(s => s.id === id);
    },

    getActiveSession: () => {
        const { activeSessionId, sessions } = get();
        return activeSessionId ? sessions.find(s => s.id === activeSessionId) : undefined;
    },

    getTasksByStatus: (sessionId, status) => {
        const session = get().getSession(sessionId);
        return session?.plan.tasks.filter(t => t.status === status) || [];
    },

    setViewMode: (mode) => {
        set({ viewMode: mode });
    },
}));

/**
 * Generate initial plan markdown from goal
 */
function generateInitialPlan(goal: string): string {
    return `# ${goal}

## Overview
<!-- Add overview of what we're building -->

## Tasks

### Phase 1: Research & Planning
- [ ] Understand requirements
- [ ] Research existing solutions
- [ ] Define scope

### Phase 2: Implementation
- [ ] Set up project structure
- [ ] Implement core features
- [ ] Add tests

### Phase 3: Review & Deploy
- [ ] Code review
- [ ] Documentation
- [ ] Deploy

## Notes
<!-- Add any notes or context here -->

## Questions for Review
<!-- List any questions that need human input -->
`;
}

/**
 * Extract tasks from markdown content
 */
function extractTasksFromMarkdown(content: string): PlanTask[] {
    const tasks: PlanTask[] = [];
    const lines = content.split('\n');

    const taskRegex = /^- \[([ xX])\] (.+)$/;

    lines.forEach((line, index) => {
        const match = line.match(taskRegex);
        if (match) {
            const completed = match[1].toLowerCase() === 'x';
            tasks.push({
                id: `task-md-${index}`,
                title: match[2],
                status: completed ? 'completed' : 'pending',
                priority: 'medium',
                dependencies: [],
                assignedTo: 'both',
            });
        }
    });

    return tasks;
}

/**
 * Sync plan with agent actions
 */
export function updatePlanFromAgentAction(
    sessionId: string,
    action: string,
    result: 'success' | 'failure'
): void {
    const store = usePlanningStore.getState();
    const session = store.getSession(sessionId);

    if (!session) return;

    // Find matching task and update status
    const matchingTask = session.plan.tasks.find(t =>
        action.toLowerCase().includes(t.title.toLowerCase()) ||
        t.title.toLowerCase().includes(action.toLowerCase())
    );

    if (matchingTask) {
        store.updateTask(sessionId, matchingTask.id, {
            status: result === 'success' ? 'completed' : 'blocked',
            completedAt: result === 'success' ? Date.now() : undefined,
            notes: `${result === 'success' ? '✅' : '❌'} ${action}`,
        });
    }
}
