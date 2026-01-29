/**
 * Multi-File Edit Engine
 * 
 * Generate and preview edits across multiple files with unified diff view.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface FileEdit {
    id: string;
    filePath: string;
    originalContent: string;
    newContent: string;
    hunks: EditHunk[];
    status: 'pending' | 'accepted' | 'rejected' | 'applied';
}

export interface EditHunk {
    startLine: number;
    endLine: number;
    originalLines: string[];
    newLines: string[];
    type: 'add' | 'delete' | 'modify';
}

export interface EditSession {
    id: string;
    description: string;
    createdAt: number;
    files: FileEdit[];
    status: 'preview' | 'partial' | 'applied' | 'reverted';
}

export interface MultiFileEditState {
    sessions: Map<string, EditSession>;
    activeSessionId: string | null;
    isGenerating: boolean;

    // Actions
    createSession: (description: string) => string;
    addFileEdit: (sessionId: string, edit: Omit<FileEdit, 'id' | 'status'>) => void;
    acceptFile: (sessionId: string, fileId: string) => void;
    rejectFile: (sessionId: string, fileId: string) => void;
    acceptAll: (sessionId: string) => void;
    rejectAll: (sessionId: string) => void;
    applySession: (sessionId: string) => Promise<boolean>;
    revertSession: (sessionId: string) => Promise<boolean>;
    getActiveSession: () => EditSession | undefined;
    getSessionFiles: (sessionId: string) => FileEdit[];

    // Generation
    generateEdits: (prompt: string, filePaths: string[]) => Promise<string>;
}

// =============================================================================
// MULTI-FILE EDIT STORE
// =============================================================================

export const useMultiFileEdit = create<MultiFileEditState>((set, get) => ({
    sessions: new Map(),
    activeSessionId: null,
    isGenerating: false,

    createSession: (description: string): string => {
        const id = `edit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const session: EditSession = {
            id,
            description,
            createdAt: Date.now(),
            files: [],
            status: 'preview',
        };

        set(state => ({
            sessions: new Map(state.sessions).set(id, session),
            activeSessionId: id,
        }));

        return id;
    },

    addFileEdit: (sessionId: string, edit: Omit<FileEdit, 'id' | 'status'>) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);

            if (session) {
                const fileEdit: FileEdit = {
                    ...edit,
                    id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    status: 'pending',
                };

                sessions.set(sessionId, {
                    ...session,
                    files: [...session.files, fileEdit],
                });
            }

            return { sessions };
        });
    },

    acceptFile: (sessionId: string, fileId: string) => {
        updateFileStatus(set, sessionId, fileId, 'accepted');
    },

    rejectFile: (sessionId: string, fileId: string) => {
        updateFileStatus(set, sessionId, fileId, 'rejected');
    },

    acceptAll: (sessionId: string) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);

            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    files: session.files.map(f => ({ ...f, status: 'accepted' as const })),
                });
            }

            return { sessions };
        });
    },

    rejectAll: (sessionId: string) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);

            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    files: session.files.map(f => ({ ...f, status: 'rejected' as const })),
                    status: 'preview',
                });
            }

            return { sessions };
        });
    },

    applySession: async (sessionId: string): Promise<boolean> => {
        const session = get().sessions.get(sessionId);
        if (!session) return false;

        const acceptedFiles = session.files.filter(f => f.status === 'accepted');

        try {
            // In real implementation, write files using Tauri
            for (const file of acceptedFiles) {
                console.log(`[MultiFileEdit] Applying: ${file.filePath}`);
                // await writeFile(file.filePath, file.newContent);
            }

            set(state => {
                const sessions = new Map(state.sessions);
                sessions.set(sessionId, {
                    ...session,
                    files: session.files.map(f =>
                        f.status === 'accepted' ? { ...f, status: 'applied' as const } : f
                    ),
                    status: acceptedFiles.length === session.files.length ? 'applied' : 'partial',
                });
                return { sessions };
            });

            return true;
        } catch (error) {
            console.error('[MultiFileEdit] Apply failed:', error);
            return false;
        }
    },

    revertSession: async (sessionId: string): Promise<boolean> => {
        const session = get().sessions.get(sessionId);
        if (!session) return false;

        const appliedFiles = session.files.filter(f => f.status === 'applied');

        try {
            // Restore original content
            for (const file of appliedFiles) {
                console.log(`[MultiFileEdit] Reverting: ${file.filePath}`);
                // await writeFile(file.filePath, file.originalContent);
            }

            set(state => {
                const sessions = new Map(state.sessions);
                sessions.set(sessionId, {
                    ...session,
                    files: session.files.map(f =>
                        f.status === 'applied' ? { ...f, status: 'pending' as const } : f
                    ),
                    status: 'reverted',
                });
                return { sessions };
            });

            return true;
        } catch (error) {
            console.error('[MultiFileEdit] Revert failed:', error);
            return false;
        }
    },

    getActiveSession: () => {
        const { activeSessionId, sessions } = get();
        return activeSessionId ? sessions.get(activeSessionId) : undefined;
    },

    getSessionFiles: (sessionId: string): FileEdit[] => {
        return get().sessions.get(sessionId)?.files || [];
    },

    generateEdits: async (prompt: string, filePaths: string[]): Promise<string> => {
        set({ isGenerating: true });

        try {
            // Create session
            const sessionId = get().createSession(prompt);

            // In real implementation, call AI to generate edits
            // For now, return mock edits
            const mockEdits = await mockGenerateEdits(prompt, filePaths);

            for (const edit of mockEdits) {
                get().addFileEdit(sessionId, edit);
            }

            set({ isGenerating: false });
            return sessionId;
        } catch (error) {
            set({ isGenerating: false });
            throw error;
        }
    },
}));

// Helper function
function updateFileStatus(
    set: (fn: (state: MultiFileEditState) => Partial<MultiFileEditState>) => void,
    sessionId: string,
    fileId: string,
    status: FileEdit['status']
) {
    set(state => {
        const sessions = new Map(state.sessions);
        const session = sessions.get(sessionId);

        if (session) {
            sessions.set(sessionId, {
                ...session,
                files: session.files.map(f =>
                    f.id === fileId ? { ...f, status } : f
                ),
            });
        }

        return { sessions };
    });
}

// =============================================================================
// MOCK GENERATION
// =============================================================================

async function mockGenerateEdits(
    prompt: string,
    filePaths: string[]
): Promise<Omit<FileEdit, 'id' | 'status'>[]> {
    await new Promise(resolve => setTimeout(resolve, 500));

    return filePaths.map(filePath => ({
        filePath,
        originalContent: `// Original content of ${filePath}\nconst x = 1;\n`,
        newContent: `// Updated content based on: ${prompt}\nconst x = 2;\n// New code added\n`,
        hunks: [
            {
                startLine: 2,
                endLine: 2,
                originalLines: ['const x = 1;'],
                newLines: ['const x = 2;', '// New code added'],
                type: 'modify' as const,
            },
        ],
    }));
}

// =============================================================================
// DIFF UTILITIES
// =============================================================================

/**
 * Compute hunks between two strings
 */
