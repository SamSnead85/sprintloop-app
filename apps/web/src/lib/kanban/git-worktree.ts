/**
 * Git Worktree Manager
 * 
 * Key vibe-kanban feature: Isolated Git worktrees for parallel development.
 * Each task runs in its own worktree to prevent merge conflicts.
 * 
 * Features:
 * - Create isolated worktrees per task
 * - Parallel branch development without conflicts
 * - Built-in rebase/merge operations
 * - Code review before merge
 * - Clean history maintenance
 */

export interface GitWorktree {
    id: string;
    taskId: string;
    branch: string;
    path: string;
    baseBranch: string;
    status: 'active' | 'merged' | 'deleted' | 'conflicted';
    createdAt: number;
    lastCommit?: GitCommitInfo;
    aheadBy: number;
    behindBy: number;
}

export interface GitCommitInfo {
    sha: string;
    message: string;
    author: string;
    timestamp: number;
    filesChanged: string[];
}

export interface MergeResult {
    success: boolean;
    commitSha?: string;
    conflicts?: string[];
    message: string;
}

export interface DiffResult {
    files: FileDiff[];
    additions: number;
    deletions: number;
    changedFiles: number;
}

export interface FileDiff {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed';
    additions: number;
    deletions: number;
    oldPath?: string; // For renamed files
    hunks: DiffHunk[];
}

export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    content: string;
}

/**
 * Git Worktree Manager
 * Provides isolated branches for parallel task development
 */
export class GitWorktreeManager {
    private worktrees: Map<string, GitWorktree> = new Map();
    private projectRoot: string;
    private mainBranch: string;

    constructor(projectRoot: string, mainBranch: string = 'main') {
        this.projectRoot = projectRoot;
        this.mainBranch = mainBranch;
    }

    /**
     * Create a new worktree for a task
     * This isolates the task's changes from other parallel work
     */
    async createWorktree(taskId: string, branchName?: string): Promise<GitWorktree> {
        const branch = branchName || `task/${taskId.slice(0, 8)}-${Date.now().toString(36)}`;
        const worktreePath = `${this.projectRoot}/.worktrees/${branch}`;

        console.log(`[GitWorktree] Creating worktree for task ${taskId}`);
        console.log(`  Branch: ${branch}`);
        console.log(`  Path: ${worktreePath}`);

        // In a real implementation:
        // git worktree add <path> -b <branch>

        const worktree: GitWorktree = {
            id: `wt-${Date.now()}`,
            taskId,
            branch,
            path: worktreePath,
            baseBranch: this.mainBranch,
            status: 'active',
            createdAt: Date.now(),
            aheadBy: 0,
            behindBy: 0,
        };

        this.worktrees.set(taskId, worktree);
        return worktree;
    }

    /**
     * Get the worktree for a task
     */
    getWorktree(taskId: string): GitWorktree | undefined {
        return this.worktrees.get(taskId);
    }

    /**
     * Get all active worktrees
     */
    getActiveWorktrees(): GitWorktree[] {
        return Array.from(this.worktrees.values()).filter(w => w.status === 'active');
    }

    /**
     * Commit changes in a worktree
     */
    async commit(taskId: string, message: string, files?: string[]): Promise<GitCommitInfo> {
        const worktree = this.worktrees.get(taskId);
        if (!worktree) {
            throw new Error(`No worktree found for task ${taskId}`);
        }

        console.log(`[GitWorktree] Committing to ${worktree.branch}: ${message}`);

        // In a real implementation:
        // cd <worktree.path>
        // git add <files or .>
        // git commit -m <message>

        const commit: GitCommitInfo = {
            sha: Math.random().toString(36).slice(2, 10),
            message,
            author: 'AI Agent',
            timestamp: Date.now(),
            filesChanged: files || [],
        };

        worktree.lastCommit = commit;
        worktree.aheadBy++;

        return commit;
    }

