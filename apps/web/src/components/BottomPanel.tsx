/**
 * Bottom Panel Component
 * Tabbed panel for Terminal, Kanban, Output
 */
import { useState } from 'react';
import {
    Terminal,
    LayoutGrid,
    FileText,
    X,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { KanbanBoard } from './KanbanBoard';

type BottomTab = 'terminal' | 'kanban' | 'output';

interface BottomPanelProps {
    isVisible: boolean;
    onClose: () => void;
    defaultTab?: BottomTab;
}

const TABS: Array<{ id: BottomTab; icon: React.ElementType; label: string }> = [
    { id: 'terminal', icon: Terminal, label: 'Terminal' },
    { id: 'kanban', icon: LayoutGrid, label: 'Kanban' },
    { id: 'output', icon: FileText, label: 'Output' },
];

export function BottomPanel({ isVisible, onClose, defaultTab = 'terminal' }: BottomPanelProps) {
    const [activeTab, setActiveTab] = useState<BottomTab>(defaultTab);
    const [isMaximized, setIsMaximized] = useState(false);

    if (!isVisible) return null;

    return (
        <div className={`flex flex-col bg-slate-900 border-t border-white/5 ${isMaximized ? 'h-[60%]' : 'h-64'}`}>
            {/* Tab Bar */}
            <div className="h-9 flex items-center px-2 border-b border-white/5 bg-slate-950/50">
                {/* Tabs */}
                <div className="flex items-center gap-1">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded
                                    transition-colors
                                    ${isActive
                                        ? 'text-white bg-white/10'
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                    }
                                `}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Actions */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setIsMaximized(!isMaximized)}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                        title={isMaximized ? 'Restore' : 'Maximize'}
                    >
                        {isMaximized ? (
                            <Minimize2 className="w-3.5 h-3.5" />
                        ) : (
                            <Maximize2 className="w-3.5 h-3.5" />
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                        title="Close"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'terminal' && (
                    <div className="h-full p-3 font-mono text-sm text-gray-300 overflow-auto">
                        <div className="flex items-center gap-2 text-green-400">
                            <span>$</span>
                            <span className="text-gray-400">Ready for commands...</span>
                        </div>
                    </div>
                )}

                {activeTab === 'kanban' && (
                    <div className="h-full overflow-auto">
                        <KanbanBoard />
                    </div>
                )}

                {activeTab === 'output' && (
                    <div className="h-full p-3 font-mono text-sm text-gray-500 overflow-auto">
                        <div>Build output will appear here...</div>
                    </div>
                )}
            </div>
        </div>
    );
}
