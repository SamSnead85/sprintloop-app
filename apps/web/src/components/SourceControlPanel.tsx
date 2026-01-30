/**
 * Source Control Panel Component
 * 
 * Git integration panel for staging, committing, and viewing changes.
 */

import React, { useState, useEffect } from 'react';
import { useGitService, GitFile } from '../lib/git/git-service';

interface SourceControlPanelProps {
    className?: string;
    onOpenFile?: (path: string) => void;
}

const STATUS_ICONS: Record<string, string> = {
    modified: 'M',
    added: 'A',
    deleted: 'D',
    renamed: 'R',
    untracked: 'U',
};

const STATUS_COLORS: Record<string, string> = {
    modified: 'text-amber-400',
    added: 'text-green-400',
    deleted: 'text-red-400',
    renamed: 'text-cyan-400',
    untracked: 'text-gray-400',
};

export const SourceControlPanel: React.FC<SourceControlPanelProps> = ({
    className,
    onOpenFile,
}) => {
    const {
        currentBranch,
        files,
        stagedFiles,
        refresh,
        stageFile,
        unstageFile,
        commit,
        push,
        pull
    } = useGitService();

    const [commitMessage, setCommitMessage] = useState('');
    const [isCommitting, setIsCommitting] = useState(false);
    const [isPushing, setIsPushing] = useState(false);
    const [isPulling, setIsPulling] = useState(false);

    useEffect(() => {
        refresh();
    }, [refresh]);

    // files = unstaged files from the git service
    const unstagedFiles = files;

    const handleCommit = async () => {
        if (!commitMessage.trim() || stagedFiles.length === 0) return;
        setIsCommitting(true);
        try {
            await commit(commitMessage);
            setCommitMessage('');
            await refresh();
        } finally {
            setIsCommitting(false);
        }
    };

    const handlePush = async () => {
        setIsPushing(true);
        try {
            await push();
        } finally {
            setIsPushing(false);
        }
    };

    const handlePull = async () => {
        setIsPulling(true);
        try {
            await pull();
            await refresh();
        } finally {
            setIsPulling(false);
        }
    };

    const handleStageAll = () => {
        unstagedFiles.forEach((f: GitFile) => stageFile(f.path));
    };

    const handleUnstageAll = () => {
        stagedFiles.forEach((f: GitFile) => unstageFile(f.path));
    };

    return (
        <div className={`source-control-panel ${className || ''}`}>
            {/* Header */}
            <div className="source-control-panel__header">
                <div className="source-control-panel__title">
                    <span className="source-control-panel__icon">🔀</span>
                    <span>Source Control</span>
                </div>
                <div className="source-control-panel__actions">
                    <button
                        onClick={handlePull}
                        disabled={isPulling}
                        title="Pull"
                        className="source-control-panel__action"
                    >
                        {isPulling ? '⏳' : '⬇️'}
                    </button>
                    <button
                        onClick={handlePush}
                        disabled={isPushing}
                        title="Push"
                        className="source-control-panel__action"
                    >
                        {isPushing ? '⏳' : '⬆️'}
                    </button>
                    <button
                        onClick={refresh}
                        title="Refresh"
                        className="source-control-panel__action"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Branch */}
            <div className="source-control-panel__branch">
                <span className="source-control-panel__branch-icon">🌿</span>
                <span className="source-control-panel__branch-name">{currentBranch || 'No branch'}</span>
            </div>

            {/* Commit Input */}
            <div className="source-control-panel__commit">
                <textarea
                    className="source-control-panel__input"
                    placeholder="Message (Ctrl+Enter to commit)"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            handleCommit();
                        }
                    }}
                    rows={3}
                />
                <button
                    className="source-control-panel__commit-btn"
                    onClick={handleCommit}
                    disabled={isCommitting || !commitMessage.trim() || stagedFiles.length === 0}
                >
                    {isCommitting ? 'Committing...' : `Commit (${stagedFiles.length})`}
                </button>
            </div>

            {/* Staged Changes */}
            <div className="source-control-panel__section">
                <div className="source-control-panel__section-header">
                    <span>Staged Changes ({stagedFiles.length})</span>
                    {stagedFiles.length > 0 && (
                        <button
                            onClick={handleUnstageAll}
                            className="source-control-panel__section-action"
                            title="Unstage All"
                        >
                            −
                        </button>
                    )}
                </div>
                <div className="source-control-panel__files">
                    {stagedFiles.map((file: GitFile) => (
                        <FileItem
                            key={file.path}
                            file={file}
                            onToggle={() => unstageFile(file.path)}
                            onOpen={() => onOpenFile?.(file.path)}
                            actionIcon="−"
                            actionTitle="Unstage"
                        />
                    ))}
                    {stagedFiles.length === 0 && (
                        <div className="source-control-panel__empty">No staged changes</div>
                    )}
                </div>
            </div>

            {/* Unstaged Changes */}
            <div className="source-control-panel__section">
                <div className="source-control-panel__section-header">
                    <span>Changes ({unstagedFiles.length})</span>
                    {unstagedFiles.length > 0 && (
                        <button
                            onClick={handleStageAll}
                            className="source-control-panel__section-action"
                            title="Stage All"
                        >
                            +
                        </button>
                    )}
                </div>
                <div className="source-control-panel__files">
                    {unstagedFiles.map((file: GitFile) => (
                        <FileItem
                            key={file.path}
                            file={file}
                            onToggle={() => stageFile(file.path)}
                            onOpen={() => onOpenFile?.(file.path)}
                            actionIcon="+"
                            actionTitle="Stage"
                        />
                    ))}
                    {unstagedFiles.length === 0 && (
                        <div className="source-control-panel__empty">No changes</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// FILE ITEM COMPONENT
// =============================================================================

interface FileItemProps {
    file: GitFile;
    onToggle: () => void;
    onOpen: () => void;
    actionIcon: string;
    actionTitle: string;
}

const FileItem: React.FC<FileItemProps> = ({
    file,
    onToggle,
    onOpen,
    actionIcon,
    actionTitle,
}) => {
    const filename = file.path.split('/').pop() || file.path;
    const directory = file.path.includes('/')
        ? file.path.substring(0, file.path.lastIndexOf('/'))
        : '';

    return (
        <div className="source-control-panel__file">
            <button
                className="source-control-panel__file-content"
                onClick={onOpen}
                title={file.path}
            >
                <span className={`source-control-panel__file-status ${STATUS_COLORS[file.status]}`}>
                    {STATUS_ICONS[file.status]}
                </span>
                <span className="source-control-panel__file-name">{filename}</span>
                {directory && (
                    <span className="source-control-panel__file-dir">{directory}/</span>
                )}
            </button>
            <button
                className="source-control-panel__file-action"
                onClick={onToggle}
                title={actionTitle}
            >
                {actionIcon}
            </button>
        </div>
    );
};

export default SourceControlPanel;
