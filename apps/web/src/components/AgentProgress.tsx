/**
 * ThinkingIndicator Component
 * Displays AI thinking/reasoning status with visual feedback
 * Inspired by Claude's thinking mode and Cursor's progress indicators
 */
import { useState, useEffect } from 'react'
import { Brain, Loader2, Check, ChevronDown, ChevronUp } from 'lucide-react'

type ThinkingPhase = 'analyzing' | 'planning' | 'generating' | 'reviewing' | 'complete'

interface ThinkingStep {
    id: string
    phase: ThinkingPhase
    description: string
    duration?: number
    complete: boolean
}

interface ThinkingIndicatorProps {
    isActive: boolean
    currentPhase?: ThinkingPhase
    steps?: ThinkingStep[]
    showDetails?: boolean
    compact?: boolean
}

const PHASE_CONFIG: Record<ThinkingPhase, { label: string; icon: string; color: string }> = {
    analyzing: { label: 'Analyzing context', icon: '🔍', color: 'text-blue-400' },
    planning: { label: 'Planning approach', icon: '📋', color: 'text-purple-400' },
    generating: { label: 'Writing code', icon: '⚡', color: 'text-yellow-400' },
    reviewing: { label: 'Reviewing changes', icon: '🔎', color: 'text-green-400' },
    complete: { label: 'Complete', icon: '✓', color: 'text-green-400' },
}

export function ThinkingIndicator({
    isActive,
    currentPhase = 'analyzing',
    steps = [],
    showDetails = false,
    compact = false
}: ThinkingIndicatorProps) {
    const [expanded, setExpanded] = useState(showDetails)
    const [elapsed, setElapsed] = useState(0)

    // Elapsed time counter
    useEffect(() => {
        if (!isActive) {
            setElapsed(0)
            return
        }

        const interval = setInterval(() => {
            setElapsed(e => e + 1)
        }, 1000)

        return () => clearInterval(interval)
    }, [isActive])

    if (!isActive && steps.length === 0) return null

    const phaseConfig = PHASE_CONFIG[currentPhase]

    if (compact) {
        return (
            <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                <span>{phaseConfig.label}</span>
                <span className="text-gray-600">{formatDuration(elapsed)}</span>
            </div>
        )
    }

    return (
        <div className="border border-white/10 rounded-lg bg-slate-900/50 overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between px-3 py-2 bg-slate-800/50 cursor-pointer hover:bg-slate-800/70 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-2">
                    {isActive ? (
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    ) : (
                        <Check className="w-4 h-4 text-green-400" />
                    )}
                    <span className="text-sm font-medium text-white">
                        {isActive ? 'AI is working...' : 'Complete'}
                    </span>
                    <span className={`text-xs ${phaseConfig.color}`}>
                        {phaseConfig.icon} {phaseConfig.label}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{formatDuration(elapsed)}</span>
                    {steps.length > 0 && (
                        expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                </div>
            </div>

            {/* Expanded details */}
            {expanded && steps.length > 0 && (
                <div className="px-3 py-2 space-y-1.5 border-t border-white/5">
                    {steps.map((step, idx) => (
                        <div
                            key={step.id}
                            className={`flex items-center gap-2 text-xs ${step.complete ? 'text-gray-500' : 'text-gray-300'
                                }`}
                        >
                            <span className="w-5 text-center">
                                {step.complete ? (
                                    <Check className="w-3 h-3 text-green-400" />
                                ) : idx === steps.filter(s => !s.complete).length - 1 ? (
                                    <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                                ) : (
                                    <span className="text-gray-600">○</span>
                                )}
                            </span>
                            <span className="flex-1">{step.description}</span>
                            {step.duration && (
                                <span className="text-gray-600">{formatDuration(step.duration)}</span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Progress bar */}
            {isActive && (
                <div className="h-0.5 bg-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse"
                        style={{
                            width: `${getPhaseProgress(currentPhase)}%`,
                            transition: 'width 0.5s ease-out'
                        }}
                    />
                </div>
            )}
        </div>
    )
}

function formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
}

function getPhaseProgress(phase: ThinkingPhase): number {
    const phases: ThinkingPhase[] = ['analyzing', 'planning', 'generating', 'reviewing', 'complete']
    const idx = phases.indexOf(phase)
    return ((idx + 1) / phases.length) * 100
}

/**
 * Agent Progress Panel
 * Shows multi-step task progress with visual breakdown
 */
interface AgentTask {
    id: string
    title: string
    status: 'pending' | 'running' | 'complete' | 'failed'
    subtasks?: AgentTask[]
}

interface AgentProgressProps {
    task: AgentTask
    onPause?: () => void
    onResume?: () => void
    onCancel?: () => void
    isPaused?: boolean
}

export function AgentProgress({
    task,
    onPause,
    onResume,
    onCancel,
    isPaused = false
}: AgentProgressProps) {
    const completedCount = countTasks(task, 'complete')
    const totalCount = countTasks(task)
    const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

    return (
        <div className="border border-white/10 rounded-lg bg-slate-900/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-white">{task.title}</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                        {completedCount}/{totalCount} steps
                    </span>

                    {onPause && onResume && (
                        <button
                            onClick={isPaused ? onResume : onPause}
                            className="text-xs px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            {isPaused ? 'Resume' : 'Pause'}
                        </button>
                    )}

                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="text-xs px-2 py-0.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-slate-800">
                <div
                    className={`h-full transition-all duration-300 ${task.status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                        }`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
                <div className="px-3 py-2 space-y-1 max-h-40 overflow-y-auto">
                    {task.subtasks.map(subtask => (
                        <TaskItem key={subtask.id} task={subtask} />
                    ))}
                </div>
            )}
        </div>
    )
}

function TaskItem({ task, depth = 0 }: { task: AgentTask; depth?: number }) {
    const statusIcon = {
        pending: <span className="text-gray-600">○</span>,
        running: <Loader2 className="w-3 h-3 animate-spin text-purple-400" />,
        complete: <Check className="w-3 h-3 text-green-400" />,
        failed: <span className="text-red-400">✕</span>,
    }

    return (
        <div style={{ paddingLeft: depth * 16 }}>
            <div className={`flex items-center gap-2 text-xs ${task.status === 'complete' ? 'text-gray-500' : 'text-gray-300'
                }`}>
                <span className="w-4 flex justify-center">{statusIcon[task.status]}</span>
                <span className="flex-1">{task.title}</span>
            </div>
            {task.subtasks?.map(sub => (
                <TaskItem key={sub.id} task={sub} depth={depth + 1} />
            ))}
        </div>
    )
}

function countTasks(task: AgentTask, status?: AgentTask['status']): number {
    let count = status ? (task.status === status ? 1 : 0) : 1
    if (task.subtasks) {
        for (const sub of task.subtasks) {
            count += countTasks(sub, status)
        }
    }
    return count
}
