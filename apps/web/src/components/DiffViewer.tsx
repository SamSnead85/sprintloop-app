/**
 * Diff Viewer Component
 * 
 * Side-by-side and inline diff display with change navigation.
 */

import React from 'react';
import {
    useDiffEditor,
    DiffResult,
    DiffChange,
    formatHunkHeader,
    getChangeColor
} from '../lib/editor/diff-editor';

interface DiffViewerProps {
    className?: string;
    original?: string;
    modified?: string;
    originalPath?: string;
    modifiedPath?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
    className,
    original,
    modified,
    originalPath = 'Original',
    modifiedPath = 'Modified',
}) => {
    const {
        currentDiff,
        viewMode,
        currentChangeIndex,
        showWhitespace,
        wordWrap,
        computeDiff,
        goToNextChange,
        goToPreviousChange,
        setViewMode,
        toggleShowWhitespace,
        toggleWordWrap,
        getTotalChanges,
    } = useDiffEditor();

    // Compute diff if content provided
    React.useEffect(() => {
        if (original !== undefined && modified !== undefined) {
            computeDiff(original, modified, { original: originalPath, modified: modifiedPath });
        }
    }, [original, modified, originalPath, modifiedPath, computeDiff]);

    const diff = currentDiff;
    const totalChanges = getTotalChanges();

    if (!diff) {
        return (
            <div className={`diff-viewer ${className || ''}`}>
                <div className="diff-viewer__empty">No diff to display</div>
            </div>
        );
    }

    return (
        <div className={`diff-viewer diff-viewer--${viewMode} ${className || ''}`}>
            {/* Header */}
            <div className="diff-viewer__header">
                <div className="diff-viewer__paths">
                    <span className="diff-viewer__path diff-viewer__path--original">
                        {diff.originalPath}
                    </span>
                    <span className="diff-viewer__arrow">→</span>
                    <span className="diff-viewer__path diff-viewer__path--modified">
                        {diff.modifiedPath}
                    </span>
                </div>
                <div className="diff-viewer__stats">
                    <span className="diff-viewer__additions">+{diff.additions}</span>
                    <span className="diff-viewer__deletions">-{diff.deletions}</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className="diff-viewer__toolbar">
                <div className="diff-viewer__nav">
                    <button
                        onClick={goToPreviousChange}
                        disabled={totalChanges === 0}
                        title="Previous Change"
                    >
                        ↑
                    </button>
                    <span>{totalChanges > 0 ? `${currentChangeIndex + 1}/${totalChanges}` : '0/0'}</span>
                    <button
                        onClick={goToNextChange}
                        disabled={totalChanges === 0}
                        title="Next Change"
                    >
                        ↓
                    </button>
                </div>
                <div className="diff-viewer__options">
                    <button
                        className={viewMode === 'side-by-side' ? 'active' : ''}
                        onClick={() => setViewMode('side-by-side')}
                        title="Side by Side"
                    >
                        ▤▤
                    </button>
                    <button
                        className={viewMode === 'inline' ? 'active' : ''}
                        onClick={() => setViewMode('inline')}
                        title="Inline"
                    >
                        ▤
                    </button>
                    <button
                        className={showWhitespace ? 'active' : ''}
                        onClick={toggleShowWhitespace}
                        title="Show Whitespace"
                    >
                        ␣
                    </button>
                    <button
                        className={wordWrap ? 'active' : ''}
                        onClick={toggleWordWrap}
                        title="Word Wrap"
                    >
                        ↩
                    </button>
                </div>
            </div>

            {/* Diff Content */}
            <div className="diff-viewer__content">
                {viewMode === 'side-by-side' ? (
                    <SideBySideView
                        diff={diff}
                        showWhitespace={showWhitespace}
                        wordWrap={wordWrap}
                        currentChangeIndex={currentChangeIndex}
                    />
                ) : (
                    <InlineView
                        diff={diff}
                        showWhitespace={showWhitespace}
                        wordWrap={wordWrap}
                        currentChangeIndex={currentChangeIndex}
                    />
                )}
            </div>
        </div>
    );
};

// =============================================================================
// SIDE BY SIDE VIEW
// =============================================================================

interface SideBySideViewProps {
    diff: DiffResult;
    showWhitespace: boolean;
    wordWrap: boolean;
    currentChangeIndex: number;
}

