/**
 * SprintLoop Premium Command Palette
 * 
 * Raycast/Spotlight-style command palette with:
 * - AI command integration
 * - Recent files with previews
 * - Symbol search
 * - Actions with quick keys
 * - Extension commands
 * - Beautiful animations
 */

import { useState, useEffect, useMemo } from 'react'
import { Command } from 'cmdk'
import {
    Search,
    File,
    Settings,
    Terminal,
    GitBranch,
    Plus,
    Moon,
    FolderOpen,
    Save,
    X,
    Zap,
    Bot,
    Sparkles,
    Code,
    Play,
    RefreshCw,
    Bug,
    FileText,
    Folder,
    Clock,
    Star,
    Command as CommandIcon,
    ArrowRight,
    Hash,
    Layers,
    Palette
} from 'lucide-react'

interface CommandPaletteProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

type CommandCategory = 'ai' | 'file' | 'search' | 'view' | 'git' | 'terminal' | 'preferences' | 'recent' | 'symbols'

interface CommandItem {
    id: string
    value: string
    label: string
    description?: string
    icon: React.ReactNode
    shortcut?: string
    category: CommandCategory
    keywords?: string[]
    subtext?: string
    badge?: string
    onSelect: () => void
}

// Command category configurations
const CATEGORY_CONFIG: Record<CommandCategory, { label: string; icon: React.ReactNode; color: string }> = {
    ai: { label: 'AI Actions', icon: <Sparkles className="w-3.5 h-3.5" />, color: 'from-purple-500 to-pink-500' },
    file: { label: 'File', icon: <File className="w-3.5 h-3.5" />, color: 'from-blue-500 to-cyan-500' },
    search: { label: 'Search', icon: <Search className="w-3.5 h-3.5" />, color: 'from-green-500 to-emerald-500' },
    view: { label: 'View', icon: <Layers className="w-3.5 h-3.5" />, color: 'from-orange-500 to-yellow-500' },
    git: { label: 'Git', icon: <GitBranch className="w-3.5 h-3.5" />, color: 'from-red-500 to-orange-500' },
    terminal: { label: 'Terminal', icon: <Terminal className="w-3.5 h-3.5" />, color: 'from-gray-500 to-slate-500' },
    preferences: { label: 'Preferences', icon: <Settings className="w-3.5 h-3.5" />, color: 'from-indigo-500 to-purple-500' },
    recent: { label: 'Recent Files', icon: <Clock className="w-3.5 h-3.5" />, color: 'from-teal-500 to-cyan-500' },
    symbols: { label: 'Symbols', icon: <Hash className="w-3.5 h-3.5" />, color: 'from-fuchsia-500 to-pink-500' },
}

