import { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import {
    File,
    Settings,
    Search,
    Terminal,
    GitBranch,
    Palette,
    Plus,
    Moon,
    FolderOpen,
    Save,
    X
} from 'lucide-react'

interface CommandPaletteProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface CommandItem {
    id: string
    value: string
    label: string
    icon: React.ReactNode
    shortcut?: string
    group: string
    onSelect: () => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const [search, setSearch] = useState('')

    // Define command items
    const commands: CommandItem[] = [
        {
            id: 'new-file',
            value: 'new file create',
            label: 'New File',
            icon: <Plus className="w-4 h-4" />,
            shortcut: '⌘N',
            group: 'File',
            onSelect: () => {
                console.log('Create new file')
                onOpenChange(false)
            },
        },
        {
            id: 'open-file',
            value: 'open file',
            label: 'Open File',
            icon: <FolderOpen className="w-4 h-4" />,
            shortcut: '⌘O',
            group: 'File',
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
            group: 'File',
            onSelect: () => {
                console.log('Save file')
                onOpenChange(false)
            },
        },
        {
            id: 'search-files',
            value: 'search find files',
            label: 'Search Files',
            icon: <Search className="w-4 h-4" />,
            shortcut: '⌘P',
            group: 'Search',
            onSelect: () => {
                console.log('Open file search')
                onOpenChange(false)
            },
        },
        {
            id: 'search-text',
            value: 'search text find in files',
            label: 'Search in Files',
            icon: <File className="w-4 h-4" />,
            shortcut: '⌘⇧F',
            group: 'Search',
            onSelect: () => {
                console.log('Open text search')
                onOpenChange(false)
            },
        },
        {
            id: 'toggle-terminal',
            value: 'terminal toggle show hide',
            label: 'Toggle Terminal',
            icon: <Terminal className="w-4 h-4" />,
            shortcut: '⌘`',
            group: 'View',
            onSelect: () => {
                console.log('Toggle terminal')
                onOpenChange(false)
            },
        },
        {
            id: 'toggle-sidebar',
            value: 'sidebar toggle show hide',
            label: 'Toggle Sidebar',
            icon: <Palette className="w-4 h-4" />,
            shortcut: '⌘B',
            group: 'View',
            onSelect: () => {
                console.log('Toggle sidebar')
                onOpenChange(false)
            },
        },
        {
            id: 'toggle-theme',
            value: 'theme dark light toggle',
            label: 'Toggle Theme',
            icon: <Moon className="w-4 h-4" />,
            group: 'Preferences',
            onSelect: () => {
                console.log('Toggle theme')
                onOpenChange(false)
            },
        },
        {
            id: 'git-status',
            value: 'git status branch',
            label: 'Git: Show Status',
            icon: <GitBranch className="w-4 h-4" />,
            group: 'Git',
            onSelect: () => {
                console.log('Show git status')
                onOpenChange(false)
            },
        },
        {
            id: 'settings',
            value: 'settings preferences',
            label: 'Open Settings',
            icon: <Settings className="w-4 h-4" />,
            shortcut: '⌘,',
            group: 'Preferences',
            onSelect: () => {
                console.log('Open settings')
                onOpenChange(false)
            },
        },
    ]

    // Group commands
    const groupedCommands = commands.reduce((acc, cmd) => {
        if (!acc[cmd.group]) {
            acc[cmd.group] = []
        }
        acc[cmd.group].push(cmd)
        return acc
    }, {} as Record<string, CommandItem[]>)

    return (
        <Command.Dialog
            open={open}
            onOpenChange={onOpenChange}
            label="Command Palette"
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[560px] max-h-[400px] overflow-hidden rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50"
        >
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={() => onOpenChange(false)}
            />

            {/* Dialog Content */}
            <div className="relative z-50 bg-slate-900/95 rounded-xl border border-white/10">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                    <Search className="w-5 h-5 text-gray-500" />
                    <Command.Input
                        value={search}
                        onValueChange={setSearch}
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent text-white text-sm placeholder-gray-500 outline-none"
                    />
                    <button
                        onClick={() => onOpenChange(false)}
                        className="p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Command List */}
                <Command.List className="max-h-[320px] overflow-y-auto p-2">
                    <Command.Empty className="px-4 py-6 text-center text-gray-500 text-sm">
                        No results found.
                    </Command.Empty>

                    {Object.entries(groupedCommands).map(([group, items]) => (
                        <Command.Group
                            key={group}
                            heading={group}
                            className="mb-2"
                        >
                            <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {group}
                            </div>
                            {items.map((item) => (
                                <Command.Item
                                    key={item.id}
                                    value={item.value}
                                    onSelect={item.onSelect}
                                    className="flex items-center gap-3 px-3 py-2 mx-1 rounded-lg text-sm text-gray-300 cursor-pointer data-[selected=true]:bg-blue-500/20 data-[selected=true]:text-white transition-colors"
                                >
                                    <span className="text-gray-500">{item.icon}</span>
                                    <span className="flex-1">{item.label}</span>
                                    {item.shortcut && (
                                        <span className="text-xs text-gray-600 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                                            {item.shortcut}
                                        </span>
                                    )}
                                </Command.Item>
                            ))}
                        </Command.Group>
                    ))}
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-white/5 text-xs text-gray-600">
                    <div className="flex items-center gap-4">
                        <span>↑↓ to navigate</span>
                        <span>↵ to select</span>
                        <span>esc to close</span>
                    </div>
                    <div>
                        <span className="text-gray-500">SprintLoop</span>
                    </div>
                </div>
            </div>
        </Command.Dialog>
    )
}

/**
 * Hook to manage command palette keyboard shortcut
 */
export function useCommandPalette() {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+K or Ctrl+K to open
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setOpen(prev => !prev)
            }
            // Escape to close
            if (e.key === 'Escape' && open) {
                setOpen(false)
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [open])

    return { open, setOpen }
}
