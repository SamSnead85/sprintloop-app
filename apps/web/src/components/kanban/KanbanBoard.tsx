/**
 * Kanban Board Component
 * 
 * Visual Kanban board inspired by vibe-kanban.
 * Displays tasks in columns with drag-and-drop.
 */

import { useState } from 'react';
import {
    Plus,
    Play,
    Check,
    X,
    Bot,
    GitBranch,
    MessageSquare,
    Server,
    MoreHorizontal,
} from 'lucide-react';
import { useKanbanStore, type KanbanTask, type KanbanColumn } from '../../lib/kanban';
import { executeKanbanTask, suggestAgentForTask, type ExecutionProgress } from '../../lib/kanban/agent-executor';

const COLUMN_CONFIG: { id: KanbanColumn; label: string; color: string }[] = [
    { id: 'backlog', label: 'Backlog', color: '#6b7280' },
    { id: 'todo', label: 'To Do', color: '#3b82f6' },
    { id: 'in_progress', label: 'In Progress', color: '#f59e0b' },
    { id: 'in_review', label: 'In Review', color: '#8b5cf6' },
    { id: 'done', label: 'Done', color: '#10b981' },
];

interface TaskCardProps {
    task: KanbanTask;
    onStart: () => void;
    onMove: (column: KanbanColumn) => void;
    onComplete: () => void;
}

function TaskCard({ task, onStart: _onStart, onMove, onComplete }: TaskCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [progress, setProgress] = useState<ExecutionProgress | null>(null);

    const handleExecute = async () => {
        if (!task.assignedAgent) {
            const suggested = suggestAgentForTask(task);
            useKanbanStore.getState().assignAgent(task.id, suggested);
        }

        try {
            await executeKanbanTask(task.id, setProgress);
        } catch (error) {
            console.error('Task execution failed:', error);
        }
    };

    const priorityColors = {
        low: '#6b7280',
        medium: '#3b82f6',
        high: '#f59e0b',
        critical: '#ef4444',
    };

    return (
        <div
            className="task-card"
            style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '8px',
                cursor: 'pointer',
            }}
            onClick={() => setIsExpanded(!isExpanded)}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div
                    style={{
                        width: '4px',
                        height: '16px',
                        background: priorityColors[task.priority],
                        borderRadius: '2px',
                        flexShrink: 0,
                        marginTop: '2px',
                    }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                        margin: 0,
                        fontSize: '13px',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {task.title}
                    </h4>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); }}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '2px',
                        cursor: 'pointer',
                        opacity: 0.5,
                    }}
                >
                    <MoreHorizontal size={14} />
                </button>
            </div>

            {/* Progress Bar */}
            {task.status === 'running' && (
                <div style={{ marginTop: '8px' }}>
                    <div style={{
                        height: '4px',
                        background: 'var(--border-subtle)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            width: `${progress?.progress || task.progress}%`,
                            height: '100%',
                            background: 'var(--accent-purple)',
                            transition: 'width 0.3s ease',
                        }} />
                    </div>
                    {progress?.status && (
                        <p style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '4px'
                        }}>
                            {progress.status}
                        </p>
                    )}
                </div>
            )}

            {/* Meta Row */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '8px',
                fontSize: '11px',
                color: 'var(--text-muted)',
            }}>
                {task.assignedAgent && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Bot size={12} />
                        {task.assignedAgent}
                    </span>
                )}
                {task.gitBranch && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <GitBranch size={12} />
                        {task.commits.length}
                    </span>
                )}
                {task.reviewComments.length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={12} />
                        {task.reviewComments.length}
                    </span>
                )}
            </div>

            {/* Expanded Actions */}
            {isExpanded && (
                <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    gap: '8px',
                }}>
                    {task.column === 'todo' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleExecute(); }}
                            className="btn-sm btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                background: 'var(--accent-purple)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                            }}
                        >
                            <Play size={12} />
                            Execute
                        </button>
                    )}
                    {task.column === 'in_review' && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onComplete(); }}
                                className="btn-sm btn-success"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                <Check size={12} />
                                Approve
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onMove('in_progress'); }}
                                className="btn-sm"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    background: 'var(--surface-elevated)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                <X size={12} />
                                Request Changes
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

