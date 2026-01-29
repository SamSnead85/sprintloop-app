/**
 * Git Panel Component
 * 
 * Source control panel with file staging, commit, and branch management.
 */

import React, { useEffect, useState } from 'react';
import {
    useGitService,
    getStatusIcon,
    getStatusColor,
    type GitFile,
    type GitBranch,
} from '../lib/git/git-service';

interface GitPanelProps {
    className?: string;
}

export const GitPanel: React.FC<GitPanelProps> = ({ className }) => {
    const {
        isInitialized,
        isLoading,
        currentBranch,
        branches,
        files,
        stagedFiles,
        commits,
        refresh,
        stageFile,
        unstageFile,
        stageAll,
        unstageAll,
        commit,
        push,
        checkout,
        discardChanges,
    } = useGitService();

    const [commitMessage, setCommitMessage] = useState('');
    const [showBranches, setShowBranches] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        staged: true,
        changes: true,
        commits: false,
    });

    useEffect(() => {
        if (isInitialized) {
            refresh();
        }
    }, [isInitialized]);

    const handleCommit = async () => {
        if (!commitMessage.trim()) return;

        const success = await commit(commitMessage);
        if (success) {
            setCommitMessage('');
        }
    };

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    if (!isInitialized) {
        return (
            <div className={`git-panel git-panel--empty ${className || ''}`}>
                <div className="git-panel__placeholder">
                    <span className="git-panel__placeholder-icon">📦</span>
                    <p>Not a Git repository</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`git-panel ${className || ''}`}>
            {/* Header */}
            <div className="git-panel__header">
                <div className="git-panel__title">
                    <span className="git-panel__icon">📦</span>
                    <span>Source Control</span>
                </div>
                <div className="git-panel__actions">
                    <button
                        className="git-panel__btn"
                        onClick={refresh}
                        disabled={isLoading}
                        title="Refresh"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Branch Selector */}
            <div className="git-panel__branch">
                <button
                    className="git-panel__branch-btn"
                    onClick={() => setShowBranches(!showBranches)}
                >
                    <span className="git-panel__branch-icon">⎇</span>
                    <span className="git-panel__branch-name">{currentBranch}</span>
                    <span className="git-panel__branch-chevron">{showBranches ? '▴' : '▾'}</span>
                </button>

                {showBranches && (
                    <BranchDropdown
                        branches={branches}
                        currentBranch={currentBranch}
                        onSelect={(name) => {
                            checkout(name);
                            setShowBranches(false);
                        }}
                        onClose={() => setShowBranches(false)}
                    />
                )}
            </div>

            {/* Commit Message */}
            <div className="git-panel__commit">
                <textarea
                    className="git-panel__commit-input"
                    placeholder="Commit message..."
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.metaKey) {
                            handleCommit();
                        }
                    }}
                />
                <div className="git-panel__commit-actions">
                    <button
                        className="git-panel__commit-btn"
                        onClick={handleCommit}
                        disabled={!commitMessage.trim() || stagedFiles.length === 0}
                    >
                        ✓ Commit
                    </button>
                    <button
                        className="git-panel__push-btn"
                        onClick={push}
                        title="Push to remote"
                    >
                        ↑ Push
                    </button>
                </div>
            </div>

            {/* Staged Changes */}
            <div className="git-panel__section">
                <button
                    className="git-panel__section-header"
                    onClick={() => toggleSection('staged')}
                >
                    <span className="git-panel__section-chevron">
                        {expandedSections.staged ? '▾' : '▸'}
                    </span>
                    <span>Staged Changes</span>
                    <span className="git-panel__section-count">{stagedFiles.length}</span>
                    {stagedFiles.length > 0 && (
                        <button
                            className="git-panel__section-action"
                            onClick={(e) => { e.stopPropagation(); unstageAll(); }}
                            title="Unstage all"
                        >
                            −
                        </button>
                    )}
                </button>

                {expandedSections.staged && stagedFiles.length > 0 && (
                    <div className="git-panel__files">
                        {stagedFiles.map(file => (
                            <FileItem
                                key={file.path}
                                file={file}
                                onStage={() => { }}
                                onUnstage={() => unstageFile(file.path)}
                                onDiscard={() => { }}
                                isStaged
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Changes */}
            <div className="git-panel__section">
                <button
                    className="git-panel__section-header"
                    onClick={() => toggleSection('changes')}
                >
                    <span className="git-panel__section-chevron">
                        {expandedSections.changes ? '▾' : '▸'}
                    </span>
                    <span>Changes</span>
                    <span className="git-panel__section-count">{files.length}</span>
                    {files.length > 0 && (
                        <button
                            className="git-panel__section-action"
                            onClick={(e) => { e.stopPropagation(); stageAll(); }}
                            title="Stage all"
                        >
                            +
                        </button>
                    )}
                </button>

                {expandedSections.changes && files.length > 0 && (
                    <div className="git-panel__files">
                        {files.map(file => (
                            <FileItem
                                key={file.path}
                                file={file}
                                onStage={() => stageFile(file.path)}
                                onUnstage={() => { }}
                                onDiscard={() => discardChanges(file.path)}
                                isStaged={false}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Commits */}
            <div className="git-panel__section">
                <button
                    className="git-panel__section-header"
                    onClick={() => toggleSection('commits')}
                >
                    <span className="git-panel__section-chevron">
                        {expandedSections.commits ? '▾' : '▸'}
                    </span>
                    <span>Recent Commits</span>
                    <span className="git-panel__section-count">{commits.length}</span>
                </button>

                {expandedSections.commits && (
                    <div className="git-panel__commits">
                        {commits.slice(0, 5).map(commit => (
                            <div key={commit.hash} className="git-panel__commit-item">
                                <span className="git-panel__commit-hash">{commit.shortHash}</span>
                                <span className="git-panel__commit-message">{commit.message}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface FileItemProps {
    file: GitFile;
    isStaged: boolean;
    onStage: () => void;
    onUnstage: () => void;
    onDiscard: () => void;
}

const FileItem: React.FC<FileItemProps> = ({ file, isStaged, onStage, onUnstage, onDiscard }) => {
    const fileName = file.path.split('/').pop() || file.path;
    const folder = file.path.includes('/')
        ? file.path.slice(0, file.path.lastIndexOf('/'))
        : '';

    return (
        <div className="git-file">
            <span
                className="git-file__status"
                style={{ color: getStatusColor(file.status) }}
            >
                {getStatusIcon(file.status)}
            </span>
            <span className="git-file__name">{fileName}</span>
            {folder && <span className="git-file__folder">{folder}</span>}
            <div className="git-file__actions">
                {isStaged ? (
                    <button
                        className="git-file__btn"
                        onClick={onUnstage}
                        title="Unstage"
                    >
                        −
                    </button>
                ) : (
                    <>
                        <button
                            className="git-file__btn"
                            onClick={onDiscard}
                            title="Discard changes"
                        >
                            ↩
                        </button>
                        <button
                            className="git-file__btn"
                            onClick={onStage}
                            title="Stage"
                        >
                            +
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

interface BranchDropdownProps {
    branches: GitBranch[];
    currentBranch: string;
    onSelect: (name: string) => void;
    onClose: () => void;
}

const BranchDropdown: React.FC<BranchDropdownProps> = ({
    branches,
    currentBranch,
    onSelect,
    onClose
}) => {
    return (
        <>
            <div className="git-branch-backdrop" onClick={onClose} />
            <div className="git-branch-dropdown">
                {branches.map(branch => (
                    <button
                        key={branch.name}
                        className={`git-branch-item ${branch.name === currentBranch ? 'active' : ''}`}
                        onClick={() => onSelect(branch.name)}
                    >
                        {branch.name === currentBranch && '✓ '}
                        {branch.name}
                    </button>
                ))}
            </div>
        </>
    );
};

export default GitPanel;
