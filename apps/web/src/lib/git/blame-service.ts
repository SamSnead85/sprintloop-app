/**
 * Git Blame Service
 * 
 * Shows line-by-line commit history for files.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface BlameEntry {
    lineNumber: number;
    commit: {
        hash: string;
        shortHash: string;
        author: string;
        authorEmail: string;
        date: Date;
        message: string;
    };
    content: string;
    isHovered?: boolean;
}

export interface BlameFile {
    path: string;
    entries: BlameEntry[];
    isLoading: boolean;
}

export interface BlameState {
    blameFiles: Map<string, BlameFile>;
    isBlameVisible: boolean;
    hoveredLine: number | null;
    selectedCommit: string | null;

    // Blame operations
    fetchBlame: (filePath: string) => Promise<void>;
    clearBlame: (filePath: string) => void;
    toggleBlame: () => void;

    // Hover/selection
    setHoveredLine: (line: number | null) => void;
    selectCommit: (hash: string | null) => void;

    // Getters
    getBlameForFile: (filePath: string) => BlameEntry[];
    getBlameForLine: (filePath: string, line: number) => BlameEntry | undefined;
    getCommitHistory: (filePath: string) => Array<{ hash: string; count: number; author: string }>;
}

// =============================================================================
// MOCK BLAME DATA
// =============================================================================

function generateMockBlame(filePath: string): BlameEntry[] {
    const commits = [
        {
            hash: '2c08a71',
            shortHash: '2c08a71',
            author: 'Developer',
            authorEmail: 'dev@example.com',
            date: new Date(Date.now() - 3600000),
            message: 'feat: Phase 14 - context menus and refactoring',
        },
        {
            hash: '00afaf3',
            shortHash: '00afaf3',
            author: 'Developer',
            authorEmail: 'dev@example.com',
            date: new Date(Date.now() - 86400000),
            message: 'feat: Phase 13 - editor enhancements and themes',
        },
        {
            hash: 'abc1234',
            shortHash: 'abc1234',
            author: 'Developer',
            authorEmail: 'dev@example.com',
            date: new Date(Date.now() - 172800000),
            message: 'feat: Phase 12 - navigation and notifications',
        },
        {
            hash: 'def5678',
            shortHash: 'def5678',
            author: 'Contributor',
            authorEmail: 'contrib@example.com',
            date: new Date(Date.now() - 259200000),
            message: 'fix: minor bug fixes',
        },
    ];

    const lines = 50;
    const entries: BlameEntry[] = [];

    for (let i = 1; i <= lines; i++) {
        const commitIndex = Math.floor(Math.random() * commits.length);
        entries.push({
            lineNumber: i,
            commit: commits[commitIndex],
            content: `// Line ${i} of ${filePath}`,
        });
    }

    return entries;
}

// =============================================================================
// BLAME STORE
// =============================================================================

export const useBlameService = create<BlameState>((set, get) => ({
    blameFiles: new Map(),
    isBlameVisible: false,
    hoveredLine: null,
    selectedCommit: null,

    fetchBlame: async (filePath) => {
        console.log('[Blame] Fetching blame for:', filePath);

        // Set loading state
        set(state => {
            const newFiles = new Map(state.blameFiles);
            newFiles.set(filePath, {
                path: filePath,
                entries: [],
                isLoading: true,
            });
            return { blameFiles: newFiles };
        });

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generate mock data
        const entries = generateMockBlame(filePath);

        set(state => {
            const newFiles = new Map(state.blameFiles);
            newFiles.set(filePath, {
                path: filePath,
                entries,
                isLoading: false,
            });
            return { blameFiles: newFiles };
        });
    },

    clearBlame: (filePath) => {
        set(state => {
            const newFiles = new Map(state.blameFiles);
            newFiles.delete(filePath);
            return { blameFiles: newFiles };
        });
    },

    toggleBlame: () => {
        set(state => ({ isBlameVisible: !state.isBlameVisible }));
    },

    setHoveredLine: (line) => {
        set({ hoveredLine: line });
    },

    selectCommit: (hash) => {
        set({ selectedCommit: hash });
    },

    getBlameForFile: (filePath) => {
        return get().blameFiles.get(filePath)?.entries || [];
    },

    getBlameForLine: (filePath, line) => {
        return get().blameFiles.get(filePath)?.entries.find(e => e.lineNumber === line);
    },

    getCommitHistory: (filePath) => {
        const entries = get().getBlameForFile(filePath);
        const commitCounts = new Map<string, { count: number; author: string }>();

        for (const entry of entries) {
            const existing = commitCounts.get(entry.commit.hash);
            if (existing) {
                existing.count++;
            } else {
                commitCounts.set(entry.commit.hash, {
                    count: 1,
                    author: entry.commit.author,
                });
            }
        }

        return Array.from(commitCounts.entries())
            .map(([hash, data]) => ({ hash, ...data }))
            .sort((a, b) => b.count - a.count);
    },
}));

// =============================================================================
// UTILITIES
// =============================================================================

export function formatBlameDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
}

export function getBlameColor(commitHash: string): string {
    // Generate a consistent color based on commit hash
    let hash = 0;
    for (let i = 0; i < commitHash.length; i++) {
        hash = commitHash.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = hash % 360;
    return `hsl(${hue}, 60%, 70%)`;
}
