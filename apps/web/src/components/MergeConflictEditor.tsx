/**
 * Merge Conflict Editor Component
 * 
 * UI for resolving merge conflicts with side-by-side diff view.
 */

import { useState } from 'react';
import { Check, X, ChevronUp, ChevronDown, GitMerge, AlertTriangle } from 'lucide-react';
import { useMergeConflictService, ConflictHunk } from '../lib/git/merge-conflict-service';

export function MergeConflictEditor() {
    const {
        isInMerge,
        mergeSource,
        conflictFiles,
        currentFile,
        hasConflicts,
        getConflictCount,
        resolveHunk,
        completeMerge,
        abortMerge,
        setCurrentFile,
    } = useMergeConflictService();

    const [commitMessage, setCommitMessage] = useState('');

    if (!isInMerge) return null;

    const activeFile = conflictFiles.find(f => f.path === currentFile);
    const unresolvedCount = getConflictCount();

    return (
        <div className="merge-conflict-editor">
            {/* Header */}
            <div className="merge-conflict-header">
                <div className="merge-conflict-title">
                    <GitMerge size={18} />
                    <span>Merge Conflicts</span>
                    {mergeSource && (
                        <span className="merge-source">from {mergeSource}</span>
                    )}
                </div>
                <div className="merge-conflict-status">
                    {unresolvedCount > 0 ? (
                        <span className="conflict-count">
                            <AlertTriangle size={14} />
                            {unresolvedCount} conflict{unresolvedCount > 1 ? 's' : ''} remaining
                        </span>
                    ) : (
                        <span className="all-resolved">
                            <Check size={14} />
                            All conflicts resolved
                        </span>
                    )}
                </div>
            </div>

            {/* File List */}
            <div className="merge-conflict-files">
                {conflictFiles.map(file => (
                    <button
                        key={file.path}
                        className={`conflict-file ${currentFile === file.path ? 'active' : ''} ${file.isResolved ? 'resolved' : ''}`}
                        onClick={() => setCurrentFile(file.path)}
                    >
                        {file.isResolved ? (
                            <Check size={14} className="file-status resolved" />
                        ) : (
                            <AlertTriangle size={14} className="file-status pending" />
                        )}
                        <span className="file-path">{file.path}</span>
                        <span className="conflict-badge">
                            {file.hunks.filter(h => !h.resolution).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Conflict Hunks */}
            {activeFile && (
                <div className="merge-conflict-hunks">
                    {activeFile.hunks.map((hunk, index) => (
                        <ConflictHunkView
                            key={hunk.id}
                            hunk={hunk}
                            index={index + 1}
                            total={activeFile.hunks.length}
                            filePath={activeFile.path}
                            onResolve={resolveHunk}
                        />
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="merge-conflict-actions">
                {!hasConflicts() && (
                    <div className="commit-message-input">
                        <input
                            type="text"
                            placeholder="Merge commit message..."
                            value={commitMessage}
                            onChange={(e) => setCommitMessage(e.target.value)}
                        />
                    </div>
                )}
                <div className="action-buttons">
                    <button
                        className="btn-abort"
                        onClick={() => abortMerge()}
                    >
                        <X size={14} />
                        Abort Merge
                    </button>
                    <button
                        className="btn-complete"
                        onClick={() => completeMerge(commitMessage || `Merge ${mergeSource}`)}
                        disabled={hasConflicts()}
                    >
                        <Check size={14} />
                        Complete Merge
                    </button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// CONFLICT HUNK VIEW
// =============================================================================

interface ConflictHunkViewProps {
    hunk: ConflictHunk;
    index: number;
    total: number;
    filePath: string;
    onResolve: (filePath: string, hunkId: string, resolution: 'ours' | 'theirs' | 'both' | 'custom', customContent?: string[]) => void;
}

function ConflictHunkView({ hunk, index, total, filePath, onResolve }: ConflictHunkViewProps) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className={`conflict-hunk ${hunk.resolution ? 'resolved' : ''}`}>
            {/* Hunk Header */}
            <div className="hunk-header">
                <button
                    className="hunk-toggle"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>
                <span className="hunk-title">
                    Conflict {index} of {total}
                </span>
                <span className="hunk-lines">
                    Lines {hunk.startLine}-{hunk.endLine}
                </span>
                {hunk.resolution && (
                    <span className="hunk-resolution">
                        <Check size={12} />
                        {hunk.resolution === 'ours' && 'Accepted Current'}
                        {hunk.resolution === 'theirs' && 'Accepted Incoming'}
                        {hunk.resolution === 'both' && 'Accepted Both'}
                        {hunk.resolution === 'custom' && 'Custom Edit'}
                    </span>
                )}
            </div>

            {/* Hunk Content */}
            {expanded && (
                <div className="hunk-content">
                    {/* Current (Ours) */}
                    <div className="hunk-side ours">
                        <div className="side-header">
                            <span>Current Change (HEAD)</span>
                            <button
                                className="accept-btn"
                                onClick={() => onResolve(filePath, hunk.id, 'ours')}
                            >
                                Accept Current
                            </button>
                        </div>
                        <div className="side-code">
                            {hunk.ourContent.map((line, i) => (
                                <div key={i} className="code-line added">
                                    <span className="line-num">{hunk.startLine + i}</span>
                                    <span className="line-content">{line}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Base (if 3-way merge) */}
                    {hunk.baseContent && (
                        <div className="hunk-side base">
                            <div className="side-header">
                                <span>Base</span>
                            </div>
                            <div className="side-code">
                                {hunk.baseContent.map((line, i) => (
                                    <div key={i} className="code-line">
                                        <span className="line-num">{i + 1}</span>
                                        <span className="line-content">{line}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Incoming (Theirs) */}
                    <div className="hunk-side theirs">
                        <div className="side-header">
                            <span>Incoming Change</span>
                            <button
                                className="accept-btn"
                                onClick={() => onResolve(filePath, hunk.id, 'theirs')}
                            >
                                Accept Incoming
                            </button>
                        </div>
                        <div className="side-code">
                            {hunk.theirContent.map((line, i) => (
                                <div key={i} className="code-line removed">
                                    <span className="line-num">{hunk.startLine + i}</span>
                                    <span className="line-content">{line}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Accept Both */}
                    <div className="hunk-actions">
                        <button
                            className="accept-both-btn"
                            onClick={() => onResolve(filePath, hunk.id, 'both')}
                        >
                            Accept Both Changes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MergeConflictEditor;