const SideBySideView: React.FC<SideBySideViewProps> = ({
    diff,
    showWhitespace,
    wordWrap,
    currentChangeIndex,
}) => {
    let changeIndex = 0;

    return (
        <div className="diff-viewer__side-by-side">
            {diff.hunks.map((hunk, hunkIdx) => (
                <div key={hunkIdx} className="diff-viewer__hunk">
                    <div className="diff-viewer__hunk-header">
                        <code>{formatHunkHeader(hunk)}</code>
                    </div>
                    <div className="diff-viewer__hunk-content">
                        <div className="diff-viewer__column diff-viewer__column--original">
                            {hunk.changes.map((change, idx) => {
                                const thisIndex = changeIndex++;
                                const isCurrent = thisIndex === currentChangeIndex;

                                return (
                                    <DiffChangeBlock
                                        key={`orig-${idx}`}
                                        change={change}
                                        side="original"
                                        isCurrent={isCurrent}
                                        showWhitespace={showWhitespace}
                                        wordWrap={wordWrap}
                                    />
                                );
                            })}
                        </div>
                        <div className="diff-viewer__column diff-viewer__column--modified">
                            {hunk.changes.map((change, idx) => (
                                <DiffChangeBlock
                                    key={`mod-${idx}`}
                                    change={change}
                                    side="modified"
                                    isCurrent={false}
                                    showWhitespace={showWhitespace}
                                    wordWrap={wordWrap}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// =============================================================================
// INLINE VIEW
// =============================================================================

interface InlineViewProps {
    diff: DiffResult;
    showWhitespace: boolean;
    wordWrap: boolean;
    currentChangeIndex: number;
}

const InlineView: React.FC<InlineViewProps> = ({
    diff,
    showWhitespace,
    wordWrap,
    currentChangeIndex,
}) => {
    let changeIndex = 0;

    return (
        <div className="diff-viewer__inline">
            {diff.hunks.map((hunk, hunkIdx) => (
                <div key={hunkIdx} className="diff-viewer__hunk">
                    <div className="diff-viewer__hunk-header">
                        <code>{formatHunkHeader(hunk)}</code>
                    </div>
                    {hunk.changes.map((change, idx) => {
                        const thisIndex = changeIndex++;
                        const isCurrent = thisIndex === currentChangeIndex;

                        return (
                            <div key={idx}>
                                {/* Deleted lines */}
                                {change.originalContent.map((line, lineIdx) => (
                                    <DiffLine
                                        key={`del-${lineIdx}`}
                                        type="delete"
                                        lineNumber={change.originalStartLine + lineIdx}
                                        content={line}
                                        showWhitespace={showWhitespace}
                                        wordWrap={wordWrap}
                                        isCurrent={isCurrent}
                                    />
                                ))}
                                {/* Added lines */}
                                {change.modifiedContent.map((line, lineIdx) => (
                                    <DiffLine
                                        key={`add-${lineIdx}`}
                                        type="add"
                                        lineNumber={change.modifiedStartLine + lineIdx}
                                        content={line}
                                        showWhitespace={showWhitespace}
                                        wordWrap={wordWrap}
                                        isCurrent={isCurrent}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

// =============================================================================
// SHARED COMPONENTS
// =============================================================================

interface DiffChangeBlockProps {
    change: DiffChange;
    side: 'original' | 'modified';
    isCurrent: boolean;
    showWhitespace: boolean;
    wordWrap: boolean;
}

const DiffChangeBlock: React.FC<DiffChangeBlockProps> = ({
    change,
    side,
    isCurrent,
    showWhitespace,
    wordWrap,
}) => {
    const content = side === 'original' ? change.originalContent : change.modifiedContent;
    const startLine = side === 'original' ? change.originalStartLine : change.modifiedStartLine;

    const type = side === 'original'
        ? (change.type === 'add' ? null : 'delete')
        : (change.type === 'delete' ? null : 'add');

    if (!type) {
        return <div className="diff-viewer__empty-block" />;
    }

    return (
        <div className={`diff-viewer__change-block ${isCurrent ? 'diff-viewer__change-block--current' : ''}`}>
            {content.map((line, idx) => (
                <DiffLine
                    key={idx}
                    type={type}
                    lineNumber={startLine + idx}
                    content={line}
                    showWhitespace={showWhitespace}
                    wordWrap={wordWrap}
                    isCurrent={isCurrent && idx === 0}
                />
            ))}
        </div>
    );
};

interface DiffLineProps {
    type: 'add' | 'delete';
    lineNumber: number;
    content: string;
    showWhitespace: boolean;
    wordWrap: boolean;
    isCurrent: boolean;
}

const DiffLine: React.FC<DiffLineProps> = ({
    type,
    lineNumber,
    content,
    showWhitespace,
    wordWrap,
    isCurrent,
}) => {
    const colors = getChangeColor(type);
    const displayContent = showWhitespace
        ? content.replace(/ /g, '·').replace(/\t/g, '→   ')
        : content;

    return (
        <div
            className={`diff-viewer__line diff-viewer__line--${type} ${isCurrent ? 'diff-viewer__line--current' : ''}`}
            style={{
                backgroundColor: colors.bg,
                whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
            }}
        >
            <span className="diff-viewer__line-number">{lineNumber}</span>
            <span className="diff-viewer__line-marker">{type === 'add' ? '+' : '-'}</span>
            <code className="diff-viewer__line-content">{displayContent || ' '}</code>
        </div>
    );
};

export default DiffViewer;
