/**
 * Activity Bar Component
 * VS Code-style left sidebar with icon navigation
 */
import {
    FolderTree,
    Search,
    GitBranch,
    LayoutGrid,
    Monitor,
    Settings
} from 'lucide-react';

export type ActivityPanel = 'files' | 'search' | 'git' | 'kanban' | 'preview' | 'settings';

interface ActivityBarProps {
    activePanel: ActivityPanel;
    onPanelChange: (panel: ActivityPanel) => void;
    className?: string;
}

const ACTIVITY_ITEMS: Array<{
    id: ActivityPanel;
    icon: React.ElementType;
    label: string;
    shortcut?: string;
}> = [
        { id: 'files', icon: FolderTree, label: 'Explorer', shortcut: '⌘⇧E' },
        { id: 'search', icon: Search, label: 'Search', shortcut: '⌘⇧F' },
        { id: 'git', icon: GitBranch, label: 'Source Control', shortcut: '⌘⇧G' },
        { id: 'kanban', icon: LayoutGrid, label: 'Kanban Board', shortcut: '⌘⇧K' },
        { id: 'preview', icon: Monitor, label: 'Preview', shortcut: '⌘⇧P' },
    ];

export function ActivityBar({ activePanel, onPanelChange, className = '' }: ActivityBarProps) {
    return (
        <div className={`w-12 bg-slate-950 border-r border-white/5 flex flex-col ${className}`}>
            {/* Top icons */}
            <div className="flex-1 flex flex-col items-center py-2 gap-1">
                {ACTIVITY_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePanel === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onPanelChange(item.id)}
                            className={`
                                relative w-10 h-10 flex items-center justify-center rounded-lg
                                transition-all duration-150
                                ${isActive
                                    ? 'text-white bg-white/10'
                                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                                }
                            `}
                            title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ''}`}
                        >
                            {/* Active indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-500 rounded-r" />
                            )}
                            <Icon className="w-5 h-5" />
                        </button>
                    );
                })}
            </div>

            {/* Bottom icons */}
            <div className="flex flex-col items-center py-2 border-t border-white/5">
                <button
                    onClick={() => onPanelChange('settings')}
                    className={`
                        w-10 h-10 flex items-center justify-center rounded-lg
                        transition-all duration-150
                        ${activePanel === 'settings'
                            ? 'text-white bg-white/10'
                            : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        }
                    `}
                    title="Settings (⌘,)"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
