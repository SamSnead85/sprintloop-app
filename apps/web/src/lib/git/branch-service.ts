/**
 * Branch Management Service
 * 
 * Handles Git branch operations: create, delete, switch, merge, rebase.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface GitBranch {
    name: string;
    isRemote: boolean;
    isCurrent: boolean;
    isHead: boolean;
    upstream?: string;
    ahead: number;
    behind: number;
    lastCommit?: {
        hash: string;
        message: string;
        author: string;
        date: Date;
    };
}

export interface MergeResult {
    success: boolean;
    conflicts: string[];
    mergedFiles: number;
    message: string;
}

export interface BranchState {
    branches: GitBranch[];
    currentBranch: string | null;
    isLoading: boolean;
    error: string | null;

    // Branch operations
    fetchBranches: () => Promise<void>;
    createBranch: (name: string, startPoint?: string) => Promise<boolean>;
    deleteBranch: (name: string, force?: boolean) => Promise<boolean>;
    switchBranch: (name: string) => Promise<boolean>;
    renameBranch: (oldName: string, newName: string) => Promise<boolean>;

    // Merge operations
    mergeBranch: (source: string, noFastForward?: boolean) => Promise<MergeResult>;
    abortMerge: () => Promise<boolean>;

    // Rebase operations
    rebaseBranch: (onto: string) => Promise<boolean>;
    abortRebase: () => Promise<boolean>;
    continueRebase: () => Promise<boolean>;

    // Remote operations
    push: (remote?: string, branch?: string, force?: boolean) => Promise<boolean>;
    pull: (remote?: string, branch?: string, rebase?: boolean) => Promise<boolean>;
    fetchRemote: (remote?: string) => Promise<boolean>;

    // Utilities
    getBranchByName: (name: string) => GitBranch | undefined;
    getLocalBranches: () => GitBranch[];
    getRemoteBranches: () => GitBranch[];
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_BRANCHES: GitBranch[] = [
    {
        name: 'main',
        isRemote: false,
        isCurrent: true,
        isHead: true,
        upstream: 'origin/main',
        ahead: 0,
        behind: 0,
        lastCommit: {
            hash: '2c08a71',
            message: 'feat: Phase 14 - context menus and refactoring',
            author: 'Developer',
            date: new Date(),
        },
    },
    {
        name: 'develop',
        isRemote: false,
        isCurrent: false,
        isHead: false,
        upstream: 'origin/develop',
        ahead: 2,
        behind: 0,
        lastCommit: {
            hash: 'abc1234',
            message: 'feat: working on new feature',
            author: 'Developer',
            date: new Date(Date.now() - 86400000),
        },
    },
    {
        name: 'feature/ide-enhancements',
        isRemote: false,
        isCurrent: false,
        isHead: false,
        ahead: 5,
        behind: 1,
        lastCommit: {
            hash: 'def5678',
            message: 'wip: adding editor improvements',
            author: 'Developer',
            date: new Date(Date.now() - 172800000),
        },
    },
    {
        name: 'origin/main',
        isRemote: true,
        isCurrent: false,
        isHead: false,
        ahead: 0,
        behind: 0,
    },
    {
        name: 'origin/develop',
        isRemote: true,
        isCurrent: false,
        isHead: false,
        ahead: 0,
        behind: 2,
    },
];

// =============================================================================
// BRANCH STORE
// =============================================================================

export const useBranchService = create<BranchState>((set, get) => ({
    branches: MOCK_BRANCHES,
    currentBranch: 'main',
    isLoading: false,
    error: null,

    fetchBranches: async () => {
        set({ isLoading: true, error: null });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));

        set({
            branches: MOCK_BRANCHES,
            currentBranch: 'main',
            isLoading: false,
        });
    },

    createBranch: async (name, startPoint) => {
        console.log('[Branch] Creating branch:', name, 'from', startPoint || 'HEAD');

        const newBranch: GitBranch = {
            name,
            isRemote: false,
            isCurrent: false,
            isHead: false,
            ahead: 0,
            behind: 0,
            lastCommit: {
                hash: 'new1234',
                message: 'Branch created',
                author: 'Developer',
                date: new Date(),
            },
        };

        set(state => ({
            branches: [...state.branches, newBranch],
        }));

        return true;
    },

    deleteBranch: async (name, force = false) => {
        console.log('[Branch] Deleting branch:', name, force ? '(force)' : '');

        const branch = get().branches.find(b => b.name === name);
        if (!branch) return false;

        if (branch.isCurrent) {
            set({ error: 'Cannot delete current branch' });
            return false;
        }

        set(state => ({
            branches: state.branches.filter(b => b.name !== name),
        }));

        return true;
    },

    switchBranch: async (name) => {
        console.log('[Branch] Switching to:', name);

        const branch = get().branches.find(b => b.name === name);
        if (!branch || branch.isRemote) {
            set({ error: 'Branch not found or is remote' });
            return false;
        }

        set(state => ({
            branches: state.branches.map(b => ({
                ...b,
                isCurrent: b.name === name,
                isHead: b.name === name,
            })),
            currentBranch: name,
        }));

        return true;
    },

    renameBranch: async (oldName, newName) => {
        console.log('[Branch] Renaming:', oldName, 'to', newName);

        set(state => ({
            branches: state.branches.map(b =>
                b.name === oldName ? { ...b, name: newName } : b
            ),
            currentBranch: state.currentBranch === oldName ? newName : state.currentBranch,
        }));

        return true;
    },

    mergeBranch: async (source, noFastForward = false) => {
        console.log('[Branch] Merging:', source, noFastForward ? '(no-ff)' : '');

        // Simulate merge with potential conflicts
        const hasConflicts = Math.random() < 0.3;

        if (hasConflicts) {
            return {
                success: false,
                conflicts: ['src/App.tsx', 'src/components/Editor.tsx'],
                mergedFiles: 3,
                message: 'Merge conflict detected',
            };
        }

        return {
            success: true,
            conflicts: [],
            mergedFiles: 5,
            message: `Successfully merged ${source}`,
        };
    },

    abortMerge: async () => {
        console.log('[Branch] Aborting merge');
        return true;
    },

    rebaseBranch: async (onto) => {
        console.log('[Branch] Rebasing onto:', onto);
        return true;
    },

    abortRebase: async () => {
        console.log('[Branch] Aborting rebase');
        return true;
    },

    continueRebase: async () => {
        console.log('[Branch] Continuing rebase');
        return true;
    },

    push: async (remote = 'origin', branch, force = false) => {
        const targetBranch = branch || get().currentBranch;
        console.log('[Branch] Pushing to:', remote, targetBranch, force ? '(force)' : '');

        // Update ahead/behind counts
        set(state => ({
            branches: state.branches.map(b =>
                b.name === targetBranch ? { ...b, ahead: 0 } : b
            ),
        }));

        return true;
    },

    pull: async (remote = 'origin', branch, rebase = false) => {
        const targetBranch = branch || get().currentBranch;
        console.log('[Branch] Pulling from:', remote, targetBranch, rebase ? '(rebase)' : '');

        // Update ahead/behind counts
        set(state => ({
            branches: state.branches.map(b =>
                b.name === targetBranch ? { ...b, behind: 0 } : b
            ),
        }));

        return true;
    },

    fetchRemote: async (remote = 'origin') => {
        console.log('[Branch] Fetching:', remote);
        return true;
    },

    getBranchByName: (name) => {
        return get().branches.find(b => b.name === name);
    },

    getLocalBranches: () => {
        return get().branches.filter(b => !b.isRemote);
    },

    getRemoteBranches: () => {
        return get().branches.filter(b => b.isRemote);
    },
}));
