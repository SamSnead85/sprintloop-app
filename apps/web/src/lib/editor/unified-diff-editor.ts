/**
 * SprintLoop Unified Diff Editor
 * 
 * Implements Aider-style unified diff format for reliable code edits.
 * The unified diff format has been proven to make AI models 3x less lazy
 * and produce better code generation.
 * 
 * Key patterns adopted from open-source:
 * - Aider: udiff format with intelligent hunk application
 * - OpenCode: Auto-compact when approaching context limit
 * - Continue.dev: Context provider plugin system
 */

import { create } from 'zustand'

// Diff hunk representing a change
export interface DiffHunk {
    id: string
    oldStart: number
    oldCount: number
    newStart: number
    newCount: number
    oldLines: string[]
    newLines: string[]
    contextBefore: string[]
    contextAfter: string[]
}

// Parsed unified diff
export interface UnifiedDiff {
    filePath: string
    hunks: DiffHunk[]
    oldContent: string
    newContent: string
    language: string
}

// Edit operation status
export type EditStatus = 'pending' | 'applying' | 'applied' | 'failed' | 'rejected'

// File edit with diff
export interface FileEdit {
    id: string
    filePath: string
    diff: UnifiedDiff
    status: EditStatus
    error?: string
    timestamp: number
}

// State for diff editor
interface DiffEditorState {
    pendingEdits: FileEdit[]
    appliedEdits: FileEdit[]
    isApplying: boolean

    // Actions
    addEdit: (filePath: string, diff: UnifiedDiff) => void
    applyEdit: (editId: string) => Promise<boolean>
    applyAllEdits: () => Promise<{ success: number; failed: number }>
    rejectEdit: (editId: string) => void
    clearEdits: () => void

    // Diff parsing
    parseUnifiedDiff: (diffText: string) => UnifiedDiff | null
    generateUnifiedDiff: (oldContent: string, newContent: string, filePath: string) => UnifiedDiff
}

// Parse a unified diff string into structured hunks
function parseUnifiedDiffText(diffText: string): DiffHunk[] {
    const hunks: DiffHunk[] = []
    const lines = diffText.split('\n')
    let currentHunk: DiffHunk | null = null
    let lineIndex = 0

    // Pattern for hunk header: @@ -old_start,old_count +new_start,new_count @@
    const hunkHeaderPattern = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/

    for (const line of lines) {
        const headerMatch = line.match(hunkHeaderPattern)

        if (headerMatch) {
            // Save previous hunk if exists
            if (currentHunk) {
                hunks.push(currentHunk)
            }

            // Start new hunk
            currentHunk = {
                id: `hunk-${Date.now()}-${lineIndex}`,
                oldStart: parseInt(headerMatch[1], 10),
                oldCount: headerMatch[2] ? parseInt(headerMatch[2], 10) : 1,
                newStart: parseInt(headerMatch[3], 10),
                newCount: headerMatch[4] ? parseInt(headerMatch[4], 10) : 1,
                oldLines: [],
                newLines: [],
                contextBefore: [],
                contextAfter: [],
            }
        } else if (currentHunk) {
            if (line.startsWith('-')) {
                // Removed line
                currentHunk.oldLines.push(line.substring(1))
            } else if (line.startsWith('+')) {
                // Added line
                currentHunk.newLines.push(line.substring(1))
            } else if (line.startsWith(' ') || line === '') {
                // Context line
                const contextLine = line.startsWith(' ') ? line.substring(1) : ''
                if (currentHunk.oldLines.length === 0 && currentHunk.newLines.length === 0) {
                    currentHunk.contextBefore.push(contextLine)
                } else {
                    currentHunk.contextAfter.push(contextLine)
                }
            }
        }

        lineIndex++
    }

    // Add final hunk
    if (currentHunk) {
        hunks.push(currentHunk)
    }

    return hunks
}

