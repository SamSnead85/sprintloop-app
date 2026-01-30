/**
 * Diff Editor Service
 * 
 * Side-by-side and inline diff viewing with change navigation.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface DiffChange {
    type: 'add' | 'delete' | 'modify';
    originalStartLine: number;
    originalEndLine: number;
    modifiedStartLine: number;
    modifiedEndLine: number;
    originalContent: string[];
    modifiedContent: string[];
}

export interface DiffHunk {
    originalStart: number;
    originalCount: number;
    modifiedStart: number;
    modifiedCount: number;
    changes: DiffChange[];
}

export interface DiffResult {
    originalPath: string;
    modifiedPath: string;
    hunks: DiffHunk[];
    additions: number;
    deletions: number;
    isBinary: boolean;
}

export type DiffViewMode = 'side-by-side' | 'inline';

export interface DiffEditorState {
    currentDiff: DiffResult | null;
    viewMode: DiffViewMode;
    isLoading: boolean;
    currentChangeIndex: number;
    showWhitespace: boolean;
    wordWrap: boolean;
    ignoreWhitespace: boolean;
    contextLines: number;

    // Diff Operations
    computeDiff: (original: string, modified: string, paths?: { original: string; modified: string }) => Promise<DiffResult>;
    setDiff: (diff: DiffResult | null) => void;
    clearDiff: () => void;

    // Navigation
    goToNextChange: () => void;
    goToPreviousChange: () => void;
    goToChange: (index: number) => void;
    getTotalChanges: () => number;

    // View Options
    setViewMode: (mode: DiffViewMode) => void;
    toggleShowWhitespace: () => void;
    toggleWordWrap: () => void;
    setIgnoreWhitespace: (ignore: boolean) => void;
    setContextLines: (lines: number) => void;

    // Actions
    acceptChange: (changeIndex: number) => void;
    rejectChange: (changeIndex: number) => void;
    acceptAllChanges: () => void;
    rejectAllChanges: () => void;
}

// =============================================================================
// DIFF STORE
// =============================================================================

export const useDiffEditor = create<DiffEditorState>((set, get) => ({
    currentDiff: null,
    viewMode: 'side-by-side',
    isLoading: false,
    currentChangeIndex: 0,
    showWhitespace: false,
    wordWrap: true,
    ignoreWhitespace: false,
    contextLines: 3,

    computeDiff: async (original, modified, paths) => {
        set({ isLoading: true });

        try {
            await new Promise(resolve => setTimeout(resolve, 50));

            const result = computeLineDiff(
                original,
                modified,
                paths?.original || 'original',
                paths?.modified || 'modified',
                get().ignoreWhitespace
            );

            set({ currentDiff: result, isLoading: false, currentChangeIndex: 0 });
            return result;
        } catch (error) {
            console.error('[DiffEditor] Failed to compute diff:', error);
            set({ isLoading: false });
            throw error;
        }
    },

    setDiff: (diff) => {
        set({ currentDiff: diff, currentChangeIndex: 0 });
    },

    clearDiff: () => {
        set({ currentDiff: null, currentChangeIndex: 0 });
    },

    goToNextChange: () => {
        const total = get().getTotalChanges();
        if (total === 0) return;

        const next = (get().currentChangeIndex + 1) % total;
        set({ currentChangeIndex: next });
    },

    goToPreviousChange: () => {
        const total = get().getTotalChanges();
        if (total === 0) return;

        const prev = get().currentChangeIndex === 0 ? total - 1 : get().currentChangeIndex - 1;
        set({ currentChangeIndex: prev });
    },

    goToChange: (index) => {
        const total = get().getTotalChanges();
        if (index >= 0 && index < total) {
            set({ currentChangeIndex: index });
        }
    },

    getTotalChanges: () => {
        const diff = get().currentDiff;
        if (!diff) return 0;
        return diff.hunks.reduce((sum, h) => sum + h.changes.length, 0);
    },

    setViewMode: (mode) => {
        set({ viewMode: mode });
    },

    toggleShowWhitespace: () => {
        set(state => ({ showWhitespace: !state.showWhitespace }));
    },

    toggleWordWrap: () => {
        set(state => ({ wordWrap: !state.wordWrap }));
    },

    setIgnoreWhitespace: (ignore) => {
        set({ ignoreWhitespace: ignore });
    },

    setContextLines: (lines) => {
        set({ contextLines: Math.max(0, Math.min(10, lines)) });
    },

    acceptChange: (changeIndex) => {
        console.log('[DiffEditor] Accepting change:', changeIndex);
        // In real implementation, apply change to modified file
    },

    rejectChange: (changeIndex) => {
        console.log('[DiffEditor] Rejecting change:', changeIndex);
        // In real implementation, revert change in modified file
    },

    acceptAllChanges: () => {
        console.log('[DiffEditor] Accepting all changes');
    },

    rejectAllChanges: () => {
        console.log('[DiffEditor] Rejecting all changes');
    },
}));

// =============================================================================
// DIFF ALGORITHM
// =============================================================================

function computeLineDiff(
    original: string,
    modified: string,
    originalPath: string,
    modifiedPath: string,
    ignoreWhitespace: boolean
): DiffResult {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');

    const processLine = (line: string) =>
        ignoreWhitespace ? line.trim() : line;

    // Simple LCS-based diff
    const lcs = computeLCS(
        originalLines.map(processLine),
        modifiedLines.map(processLine)
    );

    const changes: DiffChange[] = [];
    let originalIndex = 0;
    let modifiedIndex = 0;
    let lcsIndex = 0;

    while (originalIndex < originalLines.length || modifiedIndex < modifiedLines.length) {
        if (lcsIndex < lcs.length &&
            originalIndex < originalLines.length &&
            modifiedIndex < modifiedLines.length &&
            processLine(originalLines[originalIndex]) === lcs[lcsIndex] &&
            processLine(modifiedLines[modifiedIndex]) === lcs[lcsIndex]) {
            // Lines match
            originalIndex++;
            modifiedIndex++;
            lcsIndex++;
        } else {
            // Find extent of change
            const changeStart = { original: originalIndex, modified: modifiedIndex };

            // Count deletions
            while (originalIndex < originalLines.length &&
                (lcsIndex >= lcs.length || processLine(originalLines[originalIndex]) !== lcs[lcsIndex])) {
                originalIndex++;
            }

            // Count additions
            while (modifiedIndex < modifiedLines.length &&
                (lcsIndex >= lcs.length || processLine(modifiedLines[modifiedIndex]) !== lcs[lcsIndex])) {
                modifiedIndex++;
            }

            const deletions = originalIndex - changeStart.original;
            const additions = modifiedIndex - changeStart.modified;

            if (deletions > 0 || additions > 0) {
                let type: 'add' | 'delete' | 'modify' = 'modify';
                if (deletions === 0) type = 'add';
                if (additions === 0) type = 'delete';

                changes.push({
                    type,
                    originalStartLine: changeStart.original + 1,
                    originalEndLine: originalIndex,
                    modifiedStartLine: changeStart.modified + 1,
                    modifiedEndLine: modifiedIndex,
                    originalContent: originalLines.slice(changeStart.original, originalIndex),
                    modifiedContent: modifiedLines.slice(changeStart.modified, modifiedIndex),
                });
            }
        }
    }

    // Group changes into hunks
    const hunks = groupChangesIntoHunks(changes, 3);

    const additions = changes.reduce((sum, c) =>
        sum + (c.type === 'add' ? c.modifiedContent.length :
            c.type === 'modify' ? c.modifiedContent.length : 0), 0);
    const deletions = changes.reduce((sum, c) =>
        sum + (c.type === 'delete' ? c.originalContent.length :
            c.type === 'modify' ? c.originalContent.length : 0), 0);

    return {
        originalPath,
        modifiedPath,
        hunks,
        additions,
        deletions,
        isBinary: false,
    };
}

function computeLCS(a: string[], b: string[]): string[] {
    const m = a.length;
    const n = b.length;

    // Use space-optimized LCS
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to find LCS
    const lcs: string[] = [];
    let i = m, j = n;

    while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
            lcs.unshift(a[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    return lcs;
}

function groupChangesIntoHunks(changes: DiffChange[], contextLines: number): DiffHunk[] {
    if (changes.length === 0) return [];

    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;

    for (const change of changes) {
        if (!currentHunk ||
            change.originalStartLine - currentHunk.originalStart - currentHunk.originalCount > contextLines * 2) {
            // Start new hunk
            if (currentHunk) {
                hunks.push(currentHunk);
            }
            currentHunk = {
                originalStart: Math.max(1, change.originalStartLine - contextLines),
                originalCount: 0,
                modifiedStart: Math.max(1, change.modifiedStartLine - contextLines),
                modifiedCount: 0,
                changes: [],
            };
        }

        currentHunk.changes.push(change);
        currentHunk.originalCount = change.originalEndLine - currentHunk.originalStart + contextLines;
        currentHunk.modifiedCount = change.modifiedEndLine - currentHunk.modifiedStart + contextLines;
    }

    if (currentHunk) {
        hunks.push(currentHunk);
    }

    return hunks;
}

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

export function formatDiffStats(diff: DiffResult): string {
    return `+${diff.additions} -${diff.deletions}`;
}

export function formatHunkHeader(hunk: DiffHunk): string {
    return `@@ -${hunk.originalStart},${hunk.originalCount} +${hunk.modifiedStart},${hunk.modifiedCount} @@`;
}

export function getChangeColor(type: 'add' | 'delete' | 'modify'): {
    bg: string;
    border: string;
    highlight: string;
} {
    switch (type) {
        case 'add':
            return {
                bg: 'rgba(34, 197, 94, 0.15)',
                border: 'rgb(34, 197, 94)',
                highlight: 'rgba(34, 197, 94, 0.3)',
            };
        case 'delete':
            return {
                bg: 'rgba(239, 68, 68, 0.15)',
                border: 'rgb(239, 68, 68)',
                highlight: 'rgba(239, 68, 68, 0.3)',
            };
        case 'modify':
            return {
                bg: 'rgba(59, 130, 246, 0.15)',
                border: 'rgb(59, 130, 246)',
                highlight: 'rgba(59, 130, 246, 0.3)',
            };
    }
}
