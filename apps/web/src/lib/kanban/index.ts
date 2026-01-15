/**
 * SprintLoop Kanban Module
 * 
 * AI-powered Kanban board for orchestrating coding tasks.
 * Inspired by vibe-kanban.
 */

export { useKanbanStore } from './kanban-store';
export type {
    KanbanTask,
    KanbanBoard,
    KanbanColumn,
    GitCommit,
    ReviewComment,
    DevServer,
} from './kanban-store';

export {
    executeKanbanTask,
    executeParallelTasks,
    suggestAgentForTask,
    autoAssignAgents,
} from './agent-executor';
export type { ExecutionProgress, ProgressCallback } from './agent-executor';

// Git Worktree for parallel branch development without conflicts
export {
    GitWorktreeManager,
    getWorktreeManager,
    initializeWorktreeManager,
} from './git-worktree';
export type {
    GitWorktree,
    GitCommitInfo,
    MergeResult,
    DiffResult,
    FileDiff,
    DiffHunk,
} from './git-worktree';
