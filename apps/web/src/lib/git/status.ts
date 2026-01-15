/**
 * Git Status Indicators
 * 
 * Phase 25: Git status with modified/staged file badges
 * VS Code-style git integration
 */

import { create } from 'zustand';

export type GitFileStatus =
    | 'modified'
    | 'added'
    | 'deleted'
    | 'renamed'
    | 'copied'
    | 'untracked'
    | 'ignored'
    | 'conflict';

export interface GitFileChange {
    path: string;
    oldPath?: string;
    status: GitFileStatus;
    staged: boolean;
    additions: number;
    deletions: number;
}

export interface GitBranch {
    name: string;
    current: boolean;
    remote?: string;
    upstream?: string;
    ahead: number;
    behind: number;
}

export interface GitStatus {
    branch: string;
    ahead: number;
    behind: number;
    changes: GitFileChange[];
    staged: GitFileChange[];
    conflicts: string[];
    stashCount: number;
}

interface GitState {
    status: GitStatus | null;
    branches: GitBranch[];
    isLoading: boolean;
    error: string | null;
    lastRefresh: number;

    // Actions
    setStatus: (status: GitStatus) => void;
    setBranches: (branches: GitBranch[]) => void;
    setLoading: (isLoading: boolean) => void;
    setError: (error: string | null) => void;
    refresh: () => Promise<void>;

    // Getters
    getFileStatus: (path: string) => GitFileChange | null;
    hasChanges: () => boolean;
    hasConflicts: () => boolean;
}

const STATUS_COLORS: Record<GitFileStatus, string> = {
    modified: '#e5c07b',  // Yellow
    added: '#98c379',     // Green
    deleted: '#e06c75',   // Red
    renamed: '#56b6c2',   // Cyan
    copied: '#56b6c2',    // Cyan
    untracked: '#7f848e', // Gray
    ignored: '#5c6370',   // Dark gray
    conflict: '#e06c75',  // Red
};

const STATUS_ICONS: Record<GitFileStatus, string> = {
    modified: 'M',
    added: 'A',
    deleted: 'D',
    renamed: 'R',
    copied: 'C',
    untracked: 'U',
    ignored: '!',
    conflict: '!',
};

export function getStatusColor(status: GitFileStatus): string {
    return STATUS_COLORS[status] || '#abb2bf';
}

export function getStatusIcon(status: GitFileStatus): string {
    return STATUS_ICONS[status] || '?';
}

export const useGitStore = create<GitState>((set, get) => ({
    status: null,
    branches: [],
    isLoading: false,
    error: null,
    lastRefresh: 0,

    setStatus: (status) => set({ status, lastRefresh: Date.now() }),
    setBranches: (branches) => set({ branches }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    refresh: async () => {
        set({ isLoading: true, error: null });

        try {
            // In real implementation, call git commands via Tauri
            console.log('[Git] Refreshing status...');

            // Simulate git status
            const mockStatus: GitStatus = {
                branch: 'main',
                ahead: 2,
                behind: 0,
                changes: [],
                staged: [],
                conflicts: [],
                stashCount: 0,
            };

            set({ status: mockStatus, lastRefresh: Date.now() });
        } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Git error' });
        } finally {
            set({ isLoading: false });
        }
    },

    getFileStatus: (path) => {
        const status = get().status;
        if (!status) return null;

        return (
            status.staged.find(f => f.path === path) ||
            status.changes.find(f => f.path === path) ||
            null
        );
    },

    hasChanges: () => {
        const status = get().status;
        return status ? (status.changes.length + status.staged.length) > 0 : false;
    },

    hasConflicts: () => {
        const status = get().status;
        return status ? status.conflicts.length > 0 : false;
    },
}));

/**
 * Format branch display name
 */
export function formatBranchName(branch: GitBranch): string {
    let name = branch.name;

    if (branch.ahead > 0 || branch.behind > 0) {
        const parts: string[] = [];
        if (branch.ahead > 0) parts.push(`↑${branch.ahead}`);
        if (branch.behind > 0) parts.push(`↓${branch.behind}`);
        name += ` (${parts.join(' ')})`;
    }

    return name;
}

/**
 * Format change summary
 */
export function formatChangeSummary(changes: GitFileChange[]): string {
    const added = changes.filter(c => c.status === 'added').length;
    const modified = changes.filter(c => c.status === 'modified').length;
    const deleted = changes.filter(c => c.status === 'deleted').length;

    const parts: string[] = [];
    if (added > 0) parts.push(`+${added}`);
    if (modified > 0) parts.push(`~${modified}`);
    if (deleted > 0) parts.push(`-${deleted}`);

    return parts.join(' ') || 'No changes';
}
