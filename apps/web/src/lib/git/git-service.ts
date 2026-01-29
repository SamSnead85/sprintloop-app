/**
 * Git Service
 * 
 * Git operations for version control integration.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type FileStatus =
    | 'modified'
    | 'added'
    | 'deleted'
    | 'renamed'
    | 'copied'
    | 'untracked'
    | 'ignored'
    | 'conflict';

export interface GitFile {
    path: string;
    status: FileStatus;
    staged: boolean;
    oldPath?: string; // For renames
}

export interface GitBranch {
    name: string;
    current: boolean;
    remote?: string;
    ahead: number;
    behind: number;
}

export interface GitCommit {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: number;
    parents: string[];
}

export interface GitDiff {
    filePath: string;
    hunks: DiffHunk[];
    additions: number;
    deletions: number;
}

export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: DiffLine[];
}

export interface DiffLine {
    type: 'context' | 'add' | 'delete';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}

export interface GitState {
    isInitialized: boolean;
    isLoading: boolean;
    repoPath: string | null;
    currentBranch: string;
    branches: GitBranch[];
    files: GitFile[];
    stagedFiles: GitFile[];
    commits: GitCommit[];

    // Actions
    initialize: (repoPath: string) => Promise<void>;
    refresh: () => Promise<void>;
    getStatus: () => Promise<void>;
    getBranches: () => Promise<void>;
    getCommits: (limit?: number) => Promise<void>;
    getDiff: (filePath: string, staged?: boolean) => Promise<GitDiff | null>;

    // Staging
    stageFile: (filePath: string) => Promise<void>;
    unstageFile: (filePath: string) => Promise<void>;
    stageAll: () => Promise<void>;
    unstageAll: () => Promise<void>;

    // Commits
    commit: (message: string) => Promise<boolean>;
    push: () => Promise<boolean>;
    pull: () => Promise<boolean>;

    // Branches
    checkout: (branch: string) => Promise<boolean>;
    createBranch: (name: string) => Promise<boolean>;

    // Utilities
    discardChanges: (filePath: string) => Promise<void>;
}

// =============================================================================
// GIT STORE
// =============================================================================

export const useGitService = create<GitState>((set, get) => ({
    isInitialized: false,
    isLoading: false,
    repoPath: null,
    currentBranch: 'main',
    branches: [],
    files: [],
    stagedFiles: [],
    commits: [],

    initialize: async (repoPath: string) => {
        set({ isLoading: true, repoPath });

        try {
            // Check if git is available
            const isGitRepo = await checkGitRepo(repoPath);

            if (isGitRepo) {
                set({ isInitialized: true });
                await get().refresh();
            } else {
                console.warn('[GitService] Not a git repository:', repoPath);
            }
        } catch (error) {
            console.error('[GitService] Initialize failed:', error);
        }

        set({ isLoading: false });
    },

    refresh: async () => {
        await Promise.all([
            get().getStatus(),
            get().getBranches(),
            get().getCommits(10),
        ]);
    },

    getStatus: async () => {
        set({ isLoading: true });

        try {
            const result = await executeGitCommand('status', ['--porcelain=v1']);
            const files = parseStatusOutput(result);

            set({
                files: files.filter(f => !f.staged),
                stagedFiles: files.filter(f => f.staged),
            });
        } catch (error) {
            console.error('[GitService] Status failed:', error);
        }

        set({ isLoading: false });
    },

    getBranches: async () => {
        try {
            const result = await executeGitCommand('branch', ['-a', '-v']);
            const branches = parseBranchOutput(result);
            const current = branches.find(b => b.current)?.name || 'main';

            set({ branches, currentBranch: current });
        } catch (error) {
            console.error('[GitService] Branches failed:', error);
        }
    },

    getCommits: async (limit = 10) => {
        try {
            const result = await executeGitCommand('log', [
                `--format=%H|%h|%s|%an|%at|%P`,
                `-${limit}`,
            ]);
            const commits = parseLogOutput(result);
            set({ commits });
        } catch (error) {
            console.error('[GitService] Commits failed:', error);
        }
    },

    getDiff: async (filePath: string, staged = false): Promise<GitDiff | null> => {
        try {
            const args = staged ? ['--cached', filePath] : [filePath];
            const result = await executeGitCommand('diff', args);
            return parseDiffOutput(filePath, result);
        } catch (error) {
            console.error('[GitService] Diff failed:', error);
            return null;
        }
    },

    stageFile: async (filePath: string) => {
        try {
            await executeGitCommand('add', [filePath]);
            await get().getStatus();
        } catch (error) {
            console.error('[GitService] Stage failed:', error);
        }
    },

    unstageFile: async (filePath: string) => {
        try {
            await executeGitCommand('restore', ['--staged', filePath]);
            await get().getStatus();
        } catch (error) {
            console.error('[GitService] Unstage failed:', error);
        }
    },

    stageAll: async () => {
        try {
            await executeGitCommand('add', ['-A']);
            await get().getStatus();
        } catch (error) {
            console.error('[GitService] Stage all failed:', error);
        }
    },

    unstageAll: async () => {
        try {
            await executeGitCommand('restore', ['--staged', '.']);
            await get().getStatus();
        } catch (error) {
            console.error('[GitService] Unstage all failed:', error);
        }
    },

    commit: async (message: string): Promise<boolean> => {
        try {
            await executeGitCommand('commit', ['-m', message]);
            await get().refresh();
            return true;
        } catch (error) {
            console.error('[GitService] Commit failed:', error);
            return false;
        }
    },

    push: async (): Promise<boolean> => {
        try {
            await executeGitCommand('push', []);
            await get().getBranches();
            return true;
        } catch (error) {
            console.error('[GitService] Push failed:', error);
            return false;
        }
    },

    pull: async (): Promise<boolean> => {
        try {
            await executeGitCommand('pull', []);
            await get().refresh();
            return true;
        } catch (error) {
            console.error('[GitService] Pull failed:', error);
            return false;
        }
    },

    checkout: async (branch: string): Promise<boolean> => {
        try {
            await executeGitCommand('checkout', [branch]);
            await get().refresh();
            return true;
        } catch (error) {
            console.error('[GitService] Checkout failed:', error);
            return false;
        }
    },

    createBranch: async (name: string): Promise<boolean> => {
        try {
            await executeGitCommand('checkout', ['-b', name]);
            await get().getBranches();
            return true;
        } catch (error) {
            console.error('[GitService] Create branch failed:', error);
            return false;
        }
    },

    discardChanges: async (filePath: string) => {
        try {
            await executeGitCommand('checkout', ['--', filePath]);
            await get().getStatus();
        } catch (error) {
            console.error('[GitService] Discard failed:', error);
        }
    },
}));

// =============================================================================
// GIT COMMAND EXECUTION
// =============================================================================

async function executeGitCommand(command: string, args: string[]): Promise<string> {
    // In real implementation, use Tauri shell command
    // For now, return mock data
    return mockGitCommand(command, args);
}

async function checkGitRepo(_repoPath: string): Promise<boolean> {
    // Would check if .git exists
    return true;
}

// =============================================================================
// MOCK GIT COMMANDS
// =============================================================================

function mockGitCommand(command: string, _args: string[]): string {
    switch (command) {
        case 'status':
            return ` M src/App.tsx
 M src/lib/ai/code-actions.ts
A  src/components/NewComponent.tsx
?? src/temp.ts`;

        case 'branch':
            return `* main                    abc1234 Latest commit
  feature/new-feature     def5678 Work in progress
  remotes/origin/main     abc1234 Latest commit`;

        case 'log':
            return `abc1234|abc12|feat: add new feature|John Doe|1706500000|
def5678|def56|fix: bug fix|Jane Doe|1706400000|abc1234
ghi9012|ghi90|chore: update deps|John Doe|1706300000|def5678`;

        case 'diff':
            return `@@ -1,5 +1,7 @@
 import React from 'react';
+import { useState } from 'react';
 
 function App() {
-  return <div>Hello</div>;
+  const [count, setCount] = useState(0);
+  return <div>Count: {count}</div>;
 }`;

        default:
            return '';
    }
}

// =============================================================================
// PARSERS
// =============================================================================

function parseStatusOutput(output: string): GitFile[] {
    const files: GitFile[] = [];
    const lines = output.split('\n').filter(Boolean);

    for (const line of lines) {
        if (line.length < 3) continue;

        const index = line[0];
        const worktree = line[1];
        const path = line.slice(3);

        const staged = index !== ' ' && index !== '?';
        let status: FileStatus;

        const code = staged ? index : worktree;
        switch (code) {
            case 'M': status = 'modified'; break;
            case 'A': status = 'added'; break;
            case 'D': status = 'deleted'; break;
            case 'R': status = 'renamed'; break;
            case 'C': status = 'copied'; break;
            case '?': status = 'untracked'; break;
            case '!': status = 'ignored'; break;
            case 'U': status = 'conflict'; break;
            default: status = 'modified';
        }

        files.push({ path, status, staged });
    }

    return files;
}

function parseBranchOutput(output: string): GitBranch[] {
    const branches: GitBranch[] = [];
    const lines = output.split('\n').filter(Boolean);

    for (const line of lines) {
        const current = line.startsWith('*');
        const [, name, _hash, ..._messageParts] = line.trim().split(/\s+/);
        const actualName = name || '';

        if (actualName.startsWith('remotes/')) continue;

        branches.push({
            name: actualName,
            current,
            ahead: 0,
            behind: 0,
        });
    }

    return branches;
}

function parseLogOutput(output: string): GitCommit[] {
    const commits: GitCommit[] = [];
    const lines = output.split('\n').filter(Boolean);

    for (const line of lines) {
        const [hash, shortHash, message, author, dateStr, parents] = line.split('|');

        commits.push({
            hash,
            shortHash,
            message,
            author,
            date: parseInt(dateStr) * 1000,
            parents: parents ? parents.split(' ') : [],
        });
    }

    return commits;
}

function parseDiffOutput(filePath: string, output: string): GitDiff {
    const hunks: DiffHunk[] = [];
    let additions = 0;
    let deletions = 0;

    // Simple parsing - production would be more robust
    const lines = output.split('\n');
    let currentHunk: DiffHunk | null = null;

    for (const line of lines) {
        if (line.startsWith('@@')) {
            if (currentHunk) hunks.push(currentHunk);
            currentHunk = { oldStart: 0, oldLines: 0, newStart: 0, newLines: 0, lines: [] };
        } else if (currentHunk) {
            if (line.startsWith('+')) {
                additions++;
                currentHunk.lines.push({ type: 'add', content: line.slice(1) });
            } else if (line.startsWith('-')) {
                deletions++;
                currentHunk.lines.push({ type: 'delete', content: line.slice(1) });
            } else {
                currentHunk.lines.push({ type: 'context', content: line.slice(1) });
            }
        }
    }

    if (currentHunk) hunks.push(currentHunk);

    return { filePath, hunks, additions, deletions };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get status icon
 */
export function getStatusIcon(status: FileStatus): string {
    const icons: Record<FileStatus, string> = {
        modified: 'M',
        added: 'A',
        deleted: 'D',
        renamed: 'R',
        copied: 'C',
        untracked: 'U',
        ignored: '!',
        conflict: '⚠',
    };
    return icons[status];
}

/**
 * Get status color
 */
export function getStatusColor(status: FileStatus): string {
    const colors: Record<FileStatus, string> = {
        modified: '#F59E0B',
        added: '#10B981',
        deleted: '#EF4444',
        renamed: '#8B5CF6',
        copied: '#3B82F6',
        untracked: '#6B7280',
        ignored: '#374151',
        conflict: '#EF4444',
    };
    return colors[status];
}
