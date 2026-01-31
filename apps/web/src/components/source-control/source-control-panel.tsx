/**
 * SprintLoop Source Control Panel System
 * 
 * Phase 1751-1800: Source control
 * - Changes view
 * - Staged changes
 * - Commit interface
 * - Sync status
 * - Branch actions
 */

import React, { useState, useMemo } from 'react'
import {
    GitBranch,
    GitCommit,
    GitMerge,
    GitPullRequest,
    RefreshCw,
    Plus,
    Minus,
    Check,
    X,
    ChevronDown,
    ChevronRight,
    MoreHorizontal,
    Upload,
    Download,
    File,
    FileText,
    FilePlus,
    FileMinus,
    FileEdit,
    ArrowUpDown,
    RotateCcw,
    Eye,
    Trash2
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type FileStatus = 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked' | 'conflict'

interface SourceControlFile {
    id: string
    path: string
    status: FileStatus
    staged: boolean
    originalPath?: string
}

interface BranchInfo {
    name: string
    upstream?: string
    ahead: number
    behind: number
    isDetached?: boolean
}

// ============================================================================
// FILE STATUS ICON
// ============================================================================

function FileStatusIcon({ status }: { status: FileStatus }) {
    const icons: Record<FileStatus, { icon: React.ReactNode; color: string; label: string }> = {
        modified: { icon: <FileEdit className="w-4 h-4" />, color: 'text-yellow-400', label: 'M' },
        added: { icon: <FilePlus className="w-4 h-4" />, color: 'text-green-400', label: 'A' },
        deleted: { icon: <FileMinus className="w-4 h-4" />, color: 'text-red-400', label: 'D' },
        renamed: { icon: <ArrowUpDown className="w-4 h-4" />, color: 'text-purple-400', label: 'R' },
        untracked: { icon: <FilePlus className="w-4 h-4" />, color: 'text-green-400', label: 'U' },
        conflict: { icon: <X className="w-4 h-4" />, color: 'text-red-400', label: '!' },
    }

    const { color, label } = icons[status]
    return <span className={`font-mono text-xs font-bold ${color}`}>{label}</span>
}

// ============================================================================
// FILE ITEM
// ============================================================================

interface FileItemProps {
    file: SourceControlFile
    onStage?: () => void
    onUnstage?: () => void
    onDiscard?: () => void
    onOpen?: () => void
}

function FileItem({ file, onStage, onUnstage, onDiscard, onOpen }: FileItemProps) {
    const fileName = file.path.split('/').pop() || file.path
    const directory = file.path.split('/').slice(0, -1).join('/')

    return (
        <div className="group flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition-colors">
            <FileStatusIcon status={file.status} />

            <button
                onClick={onOpen}
                className="flex-1 min-w-0 text-left"
            >
                <span className="text-sm text-gray-300 truncate block">{fileName}</span>
                {directory && (
                    <span className="text-xs text-gray-600 truncate block">{directory}</span>
                )}
            </button>

            {/* Actions */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onOpen}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                    title="Open file"
                >
                    <Eye className="w-3.5 h-3.5" />
                </button>

                {file.staged ? (
                    <button
                        onClick={onUnstage}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="Unstage"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                ) : (
                    <>
                        <button
                            onClick={onStage}
                            className="p-1 text-gray-500 hover:text-white transition-colors"
                            title="Stage"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={onDiscard}
                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                            title="Discard changes"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// COMMIT INPUT
// ============================================================================

interface CommitInputProps {
    value: string
    onChange: (value: string) => void
    onCommit: () => void
    stagedCount: number
    disabled?: boolean
}

function CommitInput({ value, onChange, onCommit, stagedCount, disabled }: CommitInputProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            if (!disabled && value.trim()) {
                onCommit()
            }
        }
    }

    return (
        <div className="px-3 py-2 space-y-2">
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsExpanded(true)}
                placeholder="Commit message"
                rows={isExpanded ? 4 : 1}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-purple-500 transition-all"
            />

            <div className="flex items-center gap-2">
                <button
                    onClick={onCommit}
                    disabled={disabled || !value.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-400 transition-colors"
                >
                    <Check className="w-4 h-4" />
                    Commit
                    {stagedCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs">
                            {stagedCount}
                        </span>
                    )}
                </button>

                <button
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    title="More options"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}

// ============================================================================
// BRANCH STATUS
// ============================================================================

interface BranchStatusProps {
    branch: BranchInfo
    onSync?: () => void
    onPull?: () => void
    onPush?: () => void
    onBranchClick?: () => void
}

function BranchStatus({ branch, onSync, onPull, onPush, onBranchClick }: BranchStatusProps) {
    return (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
            <button
                onClick={onBranchClick}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors"
            >
                <GitBranch className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-white font-medium">{branch.name}</span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>

            <div className="flex-1" />

            {branch.upstream && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    {branch.behind > 0 && (
                        <button
                            onClick={onPull}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
                            title={`Pull ${branch.behind} commits`}
                        >
                            <Download className="w-3 h-3" />
                            {branch.behind}
                        </button>
                    )}
                    {branch.ahead > 0 && (
                        <button
                            onClick={onPush}
                            className="flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
                            title={`Push ${branch.ahead} commits`}
                        >
                            <Upload className="w-3 h-3" />
                            {branch.ahead}
                        </button>
                    )}
                </div>
            )}

            <button
                onClick={onSync}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                title="Sync changes"
            >
                <RefreshCw className="w-4 h-4" />
            </button>
        </div>
    )
}

// ============================================================================
// SOURCE CONTROL PANEL
// ============================================================================

interface SourceControlPanelProps {
    files?: SourceControlFile[]
    branch?: BranchInfo
    onCommit?: (message: string) => void
    onStage?: (file: SourceControlFile) => void
    onUnstage?: (file: SourceControlFile) => void
    onStageAll?: () => void
    onUnstageAll?: () => void
    onDiscard?: (file: SourceControlFile) => void
    onOpenFile?: (file: SourceControlFile) => void
    onSync?: () => void
    onPull?: () => void
    onPush?: () => void
    className?: string
}

export function SourceControlPanel({
    files: propFiles,
    branch: propBranch,
    onCommit,
    onStage,
    onUnstage,
    onStageAll,
    onUnstageAll,
    onDiscard,
    onOpenFile,
    onSync,
    onPull,
    onPush,
    className = '',
}: SourceControlPanelProps) {
    const [commitMessage, setCommitMessage] = useState('')
    const [stagedExpanded, setStagedExpanded] = useState(true)
    const [changesExpanded, setChangesExpanded] = useState(true)

    // Demo data
    const defaultFiles: SourceControlFile[] = [
        { id: '1', path: 'src/App.tsx', status: 'modified', staged: true },
        { id: '2', path: 'src/components/Header.tsx', status: 'modified', staged: true },
        { id: '3', path: 'src/utils/helpers.ts', status: 'modified', staged: false },
        { id: '4', path: 'src/components/NewComponent.tsx', status: 'added', staged: false },
        { id: '5', path: 'src/old/Legacy.tsx', status: 'deleted', staged: false },
        { id: '6', path: 'package.json', status: 'modified', staged: false },
    ]

    const defaultBranch: BranchInfo = {
        name: 'feature/new-ui',
        upstream: 'origin/feature/new-ui',
        ahead: 2,
        behind: 0,
    }

    const files = propFiles || defaultFiles
    const branch = propBranch || defaultBranch

    const stagedFiles = files.filter(f => f.staged)
    const changedFiles = files.filter(f => !f.staged)

    const handleCommit = () => {
        if (commitMessage.trim() && stagedFiles.length > 0) {
            onCommit?.(commitMessage)
            setCommitMessage('')
        }
    }

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Branch status */}
            <BranchStatus
                branch={branch}
                onSync={onSync}
                onPull={onPull}
                onPush={onPush}
            />

            {/* Commit input */}
            <CommitInput
                value={commitMessage}
                onChange={setCommitMessage}
                onCommit={handleCommit}
                stagedCount={stagedFiles.length}
                disabled={stagedFiles.length === 0}
            />

            {/* File lists */}
            <div className="flex-1 overflow-y-auto">
                {/* Staged Changes */}
                {stagedFiles.length > 0 && (
                    <div className="border-t border-white/5">
                        <button
                            onClick={() => setStagedExpanded(!stagedExpanded)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
                        >
                            {stagedExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="text-xs font-medium text-gray-400 uppercase">
                                Staged Changes
                            </span>
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                {stagedFiles.length}
                            </span>
                            <div className="flex-1" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onUnstageAll?.()
                                }}
                                className="p-1 text-gray-500 hover:text-white transition-colors"
                                title="Unstage all"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                        </button>

                        {stagedExpanded && (
                            <div>
                                {stagedFiles.map(file => (
                                    <FileItem
                                        key={file.id}
                                        file={file}
                                        onUnstage={() => onUnstage?.(file)}
                                        onOpen={() => onOpenFile?.(file)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Changes */}
                {changedFiles.length > 0 && (
                    <div className="border-t border-white/5">
                        <button
                            onClick={() => setChangesExpanded(!changesExpanded)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
                        >
                            {changesExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="text-xs font-medium text-gray-400 uppercase">
                                Changes
                            </span>
                            <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                {changedFiles.length}
                            </span>
                            <div className="flex-1" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onStageAll?.()
                                }}
                                className="p-1 text-gray-500 hover:text-white transition-colors"
                                title="Stage all"
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                        </button>

                        {changesExpanded && (
                            <div>
                                {changedFiles.map(file => (
                                    <FileItem
                                        key={file.id}
                                        file={file}
                                        onStage={() => onStage?.(file)}
                                        onDiscard={() => onDiscard?.(file)}
                                        onOpen={() => onOpenFile?.(file)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Empty state */}
                {files.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Check className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No changes</p>
                    </div>
                )}
            </div>
        </div>
    )
}
