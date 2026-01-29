/**
 * Sprint Board Component
 * 
 * Kanban-style board for sprint story tracking.
 */

import React from 'react';
import {
    useSprintManager,
    getStoryTypeEmoji,
    getPriorityColor,
    getStatusColor,
    formatStoryId,
    type Story,
    type StoryStatus,
    type BoardColumn
} from '../lib/sdlc';

interface SprintBoardProps {
    className?: string;
}

export const SprintBoard: React.FC<SprintBoardProps> = ({ className }) => {
    const {
        getActiveSprint,
        getBoardColumns,
        getSprintProgress,
        moveStory
    } = useSprintManager();

    const activeSprint = getActiveSprint();
    const columns = getBoardColumns();
    const progress = activeSprint ? getSprintProgress(activeSprint.id) : null;

    if (!activeSprint) {
        return (
            <div className={`sprint-board sprint-board--empty ${className || ''}`}>
                <div className="sprint-board__placeholder">
                    <span className="sprint-board__placeholder-icon">🏃</span>
                    <h3>No Active Sprint</h3>
                    <p>Start a sprint to see the board</p>
                    <code>/sprint-planning</code>
                </div>
            </div>
        );
    }

    return (
        <div className={`sprint-board ${className || ''}`}>
            <div className="sprint-board__header">
                <div className="sprint-board__title">
                    <h2>{activeSprint.name}</h2>
                    <span className="sprint-board__goal">{activeSprint.goal}</span>
                </div>

                {progress && (
                    <div className="sprint-board__stats">
                        <div className="sprint-board__stat">
                            <span className="sprint-board__stat-value">{progress.completedStories}</span>
                            <span className="sprint-board__stat-label">/ {progress.totalStories} stories</span>
                        </div>
                        <div className="sprint-board__stat">
                            <span className="sprint-board__stat-value">{progress.completedPoints}</span>
                            <span className="sprint-board__stat-label">/ {progress.totalPoints} pts</span>
                        </div>
                        <div className="sprint-board__stat">
                            <span className="sprint-board__stat-value">{progress.daysRemaining}</span>
                            <span className="sprint-board__stat-label">days left</span>
                        </div>
                        <div
                            className={`sprint-board__status ${progress.onTrack ? 'on-track' : 'at-risk'}`}
                        >
                            {progress.onTrack ? '✅ On Track' : '⚠️ At Risk'}
                        </div>
                    </div>
                )}
            </div>

            <div className="sprint-board__columns">
                {columns.map(column => (
                    <BoardColumnComponent
                        key={column.status}
                        column={column}
                        onMoveStory={(storyId, newStatus) => moveStory(storyId, newStatus)}
                    />
                ))}
            </div>
        </div>
    );
};

interface BoardColumnComponentProps {
    column: BoardColumn;
    onMoveStory: (storyId: string, newStatus: StoryStatus) => void;
}

const BoardColumnComponent: React.FC<BoardColumnComponentProps> = ({ column, onMoveStory }) => {
    const isOverLimit = column.limit && column.stories.length > column.limit;

    return (
        <div
            className={`board-column ${isOverLimit ? 'over-limit' : ''}`}
            data-status={column.status}
        >
            <div className="board-column__header">
                <span
                    className="board-column__indicator"
                    style={{ backgroundColor: getStatusColor(column.status) }}
                />
                <h3 className="board-column__title">{column.name}</h3>
                <span className="board-column__count">
                    {column.stories.length}
                    {column.limit && ` / ${column.limit}`}
                </span>
            </div>

            <div className="board-column__stories">
                {column.stories.map(story => (
                    <StoryCard
                        key={story.id}
                        story={story}
                        onMove={onMoveStory}
                    />
                ))}
            </div>
        </div>
    );
};

interface StoryCardProps {
    story: Story;
    onMove: (storyId: string, newStatus: StoryStatus) => void;
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onMove }) => {
    const [showActions, setShowActions] = React.useState(false);

    const statusTransitions: Record<StoryStatus, StoryStatus | null> = {
        backlog: 'ready',
        ready: 'in_progress',
        in_progress: 'review',
        review: 'done',
        done: null,
        blocked: 'in_progress',
    };

    const nextStatus = statusTransitions[story.status];

    return (
        <div
            className="story-card"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="story-card__header">
                <span className="story-card__type">
                    {getStoryTypeEmoji(story.type)}
                </span>
                <span className="story-card__id">
                    {formatStoryId(story.id)}
                </span>
                {story.points && (
                    <span className="story-card__points">{story.points}</span>
                )}
            </div>

            <h4 className="story-card__title">{story.title}</h4>

            <div className="story-card__meta">
                <span
                    className="story-card__priority"
                    style={{ color: getPriorityColor(story.priority) }}
                >
                    {story.priority.toUpperCase()}
                </span>
                {story.labels.slice(0, 2).map(label => (
                    <span key={label} className="story-card__label">{label}</span>
                ))}
            </div>

            {story.status === 'blocked' && story.blockedReason && (
                <div className="story-card__blocked">
                    🚫 {story.blockedReason}
                </div>
            )}

            {showActions && nextStatus && (
                <div className="story-card__actions">
                    <button
                        className="story-card__action"
                        onClick={() => onMove(story.id, nextStatus)}
                    >
                        Move to {nextStatus.replace('_', ' ')} →
                    </button>
                </div>
            )}
        </div>
    );
};

export default SprintBoard;
