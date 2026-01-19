/**
 * Prompt Panel Component
 * Antigravity-style bottom-docked prompt input with status indicators
 */
import { useState, useRef, useEffect } from 'react';
import {
    Send,
    Loader2,
    Brain,
    FileEdit,
    Terminal,
    Eye,
    Sparkles,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { useProjectStore } from '../stores/project-store';

export type AgentStatus =
    | 'idle'
    | 'thinking'
    | 'reading'
    | 'writing'
    | 'running'
    | 'building'
    | 'preview';

interface PromptPanelProps {
    onSubmit: (prompt: string) => void;
    status?: AgentStatus;
    statusMessage?: string;
    model?: string;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

const STATUS_CONFIG: Record<AgentStatus, { icon: React.ElementType; label: string; color: string }> = {
    idle: { icon: Sparkles, label: 'Ready', color: 'text-gray-400' },
    thinking: { icon: Brain, label: 'Thinking', color: 'text-purple-400' },
    reading: { icon: FileEdit, label: 'Reading files', color: 'text-blue-400' },
    writing: { icon: FileEdit, label: 'Writing code', color: 'text-green-400' },
    running: { icon: Terminal, label: 'Running', color: 'text-amber-400' },
    building: { icon: Loader2, label: 'Building', color: 'text-orange-400' },
    preview: { icon: Eye, label: 'Launching preview', color: 'text-cyan-400' },
};

export function PromptPanel({
    onSubmit,
    status = 'idle',
    statusMessage,
    model = 'Claude 4.5 Sonnet',
    isExpanded = false,
    onToggleExpand
}: PromptPanelProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { mode, tasks } = useProjectStore();

    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTasks = tasks.length;

    const handleSubmit = () => {
        if (input.trim() && status === 'idle') {
            onSubmit(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const StatusIcon = STATUS_CONFIG[status].icon;
    const isProcessing = status !== 'idle';

    return (
        <div className="bg-slate-900 border-t border-white/5">
            {/* Expand/Collapse Handle */}
            {onToggleExpand && (
                <button
                    onClick={onToggleExpand}
                    className="w-full flex items-center justify-center py-1 hover:bg-white/5 transition-colors"
                >
                    {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    ) : (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                    )}
                </button>
            )}

            {/* Status Bar (when processing) */}
            {isProcessing && (
                <div className="px-4 py-2 flex items-center gap-2 border-b border-white/5 bg-slate-950/50">
                    <StatusIcon className={`w-4 h-4 ${STATUS_CONFIG[status].color} ${status === 'building' || status === 'thinking' ? 'animate-spin' : 'animate-pulse'}`} />
                    <span className={`text-sm ${STATUS_CONFIG[status].color}`}>
                        {statusMessage || STATUS_CONFIG[status].label}
                    </span>
                </div>
            )}

            {/* Input Area */}
            <div className="p-3">
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="What would you like to build?"
                        disabled={isProcessing}
                        rows={1}
                        className="w-full px-4 py-3 pr-12 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 resize-none disabled:opacity-50 transition-all"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={!input.trim() || isProcessing}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                    >
                        {isProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </div>

                {/* Indicators */}
                <div className="flex items-center gap-4 mt-2 px-1">
                    {/* Model */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span>{model}</span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-3 bg-white/10" />

                    {/* Phase */}
                    <div className="flex items-center gap-1.5 text-xs">
                        {mode === 'planning' ? (
                            <>
                                <span className="text-purple-400">🎯</span>
                                <span className="text-gray-400">Planning</span>
                            </>
                        ) : (
                            <>
                                <span className="text-green-400">⚡</span>
                                <span className="text-gray-400">Executing</span>
                            </>
                        )}
                    </div>

                    {/* Divider */}
                    {totalTasks > 0 && <div className="w-px h-3 bg-white/10" />}

                    {/* Tasks */}
                    {totalTasks > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span>📋</span>
                            <span>{completedTasks}/{totalTasks} tasks</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
