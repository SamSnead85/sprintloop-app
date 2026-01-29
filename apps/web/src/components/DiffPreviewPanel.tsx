/**
 * Diff Preview Panel Component
 * 
 * Side-by-side or unified diff view for multi-file edits.
 */

import React, { useState } from 'react';
import {
    useMultiFileEdit,
    type FileEdit,
    type EditHunk,
} from '../lib/ai/multi-file-edit';

interface DiffPreviewPanelProps {
    sessionId?: string;
    className?: string;
}

export const DiffPreviewPanel: React.FC<DiffPreviewPanelProps> = ({ sessionId, className }) => {
    const {
        sessions,
        activeSessionId,
        getSessionFiles,
        acceptFile,
        rejectFile,
        acceptAll,
        rejectAll,
        applySession,
    } = useMultiFileEdit();

    const [viewMode, setViewMode] = useState<'unified' | 'split'>('split');
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

    const currentSessionId = sessionId || activeSessionId;
    const session = currentSessionId ? sessions.get(currentSessionId) : undefined;
    const files = currentSessionId ? getSessionFiles(currentSessionId) : [];

    if (!session || files.length === 0) {
        return (
            <div className={`diff-preview diff-preview--empty ${className || ''}`}>
                <div className="diff-preview__placeholder">
                    <span>📝</span>
                    <p>No pending edits</p>
                </div>
            </div>
        );
    }

    const selectedFile = files.find(f => f.id === selectedFileId) || files[0];
    const pendingCount = files.filter(f => f.status === 'pending').length;
    const acceptedCount = files.filter(f => f.status === 'accepted').length;

    return (
        <div className={`diff-preview ${className || ''}`}>
            {/* Header */}
            <div className="diff-preview__header">
                <div className="diff-preview__title">
                    <span className="diff-preview__icon">📝</span>
                    <span>{session.description}</span>
                </div>
                <div className="diff-preview__stats">
                    <span className="diff-preview__stat diff-preview__stat--pending">
                        {pendingCount} pending
                    </span>
                    <span className="diff-preview__stat diff-preview__stat--accepted">
                        {acceptedCount} accepted
                    </span>
                </div>
                <div className="diff-preview__view-toggle">
                    <button
                        className={viewMode === 'split' ? 'active' : ''}
                        onClick={() => setViewMode('split')}
                    >
                        Split
                    </button>
                    <button
                        className={viewMode === 'unified' ? 'active' : ''}
                        onClick={() => setViewMode('unified')}
                    >
                        Unified
                    </button>
                </div>
            </div>

            {/* File List */}
            <div className="diff-preview__files">
                {files.map(file => (
                    <button
                        key={file.id}
                        className={`diff-preview__file ${file.id === selectedFile?.id ? 'active' : ''} diff-preview__file--${file.status}`}
                        onClick={() => setSelectedFileId(file.id)}
                    >
                        <span className="diff-preview__file-status">
                            {getStatusIcon(file.status)}
                        </span>
                        <span className="diff-preview__file-name">
                            {file.filePath.split('/').pop()}
                        </span>
                        <span className="diff-preview__file-path">
                            {file.filePath}
                        </span>
                    </button>
                ))}
            </div>

            {/* Diff View */}
            <div className="diff-preview__content">
                {selectedFile && (
                    viewMode === 'split'
                        ? <SplitDiffView file={selectedFile} />
                        : <UnifiedDiffView file={selectedFile} />
                )}
            </div>

            {/* Actions */}
            <div className="diff-preview__actions">
                {selectedFile && selectedFile.status === 'pending' && (
                    <>
                        <button
                            className="diff-preview__btn diff-preview__btn--reject"
                            onClick={() => rejectFile(currentSessionId!, selectedFile.id)}
                        >
                            ✕ Reject
                        </button>
                        <button
                            className="diff-preview__btn diff-preview__btn--accept"
                            onClick={() => acceptFile(currentSessionId!, selectedFile.id)}
                        >
                            ✓ Accept
                        </button>
                    </>
                )}

                <div className="diff-preview__actions-global">
                    <button
                        className="diff-preview__btn diff-preview__btn--reject-all"
                        onClick={() => rejectAll(currentSessionId!)}
                    >
                        Reject All
                    </button>
                    <button
                        className="diff-preview__btn diff-preview__btn--accept-all"
                        onClick={() => acceptAll(currentSessionId!)}
                    >
                        Accept All
                    </button>
                    {acceptedCount > 0 && (
                        <button
                            className="diff-preview__btn diff-preview__btn--apply"
                            onClick={() => applySession(currentSessionId!)}
                        >
                            Apply {acceptedCount} Changes
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// SPLIT DIFF VIEW
// =============================================================================

interface DiffViewProps {
    file: FileEdit;
}

const SplitDiffView: React.FC<DiffViewProps> = ({ file }) => {
    const originalLines = file.originalContent.split('\n');
    const newLines = file.newContent.split('\n');

    return (
        <div className="diff-split">
            <div className="diff-split__side diff-split__side--original">
                <div className="diff-split__header">Original</div>
                <div className="diff-split__lines">
                    {originalLines.map((line, i) => (
                        <div key={i} className="diff-split__line">
                            <span className="diff-split__line-number">{i + 1}</span>
                            <span className="diff-split__line-content">{line}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="diff-split__side diff-split__side--new">
                <div className="diff-split__header">Modified</div>
                <div className="diff-split__lines">
                    {newLines.map((line, i) => (
                        <div key={i} className="diff-split__line">
                            <span className="diff-split__line-number">{i + 1}</span>
                            <span className="diff-split__line-content">{line}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// UNIFIED DIFF VIEW
// =============================================================================

const UnifiedDiffView: React.FC<DiffViewProps> = ({ file }) => {
    return (
        <div className="diff-unified">
            <div className="diff-unified__header">
                <span className="diff-unified__path">{file.filePath}</span>
            </div>
            <div className="diff-unified__hunks">
                {file.hunks.map((hunk, i) => (
                    <HunkView key={i} hunk={hunk} />
                ))}
            </div>
        </div>
    );
};

interface HunkViewProps {
    hunk: EditHunk;
}

const HunkView: React.FC<HunkViewProps> = ({ hunk }) => {
    return (
        <div className="diff-hunk">
            <div className="diff-hunk__header">
                @@ -{hunk.startLine},{hunk.originalLines.length} +{hunk.startLine},{hunk.newLines.length} @@
            </div>
            <div className="diff-hunk__lines">
                {hunk.originalLines.map((line, i) => (
                    <div key={`old-${i}`} className="diff-hunk__line diff-hunk__line--delete">
                        <span className="diff-hunk__marker">-</span>
                        <span className="diff-hunk__content">{line}</span>
                    </div>
                ))}
                {hunk.newLines.map((line, i) => (
                    <div key={`new-${i}`} className="diff-hunk__line diff-hunk__line--add">
                        <span className="diff-hunk__marker">+</span>
                        <span className="diff-hunk__content">{line}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// =============================================================================
// HELPERS
// =============================================================================

function getStatusIcon(status: FileEdit['status']): string {
    switch (status) {
        case 'pending': return '○';
        case 'accepted': return '✓';
        case 'rejected': return '✕';
        case 'applied': return '●';
        default: return '○';
    }
}

export default DiffPreviewPanel;
