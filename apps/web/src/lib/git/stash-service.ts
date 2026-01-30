/**
 * Git Stash Service
 * 
 * Handles Git stash operations: save, pop, apply, drop, list.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface StashEntry {
    id: number;
    index: string;  // stash@{0}
    message: string;
    branch: string;
    date: Date;
    files: string[];
    includesUntracked: boolean;
}

export interface StashState {
    stashes: StashEntry[];
    isLoading: boolean;
    error: string | null;

    // Stash operations
    fetchStashes: () => Promise<void>;
    stash: (message?: string, includeUntracked?: boolean) => Promise<boolean>;
    stashPop: (index?: number) => Promise<boolean>;
    stashApply: (index?: number) => Promise<boolean>;
    stashDrop: (index?: number) => Promise<boolean>;
    stashClear: () => Promise<boolean>;
    stashShow: (index: number) => StashEntry | undefined;

    // Branch stashing
    stashBranch: (branchName: string, index?: number) => Promise<boolean>;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_STASHES: StashEntry[] = [
    {
        id: 0,
        index: 'stash@{0}',
        message: 'WIP: editor improvements',
        branch: 'feature/ide-enhancements',
        date: new Date(Date.now() - 3600000),
        files: ['src/components/Editor.tsx', 'src/lib/editor/monaco.ts'],
        includesUntracked: false,
    },
    {
        id: 1,
        index: 'stash@{1}',
        message: 'WIP: debugging session state',
        branch: 'develop',
        date: new Date(Date.now() - 86400000),
        files: ['src/lib/debug/debugger.ts', 'src/components/DebugPanel.tsx', 'src/styles/debug.css'],
        includesUntracked: true,
    },
    {
        id: 2,
        index: 'stash@{2}',
        message: 'Backup before merge',
        branch: 'main',
        date: new Date(Date.now() - 172800000),
        files: ['src/App.tsx'],
        includesUntracked: false,
    },
];

// =============================================================================
// STASH STORE
// =============================================================================

export const useStashService = create<StashState>((set, get) => ({
    stashes: MOCK_STASHES,
    isLoading: false,
    error: null,

    fetchStashes: async () => {
        set({ isLoading: true, error: null });

        await new Promise(resolve => setTimeout(resolve, 200));

        set({
            stashes: MOCK_STASHES,
            isLoading: false,
        });
    },

    stash: async (message, includeUntracked = false) => {
        const stashMessage = message || `WIP on ${new Date().toLocaleDateString()}`;
        console.log('[Stash] Creating stash:', stashMessage, includeUntracked ? '(+untracked)' : '');

        const newStash: StashEntry = {
            id: get().stashes.length,
            index: `stash@{0}`,
            message: stashMessage,
            branch: 'main',
            date: new Date(),
            files: ['src/current-changes.ts'],
            includesUntracked: includeUntracked,
        };

        // Shift existing stash indices
        set(state => ({
            stashes: [
                newStash,
                ...state.stashes.map((s, i) => ({
                    ...s,
                    id: i + 1,
                    index: `stash@{${i + 1}}`,
                })),
            ],
        }));

        return true;
    },

    stashPop: async (index = 0) => {
        console.log('[Stash] Popping stash:', index);

        const stash = get().stashes[index];
        if (!stash) {
            set({ error: 'Stash not found' });
            return false;
        }

        // Remove the stash and reindex
        set(state => ({
            stashes: state.stashes
                .filter((_, i) => i !== index)
                .map((s, i) => ({
                    ...s,
                    id: i,
                    index: `stash@{${i}}`,
                })),
        }));

        return true;
    },

    stashApply: async (index = 0) => {
        console.log('[Stash] Applying stash:', index);

        const stash = get().stashes[index];
        if (!stash) {
            set({ error: 'Stash not found' });
            return false;
        }

        // Apply doesn't remove the stash
        return true;
    },

    stashDrop: async (index = 0) => {
        console.log('[Stash] Dropping stash:', index);

        set(state => ({
            stashes: state.stashes
                .filter((_, i) => i !== index)
                .map((s, i) => ({
                    ...s,
                    id: i,
                    index: `stash@{${i}}`,
                })),
        }));

        return true;
    },

    stashClear: async () => {
        console.log('[Stash] Clearing all stashes');
        set({ stashes: [] });
        return true;
    },

    stashShow: (index) => {
        return get().stashes[index];
    },

    stashBranch: async (branchName, index = 0) => {
        console.log('[Stash] Creating branch from stash:', branchName, index);

        // Pop the stash and create a branch (in real implementation)
        await get().stashPop(index);

        return true;
    },
}));
