/**
 * Status Bar Component
 * VSCode-style status bar at the bottom of the IDE
 */
import { GitBranch, Check, AlertCircle } from 'lucide-react';

interface StatusBarProps {
    lineNumber?: number;
    columnNumber?: number;
    language?: string;
    encoding?: string;
    gitBranch?: string;
    aiModel?: string;
    aiStatus?: 'idle' | 'streaming' | 'error';
}

export function StatusBar({
    lineNumber = 1,
    columnNumber = 1,
    language = 'TypeScript',
    encoding = 'UTF-8',
    gitBranch = 'main',
    aiModel = 'Claude 4',
    aiStatus = 'idle',
}: StatusBarProps) {
    return (
        <div className="h-6 bg-[#007acc] flex items-center justify-between px-2 text-white text-xs select-none">
            {/* Left side */}
            <div className="flex items-center gap-3">
                {/* Git branch */}
                <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>{gitBranch}</span>
                </div>

                {/* Sync indicator */}
                <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
                    <Check className="w-3.5 h-3.5" />
                </div>

                {/* Problems */}
                <div className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>0</span>
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Line/Column */}
                <div className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
                    Ln {lineNumber}, Col {columnNumber}
                </div>

                {/* Spaces */}
                <div className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
                    Spaces: 2
                </div>

                {/* Encoding */}
                <div className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
                    {encoding}
                </div>

                {/* Language */}
                <div className="hover:bg-white/10 px-1.5 py-0.5 rounded cursor-pointer">
                    {language}
                </div>

                {/* AI Model indicator */}
                <div className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded">
                    <div className={`w-2 h-2 rounded-full ${aiStatus === 'streaming' ? 'bg-yellow-400 animate-pulse' :
                        aiStatus === 'error' ? 'bg-red-400' :
                            'bg-green-400'
                        }`} />
                    <span>{aiModel}</span>
                </div>
            </div>
        </div>
    );
}