export function computeHunks(original: string, modified: string): EditHunk[] {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const hunks: EditHunk[] = [];

    let i = 0;
    let j = 0;

    while (i < originalLines.length || j < modifiedLines.length) {
        // Find matching lines
        if (originalLines[i] === modifiedLines[j]) {
            i++;
            j++;
            continue;
        }

        // Found difference
        const hunkStart = i;
        const origStart = i;
        const modStart = j;

        // Collect differing lines
        while (i < originalLines.length && originalLines[i] !== modifiedLines[j]) {
            i++;
        }
        while (j < modifiedLines.length && modifiedLines[j] !== originalLines[origStart]) {
            j++;
        }

        const originalHunk = originalLines.slice(origStart, i);
        const modifiedHunk = modifiedLines.slice(modStart, j);

        let type: EditHunk['type'] = 'modify';
        if (originalHunk.length === 0) type = 'add';
        if (modifiedHunk.length === 0) type = 'delete';

        hunks.push({
            startLine: hunkStart + 1,
            endLine: i,
            originalLines: originalHunk,
            newLines: modifiedHunk,
            type,
        });
    }

    return hunks;
}

/**
 * Format hunk for display
 */
export function formatHunk(hunk: EditHunk): string {
    const lines: string[] = [];

    lines.push(`@@ -${hunk.startLine},${hunk.originalLines.length} +${hunk.startLine},${hunk.newLines.length} @@`);

    for (const line of hunk.originalLines) {
        lines.push(`- ${line}`);
    }
    for (const line of hunk.newLines) {
        lines.push(`+ ${line}`);
    }

    return lines.join('\n');
}