// Apply a hunk to content with intelligent fallback (Aider pattern)
function applyHunk(content: string, hunk: DiffHunk): { success: boolean; result: string; error?: string } {
    const lines = content.split('\n')

    // Strategy 1: Exact match at specified line
    const startLine = hunk.oldStart - 1
    const oldLines = hunk.oldLines

    // Check if old lines match at expected position
    let matchFound = true
    for (let i = 0; i < oldLines.length; i++) {
        if (lines[startLine + i]?.trim() !== oldLines[i].trim()) {
            matchFound = false
            break
        }
    }

    if (matchFound) {
        // Apply the change
        const before = lines.slice(0, startLine)
        const after = lines.slice(startLine + oldLines.length)
        const result = [...before, ...hunk.newLines, ...after].join('\n')
        return { success: true, result }
    }

    // Strategy 2: Search for old content anywhere in file (with context)
    const searchContent = oldLines.join('\n')
    const contentIndex = content.indexOf(searchContent)

    if (contentIndex !== -1) {
        const before = content.substring(0, contentIndex)
        const after = content.substring(contentIndex + searchContent.length)
        const result = before + hunk.newLines.join('\n') + after
        return { success: true, result }
    }

    // Strategy 3: Try with normalized whitespace
    const normalizedOld = oldLines.map(l => l.trim()).join('\n')
    const normalizedContent = lines.map(l => l.trim()).join('\n')

    if (normalizedContent.includes(normalizedOld)) {
        // Find the actual lines and replace
        for (let i = 0; i <= lines.length - oldLines.length; i++) {
            const windowMatch = lines.slice(i, i + oldLines.length)
                .every((l, j) => l.trim() === oldLines[j].trim())

            if (windowMatch) {
                const before = lines.slice(0, i)
                const after = lines.slice(i + oldLines.length)
                // Preserve indentation from first matched line
                const indent = lines[i].match(/^(\s*)/)?.[1] || ''
                const indentedNew = hunk.newLines.map(l => indent + l.trimStart())
                const result = [...before, ...indentedNew, ...after].join('\n')
                return { success: true, result }
            }
        }
    }

    return {
        success: false,
        result: content,
        error: `Could not locate code to replace. Expected:\n${oldLines.slice(0, 3).join('\n')}...`
    }
}

// Generate unified diff from old and new content
function generateDiff(oldContent: string, newContent: string, filePath: string): UnifiedDiff {
    const oldLines = oldContent.split('\n')
    const newLines = newContent.split('\n')
    const hunks: DiffHunk[] = []

    // Simple diff algorithm - find changed regions
    let i = 0, j = 0
    let hunkId = 0

    while (i < oldLines.length || j < newLines.length) {
        // Skip matching lines
        if (oldLines[i] === newLines[j]) {
            i++
            j++
            continue
        }

        // Found a difference - collect the hunk
        const oldStart = i + 1
        const newStart = j + 1
        const diffOldLines: string[] = []
        const diffNewLines: string[] = []
        const contextBefore: string[] = []

        // Add context before (up to 3 lines)
        for (let c = Math.max(0, i - 3); c < i; c++) {
            contextBefore.push(oldLines[c] || '')
        }

        // Collect changed lines
        while (i < oldLines.length && oldLines[i] !== newLines[j]) {
            diffOldLines.push(oldLines[i])
            i++
        }

        while (j < newLines.length && newLines[j] !== oldLines[i]) {
            diffNewLines.push(newLines[j])
            j++
        }

        hunks.push({
            id: `hunk-${Date.now()}-${hunkId++}`,
            oldStart,
            oldCount: diffOldLines.length,
            newStart,
            newCount: diffNewLines.length,
            oldLines: diffOldLines,
            newLines: diffNewLines,
            contextBefore,
            contextAfter: [],
        })
    }

    // Detect language from file extension
    const ext = filePath.split('.').pop() || ''
    const languageMap: Record<string, string> = {
        ts: 'typescript', tsx: 'typescript',
        js: 'javascript', jsx: 'javascript',
        py: 'python', rs: 'rust', go: 'go',
        java: 'java', cpp: 'cpp', c: 'c',
        css: 'css', scss: 'scss', html: 'html',
        json: 'json', md: 'markdown', yaml: 'yaml',
    }

    return {
        filePath,
        hunks,
        oldContent,
        newContent,
        language: languageMap[ext] || 'plaintext',
    }
}

