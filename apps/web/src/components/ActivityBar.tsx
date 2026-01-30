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
    Settings,
    Bug,
    Puzzle,
    Sparkles
} from 'lucide-react';

export type ActivityPanel = 'files' | 'search' | 'git' | 'kanban' | 'preview' | 'debug' | 'extensions' | 'ai' | 'settings';

interface ActivityBarProps {
    activePanel: ActivityPanel;
    onPanelChange: (panel: ActivityPanel) => void;
    badges?: Partial<Record<ActivityPanel, number>>;
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
        { id: 'debug', icon: Bug, label: 'Run and Debug', shortcut: '⌘⇧D' },
        { id: 'extensions', icon: Puzzle, label: 'Extensions', shortcut: '⌘⇧X' },
        { id: 'ai', icon: Sparkles, label: 'AI Assistant', shortcut: '⌘⇧I' },
        { id: 'kanban', icon: LayoutGrid, label: 'Kanban Board', shortcut: '⌘⇧K' },
        { id: 'preview', icon: Monitor, label: 'Preview', shortcut: '⌘⇧P' },
    ];

export function ActivityBar({ activePanel, onPanelChange, badges = {}, className = '' }: ActivityBarProps) {
    return (
        <div className={`w-12 bg-slate-950 border-r border-white/5 flex flex-col ${className}`}>
            {/* Top icons */}
            <div className="flex-1 flex flex-col items-center py-2 gap-1">
                {ACTIVITY_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePanel === item.id;
                    const badge = badges[item.id];
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
                            {/* Badge */}
                            {typeof badge === 'number' && badge > 0 && (
                                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 text-[10px] font-medium bg-indigo-500 text-white rounded-full flex items-center justify-center">
                                    {badge > 99 ? '99+' : badge}
                                </span>
                            )}
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
