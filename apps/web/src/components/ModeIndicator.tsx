/**
 * Mode Indicator Component
 * Shows current mode (Planning/Execution) with toggle
 */
import { Target, Zap } from 'lucide-react';
import { useProjectStore } from '../stores/project-store';

export function ModeIndicator() {
    const { mode, setMode } = useProjectStore();

    const handleToggle = () => {
        setMode(mode === 'planning' ? 'execution' : 'planning');
    };

    return (
        <button
            onClick={handleToggle}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${mode === 'planning'
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }
                hover:scale-105
            `}
            title={`Current mode: ${mode}. Click to switch.`}
        >
            {mode === 'planning' ? (
                <>
                    <Target className="w-4 h-4" />
                    <span>PLANNING</span>
                </>
            ) : (
                <>
                    <Zap className="w-4 h-4" />
                    <span>EXECUTING</span>
                </>
            )}
        </button>
    );
}

/**
 * Compact mode indicator for status bar
 */
export function ModeIndicatorCompact() {
    const { mode, setMode } = useProjectStore();

    const handleToggle = () => {
        setMode(mode === 'planning' ? 'execution' : 'planning');
    };

    return (
        <button
            onClick={handleToggle}
            className={`
                flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium
                transition-all
                ${mode === 'planning'
                    ? 'bg-purple-500/10 text-purple-400'
                    : 'bg-green-500/10 text-green-400'
                }
                hover:opacity-80
            `}
            title={`Mode: ${mode}`}
        >
            {mode === 'planning' ? (
                <>
                    <Target className="w-3 h-3" />
                    <span>🎯</span>
                </>
            ) : (
                <>
                    <Zap className="w-3 h-3" />
                    <span>⚡</span>
                </>
            )}
        </button>
    );
}

/**
 * Task list panel showing current tasks
 */
export function TaskPanel() {
    const { tasks, toggleTask } = useProjectStore();

    return (
        <div className="h-full flex flex-col">
            <div className="h-10 flex items-center px-3 border-b border-white/5">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Tasks
                </span>
                <div className="flex-1" />
                <ModeIndicatorCompact />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {tasks.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-4">
                        No tasks yet. Start chatting to create a plan.
                    </div>
                ) : (
                    tasks.map(task => (
                        <div
                            key={task.id}
                            className={`
                                flex items-start gap-2 p-2 rounded-lg
                                ${task.inProgress ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-white/[0.02]'}
                                ${task.completed ? 'opacity-50' : ''}
                            `}
                        >
                            <button
                                onClick={() => toggleTask(task.id)}
                                className={`
                                    w-4 h-4 mt-0.5 rounded border flex-shrink-0
                                    flex items-center justify-center
                                    ${task.completed
                                        ? 'bg-green-500/30 border-green-500/50 text-green-400'
                                        : 'border-white/20 hover:border-white/40'
                                    }
                                `}
                            >
                                {task.completed && <span className="text-xs">✓</span>}
                            </button>
                            <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                                {task.text}
                            </span>
                            {task.inProgress && (
                                <span className="ml-auto text-xs text-yellow-400 animate-pulse">
                                    In Progress
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