// Zustand store for diff editor
export const useDiffEditor = create<DiffEditorState>((set, get) => ({
    pendingEdits: [],
    appliedEdits: [],
    isApplying: false,

    addEdit: (filePath, diff) => {
        const edit: FileEdit = {
            id: `edit-${Date.now()}`,
            filePath,
            diff,
            status: 'pending',
            timestamp: Date.now(),
        }

        set(state => ({
            pendingEdits: [...state.pendingEdits, edit],
        }))
    },

    applyEdit: async (editId) => {
        const { pendingEdits } = get()
        const edit = pendingEdits.find(e => e.id === editId)

        if (!edit) return false

        set(state => ({
            pendingEdits: state.pendingEdits.map(e =>
                e.id === editId ? { ...e, status: 'applying' as EditStatus } : e
            ),
            isApplying: true,
        }))

        try {
            // Apply each hunk sequentially
            let content = edit.diff.oldContent

            for (const hunk of edit.diff.hunks) {
                const result = applyHunk(content, hunk)

                if (!result.success) {
                    set(state => ({
                        pendingEdits: state.pendingEdits.map(e =>
                            e.id === editId ? { ...e, status: 'failed' as EditStatus, error: result.error } : e
                        ),
                        isApplying: false,
                    }))
                    return false
                }

                content = result.result
            }

            // Move to applied
            set(state => ({
                pendingEdits: state.pendingEdits.filter(e => e.id !== editId),
                appliedEdits: [...state.appliedEdits, { ...edit, status: 'applied' as EditStatus }],
                isApplying: false,
            }))

            return true
        } catch (error) {
            set(state => ({
                pendingEdits: state.pendingEdits.map(e =>
                    e.id === editId ? {
                        ...e,
                        status: 'failed' as EditStatus,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    } : e
                ),
                isApplying: false,
            }))
            return false
        }
    },

    applyAllEdits: async () => {
        const { pendingEdits, applyEdit } = get()
        let success = 0
        let failed = 0

        for (const edit of pendingEdits) {
            const result = await applyEdit(edit.id)
            if (result) {
                success++
            } else {
                failed++
            }
        }

        return { success, failed }
    },

    rejectEdit: (editId) => {
        set(state => ({
            pendingEdits: state.pendingEdits.map(e =>
                e.id === editId ? { ...e, status: 'rejected' as EditStatus } : e
            ),
        }))
    },

    clearEdits: () => {
        set({ pendingEdits: [], appliedEdits: [] })
    },

    parseUnifiedDiff: (diffText) => {
        try {
            const hunks = parseUnifiedDiffText(diffText)

            // Extract file path from diff header
            const fileMatch = diffText.match(/^(?:---|\+\+\+)\s+(?:a\/|b\/)?(.+)$/m)
            const filePath = fileMatch?.[1] || 'unknown'

            return {
                filePath,
                hunks,
                oldContent: '',
                newContent: '',
                language: 'plaintext',
            }
        } catch {
            return null
        }
    },

    generateUnifiedDiff: generateDiff,
}))

// Format a UnifiedDiff back to standard diff text
export function formatUnifiedDiff(diff: UnifiedDiff): string {
    const lines: string[] = [
        `--- a/${diff.filePath}`,
        `+++ b/${diff.filePath}`,
    ]

    for (const hunk of diff.hunks) {
        lines.push(`@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@`)

        // Context before
        for (const line of hunk.contextBefore) {
            lines.push(` ${line}`)
        }

        // Removed lines
        for (const line of hunk.oldLines) {
            lines.push(`-${line}`)
        }

        // Added lines
        for (const line of hunk.newLines) {
            lines.push(`+${line}`)
        }

        // Context after
        for (const line of hunk.contextAfter) {
            lines.push(` ${line}`)
        }
    }

    return lines.join('\n')
}