    /**
     * Get diff between worktree and base branch
     */
    async getDiff(taskId: string): Promise<DiffResult> {
        const worktree = this.worktrees.get(taskId);
        if (!worktree) {
            throw new Error(`No worktree found for task ${taskId}`);
        }

        console.log(`[GitWorktree] Getting diff for ${worktree.branch} vs ${worktree.baseBranch}`);

        // In a real implementation:
        // git diff <baseBranch>...<branch>

        return {
            files: [],
            additions: 0,
            deletions: 0,
            changedFiles: 0,
        };
    }

    /**
     * Rebase worktree onto latest base branch
     */
    async rebase(taskId: string): Promise<MergeResult> {
        const worktree = this.worktrees.get(taskId);
        if (!worktree) {
            throw new Error(`No worktree found for task ${taskId}`);
        }

        console.log(`[GitWorktree] Rebasing ${worktree.branch} onto ${worktree.baseBranch}`);

        // In a real implementation:
        // cd <worktree.path>
        // git fetch origin
        // git rebase origin/<baseBranch>

        worktree.behindBy = 0;

        return {
            success: true,
            message: `Successfully rebased ${worktree.branch} onto ${worktree.baseBranch}`,
        };
    }

    /**
     * Merge worktree into base branch (after review approval)
     */
    async merge(taskId: string, squash: boolean = true): Promise<MergeResult> {
        const worktree = this.worktrees.get(taskId);
        if (!worktree) {
            throw new Error(`No worktree found for task ${taskId}`);
        }

        console.log(`[GitWorktree] Merging ${worktree.branch} into ${worktree.baseBranch}`);
        console.log(`  Squash: ${squash}`);

        // In a real implementation:
        // git checkout <baseBranch>
        // git merge --squash <branch> (or git merge <branch>)
        // git commit -m "Merge task: <taskId>"

        const commitSha = Math.random().toString(36).slice(2, 10);

        worktree.status = 'merged';

        return {
            success: true,
            commitSha,
            message: `Successfully merged ${worktree.branch} into ${worktree.baseBranch}`,
        };
    }

    /**
     * Delete a worktree after merge or abandonment
     */
    async deleteWorktree(taskId: string): Promise<void> {
        const worktree = this.worktrees.get(taskId);
        if (!worktree) {
            return;
        }

        console.log(`[GitWorktree] Deleting worktree ${worktree.branch}`);

        // In a real implementation:
        // git worktree remove <path>
        // git branch -d <branch>

        worktree.status = 'deleted';
        this.worktrees.delete(taskId);
    }

    /**
     * Check for conflicts when merging
     */
    async checkConflicts(taskId: string): Promise<string[]> {
        const worktree = this.worktrees.get(taskId);
        if (!worktree) {
            return [];
        }

        console.log(`[GitWorktree] Checking conflicts for ${worktree.branch}`);

        // In a real implementation:
        // git merge-tree <base> <baseBranch> <branch>
        // Parse output for conflicts

        return [];
    }

    /**
     * Get status summary for all worktrees
     */
    getStatus(): { active: number; ahead: number; behind: number; conflicted: number } {
        const worktrees = Array.from(this.worktrees.values());
        return {
            active: worktrees.filter(w => w.status === 'active').length,
            ahead: worktrees.reduce((sum, w) => sum + w.aheadBy, 0),
            behind: worktrees.reduce((sum, w) => sum + w.behindBy, 0),
            conflicted: worktrees.filter(w => w.status === 'conflicted').length,
        };
    }
}

// Default instance (will be configured per project)
let _manager: GitWorktreeManager | null = null;

export function getWorktreeManager(projectRoot?: string): GitWorktreeManager {
    if (!_manager && projectRoot) {
        _manager = new GitWorktreeManager(projectRoot);
    }
    if (!_manager) {
        throw new Error('GitWorktreeManager not initialized. Call with projectRoot first.');
    }
    return _manager;
}

export function initializeWorktreeManager(projectRoot: string, mainBranch?: string): GitWorktreeManager {
    _manager = new GitWorktreeManager(projectRoot, mainBranch);
    return _manager;
}
