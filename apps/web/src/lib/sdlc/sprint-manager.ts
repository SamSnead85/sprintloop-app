/**
 * Sprint Manager
 * 
 * Agile sprint management with story tracking, velocity calculation,
 * and Kanban board state.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type StoryStatus = 'backlog' | 'ready' | 'in_progress' | 'review' | 'done' | 'blocked';
export type StoryPriority = 'critical' | 'high' | 'medium' | 'low';
export type StoryType = 'feature' | 'bug' | 'chore' | 'spike' | 'tech_debt';

export interface Story {
    id: string;
    title: string;
    description: string;
    type: StoryType;
    priority: StoryPriority;
    status: StoryStatus;
    points?: number;
    epicId?: string;
    assignee?: string;
    labels: string[];
    acceptanceCriteria: string[];
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
    sprintId?: string;
    blockedReason?: string;
}

export interface Epic {
    id: string;
    title: string;
    description: string;
    storyIds: string[];
    status: 'open' | 'in_progress' | 'completed';
    createdAt: number;
    updatedAt: number;
}

export interface Sprint {
    id: string;
    name: string;
    goal: string;
    status: 'planning' | 'active' | 'review' | 'completed' | 'cancelled';
    storyIds: string[];
    startDate: number;
    endDate: number;
    plannedPoints: number;
    completedPoints: number;
    createdAt: number;
    updatedAt: number;
}

export interface SprintManagerState {
    stories: Map<string, Story>;
    epics: Map<string, Epic>;
    sprints: Map<string, Sprint>;
    activeSprintId: string | null;
    velocityHistory: number[]; // Last N sprints

    // Story management
    addStory: (story: Omit<Story, 'id' | 'createdAt' | 'updatedAt' | 'status'>) => string;
    updateStory: (id: string, updates: Partial<Story>) => void;
    moveStory: (id: string, status: StoryStatus) => void;
    deleteStory: (id: string) => void;
    getStoriesByStatus: (status: StoryStatus) => Story[];
    getStoriesBySprint: (sprintId: string) => Story[];
    getBacklog: () => Story[];

    // Epic management
    addEpic: (title: string, description: string) => string;
    updateEpic: (id: string, updates: Partial<Epic>) => void;
    addStoryToEpic: (epicId: string, storyId: string) => void;
    getEpicProgress: (epicId: string) => { total: number; done: number; percent: number };

    // Sprint management
    createSprint: (name: string, goal: string, duration: number) => string;
    startSprint: (id: string) => void;
    completeSprint: (id: string) => void;
    addStoryToSprint: (sprintId: string, storyId: string) => void;
    removeStoryFromSprint: (storyId: string) => void;
    getActiveSprint: () => Sprint | undefined;
    getSprintProgress: (sprintId: string) => SprintProgress;

    // Velocity
    calculateVelocity: () => number;
    recordVelocity: (points: number) => void;

    // Board state
    getBoardColumns: () => BoardColumn[];
}

export interface SprintProgress {
    totalStories: number;
    completedStories: number;
    totalPoints: number;
    completedPoints: number;
    daysRemaining: number;
    burndownRate: number;
    onTrack: boolean;
}

export interface BoardColumn {
    status: StoryStatus;
    name: string;
    stories: Story[];
    limit?: number;
}

// =============================================================================
// SPRINT MANAGER STORE
// =============================================================================

export const useSprintManager = create<SprintManagerState>((set, get) => ({
    stories: new Map(),
    epics: new Map(),
    sprints: new Map(),
    activeSprintId: null,
    velocityHistory: [],

    // === Story Management ===
    addStory: (storyData): string => {
        const id = `story-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const story: Story = {
            ...storyData,
            id,
            status: 'backlog',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        set(state => ({
            stories: new Map(state.stories).set(id, story),
        }));

        return id;
    },

    updateStory: (id: string, updates: Partial<Story>) => {
        set(state => {
            const stories = new Map(state.stories);
            const story = stories.get(id);
            if (story) {
                const completedAt = updates.status === 'done' ? Date.now() : story.completedAt;
                stories.set(id, {
                    ...story,
                    ...updates,
                    completedAt,
                    updatedAt: Date.now()
                });
            }
            return { stories };
        });
    },

    moveStory: (id: string, status: StoryStatus) => {
        get().updateStory(id, { status });

        // Update sprint completed points if story is done
        if (status === 'done') {
            const story = get().stories.get(id);
            if (story?.sprintId && story.points) {
                const sprint = get().sprints.get(story.sprintId);
                if (sprint) {
                    set(state => {
                        const sprints = new Map(state.sprints);
                        sprints.set(sprint.id, {
                            ...sprint,
                            completedPoints: sprint.completedPoints + (story.points || 0),
                            updatedAt: Date.now(),
                        });
                        return { sprints };
                    });
                }
            }
        }
    },

    deleteStory: (id: string) => {
        set(state => {
            const stories = new Map(state.stories);
            stories.delete(id);
            return { stories };
        });
    },

    getStoriesByStatus: (status: StoryStatus): Story[] => {
        return Array.from(get().stories.values()).filter(s => s.status === status);
    },

    getStoriesBySprint: (sprintId: string): Story[] => {
        return Array.from(get().stories.values()).filter(s => s.sprintId === sprintId);
    },

    getBacklog: (): Story[] => {
        return Array.from(get().stories.values())
            .filter(s => !s.sprintId && s.status === 'backlog')
            .sort((a, b) => {
                const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
    },

    // === Epic Management ===
    addEpic: (title: string, description: string): string => {
        const id = `epic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const epic: Epic = {
            id,
            title,
            description,
            storyIds: [],
            status: 'open',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        set(state => ({
            epics: new Map(state.epics).set(id, epic),
        }));

        return id;
    },

    updateEpic: (id: string, updates: Partial<Epic>) => {
        set(state => {
            const epics = new Map(state.epics);
            const epic = epics.get(id);
            if (epic) {
                epics.set(id, { ...epic, ...updates, updatedAt: Date.now() });
            }
            return { epics };
        });
    },

    addStoryToEpic: (epicId: string, storyId: string) => {
        set(state => {
            const epics = new Map(state.epics);
            const stories = new Map(state.stories);

            const epic = epics.get(epicId);
            const story = stories.get(storyId);

            if (epic && story) {
                epics.set(epicId, {
                    ...epic,
                    storyIds: [...epic.storyIds, storyId],
                    status: 'in_progress',
                    updatedAt: Date.now(),
                });
                stories.set(storyId, { ...story, epicId, updatedAt: Date.now() });
            }

            return { epics, stories };
        });
    },

    getEpicProgress: (epicId: string) => {
        const epic = get().epics.get(epicId);
        if (!epic) return { total: 0, done: 0, percent: 0 };

        const stories = epic.storyIds
            .map(id => get().stories.get(id))
            .filter((s): s is Story => !!s);

        const done = stories.filter(s => s.status === 'done').length;
        const total = stories.length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        return { total, done, percent };
    },

    // === Sprint Management ===
    createSprint: (name: string, goal: string, duration: number): string => {
        const id = `sprint-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const startDate = Date.now();
        const endDate = startDate + (duration * 24 * 60 * 60 * 1000);

        const sprint: Sprint = {
            id,
            name,
            goal,
            status: 'planning',
            storyIds: [],
            startDate,
            endDate,
            plannedPoints: 0,
            completedPoints: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        set(state => ({
            sprints: new Map(state.sprints).set(id, sprint),
        }));

        return id;
    },

    startSprint: (id: string) => {
        set(state => {
            const sprints = new Map(state.sprints);
            const sprint = sprints.get(id);
            if (sprint && sprint.status === 'planning') {
                sprints.set(id, {
                    ...sprint,
                    status: 'active',
                    startDate: Date.now(),
                    endDate: Date.now() + (14 * 24 * 60 * 60 * 1000), // Reset to 14 days from now
                    updatedAt: Date.now(),
                });
            }
            return { sprints, activeSprintId: id };
        });

        // Move stories to 'ready'
        const sprint = get().sprints.get(id);
        if (sprint) {
            for (const storyId of sprint.storyIds) {
                const story = get().stories.get(storyId);
                if (story && story.status === 'backlog') {
                    get().moveStory(storyId, 'ready');
                }
            }
        }
    },

    completeSprint: (id: string) => {
        const sprint = get().sprints.get(id);
        if (!sprint) return;

        // Record velocity
        get().recordVelocity(sprint.completedPoints);

        // Move incomplete stories back to backlog
        for (const storyId of sprint.storyIds) {
            const story = get().stories.get(storyId);
            if (story && story.status !== 'done') {
                get().updateStory(storyId, { sprintId: undefined, status: 'backlog' });
            }
        }

        set(state => {
            const sprints = new Map(state.sprints);
            sprints.set(id, {
                ...sprint,
                status: 'completed',
                updatedAt: Date.now(),
            });
            return { sprints, activeSprintId: null };
        });
    },

    addStoryToSprint: (sprintId: string, storyId: string) => {
        set(state => {
            const sprints = new Map(state.sprints);
            const stories = new Map(state.stories);

            const sprint = sprints.get(sprintId);
            const story = stories.get(storyId);

            if (sprint && story) {
                sprints.set(sprintId, {
                    ...sprint,
                    storyIds: [...sprint.storyIds, storyId],
                    plannedPoints: sprint.plannedPoints + (story.points || 0),
                    updatedAt: Date.now(),
                });
                stories.set(storyId, { ...story, sprintId, status: 'ready', updatedAt: Date.now() });
            }

            return { sprints, stories };
        });
    },

    removeStoryFromSprint: (storyId: string) => {
        const story = get().stories.get(storyId);
        if (!story?.sprintId) return;

        set(state => {
            const sprints = new Map(state.sprints);
            const stories = new Map(state.stories);

            const sprint = sprints.get(story.sprintId!);

            if (sprint) {
                sprints.set(sprint.id, {
                    ...sprint,
                    storyIds: sprint.storyIds.filter(id => id !== storyId),
                    plannedPoints: sprint.plannedPoints - (story.points || 0),
                    updatedAt: Date.now(),
                });
            }

            stories.set(storyId, { ...story, sprintId: undefined, status: 'backlog', updatedAt: Date.now() });

            return { sprints, stories };
        });
    },

    getActiveSprint: (): Sprint | undefined => {
        const { activeSprintId, sprints } = get();
        return activeSprintId ? sprints.get(activeSprintId) : undefined;
    },

    getSprintProgress: (sprintId: string): SprintProgress => {
        const sprint = get().sprints.get(sprintId);
        if (!sprint) {
            return {
                totalStories: 0,
                completedStories: 0,
                totalPoints: 0,
                completedPoints: 0,
                daysRemaining: 0,
                burndownRate: 0,
                onTrack: false,
            };
        }

        const stories = get().getStoriesBySprint(sprintId);
        const completedStories = stories.filter(s => s.status === 'done').length;
        const daysRemaining = Math.max(0, Math.ceil((sprint.endDate - Date.now()) / (24 * 60 * 60 * 1000)));
        const totalDays = Math.ceil((sprint.endDate - sprint.startDate) / (24 * 60 * 60 * 1000));
        const daysElapsed = totalDays - daysRemaining;

        const expectedProgress = daysElapsed / totalDays;
        const actualProgress = sprint.plannedPoints > 0
            ? sprint.completedPoints / sprint.plannedPoints
            : 0;

        const onTrack = actualProgress >= expectedProgress * 0.8; // 80% of expected is on track

        return {
            totalStories: stories.length,
            completedStories,
            totalPoints: sprint.plannedPoints,
            completedPoints: sprint.completedPoints,
            daysRemaining,
            burndownRate: daysElapsed > 0 ? sprint.completedPoints / daysElapsed : 0,
            onTrack,
        };
    },

    // === Velocity ===
    calculateVelocity: (): number => {
        const history = get().velocityHistory;
        if (history.length === 0) return 0;
        return Math.round(history.reduce((a, b) => a + b, 0) / history.length);
    },

    recordVelocity: (points: number) => {
        set(state => ({
            velocityHistory: [...state.velocityHistory.slice(-9), points], // Keep last 10
        }));
    },

    // === Board ===
    getBoardColumns: (): BoardColumn[] => {
        const activeSprint = get().getActiveSprint();
        const sprintStories = activeSprint
            ? get().getStoriesBySprint(activeSprint.id)
            : [];

        const columns: { status: StoryStatus; name: string; limit?: number }[] = [
            { status: 'ready', name: 'To Do' },
            { status: 'in_progress', name: 'In Progress', limit: 3 },
            { status: 'review', name: 'Review', limit: 2 },
            { status: 'done', name: 'Done' },
        ];

        return columns.map(col => ({
            ...col,
            stories: sprintStories.filter(s => s.status === col.status),
        }));
    },
}));

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get story type emoji
 */
export function getStoryTypeEmoji(type: StoryType): string {
    const emojis: Record<StoryType, string> = {
        feature: '✨',
        bug: '🐛',
        chore: '🔧',
        spike: '🔬',
        tech_debt: '💳',
    };
    return emojis[type];
}

/**
 * Get priority color
 */
export function getPriorityColor(priority: StoryPriority): string {
    const colors: Record<StoryPriority, string> = {
        critical: '#EF4444', // Red
        high: '#F59E0B', // Amber
        medium: '#3B82F6', // Blue
        low: '#6B7280', // Gray
    };
    return colors[priority];
}

/**
 * Get status color
 */
export function getStatusColor(status: StoryStatus): string {
    const colors: Record<StoryStatus, string> = {
        backlog: '#6B7280',
        ready: '#3B82F6',
        in_progress: '#F59E0B',
        review: '#8B5CF6',
        done: '#10B981',
        blocked: '#EF4444',
    };
    return colors[status];
}

/**
 * Format story ID for display
 */
export function formatStoryId(id: string): string {
    return id.replace('story-', 'US-').slice(0, 10).toUpperCase();
}