interface KanbanColumnProps {
    config: typeof COLUMN_CONFIG[0];
    tasks: KanbanTask[];
    onAddTask: () => void;
}

function KanbanColumnComponent({ config, tasks, onAddTask }: KanbanColumnProps) {
    const store = useKanbanStore();

    return (
        <div
            className="kanban-column"
            style={{
                flex: 1,
                minWidth: '240px',
                maxWidth: '320px',
                background: 'var(--surface-elevated)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Column Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: config.color,
                        }}
                    />
                    <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>
                        {config.label}
                    </h3>
                    <span style={{
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        background: 'var(--surface-card)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                    }}>
                        {tasks.length}
                    </span>
                </div>
                <button
                    onClick={onAddTask}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        cursor: 'pointer',
                        opacity: 0.5,
                    }}
                >
                    <Plus size={16} />
                </button>
            </div>

            {/* Tasks */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {tasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onStart={() => store.startTask(task.id)}
                        onMove={(col) => store.moveTask(task.id, col)}
                        onComplete={() => store.completeTask(task.id)}
                    />
                ))}
            </div>
        </div>
    );
}

export function KanbanBoard() {
    const store = useKanbanStore();
    const activeBoard = store.getActiveBoard();
    const [showNewTask, setShowNewTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskColumn, setNewTaskColumn] = useState<KanbanColumn>('backlog');

    // Create default board if none exists
    if (!activeBoard && store.boards.length === 0) {
        store.createBoard('Main Board', 'Default project board');
    }

    const handleAddTask = (column: KanbanColumn) => {
        setNewTaskColumn(column);
        setShowNewTask(true);
    };

    const handleCreateTask = () => {
        if (!newTaskTitle.trim() || !activeBoard) return;

        const task = store.createTask(activeBoard.id, {
            title: newTaskTitle,
            column: newTaskColumn,
        });

        // Auto-suggest agent
        const suggested = suggestAgentForTask(task);
        store.assignAgent(task.id, suggested);

        setNewTaskTitle('');
        setShowNewTask(false);
    };

    return (
        <div
            className="kanban-board"
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-primary)',
            }}
        >
            {/* Board Header */}
            <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
                        {activeBoard?.name || 'Kanban Board'}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                        AI-powered task orchestration
                    </p>
                </div>

                {/* Dev Servers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {store.devServers.filter(s => s.status === 'running').map(server => (
                        <a
                            key={server.id}
                            href={server.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                background: '#10b981',
                                color: 'white',
                                borderRadius: '6px',
                                fontSize: '12px',
                                textDecoration: 'none',
                            }}
                        >
                            <Server size={12} />
                            {server.name}
                        </a>
                    ))}
                </div>
            </div>

            {/* Columns */}
            <div style={{
                flex: 1,
                display: 'flex',
                gap: '16px',
                padding: '20px',
                overflowX: 'auto',
            }}>
                {COLUMN_CONFIG.map(config => (
                    <KanbanColumnComponent
                        key={config.id}
                        config={config}
                        tasks={store.getTasksByColumn(config.id)}
                        onAddTask={() => handleAddTask(config.id)}
                    />
                ))}
            </div>

            {/* New Task Modal */}
            {showNewTask && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setShowNewTask(false)}
                >
                    <div
                        style={{
                            background: 'var(--bg-primary)',
                            borderRadius: '12px',
                            padding: '24px',
                            width: '400px',
                            maxWidth: '90vw',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>New Task</h3>
                        <input
                            type="text"
                            placeholder="Task title..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                fontSize: '14px',
                                border: '1px solid var(--border-subtle)',
                                borderRadius: '8px',
                                background: 'var(--surface-elevated)',
                                color: 'var(--text-primary)',
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowNewTask(false)}
                                style={{
                                    padding: '8px 16px',
                                    background: 'var(--surface-elevated)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateTask}
                                style={{
                                    padding: '8px 16px',
                                    background: 'var(--accent-purple)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                }}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KanbanBoard;