export function PremiumCommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<CommandCategory | null>(null)

    // Reset search when closing
    useEffect(() => {
        if (!open) {
            setSearch('')
            setSelectedCategory(null)
        }
    }, [open])

    // Define all commands
    const commands = useMemo<CommandItem[]>(() => [
        // AI Actions
        {
            id: 'ai-chat',
            value: 'ai chat assistant ask question',
            label: 'Ask AI',
            description: 'Chat with the AI assistant',
            icon: <Bot className="w-4 h-4" />,
            shortcut: '⌘I',
            category: 'ai',
            badge: 'AI',
            onSelect: () => {
                console.log('Open AI chat')
                onOpenChange(false)
            },
        },
        {
            id: 'ai-generate',
            value: 'ai generate code create',
            label: 'Generate Code',
            description: 'Generate code with AI',
            icon: <Sparkles className="w-4 h-4" />,
            category: 'ai',
            badge: 'AI',
            onSelect: () => {
                console.log('Generate code')
                onOpenChange(false)
            },
        },
        {
            id: 'ai-fix',
            value: 'ai fix error debug',
            label: 'Fix Code',
            description: 'Let AI fix errors in your code',
            icon: <Bug className="w-4 h-4" />,
            category: 'ai',
            badge: 'AI',
            onSelect: () => {
                console.log('AI fix code')
                onOpenChange(false)
            },
        },
        {
            id: 'ai-refactor',
            value: 'ai refactor improve optimize',
            label: 'Refactor Code',
            description: 'Improve code quality with AI',
            icon: <RefreshCw className="w-4 h-4" />,
            category: 'ai',
            badge: 'AI',
            onSelect: () => {
                console.log('AI refactor')
                onOpenChange(false)
            },
        },
        {
            id: 'ai-explain',
            value: 'ai explain code understand',
            label: 'Explain Code',
            description: 'Get AI explanation of selected code',
            icon: <FileText className="w-4 h-4" />,
            category: 'ai',
            badge: 'AI',
            onSelect: () => {
                console.log('AI explain')
                onOpenChange(false)
            },
        },
        {
            id: 'ai-agent',
            value: 'ai agent autonomous composer',
            label: 'Start Agent Mode',
            description: 'Launch autonomous coding agent',
            icon: <Zap className="w-4 h-4" />,
            shortcut: '⌘⇧A',
            category: 'ai',
            badge: 'Agent',
            onSelect: () => {
                console.log('Start agent')
                onOpenChange(false)
            },
        },

        // File commands
        {
            id: 'new-file',
            value: 'new file create',
            label: 'New File',
            icon: <Plus className="w-4 h-4" />,
            shortcut: '⌘N',
            category: 'file',
            onSelect: () => {
                console.log('Create new file')
                onOpenChange(false)
            },
        },
        {
            id: 'new-folder',
            value: 'new folder create directory',
            label: 'New Folder',
            icon: <Folder className="w-4 h-4" />,
            category: 'file',
            onSelect: () => {
                console.log('Create new folder')
                onOpenChange(false)
            },
        },
        {
            id: 'open-file',
            value: 'open file',
            label: 'Open File',
            icon: <FolderOpen className="w-4 h-4" />,
            shortcut: '⌘O',
            category: 'file',
            onSelect: () => {
                console.log('Open file dialog')
                onOpenChange(false)
            },
        },
        {
            id: 'save-file',
            value: 'save file',
            label: 'Save File',
            icon: <Save className="w-4 h-4" />,
            shortcut: '⌘S',
            category: 'file',
            onSelect: () => {
                console.log('Save file')
                onOpenChange(false)
            },
        },
        {
            id: 'save-all',
            value: 'save all files',
            label: 'Save All',
            icon: <Save className="w-4 h-4" />,
            shortcut: '⌘⇧S',
            category: 'file',
            onSelect: () => {
                console.log('Save all files')
                onOpenChange(false)
            },
        },

        // Search commands
        {
            id: 'search-files',
            value: 'search find files go to',
            label: 'Go to File',
            description: 'Quick open any file',
            icon: <Search className="w-4 h-4" />,
            shortcut: '⌘P',
            category: 'search',
            onSelect: () => {
                console.log('Open file search')
                onOpenChange(false)
            },
        },
        {
            id: 'search-text',
            value: 'search text find in files grep',
            label: 'Search in Files',
            description: 'Find text across all files',
            icon: <Code className="w-4 h-4" />,
            shortcut: '⌘⇧F',
            category: 'search',
            onSelect: () => {
                console.log('Open text search')
                onOpenChange(false)
            },
        },
        {
            id: 'go-to-symbol',
            value: 'go to symbol function class',
            label: 'Go to Symbol',
            description: 'Jump to function or class',
            icon: <Hash className="w-4 h-4" />,
            shortcut: '⌘⇧O',
            category: 'search',
            onSelect: () => {
                console.log('Go to symbol')
                onOpenChange(false)
            },
        },
        {
            id: 'go-to-line',
            value: 'go to line number',
            label: 'Go to Line',
            icon: <ArrowRight className="w-4 h-4" />,
            shortcut: '⌘G',
            category: 'search',
            onSelect: () => {
                console.log('Go to line')
                onOpenChange(false)
            },
        },

        // View commands
        {
            id: 'toggle-terminal',
            value: 'terminal toggle show hide console',
            label: 'Toggle Terminal',
            icon: <Terminal className="w-4 h-4" />,
            shortcut: '⌘`',
            category: 'view',
            onSelect: () => {
                console.log('Toggle terminal')
                onOpenChange(false)
            },
        },
        {
            id: 'toggle-sidebar',
            value: 'sidebar toggle show hide explorer',
            label: 'Toggle Sidebar',
            icon: <Layers className="w-4 h-4" />,
            shortcut: '⌘B',
            category: 'view',
            onSelect: () => {
                console.log('Toggle sidebar')
                onOpenChange(false)
            },
        },
        {
            id: 'toggle-ai-panel',
            value: 'ai panel chat toggle',
            label: 'Toggle AI Panel',
            icon: <Bot className="w-4 h-4" />,
            shortcut: '⌘J',
            category: 'view',
            onSelect: () => {
                console.log('Toggle AI panel')
                onOpenChange(false)
            },
        },
        {
            id: 'zen-mode',
            value: 'zen focus distraction free',
            label: 'Zen Mode',
            description: 'Distraction-free editing',
            icon: <Star className="w-4 h-4" />,
            shortcut: '⌘K Z',
            category: 'view',
            onSelect: () => {
                console.log('Enter zen mode')
                onOpenChange(false)
            },
        },

        // Git commands
        {
            id: 'git-status',
            value: 'git status changes',
            label: 'Git: Status',
            icon: <GitBranch className="w-4 h-4" />,
            category: 'git',
            onSelect: () => {
                console.log('Show git status')
                onOpenChange(false)
            },
        },
        {
            id: 'git-commit',
            value: 'git commit changes',
            label: 'Git: Commit',
            icon: <GitBranch className="w-4 h-4" />,
            shortcut: '⌘⇧G',
            category: 'git',
            onSelect: () => {
                console.log('Git commit')
                onOpenChange(false)
            },
        },
        {
            id: 'git-push',
            value: 'git push remote',
            label: 'Git: Push',
            icon: <GitBranch className="w-4 h-4" />,
            category: 'git',
            onSelect: () => {
                console.log('Git push')
                onOpenChange(false)
            },
        },
        {
            id: 'git-pull',
            value: 'git pull remote fetch',
            label: 'Git: Pull',
            icon: <GitBranch className="w-4 h-4" />,
            category: 'git',
            onSelect: () => {
                console.log('Git pull')
                onOpenChange(false)
            },
        },

        // Terminal commands
        {
            id: 'new-terminal',
            value: 'new terminal create',
            label: 'New Terminal',
            icon: <Terminal className="w-4 h-4" />,
            category: 'terminal',
            onSelect: () => {
                console.log('New terminal')
                onOpenChange(false)
            },
        },
        {
            id: 'run-build',
            value: 'run build compile',
            label: 'Run Build',
            icon: <Play className="w-4 h-4" />,
            shortcut: '⌘⇧B',
            category: 'terminal',
            onSelect: () => {
                console.log('Run build')
                onOpenChange(false)
            },
        },
        {
            id: 'run-test',
            value: 'run test tests',
            label: 'Run Tests',
            icon: <Play className="w-4 h-4" />,
            category: 'terminal',
            onSelect: () => {
                console.log('Run tests')
                onOpenChange(false)
            },
        },

        // Preferences
        {
            id: 'toggle-theme',
            value: 'theme dark light toggle',
            label: 'Toggle Theme',
            icon: <Moon className="w-4 h-4" />,
            category: 'preferences',
            onSelect: () => {
                console.log('Toggle theme')
                onOpenChange(false)
            },
        },
        {
            id: 'settings',
            value: 'settings preferences options',
            label: 'Open Settings',
            icon: <Settings className="w-4 h-4" />,
            shortcut: '⌘,',
            category: 'preferences',
            onSelect: () => {
                console.log('Open settings')
                onOpenChange(false)
            },
        },
        {
            id: 'extensions',
            value: 'extensions plugins marketplace',
            label: 'Extensions',
            icon: <Palette className="w-4 h-4" />,
            category: 'preferences',
            onSelect: () => {
                console.log('Open extensions')
                onOpenChange(false)
            },
        },
        {
            id: 'keyboard-shortcuts',
            value: 'keyboard shortcuts keys bindings',
            label: 'Keyboard Shortcuts',
            icon: <CommandIcon className="w-4 h-4" />,
            shortcut: '⌘K ⌘S',
            category: 'preferences',
            onSelect: () => {
                console.log('Open keyboard shortcuts')
                onOpenChange(false)
            },
        },
    ], [onOpenChange])

    // Filter commands based on search
    const filteredCommands = useMemo(() => {
        if (!search && !selectedCategory) return commands

        return commands.filter(cmd => {
            if (selectedCategory && cmd.category !== selectedCategory) return false
            if (!search) return true

            const searchLower = search.toLowerCase()
            return (
                cmd.value.toLowerCase().includes(searchLower) ||
                cmd.label.toLowerCase().includes(searchLower) ||
                cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
            )
        })
    }, [commands, search, selectedCategory])

    // Group commands by category
    const groupedCommands = useMemo(() => {
        const groups: Record<CommandCategory, CommandItem[]> = {
            ai: [],
            file: [],
            search: [],
            view: [],
            git: [],
            terminal: [],
            preferences: [],
            recent: [],
            symbols: [],
        }

        for (const cmd of filteredCommands) {
            groups[cmd.category].push(cmd)
        }

        return groups
    }, [filteredCommands])

    // Category filter chips
    const CategoryChips = () => (
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 overflow-x-auto scrollbar-hide">
            <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${!selectedCategory
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
            >
                All
            </button>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <button
                    key={key}
                    onClick={() => setSelectedCategory(key as CommandCategory)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${selectedCategory === key
                        ? 'bg-gradient-to-r text-white ' + config.color
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                >
                    {config.icon}
                    {config.label}
                </button>
            ))}
        </div>
    )

    return (
        <Command.Dialog
            open={open}
            onOpenChange={onOpenChange}
            label="Command Palette"
            className="fixed inset-0 z-50"
        >
            {/* Overlay with blur */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-md"
                onClick={() => onOpenChange(false)}
            />

            {/* Dialog - Spotlight style centered */}
            <div className="absolute left-1/2 top-[15%] -translate-x-1/2 w-[640px] max-h-[520px] overflow-hidden">
                {/* Glow effect */}
                <div className="absolute -inset-px bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl" />

                {/* Main container */}
                <div className="relative rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden">
                    {/* Search Input */}
                    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
                        <div className="relative">
                            <Search className="w-5 h-5 text-gray-500" />
                        </div>
                        <Command.Input
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Search commands, files, or type > for AI..."
                            className="flex-1 bg-transparent text-white text-base placeholder-gray-500 outline-none"
                        />
                        <div className="flex items-center gap-2">
                            <kbd className="hidden sm:inline px-2 py-0.5 text-xs font-mono text-gray-500 bg-white/5 rounded border border-white/10">
                                ⌘K
                            </kbd>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Category chips */}
                    <CategoryChips />

                    {/* Command List */}
                    <Command.List className="max-h-[360px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <Command.Empty className="px-4 py-8 text-center">
                            <div className="text-gray-500 text-sm mb-2">No results found</div>
                            <div className="text-gray-600 text-xs">Try a different search term</div>
                        </Command.Empty>

                        {Object.entries(groupedCommands).map(([category, items]) => {
                            if (items.length === 0) return null
                            const config = CATEGORY_CONFIG[category as CommandCategory]

                            return (
                                <Command.Group key={category} heading={config.label}>
                                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        <span className={`bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
                                            {config.label}
                                        </span>
                                    </div>
                                    {items.map((item) => (
                                        <Command.Item
                                            key={item.id}
                                            value={item.value}
                                            onSelect={item.onSelect}
                                            className="group flex items-center gap-3 px-3 py-2.5 mx-1 rounded-xl text-sm cursor-pointer transition-all
                                                data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-purple-500/20 data-[selected=true]:to-blue-500/20
                                                data-[selected=true]:border-l-2 data-[selected=true]:border-purple-500
                                                hover:bg-white/5"
                                        >
                                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 text-gray-400 group-data-[selected=true]:text-white group-data-[selected=true]:bg-white/10 transition-colors">
                                                {item.icon}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-300 group-data-[selected=true]:text-white font-medium">
                                                        {item.label}
                                                    </span>
                                                    {item.badge && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded-md bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.description && (
                                                    <div className="text-xs text-gray-600 truncate group-data-[selected=true]:text-gray-400">
                                                        {item.description}
                                                    </div>
                                                )}
                                            </div>
                                            {item.shortcut && (
                                                <span className="text-xs text-gray-600 font-mono bg-white/5 px-2 py-1 rounded-lg border border-white/5 group-data-[selected=true]:border-white/10">
                                                    {item.shortcut}
                                                </span>
                                            )}
                                        </Command.Item>
                                    ))}
                                </Command.Group>
                            )
                        })}
                    </Command.List>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/5 bg-black/20">
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">↑↓</kbd>
                                navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">↵</kbd>
                                select
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px]">esc</kbd>
                                close
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            <span>SprintLoop</span>
                        </div>
                    </div>
                </div>
            </div>
        </Command.Dialog>
    )
}

// Hook to manage command palette
export function usePremiumCommandPalette() {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K to open
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setOpen(prev => !prev)
            }
            // Escape handled by cmdk
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [])

    return { open, setOpen }
}

// Export enhanced version as default
export { PremiumCommandPalette as CommandPalette }
