/**
 * Merge Conflict Resolution Service
 * 
 * Handles merge conflict detection, display, and resolution.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface ConflictHunk {
    id: string;
    startLine: number;
    endLine: number;
    ourContent: string[];
    theirContent: string[];
    baseContent?: string[];
    resolution?: 'ours' | 'theirs' | 'both' | 'custom';
    customContent?: string[];
}

export interface ConflictFile {
    path: string;
    hunks: ConflictHunk[];
    isResolved: boolean;
    resolvedContent?: string;
}

export interface MergeConflictState {
    isInMerge: boolean;
    mergeSource: string | null;
    conflictFiles: ConflictFile[];
    currentFile: string | null;

    // Conflict detection
    detectConflicts: (content: string, filePath: string) => ConflictHunk[];
    hasConflicts: () => boolean;
    getConflictCount: () => number;

    // Resolution operations
    resolveHunk: (filePath: string, hunkId: string, resolution: 'ours' | 'theirs' | 'both' | 'custom', customContent?: string[]) => void;
    resolveFile: (filePath: string, resolution: 'ours' | 'theirs' | 'both') => void;
    markFileResolved: (filePath: string) => void;

    // File content
    getResolvedContent: (filePath: string) => string;
    applyResolution: (filePath: string) => Promise<boolean>;

    // Merge completion
    canCompleteMerge: () => boolean;
    completeMerge: (message: string) => Promise<boolean>;
    abortMerge: () => Promise<boolean>;

    // State management
    setMergeState: (isInMerge: boolean, source?: string, files?: ConflictFile[]) => void;
    setCurrentFile: (path: string | null) => void;
}

// =============================================================================
// MOCK CONFLICTS
// =============================================================================

const MOCK_CONFLICT_FILES: ConflictFile[] = [
    {
        path: 'src/App.tsx',
        isResolved: false,
        hunks: [
            {
                id: 'hunk1',
                startLine: 15,
                endLine: 25,
                ourContent: [
                    'function App() {',
                    '    const [state, setState] = useState("main");',
                    '    return <div>Main branch version</div>;',
                    '}',
                ],
                theirContent: [
                    'function App() {',
                    '    const [state, setState] = useState("feature");',
                    '    const feature = useFeature();',
                    '    return <div>Feature branch version</div>;',
                    '}',
                ],
                baseContent: [
                    'function App() {',
                    '    return <div>Original</div>;',
                    '}',
                ],
            },
        ],
    },
    {
        path: 'src/components/Editor.tsx',
        isResolved: false,
        hunks: [
            {
                id: 'hunk2',
                startLine: 42,
                endLine: 50,
                ourContent: [
                    'export function Editor({ theme }: EditorProps) {',
                    '    return <MonacoEditor theme={theme} />;',
                    '}',
                ],
                theirContent: [
                    'export function Editor({ theme, language }: EditorProps) {',
                    '    return <MonacoEditor theme={theme} language={language} />;',
                    '}',
                ],
            },
            {
                id: 'hunk3',
                startLine: 75,
                endLine: 82,
                ourContent: [
                    'const config = { lineNumbers: true };',
                ],
                theirContent: [
                    'const config = { lineNumbers: true, minimap: { enabled: true } };',
                ],
            },
        ],
    },
];

// =============================================================================
// MERGE CONFLICT STORE
// =============================================================================

export const useMergeConflictService = create<MergeConflictState>((set, get) => ({
    isInMerge: false,
    mergeSource: null,
    conflictFiles: [],
    currentFile: null,

    detectConflicts: (content, filePath) => {
        const hunks: ConflictHunk[] = [];
        const lines = content.split('\n');
        let inConflict = false;
        let currentHunk: Partial<ConflictHunk> | null = null;
        let section: 'ours' | 'theirs' | 'base' = 'ours';
        let hunkId = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.startsWith('<<<<<<<')) {
                inConflict = true;
                currentHunk = {
                    id: `${filePath}_hunk_${hunkId++}`,
                    startLine: i + 1,
                    ourContent: [],
                    theirContent: [],
                };
                section = 'ours';
            } else if (line.startsWith('|||||||') && currentHunk) {
                section = 'base';
                currentHunk.baseContent = [];
            } else if (line.startsWith('=======') && currentHunk) {
                section = 'theirs';
            } else if (line.startsWith('>>>>>>>') && currentHunk) {
                currentHunk.endLine = i + 1;
                hunks.push(currentHunk as ConflictHunk);
                inConflict = false;
                currentHunk = null;
            } else if (inConflict && currentHunk) {
                if (section === 'ours') {
                    currentHunk.ourContent!.push(line);
                } else if (section === 'theirs') {
                    currentHunk.theirContent!.push(line);
                } else if (section === 'base' && currentHunk.baseContent) {
                    currentHunk.baseContent.push(line);
                }
            }
        }

        return hunks;
    },

    hasConflicts: () => {
        return get().conflictFiles.some(f => !f.isResolved);
    },

    getConflictCount: () => {
        return get().conflictFiles.reduce((sum, f) =>
            sum + (f.isResolved ? 0 : f.hunks.filter(h => !h.resolution).length), 0
        );
    },

    resolveHunk: (filePath, hunkId, resolution, customContent) => {
        set(state => ({
            conflictFiles: state.conflictFiles.map(file => {
                if (file.path !== filePath) return file;

                const updatedHunks = file.hunks.map(hunk => {
                    if (hunk.id !== hunkId) return hunk;
                    return {
                        ...hunk,
                        resolution,
                        customContent: customContent || undefined,
                    };
                });

                const isResolved = updatedHunks.every(h => h.resolution);

                return {
                    ...file,
                    hunks: updatedHunks,
                    isResolved,
                };
            }),
        }));
    },

    resolveFile: (filePath, resolution) => {
        set(state => ({
            conflictFiles: state.conflictFiles.map(file => {
                if (file.path !== filePath) return file;

                return {
                    ...file,
                    hunks: file.hunks.map(hunk => ({
                        ...hunk,
                        resolution,
                    })),
                    isResolved: true,
                };
            }),
        }));
    },

    markFileResolved: (filePath) => {
        set(state => ({
            conflictFiles: state.conflictFiles.map(file =>
                file.path === filePath ? { ...file, isResolved: true } : file
            ),
        }));
    },

    getResolvedContent: (filePath) => {
        const file = get().conflictFiles.find(f => f.path === filePath);
        if (!file) return '';

        // Build resolved content from hunks
        const resolvedLines: string[] = [];

        for (const hunk of file.hunks) {
            if (hunk.resolution === 'custom' && hunk.customContent) {
                resolvedLines.push(...hunk.customContent);
            } else if (hunk.resolution === 'ours') {
                resolvedLines.push(...hunk.ourContent);
            } else if (hunk.resolution === 'theirs') {
                resolvedLines.push(...hunk.theirContent);
            } else if (hunk.resolution === 'both') {
                resolvedLines.push(...hunk.ourContent);
                resolvedLines.push(...hunk.theirContent);
            }
        }

        return resolvedLines.join('\n');
    },

    applyResolution: async (filePath) => {
        console.log('[MergeConflict] Applying resolution for:', filePath);

        const content = get().getResolvedContent(filePath);
        // In real implementation, write to file system
        console.log('[MergeConflict] Resolved content:', content.slice(0, 100) + '...');

        get().markFileResolved(filePath);
        return true;
    },

    canCompleteMerge: () => {
        return get().conflictFiles.every(f => f.isResolved);
    },

    completeMerge: async (message) => {
        if (!get().canCompleteMerge()) {
            console.error('[MergeConflict] Cannot complete merge - unresolved conflicts');
            return false;
        }

        console.log('[MergeConflict] Completing merge with message:', message);

        set({
            isInMerge: false,
            mergeSource: null,
            conflictFiles: [],
            currentFile: null,
        });

        return true;
    },

    abortMerge: async () => {
        console.log('[MergeConflict] Aborting merge');

        set({
            isInMerge: false,
            mergeSource: null,
            conflictFiles: [],
            currentFile: null,
        });

        return true;
    },

    setMergeState: (isInMerge, source, files) => {
        set({
            isInMerge,
            mergeSource: source || null,
            conflictFiles: files || MOCK_CONFLICT_FILES,
        });
    },

    setCurrentFile: (path) => {
        set({ currentFile: path });
    },
}));

// =============================================================================
// UTILITIES
// =============================================================================

export function formatConflictMarkers(hunk: ConflictHunk): string[] {
    const lines: string[] = [];
    lines.push('<<<<<<< HEAD (Current Change)');
    lines.push(...hunk.ourContent);
    if (hunk.baseContent) {
        lines.push('||||||| base');
        lines.push(...hunk.baseContent);
    }
    lines.push('=======');
    lines.push(...hunk.theirContent);
    lines.push('>>>>>>> Incoming Change');
    return lines;
}
