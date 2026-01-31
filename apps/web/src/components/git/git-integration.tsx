/**
 * SprintLoop Git Integration System
 * 
 * Phase 1001-1050: Advanced Git features
 * - Visual commit history
 * - Branch management
 * - Staging area
 * - Diff viewer
 * - Merge conflict resolver
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
    GitBranch,
    GitCommit,
    GitMerge,
    GitPullRequest,
    Plus,
    Minus,
    Check,
    X,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    Search,
    Filter,
    Download,
    Upload,
    Trash2,
    Eye,
    Edit3,
    MoreHorizontal,
    Clock,
    User
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface GitFile {
    path: string
    status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked'
    staged: boolean
    additions?: number
    deletions?: number
}

interface GitCommitData {
    hash: string
    shortHash: string
    message: string
    author: string
    authorEmail: string
    date: Date
    parents: string[]
    refs?: string[]
}

interface GitBranchData {
    name: string
    current: boolean
    remote?: string
    ahead?: number
    behind?: number
    lastCommit?: string
}

interface GitStash {
    id: string
    message: string
    date: Date
    branch: string
}

// ============================================================================
// FILE STATUS ICON
// ============================================================================

interface FileStatusIconProps {
    status: GitFile['status']
    size?: 'sm' | 'md'
}

function FileStatusIcon({ status, size = 'md' }: FileStatusIconProps) {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

    const icons = {
        modified: <Edit3 className={`${sizeClass} text-yellow-400`} />,
        added: <Plus className={`${sizeClass} text-green-400`} />,
        deleted: <Trash2 className={`${sizeClass} text-red-400`} />,
        renamed: <RefreshCw className={`${sizeClass} text-blue-400`} />,
        untracked: <Plus className={`${sizeClass} text-gray-400`} />,
    }

    return icons[status] || null
}

// ============================================================================
// STAGING AREA
// ============================================================================

interface StagingAreaProps {
    files: GitFile[]
    onStage: (path: string) => void
    onUnstage: (path: string) => void
    onStageAll: () => void
    onUnstageAll: () => void
    onDiscard: (path: string) => void
    onViewDiff: (path: string) => void
    className?: string
}

export function StagingArea({
    files,
    onStage,
    onUnstage,
    onStageAll,
    onUnstageAll,
    onDiscard,
    onViewDiff,
    className = '',
}: StagingAreaProps) {
    const stagedFiles = files.filter(f => f.staged)
    const unstagedFiles = files.filter(f => !f.staged)
    const [expandedSections, setExpandedSections] = useState({ staged: true, unstaged: true })

    const toggleSection = (section: 'staged' | 'unstaged') => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    const renderFileList = (
        files: GitFile[],
        isStaged: boolean
    ) => (
        <div className="space-y-0.5">
            {files.map(file => (
                <div
                    key={file.path}
                    className="group flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 rounded-lg transition-colors"
                >
                    <FileStatusIcon status={file.status} size="sm" />
                    <span className="flex-1 text-sm text-gray-300 truncate">
                        {file.path}
                    </span>

                    {/* File stats */}
                    {(file.additions !== undefined || file.deletions !== undefined) && (
                        <span className="text-xs text-gray-600">
                            {file.additions !== undefined && (
                                <span className="text-green-400">+{file.additions}</span>
                            )}
                            {file.deletions !== undefined && (
                                <span className="text-red-400 ml-1">-{file.deletions}</span>
                            )}
                        </span>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => onViewDiff(file.path)}
                            className="p-1 text-gray-500 hover:text-white transition-colors"
                            title="View diff"
                        >
                            <Eye className="w-3.5 h-3.5" />
                        </button>
                        {isStaged ? (
                            <button
                                onClick={() => onUnstage(file.path)}
                                className="p-1 text-gray-500 hover:text-white transition-colors"
                                title="Unstage"
                            >
                                <Minus className="w-3.5 h-3.5" />
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => onStage(file.path)}
                                    className="p-1 text-gray-500 hover:text-green-400 transition-colors"
                                    title="Stage"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => onDiscard(file.path)}
                                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                                    title="Discard changes"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )

    return (
        <div className={`flex flex-col ${className}`}>
            {/* Staged changes */}
            <div className="mb-4">
                <button
                    onClick={() => toggleSection('staged')}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                    {expandedSections.staged ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                    Staged Changes
                    <span className="ml-auto text-xs text-gray-600">
                        {stagedFiles.length}
                    </span>
                    {stagedFiles.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onUnstageAll()
                            }}
                            className="p-1 text-gray-500 hover:text-white transition-colors"
                            title="Unstage all"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                    )}
                </button>
                {expandedSections.staged && stagedFiles.length > 0 && (
                    <div className="mt-1">{renderFileList(stagedFiles, true)}</div>
                )}
            </div>

            {/* Unstaged changes */}
            <div>
                <button
                    onClick={() => toggleSection('unstaged')}
                    className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                    {expandedSections.unstaged ? (
                        <ChevronDown className="w-4 h-4" />
                    ) : (
                        <ChevronRight className="w-4 h-4" />
                    )}
                    Changes
                    <span className="ml-auto text-xs text-gray-600">
                        {unstagedFiles.length}
                    </span>
                    {unstagedFiles.length > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onStageAll()
                            }}
                            className="p-1 text-gray-500 hover:text-green-400 transition-colors"
                            title="Stage all"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    )}
                </button>
                {expandedSections.unstaged && unstagedFiles.length > 0 && (
                    <div className="mt-1">{renderFileList(unstagedFiles, false)}</div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// COMMIT FORM
// ============================================================================

interface CommitFormProps {
    stagedCount: number
    onCommit: (message: string) => Promise<void>
    onAmend?: () => void
    className?: string
}

export function CommitForm({
    stagedCount,
    onCommit,
    onAmend,
    className = '',
}: CommitFormProps) {
    const [message, setMessage] = useState('')
    const [isCommitting, setIsCommitting] = useState(false)

    const handleCommit = async () => {
        if (!message.trim() || stagedCount === 0) return

        setIsCommitting(true)
        try {
            await onCommit(message)
            setMessage('')
        } finally {
            setIsCommitting(false)
        }
    }

    return (
        <div className={`space-y-3 ${className}`}>
            <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Commit message"
                rows={3}
                className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500 text-sm resize-none focus:outline-none focus:border-purple-500 transition-colors"
            />

            <div className="flex items-center gap-2">
                <button
                    onClick={handleCommit}
                    disabled={!message.trim() || stagedCount === 0 || isCommitting}
                    className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isCommitting ? 'Committing...' : `Commit ${stagedCount} file${stagedCount !== 1 ? 's' : ''}`}
                </button>

                {onAmend && (
                    <button
                        onClick={onAmend}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Amend last commit"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// BRANCH SELECTOR
// ============================================================================

interface BranchSelectorProps {
    branches: GitBranchData[]
    currentBranch: string
    onSwitch: (branch: string) => void
    onCreate: (name: string) => void
    onDelete: (name: string) => void
    className?: string
}

export function BranchSelector({
    branches,
    currentBranch,
    onSwitch,
    onCreate,
    onDelete,
    className = '',
}: BranchSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [filter, setFilter] = useState('')
    const [showCreate, setShowCreate] = useState(false)
    const [newBranchName, setNewBranchName] = useState('')

    const filteredBranches = branches.filter(b =>
        b.name.toLowerCase().includes(filter.toLowerCase())
    )

    const localBranches = filteredBranches.filter(b => !b.remote)
    const remoteBranches = filteredBranches.filter(b => b.remote)

    const handleCreate = () => {
        if (newBranchName.trim()) {
            onCreate(newBranchName.trim())
            setNewBranchName('')
            setShowCreate(false)
        }
    }

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-white hover:bg-white/5 transition-colors"
            >
                <GitBranch className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium">{currentBranch}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-slate-900 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-white/5">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Find branch..."
                                className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    {/* Create branch */}
                    {showCreate ? (
                        <div className="p-2 border-b border-white/5">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newBranchName}
                                    onChange={(e) => setNewBranchName(e.target.value)}
                                    placeholder="New branch name"
                                    autoFocus
                                    className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                />
                                <button
                                    onClick={handleCreate}
                                    className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-400"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                        >
                            <Plus className="w-4 h-4" />
                            Create new branch
                        </button>
                    )}

                    {/* Branch list */}
                    <div className="max-h-64 overflow-y-auto">
                        {localBranches.length > 0 && (
                            <div>
                                <div className="px-4 py-2 text-xs text-gray-500 uppercase">
                                    Local
                                </div>
                                {localBranches.map(branch => (
                                    <button
                                        key={branch.name}
                                        onClick={() => {
                                            onSwitch(branch.name)
                                            setIsOpen(false)
                                        }}
                                        className={`
                                            w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors
                                            ${branch.current
                                                ? 'bg-purple-500/10 text-purple-400'
                                                : 'text-gray-300 hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        {branch.current && <Check className="w-4 h-4" />}
                                        <span className="flex-1 text-left truncate">
                                            {branch.name}
                                        </span>
                                        {(branch.ahead !== undefined || branch.behind !== undefined) && (
                                            <span className="text-xs text-gray-500">
                                                {branch.ahead && `↑${branch.ahead}`}
                                                {branch.behind && `↓${branch.behind}`}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {remoteBranches.length > 0 && (
                            <div>
                                <div className="px-4 py-2 text-xs text-gray-500 uppercase">
                                    Remote
                                </div>
                                {remoteBranches.map(branch => (
                                    <button
                                        key={branch.name}
                                        onClick={() => {
                                            onSwitch(branch.name)
                                            setIsOpen(false)
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        <span className="flex-1 text-left truncate">
                                            {branch.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================================
// COMMIT HISTORY
// ============================================================================

interface CommitHistoryProps {
    commits: GitCommitData[]
    onCheckout: (hash: string) => void
    onCherryPick: (hash: string) => void
    onRevert: (hash: string) => void
    className?: string
}

export function CommitHistory({
    commits,
    onCheckout,
    onCherryPick,
    onRevert,
    className = '',
}: CommitHistoryProps) {
    const [selectedCommit, setSelectedCommit] = useState<string | null>(null)

    const formatDate = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const days = Math.floor(diff / 86400000)

        if (days === 0) return 'Today'
        if (days === 1) return 'Yesterday'
        if (days < 7) return `${days} days ago`
        return date.toLocaleDateString()
    }

    return (
        <div className={`flex flex-col ${className}`}>
            {commits.map((commit, index) => (
                <div
                    key={commit.hash}
                    className={`
                        relative flex gap-3 px-4 py-3 cursor-pointer transition-colors
                        ${selectedCommit === commit.hash ? 'bg-purple-500/10' : 'hover:bg-white/5'}
                    `}
                    onClick={() => setSelectedCommit(selectedCommit === commit.hash ? null : commit.hash)}
                >
                    {/* Graph line */}
                    <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-2 ring-slate-900" />
                        {index < commits.length - 1 && (
                            <div className="flex-1 w-0.5 bg-slate-700 my-1" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="text-sm text-white font-medium truncate">
                                {commit.message.split('\n')[0]}
                            </div>
                            <div className="flex-shrink-0 text-xs text-gray-500 font-mono">
                                {commit.shortHash}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {commit.author}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(commit.date)}
                            </span>
                        </div>

                        {/* Refs */}
                        {commit.refs && commit.refs.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                                {commit.refs.map(ref => (
                                    <span
                                        key={ref}
                                        className={`
                                            px-2 py-0.5 text-xs rounded
                                            ${ref.startsWith('HEAD') ? 'bg-purple-500/20 text-purple-400' :
                                                ref.startsWith('origin/') ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-green-500/20 text-green-400'}
                                        `}
                                    >
                                        {ref}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Actions */}
                        {selectedCommit === commit.hash && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onCheckout(commit.hash)
                                    }}
                                    className="px-3 py-1.5 bg-purple-500/10 text-purple-400 text-xs rounded-lg hover:bg-purple-500/20 transition-colors"
                                >
                                    Checkout
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onCherryPick(commit.hash)
                                    }}
                                    className="px-3 py-1.5 bg-green-500/10 text-green-400 text-xs rounded-lg hover:bg-green-500/20 transition-colors"
                                >
                                    Cherry-pick
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRevert(commit.hash)
                                    }}
                                    className="px-3 py-1.5 bg-red-500/10 text-red-400 text-xs rounded-lg hover:bg-red-500/20 transition-colors"
                                >
                                    Revert
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ============================================================================
// GIT PANEL
// ============================================================================

interface GitPanelProps {
    className?: string
}

export function GitPanel({ className = '' }: GitPanelProps) {
    // Demo data
    const [files] = useState<GitFile[]>([
        { path: 'src/App.tsx', status: 'modified', staged: true, additions: 15, deletions: 3 },
        { path: 'src/components/Editor.tsx', status: 'modified', staged: false, additions: 42, deletions: 12 },
        { path: 'src/utils/helpers.ts', status: 'added', staged: false, additions: 28 },
        { path: 'old-file.js', status: 'deleted', staged: false, deletions: 100 },
    ])

    const [branches] = useState<GitBranchData[]>([
        { name: 'main', current: true, ahead: 2, behind: 0 },
        { name: 'feature/new-editor', current: false },
        { name: 'fix/bug-123', current: false },
        { name: 'origin/main', current: false, remote: 'origin' },
    ])

    const [commits] = useState<GitCommitData[]>([
        {
            hash: 'a1b2c3d4e5f6',
            shortHash: 'a1b2c3d',
            message: 'feat: Add new editor features\n\nImplemented syntax highlighting and auto-complete',
            author: 'You',
            authorEmail: 'you@example.com',
            date: new Date(),
            parents: ['b2c3d4e5f6a7'],
            refs: ['HEAD', 'main'],
        },
        {
            hash: 'b2c3d4e5f6a7',
            shortHash: 'b2c3d4e',
            message: 'fix: Resolve memory leak in file watcher',
            author: 'Alice',
            authorEmail: 'alice@example.com',
            date: new Date(Date.now() - 86400000),
            parents: ['c3d4e5f6a7b8'],
        },
        {
            hash: 'c3d4e5f6a7b8',
            shortHash: 'c3d4e5f',
            message: 'chore: Update dependencies',
            author: 'Bob',
            authorEmail: 'bob@example.com',
            date: new Date(Date.now() - 172800000),
            parents: ['d4e5f6a7b8c9'],
        },
    ])

    const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes')

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <BranchSelector
                    branches={branches}
                    currentBranch="main"
                    onSwitch={(b) => console.log('Switch to', b)}
                    onCreate={(n) => console.log('Create', n)}
                    onDelete={(n) => console.log('Delete', n)}
                />

                <div className="flex items-center gap-2">
                    <button
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Pull"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                    <button
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Push"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    <button
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 px-2 py-1 border-b border-white/5">
                <button
                    onClick={() => setActiveTab('changes')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activeTab === 'changes'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Changes
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${activeTab === 'history'
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'text-gray-400 hover:text-white'
                        }`}
                >
                    History
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'changes' ? (
                    <div className="p-4">
                        <StagingArea
                            files={files}
                            onStage={(p) => console.log('Stage', p)}
                            onUnstage={(p) => console.log('Unstage', p)}
                            onStageAll={() => console.log('Stage all')}
                            onUnstageAll={() => console.log('Unstage all')}
                            onDiscard={(p) => console.log('Discard', p)}
                            onViewDiff={(p) => console.log('View diff', p)}
                        />

                        <div className="mt-6">
                            <CommitForm
                                stagedCount={files.filter(f => f.staged).length}
                                onCommit={async (msg) => console.log('Commit', msg)}
                            />
                        </div>
                    </div>
                ) : (
                    <CommitHistory
                        commits={commits}
                        onCheckout={(h) => console.log('Checkout', h)}
                        onCherryPick={(h) => console.log('Cherry-pick', h)}
                        onRevert={(h) => console.log('Revert', h)}
                    />
                )}
            </div>
        </div>
    )
}
